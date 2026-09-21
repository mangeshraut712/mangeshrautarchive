# AGENTS.md — Universal AI Agent Briefing

> **Standard:** Linux Foundation AGENTS.md v1.0 (2026)
> **Last updated:** 2026-09-19

---

## Agent Operating Principles

- When creating or updating UI elements, components, cards, pages, buttons, or themes, always consult and adhere to [docs/DESIGN.md](docs/DESIGN.md) (vibrant Apple Blue `#0071e3` gradient with specular metallic shine animation, unified circular red close buttons `#ff3b30`, authentic glassmorphism, zero horizontal overflow).
- **Multi-IDE & Multi-Model Attribution**: The portfolio is actively maintained across diverse AI coding environments and IDEs (Google Antigravity IDE / AGY, OpenAI Codex / ChatGPT, Claude Code, Cursor, GitHub Copilot). Record the coding agent or exposed model family (e.g. `GPT-6 / Codex`, `Claude Opus 4.6`, `Gemini 3.8 Flash`, `grok-4.3`) and its dedicated engineering purpose in `src/js/data/changelog-entries.js` and `README.md` for shipped changes. Record an exact model variant, reasoning mode, or token usage only when the runtime exposes it; use `unavailable` rather than guessing. Always keep the portfolio chatbot's runtime model (`api/model_router.py`) distinct from the coding agent that changed the repository.
- **Continuous In-Situ Visual Verification (Astra Principle)**: Always verify visual work as you go. For front-end, UI/UX, 3D (Three.js), CSS animations, and video/media tasks, continuously inspect the actual rendered interface in the browser across representative desktop and mobile widths and in both light and dark themes as changes are applied, fixing observed defects before claiming completion. Autonomous agents leverage **Playwright MCP** (`@playwright/mcp`) for zero-bloat accessibility snapshots, in-page grep, and dynamic WebMCP tool invocation, while developers use **Playwright CLI** (`@playwright/cli` / `npm run playwright:codegen`) for interactive recording and test authoring. This materially boosts end-artifact quality across all models. Report any surface or state that could not be inspected.
- When explaining a concept or relationship to the user, use the `visualize` skill when a visual materially improves understanding.
- Be concise, direct, and candid. Challenge weak assumptions and distinguish verified facts from uncertainty.
- Ground research in authoritative, current sources and link important evidence.
- Preserve the original goal and constraints. Finish authorized work end to end and verify the actual result before claiming completion.
- Ask questions only when a decision is materially ambiguous, risky, or requires approval.
- Once the user authorizes a change, continue through routine local edits, focused checks, fixes, and
  reruns without asking again. Keep approval boundaries for destructive actions, credentials, external
  writes, commits, pushes, and deployments.
- Use relevant skills. Spawn subagents only for genuinely independent work, then verify and synthesize their findings.
- Keep changes focused and simple. Avoid unrelated edits, unnecessary abstractions, and low-signal tests.
- Preserve unrelated work. Never take destructive, production, or external actions beyond what the user authorized.
- Report meaningful blockers, outcomes, and evidence without noisy progress.

### Cross-agent instruction discovery

- `AGENTS.md` is the canonical project instruction file. Keep shared rules here instead of
  duplicating them across tool-specific files.
- Codex reads `AGENTS.md` natively before each task. It layers the global Codex-home instructions
  with one instruction file per directory from the repository root to the working directory. In
  each directory, `AGENTS.override.md` takes precedence over `AGENTS.md`; configured fallback names
  apply only after those files. More specific directories override broader guidance.
- Claude Code 2.1.277 and later reads `AGENTS.md` when a directory has no `CLAUDE.md`. This repository
  intentionally has no `CLAUDE.md`, so Claude Code and Codex share this file. Claude Code users can
  change the fallback under **Project instructions** in `/config`; Anthropic documents that the
  feature is not yet available on Bedrock, Vertex, or Foundry. See the
  [Claude Code 2.1.277 release](https://github.com/anthropics/claude-code/releases/tag/v2.1.277)
  and the [built-in AGENTS.md mod](https://github.com/anthropics/claude-code/tree/main/mods/agents-md).
- Keep `GEMINI.md` and `.github/copilot-instructions.md` limited to genuine platform-specific
  differences and point back here for shared policy.
- Codex has no documented equivalent of Claude Code's instruction-bloat `/doctor`. The repository's
  `npm run doctor` validates layout and stack constraints only. Review instruction health directly:
  remove redundant steps, narrow broad skill triggers, keep safety and release gates, and verify the
  active chain with `codex --ask-for-approval never "Summarize the current instructions."` after
  changing instruction files. Restart the Codex session to reload the chain.
- Codex stops adding project instructions at `project_doc_max_bytes` (32 KiB by default). Keep the
  root brief concise and use scoped `AGENTS.override.md` files only when a subtree truly differs.
  See [OpenAI Docs: AGENTS.md](https://developers.openai.com/docs/agent-configuration/agents-md).

---

## Engineering practices

Use [docs/BEST_PRACTICES.md](docs/BEST_PRACTICES.md) when changing architecture, module
boundaries, public APIs, testing strategy, Git workflow, or CI/CD. Do not load or restate the full
architecture guide for small copy, data, or isolated style edits.

---

## 1. Project Overview

**mangeshrautarchive** is Mangesh Raut's agentic full-stack portfolio website.

| Attribute       | Value                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| Primary URL     | [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive) (GitHub Pages) |
| Optional URL    | [mangeshraut.pro](https://mangeshraut.pro) (Vercel; currently disabled)                                           |
| License         | MIT                                                                                                               |
| Node.js         | ≥22 &lt;27 (`.nvmrc` → 22), ESM (`"type": "module"`)                                                              |
| Python          | 3.12+ (FastAPI backend)                                                                                           |
| Design language | Apple (SF Pro Text/Display, glassmorphism, light/dark themes)                                                     |

### Tech Stack

- **Frontend:** Vanilla HTML / CSS / JavaScript ES modules — no React, Angular, Vue, or Svelte runtime.
- **Backend:** Python 3.12+ FastAPI on Vercel serverless functions; local dev on port 8001.
- **AI Chatbot:** OpenRouter API (grok-4.3 model) proxied through FastAPI, with WebMCP agentic actions.
- **Build:** esbuild for JS bundling; Tailwind CSS v4 for utility generation only (output CSS file consumed, never classes in HTML markup).
- **Styling:** Vanilla CSS with Apple-standard CSS custom properties (`--apple-blue: #0071e3`, etc.).
- **Testing:** Vitest (unit), pytest (API), Playwright (E2E; projects are defined in `playwright.config.js`).
- **CI/CD:** GitHub Actions — security scanning, ESLint, Stylelint, Lighthouse deploy gates (100/100/100/100 on built dist homepage).

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────┐
│  Vercel Edge / GitHub Pages (static)                 │
│  src/index.html, src/systems.html, src/monitor.html  │
│  src/travel.html, src/uses.html, src/changelog.html, │
│  src/404.html                                        │
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
# Prerequisites
node -v                     # must be ≥22 (see .nvmrc); Node 18 breaks Stylelint 17 / Vitest 4
npm run check-node          # fails fast if Node is out of range
npm run doctor              # Root layout + stack guard (vanilla ESM + FastAPI)
npm run doctor:stack        # Node + doctor (no React/Next/Vue runtime deps)

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
npm test                    # Vitest unit tests
npm run test:api            # pytest API tests; activate venv first when required
npm run test:e2e:chrome     # Playwright E2E — Desktop Chrome
npm run test:e2e:all        # Playwright E2E — all 16 browser projects
npm run playwright:mcp      # Start Playwright MCP server (agent browser automation)
npm run playwright:cli      # Run Playwright CLI for ad-hoc browser commands
npm run playwright:codegen  # Interactive test codegen recorder

# Quality gates
npm run check               # ESLint + Stylelint + Prettier + Vitest
npm run qa:prod-ready       # Full pre-deploy: security + lint + unit + API + E2E + Lighthouse
npm run qa:lighthouse:desktop  # Lighthouse audit (desktop)
npm run qa:lighthouse:mobile   # Lighthouse audit (mobile)
npm run security-check      # Scan for leaked secrets and credentials
npm run clean               # Purge dist/, artifacts/, caches (skips .venv / node_modules)

# Deploy verification
npm run qa:postdeploy       # Dual-host commit parity (long retries)
npm run qa:surfaces         # Faster dual-host smoke
npm run verify:deploy-sync  # Vercel ↔ GitHub Pages parity
npm run qa:lighthouse:vercel  # Live Vercel Lighthouse floors
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

- Semantic HTML5. Pages: `index.html`, `systems.html`, `monitor.html`, `travel.html`, `uses.html`, `changelog.html`, `404.html`.
- `systems.html` and `monitor.html` must never include footer elements.
- PWA manifest at `src/manifest.json`, service worker at `src/service-worker.js`.

### Python

- 4-space indent, 120-char max line length.
- FastAPI with Pydantic v2 models for request/response validation.
- All API routes in `api/routes/` directory.

### Git & Release Protocol

- Commit format: `type(scope): description` — e.g., `fix(mobile): decongest layout and fix fit-to-screen across all viewports`.
- Branch naming: `feature/short-description`, `fix/issue-description`, `chore/cleanup-task`.
- **MANDATORY Pre-Commit & Release Checklist (Always Execute Automatically)**:
  1. **Update Changelog (`src/js/data/changelog-entries.js`)**: Add a new typed entry to `changelogEntries` detailing the shipped fixes, features, or design polish, with explicit active model attribution and purpose.
  2. **Track Coding Agent & Purpose Without Guessing**: In `README.md` (Section 5.1),
     documentation files, and the commit body, record the coding agent or exposed model family and
     its dedicated purpose. Record the exact model variant, reasoning mode, and token usage only when
     the runtime exposes them; otherwise use `unavailable`.
  3. **Run Full Quality Gate**: Run `npm run check` (ESLint + Stylelint + Prettier + Vitest 318 tests), `npm run security-check`, and `npm run build` with Node 22 (`export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/Cellar/node@22/22.23.2/bin:$PATH"`).
  4. **Sync Documentation**: Keep test counts, architecture files, and design system rules synchronized across `README.md`, `AGENTS.md`, and `docs/DESIGN.md`.
  5. **Guarantee 100% Green CI/CD Protocol**: Always monitor GitHub Actions after every `git push` to `main` via `gh run list` / `gh run view` to confirm all remote jobs (actionlint, linting, Vitest, pytest, Playwright, Lighthouse 100/100/100/100 gates, and Pages deployment) complete with green checks. Never consider a task finished with failing remote CI runs.

---

## 5. File Organization

```
mangeshrautarchive/
├── src/                    # Frontend source → npm run build → dist/
│   ├── *.html              # Page shells (index, about, systems, monitor, travel, uses, changelog, 404, offline)
│   ├── js/core|modules|services|utils|data|vendor/
│   └── assets/css|images|files|icons|vendor/
├── api/                    # FastAPI (Vercel entry: api/index.py)
│   ├── routes/             # HTTP route modules
│   ├── integrations/       # OAuth + third-party connectors
│   └── config.py · model_router.py · monitoring.py · …
├── scripts/                # Tooling (not shipped to browsers)
│   ├── build/              # esbuild, generators, clean
│   ├── deployment/         # Lighthouse, security, deploy sync
│   ├── utils/              # dev servers, flake8/vulture runners
│   ├── qa/                 # browser / device audits
│   └── integrations/       # OAuth + OpenRouter helpers
├── tests/                  # All automated tests
│   ├── unit/               # Vitest (tests/unit/**/*.test.js)
│   ├── api/                # pytest
│   └── e2e/                # Playwright (+ helpers/site.js)
├── config/                 # vulture.toml (non-root tool config)
├── docs/                   # STRUCTURE.md · plans/ · doc index
├── dist/                   # Build output (git-ignored)
├── vercel.json · package.json · playwright/vitest/eslint configs
└── pyproject.toml · requirements*.txt
```

Full map: [docs/STRUCTURE.md](docs/STRUCTURE.md).

---

## 6. Testing Requirements

All three test suites must pass before any merge to `main`:

| Suite | Runner     | Command                | Coverage                                    |
| ----- | ---------- | ---------------------- | ------------------------------------------- |
| Unit  | Vitest     | `npm test`             | 318 tests — JS modules, utilities, markdown |
| API   | pytest     | `npm run test:api`     | 182 tests — FastAPI endpoints, middleware   |
| E2E   | Playwright | `npm run test:e2e:all` | Multi-spec suite across 16 browser projects |

- Playwright configs include Desktop Chrome/Safari/Firefox/Edge, Pixel 7 Chrome, iPhone 14 Safari, iPad Pro Safari, and more.
- Lighthouse deploy workflow enforces 100/100/100/100 on built dist homepage; live-host floors vary (`npm run qa:lighthouse:ci`, `qa:lighthouse:vercel`).
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

- Prefer `npm install --no-audit --no-fund` (matches CI / Vercel). `npm ci` also works after the React Doctor / lockfile cleanup; use it when you want a clean install from the lockfile only.

### Running locally / no API key needed

- `npm run dev` serves the frontend on http://127.0.0.1:4000 and proxies `/api/*` to the FastAPI backend on port 8001.
- The AI chatbot works without any secrets: when `OPENROUTER_API_KEY` is unset the backend runs in "Local Intelligence (offline fallback)" mode and returns canned portfolio answers. Set `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`) in `.env`/`.env.local` only when you need real LLM responses. All other AI/media/integration keys in `.env.example` are optional for local dev.
