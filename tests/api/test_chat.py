"""Tests for chat API validation and error handling."""

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.config import rate_limit_store
from api.index import app


@pytest.fixture
def client():
    rate_limit_store.clear()
    return TestClient(app)


def test_chat_rejects_whitespace_only_message(client):
    response = client.post("/api/chat", json={"message": "   ", "stream": False})

    assert response.status_code == 400


def test_chat_rate_limited_returns_429(client, monkeypatch):
    monkeypatch.setattr("api.routes.chat.check_rate_limit", lambda _client_ip: False)

    response = client.post("/api/chat", json={"message": "hello", "stream": False})

    assert response.status_code == 429
    payload = response.json()
    assert payload["success"] is False
    assert payload["error"]["type"] == "http_error"
