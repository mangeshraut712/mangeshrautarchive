"""Tests for chat API validation and error handling."""

import os

import httpx
import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.config import rate_limit_store
from api.config import normalize_openrouter_model
from api.index import app
from api.routes.chat import openrouter_request_body
from api.site_knowledge import (
    format_blog_release_summary,
    format_usa_state_summary,
    retrieve_site_context,
    should_use_web_tools,
)


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


def test_site_knowledge_retrieves_travel_and_monitor_pages():
    travel = retrieve_site_context("What is on the travel atlas page?", {})
    monitor = retrieve_site_context("Explain the system monitor APIs", {})

    assert "Travel Atlas" in travel
    assert "cities" in travel.lower()
    assert "System Monitor" in monitor
    assert "api" in monitor.lower()


def test_web_tools_are_gated_to_fresh_external_questions():
    site_context = retrieve_site_context("What is on the travel atlas page?", {})

    assert should_use_web_tools("What is on the travel atlas page?", site_context) is False
    assert should_use_web_tools("latest OpenRouter Parallel web search updates", site_context) is True


def test_openrouter_body_adds_parallel_web_tools_only_when_enabled():
    messages = [{"role": "user", "content": "latest OpenRouter updates"}]

    plain = openrouter_request_body("google/gemini-2.5-flash", messages)
    with_tools = openrouter_request_body(
        "google/gemini-2.5-flash",
        messages,
        web_tools_enabled=True,
    )

    assert "tools" not in plain
    assert with_tools["tools"][0]["type"] == "openrouter:web_search"
    assert with_tools["tools"][0]["parameters"]["engine"] == "parallel"
    assert with_tools["tools"][1]["type"] == "openrouter:web_fetch"


def test_deprecated_openrouter_model_maps_to_current_supported_model():
    assert normalize_openrouter_model("x-ai/grok-4.1-fast") == "x-ai/grok-4.3"
    assert normalize_openrouter_model("missing/provider-model") == "google/gemini-2.5-flash"


def test_chat_upstream_http_error_returns_local_fallback(client, monkeypatch):
    monkeypatch.setattr("api.routes.chat.get_openrouter_api_key", lambda: "configured")

    async def fail_model_call(*_args, **_kwargs):
        request = httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions")
        response = httpx.Response(
            404,
            request=request,
            text='{"error":{"message":"model deprecated","code":404}}',
        )
        raise httpx.HTTPStatusError("model deprecated", request=request, response=response)

    monkeypatch.setattr("api.routes.chat.call_openrouter", fail_model_call)

    response = client.post(
        "/api/chat",
        json={"message": "hello", "stream": False},
    )

    assert response.status_code == 200
    payload = response.json()
    # Upstream HTTP errors use a specific reason instead of the generic offline label.
    assert payload["source"] == "OpenRouter HTTP 404"
    assert payload["model"] == "Local-FastAPI"
    assert payload.get("fallback_reason") == "OpenRouter HTTP 404"
    assert payload.get("type") == "local"
    assert "temporarily unavailable" in payload["answer"].lower()


def test_chat_local_mode_uses_public_site_knowledge(client, monkeypatch):
    monkeypatch.setattr("api.routes.chat.get_openrouter_api_key", lambda: "")

    response = client.post(
        "/api/chat",
        json={"message": "What is on the travel atlas page?", "stream": False},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "Local Intelligence"
    assert payload["knowledge_context"] is True
    assert "Travel Atlas" in payload["answer"]


def test_travel_summary_counts_usa_states_from_site_data():
    summary = format_usa_state_summary()

    assert "54 USA stops" in summary
    assert "18 states/districts" in summary
    assert "Pennsylvania" in summary
    assert "District of Columbia" in summary


def test_blog_release_summary_finds_june_2026_titles():
    summary = format_blog_release_summary("June 2026 blog releases")

    assert "WWDC 2026 Field Notes: Liquid Glass Maturity, Apple Intelligence, and Siri" in summary
    assert "NotebookLM 2026 Field Notes: From Document Q&A to Research Workflow" in summary


def test_chat_local_mode_answers_travel_state_and_blog_release_questions(client, monkeypatch):
    monkeypatch.setattr("api.routes.chat.get_openrouter_api_key", lambda: "")

    states = client.post(
        "/api/chat",
        json={"message": "How many states have I visited in USA?", "stream": False},
    ).json()
    blogs = client.post(
        "/api/chat",
        json={"message": "What two new blogs released in June 2026?", "stream": False},
    ).json()

    assert "18 states/districts" in states["answer"]
    assert "54 USA stops" in states["answer"]
    assert "WWDC 2026 Field Notes" in blogs["answer"]
    assert "NotebookLM 2026 Field Notes" in blogs["answer"]


def test_chat_direct_travel_answer_bypasses_model_when_key_exists(client, monkeypatch):
    monkeypatch.setattr("api.routes.chat.get_openrouter_api_key", lambda: "configured")

    async def fail_model_call(*_args, **_kwargs):
        raise AssertionError("Direct site-data answers should not call OpenRouter")

    monkeypatch.setattr("api.routes.chat.call_openrouter", fail_model_call)

    response = client.post(
        "/api/chat",
        json={"message": "How many states of USA have I visited?", "stream": False},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "Site Knowledge"
    assert payload["model"] == "Travel Atlas Index"
    assert "18 states/districts" in payload["answer"]
    assert "54 USA stops" in payload["answer"]


def test_chat_local_stream_returns_ndjson_site_answer(client, monkeypatch):
    monkeypatch.setattr("api.routes.chat.get_openrouter_api_key", lambda: "")

    with client.stream(
        "POST",
        "/api/chat",
        json={"message": "How many states of USA have I visited?", "stream": True},
    ) as response:
        body = "".join(response.iter_text())

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/x-ndjson")
    assert '"type": "chunk"' in body
    assert "18 states/districts" in body


def test_local_mode_does_not_match_work_inside_networking(client, monkeypatch):
    monkeypatch.setattr("api.routes.chat.get_openrouter_api_key", lambda: "")

    response = client.post(
        "/api/chat",
        json={
            "message": "Explain the difference between TCP and UDP in networking.",
            "stream": False,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["category"] != "Experience"
    assert "Professional Experience" not in payload["answer"]


def test_chat_health_reports_provider_status(client, monkeypatch):
    monkeypatch.setattr("api.routes.chat.get_openrouter_api_key", lambda: "")

    response = client.get("/api/chat/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "openrouter"
    assert payload["provider_status"] == "local_only"
    assert payload["streaming"] == "ndjson"
