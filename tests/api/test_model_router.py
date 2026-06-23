"""Tests for intelligent OpenRouter model routing."""

from api.config import normalize_openrouter_model
from api.model_router import (
    AUTO_ROUTER_MODEL,
    FUSION_MODEL,
    PRIMARY_MODEL as ROUTER_PRIMARY_MODEL,
    build_model_fallback_chain,
    resolve_chat_model,
)
from api.routes.chat import openrouter_request_body


def test_normalize_passes_openrouter_router_models():
    assert normalize_openrouter_model("openrouter/auto") == AUTO_ROUTER_MODEL
    assert normalize_openrouter_model("openrouter/fusion") == FUSION_MODEL
    assert normalize_openrouter_model("x-ai/grok-4.1-fast") == ROUTER_PRIMARY_MODEL


def test_resolve_portfolio_query_uses_grok():
    model, web, tier = resolve_chat_model(
        "What are Mangesh's top Java skills?",
        site_context="Skills section content",
        stream=True,
    )
    assert model == ROUTER_PRIMARY_MODEL
    assert tier == "portfolio"
    assert web is False


def test_resolve_general_query_uses_auto_router():
    model, _web, tier = resolve_chat_model(
        "Explain how TLS handshakes work in one paragraph.",
        stream=True,
    )
    assert model == AUTO_ROUTER_MODEL
    assert tier == "auto"


def test_resolve_compare_query_uses_fusion_when_not_streaming():
    model, web, tier = resolve_chat_model(
        "Compare microservices vs monolith pros and cons for a startup.",
        stream=False,
    )
    assert model == FUSION_MODEL
    assert web is True
    assert tier == "fusion"


def test_resolve_compare_query_uses_auto_when_streaming():
    model, web, tier = resolve_chat_model(
        "Compare REST vs GraphQL trade-offs for mobile apps.",
        stream=True,
    )
    assert model == AUTO_ROUTER_MODEL
    assert web is True
    assert tier == "fusion-stream"


def test_fallback_chain_includes_grok_auto_and_flash():
    chain = build_model_fallback_chain(ROUTER_PRIMARY_MODEL)
    assert chain[0] == ROUTER_PRIMARY_MODEL
    assert AUTO_ROUTER_MODEL in chain
    assert "google/gemini-2.5-flash" in chain


def test_auto_router_request_includes_plugins_and_session():
    body = openrouter_request_body(
        AUTO_ROUTER_MODEL,
        [{"role": "user", "content": "hello"}],
        session_id="sess-123",
    )
    assert body["session_id"] == "sess-123"
    assert body["plugins"][0]["id"] == "auto-router"
    assert body["plugins"][0]["cost_quality_tradeoff"] == 2
