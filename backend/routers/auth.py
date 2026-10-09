import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.database import get_db
from backend.core.security import hash_password, verify_password, create_access_token
from backend.core.deps import get_current_user
from backend.models.user import User, UserRole
from backend.models.wallet import Wallet, Transaction, TransactionChannel, TransactionStatus
from backend.schemas.auth import UserRegister, UserLogin, UserOut, Token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Create User
    new_user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        company_name=payload.company_name,
        role=UserRole.DEVELOPER,
        is_active=True
    )
    db.add(new_user)
    await db.flush()

    # Create Wallet with ₦1,000 Signup Bonus Credits
    wallet = Wallet(
        user_id=new_user.id,
        balance_ngn=0.0000,
        bonus_credits_ngn=1000.0000,
        currency="NGN"
    )
    db.add(wallet)
    await db.flush()

    # Log welcome promo transaction
    promo_tx = Transaction(
        wallet_id=wallet.id,
        reference=f"axion_promo_{uuid.uuid4().hex[:10]}",
        amount_ngn=1000.00,
        channel=TransactionChannel.PROMO_CREDIT.value,
        status=TransactionStatus.SUCCESS,
        metadata_json={"description": "Welcome sign-up grant (₦1,000 API Credits)"}
    )
    db.add(promo_tx)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(data={"sub": new_user.id, "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserOut.model_validate(new_user)
    }

@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive."
        )

    token = create_access_token(data={"sub": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserOut.model_validate(user)
    }

@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)
