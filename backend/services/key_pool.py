import time
import logging
from typing import Dict, List, Optional, Any
from collections import defaultdict

logger = logging.getLogger("indunix.key_pool")

class UpstreamKeyPool:
    """
    Manages upstream AI provider API keys with:
    - Parallel round-robin load distribution
    - Automatic 429 rate-limit detection and cooldown penalty box
    - Transparent failover to healthy sibling keys
    """

    def __init__(self):
        # provider -> list of API key strings
        self._keys: Dict[str, List[str]] = defaultdict(list)
        # (provider, key) -> cooldown_until_timestamp (float)
        self._cooldowns: Dict[str, float] = {}
        # provider -> current round-robin cursor index
        self._cursors: Dict[str, int] = defaultdict(int)

    def set_keys(self, provider: str, keys: List[str]):
        """Sets the active key list for a provider, preserving order and removing empty strings/duplicates."""
        seen = set()
        clean: List[str] = []
        for k in keys:
            if not k:
                continue
            k_clean = k.strip()
            if k_clean and k_clean not in seen:
                seen.add(k_clean)
                clean.append(k_clean)
        self._keys[provider.lower()] = clean
        logger.info(f"Registered {len(clean)} keys for upstream provider '{provider}'.")

    def add_key(self, provider: str, key: str):
        """Adds a single key to the pool if not already present."""
        if not key or not key.strip():
            return
        prov = provider.lower()
        k_clean = key.strip()
        if k_clean not in self._keys[prov]:
            self._keys[prov].append(k_clean)

    def get_keys(self, provider: str) -> List[str]:
        """Returns all registered keys for a provider."""
        return list(self._keys.get(provider.lower(), []))

    def get_key(self, provider: str) -> Optional[str]:
        """
        Returns the next healthy key in round-robin sequence.
        If all keys are in cooldown, picks the key whose cooldown expires earliest.
        """
        prov = provider.lower()
        keys = self._keys.get(prov, [])
        if not keys:
            return None

        now = time.time()
        # Filter keys that are NOT currently in cooldown
        healthy = [k for k in keys if self._cooldowns.get(f"{prov}:{k}", 0.0) <= now]

        if healthy:
            idx = self._cursors[prov] % len(healthy)
            self._cursors[prov] = (self._cursors[prov] + 1) % len(healthy)
            return healthy[idx]

        # If all keys are in cooldown, select the one with earliest cooldown expiry
        earliest_key = min(keys, key=lambda k: self._cooldowns.get(f"{prov}:{k}", 0.0))
        logger.warning(f"All keys for upstream provider '{provider}' are in cooldown. Using key with earliest recovery.")
        return earliest_key

    def report_rate_limit(self, provider: str, key: str, cooldown_seconds: float = 60.0):
        """
        Marks a key as rate-limited (HTTP 429) for `cooldown_seconds`.
        Subsequent calls to get_key() will bypass this key until cooldown expires.
        """
        prov = provider.lower()
        expiry = time.time() + max(0.01, cooldown_seconds)
        self._cooldowns[f"{prov}:{key}"] = expiry
        logger.warning(
            f"Upstream provider '{provider}' API key ({key[:8]}...{key[-4:] if len(key) > 12 else ''}) "
            f"rate-limited. Cooldown active for {cooldown_seconds:.1f}s."
        )

    def report_success(self, provider: str, key: str):
        """Clears any pending cooldown for a key upon successful response."""
        prov = provider.lower()
        self._cooldowns.pop(f"{prov}:{key}", None)

    def get_pool_status(self, provider: str) -> Dict[str, Any]:
        """Returns live diagnostic metrics for the provider key pool."""
        prov = provider.lower()
        now = time.time()
        keys = self._keys.get(prov, [])
        healthy_count = sum(1 for k in keys if self._cooldowns.get(f"{prov}:{k}", 0.0) <= now)
        cooldown_count = len(keys) - healthy_count

        return {
            "provider": provider,
            "total_keys": len(keys),
            "healthy_keys": healthy_count,
            "in_cooldown": cooldown_count,
            "keys_summary": [
                {
                    "prefix": f"{k[:8]}...{k[-4:] if len(k) > 12 else ''}",
                    "is_healthy": self._cooldowns.get(f"{prov}:{k}", 0.0) <= now,
                    "cooldown_remaining_sec": max(0.0, round(self._cooldowns.get(f"{prov}:{k}", 0.0) - now, 1))
                }
                for k in keys
            ]
        }

    def sync_from_settings(self, settings_obj: Any):
        """Initializes and synchronizes provider keys from settings object."""
        # DeepSeek
        ds_keys = []
        if getattr(settings_obj, "DEEPSEEK_API_KEY", None):
            ds_keys.append(settings_obj.DEEPSEEK_API_KEY)
        if getattr(settings_obj, "DEEPSEEK_API_KEYS", None):
            ds_keys.extend(str(settings_obj.DEEPSEEK_API_KEYS).split(","))
        self.set_keys("deepseek", ds_keys)

        # Groq
        groq_keys = []
        if getattr(settings_obj, "GROQ_API_KEY", None):
            groq_keys.append(settings_obj.GROQ_API_KEY)
        if getattr(settings_obj, "GROQ_API_KEYS", None):
            groq_keys.extend(str(settings_obj.GROQ_API_KEYS).split(","))
        self.set_keys("groq", groq_keys)

        # Together
        together_keys = []
        if getattr(settings_obj, "TOGETHER_API_KEY", None):
            together_keys.append(settings_obj.TOGETHER_API_KEY)
        if getattr(settings_obj, "TOGETHER_API_KEYS", None):
            together_keys.extend(str(settings_obj.TOGETHER_API_KEYS).split(","))
        self.set_keys("together", together_keys)

        # OpenAI
        openai_keys = []
        if getattr(settings_obj, "OPENAI_API_KEY", None):
            openai_keys.append(settings_obj.OPENAI_API_KEY)
        if getattr(settings_obj, "OPENAI_API_KEYS", None):
            openai_keys.extend(str(settings_obj.OPENAI_API_KEYS).split(","))
        self.set_keys("openai", openai_keys)

# Singleton key pool instance
key_pool = UpstreamKeyPool()
