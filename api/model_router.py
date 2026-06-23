"""Intelligent OpenRouter model routing for AssistMe chat."""

from __future__ import annotations

import re
from typing import List, Optional, Tuple

from api.config import (
    AUTO_ROUTER_MODEL,
    FALLBACK_OPENROUTER_MODEL,
    FUSION_MODEL,
    PRIMARY_OPENROUTER_MODEL,
    normalize_openrouter_model,
)
from api.site_knowledge import should_use_web_tools

PRIMARY_MODEL = PRIMARY_OPENROUTER_MODEL

OPENROUTER_ROUTER_MODELS = frozenset(
    {
        AUTO_ROUTER_MODEL,
        FUSION_MODEL,
    }
)

# Models we allow Auto Router to pick from (recent, capable families only)
AUTO_ROUTER_ALLOWED = [
    "x-ai/grok-*",
    "google/gemini-*",
    "anthropic/claude-*",
    "openai/gpt-5*",
]

PORTFOLIO_QUERY_RE = re.compile(
    r"\b("
    r"mangesh|portfolio|resume|cv|skills?|experience|projects?|education|"
    r"drexel|github|linkedin|certification|publication|award|contact|hire|"
    r"employment|background|tech stack|who is|tell me about|work history"
    r")\b",
    re.I,
)

FUSION_QUERY_RE = re.compile(
    r"\b("
    r"compare|versus|vs\.?|pros and cons|trade[- ]?offs?|debate|synthesize|"
    r"multiple perspectives|in[- ]depth analysis|which is better|best approach|"
    r"evaluate options|critique|research report|expert review|"
    r"advantages and disadvantages|difference between.+(and|vs)"
    r")\b",
    re.I,
)

MATH_OR_TRIVIA_RE = re.compile(
    r"^\s*(what is|calculate|solve|compute)\b.{0,80}$",
    re.I,
)


def is_portfolio_query(message: str, site_context: str = "") -> bool:
    lower = (message or "").lower()
    if PORTFOLIO_QUERY_RE.search(lower):
        return True
    if site_context and any(
        token in lower for token in ("mangesh", "portfolio", "this site", "your website")
    ):
        return True
    return False


def is_fusion_query(message: str) -> bool:
    return bool(FUSION_QUERY_RE.search(message or ""))


def resolve_chat_model(
    message: str,
    *,
    requested_model: Optional[str] = None,
    site_context: str = "",
    stream: bool = True,
) -> Tuple[str, bool, str]:
    """
    Pick the best OpenRouter model for a user turn.

    Returns (model_id, web_tools_enabled, routing_tier).
    """
    web_tools = should_use_web_tools(message, site_context)

    if requested_model:
        explicit = normalize_openrouter_model(requested_model)
        if explicit in OPENROUTER_ROUTER_MODELS or explicit.startswith("openrouter/"):
            return explicit, web_tools or explicit == FUSION_MODEL, "explicit"

    if is_fusion_query(message) and not is_portfolio_query(message, site_context):
        if stream:
            return AUTO_ROUTER_MODEL, True, "fusion-stream"
        return FUSION_MODEL, True, "fusion"

    if is_portfolio_query(message, site_context):
        return PRIMARY_MODEL, web_tools, "portfolio"

    if MATH_OR_TRIVIA_RE.search(message or "") and len(message) < 120:
        return FALLBACK_OPENROUTER_MODEL, False, "fast"

    return AUTO_ROUTER_MODEL, web_tools, "auto"


def build_model_fallback_chain(primary_model: str) -> List[str]:
    """Ordered fallbacks: primary → Grok → Auto Router → Gemini Flash."""
    chain: List[str] = []

    def add(model: str) -> None:
        normalized = (
            model
            if model in OPENROUTER_ROUTER_MODELS or model.startswith("openrouter/")
            else normalize_openrouter_model(model)
        )
        if normalized and normalized not in chain:
            chain.append(normalized)

    add(primary_model)
    if primary_model != PRIMARY_MODEL:
        add(PRIMARY_MODEL)
    if primary_model != AUTO_ROUTER_MODEL:
        add(AUTO_ROUTER_MODEL)
    add(FALLBACK_OPENROUTER_MODEL)
    return chain
