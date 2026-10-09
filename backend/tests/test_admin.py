import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.core.database import init_db

@pytest.mark.asyncio
async def test_admin_config_and_metrics():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register an admin user
        reg_res = await client.post("/api/auth/register", json={
            "email": "admin.master@axion.ng",
            "password": "MasterAdminPass123!",
            "full_name": "Axion Admin",
            "company_name": "Axion Operations"
        })
        assert reg_res.status_code in [201, 400]
        login_res = await client.post("/api/auth/login", json={
            "email": "admin.master@axion.ng",
            "password": "MasterAdminPass123!"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch Admin Config
        cfg_res = await client.get("/api/admin/config", headers=headers)
        assert cfg_res.status_code == 200
        cfg = cfg_res.json()
        assert "payment" in cfg
        assert "upstream" in cfg

        # 2. Update Admin Config
        update_res = await client.post("/api/admin/config", headers=headers, json={
            "paystack_secret_key": "sk_live_axion_production_secret_key_12345",
            "paystack_public_key": "pk_live_axion_production_public_key_12345",
            "deepseek_api_key": "sk-deepseek-live-test-123456",
            "live_production_mode": True
        })
        assert update_res.status_code == 200
        up_data = update_res.json()
        assert up_data["status"] == "success"
        assert up_data["live_production_mode"] is True

        # 3. Check Metrics
        met_res = await client.get("/api/admin/metrics", headers=headers)
        assert met_res.status_code == 200
        met = met_res.json()
        assert met["total_users"] >= 1
        assert met["live_production_mode"] is True

        # Restore test defaults
        from backend.core.config import settings
        settings.DEEPSEEK_API_KEY = None
        settings.MOCK_UPSTREAM_IF_UNSET = True
