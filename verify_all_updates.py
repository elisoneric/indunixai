import asyncio
import httpx
import json

async def main():
    print("=" * 60)
    print("VERIFYING AXION PLATFORM UPDATES")
    print("=" * 60)

    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        # 1. Health check
        h = await client.get("/health")
        print(f"[1] Health Check: {h.status_code} -> {h.json()}")

        # 2. Register / login user
        email = f"prod.admin.{asyncio.get_event_loop().time()}@axion.ng"
        reg = await client.post("/api/auth/register", json={
            "email": email,
            "password": "Password123!",
            "full_name": "Executive Director",
            "company_name": "Sovereign Corp"
        })
        print(f"[2] Registration: {reg.status_code}")
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Check Wallet (Must be 2 decimal places)
        wallet = (await client.get("/api/billing/wallet", headers=headers)).json()
        print(f"[3] Wallet Balance: NGN {wallet['balance_ngn']:.2f}, Bonus: NGN {wallet['bonus_credits_ngn']:.2f}")
        assert isinstance(wallet['balance_ngn'], float)
        assert wallet['bonus_credits_ngn'] == 1000.00

        # 4. Check Admin Config Endpoint
        cfg = (await client.get("/api/admin/config", headers=headers)).json()
        print(f"[4] Admin Config: Payment gateway = '{cfg['payment']['gateway']}', Live mode = {cfg['upstream']['live_production_mode']}")

        # 5. Check Admin Metrics Endpoint
        met = (await client.get("/api/admin/metrics", headers=headers)).json()
        print(f"[5] Admin Metrics: Total users = {met['total_users']}, Ledger = NGN {met['total_ledger_balance_ngn']:.2f}")

        # 6. Update Admin Config (Live payment keys & upstream keys)
        up = await client.post("/api/admin/config", headers=headers, json={
            "paystack_secret_key": "sk_live_axion_production_test_99",
            "paystack_public_key": "pk_live_axion_production_test_99",
            "deepseek_api_key": "sk-deepseek-prod-test-key",
            "live_production_mode": True
        })
        print(f"[6] Admin Config Update: {up.json()}")
        assert up.json()["status"] == "success"

        # 7. Check Enterprise Contracts (Zero TrustBricks)
        contracts = (await client.get("/api/enterprise/contracts")).json()
        print(f"[7] Enterprise Contracts: Found {len(contracts)} contract(s)")
        for c in contracts:
            print(f"    - Org: {c['organization_name']}, License: {c['license_key']}, Retainer: NGN {c['fixed_monthly_retainer_ngn']:.2f}")
            assert "TrustBricks" not in c['organization_name'], "TrustBricks leaked in enterprise contract!"

        # 8. Test Paystack Deposit initialization with 2 decimals
        dep = (await client.post("/api/billing/deposit", headers=headers, json={
            "amount_ngn": 5000.00,
            "channel": "CARD"
        })).json()
        print(f"[8] Paystack Deposit Init: Ref = {dep['reference']}, Amount = NGN {dep['amount_ngn']:.2f}")
        assert dep['amount_ngn'] == 5000.00

        # 9. Verify Deposit
        ver = (await client.get(f"/api/billing/verify/{dep['reference']}", headers=headers)).json()
        print(f"[9] Paystack Verify: Status = {ver['status']}")

        # 10. Check Frontend Vite server responds
        async with httpx.AsyncClient() as fe_client:
            fe = await fe_client.get("http://127.0.0.1:5173/")
            print(f"[10] Frontend Dev Server: Status {fe.status_code}")
            assert fe.status_code == 200

    print("=" * 60)
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
