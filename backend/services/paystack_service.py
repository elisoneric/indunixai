import uuid
from typing import Dict, Any, Tuple, Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.config import settings
from backend.models.user import User
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
        secret_key = settings.PAYSTACK_SECRET_KEY
        public_key = settings.PAYSTACK_PUBLIC_KEY

        # Fetch wallet
        wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
        wallet = wallet_res.scalar_one_or_none()
        if not wallet:
            raise ValueError("Wallet does not exist.")

        reference = f"indunix_dep_{uuid.uuid4().hex[:12]}_{int(amount_ngn)}"

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

        # Call Paystack initialize API if live/test secret key is provided
        is_real_key = bool(secret_key and not "mock" in secret_key.lower() and (secret_key.startswith("sk_live_") or secret_key.startswith("sk_test_")))
        if is_real_key:
            try:
                headers = {
                    "Authorization": f"Bearer {secret_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "email": user_email,
                    "amount": int(amount_ngn * 100), # Paystack accepts amount in kobo
                    "reference": reference,
                    "callback_url": callback_url or f"{settings.APP_URL}/console/billing",
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
                            "amount_ngn": amount_ngn,
                            "public_key": public_key
                        }
            except Exception:
                pass

        return {
            "authorization_url": f"https://checkout.paystack.com/{reference}",
            "access_code": f"acc_{reference}",
            "reference": reference,
            "amount_ngn": amount_ngn,
            "public_key": public_key
        }

    async def verify_with_paystack_api(self, reference: str) -> Dict[str, Any]:
        """Queries Paystack API directly to verify transaction status."""
        secret_key = settings.PAYSTACK_SECRET_KEY
        if not secret_key:
            return {"status": "failed", "error": "Paystack secret key is not configured on server."}

        try:
            headers = {
                "Authorization": f"Bearer {secret_key}",
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

    async def get_or_create_dedicated_account(
        self,
        db: AsyncSession,
        user: User,
        phone: Optional[str] = None,
        nin_or_bvn: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves or provisions a Paystack Dedicated NUBAN Virtual Account for direct bank transfer deposits.
        Strictly interfaces with Paystack API. Zero mock fallbacks.
        """
        # 1. Check if user already has an assigned dedicated account on their Wallet
        wallet_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
        wallet = wallet_res.scalar_one_or_none()

        if wallet and wallet.dedicated_account_number:
            return {
                "bank_name": wallet.dedicated_account_bank or "Wema Bank",
                "account_number": wallet.dedicated_account_number,
                "account_name": wallet.dedicated_account_name or f"INDUNIX AI / {user.full_name}",
                "currency": "NGN",
                "is_assigned": True
            }

        secret_key = settings.PAYSTACK_SECRET_KEY
        if not secret_key or not (secret_key.startswith("sk_live_") or secret_key.startswith("sk_test_")):
            return {
                "is_assigned": False,
                "error": "Paystack Secret Key is not configured on the production server."
            }

        try:
            headers = {"Authorization": f"Bearer {secret_key}", "Content-Type": "application/json"}
            async with httpx.AsyncClient(timeout=12.0) as client:
                # 1. Create or fetch customer on Paystack
                name_parts = (user.full_name or "Enterprise User").split()
                first_name = name_parts[0]
                last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "Tech"
                cust_payload = {
                    "email": user.email,
                    "first_name": first_name,
                    "last_name": last_name
                }
                if phone:
                    cust_payload["phone"] = phone

                cust_res = await client.post(f"{self.base_url}/customer", json=cust_payload, headers=headers)
                cust_data = cust_res.json().get("data", {}) if cust_res.status_code in (200, 201) else {}
                cust_code = cust_data.get("customer_code") or (wallet.paystack_customer_code if wallet else None)

                if not cust_code:
                    err_msg = cust_res.json().get("message", "Unable to create or locate customer record on Paystack.")
                    return {"is_assigned": False, "error": err_msg}

                if wallet and not wallet.paystack_customer_code:
                    wallet.paystack_customer_code = cust_code
                    await db.commit()

                # 2. If NIN or BVN was provided by user, submit KYC identification to Paystack
                if nin_or_bvn:
                    clean_val = nin_or_bvn.strip()
                    ident_payload = {
                        "country": "NG",
                        "type": "bvn" if len(clean_val) == 11 and clean_val.isdigit() else "nin",
                        "value": clean_val,
                        "first_name": first_name,
                        "last_name": last_name
                    }
                    if phone:
                        ident_payload["phone"] = phone
                    await client.post(
                        f"{self.base_url}/customer/{cust_code}/identification",
                        json=ident_payload,
                        headers=headers
                    )

                # 3. Request Dedicated Virtual Account from Paystack (Wema Bank or Titan Paystack)
                dva_res = await client.post(
                    f"{self.base_url}/dedicated_account",
                    json={"customer": cust_code, "preferred_bank": "wema-bank"},
                    headers=headers
                )

                if dva_res.status_code in (200, 201):
                    dva_json = dva_res.json()
                    if dva_json.get("status"):
                        dva_data = dva_json.get("data", {})
                        bank_name = dva_data.get("bank", {}).get("name", "Wema Bank")
                        account_number = dva_data.get("account_number")
                        account_name = dva_data.get("account_name", f"INDUNIX AI / {user.full_name}")

                        if account_number and wallet:
                            wallet.dedicated_account_bank = bank_name
                            wallet.dedicated_account_number = account_number
                            wallet.dedicated_account_name = account_name
                            await db.commit()

                        return {
                            "bank_name": bank_name,
                            "account_number": account_number,
                            "account_name": account_name,
                            "currency": "NGN",
                            "is_assigned": True
                        }

                # If Paystack returned an error
                err_body = dva_res.json()
                msg = err_body.get("message", "Failed to assign dedicated account on Paystack")
                requires_kyc = "identification" in msg.lower() or "bvn" in msg.lower() or "nin" in msg.lower() or "phone" in msg.lower()
                return {
                    "is_assigned": False,
                    "requires_kyc": requires_kyc,
                    "error": msg
                }
        except Exception as e:
            return {"is_assigned": False, "error": f"Gateway network error: {str(e)}"}

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

        # Dispatch automated payment receipt email
        try:
            user_res = await db.execute(select(User).where(User.id == wallet.user_id))
            user = user_res.scalar_one_or_none()
            if user:
                from backend.services.email_service import email_service
                email_service.send_payment_receipt_email(
                    to_email=user.email,
                    full_name=user.full_name,
                    amount_ngn=amount_ngn,
                    reference=reference,
                    new_balance_ngn=float(wallet.balance_ngn),
                    channel=channel or "CARD"
                )
        except Exception:
            pass

        return True, "Wallet credited successfully"

paystack_service = PaystackService()

