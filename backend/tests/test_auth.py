import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.core.database import init_db

@pytest.mark.asyncio
async def test_auth_registration_and_login():
    await init_db()
    transport = ASGITransport(app=app)
    email = f"dev_{uuid.uuid4().hex[:8]}@axion.ng"
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register new user
        reg_payload = {
            "email": email,
            "password": "Password123!Safe",
            "full_name": "Tunde Alabi",
            "company_name": "Lagos Tech Labs"
        }
        res = await client.post("/api/auth/register", json=reg_payload)
        assert res.status_code == 201, res.text
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == email

        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Check me
        me_res = await client.get("/api/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["full_name"] == "Tunde Alabi"

        # Check wallet bonus ₦1,000 credits
        wallet_res = await client.get("/api/billing/wallet", headers=headers)
        assert wallet_res.status_code == 200
        wallet_data = wallet_res.json()
        assert wallet_data["bonus_credits_ngn"] == 1000.0
        assert wallet_data["total_available_ngn"] >= 1000.0
