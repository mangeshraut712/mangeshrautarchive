"""Tests for OpenRouter TTS / AssistMe Voice Mode endpoints."""

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.index import app
from api.routes import tts as tts_route


@pytest.fixture
def client():
    return TestClient(app)


def test_tts_health_unconfigured(client, monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    response = client.get("/api/tts/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["available"] is False
    assert payload["provider"] == "openrouter"
    assert payload["mode"] == "modular-stt-llm-tts"


def test_tts_health_configured(client, monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "or-test-key")
    monkeypatch.setenv("OPENROUTER_TTS_MODEL", "x-ai/grok-voice-tts-1.0")
    monkeypatch.setenv("OPENROUTER_TTS_VOICE", "eve")

    response = client.get("/api/tts/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["available"] is True
    assert payload["model"] == "x-ai/grok-voice-tts-1.0"
    assert payload["voice"] == "eve"


def test_tts_synthesize_unconfigured_returns_503(client, monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    response = client.post("/api/tts", json={"text": "Hello from AssistMe"})

    assert response.status_code == 503


def test_tts_normalize_strips_markdown():
    cleaned = tts_route.normalize_for_tts("**Hello** visit https://example.com and `code`")
    assert "Hello" in cleaned
    assert "link" in cleaned
    assert "**" not in cleaned
    assert "`" not in cleaned


def test_tts_synthesize_proxies_openrouter(client, monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "or-test-key")

    class FakeResponse:
        status_code = 200
        content = b"ID3fake-mp3"
        headers = {"content-type": "audio/mpeg", "x-generation-id": "gen_test"}
        text = ""

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, headers=None, json=None):
            assert "audio/speech" in url
            assert headers["Authorization"] == "Bearer or-test-key"
            assert json["input"]
            assert json["voice"]
            return FakeResponse()

    monkeypatch.setattr(tts_route.httpx, "AsyncClient", FakeAsyncClient)

    response = client.post(
        "/api/tts",
        json={"text": "Hello AssistMe", "response_format": "mp3"},
    )

    assert response.status_code == 200
    assert response.content == b"ID3fake-mp3"
    assert "audio" in response.headers.get("content-type", "")
    assert response.headers.get("x-tts-provider") == "openrouter"


def test_tts_synthesize_ignores_client_model_override(client, monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "or-test-key")
    monkeypatch.setenv("OPENROUTER_TTS_MODEL", "x-ai/grok-voice-tts-1.0")
    monkeypatch.setenv("OPENROUTER_TTS_VOICE", "eve")

    captured = {}

    class FakeResponse:
        status_code = 200
        content = b"ID3fake-mp3"
        headers = {"content-type": "audio/mpeg", "x-generation-id": "gen_test"}
        text = ""

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, headers=None, json=None):
            captured["json"] = json
            return FakeResponse()

    monkeypatch.setattr(tts_route.httpx, "AsyncClient", FakeAsyncClient)

    response = client.post(
        "/api/tts",
        json={
            "text": "Hello AssistMe",
            "model": "google/gemini-3.1-flash-tts-preview",
            "voice": "Puck",
            "response_format": "mp3",
        },
    )

    assert response.status_code == 200
    assert captured["json"]["model"] == "x-ai/grok-voice-tts-1.0"
    assert captured["json"]["voice"] == "eve"


def test_voice_mode_context_prompt_includes_spoken_rules():
    from api.config import build_context_prompt

    prompt = build_context_prompt("Who is Mangesh?", {"mode": "voice"})
    assert "Voice Mode" in prompt
    assert "markdown" in prompt.lower()
