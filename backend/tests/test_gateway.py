import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.core.database import init_db

@pytest.mark.asyncio
async def test_gateway_models_and_completions():
    await init_db()
    transport = ASGITransport(app=app)
    email = f"gateway_{uuid.uuid4().hex[:8]}@axion.ng"
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test /v1/models without auth
        models_res = await client.get("/v1/models")
        assert models_res.status_code == 200
        models_data = models_res.json()
        model_ids = [m["id"] for m in models_data["data"]]
        assert "axion-1-spark" in model_ids
        assert "axion-1-core" in model_ids
        assert "axion-1-reason" in model_ids
        assert "axion-edge-local" in model_ids

        # 2. Register user & create API Key
        reg = await client.post("/api/auth/register", json={
            "email": email,
            "password": "Password123!",
            "full_name": "Gateway Tester"
        })
        assert reg.status_code == 201, reg.text
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create API Key
        key_res = await client.post("/api/keys", json={"name": "Test Key"}, headers=headers)
        assert key_res.status_code == 201
        secret_key = key_res.json()["secret_key"]
        assert secret_key.startswith("axion-live-sk-")

        # 3. Request completion using standard Bearer API key
        gateway_headers = {"Authorization": f"Bearer {secret_key}"}
        completion_res = await client.post(
            "/v1/chat/completions",
            json={
                "model": "axion-1-core",
                "messages": [{"role": "user", "content": "Extract customer details from invoice."}],
                "stream": False
            },
            headers=gateway_headers
        )
        assert completion_res.status_code == 200
        comp_json = completion_res.json()
        assert comp_json["model"] == "axion-1-core"
        assert len(comp_json["choices"]) > 0
        assert "usage" in comp_json

        # 4. Request streaming completion
        stream_res = await client.post(
            "/v1/chat/completions",
            json={
                "model": "axion-1-spark",
                "messages": [{"role": "user", "content": "Quick sentiment analysis."}],
                "stream": True
            },
            headers=gateway_headers
        )
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers.get("content-type", "")
        stream_content = stream_res.text
        assert "data: " in stream_content
        assert "[DONE]" in stream_content

        # 5. Check wallet balance was deducted
        wallet_res = await client.get("/api/billing/wallet", headers=headers)
        wallet = wallet_res.json()
        assert wallet["bonus_credits_ngn"] < 1000.0 # Deduction made from promo credits
