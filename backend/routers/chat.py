import json
import time
import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from fastapi.responses import StreamingResponse, PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, desc

from backend.core.config import settings
from backend.core.database import get_db
from backend.core.security import create_access_token, decode_access_token
from backend.models.user import User, UserRole
from backend.models.wallet import Wallet
from backend.models.conversation import Conversation, ChatMessage, GuestSession
from backend.schemas.gateway import ChatCompletionRequest, ChatMessage as GatewayMessage
from backend.schemas.chat import (
    GuestSessionResponse,
    ChatLimitsResponse,
    ChatMessageOut,
    ConversationCreate,
    ConversationUpdate,
    ConversationOut,
    ChatStreamRequest,
    MigrateGuestRequest
)
from backend.services.proxy_engine import proxy_engine
from backend.services.token_meter import TokenMeter

router = APIRouter(prefix="/api/chat", tags=["Indunix AI Chat Platform"])

GUEST_MAX_MESSAGES = 10
FREE_DAILY_MESSAGES = 50

def hash_string(val: str) -> str:
    return hashlib.sha256(val.strip().encode("utf-8")).hexdigest()

def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

def is_expired(dt: Optional[datetime]) -> bool:
    if dt is None:
        return True
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        now = now.replace(tzinfo=None)
    return dt < now

def get_client_ip_hash(request: Request) -> str:
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    return hash_string(client_ip)

async def resolve_chat_identity(
    authorization: Optional[str] = Header(None),
    x_guest_token: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Tuple[Optional[User], Optional[GuestSession]]:
    """
    Resolves caller identity from either standard User JWT or Guest Session token.
    """
    token_str = None
    if authorization:
        parts = authorization.strip().split(" ")
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token_str = parts[1].strip()
    elif x_guest_token:
        token_str = x_guest_token.strip()

    if not token_str:
        return None, None

    payload = decode_access_token(token_str)
    if not payload:
        return None, None

    # Check if guest session
    if payload.get("role") == "guest" or payload.get("type") == "guest_session":
        guest_id = payload.get("sub")
        if guest_id:
            res = await db.execute(select(GuestSession).where(GuestSession.id == guest_id))
            guest_session = res.scalar_one_or_none()
            if guest_session and not is_expired(guest_session.expires_at):
                return None, guest_session

    # Check if registered user
    user_id = payload.get("sub")
    if user_id:
        res = await db.execute(select(User).where(User.id == user_id))
        user = res.scalar_one_or_none()
        if user and user.is_active:
            return user, None

    return None, None


@router.post("/guest/session", response_model=GuestSessionResponse)
async def create_or_refresh_guest_session(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Issues or verifies a cryptographically signed guest session.
    Provides immediate zero-setup chat with anti-abuse controls.
    """
    ip_hash = get_client_ip_hash(request)
    now = utcnow()
    expires_at = now + timedelta(days=7)

    # Check for existing guest session header
    existing_token = request.headers.get("x-guest-token")
    if existing_token:
        payload = decode_access_token(existing_token)
        if payload and payload.get("role") == "guest":
            session_id = payload.get("sub")
            res = await db.execute(select(GuestSession).where(GuestSession.id == session_id))
            session = res.scalar_one_or_none()
            if session and not is_expired(session.expires_at):
                session.last_active_at = now
                await db.commit()
                remaining = max(0, session.max_messages - session.messages_sent)
                return GuestSessionResponse(
                    guest_token=existing_token,
                    session_id=session.id,
                    messages_sent=session.messages_sent,
                    max_messages=session.max_messages,
                    remaining_messages=remaining,
                    eligible_models=["indunix-1-spark", "indunix-1-core"],
                    expires_at=session.expires_at.isoformat()
                )

    # Create new guest session
    session_id = str(uuid.uuid4())
    token_bytes = f"{session_id}:{ip_hash}:{time.time()}"
    token_hash = hash_string(token_bytes)

    session = GuestSession(
        id=session_id,
        session_token_hash=token_hash,
        ip_hash=ip_hash,
        messages_sent=0,
        max_messages=GUEST_MAX_MESSAGES,
        created_at=now,
        expires_at=expires_at,
        last_active_at=now
    )
    db.add(session)
    await db.commit()

    jwt_token = create_access_token(
        data={"sub": session_id, "role": "guest", "type": "guest_session"},
        expires_delta=timedelta(days=7)
    )

    return GuestSessionResponse(
        guest_token=jwt_token,
        session_id=session.id,
        messages_sent=0,
        max_messages=GUEST_MAX_MESSAGES,
        remaining_messages=GUEST_MAX_MESSAGES,
        eligible_models=["indunix-1-spark", "indunix-1-core"],
        expires_at=expires_at.isoformat()
    )


@router.get("/limits", response_model=ChatLimitsResponse)
async def get_chat_limits(
    identity: Tuple[Optional[User], Optional[GuestSession]] = Depends(resolve_chat_identity),
    db: AsyncSession = Depends(get_db)
):
    """
    Inspects active plan limits and quotas for current user or guest.
    Powers the Claude/ChatGPT style plan limit switcher and remaining meter.
    """
    user, guest_session = identity

    # Case 1: Authenticated User
    if user:
        wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
        wallet = wallet_res.scalar_one_or_none()
        balance = float(wallet.balance_ngn) if wallet else 0.0
        bonus = float(wallet.bonus_credits_ngn) if wallet else 0.0
        total_avail = balance + bonus

        # Pro determination: has deposited paid balance or is Admin or has Enterprise role
        is_pro = (balance > 100.0) or (user.role in (UserRole.SUPERADMIN, UserRole.ENTERPRISE_ADMIN))

        if is_pro:
            return ChatLimitsResponse(
                tier="pro",
                messages_used=0,
                messages_limit=999999,
                remaining_messages=999999,
                credits_balance_ngn=balance,
                bonus_credits_ngn=bonus,
                total_available_ngn=total_avail,
                allowed_models=["indunix-1-spark", "indunix-1-core", "indunix-1-reason", "indunix-edge-local"],
                can_use_reasoning=True,
                reset_interval="Unlimited with Naira Balance / Pro"
            )
        else:
            # Free tier
            return ChatLimitsResponse(
                tier="free",
                messages_used=0,
                messages_limit=FREE_DAILY_MESSAGES,
                remaining_messages=FREE_DAILY_MESSAGES,
                credits_balance_ngn=balance,
                bonus_credits_ngn=bonus,
                total_available_ngn=total_avail,
                allowed_models=["indunix-1-spark", "indunix-1-core"],
                can_use_reasoning=False,
                reset_interval="Daily (50 Free Prompts / Day)"
            )

    # Case 2: Guest Session
    if guest_session:
        used = guest_session.messages_sent
        max_m = guest_session.max_messages
        remaining = max(0, max_m - used)
        return ChatLimitsResponse(
            tier="guest",
            messages_used=used,
            messages_limit=max_m,
            remaining_messages=remaining,
            credits_balance_ngn=0.0,
            bonus_credits_ngn=0.0,
            total_available_ngn=0.0,
            allowed_models=["indunix-1-spark", "indunix-1-core"],
            can_use_reasoning=False,
            reset_interval=f"Active Guest Session ({GUEST_MAX_MESSAGES} Free Prompts)"
        )

    # Fallback default guest
    return ChatLimitsResponse(
        tier="guest",
        messages_used=0,
        messages_limit=GUEST_MAX_MESSAGES,
        remaining_messages=GUEST_MAX_MESSAGES,
        credits_balance_ngn=0.0,
        bonus_credits_ngn=0.0,
        total_available_ngn=0.0,
        allowed_models=["indunix-1-spark", "indunix-1-core"],
        can_use_reasoning=False,
        reset_interval="Guest Session"
    )


@router.get("/conversations", response_model=List[ConversationOut])
async def list_conversations(
    q: Optional[str] = None,
    archived: bool = False,
    identity: Tuple[Optional[User], Optional[GuestSession]] = Depends(resolve_chat_identity),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists conversations for the active user or guest session.
    Supports search query `q`.
    """
    user, guest_session = identity
    if not user and not guest_session:
        return []

    stmt = select(Conversation).where(Conversation.is_archived == archived)
    if user:
        stmt = stmt.where(Conversation.user_id == user.id)
    else:
        stmt = stmt.where(Conversation.guest_session_id == guest_session.id)

    if q and q.strip():
        stmt = stmt.where(Conversation.title.ilike(f"%{q.strip()}%"))

    stmt = stmt.order_by(desc(Conversation.is_pinned), desc(Conversation.updated_at))
    res = await db.execute(stmt)
    convs = res.scalars().all()

    output = []
    for c in convs:
        # Count messages
        msg_count_res = await db.execute(
            select(ChatMessage.id).where(ChatMessage.conversation_id == c.id)
        )
        count = len(msg_count_res.scalars().all())
        output.append(
            ConversationOut(
                id=c.id,
                title=c.title,
                model=c.model,
                is_pinned=c.is_pinned,
                is_archived=c.is_archived,
                created_at=c.created_at.isoformat(),
                updated_at=c.updated_at.isoformat(),
                message_count=count,
                messages=None
            )
        )
    return output


@router.post("/conversations", response_model=ConversationOut)
async def create_conversation(
    payload: ConversationCreate,
    identity: Tuple[Optional[User], Optional[GuestSession]] = Depends(resolve_chat_identity),
    db: AsyncSession = Depends(get_db)
):
    """Creates a new conversation thread."""
    user, guest_session = identity
    if not user and not guest_session:
        raise HTTPException(status_code=401, detail="Authentication or guest session required.")

    conv = Conversation(
        id=str(uuid.uuid4()),
        user_id=user.id if user else None,
        guest_session_id=guest_session.id if guest_session else None,
        title=payload.title or "New Chat",
        model=payload.model or "indunix-1-core",
        is_pinned=False,
        is_archived=False
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    return ConversationOut(
        id=conv.id,
        title=conv.title,
        model=conv.model,
        is_pinned=conv.is_pinned,
        is_archived=conv.is_archived,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
        message_count=0,
        messages=[]
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
async def get_conversation(
    conversation_id: str,
    identity: Tuple[Optional[User], Optional[GuestSession]] = Depends(resolve_chat_identity),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves full conversation with chronological message history."""
    user, guest_session = identity
    res = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    # Ownership check
    if user and conv.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    if not user and guest_session and conv.guest_session_id != guest_session.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Load messages
    msg_res = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = msg_res.scalars().all()

    msgs_out = [
        ChatMessageOut(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            reasoning_content=m.reasoning_content,
            model=m.model,
            prompt_tokens=m.prompt_tokens,
            completion_tokens=m.completion_tokens,
            created_at=m.created_at.isoformat()
        )
        for m in messages
    ]

    return ConversationOut(
        id=conv.id,
        title=conv.title,
        model=conv.model,
        is_pinned=conv.is_pinned,
        is_archived=conv.is_archived,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
        message_count=len(msgs_out),
        messages=msgs_out
    )


@router.patch("/conversations/{conversation_id}", response_model=ConversationOut)
async def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    identity: Tuple[Optional[User], Optional[GuestSession]] = Depends(resolve_chat_identity),
    db: AsyncSession = Depends(get_db)
):
    """Updates conversation title, pinned status, or model."""
    user, guest_session = identity
    res = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    if user and conv.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    if not user and guest_session and conv.guest_session_id != guest_session.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if payload.title is not None:
        conv.title = payload.title.strip() or "Untitled Chat"
    if payload.is_pinned is not None:
        conv.is_pinned = payload.is_pinned
    if payload.is_archived is not None:
        conv.is_archived = payload.is_archived
    if payload.model is not None:
        conv.model = payload.model

    conv.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(conv)

    return ConversationOut(
        id=conv.id,
        title=conv.title,
        model=conv.model,
        is_pinned=conv.is_pinned,
        is_archived=conv.is_archived,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
        message_count=0,
        messages=None
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    identity: Tuple[Optional[User], Optional[GuestSession]] = Depends(resolve_chat_identity),
    db: AsyncSession = Depends(get_db)
):
    """Deletes a conversation and all its messages."""
    user, guest_session = identity
    res = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    if user and conv.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    if not user and guest_session and conv.guest_session_id != guest_session.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    await db.delete(conv)
    await db.commit()
    return {"status": "success", "message": "Conversation deleted."}


@router.post("/conversations/migrate")
async def migrate_guest_conversations(
    payload: MigrateGuestRequest,
    identity: Tuple[Optional[User], Optional[GuestSession]] = Depends(resolve_chat_identity),
    db: AsyncSession = Depends(get_db)
):
    """
    Migrates guest conversations to the user's permanent account upon login/register.
    Ensures seamless onboarding without losing chat context.
    """
    user, _ = identity
    if not user:
        raise HTTPException(status_code=401, detail="Must be logged in to migrate conversations.")

    guest_payload = decode_access_token(payload.guest_token)
    if not guest_payload or guest_payload.get("role") != "guest":
        return {"migrated_count": 0}

    guest_id = guest_payload.get("sub")
    stmt = (
        update(Conversation)
        .where(Conversation.guest_session_id == guest_id)
        .values(user_id=user.id, guest_session_id=None)
    )
    result = await db.execute(stmt)
    await db.commit()
    return {"status": "success", "migrated_count": result.rowcount}


@router.get("/export/{conversation_id}")
async def export_conversation(
    conversation_id: str,
    format: str = "markdown",
    identity: Tuple[Optional[User], Optional[GuestSession]] = Depends(resolve_chat_identity),
    db: AsyncSession = Depends(get_db)
):
    """Exports conversation as Markdown or JSON."""
    user, guest_session = identity
    res = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    msg_res = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = msg_res.scalars().all()

    if format.lower() == "json":
        data = {
            "title": conv.title,
            "model": conv.model,
            "created_at": conv.created_at.isoformat(),
            "messages": [
                {
                    "role": m.role,
                    "content": m.content,
                    "reasoning_content": m.reasoning_content,
                    "created_at": m.created_at.isoformat()
                }
                for m in messages
            ]
        }
        return data

    # Markdown export
    lines = [
        f"# {conv.title}",
        f"**Model:** {conv.model} | **Date:** {conv.created_at.strftime('%Y-%m-%d %H:%M UTC')}",
        "---",
        ""
    ]
    for m in messages:
        role_label = "### User" if m.role == "user" else "### Indunix AI"
        lines.append(role_label)
        if m.reasoning_content:
            lines.append("> **Chain-of-Thought Reasoning:**")
            for t_line in m.reasoning_content.split("\n"):
                lines.append(f"> {t_line}")
            lines.append("")
        lines.append(m.content)
        lines.append("")
        lines.append("---")
        lines.append("")

    return PlainTextResponse(
        content="\n".join(lines),
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=\"{conv.title[:30].replace(' ', '_')}.md\""}
    )


@router.post("/completions")
async def chat_completions(
    payload: ChatStreamRequest,
    raw_request: Request,
    identity: Tuple[Optional[User], Optional[GuestSession]] = Depends(resolve_chat_identity),
    db: AsyncSession = Depends(get_db)
):
    """
    Core AI Chat Completion endpoint with real-time SSE streaming.
    Handles Guest Tier, Free Tier, and Pro Tier limits, saves message history,
    and returns rich streaming chunks with reasoning trace support.
    """
    user, guest_session = identity

    # Auto-provision guest session if visitor didn't have one
    if not user and not guest_session:
        ip_hash = get_client_ip_hash(raw_request)
        now = datetime.now(timezone.utc)
        guest_id = str(uuid.uuid4())
        guest_session = GuestSession(
            id=guest_id,
            session_token_hash=hash_string(f"{guest_id}:{ip_hash}:{time.time()}"),
            ip_hash=ip_hash,
            messages_sent=0,
            max_messages=GUEST_MAX_MESSAGES,
            created_at=now,
            expires_at=now + timedelta(days=7),
            last_active_at=now
        )
        db.add(guest_session)
        await db.commit()

    model = payload.model or "indunix-1-core"
    is_reasoning_model = model in ("indunix-1-reason", "axion-1-reason")

    # 1. Tier Enforcement for Model Access
    if is_reasoning_model:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Indunix 1 Reason is reserved for Pro accounts. Upgrade to Pro or sign in to access chain-of-thought reasoning."
            )
        # Check if user has wallet balance or enterprise admin
        wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
        wallet = wallet_res.scalar_one_or_none()
        total_balance = float(wallet.balance_ngn + wallet.bonus_credits_ngn) if wallet else 0.0
        if total_balance <= 0.0 and user.role not in (UserRole.SUPERADMIN, UserRole.ENTERPRISE_ADMIN):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Indunix 1 Reason requires an active credit balance. Top up your wallet with direct Naira to proceed."
            )

    # 2. Quota Check
    if guest_session:
        if guest_session.messages_sent >= guest_session.max_messages:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="You have used all 10 free guest messages. Create a free Indunix AI account with ₦1,000 bonus credits to continue chatting!"
            )
    elif user:
        # Check wallet preflight
        wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
        wallet = wallet_res.scalar_one_or_none()
        if wallet and wallet.is_frozen:
            raise HTTPException(status_code=403, detail="Your account wallet is suspended.")

    # 3. Resolve or Create Conversation
    conversation = None
    if payload.conversation_id:
        res = await db.execute(select(Conversation).where(Conversation.id == payload.conversation_id))
        conversation = res.scalar_one_or_none()

    if not conversation:
        # Determine title from latest user message
        user_text = ""
        for m in reversed(payload.messages):
            if m.role == "user" and m.content:
                user_text = m.content.strip()
                break
        title = (user_text[:38] + "...") if len(user_text) > 38 else (user_text or "New Chat")

        conversation = Conversation(
            id=str(uuid.uuid4()),
            user_id=user.id if user else None,
            guest_session_id=guest_session.id if guest_session else None,
            title=title,
            model=model,
            is_pinned=False,
            is_archived=False
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    # Save incoming user message
    last_user_msg = payload.messages[-1] if payload.messages else None
    if last_user_msg and last_user_msg.role == "user":
        user_msg = ChatMessage(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role="user",
            content=last_user_msg.content,
            model=model,
            prompt_tokens=max(1, len(last_user_msg.content) // 4)
        )
        db.add(user_msg)
        await db.commit()

    # Prepare Gateway ChatCompletionRequest
    gw_messages = [
        GatewayMessage(role=m.role, content=m.content)
        for m in payload.messages
    ]
    gw_payload = ChatCompletionRequest(
        model=model,
        messages=gw_messages,
        temperature=payload.temperature or 0.7,
        stream=payload.stream
    )

    conv_id = conversation.id
    start_time = time.time()

    # 4. Handle Streaming Response
    if payload.stream:
        async def chat_event_generator():
            full_response_text = ""
            full_reasoning_text = ""
            assistant_msg_id = f"msg_{uuid.uuid4().hex[:12]}"

            # Send initial header metadata event
            meta_event = {
                "conversation_id": conv_id,
                "message_id": assistant_msg_id,
                "model": model,
                "role": "assistant"
            }
            yield f"data: {json.dumps(meta_event)}\n\n"

            stream_gen = proxy_engine.execute_streaming(gw_payload, model)
            try:
                async for chunk in stream_gen:
                    if chunk.startswith("data: ") and not chunk.startswith("data: [DONE]"):
                        raw_json_str = chunk[6:].strip()
                        try:
                            chunk_data = json.loads(raw_json_str)
                            delta = chunk_data.get("choices", [{}])[0].get("delta", {})
                            content_piece = delta.get("content", "")
                            if content_piece:
                                full_response_text += content_piece
                        except Exception:
                            pass
                    yield chunk
            finally:
                # Post-stream persistence
                try:
                    # Parse <think> reasoning trace if present
                    clean_content = full_response_text
                    reasoning_content = None
                    if "<think>" in full_response_text and "</think>" in full_response_text:
                        parts = full_response_text.split("</think>")
                        think_part = parts[0].replace("<think>", "").strip()
                        clean_content = parts[1].strip()
                        reasoning_content = think_part

                    # Asynchronously save completed assistant message
                    async with AsyncSession(db.bind) as save_session:
                        comp_tokens = max(1, len(full_response_text) // 4)
                        prompt_tokens = max(1, sum(len(m.content) for m in payload.messages) // 4)

                        assistant_msg = ChatMessage(
                            id=assistant_msg_id,
                            conversation_id=conv_id,
                            role="assistant",
                            content=clean_content,
                            reasoning_content=reasoning_content,
                            model=model,
                            prompt_tokens=prompt_tokens,
                            completion_tokens=comp_tokens
                        )
                        save_session.add(assistant_msg)

                        # Update conversation timestamp
                        conv_update = await save_session.get(Conversation, conv_id)
                        if conv_update:
                            conv_update.updated_at = datetime.now(timezone.utc)

                        # Increment guest message counter
                        if guest_session:
                            g_session = await save_session.get(GuestSession, guest_session.id)
                            if g_session:
                                g_session.messages_sent += 1
                                g_session.last_active_at = datetime.now(timezone.utc)

                        # Deduct tokens from user wallet if applicable
                        if user:
                            latency_ms = int((time.time() - start_time) * 1000)
                            try:
                                await TokenMeter.deduct_and_log(
                                    db=save_session,
                                    user_id=user.id,
                                    api_key_id=None,
                                    model=model,
                                    prompt_tokens=prompt_tokens,
                                    completion_tokens=comp_tokens,
                                    latency_ms=latency_ms,
                                    is_stream=True,
                                    status_code=200,
                                    ip_hash=get_client_ip_hash(raw_request)
                                )
                            except Exception:
                                pass

                        await save_session.commit()
                except Exception as save_err:
                    import logging
                    logging.getLogger("indunix.chat").warning(f"Error saving chat message: {save_err}")

        return StreamingResponse(
            chat_event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                "X-Conversation-Id": conv_id
            }
        )

    # 5. Handle Non-Streaming Response
    response_data = await proxy_engine.execute_non_streaming(gw_payload, model)
    content = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")

    clean_content = content
    reasoning_content = None
    if "<think>" in content and "</think>" in content:
        parts = content.split("</think>")
        reasoning_content = parts[0].replace("<think>", "").strip()
        clean_content = parts[1].strip()

    comp_tokens = response_data.get("usage", {}).get("completion_tokens", len(content) // 4)
    prompt_tokens = response_data.get("usage", {}).get("prompt_tokens", 10)

    assistant_msg = ChatMessage(
        id=str(uuid.uuid4()),
        conversation_id=conv_id,
        role="assistant",
        content=clean_content,
        reasoning_content=reasoning_content,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=comp_tokens
    )
    db.add(assistant_msg)

    if guest_session:
        guest_session.messages_sent += 1
        guest_session.last_active_at = datetime.now(timezone.utc)

    conversation.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "conversation_id": conv_id,
        "message_id": assistant_msg.id,
        "role": "assistant",
        "content": clean_content,
        "reasoning_content": reasoning_content,
        "model": model,
        "usage": response_data.get("usage")
    }
