# AGENTS.md — Universal AI Agent Briefing

> **Standard:** Linux Foundation AGENTS.md v1.0 (2026)
> **Last updated:** 2026-07-06

---

## 1. Project Overview

**mangeshrautarchive** is Mangesh Raut's agentic full-stack portfolio website.

| Attribute       | Value                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| Primary URL     | [mangeshraut.pro](https://mangeshraut.pro) (Vercel)                                                               |
| Mirror URL      | [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive) (GitHub Pages) |
| License         | MIT                                                                                                               |
| Node.js         | 22.x, ESM (`"type": "module"`)                                                                                    |
| Python          | 3.12+ (FastAPI backend)                                                                                           |
| Design language | Apple (SF Pro Text/Display, glassmorphism, light/dark themes)                                                     |

### Tech Stack

- **Frontend:** Vanilla HTML / CSS / JavaScript ES modules — no React, Angular, Vue, or Svelte runtime.
- **Backend:** Python 3.12+ FastAPI on Vercel serverless functions; local dev on port 8001.
- **AI Chatbot:** OpenRouter API (grok-4.3 model) proxied through FastAPI, with WebMCP agentic actions.
- **Build:** esbuild for JS bundling; Tailwind CSS v4 for utility generation only (output CSS file consumed, never classes in HTML markup).
- **Styling:** Vanilla CSS with Apple-standard CSS custom properties (`--apple-blue: #0071e3`, etc.).
- **Testing:** Vitest (unit), pytest (API), Playwright (E2E across 15 browser configs).
- **CI/CD:** GitHub Actions — security scanning, ESLint, Stylelint, Lighthouse 100/100/100/100 gates.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────┐
│  Vercel Edge / GitHub Pages (static)                 │
│  src/index.html, src/systems.html, src/monitor.html  │
│  src/travel.html, src/uses.html, src/404.html        │
│  dist/ (esbuild output)                              │
├──────────────────────────────────────────────────────┤
│  Vercel Serverless Functions                         │
│  api/index.py  →  FastAPI app                        │
│  api/routes/   →  chat, monitoring, integrations     │
│  api/config.py →  environment + model configuration  │
├──────────────────────────────────────────────────────┤
│  External Services                                   │
│  OpenRouter API (LLM) │ Vercel Analytics │ GA4       │
└──────────────────────────────────────────────────────┘
```

- The frontend makes fetch calls to `/api/*` endpoints.
- The FastAPI backend proxies LLM requests to OpenRouter, manages chat memory, and exposes monitoring/health probes.
- WebMCP tools allow the AI chatbot to perform agentic actions on the portfolio (navigation, data retrieval).

---

## 3. Essential Commands

```bash
# Development
npm run dev                 # Start frontend (port 4000) + backend (port 8001) concurrently
npm run dev:frontend        # Frontend-only with backend proxy to localhost:8001
npm run dev:backend         # FastAPI backend only (uvicorn, port 8001)

# Build
npm run build               # esbuild production bundle → dist/
npm run build:css           # Tailwind CSS utility generation only
npm run clean               # Remove dist/ and build artifacts

# Lint
npm run lint                # ESLint (JS)
npm run lint:css            # Stylelint (CSS)
npm run lint:python         # flake8 (Python)
npm run format:check        # Prettier check

# Test
npm test                    # Vitest unit tests (29 tests)
npm run test:api            # pytest API tests (70 tests) via uv
npm run test:e2e:chrome     # Playwright E2E — Desktop Chrome
npm run test:e2e:all        # Playwright E2E — all 15 browser configs

# Quality gates
npm run qa:prod-ready       # Full pre-deploy: security + lint + unit + API + E2E + Lighthouse
npm run qa:lighthouse:desktop  # Lighthouse audit (desktop, 100/100/100/100 gates)
npm run qa:lighthouse:mobile   # Lighthouse audit (mobile, 100/100/100/100 gates)
npm run security-check      # Scan for leaked secrets and credentials

# Deploy verification
npm run qa:postdeploy       # Post-deployment smoke test
npm run verify:deploy-sync  # Verify deployment artifact consistency
```

---

## 4. Code Style & Conventions

### JavaScript

- Vanilla ES modules only. Import with `import ... from './module.js'` (include `.js` extension).
- Single quotes, semicolons, 2-space indent, trailing commas (ES5 style).
- 100-character print width. Arrow parens: avoid when possible.
- No TypeScript. No JSX. No framework-specific patterns.

### CSS

- All component styles in vanilla CSS files under `src/assets/css/`.
- Use CSS custom properties for theming: `--apple-blue`, `--apple-bg`, `--apple-text`, etc.
- Tailwind CSS v4 generates a utility CSS output file — never place Tailwind utility classes directly in HTML markup.
- Glassmorphism pattern: `backdrop-filter: blur()` + semi-transparent backgrounds.
- SF Pro Text for body, SF Pro Display for headings.

### HTML

- Semantic HTML5. Pages: `index.html`, `systems.html`, `monitor.html`, `travel.html`, `uses.html`, `404.html`.
- `systems.html` and `monitor.html` must never include footer elements.
- PWA manifest at `src/manifest.json`, service worker at `src/service-worker.js`.

### Python

- 4-space indent, 120-char max line length.
- FastAPI with Pydantic v2 models for request/response validation.
- All API routes in `api/routes/` directory.

### Git

- Commit format: `type(scope): description` — e.g., `feat(chatbot): add streaming response support`.
- Branch naming: `feature/short-description`, `fix/issue-description`, `chore/cleanup-task`.

---

## 5. File Organization

```
mangeshrautarchive/
├── src/                    # Frontend source
│   ├── index.html          # Main portfolio page
│   ├── systems.html        # Systems dashboard (no footer)
│   ├── monitor.html        # Monitor dashboard (no footer)
│   ├── travel.html         # Travel page
│   ├── uses.html           # Uses page
│   ├── 404.html            # Custom 404
│   ├── js/                 # JavaScript ES modules
│   ├── assets/css/         # Vanilla CSS + Tailwind output
│   └── assets/             # Images, fonts, icons
├── api/                    # Python FastAPI backend
│   ├── index.py            # FastAPI app entrypoint
│   ├── config.py           # Environment + model config
│   ├── routes/             # API route modules
│   ├── monitoring.py       # Health monitoring
│   └── integrations/       # Third-party integrations
├── scripts/                # Build & deployment tooling
│   ├── build/              # esbuild, image optimization, CSS
│   ├── deployment/         # Lighthouse gates, security checks
│   ├── utils/              # Dev servers, Playwright runner
│   └── qa/                 # QA scripts (iPhone compat, FPS audit)
├── tests/                  # All test suites
│   ├── unit/               # Vitest unit tests
│   ├── api/                # pytest API tests
│   ├── e2e/                # Playwright E2E specs
│   └── config/             # Test configuration
├── config/                 # pyright + vulture (CI dead-code scan)
├── dist/                   # Build output (git-ignored)
├── vercel.json             # Vercel deployment config
├── playwright.config.js    # Playwright multi-browser config
├── vitest.config.js        # Vitest config
├── eslint.config.js        # ESLint flat config
└── package.json            # Node.js config (ESM, engines: 22.x)
```

---

## 6. Testing Requirements

All three test suites must pass before any merge to `main`:

| Suite | Runner     | Command                | Coverage                                    |
| ----- | ---------- | ---------------------- | ------------------------------------------- |
| Unit  | Vitest     | `npm test`             | 29 tests — JS modules, utilities, DOM logic |
| API   | pytest     | `npm run test:api`     | 70 tests — FastAPI endpoints, middleware    |
| E2E   | Playwright | `npm run test:e2e:all` | 150 tests across 15 browser configurations  |

- Playwright configs include Desktop Chrome/Safari/Firefox/Edge, Pixel 7 Chrome, iPhone 14 Safari, iPad Pro Safari, and more.
- Lighthouse gates enforce 100/100/100/100 (Performance/Accessibility/Best Practices/SEO).
- Accessibility tests use `@axe-core/playwright`.

---

## 7. Guardrails / Boundaries

### Never do

- Install or import React, Angular, Vue, Svelte, or any UI framework runtime.
- Commit `.env`, `.env.local`, or `.env.vercel.local` files to version control.
- Place Tailwind utility classes directly in HTML markup (`class="bg-blue-500"` is forbidden).
- Add `<footer>` elements to `systems.html` or `monitor.html`.
- Use inline styles (`style="..."`) — use CSS classes or custom properties instead.
- Use TypeScript — this is a vanilla JavaScript project.
- Hardcode API keys, secrets, or PII anywhere in source files.
- Modify `vercel.json` routing without running `npm run verify:deploy-sync`.

### Always do

- Use CSS custom properties (`var(--apple-blue)`) for all theme colors.
- Run `npm run security-check` before committing.
- Include `.js` extension in all ES module import paths.
- Test across multiple browsers before merging E2E-related changes.
- Use `uv run` for Python test execution (as configured in `package.json`).

---

## 8. AI Chatbot Architecture

The AI chatbot is the portfolio's interactive assistant:

- **Model:** OpenRouter API → `grok-4.3` (configurable via `api/model_router.py`).
- **Proxy:** Frontend JS sends chat messages to `/api/chat`. FastAPI proxies to OpenRouter with streaming responses.
- **Memory:** Conversation history managed by `api/memory_manager.py` with configurable context window.
- **Site Knowledge:** `api/site_knowledge.py` injects portfolio context into system prompts.
- **WebMCP Tools:** The chatbot can perform agentic actions (navigate pages, query project data, surface resume info) via WebMCP tool definitions.
- **Rich Rendering:** Chat responses support Markdown (via `marked`), code highlighting, KaTeX math, and footnotes.
- **Security:** All LLM API calls are server-side only. No API keys are exposed to the client.

---

## Cursor Cloud specific instructions

Durable, non-obvious notes for running/testing this repo in the Cursor Cloud VM. Standard commands live in section 3 and `package.json`; only the caveats are captured here.

### Python environment (important)
- The Python virtualenv must be named `venv` (not `.venv`). `scripts/utils/dev-backend.js` auto-detects `./venv/bin/python`; if it is missing it falls back to `uv`, which is not installed in this environment, so the backend would fail to start.
- `npm run test:api` (`python -m pytest`) and `npm run lint:python` (`python -m flake8`) call bare `python`. Activate the venv first: `source venv/bin/activate`. The `dev:backend` script does not need activation (it uses `./venv/bin/python` directly).

### Node install
- Use `npm install`, not `npm ci`. The committed `package-lock.json` is slightly out of sync (a transitive `react` entry is missing), so `npm ci` aborts. `npm install` resolves it. This is the documented install path (README).

### Running locally / no API key needed
- `npm run dev` serves the frontend on http://127.0.0.1:4000 and proxies `/api/*` to the FastAPI backend on port 8001.
- The AI chatbot works without any secrets: when `OPENROUTER_API_KEY` is unset the backend runs in "Local Intelligence (offline fallback)" mode and returns canned portfolio answers. Set `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`) in `.env`/`.env.local` only when you need real LLM responses. All other AI/media/integration keys in `.env.example` are optional for local dev.
