"""Free-only, capability-aware OpenRouter routing shared with the edge policy."""
import re
import time
import httpx
from api.config import CHAT_POLICY, FREE_OPENROUTER_MODEL, get_default_model, is_free_model

PRIMARY_MODEL = FREE_OPENROUTER_MODEL
# Compatibility names; these are never eligible for inference.
AUTO_ROUTER_MODEL = "openrouter/auto"
FUSION_MODEL = "openrouter/fusion"
_models = [dict(m) for m in CHAT_POLICY["models"]]
_refresh_after = 0.0


async def refresh_model_catalog():
    global _models, _refresh_after
    if time.monotonic() < _refresh_after:
        return
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.get("https://openrouter.ai/api/v1/models")
            response.raise_for_status()
            models = []
            for m in response.json().get("data", []):
                pricing = m.get("pricing") or {}
                architecture = m.get("architecture") or {}
                if (m["id"].endswith(":free") and float(pricing.get("prompt", -1)) == 0
                        and float(pricing.get("completion", -1)) == 0
                        and all(float(price) == 0 for price in pricing.values())
                        and "text" in architecture.get("output_modalities", [])
                        and not re.search(r"content-safety|moderation|embed|rerank", m["id"], re.I)):
                    models.append({"id": m["id"], "inputs": architecture.get("input_modalities", [])})
            if not models:
                raise ValueError("Empty free catalog")
            _models = models
            _refresh_after = time.monotonic() + 3600
    except (httpx.HTTPError, ValueError, KeyError, TypeError, AttributeError):
        _refresh_after = time.monotonic() + 60


def task_for(message, modalities):
    for media in ("audio", "video", "image"):
        if media in modalities:
            return media
    if re.search(r"\b(code|debug|javascript|python|sql|function|programming|java|cpp|c\+\+|golang|go|rust|typescript|html|css|script|algorithm|syntax)\b", message, re.I):
        return "code"
    if len(message) < 100 and not re.search(r"\b(explain|compare|analy[sz]e|reason|why|research)\b", message, re.I):
        return "quick"
    return "reasoning"


def model_chain(message="", modalities=None, preferred=None):
    modalities = modalities or ["text"]
    task = task_for(message, modalities)
    compatible = [m["id"] for m in _models if all(t in m["inputs"] for t in modalities)]
    priorities = list(CHAT_POLICY["preferred"][task])
    if preferred:
        priorities.insert(0, preferred)
    elif task == "reasoning":
        priorities.insert(0, get_default_model())
    chain = [m for m in priorities if m in compatible] + compatible
    if all(t in ("text", "image") for t in modalities):
        chain.append("openrouter/free")
    return list(dict.fromkeys(m for m in chain if is_free_model(m)))[:7]


def resolve_chat_model(message, *, requested_model=None, site_context="", stream=True, has_images=False):
    del requested_model  # Client overrides cannot change the server-owned free policy.
    modalities = ["text", "image"] if has_images else ["text"]
    chain = model_chain(message, modalities)
    return chain[0] if chain else FREE_OPENROUTER_MODEL, False, task_for(message, modalities) + "-free"


def build_model_fallback_chain(primary_model, modalities=None):
    return model_chain(modalities=modalities, preferred=primary_model)
