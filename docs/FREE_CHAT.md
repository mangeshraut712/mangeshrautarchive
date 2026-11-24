# Free-only AssistMe

Approved on November 24, 2026. GPT-6 / Codex implements consistent free inference, cited retrieval, and stream recovery. Exact model variant, reasoning mode, and token usage: unavailable.

## Inference and model freshness

`api/chat_policy.json` supplies both backends with the same seed models, capability preferences, and search intent patterns. Nemotron 3 Ultra remains the live-tested text primary. Lightning handles quick questions; Gemma handles images/video, with Nemotron Omni for audio. Compatible newer free models become fallback candidates through an hourly refresh of OpenRouter's public catalog. Newest does not automatically mean most capable.

Catalog entries must have a `:free` ID and zero prices across every reported pricing field. `openrouter/free` is allowed as a compatible free router. Client model overrides and old paid environment flags cannot enable Auto, Fusion, or paid recovery. Outbound inference also sets zero prompt/completion provider price limits. If no compatible free model answers, the assistant labels its local fallback and does not pretend to analyze an attachment.

Hosted OpenRouter web search, web-fetch tools, and speech generation are disabled. Read-aloud uses the browser/device. PDF processing explicitly uses the documented free `cloudflare-ai` parser; the default paid OCR engine is never selected.

## Retrieval and citations

Both backends query Google News RSS and, for entity questions, Wikipedia without API keys. Requests have short deadlines. Retrieved excerpts are supplied as untrusted user-role data, never system instructions or verified facts. Only HTTPS links without embedded credentials are exposed; duplicates are removed. Sources appear as clickable links. A failed lookup explicitly says current information could not be verified. Old portfolio articles and hardcoded leadership claims are not evidence of current events.

These feeds are best-effort retrieval, not a general web search SLA. Free models have provider quotas and availability limits; exhaustion does not enable spending.

## Streaming contract

A terminal completion frame is required. Unexpected EOF, provider errors, token limits, and content filtering cause recovery rather than a completed partial answer. Failed attempts reset prior text. Cancellation propagates without manufacturing a reply. The frontend restores an interrupted draft for retry. Both backends keep the same `sources`, `live_grounded`, and `live_sources` response fields; `live_grounded` means sources were retrieved, not that claims were independently verified.

## Verification

Run `npm run test:local`, `npm run test:worker`, and `npm run check`. API tests compare routing against the actual Worker implementation for six task/modalities cases, reject paid catalog pricing, and verify linked retrieval and stream interruption. Browser checks cover source links and draft recovery at phone, tablet, and desktop widths in both themes.

References: [free models](https://openrouter.ai/collections/free-models/), [public catalog](https://openrouter.ai/docs/api/api-reference/models/get-models), [PDF engines](https://openrouter.ai/docs/guides/overview/multimodal/pdfs), [stream errors](https://github.com/OpenRouterTeam/docs/blob/main/api_reference/streaming.mdx).
