import time
from typing import Optional, Tuple
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.config import settings
from backend.core.database import get_db
from backend.core.deps import get_gateway_auth
from backend.core.redis import redis_manager
from backend.core.exceptions import RateLimitExceededException, IndunixGatewayException, AxionGatewayException
from backend.models.user import User
from backend.models.api_key import ApiKey
from backend.schemas.gateway import (
    ChatCompletionRequest,
    ModelListResponse,
    ModelDescriptor
)
from backend.services.proxy_engine import proxy_engine
from backend.services.token_meter import TokenMeter

router = APIRouter(prefix="/v1", tags=["OpenAI Compatible Gateway"])

@router.get("/models", response_model=ModelListResponse)
async def list_models():
    """Lists available Indunix AI sovereign models (OpenAI compatible)."""
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

@router.get("/models/{model_id}", response_model=ModelDescriptor)
async def get_model(model_id: str):
    """Retrieves metadata for a specific Indunix model."""
    meta = settings.RATE_CARD_NGN.get(model_id)
    if not meta:
        raise IndunixGatewayException(f"The model '{model_id}' does not exist", status_code=404, error_type="invalid_request_error")
    return ModelDescriptor(
        id=model_id,
        root=model_id,
        description=meta["description"],
        pricing_ngn_per_m=meta["completion_per_million"],
        context_window=meta["context_window"]
    )

@router.post("/chat/completions")
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
        # Default fallback to flagship core
        model = "axion-1-core"

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
