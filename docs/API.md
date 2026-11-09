# AssistMe API (FastAPI)

Backend for the portfolio chatbot, monitoring probes, GitHub proxy, media helpers, and third-party integrations. Entry point: `api/index.py` (Vercel serverless). Local dev: `npm run dev:backend` → `http://127.0.0.1:8001`.

## Runtime

| Item         | Value                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------- |
| Framework    | FastAPI, Pydantic v2 (versions in `requirements.txt` and `pyproject.toml`)                    |
| LLM proxy    | OpenRouter (`api/model_router.py`, `api/routes/chat.py`)                                      |
| Offline mode | When `OPENROUTER_API_KEY` is unset, chat returns canned portfolio answers                     |
| Docs         | `/api/docs`, `/api/redoc`, `/api/openapi.json` (non-production or `ENABLE_PUBLIC_API_DOCS=1`) |
| WebMCP       | Browser-side agentic tools in `src/js/modules/agentic-actions.js` (not HTTP routes)           |

## Route modules

Routers are mounted in `api/index.py`:

| Module               | Prefix / paths                                                                                          | Purpose                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `chat.py`            | `POST /api/chat`, `GET /api/chat/health`, `GET /api/models`, conversation CRUD                          | Streaming AssistMe chat via OpenRouter; session memory                         |
| `general.py`         | `GET /api`, `GET /api/health`, `GET /api/status`, `POST /api/contact`, `POST /api/newsletter/subscribe` | App status and contact forms                                                   |
| `github.py`          | `GET /api/github/proxy`, `GET /api/github/repos/public`, profile/repos                                  | GitHub API proxy for projects showcase                                         |
| `media.py`           | `GET /api/music/artwork`, `/api/music/recent`, `/api/posters/*`                                         | Last.fm artwork, movie/book poster helpers                                     |
| `monitor.py`         | `/api/monitor/*`, `/monitor/*`                                                                          | System monitor metrics, events, engineering telemetry, CSP reports, web vitals |
| `analytics.py`       | `GET/POST /api/analytics/*`                                                                             | Lightweight view/reach tracking                                                |
| `personalization.py` | `/api/memory/*`, `/api/personalization/*`                                                               | Chat memory stats, preferences export/delete, greeting                         |
| `integrations.py`    | `/api/integrations/*`, OAuth connect/callback, health sync                                              | WHOOP, Withings, Google Calendar via Supabase token store                      |
| `realtime.py`        | `GET /api/realtime/health`, `GET /api/realtime/session`, `WebSocket /api/realtime/ws`                   | Realtime voice session and server-side WebSocket proxy                         |
| `tts.py`             | `GET/POST /api/tts/*`                                                                                   | Text-to-speech synthesis                                                       |
| `vector_search.py`   | `POST /api/vector-search`                                                                               | Vector search                                                                  |
| `ingest_url.py`      | `POST /api/ingest-url`                                                                                  | URL ingestion                                                                  |

Many monitor and GitHub paths are duplicated with and without the `/api` prefix for legacy clients.

## Chat flow

1. Frontend chat modules POST to the configured API base with message history and optional tool results. GitHub Pages uses the Worker; local development proxies `/api/*` to FastAPI.
2. `chat.py` builds a system prompt from `api/site_knowledge.py` + `api/config.py` portfolio facts.
3. When configured, the backend consumes OpenRouter provider streams and returns newline-delimited JSON (`application/x-ndjson`) to the browser; otherwise local intelligence fallback runs.
4. Browser-side actions and WebMCP tools are implemented in `agentic-actions.js`. Compatible browser agents can call the registered tools, including read-only blog search and case-study inspection; the chatbot also has its own local action handling.

WebMCP remains an experimental browser feature. The site uses `document.modelContext` when present and falls back to the earlier `navigator.modelContext` integration. See the [WebMCP proposal](https://github.com/webmachinelearning/webmcp) and [Chrome's WebMCP guide](https://developer.chrome.com/docs/ai/webmcp) for current availability.

## Integrations (OAuth)

Provider logic lives under `api/integrations/`:

- **WHOOP** — recovery/sleep summaries
- **Withings** — body composition measures
- **Google Calendar** — availability / watch sync

The active Cloudflare Worker also exposes:

- `GET /api/calendar/availability` — sanitized 30-minute free slots only.
- `POST /api/calendar/book` — signed-slot booking with conflict recheck, Calendar invitation email, Google Meet, and owner reminders.
- `GET /api/integrations/google-calendar/connect` and `GET /api/calendar/callback/google` — protected owner OAuth on the permanent Worker callback.

Google access uses only `calendar.events.owned` and `calendar.freebusy`; Gmail mailbox access is not requested. OAuth tokens remain encrypted in Supabase, while booking audit rows are RLS-protected and service-role-only.

After a confirmed booking, the browser can generate one RFC 5545 `.ics` event locally for Apple Calendar or Outlook. This fallback does not contact Apple or Microsoft and does not require another OAuth grant.

Connect flows use `api/integrations/oauth_state.py` and optional `INTEGRATION_ADMIN_TOKEN` for admin-only sync endpoints.

## Environment

See `.env.example`. Minimum for real LLM responses:

- `OPENROUTER_API_KEY`
- Optional: `OPENROUTER_MODEL`, `OPENROUTER_SITE_URL`

Integration keys (Supabase, WHOOP, Withings, Google) are optional for local dev.

## Tests

```bash
npm run test:api   # pytest tests in tests/api/
```

## Deploy notes

- **GitHub Pages** ships static `dist/`; browser API calls use the Cloudflare Worker. The Worker persists newsletter and contact submissions in RLS-protected Supabase tables with server-only service-role credentials.
- **Cloudflare Worker** (`workers/assistme-chat/`) is the primary active edge API for GitHub Pages, proxying OpenRouter LLM requests, caching catalog probes, and serving `/api/github/profile`.
- **Vercel** serverless functions use `api/index.py`; local development runs on port 8001. Live Vercel deployment is currently disabled. `vercel.json` is optional according to the repository doctor and is currently absent.
