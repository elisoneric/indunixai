import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.core.database import init_db

@pytest.mark.asyncio
async def test_chat_guest_and_user_flows():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create Guest Session
        guest_res = await client.post("/api/chat/guest/session")
        assert guest_res.status_code == 200
        g_data = guest_res.json()
        assert "guest_token" in g_data
        assert g_data["remaining_messages"] == 10
        assert "indunix-1-core" in g_data["eligible_models"]
        guest_token = g_data["guest_token"]
        g_headers = {"Authorization": f"Bearer {guest_token}"}

        # 2. Check Limits for Guest
        limits_res = await client.get("/api/chat/limits", headers=g_headers)
        assert limits_res.status_code == 200
        l_data = limits_res.json()
        assert l_data["tier"] == "guest"
        assert l_data["can_use_reasoning"] is False
        assert l_data["remaining_messages"] == 10

        # 3. Guest tries to use Pro reasoning model -> Forbidden (403)
        fail_res = await client.post(
            "/api/chat/completions",
            json={
                "model": "indunix-1-reason",
                "messages": [{"role": "user", "content": "Complex logic puzzle"}],
                "stream": False
            },
            headers=g_headers
        )
        assert fail_res.status_code == 403

        # 4. Guest executes real chat completion (non-streaming)
        chat_res = await client.post(
            "/api/chat/completions",
            json={
                "model": "indunix-1-core",
                "messages": [{"role": "user", "content": "Hello Indunix AI"}],
                "stream": False
            },
            headers=g_headers
        )
        assert chat_res.status_code == 200
        c_json = chat_res.json()
        assert "conversation_id" in c_json
        assert "content" in c_json
        conv_id = c_json["conversation_id"]

        # 5. Guest checks limits -> 9 remaining
        limits_res2 = await client.get("/api/chat/limits", headers=g_headers)
        assert limits_res2.status_code == 200
        assert limits_res2.json()["remaining_messages"] == 9

        # 6. Guest gets conversation details
        conv_res = await client.get(f"/api/chat/conversations/{conv_id}", headers=g_headers)
        assert conv_res.status_code == 200
        conv_data = conv_res.json()
        assert len(conv_data["messages"]) == 2  # 1 user + 1 assistant

        # 7. Register a Free User
        email = f"chatuser_{uuid.uuid4().hex[:8]}@indunixai.com"
        reg = await client.post("/api/auth/register", json={
            "email": email,
            "password": "Password123!",
            "full_name": "Chat User"
        })
        assert reg.status_code == 201
        user_token = reg.json()["access_token"]
        u_headers = {"Authorization": f"Bearer {user_token}"}

        # 8. Migrate Guest Conversation to User Account
        mig_res = await client.post("/api/chat/conversations/migrate", json={"guest_token": guest_token}, headers=u_headers)
        assert mig_res.status_code == 200
        assert mig_res.json()["migrated_count"] >= 1

        # 9. Verify user now owns the conversation
        user_convs = await client.get("/api/chat/conversations", headers=u_headers)
        assert user_convs.status_code == 200
        user_c_ids = [c["id"] for c in user_convs.json()]
        assert conv_id in user_c_ids

        # 10. User renames conversation
        patch_res = await client.patch(
            f"/api/chat/conversations/{conv_id}",
            json={"title": "Updated Strategy Discussion", "is_pinned": True},
            headers=u_headers
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["title"] == "Updated Strategy Discussion"
        assert patch_res.json()["is_pinned"] is True

        # 11. User exports conversation as markdown
        export_res = await client.get(f"/api/chat/export/{conv_id}?format=markdown", headers=u_headers)
        assert export_res.status_code == 200
        assert "Updated Strategy Discussion" in export_res.text

        # 12. User streams a reply
        stream_res = await client.post(
            "/api/chat/completions",
            json={
                "conversation_id": conv_id,
                "model": "indunix-1-spark",
                "messages": [
                    {"role": "user", "content": "Hello Indunix AI"},
                    {"role": "assistant", "content": "Welcome to Indunix"},
                    {"role": "user", "content": "Give me 3 points on scaling."}
                ],
                "stream": True
            },
            headers=u_headers
        )
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers.get("content-type", "")
        stream_text = stream_res.text
        assert "data: " in stream_text
