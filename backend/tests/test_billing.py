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
