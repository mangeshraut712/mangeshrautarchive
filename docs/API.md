# AssistMe API (FastAPI)

Backend for the portfolio chatbot, monitoring probes, GitHub proxy, media helpers, and third-party integrations. Entry point: `api/index.py` (Vercel serverless). Local dev: `npm run dev:backend` → `http://127.0.0.1:8001`.

## Runtime

| Item         | Value                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------- |
| Framework    | FastAPI 3.x (`api/index.py`)                                                                  |
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
| `realtime.py`        | `GET /api/realtime/health`, `WebSocket /api/realtime/ws`                                                | Realtime voice session (Vercel rewrite → `api/realtime-ws.js`)                 |
| `tts.py`             | `GET/POST /api/tts/*`                                                                                   | Text-to-speech synthesis                                                       |

Many monitor and GitHub paths are duplicated with and without the `/api` prefix for legacy clients.

## Chat flow

1. Frontend (`src/js/core/chat.js`) POSTs to `/api/chat` with message history and optional tool results.
2. `chat.py` builds a system prompt from `api/site_knowledge.py` + `api/config.py` portfolio facts.
3. When configured, requests stream from OpenRouter; otherwise local intelligence fallback runs.
4. WebMCP tool calls are handled in the browser (`agentic-actions.js`); tool output is sent back in follow-up chat turns.

## Integrations (OAuth)

Provider logic lives under `api/integrations/`:

- **WHOOP** — recovery/sleep summaries
- **Withings** — body composition measures
- **Google Calendar** — availability / watch sync

Connect flows use `api/integrations/oauth_state.py` and optional `INTEGRATION_ADMIN_TOKEN` for admin-only sync endpoints.

## Environment

See `.env.example`. Minimum for real LLM responses:

- `OPENROUTER_API_KEY`
- Optional: `OPENROUTER_MODEL`, `OPENROUTER_SITE_URL`

Integration keys (Supabase, WHOOP, Withings, Google) are optional for local dev.

## Tests

```bash
source venv/bin/activate
npm run test:api   # 156 pytest tests in tests/api/
```

## Deploy notes

- **GitHub Pages** ships static `dist/` only (no `/api` on Pages).
- **Vercel** serves `dist/` + `/api/*` → `api/index.py`. `vercel.json` sets `git.deploymentEnabled: false`; production API deploys are manual or via separate Vercel project hooks, not auto on every `main` push.
- **Cloudflare Worker** (`workers/assistme-chat/`) can front chat when Vercel apex is `DEPLOYMENT_DISABLED`.
