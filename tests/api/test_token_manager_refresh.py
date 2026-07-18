"""WHOOP refresh-token rotation must be single-flight and persist reliably."""

import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import httpx

from api.integrations import token_manager


def _bundle(**overrides):
    base = {
        "account_id": "acc-1",
        "provider_subject": "whoop-user",
        "scopes": ["offline"],
        "access_token": "old-access",
        "refresh_token": "refresh-v1",
        "expires_at": (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat().replace(
            "+00:00", "Z"
        ),
        "updated_at": "2026-07-18T08:00:00Z",
    }
    base.update(overrides)
    return base


def test_refresh_persists_rotated_refresh_token():
    with (
        patch(
            "api.integrations.token_manager.get_provider_token_bundle",
            new=AsyncMock(side_effect=[_bundle(), _bundle()]),
        ),
        patch(
            "api.integrations.token_manager.acquire_token_refresh_lock",
            new=AsyncMock(return_value=True),
        ),
        patch(
            "api.integrations.token_manager.release_token_refresh_lock",
            new=AsyncMock(),
        ),
        patch(
            "api.integrations.token_manager.whoop.refresh_access_token",
            new=AsyncMock(
                return_value={
                    "access_token": "new-access",
                    "refresh_token": "refresh-v2",
                    "expires_in": 3600,
                }
            ),
        ),
        patch(
            "api.integrations.token_manager.save_provider_tokens",
            new=AsyncMock(return_value=True),
        ) as save_mock,
    ):
        token = asyncio.run(token_manager.get_valid_access_token("whoop"))

    assert token == "new-access"
    save_mock.assert_awaited()
    kwargs = save_mock.await_args.kwargs
    assert kwargs["refresh_token"] == "refresh-v2"
    assert kwargs["access_token"] == "new-access"


def test_refresh_recovers_when_another_worker_already_rotated():
    raced = _bundle(
        access_token="winner-access",
        refresh_token="refresh-v2",
        expires_at=(datetime.now(timezone.utc) + timedelta(hours=1)).isoformat().replace(
            "+00:00", "Z"
        ),
        updated_at="2026-07-18T09:05:00Z",
    )
    request = httpx.Request("POST", "https://api.prod.whoop.com/oauth/oauth2/token")
    response = httpx.Response(400, request=request, text='{"error":"invalid_grant"}')

    with (
        patch(
            "api.integrations.token_manager.get_provider_token_bundle",
            new=AsyncMock(side_effect=[_bundle(), _bundle(), raced]),
        ),
        patch(
            "api.integrations.token_manager.acquire_token_refresh_lock",
            new=AsyncMock(return_value=True),
        ),
        patch(
            "api.integrations.token_manager.release_token_refresh_lock",
            new=AsyncMock(),
        ),
        patch(
            "api.integrations.token_manager.whoop.refresh_access_token",
            new=AsyncMock(
                side_effect=httpx.HTTPStatusError("bad", request=request, response=response)
            ),
        ),
        patch(
            "api.integrations.token_manager.save_provider_tokens",
            new=AsyncMock(return_value=True),
        ) as save_mock,
    ):
        token = asyncio.run(token_manager.get_valid_access_token("whoop"))

    assert token == "winner-access"
    save_mock.assert_not_awaited()


def test_waits_for_lock_holder_instead_of_double_refresh():
    held = _bundle(
        access_token="held-access",
        expires_at=(datetime.now(timezone.utc) + timedelta(hours=1)).isoformat().replace(
            "+00:00", "Z"
        ),
    )

    with (
        patch(
            "api.integrations.token_manager.get_provider_token_bundle",
            new=AsyncMock(side_effect=[_bundle(), held]),
        ),
        patch(
            "api.integrations.token_manager.acquire_token_refresh_lock",
            new=AsyncMock(return_value=False),
        ),
        patch(
            "api.integrations.token_manager.release_token_refresh_lock",
            new=AsyncMock(),
        ),
        patch(
            "api.integrations.token_manager.whoop.refresh_access_token",
            new=AsyncMock(),
        ) as refresh_mock,
        patch("api.integrations.token_manager.asyncio.sleep", new=AsyncMock()),
    ):
        token = asyncio.run(token_manager.get_valid_access_token("whoop"))

    assert token == "held-access"
    refresh_mock.assert_not_awaited()
