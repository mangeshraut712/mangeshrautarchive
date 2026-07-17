"""Tests for AI Gateway realtime voice session endpoints."""

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.index import app


@pytest.fixture
def client():
    return TestClient(app)


def test_realtime_health_unconfigured(client, monkeypatch):
    monkeypatch.delenv("AI_GATEWAY_API_KEY", raising=False)
    monkeypatch.delenv("VERCEL_AI_GATEWAY_API_KEY", raising=False)

    response = client.get("/api/realtime/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["available"] is False
    assert payload["provider"] == "vercel-ai-gateway"
    assert payload["mode"] == "server-proxied-websocket"


def test_realtime_health_configured(client, monkeypatch):
    monkeypatch.setenv("AI_GATEWAY_API_KEY", "gateway-test-key")

    response = client.get("/api/realtime/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["available"] is True
    assert payload["model"] == "openai/gpt-realtime-2"


def test_realtime_session_unconfigured_returns_503(client, monkeypatch):
    monkeypatch.delenv("AI_GATEWAY_API_KEY", raising=False)
    monkeypatch.delenv("VERCEL_AI_GATEWAY_API_KEY", raising=False)

    response = client.get("/api/realtime/session")

    assert response.status_code == 503
    payload = response.json()
    assert payload["success"] is False
    assert payload["available"] is False


def test_realtime_session_configured(client, monkeypatch):
    monkeypatch.setenv("AI_GATEWAY_API_KEY", "gateway-test-key")
    monkeypatch.setenv("AI_GATEWAY_REALTIME_VOICE", "verse")

    response = client.get(
        "/api/realtime/session",
        headers={"Origin": "https://mangeshraut.pro"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["available"] is True
    assert "/api/realtime/ws?token=" in payload["wsUrl"]
    assert payload["mintExpiresIn"] == 60
    assert payload["sessionDefaults"]["voice"] == "verse"
    assert "AssistMe" in payload["sessionDefaults"]["instructions"]


def test_realtime_session_rejects_disallowed_origin(client, monkeypatch):
    monkeypatch.setenv("AI_GATEWAY_API_KEY", "gateway-test-key")

    response = client.get(
        "/api/realtime/session",
        headers={"Origin": "https://evil.example"},
    )

    assert response.status_code == 403
    payload = response.json()
    assert payload["success"] is False


def test_realtime_ws_rejects_missing_mint_token(client, monkeypatch):
    monkeypatch.setenv("AI_GATEWAY_API_KEY", "gateway-test-key")

    with client.websocket_connect(
        "/api/realtime/ws",
        headers={"Origin": "https://mangeshraut.pro"},
    ) as websocket:
        # Server accepts then closes with policy violation
        try:
            websocket.receive()
        except Exception:
            pass


def test_mint_gateway_realtime_client_secret(monkeypatch):
    monkeypatch.setenv("AI_GATEWAY_API_KEY", "gateway-test-key")

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"token": "vcst_test_token"}

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, headers=None, json=None):
            assert url.endswith("/v1/realtime/client-secrets")
            assert headers["Authorization"] == "Bearer gateway-test-key"
            assert json["model"] == "openai/gpt-realtime-2"
            assert "instructions" in json["session"]
            return FakeResponse()

    monkeypatch.setattr("api.ai_gateway_realtime.httpx.AsyncClient", lambda **kwargs: FakeClient())

    import asyncio
    from api.ai_gateway_realtime import mint_gateway_realtime_client_secret

    token = asyncio.run(
        mint_gateway_realtime_client_secret(session={"instructions": "AssistMe test"})
    )
    assert token == "vcst_test_token"
