import json
import time
import uuid
from typing import Optional, Tuple, Any, List
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.config import settings
from backend.core.database import get_db
from backend.core.deps import get_gateway_auth
from backend.core.redis import redis_manager
from backend.core.exceptions import RateLimitExceededException, IndunixGatewayException
from backend.models.user import User
from backend.models.api_key import ApiKey
from backend.schemas.gateway import (
    ChatMessage,
    ChatCompletionRequest,
    ModelListResponse,
    ModelDescriptor,
    AnthropicMessagesRequest
)
from backend.services.proxy_engine import proxy_engine
from backend.services.token_meter import TokenMeter

router = APIRouter(prefix="/v1", tags=["OpenAI & Anthropic Compatible Gateway"])
root_gateway_router = APIRouter(tags=["Gateway Root & Alias Endpoints"])


def extract_anthropic_text(content: Any) -> str:
    """Extracts plain text from string or structured Anthropic content blocks."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                if block.get("type") == "text" and "text" in block:
                    parts.append(str(block["text"]))
                elif "text" in block:
                    parts.append(str(block["text"]))
            elif hasattr(block, "text") and block.text:
                parts.append(str(block.text))
        return " ".join(parts)
    return str(content or "")


def get_model_descriptor(model_id: str) -> ModelDescriptor:
    meta = settings.RATE_CARD_NGN.get(model_id)
    if not meta:
        m_lower = model_id.lower()
        if "claude" in m_lower:
            # Dynamic descriptor for any Claude model alias
            pricing = 1800.0
            if "haiku" in m_lower or "spark" in m_lower:
                pricing = 1200.0
            elif "opus" in m_lower or "reason" in m_lower:
                pricing = 3200.0
            return ModelDescriptor(
                id=model_id,
                root=model_id,
                description=f"Anthropic Claude compatible model alias ({model_id}) on Indunix Sovereign Gateway",
                pricing_ngn_per_m=pricing,
                context_window=200000
            )
        raise IndunixGatewayException(f"The model '{model_id}' does not exist", status_code=404, error_type="invalid_request_error")
    return ModelDescriptor(
        id=model_id,
        root=model_id,
        description=meta["description"],
        pricing_ngn_per_m=meta["completion_per_million"],
        context_window=meta["context_window"]
    )


def build_models_list() -> ModelListResponse:
    models = []
    for model_id, meta in settings.RATE_CARD_NGN.items():
        models.append(
            ModelDescriptor(
                id=model_id,
                root=model_id,
                description=meta["description"],
                pricing_ngn_per_m=meta["completion_per_million"],
                context_window=meta["context_window"]
            )
        )
    return ModelListResponse(data=models)


@router.get("/models", response_model=ModelListResponse)
@root_gateway_router.get("/models", response_model=ModelListResponse)
async def list_models():
    """Lists available Indunix AI sovereign models (OpenAI and Anthropic compatible)."""
    return build_models_list()


@router.get("/models/{model_id}", response_model=ModelDescriptor)
@root_gateway_router.get("/models/{model_id}", response_model=ModelDescriptor)
async def get_model(model_id: str):
    """Retrieves metadata for a specific model (including Claude model aliases)."""
    return get_model_descriptor(model_id)


@router.post("/chat/completions")
@root_gateway_router.post("/chat/completions")
async def chat_completions(
    payload: ChatCompletionRequest,
    raw_request: Request,
    auth_data: Tuple[User, Optional[ApiKey]] = Depends(get_gateway_auth),
    db: AsyncSession = Depends(get_db)
):
    """
    High-Speed OpenAI-compatible chat completion gateway.
    Handles auth, rate limiting, pre-flight wallet check, streaming SSE passthrough, and token metering.
    """
    user, api_key = auth_data
    start_time = time.time()

    # 1. Rate Limiting Check (Token Bucket)
    rate_limit_id = api_key.id if api_key else user.id
    is_allowed = await redis_manager.check_rate_limit(rate_limit_id, limit=120, window_seconds=60)
    if not is_allowed:
        raise RateLimitExceededException()

    # 2. Pre-flight Balance & Spend Ceiling Check
    await TokenMeter.preflight_balance_check(db, user_id=user.id, api_key=api_key)

    model = payload.model
    if model not in settings.RATE_CARD_NGN:
        m_lower = model.lower()
        if "haiku" in m_lower or "spark" in m_lower:
            model = "indunix-1-spark"
        elif "opus" in m_lower or "reason" in m_lower:
            model = "indunix-1-reason"
        else:
            model = "indunix-1-core"

    # Compute prompt tokens
    prompt_text = " ".join([str(m.content or "") for m in payload.messages])
    prompt_tokens = TokenMeter.estimate_tokens(prompt_text)

    # 3. Streaming Mode
    if payload.stream:
        async def event_generator():
            completion_chars = 0
            generator = proxy_engine.execute_streaming(payload, model)
            try:
                async for chunk in generator:
                    if chunk.startswith("data: ") and not chunk.startswith("data: [DONE]"):
                        raw = chunk[6:].strip()
                        # Extract character length for token estimation
                        completion_chars += len(raw)
                    yield chunk
            finally:
                # Calculate latency and completion tokens
                latency_ms = int((time.time() - start_time) * 1000)
                completion_tokens = max(1, completion_chars // 14)
                # Background atomic ledger deduction
                try:
                    await TokenMeter.deduct_and_log(
                        db=db,
                        user_id=user.id,
                        api_key_id=api_key.id if api_key else None,
                        model=model,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        latency_ms=latency_ms,
                        is_stream=True,
                        status_code=200,
                        ip_hash=raw_request.client.host if raw_request.client else None
                    )
                except Exception:
                    pass

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    # 4. Non-Streaming Mode
    response_data = await proxy_engine.execute_non_streaming(payload, model)
    latency_ms = int((time.time() - start_time) * 1000)

    # Calculate actual completion tokens from response
    completion_tokens = response_data.get("usage", {}).get("completion_tokens", 10)
    
    # Atomic ledger deduction and usage logging
    cost_deducted, _ = await TokenMeter.deduct_and_log(
        db=db,
        user_id=user.id,
        api_key_id=api_key.id if api_key else None,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        latency_ms=latency_ms,
        is_stream=False,
        status_code=200,
        ip_hash=raw_request.client.host if raw_request.client else None
    )

    return response_data


# Anthropic Messages Protocol Processor
async def process_anthropic_messages(
    payload: AnthropicMessagesRequest,
    raw_request: Request,
    auth_data: Tuple[User, Optional[ApiKey]],
    db: AsyncSession
):
    """
    Core implementation of the Anthropic Claude Messages API specification.
    Supports non-streaming and streaming responses for Claude Code, Claude Desktop, and Anthropic SDKs.
    """
    user, api_key = auth_data
    start_time = time.time()

    # 1. Rate Limiting Check
    rate_limit_id = api_key.id if api_key else user.id
    is_allowed = await redis_manager.check_rate_limit(rate_limit_id, limit=120, window_seconds=60)
    if not is_allowed:
        raise RateLimitExceededException()

    # 2. Pre-flight Balance & Spend Ceiling Check
    await TokenMeter.preflight_balance_check(db, user_id=user.id, api_key=api_key)

    req_model = payload.model
    m_lower = req_model.lower()
    if "haiku" in m_lower or "spark" in m_lower:
        internal_model = "indunix-1-spark"
    elif "opus" in m_lower or "reason" in m_lower:
        internal_model = "indunix-1-reason"
    else:
        internal_model = "indunix-1-core"

    # Convert Anthropic messages into standard ChatMessage list
    converted_messages: List[ChatMessage] = []
    if payload.system:
        system_text = extract_anthropic_text(payload.system)
        if system_text:
            converted_messages.append(ChatMessage(role="system", content=system_text))

    for m in payload.messages:
        text_content = extract_anthropic_text(m.content)
        converted_messages.append(ChatMessage(role=m.role, content=text_content))

    prompt_tokens = TokenMeter.estimate_tokens(" ".join([str(m.content or "") for m in converted_messages]))

    internal_request = ChatCompletionRequest(
        model=internal_model,
        messages=converted_messages,
        temperature=payload.temperature or 0.7,
        top_p=payload.top_p or 1.0,
        stream=payload.stream or False,
        max_tokens=payload.max_tokens or 4096
    )

    msg_id = f"msg_{uuid.uuid4().hex[:24]}"

    # Streaming Mode (Anthropic SSE)
    if payload.stream:
        async def anthropic_event_generator():
            completion_chars = 0
            # 1. message_start
            start_event = {
                "type": "message_start",
                "message": {
                    "id": msg_id,
                    "type": "message",
                    "role": "assistant",
                    "model": req_model,
                    "content": [],
                    "stop_reason": None,
                    "stop_sequence": None,
                    "usage": {
                        "input_tokens": prompt_tokens,
                        "output_tokens": 1
                    }
                }
            }
            yield f"event: message_start\ndata: {json.dumps(start_event)}\n\n"

            # 2. content_block_start
            yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': 0, 'content_block': {'type': 'text', 'text': ''}})}\n\n"

            # 3. Stream content deltas
            generator = proxy_engine.execute_streaming(internal_request, internal_model)
            try:
                async for chunk in generator:
                    if chunk.startswith("data: ") and not chunk.startswith("data: [DONE]"):
                        raw = chunk[6:].strip()
                        try:
                            chunk_obj = json.loads(raw)
                            choices = chunk_obj.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                text_delta = delta.get("content", "")
                                if text_delta:
                                    completion_chars += len(text_delta)
                                    delta_event = {
                                        "type": "content_block_delta",
                                        "index": 0,
                                        "delta": {
                                            "type": "text_delta",
                                            "text": text_delta
                                        }
                                    }
                                    yield f"event: content_block_delta\ndata: {json.dumps(delta_event)}\n\n"
                        except Exception:
                            pass
            finally:
                # 4. content_block_stop
                yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': 0})}\n\n"

                # 5. message_delta
                latency_ms = int((time.time() - start_time) * 1000)
                completion_tokens = max(1, completion_chars // 14)
                message_delta_event = {
                    "type": "message_delta",
                    "delta": {
                        "stop_reason": "end_turn",
                        "stop_sequence": None
                    },
                    "usage": {
                        "output_tokens": completion_tokens
                    }
                }
                yield f"event: message_delta\ndata: {json.dumps(message_delta_event)}\n\n"

                # 6. message_stop
                yield f"event: message_stop\ndata: {json.dumps({'type': 'message_stop'})}\n\n"

                # Background atomic ledger deduction
                try:
                    await TokenMeter.deduct_and_log(
                        db=db,
                        user_id=user.id,
                        api_key_id=api_key.id if api_key else None,
                        model=req_model,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        latency_ms=latency_ms,
                        is_stream=True,
                        status_code=200,
                        ip_hash=raw_request.client.host if raw_request.client else None
                    )
                except Exception:
                    pass

        return StreamingResponse(
            anthropic_event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                "anthropic-version": "2023-06-01"
            }
        )

    # Non-Streaming Mode
    response_data = await proxy_engine.execute_non_streaming(internal_request, internal_model)
    latency_ms = int((time.time() - start_time) * 1000)

    # Extract text from choices
    reply_text = ""
    choices = response_data.get("choices", [])
    if choices:
        reply_text = choices[0].get("message", {}).get("content", "")

    completion_tokens = response_data.get("usage", {}).get("completion_tokens", max(1, len(reply_text) // 4))

    # Atomic ledger deduction and usage logging
    await TokenMeter.deduct_and_log(
        db=db,
        user_id=user.id,
        api_key_id=api_key.id if api_key else None,
        model=req_model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        latency_ms=latency_ms,
        is_stream=False,
        status_code=200,
        ip_hash=raw_request.client.host if raw_request.client else None
    )

    return {
        "id": msg_id,
        "type": "message",
        "role": "assistant",
        "model": req_model,
        "content": [
            {
                "type": "text",
                "text": reply_text
            }
        ],
        "stop_reason": "end_turn",
        "stop_sequence": None,
        "usage": {
            "input_tokens": prompt_tokens,
            "output_tokens": completion_tokens
        }
    }


# Endpoints for Anthropic Messages:
# Handles /v1/messages, /v1/chat/completions/v1/messages, /v1/chat/completions/messages, and non-prefixed aliases
@router.post("/messages")
@router.post("/chat/completions/v1/messages")
@router.post("/chat/completions/messages")
@root_gateway_router.post("/messages")
@root_gateway_router.post("/v1/messages")
@root_gateway_router.post("/v1/chat/completions/v1/messages")
@root_gateway_router.post("/v1/chat/completions/messages")
@root_gateway_router.post("/chat/completions/v1/messages")
@root_gateway_router.post("/chat/completions/messages")
async def anthropic_messages(
    payload: AnthropicMessagesRequest,
    raw_request: Request,
    auth_data: Tuple[User, Optional[ApiKey]] = Depends(get_gateway_auth),
    db: AsyncSession = Depends(get_db)
):
    """Anthropic Messages API endpoint compatible with Claude Code and Claude Desktop."""
    return await process_anthropic_messages(payload, raw_request, auth_data, db)


# Health / probe check for Anthropic messages endpoints
@router.get("/messages")
@router.get("/chat/completions/v1/messages")
@router.get("/chat/completions/messages")
@root_gateway_router.get("/messages")
@root_gateway_router.get("/v1/messages")
@root_gateway_router.get("/v1/chat/completions/v1/messages")
@root_gateway_router.get("/v1/chat/completions/messages")
@root_gateway_router.get("/chat/completions/v1/messages")
@root_gateway_router.get("/chat/completions/messages")
async def anthropic_messages_probe():
    """Returns gateway status and supported models for Anthropic probe checks."""
    return {
        "status": "operational",
        "service": "indunix-anthropic-gateway",
        "supported_models": [
            "claude-sonnet-5-5",
            "claude-opus-5-5",
            "claude-haiku-5-5",
            "claude-3-5-sonnet-20241022",
            "claude-3-7-sonnet"
        ]
    }
