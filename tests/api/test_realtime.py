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

    response = client.get("/api/realtime/session")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["available"] is True
    assert payload["wsUrl"].endswith("/api/realtime/ws")
    assert payload["sessionDefaults"]["voice"] == "verse"
    assert "AssistMe" in payload["sessionDefaults"]["instructions"]
