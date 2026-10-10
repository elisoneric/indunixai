import json
from typing import List
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.core.security import verify_paystack_signature
from backend.models.user import User
from backend.models.wallet import Wallet, Transaction, TransactionStatus
from backend.schemas.billing import (
    DepositRequest, DepositResponse, TransactionOut, ManualVerifyRequest,
    VirtualAccountProvisionRequest
)
from backend.schemas.dashboard import WalletOut
from backend.services.paystack_service import paystack_service

router = APIRouter(prefix="/api/billing", tags=["Billing & Payments"])

@router.get("/wallet", response_model=WalletOut)
async def get_wallet(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    balance = float(wallet.balance_ngn)
    bonus = float(wallet.bonus_credits_ngn)
    return WalletOut(
        balance_ngn=round(balance, 2),
        bonus_credits_ngn=round(bonus, 2),
        total_available_ngn=round(balance + bonus, 2),
        currency=wallet.currency,
        is_frozen=wallet.is_frozen
    )

@router.post("/deposit", response_model=DepositResponse)
async def initialize_deposit(
    payload: DepositRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Initializes a Paystack deposit transaction."""
    try:
        res = await paystack_service.initialize_deposit(
            db=db,
            user_id=user.id,
            user_email=user.email,
            amount_ngn=round(payload.amount_ngn, 2),
            channel=payload.channel or "CARD"
        )
        return DepositResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Paystack Webhook listener.
    Secured with HMAC SHA-512 signature validation.
    """
    body_bytes = await request.body()

    # Validate HMAC SHA-512 signature
    if not verify_paystack_signature(body_bytes, x_paystack_signature or ""):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    event = payload.get("event")
    data = payload.get("data", {})

    if event == "charge.success":
        reference = data.get("reference")
        # Amount from paystack is in kobo, convert to Naira
        amount_kobo = data.get("amount", 0)
        amount_ngn = round(amount_kobo / 100.0, 2)
        channel = data.get("channel", "CARD").upper()

        if reference and amount_ngn > 0:
            success, msg = await paystack_service.process_successful_charge(
                db=db,
                reference=reference,
                amount_ngn=amount_ngn,
                channel=channel,
                metadata=data
            )
            return {"status": "success", "message": msg}

    return {"status": "ignored"}

@router.get("/verify/{reference}")
async def verify_transaction(
    reference: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verifies transaction status directly against Paystack gateway and credits user wallet.
    Supports verifying both web checkout sessions and direct Dedicated Account bank transfers.
    """
    result = await db.execute(select(Transaction).where(Transaction.reference == reference))
    tx = result.scalar_one_or_none()

    if tx and tx.status == TransactionStatus.SUCCESS:
        return {"status": "success", "message": "Transaction already verified", "reference": reference, "amount_ngn": float(tx.amount_ngn)}

    paystack_res = await paystack_service.verify_with_paystack_api(reference)
    if paystack_res.get("status") == "success":
        amount = paystack_res.get("amount_ngn") or (float(tx.amount_ngn) if tx else 0.0)
        channel = paystack_res.get("channel") or (tx.channel if tx else "BANK_TRANSFER")
        success, msg = await paystack_service.process_successful_charge(
            db=db,
            reference=reference,
            amount_ngn=round(amount, 2),
            channel=channel,
            metadata=paystack_res.get("metadata", {}),
            user_id=user.id
        )
        if success:
            return {"status": "success", "message": msg, "reference": reference, "amount_ngn": amount}
        else:
            return {"status": "error", "message": msg, "reference": reference}
    else:
        return {"status": "pending", "message": paystack_res.get("error") or "Payment pending or unconfirmed by gateway", "reference": reference}

@router.get("/virtual-account")
async def get_virtual_account(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the user's Dedicated NUBAN Virtual Account for direct bank transfer deposits.
    """
    account_info = await paystack_service.get_or_create_dedicated_account(db, user)
    return account_info

@router.post("/virtual-account/provision")
async def provision_virtual_account(
    payload: VirtualAccountProvisionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Provisions a Dedicated Virtual Account by submitting user phone and NIN/BVN KYC validation to Paystack.
    """
    account_info = await paystack_service.get_or_create_dedicated_account(
        db=db,
        user=user,
        phone=payload.phone,
        nin_or_bvn=payload.nin_or_bvn
    )
    return account_info

@router.post("/sync-bank-transfers")
async def sync_bank_transfers(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Actively queries Paystack for recent bank transfers made to this user's dedicated account,
    ensuring any transfers not yet credited via webhook are immediately processed.
    """
    secret_key = settings.PAYSTACK_SECRET_KEY
    if not secret_key:
        return {"status": "error", "message": "Paystack gateway is not configured"}

    wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = wallet_res.scalar_one_or_none()
    if not wallet:
        return {"status": "error", "message": "Wallet not found"}

    credited_count = 0
    total_credited_ngn = 0.0

    try:
        import httpx
        headers = {"Authorization": f"Bearer {secret_key}", "Content-Type": "application/json"}
        param = f"customer={wallet.paystack_customer_code}" if wallet.paystack_customer_code else f"customer={user.email}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{settings.PAYSTACK_BASE_URL}/transaction?{param}&perPage=20", headers=headers)
            if resp.status_code == 200:
                tx_list = resp.json().get("data", [])
                for item in tx_list:
                    if item.get("status") == "success":
                        ref = item.get("reference")
                        amt_kobo = item.get("amount", 0)
                        amt_ngn = round(amt_kobo / 100.0, 2)
                        if ref and amt_ngn > 0:
                            check_res = await db.execute(select(Transaction).where(Transaction.reference == ref))
                            existing_tx = check_res.scalar_one_or_none()
                            if not existing_tx or existing_tx.status != TransactionStatus.SUCCESS:
                                success, _ = await paystack_service.process_successful_charge(
                                    db=db,
                                    reference=ref,
                                    amount_ngn=amt_ngn,
                                    channel=item.get("channel", "BANK_TRANSFER").upper(),
                                    metadata=item,
                                    user_id=user.id
                                )
                                if success:
                                    credited_count += 1
                                    total_credited_ngn += amt_ngn

        await db.refresh(wallet)
        msg = f"Synced successfully. {credited_count} new transfer(s) credited (₦{total_credited_ngn:,.2f})." if credited_count > 0 else "All bank transfers are up to date."
        return {
            "status": "success",
            "message": msg,
            "credited_count": credited_count,
            "total_credited_ngn": total_credited_ngn,
            "new_balance_ngn": float(wallet.balance_ngn)
        }
    except Exception as e:
        return {"status": "error", "message": f"Sync failed: {str(e)}"}

@router.get("/transactions", response_model=List[TransactionOut])
async def list_transactions(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = wallet_res.scalar_one_or_none()
    if not wallet:
        return []

    tx_res = await db.execute(
        select(Transaction).where(Transaction.wallet_id == wallet.id).order_by(Transaction.created_at.desc())
    )
    txs = tx_res.scalars().all()
    return [TransactionOut.model_validate(t) for t in txs]
