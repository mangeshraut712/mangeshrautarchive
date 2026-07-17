# Project structure (July 2026)

Canonical layout for **mangeshrautarchive**. Prefer this map when adding files so everything stays findable.

```text
mangeshrautarchive/
├── README.md                 # Public project docs
├── AGENTS.md                 # AI / contributor brief (must stay accurate)
├── SECURITY.md · LICENSE
│
├── package.json              # Node ≥22 · scripts · deps (root — required)
├── .nvmrc · .node-version    # Pin local Node 22 for nvm / asdf / fnm
├── vercel.json               # Vercel routes · functions · headers
├── middleware.js             # Vercel edge (Lighthouse perf-audit rewrite)
├── index.js                  # Static-analysis entry → src/js/entry.js
├── playwright.config.js      # E2E multi-browser
├── vitest.config.js          # Unit tests → tests/unit/**
├── eslint.config.js          # ESLint flat config
├── pyproject.toml            # Python deps + Ruff/pytest tool config
├── requirements.txt          # Runtime pip pins
├── requirements-dev.txt      # Dev/test pip pins
├── ruff.toml · .flake8       # Python lint CLI defaults
├── jsconfig.json · globals.d.ts
│
├── src/                      # ★ Frontend source (built → dist/)
│   ├── *.html                # Page shells
│   ├── js/
│   │   ├── core/             # bootstrap, chat, config, subpage-chrome
│   │   ├── modules/          # Feature modules (chatbot, projects, …)
│   │   ├── services/         # Markdown, streaming, voice, analytics
│   │   ├── utils/            # Shared helpers
│   │   ├── data/             # Travel / media data
│   │   └── vendor/           # Vendored third-party JS
│   └── assets/
│       ├── css/              # Vanilla CSS design system
│       ├── images|files|icons|vendor/
│
├── api/                      # ★ FastAPI backend (Vercel serverless)
│   ├── index.py              # App entry
│   ├── routes/               # HTTP route modules
│   ├── integrations/         # OAuth / GitHub / Supabase / …
│   ├── config.py · model_router.py · monitoring.py · …
│   └── realtime-ws.js        # WebSocket edge for voice
│
├── scripts/                  # ★ Tooling (not shipped to browsers)
│   ├── build/                # esbuild, generators, clean, assets
│   ├── deployment/           # Lighthouse, security, env parity, deploy sync
│   ├── utils/                # dev servers, check-node, serve-dist, flake8/vulture
│   ├── qa/                   # Browser / FPS / device audits (+ manual/)
│   ├── integrations/         # OAuth setup helpers, OpenRouter tests
│   └── offline/              # Offline data builders (travel DB)
│
├── tests/                    # ★ All automated tests
│   ├── unit/                 # Vitest (vanilla JS)
│   ├── api/                  # pytest (FastAPI)
│   └── e2e/                  # Playwright specs (+ helpers/)
│
├── config/                   # Shared non-root tool config
│   └── vulture.toml          # Python dead-code (lint:dead-code)
│
├── docs/                     # Human docs + archived plans
│   ├── STRUCTURE.md          # This file
│   ├── README.md             # Doc index
│   ├── plans/                # Improve-skill execution plans
│   └── design-plans/         # AssistMe shadcn-inspired UX plans (executed)
│
├── .github/workflows/        # CI · deploy · monitoring (no React Doctor)
├── skills-lock.json          # Agent skills lock (tracked)
├── dist/                     # Build output (gitignored)
└── node_modules/ · venv/     # Install trees (gitignored)
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

## Root files that must stay at root

Tooling expects these paths: `package.json`, `vercel.json`, `playwright.config.js`, `vitest.config.js`, `eslint.config.js`, `.prettierrc`, `.stylelintrc.json`, `middleware.js`, `CNAME`, `pyproject.toml`, `requirements*.txt`.

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
