"""Tests for API rate limiting helpers."""

import time
from types import SimpleNamespace

from api.config import (
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW,
    check_rate_limit,
    get_client_ip,
    rate_limit_store,
)


def setup_function():
    rate_limit_store.clear()


def test_check_rate_limit_allows_requests_within_window():
    client_id = "test-client-allow"

    for _ in range(RATE_LIMIT_REQUESTS):
        assert check_rate_limit(client_id) is True

    assert check_rate_limit(client_id) is False


def test_check_rate_limit_resets_after_window():
    client_id = "test-client-reset"

    for _ in range(RATE_LIMIT_REQUESTS):
        check_rate_limit(client_id)

    assert check_rate_limit(client_id) is False

    rate_limit_store[client_id] = [time.time() - RATE_LIMIT_WINDOW - 1]
    assert check_rate_limit(client_id) is True


def _request(headers=None, client_host="10.0.0.1"):
    return SimpleNamespace(
        headers=headers or {},
        client=SimpleNamespace(host=client_host) if client_host else None,
    )


def test_get_client_ip_prefers_vercel_header_over_spoofed_xff():
    req = _request(
        {
            "x-vercel-forwarded-for": "9.9.9.9",
            "x-forwarded-for": "1.2.3.4, 5.6.7.8",
        }
    )
    assert get_client_ip(req) == "9.9.9.9"


def test_get_client_ip_uses_rightmost_xff_when_no_platform_header():
    req = _request({"x-forwarded-for": "evil.client, 10.0.0.1"})
    assert get_client_ip(req) == "10.0.0.1"


def test_get_client_ip_falls_back_to_socket_peer():
    req = _request({}, client_host="192.168.1.50")
    assert get_client_ip(req) == "192.168.1.50"


def test_upstash_store_falls_back_to_memory_on_http_error(monkeypatch):
    from api.rate_limit import InMemoryRateLimitStore, UpstashRateLimitStore

    class BoomClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def post(self, *args, **kwargs):
            raise RuntimeError("network down")

    monkeypatch.setattr("httpx.Client", BoomClient)
    store = UpstashRateLimitStore(
        "https://example.upstash.io",
        "token",
        InMemoryRateLimitStore(),
    )
    assert store.allow("client-a", limit=2, window_sec=60) is True
    assert store.allow("client-a", limit=2, window_sec=60) is True
    assert store.allow("client-a", limit=2, window_sec=60) is False
