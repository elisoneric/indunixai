from typing import Optional, Tuple
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.database import get_db
from backend.core.security import decode_access_token, hash_api_key
from backend.core.exceptions import InvalidApiKeyException
from backend.models.user import User
from backend.models.api_key import ApiKey

security_bearer = HTTPBearer(auto_error=False)

async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Authenticates standard console JWT Bearer token."""
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )
    payload = decode_access_token(auth.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )
    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated."
        )
    return user

async def get_gateway_auth(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="x-api-key"),
    db: AsyncSession = Depends(get_db)
) -> Tuple[User, Optional[ApiKey]]:
    """
    Authenticates gateway /v1 and Anthropic /messages requests.
    Supports:
    1. Header: 'x-api-key: indunix-live-sk-...' (Anthropic / Claude Desktop & Claude Code format)
    2. Header: 'Authorization: Bearer indunix-live-sk-...' (Standard OpenAI SDK format)
    3. Header: 'Authorization: Bearer <JWT>' (Browser playground session)
    """
    token_str = None
    if x_api_key:
        token_str = x_api_key.strip()
    elif authorization:
        parts = authorization.strip().split(" ")
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token_str = parts[1].strip()
        else:
            token_str = authorization.strip()

    if not token_str:
        raise InvalidApiKeyException("Missing API key. Provide 'x-api-key' or 'Authorization: Bearer <key>'.")

    if token_str.lower().startswith("bearer "):
        token_str = token_str[7:].strip()

    # Case 1: Standard Indunix or Axion API Key
    if token_str.startswith(("indunix-live-", "axion-live-")):
        hashed = hash_api_key(token_str)
        result = await db.execute(select(ApiKey).where(ApiKey.hashed_secret == hashed))
        api_key = result.scalar_one_or_none()
        if not api_key:
            raise InvalidApiKeyException("Unrecognized Indunix API key.")
        if not api_key.is_active:
            raise InvalidApiKeyException("This Indunix API key has been revoked.")

        user_res = await db.execute(select(User).where(User.id == api_key.user_id))
        user = user_res.scalar_one_or_none()
        if not user or not user.is_active:
            raise InvalidApiKeyException("User account associated with this key is inactive.")

        return user, api_key

    # Check database in case custom key
    hashed = hash_api_key(token_str)
    result = await db.execute(select(ApiKey).where(ApiKey.hashed_secret == hashed))
    api_key = result.scalar_one_or_none()
    if api_key:
        if not api_key.is_active:
            raise InvalidApiKeyException("This Indunix API key has been revoked.")
        user_res = await db.execute(select(User).where(User.id == api_key.user_id))
        user = user_res.scalar_one_or_none()
        if not user or not user.is_active:
            raise InvalidApiKeyException("User account associated with this key is inactive.")
        return user, api_key

    # Case 2: Playground or Console JWT
    payload = decode_access_token(token_str)
    if payload and payload.get("sub"):
        user_res = await db.execute(select(User).where(User.id == payload["sub"]))
        user = user_res.scalar_one_or_none()
        if user and user.is_active:
            return user, None

    raise InvalidApiKeyException("Invalid Indunix API key or credentials.")
