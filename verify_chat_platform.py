"""
Verification script for Indunix AI Chat Platform (Chat.IndunixAI.com)
Tests complete backend and API integration for Guest, Free, and Pro tiers.
"""
import asyncio
import io
import json
import sys
import uuid
from httpx import AsyncClient, ASGITransport

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from backend.main import app
from backend.core.database import init_db

async def main():
    print("=" * 70)
    print("  [*] INDUNIX AI CHAT PLATFORM: VERIFICATION TEST  ")
    print("=" * 70)

    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Health check
        print("\n[Step 1] Gateway Health Check...")
        h = await client.get("/health")
        assert h.status_code == 200
        print(f"  [+] Service healthy: {h.json()}")

        # Step 2: Guest Session Provisioning
        print("\n[Step 2] Guest Session Provisioning...")
        guest_res = await client.post("/api/chat/guest/session")
        assert guest_res.status_code == 200, guest_res.text
        g_data = guest_res.json()
        guest_token = g_data["guest_token"]
        print(f"  [+] Guest Token issued: {guest_token[:25]}...")
        print(f"  [+] Remaining Messages: {g_data['remaining_messages']}/{g_data['max_messages']}")
        print(f"  [+] Eligible Models: {g_data['eligible_models']}")

        guest_headers = {"Authorization": f"Bearer {guest_token}"}

        # Step 3: Check Limits Endpoint for Guest
        print("\n[Step 3] Query Limits Endpoint (/api/chat/limits)...")
        limits_res = await client.get("/api/chat/limits", headers=guest_headers)
        assert limits_res.status_code == 200
        limits = limits_res.json()
        print(f"  [+] Tier: {limits['tier'].upper()}")
        print(f"  [+] Can Use Reasoning (Pro): {limits['can_use_reasoning']}")
        print(f"  [+] Allowed Models: {limits['allowed_models']}")
        assert limits["tier"] == "guest"
        assert limits["can_use_reasoning"] is False

        # Step 4: Enforce Pro Model Restriction on Guest
        print("\n[Step 4] Pro Model Enforcement (indunix-1-reason)...")
        fail_res = await client.post(
            "/api/chat/completions",
            json={
                "model": "indunix-1-reason",
                "messages": [{"role": "user", "content": "Deep reasoning request"}],
                "stream": False
            },
            headers=guest_headers
        )
        print(f"  [+] Attempting indunix-1-reason as Guest: Status {fail_res.status_code}")
        assert fail_res.status_code == 403, "Expected 403 Forbidden for unauthenticated guest requesting Pro model"
        print("  [+] Pro model correctly restricted with upgrade prompt!")

        # Step 5: Real-time Streaming SSE as Guest
        print("\n[Step 5] Real-Time Streaming SSE Completion as Guest...")
        user_prompt = "Summarize three key benefits of Indunix AI direct Naira billing."
        stream_res = await client.post(
            "/api/chat/completions",
            json={
                "model": "indunix-1-core",
                "messages": [{"role": "user", "content": user_prompt}],
                "stream": True
            },
            headers=guest_headers
        )
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers.get("content-type", "")

        stream_body = stream_res.text
        lines = stream_body.split("\n")
        conversation_id = None
        assistant_chunks = []

        for line in lines:
            line = line.strip()
            if not line or not line.startswith("data: "):
                continue
            payload_str = line[6:]
            if payload_str == "[DONE]":
                break
            try:
                data = json.loads(payload_str)
                if "conversation_id" in data:
                    conversation_id = data["conversation_id"]
                delta = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                if delta:
                    assistant_chunks.append(delta)
            except Exception:
                pass

        full_reply = "".join(assistant_chunks)
        print(f"  [+] Conversation ID: {conversation_id}")
        print(f"  [+] Streamed Chunks Received: {len(assistant_chunks)}")
        print(f"  [+] Sample Output Preview: {full_reply[:140]}...")
        assert conversation_id is not None
        assert len(full_reply) > 20

        # Step 6: Verify Guest Quota Decrement
        print("\n[Step 6] Verifying Guest Usage Counter...")
        limits_res2 = await client.get("/api/chat/limits", headers=guest_headers)
        limits2 = limits_res2.json()
        print(f"  [+] Remaining Messages: {limits2['remaining_messages']}/{limits2['messages_limit']}")
        assert limits2["remaining_messages"] == 9, "Expected 9 messages remaining after 1 query"

        # Step 7: Load Conversation History
        print("\n[Step 7] Fetching Conversation Thread...")
        conv_res = await client.get(f"/api/chat/conversations/{conversation_id}", headers=guest_headers)
        assert conv_res.status_code == 200
        conv_data = conv_res.json()
        print(f"  [+] Title: {conv_data['title']}")
        print(f"  [+] Message Count in DB: {len(conv_data['messages'])}")
        assert len(conv_data["messages"]) == 2
        assert conv_data["messages"][0]["role"] == "user"
        assert conv_data["messages"][1]["role"] == "assistant"

        # Step 8: Register Free Account & Migrate Guest Conversation
        print("\n[Step 8] User Registration & Conversation Migration...")
        user_email = f"chat_platform_{uuid.uuid4().hex[:6]}@indunixai.com"
        reg_res = await client.post("/api/auth/register", json={
            "email": user_email,
            "password": "Password123!Secure",
            "full_name": "Tariq Danjuma",
            "company_name": "AfriFintech Solutions"
        })
        assert reg_res.status_code == 201
        user_token = reg_res.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        print(f"  [+] Account registered: {user_email}")

        mig_res = await client.post(
            "/api/chat/conversations/migrate",
            json={"guest_token": guest_token},
            headers=user_headers
        )
        assert mig_res.status_code == 200
        print(f"  [+] Migrated Conversations: {mig_res.json()['migrated_count']}")
        assert mig_res.json()["migrated_count"] >= 1

        # Step 9: User Conversation Ownership and Rename
        print("\n[Step 9] Renaming and Pinning Conversation...")
        patch_res = await client.patch(
            f"/api/chat/conversations/{conversation_id}",
            json={"title": "Naira Billing Architectural Analysis", "is_pinned": True},
            headers=user_headers
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["title"] == "Naira Billing Architectural Analysis"
        assert patch_res.json()["is_pinned"] is True
        print(f"  [+] Renamed to: {patch_res.json()['title']} (Pinned: {patch_res.json()['is_pinned']})")

        # Step 10: Export Conversation
        print("\n[Step 10] Exporting Conversation as Markdown...")
        export_res = await client.get(f"/api/chat/export/{conversation_id}?format=markdown", headers=user_headers)
        assert export_res.status_code == 200
        assert "# Naira Billing Architectural Analysis" in export_res.text
        print("  [+] Markdown Export verified successfully!")

        print("\n" + "=" * 70)
        print("  [SUCCESS] ALL INDUNIX AI CHAT PLATFORM VERIFICATIONS PASSED 100%!  ")
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
