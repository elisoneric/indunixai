import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.core.database import init_db, AsyncSessionLocal
from backend.models.enterprise import EnterpriseContract, ContractStatus, BillingCycle

@pytest.mark.asyncio
async def test_enterprise_inquiry_and_telemetry():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test Enterprise Sales Inquiry
        inquiry_res = await client.post(
            "/api/enterprise/inquire",
            json={
                "full_name": "Alhaji Danladi",
                "company_name": "Apex Sovereign Banking Ltd",
                "email": "danladi@apexbank.ng",
                "phone": "+2348031122334",
                "deployment_type": "On-Premise Dedicated Edge Node",
                "estimated_volume": "500M+ tokens/month",
                "notes": "Need sovereign deployment in Lagos data center."
            }
        )
        assert inquiry_res.status_code == 201
        inquiry_data = inquiry_res.json()
        assert inquiry_data["status"] == "success"
        assert "inquiry_id" in inquiry_data

        # 2. Insert test enterprise contract directly into DB
        import uuid
        test_license_key = f"INDUNIX-TEST-CORP-{uuid.uuid4().hex[:8]}"
        async with AsyncSessionLocal() as session:
            test_contract = EnterpriseContract(
                organization_name="Apex Sovereign Banking Ltd",
                contact_email="danladi@apexbank.ng",
                license_key=test_license_key,
                contract_status=ContractStatus.ACTIVE,
                fixed_monthly_retainer_ngn=15000000.0,
                monthly_included_tokens=500000000,
                billing_cycle=BillingCycle.MONTHLY,
                active_until=datetime.now(timezone.utc) + timedelta(days=365)
            )
            session.add(test_contract)
            await session.commit()

        # 3. Valid heartbeat from on-prem host
        hb_res = await client.post(
            "/v1/enterprise/heartbeat",
            json={
                "license_key": test_license_key,
                "machine_fingerprint": "AMD-EPYC-9654-SERVER-NODE-01",
                "uptime_hours": 320.5
            }
        )
        assert hb_res.status_code == 200
        hb_data = hb_res.json()
        assert hb_data["status"] == "AUTHORIZED"
        assert hb_data["lease_token"] is not None
        assert "expires_at" in hb_data

        # 4. Invalid heartbeat
        bad_hb = await client.post(
            "/v1/enterprise/heartbeat",
            json={
                "license_key": "INDUNIX-INVALID-KEY-XYZ",
                "machine_fingerprint": "UNAUTHORIZED-MACHINE",
                "uptime_hours": 1.0
            }
        )
        assert bad_hb.status_code == 200
        assert bad_hb.json()["status"] == "UNAUTHORIZED"
