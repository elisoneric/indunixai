import hmac
import hashlib
import json
import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.core.config import settings
from backend.core.database import init_db

@pytest.mark.asyncio
async def test_paystack_deposit_and_webhook():
    await init_db()
    transport = ASGITransport(app=app)
    email = f"paystack_{uuid.uuid4().hex[:8]}@axion.ng"
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register user
        reg = await client.post("/api/auth/register", json={
            "email": email,
            "password": "Password123!",
            "full_name": "Paystack Tester"
        })
        assert reg.status_code == 201, reg.text
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Initialize deposit of ₦5,000
        dep_res = await client.post("/api/billing/deposit", json={"amount_ngn": 5000.0}, headers=headers)
        assert dep_res.status_code == 200
        dep_data = dep_res.json()
        assert "reference" in dep_data
        ref = dep_data["reference"]

        # Simulate Paystack Webhook with HMAC SHA-512 signature
        webhook_body = {
            "event": "charge.success",
            "data": {
                "reference": ref,
                "amount": 500000, # 5,000 NGN in kobo
                "channel": "card",
                "customer": {"email": email}
            }
        }
        body_bytes = json.dumps(webhook_body).encode("utf-8")
        signature = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode("utf-8"),
            body_bytes,
            hashlib.sha512
        ).hexdigest()

        hook_res = await client.post(
            "/api/billing/webhook",
            content=body_bytes,
            headers={"x-paystack-signature": signature, "Content-Type": "application/json"}
        )
        assert hook_res.status_code == 200
        assert hook_res.json()["status"] == "success"

        # Verify wallet credited
        wallet_res = await client.get("/api/billing/wallet", headers=headers)
        wallet = wallet_res.json()
        assert wallet["balance_ngn"] == 5000.0

        # Test Virtual Account retrieval endpoint
        va_res = await client.get("/api/billing/virtual-account", headers=headers)
        assert va_res.status_code == 200
        va_data = va_res.json()
        assert "is_assigned" in va_data or "bank_name" in va_data or "error" in va_data

        # Test Virtual Account provisioning endpoint
        prov_res = await client.post(
            "/api/billing/virtual-account/provision",
            json={"phone": "08012345678", "nin_or_bvn": "12345678901"},
            headers=headers
        )
        assert prov_res.status_code == 200

        # Test direct Dedicated Account Bank Transfer (NO pre-existing transaction reference)
        dva_ref = f"dva_transfer_{uuid.uuid4().hex[:10]}"
        dva_webhook_body = {
            "event": "charge.success",
            "data": {
                "reference": dva_ref,
                "amount": 50000, # 500 NGN in kobo
                "channel": "dedicated_nuban",
                "customer": {"email": email, "customer_code": "CUS_test_123"},
                "dedicated_account": {"account_number": "9998887776"}
            }
        }
        dva_bytes = json.dumps(dva_webhook_body).encode("utf-8")
        dva_sig = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode("utf-8"),
            dva_bytes,
            hashlib.sha512
        ).hexdigest()

        dva_hook_res = await client.post(
            "/api/billing/webhook",
            content=dva_bytes,
            headers={"x-paystack-signature": dva_sig, "Content-Type": "application/json"}
        )
        assert dva_hook_res.status_code == 200
        assert dva_hook_res.json()["status"] == "success"

        # Verify wallet credited by additional ₦500
        wallet_res2 = await client.get("/api/billing/wallet", headers=headers)
        wallet2 = wallet_res2.json()
        assert wallet2["balance_ngn"] == 5500.0

        # Test sync-bank-transfers with empty body (auto-sync)
        sync_res = await client.post("/api/billing/sync-bank-transfers", json={}, headers=headers)
        assert sync_res.status_code == 200, sync_res.text
        sync_data = sync_res.json()
        assert sync_data["status"] in ("success", "error")
        assert "credited_count" in sync_data

        # Test sync-bank-transfers with already processed reference
        sync_ref_res = await client.post(
            "/api/billing/sync-bank-transfers",
            json={"reference": dva_ref},
            headers=headers
        )
        assert sync_ref_res.status_code == 200, sync_ref_res.text
        sync_ref_data = sync_ref_res.json()
        assert sync_ref_data["status"] == "success"
        assert "already verified" in sync_ref_data["message"]

