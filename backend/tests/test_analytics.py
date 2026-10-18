import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.core.database import init_db

@pytest.mark.asyncio
async def test_analytics_logs_filtering_and_grouping():
    await init_db()
    transport = ASGITransport(app=app)
    email = f"analytics_{uuid.uuid4().hex[:8]}@indunixai.com"

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register test user
        reg = await client.post("/api/auth/register", json={
            "email": email,
            "password": "Password123!",
            "full_name": "Analytics Tester"
        })
        assert reg.status_code == 201, reg.text
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create two distinct API keys
        key_res_1 = await client.post("/api/keys", json={"name": "Analytics Key Alpha"}, headers=headers)
        assert key_res_1.status_code == 201
        key_1_data = key_res_1.json()
        key_1_id = key_1_data["api_key"]["id"]
        secret_1 = key_1_data["secret_key"]

        key_res_2 = await client.post("/api/keys", json={"name": "Analytics Key Beta"}, headers=headers)
        assert key_res_2.status_code == 201
        key_2_data = key_res_2.json()
        key_2_id = key_2_data["api_key"]["id"]
        secret_2 = key_2_data["secret_key"]

        # 3. Generate gateway completions with Key 1 (indunix-1-spark)
        res1 = await client.post(
            "/v1/chat/completions",
            json={
                "model": "indunix-1-spark",
                "messages": [{"role": "user", "content": "Ping Alpha"}],
                "stream": False
            },
            headers={"Authorization": f"Bearer {secret_1}"}
        )
        assert res1.status_code == 200

        # 4. Generate gateway completions with Key 2 (indunix-1-core)
        res2 = await client.post(
            "/v1/chat/completions",
            json={
                "model": "indunix-1-core",
                "messages": [{"role": "user", "content": "Ping Beta"}],
                "stream": False
            },
            headers={"Authorization": f"Bearer {secret_2}"}
        )
        assert res2.status_code == 200

        # 5. Query all usage logs
        logs_res = await client.get("/api/analytics/logs", headers=headers)
        assert logs_res.status_code == 200
        logs = logs_res.json()
        assert len(logs) >= 2

        # 6. Test Time Range Filtering (24h should return both fresh requests)
        logs_24h = await client.get("/api/analytics/logs?time_range=24h", headers=headers)
        assert logs_24h.status_code == 200
        assert len(logs_24h.json()) >= 2

        # 7. Test API Key Filtering
        logs_key_1 = await client.get(f"/api/analytics/logs?api_key_id={key_1_id}", headers=headers)
        assert logs_key_1.status_code == 200
        key_1_logs = logs_key_1.json()
        assert len(key_1_logs) >= 1
        assert all(log["api_key_id"] == key_1_id for log in key_1_logs)
        assert any(log["api_key_name"] == "Analytics Key Alpha" for log in key_1_logs)

        logs_key_2 = await client.get(f"/api/analytics/logs?api_key_id={key_2_id}", headers=headers)
        assert logs_key_2.status_code == 200
        key_2_logs = logs_key_2.json()
        assert len(key_2_logs) >= 1
        assert all(log["api_key_id"] == key_2_id for log in key_2_logs)
        assert any(log["api_key_name"] == "Analytics Key Beta" for log in key_2_logs)

        # 8. Test Grouped Logs - Group By API Key
        grouped_key_res = await client.get("/api/analytics/logs/grouped?group_by=api_key", headers=headers)
        assert grouped_key_res.status_code == 200
        grouped_keys = grouped_key_res.json()
        assert isinstance(grouped_keys, list)
        key_names = [g["group_name"] for g in grouped_keys]
        key_ids = [g["group_key"] for g in grouped_keys]
        assert "Analytics Key Alpha" in key_names
        assert "Analytics Key Beta" in key_names
        assert key_1_id in key_ids
        assert key_2_id in key_ids

        # 9. Test Grouped Logs - Group By Model
        grouped_model_res = await client.get("/api/analytics/logs/grouped?group_by=model", headers=headers)
        assert grouped_model_res.status_code == 200
        grouped_models = grouped_model_res.json()
        models_found = [g["group_key"] for g in grouped_models]
        assert "indunix-1-spark" in models_found
        assert "indunix-1-core" in models_found

        # 10. Test Grouped Logs - Group By Date
        grouped_date_res = await client.get("/api/analytics/logs/grouped?group_by=date", headers=headers)
        assert grouped_date_res.status_code == 200
        grouped_dates = grouped_date_res.json()
        assert len(grouped_dates) >= 1
        assert "total_requests" in grouped_dates[0]
        assert "total_tokens" in grouped_dates[0]
        assert "total_cost_ngn" in grouped_dates[0]
        assert grouped_dates[0]["total_requests"] >= 2
