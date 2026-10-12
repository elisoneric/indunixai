import time
import pytest
from backend.services.key_pool import UpstreamKeyPool

def test_key_pool_round_robin():
    pool = UpstreamKeyPool()
    pool.set_keys("deepseek", ["key-1", "key-2", "key-3"])

    # Consecutive requests should alternate in round-robin order
    results = [pool.get_key("deepseek") for _ in range(6)]
    assert results == ["key-1", "key-2", "key-3", "key-1", "key-2", "key-3"]

def test_key_pool_429_failover():
    pool = UpstreamKeyPool()
    pool.set_keys("groq", ["primary-key", "secondary-key"])

    # Both healthy initially
    k1 = pool.get_key("groq")
    assert k1 == "primary-key"

    # Simulate primary key hitting HTTP 429 rate limit
    pool.report_rate_limit("groq", "primary-key", cooldown_seconds=10.0)

    # Next requests should bypass primary key and use secondary key
    for _ in range(3):
        assert pool.get_key("groq") == "secondary-key"

def test_key_pool_cooldown_recovery():
    pool = UpstreamKeyPool()
    pool.set_keys("together", ["key-a", "key-b"])

    # Put key-a in short cooldown
    pool.report_rate_limit("together", "key-a", cooldown_seconds=0.05)
    assert pool.get_key("together") == "key-b"

    # Allow cooldown to expire
    time.sleep(0.06)

    # key-a should now be eligible again
    keys = {pool.get_key("together") for _ in range(4)}
    assert "key-a" in keys
    assert "key-b" in keys

def test_key_pool_status_diagnostics():
    pool = UpstreamKeyPool()
    pool.set_keys("deepseek", ["key-1", "key-2"])
    pool.report_rate_limit("deepseek", "key-1", cooldown_seconds=30.0)

    status = pool.get_pool_status("deepseek")
    assert status["total_keys"] == 2
    assert status["healthy_keys"] == 1
    assert status["in_cooldown"] == 1

def test_key_pool_sync_from_settings():
    class DummySettings:
        DEEPSEEK_API_KEY = "sk-primary"
        DEEPSEEK_API_KEYS = "sk-sec1, sk-sec2"
        GROQ_API_KEY = "gsk-1"
        GROQ_API_KEYS = None
        TOGETHER_API_KEY = None
        TOGETHER_API_KEYS = None
        OPENAI_API_KEY = None
        OPENAI_API_KEYS = None

    pool = UpstreamKeyPool()
    pool.sync_from_settings(DummySettings())

    ds_keys = pool.get_keys("deepseek")
    assert ds_keys == ["sk-primary", "sk-sec1", "sk-sec2"]

    groq_keys = pool.get_keys("groq")
    assert groq_keys == ["gsk-1"]
