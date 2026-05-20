# Mangesh Raut Portfolio

Production portfolio, AI assistant, operations monitor, travel atlas, and live engineering showcase for [mangeshraut.pro](https://mangeshraut.pro).

![Portfolio homepage](src/assets/images/home.png)

<p align="center">
  <a href="https://mangeshraut.pro"><img alt="Live site" src="https://img.shields.io/badge/live-mangeshraut.pro-0071e3?style=for-the-badge&logo=vercel&logoColor=white"></a>
  <a href="https://mangeshraut.pro/monitor"><img alt="System monitor" src="https://img.shields.io/badge/monitor-live-34c759?style=for-the-badge&logo=fastapi&logoColor=white"></a>
  <a href="https://mangeshraut712.github.io/mangeshrautarchive"><img alt="GitHub Pages" src="https://img.shields.io/badge/github_pages-static_fallback-181717?style=for-the-badge&logo=github&logoColor=white"></a>
  <a href="https://github.com/mangeshraut712/mangeshrautarchive/actions"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/mangeshraut712/mangeshrautarchive/deploy.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/mangeshraut712/mangeshrautarchive?style=for-the-badge"></a>
</p>

## Why This Exists

This is not a static resume page. It is a full-stack portfolio system built to demonstrate production engineering habits: a polished frontend, a FastAPI backend, live API integrations, monitoring, analytics, deployment fallbacks, security checks, and regression tests for the operational issues that matter most.

The site is designed around four principles:

- **Fast first impression:** a refined Apple-inspired interface, optimized assets, stable layout, and responsive dark/light theming.
- **Real functionality:** AI chat, GitHub activity, Last.fm music, portfolio reach analytics, travel data, booking actions, and monitor APIs are actual runtime features.
- **Operational visibility:** `/monitor` surfaces backend health, provider status, deployment surfaces, events, security checks, AI metrics, and browser-side latency probes.
- **Permanent fixes:** critical production behavior is guarded by tests, including Vercel API routing and post-deploy monitor/reach API checks.

## Live Surfaces

| Surface        | URL                                                                                                | Role                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Production     | [mangeshraut.pro](https://mangeshraut.pro)                                                         | Primary Vercel deployment with static frontend and FastAPI functions |
| System Monitor | [mangeshraut.pro/monitor](https://mangeshraut.pro/monitor)                                         | Live operations dashboard                                            |
| API Docs       | [mangeshraut.pro/api/docs](https://mangeshraut.pro/api/docs)                                       | FastAPI OpenAPI explorer                                             |
| Vercel App     | [mangeshrautarchive.vercel.app](https://mangeshrautarchive.vercel.app)                             | Vercel-generated deployment URL                                      |
| GitHub Pages   | [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive) | Static fallback using the same `dist/` build                         |

## Feature Map

| Area                  | What It Does                                                                                                  | Key Files                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Homepage              | Hero, profile identity, Portfolio Reach badge, now-playing card, projects, blog, contact, booking, newsletter | `src/index.html`, `src/assets/css/homepage.css`                                         |
| AssistMe AI           | Streaming portfolio assistant with backend OpenRouter integration and local fallback behavior                 | `src/js/modules/chatbot.js`, `api/index.py`                                             |
| System Monitor        | Health, metrics, services, deployment surfaces, events, security, AI provider metrics                         | `src/monitor.html`, `api/monitoring.py`                                                 |
| Portfolio Reach       | Authoritative engagement metric: page views + GitHub stars + forks + watchers                                 | `src/js/modules/analytics.js`, `api/analytics_store.py`                                 |
| GitHub Projects       | Live repository showcase with GitHub activity, search, sorting, and graceful fallback                         | `src/js/modules/github-projects.js`                                                     |
| Travel Atlas          | Map-led travel timeline, city normalization, Pune home-base guide, filters, spotlight mode                    | `src/travel.html`, `src/js/modules/travel-atlas.js`, `src/js/data/travel-engine.js`     |
| Currently             | Music, shows, books, local poster art, and external media links                                               | `src/js/modules/currently.js`, `src/assets/images/currently/`                           |
| Search and Navigation | Site search, dynamic island navbar, overlay menu, scroll lock, keyboard navigation                            | `src/js/modules/search.js`, `src/js/utils/smart-navbar.js`, `src/js/modules/overlay.js` |
| Quality Gates         | Lint, security scan, Vitest, Playwright, Lighthouse, post-deploy validation                                   | `tests/`, `scripts/`, `.github/workflows/`                                              |

## Architecture

```mermaid
flowchart TB
  subgraph Browser
    UI[Static HTML/CSS/ES modules]
    Reach[Portfolio Reach badge]
    Monitor[System Monitor UI]
    Travel[Travel Atlas]
  end

  subgraph Vercel
    CDN[Static dist assets]
    API[FastAPI app in api/index.py]
    MonitorAPI[/api/monitor/*]
    AnalyticsAPI[/api/analytics/*]
  end

  subgraph External
    OpenRouter[OpenRouter]
    GitHub[GitHub REST API]
    LastFM[Last.fm]
    VercelStatus[Vercel Status API]
  end

  UI --> CDN
  UI --> API
  Reach --> AnalyticsAPI
  Monitor --> MonitorAPI
  Travel --> CDN
  API --> OpenRouter
  API --> GitHub
  API --> LastFM
  MonitorAPI --> VercelStatus
```

### Deployment Model

- Vercel builds the frontend with `npm run build` and serves `dist/`.
- Vercel treats `api/index.py` as the Python/FastAPI handler (which imports and mounts modular sub-routers from `api/routes/`).
- A `vercel.json` rewrite routes `/api/:path*` to `/api/index` to handle nested API routes correctly.
- GitHub Pages is static-only. Runtime features that need a backend call `https://mangeshraut.pro/api/*` through public configuration.
- Secrets stay server-side in Vercel environment variables. Public config is limited to safe values such as API origin, app title, model name, and site URL.

## Production Guardrails

These checks exist because monitor and reach are production-critical:

| Guardrail                             | Purpose                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `tests/config/vercel-routing.spec.js` | Verifies `api/index.py` exists and handles monitor/reach API routes            |
| `tests/e2e/smoke.spec.js`             | Verifies the home page renders the visible `Portfolio Reach` badge             |
| `tests/e2e/postdeploy.spec.js`        | Verifies deployed `/api/monitor/status` and `/api/analytics/reach` return JSON |
| `scripts/security-check.js`           | Scans the repo for accidentally exposed API keys                               |
| `scripts/build.js`                    | Produces deterministic `dist/` output and safe browser config                  |

## Tech Stack

| Layer        | Tools                                                         |
| ------------ | ------------------------------------------------------------- |
| Frontend     | HTML, CSS, Tailwind output, ES modules, browser APIs          |
| Backend      | FastAPI, Pydantic, httpx, Uvicorn-compatible ASGI             |
| AI           | OpenRouter with configurable model routing                    |
| Integrations | GitHub REST API, Last.fm, Vercel status, Google Analytics tag |
| Testing      | ESLint, Vitest, Playwright, axe-core, Lighthouse, Stylelint   |
| Deployment   | Vercel, GitHub Pages, GitHub Actions                          |

## Quick Start

### Prerequisites

- Node.js `>=20`
- Python `>=3.10`
- Git
- Optional: GitHub CLI for repository operations

### Install

```bash
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive
npm install --no-audit --no-fund
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Run Locally

```bash
npm run dev
```

Local URLs:

| Service         | URL                                  |
| --------------- | ------------------------------------ |
| Frontend        | `http://127.0.0.1:4000`              |
| FastAPI backend | `http://127.0.0.1:8001`              |
| System Monitor  | `http://127.0.0.1:4000/monitor.html` |
| API health      | `http://127.0.0.1:4000/api/health`   |

The local frontend proxies `/api/*` to the backend so local behavior matches production routing.

## Environment Variables

Create `.env` from `.env.example` when local backend features need real providers.

| Variable                   | Required    | Scope                  | Description                                             |
| -------------------------- | ----------- | ---------------------- | ------------------------------------------------------- |
| `OPENROUTER_API_KEY`       | Recommended | Server                 | Enables live AI chat through OpenRouter                 |
| `OPENROUTER_MODEL`         | Optional    | Server/public config   | Defaults to `x-ai/grok-4.1-fast`                        |
| `OPENROUTER_SITE_URL`      | Optional    | Server/public config   | Attribution URL for OpenRouter                          |
| `GITHUB_PAT`               | Optional    | Server                 | Higher GitHub API rate limits                           |
| `LASTFM_API_KEY`           | Optional    | Server/public fallback | Last.fm recent music integration                        |
| `LASTFM_USERNAME`          | Optional    | Server                 | Last.fm username, defaults to configured public account |
| `TMDB_API_KEY`             | Optional    | Server                 | Optional poster/media enrichment                        |
| `UPSTASH_REDIS_REST_URL`   | Optional    | Server                 | Persistent analytics storage                            |
| `UPSTASH_REDIS_REST_TOKEN` | Optional    | Server                 | Redis auth token                                        |

Never commit `.env`, API keys, tokens, or downloaded credential files.

## Commands

| Command                         | What It Does                                |
| ------------------------------- | ------------------------------------------- |
| `npm run dev`                   | Start frontend and backend together         |
| `npm run dev:frontend`          | Start static frontend with `/api` proxy     |
| `npm run dev:backend`           | Start FastAPI backend                       |
| `npm run build`                 | Build production assets into `dist/`        |
| `npm run lint`                  | Run JavaScript linting                      |
| `npm run lint:css`              | Run CSS linting                             |
| `npm run test`                  | Run Vitest tests                            |
| `npm run security-check`        | Scan for exposed keys/secrets               |
| `npm run test:e2e:chrome`       | Run Chromium smoke tests                    |
| `npm run test:a11y:chrome`      | Run accessibility tests                     |
| `npm run qa:lighthouse:desktop` | Desktop Lighthouse gate                     |
| `npm run qa:lighthouse:mobile`  | Mobile Lighthouse gate                      |
| `npm run qa:postdeploy`         | Validate a deployed site with Playwright    |
| `npm run qa:prod-ready`         | Full production readiness gate              |
| `npm run clean`                 | Remove generated build/test/cache artifacts |

## API Contract

| Endpoint                             | Purpose                               |
| ------------------------------------ | ------------------------------------- |
| `GET /api`                           | API overview                          |
| `GET /api/health`                    | Backend health                        |
| `POST /api/chat`                     | AI assistant request                  |
| `GET /api/models`                    | Available model metadata              |
| `GET /api/github/repos/public`       | Public GitHub repository data         |
| `GET /api/analytics/views`           | Portfolio view metrics                |
| `POST /api/analytics/track`          | Track portfolio session visit         |
| `GET /api/analytics/reach`           | Authoritative Portfolio Reach metric  |
| `GET /api/monitor/status`            | Lightweight monitor status            |
| `GET /api/monitor/health`            | Detailed monitor health checks        |
| `GET /api/monitor/metrics`           | Request and endpoint metrics          |
| `GET /api/monitor/external-services` | Third-party service health            |
| `GET /api/monitor/hosting-surfaces`  | Vercel/GitHub Pages deployment status |
| `GET /api/monitor/security`          | Security monitor payload              |
| `GET /api/monitor/ai-metrics`        | AI provider metrics                   |
| `GET /api/docs`                      | FastAPI OpenAPI UI                    |

## Project Structure

```text
mangeshrautarchive/
├── api/
│   ├── analytics_store.py        # Portfolio view/reach persistence
│   ├── config.py                 # Central configurations, models, and helper functions
│   ├── index.py                  # FastAPI app and Vercel entrypoint (router mount point)
│   ├── integrations/             # Provider clients
│   ├── memory_manager.py         # Assistant memory helpers
│   ├── monitoring.py             # Health checks, events, metrics
│   └── routes/                   # Modular API routers
│       ├── analytics.py          # /api/analytics endpoints
│       ├── chat.py               # /api/chat & /api/models endpoints
│       ├── general.py            # Root, contact, and download endpoints
│       ├── github.py             # /api/github endpoints
│       ├── media.py              # Last.fm and TMDB/Google Books proxy endpoints
│       ├── monitor.py            # /api/monitor operational endpoints
│       └── personalization.py    # GDPR and memory customization endpoints
├── src/
│   ├── index.html                # Main portfolio page
│   ├── monitor.html              # System monitor dashboard
│   ├── travel.html               # Travel Atlas page
│   ├── assets/
│   │   ├── css/                  # Design system and feature styles
│   │   └── images/               # Profile, posters, screenshots, icons
│   └── js/
│       ├── core/                 # Bootstrap/config/runtime setup
│       ├── data/                 # Travel and local data modules
│       ├── modules/              # Feature modules
│       ├── services/             # Shared JS services
│       └── utils/                # Utilities
├── tests/
│   ├── config/                   # Config regression tests
│   └── e2e/                      # Playwright smoke/a11y/postdeploy tests
├── scripts/
│   ├── build.js                  # Static build pipeline
│   ├── clean.js                  # Generated artifact cleanup
│   ├── lighthouse-gate.js        # Lighthouse score gate
│   └── security-check.js         # Secret exposure scan
├── vercel.json                   # Vercel headers/build config
├── requirements.txt              # Python dependencies
├── package.json                  # Node scripts and dependencies
└── CNAME                         # GitHub Pages custom domain config
```

## Release Checklist

Run the smallest useful set while developing, then the full gate before shipping.

```bash
npm run security-check
npm run lint
npm run test
npm run build
```

For browser confidence:

```bash
PORT=4180 npm run serve:dist
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4180 npm run test:e2e:chrome
```

For production validation after deploy:

```bash
PLAYWRIGHT_BASE_URL=https://mangeshraut.pro npm run qa:postdeploy
```

Manual production probes:

```bash
curl -i https://mangeshraut.pro/api/monitor/status
curl -i https://mangeshraut.pro/api/analytics/reach
curl -i https://mangeshraut.pro/api/health
```

Expected behavior:

- Monitor status returns `200` JSON.
- Portfolio Reach returns `200` JSON with `success: true`.
- Homepage visibly shows `Portfolio Reach`; if the backend is temporarily down, it stays visible and shows `Unavailable` rather than disappearing.

## Troubleshooting

### Monitor Shows `MONITOR API UNAVAILABLE`

Check production API routing first:

```bash
curl -i https://mangeshraut.pro/api
curl -i https://mangeshraut.pro/api/monitor/status
```

If `/api` works but nested `/api/monitor/status` returns `404`, inspect `vercel.json`. The rewrite rule `/api/:path*` → `/api/index` must be present for proper FastAPI routing.

### Portfolio Reach Is Missing Or Unavailable

Check:

```bash
curl -i https://mangeshraut.pro/api/analytics/reach
curl -i https://mangeshraut.pro/api/analytics/views
```

If both fail on Vercel, GitHub Pages will also fail because it uses `mangeshraut.pro` as its backend origin. Fix production API routing first.

### GitHub Or Last.fm Data Looks Stale

The app intentionally caches provider data to avoid rate-limit pressure. Configure `GITHUB_PAT` and `LASTFM_API_KEY` in Vercel for more reliable production provider responses.

## Security Posture

- Frontend never receives OpenRouter or provider secrets.
- `api/index.py` owns provider calls that require server-side keys.
- CORS is restricted to known production and local development origins.
- CSP is configured in `vercel.json`.
- `node scripts/security-check.js` scans for accidentally exposed API keys.
- Build output writes only safe public config to `dist/build-config.json` and `dist/build-config.js`.

## Maintenance Notes

- Keep README, deployment config, and tests in sync when API routing changes.
- Keep `/api/monitor/status` and `/api/analytics/reach` in post-deploy checks.
- Keep GitHub Pages backend fallbacks pointed at `https://mangeshraut.pro`.
- Do not commit generated folders such as `dist/`, `artifacts/`, `test-results/`, `playwright-report/`, or `.playwright-mcp/`.
- Use `npm run clean` before packaging or when local test/build artifacts accumulate.

## License

MIT License. See [LICENSE](LICENSE).

## Author

Built and maintained by [Mangesh Raut](https://github.com/mangeshraut712).

- Portfolio: [mangeshraut.pro](https://mangeshraut.pro)
- LinkedIn: [linkedin.com/in/mangeshraut71298](https://linkedin.com/in/mangeshraut71298)
- GitHub: [github.com/mangeshraut712](https://github.com/mangeshraut712)
- Email: [mbr63drexel@gmail.com](mailto:mbr63drexel@gmail.com)
