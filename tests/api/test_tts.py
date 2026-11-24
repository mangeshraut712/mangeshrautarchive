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
    assert payload["available"] is False
    assert payload["model"] is None
    assert payload["voice"] is None


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


def test_tts_normalize_handles_adversarial_markdown_links_linearly():
    cleaned = tts_route.normalize_for_tts("![alt](https://example.com/x) [label](javascript:bad)")
    assert cleaned == "alt label"


def test_tts_synthesize_never_spends_with_configured_key(client, monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-placeholder")
    response = client.post("/api/tts", json={"text": "Hello"})
    assert response.status_code == 503
    assert "free-only" in str(response.json())


def test_tts_synthesize_ignores_paid_client_override(client, monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-placeholder")
    response = client.post("/api/tts", json={"text": "Hello", "model": "paid/voice"})
    assert response.status_code == 503


def test_voice_mode_context_prompt_includes_spoken_rules():
    from api.config import build_context_prompt

    prompt = build_context_prompt("Who is Mangesh?", {"mode": "voice"})
    assert "Voice Mode" in prompt
    assert "markdown" in prompt.lower()
