import asyncio
import time
from typing import Optional, Dict
from backend.core.config import settings

class InMemoryRateLimiter:
    """In-memory fallback token bucket and cache if Redis is not running."""
    def __init__(self):
        self._cache: Dict[str, tuple[str, float]] = {}  # key -> (value, expire_at)
        self._buckets: Dict[str, tuple[float, float]] = {} # key -> (tokens, last_update)
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[str]:
        async with self._lock:
            if key in self._cache:
                val, expire_at = self._cache[key]
                if expire_at == 0 or expire_at > time.time():
                    return val
                del self._cache[key]
            return None

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> None:
        async with self._lock:
            expire_at = time.time() + ex if ex else 0
            self._cache[key] = (value, expire_at)

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._cache.pop(key, None)

    async def check_rate_limit(self, identifier: str, limit: int = 60, window_seconds: int = 60) -> bool:
        """Token bucket rate limiter. Returns True if allowed, False if exceeded."""
        async with self._lock:
            now = time.time()
            if identifier not in self._buckets:
                self._buckets[identifier] = (limit - 1.0, now)
                return True
            
            tokens, last_time = self._buckets[identifier]
            elapsed = now - last_time
            # Refill tokens
            refill_rate = limit / window_seconds
            tokens = min(float(limit), tokens + elapsed * refill_rate)
            
            if tokens >= 1.0:
                self._buckets[identifier] = (tokens - 1.0, now)
                return True
            else:
                self._buckets[identifier] = (tokens, now)
                return False

class RedisManager:
    def __init__(self):
        self.client = None
        self.fallback = InMemoryRateLimiter()
        self.is_connected = False

    async def init(self):
        try:
            import redis.asyncio as aioredis
            self.client = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
            await self.client.ping()
            self.is_connected = True
        except Exception:
            self.is_connected = False
            self.client = None

    async def get(self, key: str) -> Optional[str]:
        if self.is_connected and self.client:
            try:
                return await self.client.get(key)
            except Exception:
                pass
        return await self.fallback.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> None:
        if self.is_connected and self.client:
            try:
                await self.client.set(key, value, ex=ex)
                return
            except Exception:
                pass
        await self.fallback.set(key, value, ex=ex)

    async def delete(self, key: str) -> None:
        if self.is_connected and self.client:
            try:
                await self.client.delete(key)
                return
            except Exception:
                pass
        await self.fallback.delete(key)

    async def check_rate_limit(self, identifier: str, limit: int = 60, window_seconds: int = 60) -> bool:
        if self.is_connected and self.client:
            try:
                key = f"rate_limit:{identifier}"
                current = await self.client.incr(key)
                if current == 1:
                    await self.client.expire(key, window_seconds)
                return current <= limit
            except Exception:
                pass
        return await self.fallback.check_rate_limit(identifier, limit, window_seconds)

redis_manager = RedisManager()
