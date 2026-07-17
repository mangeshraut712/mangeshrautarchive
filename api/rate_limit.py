"""Durable rate-limit store with in-memory default and optional Upstash Redis REST."""

from __future__ import annotations

import logging
import os
import time
from collections import defaultdict
from typing import DefaultDict, Dict, List, Optional, Protocol

logger = logging.getLogger(__name__)


class RateLimitStore(Protocol):
    def allow(self, client_id: str, *, limit: int, window_sec: float) -> bool:
        ...

    def clear(self) -> None:
        ...

    def snapshot(self) -> Dict[str, List[float]]:
        ...

    def items(self):
        ...


class InMemoryRateLimitStore:
    """Process-local sliding window used for local/CI and as fail-soft fallback."""

    def __init__(self) -> None:
        self._store: DefaultDict[str, List[float]] = defaultdict(list)

    def allow(self, client_id: str, *, limit: int, window_sec: float) -> bool:
        now = time.time()
        recent = [ts for ts in self._store[client_id] if now - ts < window_sec]
        if len(recent) >= limit:
            self._store[client_id] = recent
            return False
        recent.append(now)
        self._store[client_id] = recent
        return True

    def clear(self) -> None:
        self._store.clear()

    def snapshot(self) -> Dict[str, List[float]]:
        return {key: list(values) for key, values in self._store.items()}

    def items(self):
        return self._store.items()

    def __contains__(self, client_id: str) -> bool:
        return client_id in self._store

    def __getitem__(self, client_id: str) -> List[float]:
        return self._store[client_id]

    def __setitem__(self, client_id: str, values: List[float]) -> None:
        self._store[client_id] = list(values)

    def __delitem__(self, client_id: str) -> None:
        del self._store[client_id]


class UpstashRateLimitStore:
    """Fixed-window counter via Upstash Redis REST (INCR + EXPIRE)."""

    def __init__(self, url: str, token: str, fallback: InMemoryRateLimitStore) -> None:
        self._url = url.rstrip("/")
        self._token = token
        self._fallback = fallback
        self._warned = False

    def _key(self, client_id: str, window_sec: float) -> str:
        bucket = int(time.time() // max(window_sec, 1))
        return f"rl:{client_id}:{bucket}"

    def allow(self, client_id: str, *, limit: int, window_sec: float) -> bool:
        try:
            import httpx

            key = self._key(client_id, window_sec)
            headers = {"Authorization": f"Bearer {self._token}"}
            with httpx.Client(timeout=2.0) as client:
                incr = client.post(f"{self._url}/incr/{key}", headers=headers)
                incr.raise_for_status()
                count = int(incr.json().get("result", 0))
                if count == 1:
                    client.post(
                        f"{self._url}/expire/{key}/{int(max(window_sec, 1))}",
                        headers=headers,
                    )
            return count <= limit
        except Exception as exc:
            fail_closed = os.getenv("RATE_LIMIT_FAIL_CLOSED", "").strip().lower() in (
                "1",
                "true",
                "yes",
                "on",
            )
            if not self._warned:
                logger.warning(
                    "Upstash rate limit unavailable (%s); %s",
                    type(exc).__name__,
                    "failing closed" if fail_closed else "falling back to memory",
                )
                self._warned = True
            if fail_closed:
                return False
            return self._fallback.allow(client_id, limit=limit, window_sec=window_sec)

    def clear(self) -> None:
        self._fallback.clear()

    def snapshot(self) -> Dict[str, List[float]]:
        # External counters are not enumerable; expose empty for monitor compatibility.
        return {}

    def items(self):
        return self.snapshot().items()


def build_rate_limit_store() -> RateLimitStore:
    backend = (os.getenv("RATE_LIMIT_BACKEND") or "memory").strip().lower()
    memory = InMemoryRateLimitStore()
    if backend in {"", "memory", "local"}:
        return memory

    url = (os.getenv("UPSTASH_REDIS_REST_URL") or "").strip()
    token = (os.getenv("UPSTASH_REDIS_REST_TOKEN") or "").strip()
    if backend in {"upstash", "redis"} and url and token:
        logger.info("Rate limit backend: Upstash Redis REST")
        return UpstashRateLimitStore(url, token, memory)

    if backend in {"upstash", "redis"}:
        logger.warning(
            "RATE_LIMIT_BACKEND=%s but Upstash env incomplete; using memory",
            backend,
        )
    return memory


_STORE: Optional[RateLimitStore] = None


def get_rate_limit_store() -> RateLimitStore:
    global _STORE
    if _STORE is None:
        _STORE = build_rate_limit_store()
    return _STORE


def reset_rate_limit_store_for_tests(store: Optional[RateLimitStore] = None) -> RateLimitStore:
    """Test helper — replace the process-global store."""
    global _STORE
    _STORE = store or InMemoryRateLimitStore()
    return _STORE
