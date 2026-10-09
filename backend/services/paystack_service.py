import uuid
from typing import Dict, Any, Tuple
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.config import settings
from backend.models.wallet import Wallet, Transaction, TransactionStatus, TransactionChannel

class PaystackService:
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.base_url = settings.PAYSTACK_BASE_URL

    async def initialize_deposit(
        self,
        db: AsyncSession,
        user_id: str,
        user_email: str,
        amount_ngn: float,
        channel: str = "CARD",
        callback_url: str = "http://localhost:5173/console/billing"
    ) -> Dict[str, Any]:
        """
        Initializes a Paystack deposit transaction.
        Creates a PENDING Transaction record in DB.
        """
        # Fetch wallet
        wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
        wallet = wallet_res.scalar_one_or_none()
        if not wallet:
            raise ValueError("Wallet does not exist.")

        reference = f"axion_dep_{uuid.uuid4().hex[:12]}_{int(amount_ngn)}"

        # Save pending transaction in database
        tx = Transaction(
            wallet_id=wallet.id,
            reference=reference,
            amount_ngn=amount_ngn,
            channel=channel,
            status=TransactionStatus.PENDING,
            metadata_json={"user_email": user_email, "initiated_via": "console"}
        )
        db.add(tx)
        await db.commit()

        # If real Paystack key is supplied (starts with 'sk_live_' or 'sk_test_' and not default mock), call Paystack API
        if self.secret_key and not self.secret_key.startswith("sk_test_axion_sovereign_mock"):
            try:
                headers = {
                    "Authorization": f"Bearer {self.secret_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "email": user_email,
                    "amount": int(amount_ngn * 100), # Paystack accepts amount in kobo
                    "reference": reference,
                    "callback_url": callback_url,
                    "metadata": {"wallet_id": wallet.id, "user_id": user_id}
                }
                async with httpx.AsyncClient() as client:
                    resp = await client.post(f"{self.base_url}/transaction/initialize", json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json().get("data", {})
                        return {
                            "authorization_url": data.get("authorization_url", f"https://checkout.paystack.com/{reference}"),
                            "access_code": data.get("access_code", f"acc_{reference}"),
                            "reference": reference,
                            "amount_ngn": amount_ngn
                        }
            except Exception:
                pass

        # Fast test authorization URL
        return {
            "authorization_url": f"https://checkout.paystack.com/{reference}",
            "access_code": f"acc_{reference}",
            "reference": reference,
            "amount_ngn": amount_ngn
        }

    async def verify_with_paystack_api(self, reference: str) -> Dict[str, Any]:
        """Queries Paystack API directly to verify transaction status."""
        if not self.secret_key or self.secret_key.startswith("sk_test_axion_sovereign_mock"):
            return {"status": "success", "amount_ngn": 0, "mock": True}
        try:
            headers = {
                "Authorization": f"Bearer {self.secret_key}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/transaction/verify/{reference}", headers=headers)
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    return {
                        "status": data.get("status"),
                        "amount_ngn": round(data.get("amount", 0) / 100.0, 2),
                        "channel": data.get("channel", "CARD").upper(),
                        "paid_at": data.get("paid_at"),
                        "metadata": data
                    }
                return {"status": "failed", "error": f"Paystack returned {resp.status_code}"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    async def process_successful_charge(
        self,
        db: AsyncSession,
        reference: str,
        amount_ngn: float,
        channel: str = "CARD",
        metadata: Dict[str, Any] = None
    ) -> Tuple[bool, str]:
        """
        Idempotently credits the user's wallet upon verified payment.
        """
        # Check transaction
        tx_res = await db.execute(select(Transaction).where(Transaction.reference == reference).with_for_update())
        tx = tx_res.scalar_one_or_none()

        if not tx:
            return False, "Transaction reference not found"

        if tx.status == TransactionStatus.SUCCESS:
            return True, "Transaction already processed"

        # Update transaction
        tx.status = TransactionStatus.SUCCESS
        if channel:
            tx.channel = channel
        if metadata:
            tx.metadata_json = metadata

        # Credit wallet (strictly 2 decimal places)
        wallet_res = await db.execute(select(Wallet).where(Wallet.id == tx.wallet_id).with_for_update())
        wallet = wallet_res.scalar_one()
        current_balance = float(wallet.balance_ngn)
        wallet.balance_ngn = round(current_balance + amount_ngn, 2)

        await db.commit()
        return True, "Wallet credited successfully"

paystack_service = PaystackService()

