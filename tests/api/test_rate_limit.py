"""Tests for API rate limiting helpers."""

import time

from api.config import RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW, check_rate_limit, rate_limit_store


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
