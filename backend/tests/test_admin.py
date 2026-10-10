import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from backend.main import app
from backend.core.database import init_db, AsyncSessionLocal
from backend.models.user import User, UserRole
from backend.models.system_setting import SystemSetting
from backend.core.security import hash_password

async def reset_admin_and_promo_state():
    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(User).where((User.username == "indunixai") | (User.email == "admin@indunixai.com"))
        )
        admin = res.scalar_one_or_none()
        if admin:
            admin.hashed_password = hash_password("Password@26")
            admin.must_change_password = True
            admin.role = UserRole.SUPERADMIN
        setting = await session.get(SystemSetting, "promo_campaigns")
        if setting:
            await session.delete(setting)
        await session.commit()

@pytest.mark.asyncio
async def test_admin_full_workflow():
    await init_db()
    await reset_admin_and_promo_state()
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Admin Login with default seeded credentials: username indunixai / password Password@26
            login_res = await client.post("/api/admin/login", json={
                "identifier": "indunixai",
                "password": "Password@26"
            })
            assert login_res.status_code == 200, f"Login failed: {login_res.text}"
            login_data = login_res.json()
            assert login_data["must_change_password"] is True
            admin_token = login_data["access_token"]
            admin_headers = {"Authorization": f"Bearer {admin_token}"}

            # 2. Complete Mandatory First-Login Password Change
            change_res = await client.post("/api/admin/change-initial-password", headers=admin_headers, json={
                "new_password": "NewAdminSecurePassword@2026!"
            })
            assert change_res.status_code == 200
            new_token = change_res.json()["access_token"]
            admin_headers = {"Authorization": f"Bearer {new_token}"}

            # Verify next login uses new password and must_change_password is False
            re_login_res = await client.post("/api/admin/login", json={
                "identifier": "indunixai",
                "password": "NewAdminSecurePassword@2026!"
            })
            assert re_login_res.status_code == 200
            assert re_login_res.json()["must_change_password"] is False

            # 3. Fetch Admin Config & Metrics
            cfg_res = await client.get("/api/admin/config", headers=admin_headers)
            assert cfg_res.status_code == 200
            cfg = cfg_res.json()
            assert "payment" in cfg
            assert "upstream" in cfg

            met_res = await client.get("/api/admin/metrics", headers=admin_headers)
            assert met_res.status_code == 200
            assert "total_users" in met_res.json()

            # 4. List Users & Credit Bonus Adjustment
            users_res = await client.get("/api/admin/users", headers=admin_headers)
            assert users_res.status_code == 200
            users_data = users_res.json()
            assert users_data["total"] >= 1
            first_user = users_data["users"][0]

            # Grant ₦5,000 promo credit bonus
            credit_res = await client.post(
                f"/api/admin/users/{first_user['id']}/adjust-credits",
                headers=admin_headers,
                json={
                    "amount_ngn": 5000.0,
                    "credit_type": "bonus",
                    "reason": "Enterprise Onboarding Test Grant",
                    "notify_user": False
                }
            )
            assert credit_res.status_code == 200
            assert credit_res.json()["status"] == "success"

            # 5. Dynamic Pricing Adjustment
            pricing_res = await client.put("/api/admin/pricing", headers=admin_headers, json={
                "models": {
                    "indunix-1-spark": {
                        "prompt_per_million": 950.0,
                        "completion_per_million": 1100.0
                    }
                }
            })
            assert pricing_res.status_code == 200
            assert pricing_res.json()["pricing"]["indunix-1-spark"]["prompt_per_million"] == 950.0

            # 6. Promo Campaign Configuration
            promos_res = await client.put("/api/admin/promos", headers=admin_headers, json={
                "signup_bonus_ngn": 2500.0,
                "sale_active": True,
                "sale_title": "Independence Day AI Fest",
                "sale_discount_percent": 20.0,
                "banner_active": True,
                "banner_text": "20% Discount Live for All Nigerian Startups!"
            })
            assert promos_res.status_code == 200
            p_data = promos_res.json()
            assert p_data["signup_bonus_ngn"] == 2500.0
            assert p_data["sale_active"] is True

            # Check public promotions endpoint
            pub_promo_res = await client.get("/api/auth/promotions")
            assert pub_promo_res.status_code == 200
            assert pub_promo_res.json()["signup_bonus_ngn"] == 2500.0

            # 7. FX Rate Benchmark & Financials Recalculation
            fx_res = await client.post("/api/admin/financials/fx-rate", headers=admin_headers, json={
                "fx_rate_usd_ngn": 1580.0
            })
            assert fx_res.status_code == 200
            assert fx_res.json()["fx_rate_usd_ngn"] == 1580.0

            fin_res = await client.get("/api/admin/financials", headers=admin_headers)
            assert fin_res.status_code == 200
            assert fin_res.json()["fx_rate_usd_ngn"] == 1580.0

            # 8. Security: Verify non-admin developer user is rejected with 403 Forbidden
            dev_email = f"dev_{uuid.uuid4().hex[:8]}@indunixai.com"
            reg_dev = await client.post("/api/auth/register", json={
                "email": dev_email,
                "password": "DevPassword123!",
                "full_name": "Standard Dev"
            })
            assert reg_dev.status_code == 201
            dev_token = reg_dev.json()["access_token"]
            dev_headers = {"Authorization": f"Bearer {dev_token}"}

            forbidden_res = await client.get("/api/admin/config", headers=dev_headers)
            assert forbidden_res.status_code == 403
            assert "Administrative privileges required" in forbidden_res.json()["detail"]
    finally:
        await reset_admin_and_promo_state()
