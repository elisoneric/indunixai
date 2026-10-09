import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.core.config import settings
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.models.user import User
from backend.models.wallet import Wallet, Transaction
from backend.models.api_key import ApiKey
from backend.models.usage import UsageLog
from backend.models.enterprise import EnterpriseContract

router = APIRouter(prefix="/api/admin", tags=["Admin Platform Management"])

class AdminConfigUpdate(BaseModel):
    paystack_secret_key: Optional[str] = None
    paystack_public_key: Optional[str] = None
    deepseek_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    together_api_key: Optional[str] = None
    live_production_mode: Optional[bool] = None

def mask_key(k: Optional[str]) -> str:
    if not k:
        return ""
    if len(k) <= 8:
        return "••••••••"
    return f"{k[:5]}••••••••{k[-4:]}"

@router.get("/config")
async def get_admin_config(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns platform configuration, payment keys, and upstream AI credentials.
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
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates active Paystack keys, upstream AI provider keys, and switches to live mode.
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

@router.get("/metrics")
async def get_admin_metrics(
    user: User = Depends(get_current_user),
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
