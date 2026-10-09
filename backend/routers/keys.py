from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.core.security import generate_api_key
from backend.models.user import User
from backend.models.api_key import ApiKey
from backend.schemas.dashboard import ApiKeyCreate, ApiKeyOut, ApiKeyCreatedOut

router = APIRouter(prefix="/api/keys", tags=["API Key Lifecycle"])

@router.get("", response_model=List[ApiKeyOut])
async def list_keys(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user.id).order_by(ApiKey.created_at.desc())
    )
    keys = result.scalars().all()
    return [ApiKeyOut.model_validate(k) for k in keys]

@router.post("", response_model=ApiKeyCreatedOut, status_code=status.HTTP_201_CREATED)
async def create_key(payload: ApiKeyCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    full_secret, key_prefix, hashed_secret = generate_api_key()

    new_key = ApiKey(
        user_id=user.id,
        name=payload.name,
        key_prefix=key_prefix,
        hashed_secret=hashed_secret,
        monthly_spend_limit_ngn=payload.monthly_spend_limit_ngn,
        current_month_spend_ngn=0.0,
        is_active=True
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)

    return ApiKeyCreatedOut(
        api_key=ApiKeyOut.model_validate(new_key),
        secret_key=full_secret,
        warning="Save this secret key now. It will never be shown again!"
    )

@router.patch("/{key_id}/toggle", response_model=ApiKeyOut)
async def toggle_key_status(key_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user.id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    key.is_active = not key.is_active
    await db.commit()
    await db.refresh(key)
    return ApiKeyOut.model_validate(key)

@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_key(key_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user.id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    await db.delete(key)
    await db.commit()
    return None
