"""Tests for intelligent OpenRouter model routing."""

import os

from api.config import FREE_OPENROUTER_MODEL, normalize_openrouter_model
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


def test_resolve_portfolio_query_uses_grok(monkeypatch):
    monkeypatch.delenv("OPENROUTER_MODEL", raising=False)
    model, web, tier = resolve_chat_model(
        "What are Mangesh's top Java skills?",
        site_context="Skills section content",
        stream=True,
    )
    assert model == ROUTER_PRIMARY_MODEL
    assert tier == "portfolio"
    assert web is False


def test_resolve_portfolio_query_uses_free_when_env_free(monkeypatch):
    monkeypatch.setenv("OPENROUTER_MODEL", FREE_OPENROUTER_MODEL)
    model, web, tier = resolve_chat_model(
        "What are Mangesh's top Java skills?",
        site_context="Skills section content",
        stream=True,
    )
    assert model == FREE_OPENROUTER_MODEL
    assert tier == "portfolio-free"
    assert web is False


def test_resolve_general_query_uses_auto_router(monkeypatch):
    monkeypatch.delenv("OPENROUTER_MODEL", raising=False)
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


def test_fallback_chain_includes_grok_auto_flash_and_free():
    chain = build_model_fallback_chain(ROUTER_PRIMARY_MODEL)
    assert chain[0] == ROUTER_PRIMARY_MODEL
    assert "openrouter/free" in chain
    # Free recovery should be early so 402 on paid models fails over quickly.
    assert chain.index("openrouter/free") < chain.index(AUTO_ROUTER_MODEL)
    assert AUTO_ROUTER_MODEL in chain
    assert "google/gemini-2.5-flash" in chain
    assert "google/gemma-4-26b-a4b-it:free" in chain


def test_auto_router_request_includes_plugins_and_session():
    body = openrouter_request_body(
        AUTO_ROUTER_MODEL,
        [{"role": "user", "content": "hello"}],
        session_id="sess-123",
    )
    assert body["session_id"] == "sess-123"
    assert body["plugins"][0]["id"] == "auto-router"
    assert body["plugins"][0]["cost_quality_tradeoff"] == 2
