import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.config import settings
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.core.security import verify_paystack_signature
from backend.models.user import User
from backend.models.wallet import Wallet, Transaction, TransactionStatus
from backend.schemas.billing import (
    DepositRequest, DepositResponse, TransactionOut, ManualVerifyRequest,
    VirtualAccountProvisionRequest, SyncTransfersRequest
)
from backend.schemas.dashboard import WalletOut
from backend.services.paystack_service import paystack_service

logger = logging.getLogger(__name__)

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
    payload: Optional[SyncTransfersRequest] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Actively queries Paystack for recent bank transfers made to this user's dedicated account,
    or verifies a specific transfer reference passed by the user, ensuring any transfers
    not yet credited via webhook are immediately processed.
    """
    wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = wallet_res.scalar_one_or_none()
    if not wallet:
        return {"status": "error", "message": "Wallet not found", "credited_count": 0, "total_credited_ngn": 0.0}

    # 1. If user supplied a specific transaction reference to verify, check DB first
    manual_ref = payload.reference.strip() if (payload and payload.reference) else None
    if manual_ref:
        check_res = await db.execute(select(Transaction).where(Transaction.reference == manual_ref))
        existing_tx = check_res.scalar_one_or_none()
        if existing_tx and existing_tx.status == TransactionStatus.SUCCESS:
            await db.refresh(wallet)
            return {
                "status": "success",
                "message": f"Transfer reference {manual_ref} is already verified and credited.",
                "credited_count": 0,
                "total_credited_ngn": 0.0,
                "new_balance_ngn": float(wallet.balance_ngn)
            }

    secret_key = settings.PAYSTACK_SECRET_KEY
    if not secret_key:
        return {
            "status": "error",
            "message": "Paystack gateway is not configured on server",
            "credited_count": 0,
            "total_credited_ngn": 0.0,
            "new_balance_ngn": float(wallet.balance_ngn)
        }

    credited_count = 0
    total_credited_ngn = 0.0

    try:
        import httpx
        headers = {"Authorization": f"Bearer {secret_key}", "Content-Type": "application/json"}

        if manual_ref:
            # Verify unconfirmed reference with Paystack API
            paystack_res = await paystack_service.verify_with_paystack_api(manual_ref)
            if paystack_res.get("status") == "success":
                amt_ngn = paystack_res.get("amount_ngn", 0.0)
                channel = paystack_res.get("channel", "BANK_TRANSFER")
                success, msg = await paystack_service.process_successful_charge(
                    db=db,
                    reference=manual_ref,
                    amount_ngn=amt_ngn,
                    channel=channel,
                    metadata=paystack_res.get("metadata", {}),
                    user_id=user.id
                )
                if success:
                    credited_count += 1
                    total_credited_ngn += amt_ngn
                    # Fresh reload of wallet
                    w_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
                    fresh_w = w_res.scalar_one_or_none()
                    return {
                        "status": "success",
                        "message": f"Successfully verified & credited ₦{amt_ngn:,.2f} for reference {manual_ref}!",
                        "credited_count": 1,
                        "total_credited_ngn": amt_ngn,
                        "new_balance_ngn": float(fresh_w.balance_ngn) if fresh_w else float(wallet.balance_ngn)
                    }
                else:
                    return {
                        "status": "error",
                        "message": msg or "Could not credit wallet with this reference",
                        "credited_count": 0,
                        "total_credited_ngn": 0.0,
                        "new_balance_ngn": float(wallet.balance_ngn)
                    }
            else:
                return {
                    "status": "error",
                    "message": paystack_res.get("error") or f"Reference {manual_ref} could not be confirmed on Paystack",
                    "credited_count": 0,
                    "total_credited_ngn": 0.0,
                    "new_balance_ngn": float(wallet.balance_ngn)
                }

        # 2. Automated sync of recent transactions for this customer from Paystack
        async with httpx.AsyncClient(timeout=15.0) as client:
            candidate_txs = []
            customer_identifier = wallet.paystack_customer_code or user.email
            cust_res = await client.get(f"{settings.PAYSTACK_BASE_URL}/customer/{customer_identifier}", headers=headers)
            cust_id = None
            if cust_res.status_code == 200:
                cust_data = cust_res.json().get("data", {})
                cust_id = cust_data.get("id")
                # Customer object on Paystack often contains recent transactions
                if isinstance(cust_data.get("transactions"), list):
                    candidate_txs.extend(cust_data.get("transactions"))

            # If integer customer ID is found, fetch customer's transactions
            if cust_id:
                tx_res = await client.get(f"{settings.PAYSTACK_BASE_URL}/transaction?customer={cust_id}&perPage=50", headers=headers)
                if tx_res.status_code == 200:
                    tx_items = tx_res.json().get("data", [])
                    if isinstance(tx_items, list):
                        candidate_txs.extend(tx_items)

            # Deduplicate candidates by reference
            seen_refs = set()
            for item in candidate_txs:
                ref = item.get("reference")
                if not ref or ref in seen_refs:
                    continue
                seen_refs.add(ref)

                if item.get("status") == "success":
                    amt_kobo = item.get("amount", 0)
                    amt_ngn = round(amt_kobo / 100.0, 2)
                    if amt_ngn > 0:
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

        # Fresh reload of wallet
        w_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
        fresh_w = w_res.scalar_one_or_none()
        current_bal = float(fresh_w.balance_ngn) if fresh_w else float(wallet.balance_ngn)

        msg = (
            f"Synced successfully. {credited_count} new transfer(s) credited (₦{total_credited_ngn:,.2f})."
            if credited_count > 0
            else "All bank transfers are up to date."
        )
        return {
            "status": "success",
            "message": msg,
            "credited_count": credited_count,
            "total_credited_ngn": total_credited_ngn,
            "new_balance_ngn": current_bal
        }
    except Exception as e:
        logger.exception("Error syncing bank transfers for user %s: %s", user.id, e)
        try:
            w_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
            w = w_res.scalar_one_or_none()
            current_bal = float(w.balance_ngn) if w else 0.0
        except Exception:
            current_bal = 0.0
        return {
            "status": "error",
            "message": f"Sync operation encountered an error: {str(e)}",
            "credited_count": credited_count,
            "total_credited_ngn": total_credited_ngn,
            "new_balance_ngn": current_bal
        }

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

@router.post("/resend-receipt/{reference}")
async def user_resend_receipt(
    reference: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Allows user to request immediate re-dispatch of their transaction receipt to their email."""
    wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = wallet_res.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    tx_res = await db.execute(
        select(Transaction).where(Transaction.reference == reference, Transaction.wallet_id == wallet.id)
    )
    tx = tx_res.scalar_one_or_none()
    if not tx or tx.status != TransactionStatus.SUCCESS:
        raise HTTPException(status_code=404, detail="Transaction not found or not yet successful")

    from backend.services.email_service import email_service
    email_service.send_payment_receipt_email(
        to_email=user.email,
        full_name=user.full_name,
        amount_ngn=float(tx.amount_ngn),
        reference=tx.reference,
        new_balance_ngn=float(wallet.balance_ngn),
        channel=tx.channel or "BANK_TRANSFER"
    )
    return {
        "status": "success",
        "message": f"Payment receipt for ₦{float(tx.amount_ngn):,.2f} has been dispatched to {user.email}."
    }
