"""Free-only policy remains enforced even with paid settings or client overrides."""
import pytest
from api.config import FREE_OPENROUTER_MODEL, normalize_openrouter_model, is_free_model
from api.model_router import build_model_fallback_chain, resolve_chat_model
from api.routes.chat import openrouter_request_body, _fallback_models


@pytest.mark.parametrize("requested", ["openrouter/auto", "openrouter/fusion", "x-ai/grok-4.3"])
def test_paid_models_cannot_be_selected(requested, monkeypatch):
    monkeypatch.setenv("OPENROUTER_MODEL", requested)
    assert normalize_openrouter_model(requested) == FREE_OPENROUTER_MODEL
    model, web, tier = resolve_chat_model("Compare latest models", requested_model=requested)
    assert is_free_model(model) and not web and tier.endswith("-free")
    body = openrouter_request_body(requested, [{"role": "user", "content": "news"}], web_tools_enabled=True)
    assert is_free_model(body["model"])
    assert "tools" not in body and "plugins" not in body
    assert body["provider"]["max_price"] == {"prompt": 0, "completion": 0}


@pytest.mark.parametrize("media", ["text", "image_url", "input_audio", "video_url"])
def test_fallbacks_are_free_and_modality_compatible(media):
    chain = _fallback_models("openrouter/auto", [{"role": "user", "content": [{"type": media}]}])
    assert chain and all(is_free_model(m) for m in chain)
    assert len(chain) == len(set(chain))
    if media in ("input_audio", "video_url"):
        assert "openrouter/free" not in chain


def test_default_remains_live_verified_free_primary():
    assert build_model_fallback_chain(FREE_OPENROUTER_MODEL)[0] == FREE_OPENROUTER_MODEL


def test_pdf_uses_free_text_extraction():
    body = openrouter_request_body(FREE_OPENROUTER_MODEL, [{"role": "user", "content": [{"type": "file"}]}])
    assert body["plugins"] == [{"id": "file-parser", "pdf": {"engine": "cloudflare-ai"}}]


def test_worker_and_fastapi_route_identical_free_catalog(monkeypatch):
    import json
    import subprocess
    from pathlib import Path
    from api import model_router
    from api.config import CHAT_POLICY
    monkeypatch.setattr(model_router, "_models", CHAT_POLICY["models"])
    monkeypatch.setenv("OPENROUTER_MODEL", FREE_OPENROUTER_MODEL)
    cases = [["Explain distributed systems", ["text"]], ["Debug JavaScript", ["text"]],
             ["Hello", ["text"]], ["Describe", ["text", "image"]],
             ["Transcribe", ["text", "audio"]], ["Summarize", ["text", "video"]]]
    script = """
import policy from './api/chat_policy.json' with {type:'json'};
globalThis.fetch = async () => Response.json({data:policy.models.map(m=>({id:m.id,pricing:{prompt:'0',completion:'0'},architecture:{input_modalities:m.inputs,output_modalities:['text']}}))});
const {selectModelRoute}=await import('./workers/assistme-chat/src/model-routing.js');
const cases=JSON.parse(process.argv[1]);
console.log(JSON.stringify(await Promise.all(cases.map(async ([q,m])=>(await selectModelRoute({},q,m)).chain))));
"""
    result = subprocess.run(["node", "--input-type=module", "-e", script, json.dumps(cases)], cwd=Path(__file__).resolve().parents[2], check=True, capture_output=True, text=True)
    assert json.loads(result.stdout) == [model_router.model_chain(q, m) for q, m in cases]


def test_catalog_refresh_excludes_any_nonzero_price(monkeypatch):
    import asyncio
    from api import model_router
    import httpx
    rows = []
    for name, pricing in [("new/model:free", {"prompt": "0", "completion": "0"}),
                          ("paid/addon:free", {"prompt": "0", "completion": "0", "request": "0.01"}),
                          ("missing/price:free", {})]:
        rows.append({"id": name, "pricing": pricing, "architecture": {"input_modalities": ["text"], "output_modalities": ["text"]}})
    real_client = httpx.AsyncClient
    monkeypatch.setattr(model_router, "_refresh_after", 0)
    monkeypatch.setattr(model_router, "_models", [])
    monkeypatch.setattr(model_router.httpx, "AsyncClient", lambda **kwargs: real_client(transport=httpx.MockTransport(lambda req: httpx.Response(200, json={"data": rows}))))
    asyncio.run(model_router.refresh_model_catalog())
    assert [m["id"] for m in model_router._models] == ["new/model:free"]
