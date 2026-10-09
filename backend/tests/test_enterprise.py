import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.core.database import init_db

@pytest.mark.asyncio
async def test_enterprise_telemetry_heartbeat():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Seed Enterprise Production Node
        seed_res = await client.post("/api/enterprise/seed-default")
        assert seed_res.status_code == 200
        contract = seed_res.json()
        assert contract["organization_name"] == "Enterprise Dedicated Infrastructure Node 01"
        license_key = contract["license_key"]

        # Valid heartbeat from on-prem host
        hb_res = await client.post(
            "/v1/enterprise/heartbeat",
            json={
                "license_key": license_key,
                "machine_fingerprint": "AMD-EPYC-9654-SERVER-NODE-01",
                "uptime_hours": 320.5
            }
        )
        assert hb_res.status_code == 200
        hb_data = hb_res.json()
        assert hb_data["status"] == "AUTHORIZED"
        assert hb_data["lease_token"] is not None
        assert "expires_at" in hb_data

        # Invalid heartbeat
        bad_hb = await client.post(
            "/v1/enterprise/heartbeat",
            json={
                "license_key": "AXION-INVALID-KEY-XYZ",
                "machine_fingerprint": "UNAUTHORIZED-MACHINE",
                "uptime_hours": 1.0
            }
        )
        assert bad_hb.status_code == 200
        assert bad_hb.json()["status"] == "UNAUTHORIZED"
