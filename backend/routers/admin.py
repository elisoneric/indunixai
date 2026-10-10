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
    ModelUnitEconomics,
    DeepSeekLiveBalance,
    DepositFeeSettings,
    AdminFxRateUpdate,
    AdminFinancialReport,
    AdminSmtpSettings,
    AdminSmtpUpdateRequest,
    AdminSmtpTestRequest,
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

# =========================================================================
# 7. Financial Inflows, Revenue, Profitability & DeepSeek Live Balance
# =========================================================================

WHOLESALE_RATES_USD_PER_M = {
    "indunix-1-spark": {"prompt": 0.05, "completion": 0.08, "name": "Indunix 1 Spark (Ultra Fast)"},
    "axion-1-spark": {"prompt": 0.05, "completion": 0.08, "name": "Indunix 1 Spark (Ultra Fast)"},
    "indunix-1-core": {"prompt": 0.14, "completion": 0.28, "name": "Indunix 1 Core (DeepSeek-V3)"},
    "axion-1-core": {"prompt": 0.14, "completion": 0.28, "name": "Indunix 1 Core (DeepSeek-V3)"},
    "indunix-1-reason": {"prompt": 0.55, "completion": 2.19, "name": "Indunix 1 Reason (DeepSeek-R1)"},
    "axion-1-reason": {"prompt": 0.55, "completion": 2.19, "name": "Indunix 1 Reason (DeepSeek-R1)"},
}

async def fetch_deepseek_balance(fx_rate: float = 1500.0) -> DeepSeekLiveBalance:
    """Queries live DeepSeek user balance from official API."""
    api_key = settings.DEEPSEEK_API_KEY
    if not api_key or "mock" in api_key.lower():
        return DeepSeekLiveBalance(
            status="unconfigured" if not api_key else "mock",
            is_available=False,
            currency="USD",
            total_balance=0.0,
            granted_balance=0.0,
            topped_up_balance=0.0,
            balance_ngn=0.0,
            message="No live DeepSeek API key configured. Enter key in Gateway tab to view live balance."
        )

    try:
        import httpx
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.deepseek.com/user/balance",
                headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
            )
            if resp.status_code == 200:
                data = resp.json()
                infos = data.get("balance_infos", [])
                if infos:
                    info = infos[0]
                    total_bal = float(info.get("total_balance", 0.0))
                    curr = info.get("currency", "USD")
                    bal_ngn = round(total_bal * (fx_rate if curr == "USD" else fx_rate / 7.2), 2)
                    return DeepSeekLiveBalance(
                        status="connected",
                        is_available=bool(data.get("is_available", True)),
                        currency=curr,
                        total_balance=total_bal,
                        granted_balance=float(info.get("granted_balance", 0.0)),
                        topped_up_balance=float(info.get("topped_up_balance", 0.0)),
                        balance_ngn=bal_ngn,
                        message="Live DeepSeek API connection active"
                    )
            return DeepSeekLiveBalance(
                status="error",
                is_available=False,
                currency="USD",
                total_balance=0.0,
                granted_balance=0.0,
                topped_up_balance=0.0,
                balance_ngn=0.0,
                message=f"DeepSeek returned HTTP {resp.status_code}"
            )
    except Exception as e:
        return DeepSeekLiveBalance(
            status="network_error",
            is_available=False,
            currency="USD",
            total_balance=0.0,
            granted_balance=0.0,
            topped_up_balance=0.0,
            balance_ngn=0.0,
            message=str(e)
        )

@router.get("/financials", response_model=AdminFinancialReport)
async def get_admin_financials(
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns complete platform unit economics:
    - Inflows (Paystack gross deposits, payment gateway processing fees, net credits)
    - Recognized revenue from metered API usage
    - Upstream wholesale COGS (DeepSeek / Groq costs)
    - Gross & Net profit margins
    - Live DeepSeek balance & user liabilities (solvency coverage ratio)
    - Model-by-model profitability breakdown
    """
    # 1. Load Deposit Fee & FX Settings
    fee_setting = await db.get(SystemSetting, "deposit_fee_settings")
    fee_cfg = DepositFeeSettings(**fee_setting.value_json) if fee_setting and fee_setting.value_json else DepositFeeSettings()

    # 2. Inflows & Gateway Fees (Transactions)
    deposit_channels = [TransactionChannel.CARD.value, TransactionChannel.BANK_TRANSFER.value, TransactionChannel.USSD.value, "CARD", "BANK_TRANSFER", "USSD"]
    stmt_tx = select(Transaction).where(
        Transaction.status == TransactionStatus.SUCCESS,
        Transaction.channel.in_(deposit_channels)
    )
    tx_res = await db.execute(stmt_tx)
    transactions = tx_res.scalars().all()

    gross_inflow = 0.0
    gateway_fees = 0.0
    deposit_count = len(transactions)

    for tx in transactions:
        amt = float(tx.amount_ngn)
        gross_inflow += amt
        # Calculate Paystack fee for transaction
        if amt < fee_cfg.flat_fee_threshold_ngn:
            fee = amt * (fee_cfg.fee_percent / 100.0)
        else:
            fee = min(fee_cfg.fee_cap_ngn, (amt * (fee_cfg.fee_percent / 100.0)) + fee_cfg.flat_fee_ngn)
        gateway_fees += fee

    if fee_cfg.fee_strategy == "pass_through":
        net_inflow_credited = max(0.0, gross_inflow - gateway_fees)
    else:
        net_inflow_credited = gross_inflow

    avg_deposit = (gross_inflow / deposit_count) if deposit_count > 0 else 0.0

    # 3. Usage & Recognized Revenue
    stmt_usage = select(
        UsageLog.model_requested,
        func.count(UsageLog.id).label("requests"),
        func.sum(UsageLog.prompt_tokens).label("prompt_tokens"),
        func.sum(UsageLog.completion_tokens).label("completion_tokens"),
        func.sum(UsageLog.total_tokens).label("total_tokens"),
        func.sum(UsageLog.cost_deducted_ngn).label("revenue_ngn")
    ).group_by(UsageLog.model_requested)

    usage_res = await db.execute(stmt_usage)
    usage_rows = usage_res.all()

    total_recognized_revenue = 0.0
    total_tokens_consumed = 0
    total_requests = 0
    total_upstream_cogs_usd = 0.0
    total_upstream_cogs_ngn = 0.0

    model_economics: List[ModelUnitEconomics] = []

    for row in usage_rows:
        m_id = row.model_requested
        reqs = int(row.requests or 0)
        p_toks = int(row.prompt_tokens or 0)
        c_toks = int(row.completion_tokens or 0)
        t_toks = int(row.total_tokens or 0)
        rev_ngn = float(row.revenue_ngn or 0.0)

        rates = WHOLESALE_RATES_USD_PER_M.get(m_id, {"prompt": 0.14, "completion": 0.28, "name": m_id})
        cost_usd = (p_toks / 1_000_000.0 * rates["prompt"]) + (c_toks / 1_000_000.0 * rates["completion"])
        cost_ngn = cost_usd * fee_cfg.fx_rate_usd_ngn

        profit_ngn = rev_ngn - cost_ngn
        margin_pct = (profit_ngn / rev_ngn * 100.0) if rev_ngn > 0 else 0.0

        total_recognized_revenue += rev_ngn
        total_tokens_consumed += t_toks
        total_requests += reqs
        total_upstream_cogs_usd += cost_usd
        total_upstream_cogs_ngn += cost_ngn

        model_economics.append(ModelUnitEconomics(
            model_id=m_id,
            model_name=rates.get("name", m_id),
            requests=reqs,
            prompt_tokens=p_toks,
            completion_tokens=c_toks,
            total_tokens=t_toks,
            retail_revenue_ngn=round(rev_ngn, 2),
            upstream_cost_usd=round(cost_usd, 4),
            upstream_cost_ngn=round(cost_ngn, 2),
            gross_profit_ngn=round(profit_ngn, 2),
            margin_percent=round(margin_pct, 1)
        ))

    # Also list default models even if 0 usage yet
    known_models = ["indunix-1-spark", "indunix-1-core", "indunix-1-reason"]
    active_m_ids = {m.model_id for m in model_economics}
    for k in known_models:
        if k not in active_m_ids:
            rates = WHOLESALE_RATES_USD_PER_M[k]
            model_economics.append(ModelUnitEconomics(
                model_id=k,
                model_name=rates["name"],
                requests=0,
                prompt_tokens=0,
                completion_tokens=0,
                total_tokens=0,
                retail_revenue_ngn=0.0,
                upstream_cost_usd=0.0,
                upstream_cost_ngn=0.0,
                gross_profit_ngn=0.0,
                margin_percent=0.0
            ))

    # 4. Profitability & Economics
    gross_profit = total_recognized_revenue - total_upstream_cogs_ngn
    gross_margin_pct = (gross_profit / total_recognized_revenue * 100.0) if total_recognized_revenue > 0 else 0.0

    # Net Profit considers absorbed gateway processing fees
    absorbed_gateway_fees = gateway_fees if fee_cfg.fee_strategy == "absorb" else 0.0
    net_profit = gross_profit - absorbed_gateway_fees
    net_margin_pct = (net_profit / total_recognized_revenue * 100.0) if total_recognized_revenue > 0 else 0.0

    # 5. Live DeepSeek Balance & Solvency Coverage
    deepseek_bal = await fetch_deepseek_balance(fee_cfg.fx_rate_usd_ngn)

    liabilities_res = await db.execute(select(func.sum(Wallet.balance_ngn)))
    user_liabilities = float(liabilities_res.scalar() or 0.0)

    solvency_ratio = (deepseek_bal.balance_ngn / user_liabilities) if user_liabilities > 0 else 1.0

    return AdminFinancialReport(
        gross_inflow_ngn=round(gross_inflow, 2),
        gateway_fees_ngn=round(gateway_fees, 2),
        net_inflow_credited_ngn=round(net_inflow_credited, 2),
        deposit_count=deposit_count,
        avg_deposit_amount_ngn=round(avg_deposit, 2),
        recognized_revenue_ngn=round(total_recognized_revenue, 2),
        total_tokens_consumed=total_tokens_consumed,
        total_requests=total_requests,
        upstream_cogs_usd=round(total_upstream_cogs_usd, 4),
        upstream_cogs_ngn=round(total_upstream_cogs_ngn, 2),
        fx_rate_usd_ngn=fee_cfg.fx_rate_usd_ngn,
        gross_profit_ngn=round(gross_profit, 2),
        gross_margin_percent=round(gross_margin_pct, 1),
        net_profit_ngn=round(net_profit, 2),
        net_margin_percent=round(net_margin_pct, 1),
        deepseek_balance=deepseek_bal,
        user_liabilities_ngn=round(user_liabilities, 2),
        solvency_coverage_ratio=round(solvency_ratio, 2),
        deposit_fee_settings=fee_cfg,
        model_economics=model_economics
    )

@router.put("/financials/deposit-fee-settings", response_model=DepositFeeSettings)
async def update_deposit_fee_settings(
    payload: DepositFeeSettings,
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates platform deposit fee strategy:
    - absorb: Indunix AI absorbs gateway fee (deducted from gross margin - recommended)
    - pass_through: User pays gateway fee at checkout
    - Configures fee percentage, flat fee, threshold, and USD/NGN FX rate.
    """
    setting = await db.get(SystemSetting, "deposit_fee_settings")
    cfg_data = payload.model_dump()

    if not setting:
        setting = SystemSetting(key="deposit_fee_settings", value_json=cfg_data)
        db.add(setting)
    else:
        setting.value_json = cfg_data

    await db.commit()
    return DepositFeeSettings(**cfg_data)

@router.post("/financials/refresh-deepseek-balance", response_model=DeepSeekLiveBalance)
async def refresh_deepseek_balance_endpoint(
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Triggers an immediate live ping to the DeepSeek API balance endpoint."""
    fee_setting = await db.get(SystemSetting, "deposit_fee_settings")
    fx_rate = fee_setting.value_json.get("fx_rate_usd_ngn", 1500.0) if fee_setting and fee_setting.value_json else 1500.0
    return await fetch_deepseek_balance(fx_rate)

@router.post("/financials/fx-rate")
@router.put("/financials/fx-rate")
async def update_fx_rate(
    payload: AdminFxRateUpdate,
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the USD/NGN exchange rate benchmark directly.
    Instantly re-calibrates upstream wholesale API costs (DeepSeek/Groq in USD),
    recognized gross profit margins, and live reserve valuations in Naira.
    """
    if payload.fx_rate_usd_ngn <= 0:
        raise HTTPException(status_code=400, detail="Exchange rate must be greater than zero.")

    setting = await db.get(SystemSetting, "deposit_fee_settings")
    if not setting:
        cfg_data = {
            "fee_strategy": "absorb",
            "fee_percent": 1.5,
            "flat_fee_ngn": 100.0,
            "flat_fee_threshold_ngn": 2500.0,
            "fee_cap_ngn": 2000.0,
            "fx_rate_usd_ngn": float(payload.fx_rate_usd_ngn)
        }
        setting = SystemSetting(key="deposit_fee_settings", value_json=cfg_data)
        db.add(setting)
    else:
        cfg_data = dict(setting.value_json or {})
        cfg_data["fx_rate_usd_ngn"] = float(payload.fx_rate_usd_ngn)
        setting.value_json = cfg_data

    await db.commit()
    return {
        "status": "success",
        "message": f"USD/NGN FX benchmark updated to ₦{payload.fx_rate_usd_ngn:,.2f}.",
        "fx_rate_usd_ngn": float(payload.fx_rate_usd_ngn)
    }

# =========================================================================
# 7. SMTP & Outbound Email Configuration Gate
# =========================================================================

@router.get("/smtp", response_model=AdminSmtpSettings)
async def get_admin_smtp_settings(
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves active SMTP mail server settings (passwords masked for security)."""
    setting = await db.get(SystemSetting, "smtp_settings")
    cfg = setting.value_json if setting and setting.value_json else {}

    host = cfg.get("host") or email_service.host or settings.SMTP_HOST
    port = int(cfg.get("port") or email_service.port or settings.SMTP_PORT or 465)
    user_addr = cfg.get("user") or email_service.user or settings.SMTP_USER
    raw_pass = cfg.get("password") or email_service.password or settings.SMTP_PASSWORD
    from_email = cfg.get("from_email") or email_service.from_email or settings.SMTP_FROM_EMAIL or "notifications@indunixai.com"
    from_name = cfg.get("from_name") or email_service.from_name or settings.SMTP_FROM_NAME or "Indunix AI"
    use_ssl = cfg.get("use_ssl", email_service.use_ssl if email_service.use_ssl is not None else settings.SMTP_USE_SSL)
    use_tls = cfg.get("use_tls", email_service.use_tls if email_service.use_tls is not None else settings.SMTP_USE_TLS)

    is_configured = bool(host and user_addr and raw_pass)
    masked_pass = mask_key(raw_pass) if raw_pass else None

    return AdminSmtpSettings(
        host=host,
        port=port,
        user=user_addr,
        password=masked_pass,
        from_email=from_email,
        from_name=from_name,
        use_ssl=use_ssl,
        use_tls=use_tls,
        is_configured=is_configured
    )

@router.post("/smtp", response_model=AdminSmtpSettings)
async def update_admin_smtp_settings(
    payload: AdminSmtpUpdateRequest,
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Saves new SMTP mail server credentials and updates runtime email service dynamically."""
    setting = await db.get(SystemSetting, "smtp_settings")
    current_cfg = setting.value_json if setting and setting.value_json else {}

    # If password was not passed or left masked, retain previous password
    new_password = payload.password
    if not new_password or new_password.startswith("••••") or "••••" in new_password:
        new_password = current_cfg.get("password") or email_service.password or settings.SMTP_PASSWORD

    cfg_data = {
        "host": payload.host.strip(),
        "port": payload.port,
        "user": payload.user.strip(),
        "password": new_password,
        "from_email": (payload.from_email or "notifications@indunixai.com").strip(),
        "from_name": (payload.from_name or "Indunix AI").strip(),
        "use_ssl": payload.use_ssl if payload.use_ssl is not None else True,
        "use_tls": payload.use_tls if payload.use_tls is not None else False
    }

    if not setting:
        setting = SystemSetting(key="smtp_settings", value_json=cfg_data)
        db.add(setting)
    else:
        setting.value_json = cfg_data

    await db.commit()

    # Update runtime email service immediately
    email_service.update_config(cfg_data)

    is_configured = bool(cfg_data["host"] and cfg_data["user"] and cfg_data["password"])
    return AdminSmtpSettings(
        host=cfg_data["host"],
        port=cfg_data["port"],
        user=cfg_data["user"],
        password=mask_key(new_password),
        from_email=cfg_data["from_email"],
        from_name=cfg_data["from_name"],
        use_ssl=cfg_data["use_ssl"],
        use_tls=cfg_data["use_tls"],
        is_configured=is_configured
    )

@router.post("/smtp/test")
async def test_admin_smtp(
    payload: AdminSmtpTestRequest,
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Sends a live test verification email to confirm delivery."""
    setting = await db.get(SystemSetting, "smtp_settings")
    if setting and setting.value_json:
        email_service.update_config(setting.value_json)

    recipient = (payload.recipient_email or user.email).strip()
    success, message = email_service.test_connection(recipient)
    return {"success": success, "message": message, "recipient": recipient}

@router.post("/smtp/resend-receipt/{reference}")
async def resend_deposit_receipt(
    reference: str,
    user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Re-dispatches an Indunix branded invoice receipt email for an existing successful transaction."""
    tx_res = await db.execute(select(Transaction).where(Transaction.reference == reference))
    tx = tx_res.scalar_one_or_none()
    if not tx or tx.status != TransactionStatus.SUCCESS:
        raise HTTPException(status_code=404, detail="Successful transaction reference not found")

    wallet_res = await db.execute(select(Wallet).where(Wallet.id == tx.wallet_id))
    wallet = wallet_res.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    target_user_res = await db.execute(select(User).where(User.id == wallet.user_id))
    target_user = target_user_res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User associated with transaction not found")

    email_service.send_payment_receipt_email(
        to_email=target_user.email,
        full_name=target_user.full_name,
        amount_ngn=float(tx.amount_ngn),
        reference=tx.reference,
        new_balance_ngn=float(wallet.balance_ngn),
        channel=tx.channel or "BANK_TRANSFER"
    )
    return {
        "success": True,
        "message": f"Payment receipt for ₦{float(tx.amount_ngn):,.2f} dispatched to {target_user.email}."
    }
