import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.core.database import init_db

@pytest.mark.asyncio
async def test_gateway_models_and_completions():
    await init_db()
    transport = ASGITransport(app=app)
    email = f"gateway_{uuid.uuid4().hex[:8]}@indunixai.com"
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test /v1/models without auth
        models_res = await client.get("/v1/models")
        assert models_res.status_code == 200
        models_data = models_res.json()
        model_ids = [m["id"] for m in models_data["data"]]
        assert "indunix-1-spark" in model_ids
        assert "indunix-1-core" in model_ids
        assert "indunix-1-reason" in model_ids
        assert "indunix-edge-local" in model_ids

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
        assert secret_key.startswith("indunix-live-sk-")

        # 3. Request completion using standard Bearer API key
        gateway_headers = {"Authorization": f"Bearer {secret_key}"}
        completion_res = await client.post(
            "/v1/chat/completions",
            json={
                "model": "indunix-1-core",
                "messages": [{"role": "user", "content": "Extract customer details from invoice."}],
                "stream": False
            },
            headers=gateway_headers
        )
        assert completion_res.status_code == 200
        comp_json = completion_res.json()
        assert comp_json["model"] == "indunix-1-core"
        assert len(comp_json["choices"]) > 0
        assert "usage" in comp_json

        # 4. Request streaming completion
        stream_res = await client.post(
            "/v1/chat/completions",
            json={
                "model": "indunix-1-spark",
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

        # 6. Test Claude Models in /v1/models and /models
        assert "claude-sonnet-5-5" in model_ids
        assert "claude-opus-5-5" in model_ids
        assert "claude-haiku-5-5" in model_ids

        # Test GET /v1/models/claude-sonnet-5-5
        model_res = await client.get("/v1/models/claude-sonnet-5-5")
        assert model_res.status_code == 200
        assert model_res.json()["id"] == "claude-sonnet-5-5"
        assert model_res.json()["context_window"] == 1000000

        # Test GET /models/claude-sonnet-5-5 (root router)
        model_root_res = await client.get("/models/claude-sonnet-5-5")
        assert model_root_res.status_code == 200
        assert model_root_res.json()["id"] == "claude-sonnet-5-5"
        assert model_root_res.json()["context_window"] == 1000000

        # Test GET /v1/models/indunix-1-core has 1M context
        core_model_res = await client.get("/v1/models/indunix-1-core")
        assert core_model_res.status_code == 200
        assert core_model_res.json()["context_window"] == 1000000

        # Test probe GET /v1/chat/completions/v1/messages
        probe_res = await client.get("/v1/chat/completions/v1/messages")
        assert probe_res.status_code == 200
        assert probe_res.json()["status"] == "operational"

        # 7. Test Anthropic Messages API with x-api-key header on standard /v1/messages
        anthropic_headers = {
            "x-api-key": secret_key,
            "anthropic-version": "2023-06-01"
        }
        msg_res = await client.post(
            "/v1/messages",
            json={
                "model": "claude-sonnet-5-5",
                "messages": [
                    {"role": "user", "content": "Hello Claude from Indunix AI"}
                ],
                "max_tokens": 512,
                "stream": False
            },
            headers=anthropic_headers
        )
        assert msg_res.status_code == 200, msg_res.text
        msg_data = msg_res.json()
        assert msg_data["type"] == "message"
        assert msg_data["role"] == "assistant"
        assert msg_data["model"] == "claude-sonnet-5-5"
        assert len(msg_data["content"]) > 0
        assert msg_data["content"][0]["type"] == "text"
        assert len(msg_data["content"][0]["text"]) > 0
        assert msg_data["stop_reason"] == "end_turn"

        # 8. Test the EXACT URL from the user's error:
        # requestUrl: https://api.indunixai.com/v1/chat/completions/v1/messages
        # probedModel: claude-sonnet-5-5
        error_url_res = await client.post(
            "/v1/chat/completions/v1/messages",
            json={
                "model": "claude-sonnet-5-5",
                "messages": [
                    {"role": "user", "content": "Ping test probe"}
                ],
                "max_tokens": 100,
                "stream": False
            },
            headers=anthropic_headers
        )
        assert error_url_res.status_code == 200, error_url_res.text
        assert error_url_res.json()["model"] == "claude-sonnet-5-5"

        # 9. Test Anthropic Streaming Mode
        stream_msg_res = await client.post(
            "/v1/messages",
            json={
                "model": "claude-opus-5-5",
                "messages": [
                    {"role": "user", "content": "Explain enterprise sovereignty"}
                ],
                "max_tokens": 512,
                "stream": True
            },
            headers=anthropic_headers
        )
        assert stream_msg_res.status_code == 200
        assert "text/event-stream" in stream_msg_res.headers.get("content-type", "")
        stream_body = stream_msg_res.text
        assert "event: message_start" in stream_body
        assert "event: content_block_start" in stream_body
        assert "event: content_block_delta" in stream_body
        assert "event: content_block_stop" in stream_body
        assert "event: message_delta" in stream_body
        assert "event: message_stop" in stream_body
