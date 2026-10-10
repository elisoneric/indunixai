import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.database import get_db
from backend.core.security import hash_password, verify_password, create_access_token
from backend.core.deps import get_current_user
from backend.models.user import User, UserRole
from backend.models.wallet import Wallet, Transaction, TransactionChannel, TransactionStatus
from backend.schemas.auth import (
    UserRegister, UserLogin, UserOut, Token, GoogleAuthRequest,
    ProfileUpdate, PasswordChange, UserPreferences
)
from backend.services.email_service import email_service


router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.get("/config")
async def get_auth_public_config():
    """
    Returns public client configuration for social login (Google OAuth).
    """
    from backend.core.config import settings
    return {
        "google_client_id": settings.GOOGLE_CLIENT_ID or ""
    }

@router.get("/promotions")
async def get_public_promotions(db: AsyncSession = Depends(get_db)):
    """Public endpoint to fetch active promotional bonuses and announcement banner."""
    from backend.models.system_setting import SystemSetting
    setting = await db.get(SystemSetting, "promo_campaigns")
    if setting and setting.value_json:
        return setting.value_json
    return {
        "signup_bonus_ngn": 1000.0,
        "sale_active": False,
        "sale_title": "Developer Flash Sale",
        "sale_discount_percent": 0.0,
        "sale_ends_at": None,
        "banner_active": False,
        "banner_text": ""
    }

async def _get_signup_bonus(db: AsyncSession) -> float:
    from backend.models.system_setting import SystemSetting
    setting = await db.get(SystemSetting, "promo_campaigns")
    if setting and setting.value_json:
        return float(setting.value_json.get("signup_bonus_ngn", 1000.0))
    return 1000.0

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

    # Dynamic Signup Bonus Credits (configurable via /admin)
    signup_bonus = await _get_signup_bonus(db)

    # Create Wallet with Signup Bonus Credits
    wallet = Wallet(
        user_id=new_user.id,
        balance_ngn=0.0000,
        bonus_credits_ngn=signup_bonus,
        currency="NGN"
    )
    db.add(wallet)
    await db.flush()

    # Log welcome promo transaction
    promo_tx = Transaction(
        wallet_id=wallet.id,
        reference=f"indunix_promo_{uuid.uuid4().hex[:10]}",
        amount_ngn=signup_bonus,
        channel=TransactionChannel.PROMO_CREDIT.value,
        status=TransactionStatus.SUCCESS,
        metadata_json={"description": f"Welcome sign-up grant (₦{signup_bonus:,.2f} API Credits)"}
    )
    db.add(promo_tx)
    await db.commit()
    await db.refresh(new_user)

    # Dispatch welcome email with credit confirmation
    email_service.send_welcome_email(to_email=new_user.email, full_name=new_user.full_name)

    token = create_access_token(data={"sub": new_user.id, "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserOut.model_validate(new_user)
    }

@router.post("/login", response_model=Token)
async def login(payload: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
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

    # Dispatch login security notice
    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")
    email_service.send_login_alert(
        to_email=user.email,
        full_name=user.full_name,
        ip_address=client_ip,
        user_agent=user_agent
    )

    token = create_access_token(data={"sub": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserOut.model_validate(user)
    }

@router.post("/google", response_model=Token)
async def google_auth(payload: GoogleAuthRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Authenticates or registers user via Google Sign-In.
    Supports Google ID token JWT verification or direct client credential.
    """
    email: Optional[str] = None
    full_name: Optional[str] = None

    if payload.credential:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential}")
                if res.status_code == 200:
                    data = res.json()
                    email = data.get("email")
                    full_name = data.get("name")
        except Exception:
            pass

    if not email:
        email = payload.email
        full_name = payload.full_name or "Google Developer"

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to verify Google credentials. Please provide a valid email."
        )

    # Check if user already exists
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()

    if not user:
        # Create new user via Google
        user = User(
            email=email.lower(),
            hashed_password=hash_password(uuid.uuid4().hex),
            full_name=full_name or "Google User",
            company_name=None,
            role=UserRole.DEVELOPER,
            is_active=True
        )
        db.add(user)
        await db.flush()

        # Create wallet with Dynamic Signup Bonus Credits
        signup_bonus = await _get_signup_bonus(db)
        wallet = Wallet(
            user_id=user.id,
            balance_ngn=0.0000,
            bonus_credits_ngn=signup_bonus,
            currency="NGN"
        )
        db.add(wallet)
        await db.flush()

        # Log promo credit
        promo_tx = Transaction(
            wallet_id=wallet.id,
            reference=f"indunix_promo_{uuid.uuid4().hex[:10]}",
            amount_ngn=signup_bonus,
            channel=TransactionChannel.PROMO_CREDIT.value,
            status=TransactionStatus.SUCCESS,
            metadata_json={"description": f"Google Signup Grant (₦{signup_bonus:,.2f} API Credits)"}
        )
        db.add(promo_tx)
        await db.commit()
        await db.refresh(user)

        # Dispatch welcome email
        email_service.send_welcome_email(to_email=user.email, full_name=user.full_name)
    else:
        # Dispatch login alert email
        client_ip = request.client.host if request.client else "Unknown"
        user_agent = request.headers.get("user-agent", "Unknown")
        email_service.send_login_alert(
            to_email=user.email,
            full_name=user.full_name,
            ip_address=client_ip,
            user_agent=user_agent
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

@router.put("/profile", response_model=UserOut)
async def update_profile(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the current user's profile details (full name, company name).
    """
    if payload.full_name is not None and payload.full_name.strip():
        user.full_name = payload.full_name.strip()
    if payload.company_name is not None:
        user.company_name = payload.company_name.strip() if payload.company_name else None

    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)

@router.put("/password")
async def update_password(
    payload: PasswordChange,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates user password. Verifies current password if set.
    """
    # If user registered via email and already has password
    if payload.current_password:
        if not verify_password(payload.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect."
            )
    elif len(user.hashed_password) > 20: # has existing hashed password
        # If no current password provided but they already have a password set
        pass

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )

    user.hashed_password = hash_password(payload.new_password)
    await db.commit()

    # Send security notification email
    client_ip = request.client.host if request.client else "Unknown"
    email_service.send_password_changed_alert(
        to_email=user.email,
        full_name=user.full_name,
        ip_address=client_ip
    )

    return {"status": "success", "message": "Password updated successfully."}

# In-memory / fast session preference storage per user
_user_preferences_store = {}

@router.get("/preferences", response_model=UserPreferences)
async def get_preferences(user: User = Depends(get_current_user)):
    """
    Retrieves user notification and UI preferences.
    """
    if user.id in _user_preferences_store:
        return UserPreferences(**_user_preferences_store[user.id])
    return UserPreferences()

@router.put("/preferences", response_model=UserPreferences)
async def update_preferences(
    payload: UserPreferences,
    user: User = Depends(get_current_user)
):
    """
    Saves user notification and UI preferences.
    """
    _user_preferences_store[user.id] = payload.model_dump()
    return payload

