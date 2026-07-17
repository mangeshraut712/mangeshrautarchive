# Mangesh Raut — Agentic Full-Stack Portfolio

<p align="center">
  <a href="https://mangeshraut.pro">
    <img src="src/assets/images/homepage-light.png" alt="Portfolio homepage — light mode" width="380">
    <img src="src/assets/images/homepage-dark.png" alt="Portfolio homepage — dark mode" width="380">
  </a>
</p>

<p align="center">
  <sub>Homepage · Light (left) · Dark (right) · <strong>Technology report · July 2026</strong></sub>
</p>

<p align="center">
  <a href="https://mangeshraut.pro"><img src="https://img.shields.io/badge/Live-mangeshraut.pro-0071e3?style=for-the-badge&logo=vercel&logoColor=white" alt="Live site"></a>
  <a href="https://mangeshraut712.github.io/mangeshrautarchive/"><img src="https://img.shields.io/badge/GitHub_Pages-mirror-24292e?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages"></a>
  <a href="https://github.com/mangeshraut712/mangeshrautarchive/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/mangeshraut712/mangeshrautarchive/deploy.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mangeshraut712/mangeshrautarchive?style=for-the-badge" alt="MIT License"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-%E2%89%A522%20%3C27-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node 22+">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.12">
  <img src="https://img.shields.io/badge/FastAPI-0.139-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/ESM-vanilla-yellow?style=flat-square" alt="Vanilla ESM">
  <img src="https://img.shields.io/badge/OpenRouter-Grok%204.3%20%2B%20free-black?style=flat-square" alt="OpenRouter">
  <img src="https://img.shields.io/badge/Tests-50%20%2B%20122-brightgreen?style=flat-square" alt="Tests">
  <img src="https://img.shields.io/badge/Playwright-15%20projects-2EAD33?style=flat-square&logo=playwright&logoColor=white" alt="Playwright">
  <a href="https://github.com/sponsors/mangeshraut712"><img src="https://img.shields.io/badge/Sponsor-♥-ea4aaa?style=flat-square&logo=github-sponsors&logoColor=white" alt="Sponsors"></a>
</p>

<p align="center">
  <strong>AI-first · Apple-inspired UI · dual hosting · production CI</strong><br>
  <sub>Vanilla ESM · FastAPI serverless · OpenRouter · WebMCP · Liquid Glass clear/balanced/tinted · solid light/dark</sub>
</p>

<p align="center">
  <a href="https://mangeshraut.pro"><b>Live</b></a>
  ·
  <a href="https://mangeshraut.pro/monitor"><b>Monitor</b></a>
  ·
  <a href="https://mangeshraut.pro/systems"><b>Systems</b></a>
  ·
  <a href="https://foglamp.dev/scan/mangeshrautarchive-jtspx4"><b>AI map</b></a>
  ·
  <a href="https://mangeshraut.pro/blog"><b>Field Notes</b></a>
  ·
  <a href="#-quick-start"><b>Quick start</b></a>
  ·
  <a href="#-technology-report-july-2026"><b>Tech report</b></a>
</p>

---

## 1. Executive summary

**mangeshrautarchive** is the production codebase for **[mangeshraut.pro](https://mangeshraut.pro)** — Mangesh Raut’s agentic full-stack portfolio. It is a **static-first** website (no React, Next.js, Vue, Angular, or Svelte **runtime**) with a **Python 3.12 FastAPI** backend on **Vercel serverless**, dual-published to **GitHub Pages** as a static mirror.

As of **July 2026**, the product combines:

| Pillar                 | What it delivers                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| **Portfolio surfaces** | Home, Systems, Monitor, Travel, Uses, Blog, case studies, offline/404                           |
| **Agentic AI**         | AssistMe chatbot · 10 WebMCP tools · local-first actions · OpenRouter NDJSON stream             |
| **Apple-inspired UI**  | Dynamic Island nav · liquid glass **clear / balanced / tinted** · solid page canvas · a11y dock |
| **Operations**         | Platform health probes · portfolio catalog · dual-host commit parity                            |
| **Quality**            | 67 Vitest · 122 pytest · 15 Playwright projects · Lighthouse deploy gates · security scan       |

This document is the **canonical technology report** for the repository: stack versions, libraries, architecture, features, and how to run it.

---

## 2. Live surfaces (July 2026)

| Surface          | URL                                                                                                 | Role                                                |
| ---------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Portfolio**    | [mangeshraut.pro](https://mangeshraut.pro)                                                          | Primary host: static + `/api/*`                     |
| **GitHub Pages** | [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/) | Static mirror; API via `build-config` / edge worker |
| **Systems**      | [/systems](https://mangeshraut.pro/systems)                                                         | Architecture evidence, hiring Q&A, engineering log  |
| **Monitor**      | [/monitor](https://mangeshraut.pro/monitor)                                                         | Apple Status-style health, probes, catalog          |
| **Travel**       | [/travel](https://mangeshraut.pro/travel)                                                           | MapLibre atlas                                      |
| **Uses**         | [/uses](https://mangeshraut.pro/uses)                                                               | Hardware / software / AI stack                      |
| **Field Notes**  | [/blog](https://mangeshraut.pro/blog)                                                               | 12 build-generated long-form articles               |
| **Case studies** | `/case-studies/*`                                                                                   | 5 static product write-ups                          |

---

## 3. Technology report (July 2026)

Pinned from this repo’s `package.json`, `requirements.txt`, `pyproject.toml`, and runtime configs.

### 3.1 Runtime platforms

| Layer              | Technology      | Version / constraint                  | Notes                                              |
| ------------------ | --------------- | ------------------------------------- | -------------------------------------------------- |
| **JS runtime**     | Node.js         | **≥22 &lt;27** (`.nvmrc` → **22**)    | Required by Stylelint 17, Vitest 4, modern tooling |
| **Module system**  | Native **ESM**  | `"type": "module"`                    | `.js` extensions in imports; no TS/JSX app runtime |
| **Python**         | CPython         | **3.12** (`requires-python ~=3.12.0`) | FastAPI serverless + local uvicorn                 |
| **Local API**      | Uvicorn         | **0.51**                              | Dev backend on port **8001**                       |
| **Local frontend** | Express **5.2** | Dev static + proxy                    | Port **4000**                                      |

### 3.2 Frontend libraries & tooling

| Category            | Package                   | Version (range)         | Role                                                            |
| ------------------- | ------------------------- | ----------------------- | --------------------------------------------------------------- |
| **UI framework**    | —                         | —                       | **None** — vanilla HTML/CSS/JS only                             |
| **Build**           | esbuild                   | **^0.28.0**             | JS bundling / pipeline support                                  |
| **CSS utilities**   | tailwindcss + CLI         | **^4.0.9** / **^4.3.2** | Generate utility CSS **file only** — no utility classes in HTML |
| **Markdown**        | marked                    | **^18.0.6**             | Chat + blog rich text                                           |
| **Sanitization**    | isomorphic-dompurify      | **^3.17.0**             | XSS-safe HTML                                                   |
| **Math**            | KaTeX                     | **^0.17.0**             | Chat/math rendering                                             |
| **Footnotes**       | marked-footnote           | **^1.2.2**              | Markdown footnotes                                              |
| **Liquid Glass**    | @ogtirth/liquid-glass-oss | **^0.1.0**              | WebGL glass material (optional; off on low-power/iOS)           |
| **Share / capture** | html-to-image             | **^1.11.13**            | Client image export helpers                                     |
| **Realtime (dev)**  | ws                        | **^8.21.0**             | WebSocket tooling                                               |
| **Analytics**       | @vercel/analytics         | **^2.0.1**              | Optional Vercel Analytics                                       |
| **Images**          | sharp                     | **^0.35.2**             | Optimize pipeline                                               |
| **Unit tests**      | Vitest                    | **^4.1.10**             | **67** unit tests                                               |
| **E2E**             | Playwright                | **^1.61.1**             | **15** browser projects                                         |
| **A11y E2E**        | @axe-core/playwright      | **^4.12.1**             | Accessibility assertions                                        |
| **Lint JS**         | ESLint 9 + @eslint/js     | **^9.39.5**             | Flat config                                                     |
| **Lint CSS**        | Stylelint 17              | **^17.14.0**            | Standard config 40                                              |
| **Format**          | Prettier                  | **^3.9.5**              | Repo-wide style                                                 |
| **Env**             | dotenv                    | **^17.4.2**             | Local tooling                                                   |

**Design system (first-party CSS, not npm UI kits):**

- Apple-inspired tokens (`--apple-blue`, solid light/dark page canvas)
- **Liquid Glass modes:** `clear` · `balanced` (default ~42% tint) · `tinted`
- Dynamic Island–style global nav, control FABs, subpage glass pills
- Lazy section CSS via `data-href` + viewport warm (`ASSET_VER` cache bust)

### 3.3 Backend libraries (Python)

| Package           | Version     | Role                                      |
| ----------------- | ----------- | ----------------------------------------- |
| **fastapi**       | **0.139.0** | HTTP API, OpenAPI                         |
| **pydantic**      | **2.13.4**  | Request/response models (v2)              |
| **uvicorn**       | **0.51.0**  | ASGI server (local)                       |
| **httpx**         | **0.28.1**  | Upstream HTTP (OpenRouter, GitHub, media) |
| **websockets**    | **16.1**    | Realtime voice / WS paths                 |
| **cryptography**  | **49.0.0**  | OAuth state, secrets handling             |
| **aiofiles**      | **25.1.0**  | Async file IO                             |
| **psutil**        | **7.2.2**   | Process / resource probes                 |
| **python-dotenv** | **1.2.2**   | Env loading                               |

**Tooling:** pytest (API suite), flake8 / ruff / vulture as configured in scripts.

### 3.4 AI & integrations (July 2026)

| Integration             | Technology                                | Advancement                                         |
| ----------------------- | ----------------------------------------- | --------------------------------------------------- |
| **LLM gateway**         | [OpenRouter](https://openrouter.ai)       | Multi-model routing, free-tier failover on HTTP 402 |
| **Primary model**       | `x-ai/grok-4.3`                           | Portfolio-oriented default when credits available   |
| **Credit-safe default** | free / `:free` models (e.g. Gemma 4 free) | Stays online at $0 paid balance                     |
| **Fusion / Auto**       | `openrouter/fusion`, `openrouter/auto`    | Compare / open-domain routing                       |
| **Fast paid**           | `google/gemini-2.5-flash`                 | Lightweight fallback                                |
| **Streaming**           | NDJSON over `POST /api/chat`              | Progressive AssistMe UI                             |
| **Local agents**        | WebMCP + regex `detectAndExecute`         | Browser actions in ms before LLM                    |
| **GitHub**              | REST API (+ optional PAT)                 | Project showcase grid, rate-limit resilience        |
| **Music**               | Last.fm server proxy                      | Currently shelf artwork                             |
| **Health**              | WHOOP + Withings OAuth · Supabase         | Vitals snapshots + cron                             |
| **Reach**               | GA4 Data API (optional)                   | Hero portfolio-reach panel                          |
| **Calendar**            | Google Calendar OAuth (optional)          | Scheduling surfaces                                 |
| **Edge assist**         | Cloudflare Worker `assistme-chat`         | Chat path when Vercel is blocked; Pages-friendly    |

### 3.5 Hosting & delivery

| Surface            | Stack                                                   | Advances                                                                 |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Vercel**         | Static `dist/` + Python serverless `api/index.py`       | Same-origin `/api/*`, analytics                                          |
| **GitHub Pages**   | Static `dist/` only                                     | Dual-host parity via `build-config.json` `gitCommit`                     |
| **CDN assets**     | esbuild + Sharp + `ASSET_VER`                           | Cache-busted CSS/JS (`20260716z` series)                                 |
| **PWA**            | `manifest.json` (installable); SW registration disabled | Standalone shortcuts; offline.html reconnect-only; no full offline cache |
| **CSP / security** | Headers in `vercel.json` · report endpoint              | Rate limits, server-only secrets, HMAC OAuth state                       |

### 3.6 Quality matrix

| Suite        | Runner                         | Count / target (July 2026)                                          |
| ------------ | ------------------------------ | ------------------------------------------------------------------- |
| **Unit**     | Vitest 4.1                     | **67** tests · characterization + module suites                     |
| **API**      | pytest                         | **122** tests · 17 modules                                          |
| **E2E**      | Playwright 1.61                | **15** projects (desktop + phone + tablet, incl. iPhone 17 Pro Max) |
| **A11y**     | axe-core + a11y toolbar        | CI + runtime high contrast / reduced motion / liquid glass          |
| **Perf**     | Lighthouse gate scripts        | Desktop/mobile floors on CI & live                                  |
| **Security** | `security-check` + `npm audit` | Secret scan before merge                                            |

---

## 4. Product features (July 2026)

| Area                | Highlights                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **AssistMe**        | 10 WebMCP tools · local-first actions · NDJSON stream · KaTeX + DOMPurify · free-tier failover · offline site knowledge |
| **Liquid Glass**    | Clear / balanced / tinted materials on chrome · solid white/black page canvas · WebGL optional · a11y slider            |
| **System Monitor**  | Apple Status densify · platform probes · portfolio catalog · CSP / AI metrics                                           |
| **Systems page**    | Evidence cards · architecture diagrams · hiring Q&A                                                                     |
| **Projects**        | Live GitHub grid · release lens · evidence rows · Spatial View hooks                                                    |
| **Field Notes**     | 12 long-form articles · X-style feed cards · no stock hero images · charts + source embeds                              |
| **Case studies**    | 5 static deep-dives (portfolio, HindAI, CES Energy, AssistMe, Bug Tracker)                                              |
| **Currently**       | Shows / books / music · Last.fm proxy · local posters                                                                   |
| **Health**          | WHOOP + Withings · Supabase · daily cron                                                                                |
| **Travel**          | MapLibre atlas · filters · glass sidebar                                                                                |
| **Uses**            | Hardware / software / AI stack board                                                                                    |
| **Command palette** | `⌘K` / `Ctrl+K` · sections, blog, actions                                                                               |
| **A11y**            | Floating dock · liquid glass control · listen/translate · 44px targets · reduced transparency → solid                   |
| **PWA**             | Install via manifest, shortcuts, splash assets; SW unregistered for iOS stability; offline.html reconnect only          |
| **Share**           | Glass share FAB · system share sheet style dialog                                                                       |

### AssistMe · WebMCP tools

| Tool                   | Action                         |
| ---------------------- | ------------------------------ |
| `navigate_to_section`  | Scroll to a section            |
| `download_resume`      | Resume PDF                     |
| `schedule_meeting`     | Calendly                       |
| `open_contact_form`    | Focus contact                  |
| `copy_contact_info`    | Copy email / socials           |
| `search_portfolio`     | Command palette query          |
| `filter_projects`      | Project lens by tech           |
| `open_social_media`    | GitHub / LinkedIn / X          |
| `toggle_theme`         | Light / dark / system          |
| `update_health_metric` | Health widget (when connected) |

---

## 5. Architecture

### Interactive AI map (Foglamp)

High-level map of AssistMe agents, models, tools, integrations, and flows — **no code or secrets**.

<p align="center">
  <a href="https://foglamp.dev/scan/mangeshrautarchive-jtspx4"><img src="https://img.shields.io/badge/Foglamp_Scan-mangeshrautarchive-0B0B0F?style=for-the-badge&labelColor=0071e3" alt="Open interactive Foglamp architecture scan"></a>
  <a href=".foglamp/scan.json"><img src="https://img.shields.io/badge/scan.json-41_nodes_·_51_edges-24292e?style=for-the-badge" alt="Committed scan data"></a>
  <a href="docs/foglamp-scan.md"><img src="https://img.shields.io/badge/Keep--alive-docs-6e6e73?style=for-the-badge" alt="How to refresh the public map"></a>
</p>

|                     |                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **Live (unlisted)** | [foglamp.dev/scan/mangeshrautarchive-jtspx4](https://foglamp.dev/scan/mangeshrautarchive-jtspx4) |
| **Source data**     | [`.foglamp/scan.json`](.foglamp/scan.json) (committed)                                           |
| **Edit token**      | `.foglamp/scan.lock.json` (**gitignored**) — use `npm run foglamp:publish` or monthly CI         |

Foglamp links expire (~90 days). Republishing with the saved `editToken` **keeps the same URL** and extends expiry. Setup: [docs/foglamp-scan.md](docs/foglamp-scan.md).

### Always-on diagram (in-repo)

GitHub renders this Mermaid block forever — use it when the external map is offline or expired.

```mermaid
flowchart LR
  subgraph Client
    HTML[Static pages]
    BOOT[bootstrap.js]
    MCP[WebMCP + regex]
    CHAT[AssistMe UI]
    LG[Liquid Glass tokens]
  end

  subgraph Edge["Host / edge"]
    CDN[dist/ CDN]
    API[FastAPI api/index.py]
    R[model_router.py]
    W[assistme-chat Worker optional]
  end

  subgraph External
    OR[OpenRouter]
    GH[GitHub]
    INT[Health / Last.fm / GA4]
  end

  HTML --> BOOT --> CHAT
  BOOT --> LG
  CHAT --> MCP
  MCP -->|local action| HTML
  CHAT -->|POST /api/chat NDJSON| API
  CHAT -.->|Pages fallback| W
  API --> R --> OR
  API --> GH
  API --> INT
  CDN --> HTML
```

### Chat path

1. **Browser** — WebMCP / regex (`navigate`, resume, theme, filters) in milliseconds.
2. **Site knowledge** — Deterministic portfolio facts without an LLM.
3. **OpenRouter** — Routed model (Grok / free / Auto / Fusion / Flash) with multi-model fallback.
4. **Graceful degradation** — Honest UX for 402 credits, rate limits, and upstream errors.

### Dual hosting

| Host                           | Serves            | API                                                      |
| ------------------------------ | ----------------- | -------------------------------------------------------- |
| **Vercel** (`mangeshraut.pro`) | `dist/` + FastAPI | Same-origin `/api/*`                                     |
| **GitHub Pages**               | `dist/` only      | `build-config` → production API and/or Cloudflare Worker |

Both stamp `build-config.json` with `gitCommit` for deploy parity (`npm run verify:deploy-sync`).

---

## 6. AI model routing

| Tier                  | Model                                           | When                                          |
| --------------------- | ----------------------------------------------- | --------------------------------------------- |
| **Portfolio primary** | `x-ai/grok-4.3`                                 | Default when paid credits available           |
| **Env override**      | `OPENROUTER_MODEL`                              | Force free/router slug for credit-safe online |
| **Free path**         | `google/gemma-4-26b-a4b-it:free` (+ free chain) | Automatic after 402 / primary fail            |
| **Fusion**            | `openrouter/fusion`                             | Compare / trade-off (non-stream)              |
| **Auto**              | `openrouter/auto`                               | Open-domain                                   |
| **Fast paid**         | `google/gemini-2.5-flash`                       | Lightweight paid fallback                     |

Configure with `OPENROUTER_API_KEY` + optional `OPENROUTER_MODEL`. Implementation: `api/config.py` + `api/model_router.py`.

---

## 7. Quick start

**Requirements:** Node **≥22** (see `.nvmrc`), Python **3.12+**. Node 18 fails Stylelint 17 / Vitest 4.

```bash
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive

node -v                                 # v22.x–v26.x
npm install --no-audit --no-fund      # documented install path

# Python 3.12 — venv named `venv` for dev-backend auto-detect
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

cp .env.example .env                    # OPENROUTER_API_KEY optional
npm run doctor                          # layout + stack guard
npm run dev                             # http://127.0.0.1:4000  ·  API :8001
```

| URL                        | Service                 |
| -------------------------- | ----------------------- |
| http://127.0.0.1:4000      | Frontend + `/api` proxy |
| http://127.0.0.1:8001      | FastAPI direct          |
| http://127.0.0.1:8001/docs | OpenAPI                 |

```bash
npm run build && PORT=4174 npm run serve:dist   # production preview
```

### Essential commands

| Command                           | Purpose                                           |
| --------------------------------- | ------------------------------------------------- |
| `npm run check-node`              | Fail if Node is outside `engines`                 |
| `npm run doctor` / `doctor:stack` | Root layout + no React/Next runtime               |
| `npm run dev`                     | Frontend + backend                                |
| `npm run build`                   | Production `dist/` (+ blog/case study generation) |
| `npm test` / `npm run test:api`   | Vitest **67** / pytest **122**                    |
| `npm run check`                   | ESLint + Stylelint + Prettier + Vitest            |
| `npm run qa:prod-ready`           | Full pre-deploy matrix                            |
| `npm run verify:deploy-sync`      | Vercel ↔ Pages parity                             |
| `npm run security-check`          | Secret scan                                       |
| `npm run clean`                   | Purge dist/artifacts (keeps venvs)                |

---

## 8. Environment (server-side only)

| Group         | Keys                                     | Notes                                |
| ------------- | ---------------------------------------- | ------------------------------------ |
| **AI**        | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | Chat; free models work at $0 balance |
| **GitHub**    | `GITHUB_TOKEN` / `GITHUB_PAT`            | Rate limits for project grid         |
| **Last.fm**   | `LASTFM_API_KEY`, `LASTFM_USERNAME`      | Music shelf                          |
| **Analytics** | `GA4_*`, service account JSON            | Portfolio reach panel                |
| **Health**    | WHOOP / Withings / Calendar OAuth        | Optional                             |
| **Supabase**  | URL + service role                       | Vitals persistence                   |
| **Voice**     | `AI_GATEWAY_API_KEY`                     | Optional realtime speech             |
| **Edge**      | `CHAT_API_BASE`, Cloudflare token        | Pages AssistMe worker                |

Never commit `.env` / `.env.local`. See [`.env.example`](.env.example).

---

## 9. Quality & CI

### `deploy.yml` (push / PR → `main`)

1. `npm audit` + `security-check`
2. ESLint · Stylelint 17 · Prettier
3. Vitest (**67**)
4. Env parity (non-blocking)
5. flake8 · dead-code · pytest (**122**)
6. Browser QA smoke
7. `npm run build` + Lighthouse on `dist/`
8. GitHub Pages deploy + dual-surface verify

### Nightly `post-deploy-monitoring.yml`

Live reachability (Vercel + Pages) · Lighthouse floors · commit parity.

| Suite               | Target                                     |
| ------------------- | ------------------------------------------ |
| Vitest              | 67                                         |
| pytest              | 122                                        |
| Playwright projects | 15                                         |
| Lighthouse CI       | Perf / A11y / BP / SEO floors per workflow |

---

## 10. Project structure

```text
mangeshrautarchive/
├── src/                    # Frontend shells + assets → npm run build → dist/
│   ├── *.html              # index, systems, monitor, travel, uses, 404, offline
│   ├── js/core|modules|services|utils|data|vendor/
│   └── assets/css|images|files|icons|vendor/
├── api/                    # FastAPI (Vercel entry: api/index.py)
│   ├── routes/ · integrations/
│   └── config.py · model_router.py · monitoring.py · …
├── workers/assistme-chat/  # Optional Cloudflare Worker chat edge
├── scripts/                # Tooling (not shipped to browsers)
│   ├── build/              # esbuild pipeline, ASSET_VER, blog/case generators
│   ├── deployment/         # Lighthouse, security, deploy sync
│   ├── utils/              # dev servers, check-node, lint runners
│   └── qa/ · integrations/
├── tests/unit|api|e2e/     # Vitest · pytest · Playwright
├── docs/                   # STRUCTURE.md · plans/
├── .github/workflows/      # deploy.yml · post-deploy-monitoring.yml
├── package.json · vercel.json · pyproject.toml · .nvmrc
└── AGENTS.md               # AI / contributor brief
```

**Do not** add React/Next/Vue/Svelte app scaffolds. **Map:** [docs/STRUCTURE.md](docs/STRUCTURE.md) · [scripts/README.md](scripts/README.md) · [tests/README.md](tests/README.md)

---

## 11. API (production)

```bash
curl -s https://mangeshraut.pro/api/health
curl -s https://mangeshraut.pro/api/chat/health
curl -s https://mangeshraut.pro/api/monitor/platform-health | head
curl -s https://mangeshraut.pro/api/monitor/portfolio-catalog | head
curl -s -X POST https://mangeshraut.pro/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What are Mangesh top skills?","stream":false}'
```

| Area    | Endpoints                                                  |
| ------- | ---------------------------------------------------------- |
| Core    | `/api/health` · `/api/status` · `/api/models`              |
| Chat    | `/api/chat` · `/api/chat/health`                           |
| GitHub  | `/api/github/profile` · `/api/github/repos/*`              |
| Media   | `/api/music/recent` · `/api/music/artwork`                 |
| Health  | `/api/health-vitals/summary` · integrations                |
| Monitor | `/api/monitor/*` · `platform-health` · `portfolio-catalog` |
| Forms   | `POST /api/contact` · `POST /api/newsletter/subscribe`     |

Local OpenAPI: `http://127.0.0.1:8001/docs`

---

## 12. Deployment

| Surface           | How                                                                                |
| ----------------- | ---------------------------------------------------------------------------------- |
| **Vercel**        | Git `main` · FastAPI + `dist/` · Node 22 · Python serverless                       |
| **GitHub Pages**  | CI artifact after quality gates                                                    |
| **Cache bust**    | `ASSET_VER` in `scripts/build/asset-version.mjs` (sync with `src/**/*.html` `?v=`) |
| **Edge AssistMe** | `workers/assistme-chat` + `CHAT_API_BASE` when primary API is unavailable          |

**Vercel Ignored Build Step** (optional):

```bash
bash scripts/deployment/vercel-ignore-build.sh
```

```bash
npm run build
npm run verify:deploy-sync
npm run qa:postdeploy
```

---

## 13. Blog & case studies

**Field Notes (12):** Google I/O 2026 · X Algorithm / Phoenix · Google AI · OpenClaw · Wispr Flow · NVIDIA · Global AI race · AI code editors · Apple at 50 · Anthropic Mythos · WWDC 2026 · NotebookLM 2026.

**Case studies (5):** Portfolio · HindAI · CES Energy · AssistMe VA · Bug Reporting System.

Articles are generated at build/dev time from `src/js/modules/blog-data.js` into `dist/blog/` (X-style cards, solid settings, charts + official source embeds — no stock hero images).

---

## 14. Changelog highlights — July 2026

- **Liquid Glass materials** — clear / balanced / tinted parity on light + dark; chrome glass vs solid content discipline; a11y + share FAB materials aligned.
- **Blog system** — 12 field notes; removed unrelated figures; X-style author cards; `/blog` index routing hardened for local Express.
- **Project Showcase** — equal card grid alignment; shell width parity across activity / lens / search / grid.
- **Solid theme** — white light / black dark page canvas; dual-host edge AssistMe path documented.
- **Quality** — **67** Vitest · **122** pytest · Playwright multi-device matrix · Node engines guard · ASSET_VER cache busting.

---

## 15. Documentation

| Doc                                    | Purpose                      |
| -------------------------------------- | ---------------------------- |
| [AGENTS.md](AGENTS.md)                 | AI agent / contributor brief |
| [SECURITY.md](SECURITY.md)             | Security policy              |
| [.env.example](.env.example)           | Env template                 |
| [docs/README.md](docs/README.md)       | Doc index                    |
| [docs/STRUCTURE.md](docs/STRUCTURE.md) | Full file map                |

---

## 16. Sponsors

<p align="center">
  <a href="https://github.com/sponsors/mangeshraut712"><img src="https://img.shields.io/badge/GitHub_Sponsors-Support-ea4aaa?style=for-the-badge&logo=github-sponsors&logoColor=white" alt="GitHub Sponsors"></a>
  <a href="https://buy.stripe.com/14A3cufGUgcV5ePfuA14401"><img src="https://img.shields.io/badge/Stripe-Sponsor-635bff?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe"></a>
  <a href="https://www.paypal.com/ncp/payment/LXNHJ5SUGNP82"><img src="https://img.shields.io/badge/PayPal-Sponsor-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal"></a>
</p>

---

## 17. Contributing

```bash
npm run check          # minimum before PR
npm run qa:prod-ready  # larger changes
```

Issues and PRs welcome under MIT. Keep the stack **vanilla ESM + FastAPI** — no UI framework runtimes.

---

## 18. License & contact

**MIT** — [LICENSE](LICENSE)

**Mangesh Raut** · MS CS, Drexel University  
[mangeshraut.pro](https://mangeshraut.pro) · [LinkedIn](https://linkedin.com/in/mangeshraut71298) · [GitHub](https://github.com/mangeshraut712) · mbr63@drexel.edu

---

<p align="center">
  <a href="#mangesh-raut--agentic-full-stack-portfolio">↑ Back to top</a>
</p>
