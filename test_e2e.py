"""
AXION AI PLATFORM: End-to-End Verification Test Script
Tests the complete end-to-end loop:
1. Account registration with ₦1,000 bonus credits
2. API Key generation (axion-live-sk-...)
3. OpenAI SDK drop-in integration (streaming completions)
4. Model streaming verification
5. Ledger deduction & token metering verification
6. Request audit in live Usage Logs
"""
import asyncio
import io
import json
import uuid
import sys
from httpx import AsyncClient, ASGITransport

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from backend.main import app
from backend.core.database import init_db

async def run_e2e_test():
    print("=" * 70)
    print("  [*] AXION AI PLATFORM: SOVEREIGN GATEWAY E2E VERIFICATION TEST  ")
    print("=" * 70)

    await init_db()
    test_id = uuid.uuid4().hex[:6]
    test_email = f"e2e.tester.{test_id}@axion.ng"
    test_password = "Password123!Secure"
    full_name = "Chidi Eze"
    company_name = "Sovereign Enterprise Labs"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # STEP 1: Register Account
        print(f"\n[Step 1] Registering developer account: {test_email}...")
        reg_res = await client.post("/api/auth/register", json={
            "email": test_email,
            "password": test_password,
            "full_name": full_name,
            "company_name": company_name
        })
        assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
        auth_data = reg_res.json()
        jwt_token = auth_data["access_token"]
        user_id = auth_data["user"]["id"]
        auth_headers = {"Authorization": f"Bearer {jwt_token}"}
        print(f"  [+] User registered with ID: {user_id}")

        # Verify initial wallet has ₦1,000 bonus credits
        wallet_res = await client.get("/api/billing/wallet", headers=auth_headers)
        assert wallet_res.status_code == 200
        wallet = wallet_res.json()
        print(f"  [+] Initial Wallet Balance: NGN {wallet['balance_ngn']:.2f}")
        print(f"  [+] Sign-up Bonus Credits: NGN {wallet['bonus_credits_ngn']:.2f}")
        assert wallet["bonus_credits_ngn"] == 1000.0, "Expected ₦1,000 bonus signup credits"

        # STEP 2: Generate API Key
        print("\n[Step 2] Generating Axion API Key...")
        key_res = await client.post(
            "/api/keys",
            json={"name": "E2E Production Key", "monthly_spend_limit_ngn": 50000.0},
            headers=auth_headers
        )
        assert key_res.status_code == 201, f"Key creation failed: {key_res.text}"
        key_data = key_res.json()
        secret_key = key_data["secret_key"]
        key_prefix = key_data["api_key"]["key_prefix"]
        print(f"  [+] Secret Key Generated: {secret_key[:22]}... (SHA-256 hashed in DB)")
        print(f"  [+] Key Prefix: {key_prefix}")
        assert secret_key.startswith(("indunix-live-sk-", "axion-live-sk-"))

        # STEP 3: Verify /v1/models (OpenAI SDK Models List)
        print("\n[Step 3] Querying /v1/models list...")
        models_res = await client.get("/v1/models")
        assert models_res.status_code == 200
        models_list = [m["id"] for m in models_res.json()["data"]]
        print(f"  [+] Proprietary models available: {models_list}")
        assert "indunix-1-spark" in models_list or "axion-1-spark" in models_list
        assert "indunix-1-core" in models_list or "axion-1-core" in models_list

        # STEP 4: Test Streaming Chat Completion via Gateway
        print("\n[Step 4] Executing streaming chat completion with axion-1-core...")
        gateway_headers = {"Authorization": f"Bearer {secret_key}"}
        prompt = "Analyze the quarterly enterprise revenue report and summarize financial risks."
        
        stream_res = await client.post(
            "/v1/chat/completions",
            json={
                "model": "axion-1-core",
                "messages": [
                    {"role": "system", "content": "You are Axion AI Sovereign Intelligence."},
                    {"role": "user", "content": prompt}
                ],
                "stream": True,
                "temperature": 0.5
            },
            headers=gateway_headers
        )
        assert stream_res.status_code == 200, f"Gateway request failed: {stream_res.text}"
        assert "text/event-stream" in stream_res.headers.get("content-type", "")

        chunks_received = 0
        full_text = ""
        for line in stream_res.iter_lines():
            if line.startswith("data: ") and not line.startswith("data: [DONE]"):
                chunks_received += 1
                try:
                    chunk_obj = json.loads(line[6:])
                    delta = chunk_obj["choices"][0].get("delta", {})
                    content = delta.get("content", "")
                    full_text += content
                except Exception:
                    pass

        print(f"  [+] Received {chunks_received} streaming SSE chunks!")
        print(f"  [+] Decoded response snippet: {full_text[:120]}...")
        assert chunks_received > 0, "No chunks received"
        assert len(full_text) > 20, "Empty completion generated"

        # Allow async token deduction to persist
        await asyncio.sleep(0.3)

        # STEP 5: Verify Ledger Deduction
        print("\n[Step 5] Checking Wallet Ledger atomic deduction...")
        post_wallet_res = await client.get("/api/billing/wallet", headers=auth_headers)
        post_wallet = post_wallet_res.json()
        deducted = 1000.0 - post_wallet["bonus_credits_ngn"]
        print(f"  [+] New Bonus Credits: NGN {post_wallet['bonus_credits_ngn']:.4f}")
        print(f"  [+] Amount Deducted: NGN {deducted:.6f}")
        assert post_wallet["bonus_credits_ngn"] < 1000.0, "Wallet was not deducted"

        # STEP 6: Verify Live Usage Logs & Analytics
        print("\n[Step 6] Inspecting live Request Usage Logs...")
        logs_res = await client.get("/api/analytics/logs", headers=auth_headers)
        assert logs_res.status_code == 200
        logs = logs_res.json()
        assert len(logs) > 0, "No usage logs recorded"
        latest_log = logs[0]
        print(f"  [+] Log ID: {latest_log['id']}")
        print(f"  [+] Model: {latest_log['model_requested']}")
        print(f"  [+] Total Tokens: {latest_log['total_tokens']}")
        print(f"  [+] Cost Deducted: NGN {latest_log['cost_deducted_ngn']:.6f}")
        print(f"  [+] Latency: {latest_log['latency_ms']}ms")
        print(f"  [+] Stream Mode: {latest_log['is_stream']}")
        assert latest_log["model_requested"] == "axion-1-core"

        # STEP 7: Test Preflight Balance Rejection (402)
        print("\n[Step 7] Testing 402 Insufficient Balance rejection...")
        # Create user with 0 balance
        broke_user_res = await client.post("/api/auth/register", json={
            "email": f"broke.{test_id}@axion.ng",
            "password": "Password123!",
            "full_name": "Zero Balance User"
        })
        broke_token = broke_user_res.json()["access_token"]
        broke_headers = {"Authorization": f"Bearer {broke_token}"}
        
        # Zero out their balance in db directly for test
        from sqlalchemy import update
        from backend.models.wallet import Wallet
        from backend.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            await session.execute(
                update(Wallet).where(Wallet.user_id == broke_user_res.json()["user"]["id"]).values(
                    balance_ngn=0.0, bonus_credits_ngn=0.0
                )
            )
            await session.commit()

        # Attempt gateway call with 0 balance
        broke_key_res = await client.post("/api/keys", json={"name": "Zero Key"}, headers=broke_headers)
        broke_key = broke_key_res.json()["secret_key"]
        
        broke_gateway_res = await client.post(
            "/v1/chat/completions",
            json={"model": "axion-1-spark", "messages": [{"role": "user", "content": "Hi"}]},
            headers={"Authorization": f"Bearer {broke_key}"}
        )
        assert broke_gateway_res.status_code == 402
        assert "insufficient_balance" in broke_gateway_res.text
        print("  [+] Correctly rejected with HTTP 402 Insufficient Balance!")

    print("\n" + "=" * 70)
    print("  [SUCCESS] ALL END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!  ")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_e2e_test())
