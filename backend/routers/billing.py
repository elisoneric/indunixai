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
from backend.schemas.billing import DepositRequest, DepositResponse, TransactionOut, ManualVerifyRequest
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
    """
    result = await db.execute(select(Transaction).where(Transaction.reference == reference))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction reference not found")

    if tx.status == TransactionStatus.SUCCESS:
        return {"status": "success", "message": "Transaction already verified", "reference": reference}

    paystack_res = await paystack_service.verify_with_paystack_api(reference)
    if paystack_res.get("status") == "success":
        amount = paystack_res.get("amount_ngn") or float(tx.amount_ngn)
        success, msg = await paystack_service.process_successful_charge(
            db=db,
            reference=reference,
            amount_ngn=round(amount, 2),
            channel=paystack_res.get("channel", tx.channel),
            metadata=paystack_res.get("metadata", {})
        )
        return {"status": "success", "message": msg, "reference": reference, "amount_ngn": amount}
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
