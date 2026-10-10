import os
import uuid
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from backend.core.config import settings
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.core.security import verify_password, hash_password, create_access_token
from backend.models.user import User, UserRole
from backend.models.wallet import Wallet, Transaction, TransactionChannel, TransactionStatus
from backend.models.api_key import ApiKey
from backend.models.usage import UsageLog
from backend.models.enterprise import EnterpriseContract
from backend.models.system_setting import SystemSetting
from backend.schemas.auth import UserOut
from backend.schemas.admin import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminPasswordChangeRequest,
    AdminCreditAdjustRequest,
    AdminUserStatusUpdateRequest,
    AdminPricingUpdateRequest,
    AdminPromoCampaigns,
    AdminPromoCampaignsUpdate,
    AdminUserListItem,
)
from backend.services.email_service import email_service

router = APIRouter(prefix="/api/admin", tags=["Admin Platform Management"])

async def get_current_admin_user(
    user: User = Depends(get_current_user)
) -> User:
    """Strict authorization gate: User must possess SUPERADMIN or ENTERPRISE_ADMIN privileges."""
    if user.role not in (UserRole.SUPERADMIN, UserRole.ENTERPRISE_ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required."
        )
    return user

def mask_key(k: Optional[str]) -> str:
    if not k:
        return ""
    if len(k) <= 8:
        return "••••••••"
    return f"{k[:5]}••••••••{k[-4:]}"

# =========================================================================
# 1. Admin Authentication & Mandatory Initial Password Gate
# =========================================================================

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Dedicated admin login gate.
    Supports login via username (e.g. 'indunixai') or administrator email.
    Detects if the account must change their initial password.
    """
    ident = payload.identifier.strip().lower()
    stmt = select(User).where(or_(
        func.lower(User.username) == ident,
        func.lower(User.email) == ident
    ))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials."
        )

    if user.role not in (UserRole.SUPERADMIN, UserRole.ENTERPRISE_ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Account lacks administrative privileges."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator account is deactivated."
        )

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value})

    msg = "Administrator authenticated."
    if user.must_change_password:
        msg = "First-time login detected. You must change your default administrator password."

    return AdminLoginResponse(
        access_token=token,
        token_type="bearer",
        must_change_password=bool(user.must_change_password),
        message=msg,
        user=UserOut.model_validate(user)
    )

@router.post("/change-initial-password")
async def change_initial_password(
    payload: AdminPasswordChangeRequest,
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mandatory first-login password change security screen.
    Replaces default seeded credentials with administrator's private password.
    """
    new_pw = payload.new_password.strip()
    if len(new_pw) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )

    if new_pw == "Password@26":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot match the temporary default password."
        )

    user.hashed_password = hash_password(new_pw)
    user.must_change_password = False
    await db.commit()
    await db.refresh(user)

    new_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value})
    return {
        "status": "success",
        "message": "Administrator password updated successfully. Full access granted.",
        "access_token": new_token,
        "user": UserOut.model_validate(user)
    }

# =========================================================================
# 2. Platform Telemetry & System Overview
# =========================================================================

@router.get("/metrics")
async def get_admin_metrics(
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns platform-wide ledger overview and operational metrics.
    """
    total_users_res = await db.execute(select(func.count(User.id)))
    total_users = total_users_res.scalar() or 0

    total_keys_res = await db.execute(select(func.count(ApiKey.id)))
    total_keys = total_keys_res.scalar() or 0

    total_balance_res = await db.execute(select(func.sum(Wallet.balance_ngn)))
    total_balance = float(total_balance_res.scalar() or 0.0)

    total_bonus_res = await db.execute(select(func.sum(Wallet.bonus_credits_ngn)))
    total_bonus = float(total_bonus_res.scalar() or 0.0)

    total_tokens_res = await db.execute(select(func.sum(UsageLog.total_tokens)))
    total_tokens = int(total_tokens_res.scalar() or 0)

    total_requests_res = await db.execute(select(func.count(UsageLog.id)))
    total_requests = int(total_requests_res.scalar() or 0)

    contracts_res = await db.execute(select(func.count(EnterpriseContract.id)))
    total_contracts = int(contracts_res.scalar() or 0)

    return {
        "total_users": total_users,
        "total_keys": total_keys,
        "total_ledger_balance_ngn": round(total_balance, 2),
        "total_bonus_issued_ngn": round(total_bonus, 2),
        "total_tokens_metered": total_tokens,
        "total_requests_served": total_requests,
        "active_enterprise_leases": total_contracts,
        "live_production_mode": not settings.MOCK_UPSTREAM_IF_UNSET
    }

# =========================================================================
# 3. User Accounts & Wallet Balance / Bonus Management
# =========================================================================

@router.get("/users")
async def get_admin_users(
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists users with balances, metered usage, and account status.
    Supports filtering by search query.
    """
    stmt = select(User).order_by(User.created_at.desc())
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(or_(
            func.lower(User.email).like(term),
            func.lower(User.full_name).like(term),
            func.lower(User.username).like(term)
        ))

    total_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total_count = total_res.scalar() or 0

    stmt = stmt.offset(offset).limit(limit)
    res = await db.execute(stmt)
    users = res.scalars().all()

    items: List[AdminUserListItem] = []
    for u in users:
        # Load user wallet
        w_res = await db.execute(select(Wallet).where(Wallet.user_id == u.id))
        w = w_res.scalar_one_or_none()

        balance = float(w.balance_ngn) if w else 0.0
        bonus = float(w.bonus_credits_ngn) if w else 0.0
        is_frozen = bool(w.is_frozen) if w else False
        d_acc = w.dedicated_account_number if w else None
        d_bank = w.dedicated_account_bank if w else None

        # Count keys
        k_res = await db.execute(select(func.count(ApiKey.id)).where(ApiKey.user_id == u.id))
        key_count = k_res.scalar() or 0

        # Usage summary
        u_res = await db.execute(
            select(func.sum(UsageLog.total_tokens), func.count(UsageLog.id)).where(UsageLog.user_id == u.id)
        )
        u_data = u_res.first()
        toks = int(u_data[0] or 0) if u_data else 0
        reqs = int(u_data[1] or 0) if u_data else 0

        items.append(AdminUserListItem(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            company_name=u.company_name,
            role=u.role,
            is_active=u.is_active,
            must_change_password=bool(u.must_change_password),
            created_at=u.created_at,
            balance_ngn=round(balance, 2),
            bonus_credits_ngn=round(bonus, 2),
            total_available_ngn=round(balance + bonus, 2),
            is_frozen=is_frozen,
            dedicated_account_number=d_acc,
            dedicated_account_bank=d_bank,
            total_api_keys=key_count,
            total_tokens=toks,
            total_requests=reqs
        ))

    return {
        "total": total_count,
        "users": items
    }

@router.post("/users/{user_id}/adjust-credits")
async def adjust_user_credits(
    user_id: str,
    payload: AdminCreditAdjustRequest,
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually awards promotional bonus credits or cash balances to a user's wallet.
    Logs an immutable audit transaction and dispatches notification email.
    """
    target_res = await db.execute(select(User).where(User.id == user_id))
    target_user = target_res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    w_res = await db.execute(select(Wallet).where(Wallet.user_id == user_id).with_for_update())
    wallet = w_res.scalar_one_or_none()
    if not wallet:
        wallet = Wallet(user_id=target_user.id, balance_ngn=0.0, bonus_credits_ngn=0.0, currency="NGN")
        db.add(wallet)
        await db.flush()

    amount = float(payload.amount_ngn)
    credit_type = payload.credit_type.lower()
    channel = TransactionChannel.PROMO_CREDIT.value

    if credit_type == "cash":
        wallet.balance_ngn = round(max(0.0, float(wallet.balance_ngn) + amount), 4)
        channel = TransactionChannel.BANK_TRANSFER.value
    else:
        wallet.bonus_credits_ngn = round(max(0.0, float(wallet.bonus_credits_ngn) + amount), 4)
        channel = TransactionChannel.PROMO_CREDIT.value

    # Create audit transaction record
    tx = Transaction(
        wallet_id=wallet.id,
        reference=f"indunix_admin_adj_{uuid.uuid4().hex[:10]}",
        amount_ngn=amount,
        channel=channel,
        status=TransactionStatus.SUCCESS,
        metadata_json={
            "description": f"Admin credit grant: {payload.reason}",
            "credit_type": credit_type,
            "granted_by": admin_user.username or admin_user.email,
            "reason": payload.reason
        }
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)

    if payload.notify_user:
        email_service.send_credit_granted_email(
            to_email=target_user.email,
            full_name=target_user.full_name,
            amount_ngn=amount,
            credit_type=credit_type,
            reason=payload.reason
        )

    return {
        "status": "success",
        "message": f"Successfully credited ₦{amount:,.2f} ({credit_type}) to {target_user.email}.",
        "balance_ngn": float(wallet.balance_ngn),
        "bonus_credits_ngn": float(wallet.bonus_credits_ngn),
        "total_available_ngn": float(wallet.balance_ngn) + float(wallet.bonus_credits_ngn)
    }

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    payload: AdminUserStatusUpdateRequest,
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Freezes/unfreezes wallet, deactivates/reactivates user account, or modifies user role.
    """
    target_res = await db.execute(select(User).where(User.id == user_id))
    target_user = target_res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    if payload.is_active is not None:
        target_user.is_active = payload.is_active

    if payload.role is not None:
        target_user.role = payload.role

    if payload.is_frozen is not None:
        w_res = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
        wallet = w_res.scalar_one_or_none()
        if wallet:
            wallet.is_frozen = payload.is_frozen

    await db.commit()
    await db.refresh(target_user)
    return {
        "status": "success",
        "message": "User status updated successfully."
    }

# =========================================================================
# 4. Dynamic Model Pricing Control
# =========================================================================

@router.get("/pricing")
async def get_admin_pricing(
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns active pricing rate card for all sovereign models.
    """
    return {
        "pricing": settings.RATE_CARD_NGN
    }

@router.put("/pricing")
async def update_admin_pricing(
    payload: AdminPricingUpdateRequest,
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Adjusts per-million prompt and completion pricing across models.
    Persists configuration in the system_settings table and in-memory settings.
    """
    pricing_data = {}
    for model_id, rate_info in payload.models.items():
        if model_id in settings.RATE_CARD_NGN:
            settings.RATE_CARD_NGN[model_id]["prompt_per_million"] = float(rate_info.prompt_per_million)
            settings.RATE_CARD_NGN[model_id]["completion_per_million"] = float(rate_info.completion_per_million)
            if rate_info.name:
                settings.RATE_CARD_NGN[model_id]["name"] = rate_info.name
            if rate_info.description:
                settings.RATE_CARD_NGN[model_id]["description"] = rate_info.description
            pricing_data[model_id] = {
                "prompt_per_million": float(rate_info.prompt_per_million),
                "completion_per_million": float(rate_info.completion_per_million),
                "name": settings.RATE_CARD_NGN[model_id].get("name", model_id),
                "description": settings.RATE_CARD_NGN[model_id].get("description", "")
            }

    # Persist in DB
    setting = await db.get(SystemSetting, "model_pricing")
    if not setting:
        setting = SystemSetting(key="model_pricing", value_json=pricing_data)
        db.add(setting)
    else:
        setting.value_json = pricing_data
    await db.commit()

    return {
        "status": "success",
        "message": "Model pricing updated and persisted.",
        "pricing": settings.RATE_CARD_NGN
    }

# =========================================================================
# 5. Promotions & Campaigns Engine
# =========================================================================

@router.get("/promos", response_model=AdminPromoCampaigns)
async def get_admin_promos(
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns promotional settings (signup bonus, promo sale days, banner).
    """
    setting = await db.get(SystemSetting, "promo_campaigns")
    if setting and setting.value_json:
        return AdminPromoCampaigns(**setting.value_json)
    return AdminPromoCampaigns()

@router.put("/promos", response_model=AdminPromoCampaigns)
async def update_admin_promos(
    payload: AdminPromoCampaignsUpdate,
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Configures signup bonus amount, sale discount %, timers, and public banner.
    """
    setting = await db.get(SystemSetting, "promo_campaigns")
    current_data = setting.value_json if setting and setting.value_json else AdminPromoCampaigns().model_dump()

    update_dict = payload.model_dump(exclude_unset=True)
    current_data.update(update_dict)

    if not setting:
        setting = SystemSetting(key="promo_campaigns", value_json=current_data)
        db.add(setting)
    else:
        setting.value_json = current_data
    await db.commit()

    return AdminPromoCampaigns(**current_data)

# =========================================================================
# 6. Gateway Keys & Upstream Integration Credentials
# =========================================================================

class AdminConfigUpdate(BaseModel):
    paystack_secret_key: Optional[str] = None
    paystack_public_key: Optional[str] = None
    deepseek_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    together_api_key: Optional[str] = None
    live_production_mode: Optional[bool] = None

@router.get("/config")
async def get_admin_config(
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns platform payment keys and upstream AI credentials.
    Strictly isolated to administrative users.
    """
    is_live = not settings.MOCK_UPSTREAM_IF_UNSET
    return {
        "payment": {
            "gateway": "Pay in Naira (Direct Settlement)",
            "secret_key_masked": mask_key(settings.PAYSTACK_SECRET_KEY),
            "public_key": settings.PAYSTACK_PUBLIC_KEY,
            "has_live_secret": bool(settings.PAYSTACK_SECRET_KEY and settings.PAYSTACK_SECRET_KEY.startswith("sk_live_")),
            "base_url": settings.PAYSTACK_BASE_URL,
            "webhook_endpoint": "https://api.axion.ng/api/billing/webhook",
            "webhook_security": "HMAC SHA-512 Verification Active"
        },
        "upstream": {
            "deepseek_key_masked": mask_key(settings.DEEPSEEK_API_KEY),
            "has_deepseek_key": bool(settings.DEEPSEEK_API_KEY),
            "groq_key_masked": mask_key(settings.GROQ_API_KEY),
            "has_groq_key": bool(settings.GROQ_API_KEY),
            "together_key_masked": mask_key(settings.TOGETHER_API_KEY),
            "has_together_key": bool(settings.TOGETHER_API_KEY),
            "live_production_mode": is_live,
            "mock_upstream_if_unset": settings.MOCK_UPSTREAM_IF_UNSET
        },
        "enterprise": {
            "signing_key_masked": mask_key(settings.ENTERPRISE_LEASE_SIGNING_KEY),
            "telemetry_protocol": "24h Ed25519 Cryptographic Token"
        }
    }

@router.post("/config")
async def update_admin_config(
    payload: AdminConfigUpdate,
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates active Paystack keys, upstream AI provider keys, and switches to live mode.
    Strictly isolated to administrative users.
    """
    updated_fields = []
    
    if payload.paystack_secret_key is not None and payload.paystack_secret_key.strip():
        val = payload.paystack_secret_key.strip()
        settings.PAYSTACK_SECRET_KEY = val
        from backend.services.paystack_service import paystack_service
        paystack_service.secret_key = val
        updated_fields.append("paystack_secret_key")

    if payload.paystack_public_key is not None and payload.paystack_public_key.strip():
        val = payload.paystack_public_key.strip()
        settings.PAYSTACK_PUBLIC_KEY = val
        updated_fields.append("paystack_public_key")

    if payload.deepseek_api_key is not None and payload.deepseek_api_key.strip():
        val = payload.deepseek_api_key.strip()
        settings.DEEPSEEK_API_KEY = val
        os.environ["DEEPSEEK_API_KEY"] = val
        updated_fields.append("deepseek_api_key")

    if payload.groq_api_key is not None and payload.groq_api_key.strip():
        val = payload.groq_api_key.strip()
        settings.GROQ_API_KEY = val
        os.environ["GROQ_API_KEY"] = val
        updated_fields.append("groq_api_key")

    if payload.together_api_key is not None and payload.together_api_key.strip():
        val = payload.together_api_key.strip()
        settings.TOGETHER_API_KEY = val
        os.environ["TOGETHER_API_KEY"] = val
        updated_fields.append("together_api_key")

    if payload.live_production_mode is not None:
        settings.MOCK_UPSTREAM_IF_UNSET = not payload.live_production_mode
        updated_fields.append("live_production_mode")

    return {
        "status": "success",
        "message": f"Updated {len(updated_fields)} settings successfully.",
        "updated_fields": updated_fields,
        "live_production_mode": not settings.MOCK_UPSTREAM_IF_UNSET
    }
