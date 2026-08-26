# Project Structure & Architecture Map (August 2026)

Canonical layout for **mangeshrautarchive**. All files and directories are organized strictly by purpose and lifecycle.

```text
mangeshrautarchive/
├── README.md                 # Public project docs, architecture overview & benchmark matrix
├── AGENTS.md                 # Universal AI Agent Briefing (Linux Foundation AGENTS.md standard)
├── CONTRIBUTING.md           # Contribution guidelines, dev setup & PR rules
├── CODE_OF_CONDUCT.md        # Community standards (Contributor Covenant v2.1)
├── CITATION.cff              # Academic & open-source citation metadata (CFF v1.2.0)
├── SECURITY.md · LICENSE     # Security disclosure policy & MIT open-source license
│
├── package.json              # Node ≥22 engine, scripts, dev dependencies (root required)
├── .nvmrc · .node-version    # Pin local Node v22 for nvm / asdf / fnm / volta
├── vercel.json               # Vercel serverless routes, headers, functions configuration
├── index.js                  # Static-analysis entrypoint → src/js/entry.js
├── playwright.config.js      # Multi-browser Playwright E2E configuration (16 browser profiles)
├── vitest.config.js          # Unit testing configuration → tests/unit/**/*.test.js
├── eslint.config.js          # ESLint 10+ flat configuration
├── pyproject.toml            # Python 3.12+ project config + pytest / Ruff tool configurations
├── requirements.txt          # Production Python API dependencies (FastAPI, Pydantic, etc.)
├── requirements-dev.txt      # Python testing & developer tooling (pytest, flake8, httpx, etc.)
├── ruff.toml · .flake8       # Python style, linting, and formatting CLI defaults
├── jsconfig.json · globals.d.ts # IDE code intelligence & ambient JS type declarations
│
├── src/                      # ★ Production Frontend Source (esbuild compilation target → dist/)
│   ├── *.html                # Page shells (index, systems, monitor, travel, uses, changelog, 404, offline)
│   ├── js/
│   │   ├── core/             # Application lifecycle, bootstrap, subpage chrome, theme managers
│   │   ├── modules/          # Feature modules (chatbot, projects showcase, calendar, telemetry, …)
│   │   ├── services/         # Rich markdown engine, streaming parser, audio/voice, analytics
│   │   ├── utils/            # Pure helpers, DOM utilities, security sanitizers, date formatters
│   │   ├── data/             # Static datasets (changelog entries, projects, certifications, travel, blog)
│   │   └── vendor/           # Vendored client libraries (marked, KaTeX, DOMPurify)
│   └── assets/
│       ├── css/              # Vanilla CSS 6-tier design system, Apple typography & theme styles
│       └── images|files|icons|vendor/ # Media assets, vector diagrams, brand iconography
│
├── api/                      # ★ Python 3.12+ FastAPI Backend (Serverless & Local Dev)
│   ├── index.py              # Application initialization, middleware stack, exception handlers
│   ├── routes/               # Modular HTTP routes (chat, monitor, media, integrations, github, etc.)
│   ├── integrations/         # Third-party OAuth connectors, token stores, health probes
│   ├── config.py             # Environment configuration & model router defaults
│   ├── model_router.py       # Multi-model routing (Grok 4.3, Nemotron 120B, Gemma 27B)
│   └── monitoring.py         # System health, telemetry, probe handlers
│
├── workers/                  # ★ Cloudflare Workers (Edge AI & GitHub Pages API Proxy)
│   └── assistme-chat/        # Standalone Edge Worker for AssistMe AI Chat & WebMCP proxy
│
├── scripts/                  # ★ Developer Tooling & Build Pipeline (Not shipped to browser)
│   ├── build/                # esbuild bundlers, static generators (blog, case studies, icons), clean
│   ├── deployment/           # Security scanning, secret audit, deploy sync verification, Lighthouse
│   ├── utils/                # Dev servers (frontend port 4000, backend port 8001), check-node, doctor
│   ├── qa/                   # Automated browser audits, device viewport tests, accessibility checks
│   ├── integrations/         # OAuth setup helpers, OpenRouter connectivity tests
│   └── offline/              # Offline data builders (travel GeoJSON database)
│
├── tests/                    # ★ Complete Automated Test Suite
│   ├── unit/                 # 210 Vitest unit tests (JavaScript modules, utilities, WebMCP actions)
│   ├── api/                  # 175 pytest API tests (FastAPI routes, streaming, OAuth, middleware)
│   └── e2e/                  # Playwright multi-browser end-to-end specifications across 16 targets
│
├── config/                   # Non-root tool configuration (e.g. vulture.toml dead-code scanner)
│
├── docs/                     # Human Documentation, Design Systems & Architecture Plans
│   ├── DESIGN.md             # Apple Human Interface Portfolio Design System (Canonical Source of Truth)
│   ├── STRUCTURE.md          # This file — Complete repository directory map and guide
│   ├── README.md             # Documentation directory index
│   └── plans/                # Architecture plans & implementation blueprints
│
├── .github/workflows/        # Automated CI/CD, Deployment & Health Monitoring Workflows
│   ├── deploy.yml            # Primary CI pipeline → Quality gates → GitHub Pages deployment
│   ├── deploy-chat-worker.yml # Deploy Cloudflare Worker edge API
│   ├── health-vitals-sync.yml # Edge WHOOP / Withings cron telemetry sync
│   ├── post-deploy-monitoring.yml # Production reachability & Lighthouse monitoring
│   └── foglamp-scan-keepalive.yml # Architecture map keep-alive
│
├── dist/                     # Production compiled bundle output (Git-ignored)
└── node_modules/ · venv/     # Dependencies & virtual environments (Git-ignored)
```

## Where to put new work

| You are adding…                   | Put it in…                                               |
| --------------------------------- | -------------------------------------------------------- |
| Homepage / page UI behavior       | `src/js/modules/`                                        |
| Shared pure helpers               | `src/js/utils/`                                          |
| Chat markdown / streaming / voice | `src/js/services/`                                       |
| CSS for a feature                 | `src/assets/css/` (vanilla; no Tailwind classes in HTML) |
| HTTP endpoint                     | `api/routes/`                                            |
| OAuth / third-party provider      | `api/integrations/`                                      |
| Build step                        | `scripts/build/`                                         |
| Deploy / security / Lighthouse    | `scripts/deployment/`                                    |
| One-off QA script                 | `scripts/qa/` or `scripts/qa/manual/`                    |
| Vitest unit test                  | `tests/unit/`                                            |
| API test                          | `tests/api/`                                             |
| Playwright E2E                    | `tests/e2e/`                                             |
| Architecture notes                | `docs/`                                                  |
| Improve-skill plan                | `docs/plans/`                                            |
| AssistMe UX design plan           | `docs/design-plans/`                                     |
| Foglamp AI architecture map       | `.foglamp/scan.json` + `docs/foglamp-scan.md`            |

## Root files that must stay at root

Tooling expects these paths: `package.json`, `vercel.json`, `playwright.config.js`, `vitest.config.js`, `eslint.config.js`, `.prettierrc`, `.stylelintrc.json`, `CNAME`, `pyproject.toml`, `requirements*.txt`.

Do **not** move them into `config/` without updating every consumer.

## Forbidden / keep out of git

`.env`, `.env.local`, `node_modules/`, `dist/`, `.venv`/`venv`, `artifacts/`, `test-results/`, `__pycache__/`, secrets.

## Clean commands

```bash
npm run clean          # dist, artifacts, caches (keeps venvs)
npm run doctor         # root layout + stack guard (vanilla ESM + FastAPI)
npm run format         # Prettier write
npm run check          # lint + format check + unit tests
```

## Crawl map and sitemap

| Surface                                                                | In `dist/sitemap.xml`? | Notes                                                        |
| ---------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| `/`, `/systems`, `/monitor`, `/travel`, `/uses`, `/changelog`, `/blog` | Yes                    | Generated by `scripts/build/build.js`                        |
| `/blog/{slug}`, `/case-studies/{slug}`                                 | Yes                    | Build-generated from `blog-data.js` / `case-studies-data.js` |
| `about.html`                                                           | No                     | Redirects to `/#about` (canonical fragment on homepage)      |
| `offline.html`, `404.html`                                             | No                     | Utility / error pages (`noindex`)                            |
| `gh.html`, `google*.html`                                              | No                     | Short redirects / Search Console verification                |
| `src/sitemap.xml`                                                      | N/A                    | Hand-maintained fallback; production uses build output       |

Discovery files (`robots.txt`, `ai.txt`, `llms.txt`) are rewritten at build time to match the live static host (GitHub Pages by default). See [API.md](./API.md) for backend routes not exposed on static Pages.
