# Mangesh Raut — Agentic Full-Stack Portfolio

<p align="center">
  <a href="https://mangeshraut.pro">
    <img src="src/assets/images/homepage-light.png" alt="Portfolio homepage — light mode" width="360">
    <img src="src/assets/images/homepage-dark.png" alt="Portfolio homepage — dark mode" width="360">
  </a>
</p>
<p align="center"><sub>Homepage · Light mode (left) · Dark mode (right) · June 2026</sub></p>

<p align="center">
  <a href="https://mangeshraut.pro"><img src="https://img.shields.io/badge/Live-mangeshraut.pro-0071e3?style=for-the-badge&logo=vercel&logoColor=white" alt="Live site"></a>
  <a href="https://mangeshraut712.github.io/mangeshrautarchive/"><img src="https://img.shields.io/badge/GitHub_Pages-mirror-24292e?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages"></a>
  <a href="https://github.com/mangeshraut712/mangeshrautarchive/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/mangeshraut712/mangeshrautarchive/deploy.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mangeshraut712/mangeshrautarchive?style=for-the-badge" alt="MIT License"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node 22"></a>
</p>

<p align="center">
  <strong>Production AI-first portfolio with local-first agentic actions, dual hosting, and a full CI quality matrix.</strong><br>
  <sub>Vanilla ES modules · FastAPI on Vercel · WWDC26 liquid glass · WebMCP · OpenRouter</sub>
</p>

<p align="center">
  <a href="https://mangeshraut.pro"><strong>Live site</strong></a>
  &nbsp;·&nbsp;
  <a href="https://mangeshraut.pro/monitor"><strong>Monitor</strong></a>
  &nbsp;·&nbsp;
  <a href="https://mangeshraut.pro/systems"><strong>Engineering</strong></a>
  &nbsp;·&nbsp;
  <a href="#-architecture"><strong>Architecture</strong></a>
  &nbsp;·&nbsp;
  <a href="#-local-development"><strong>Quick start</strong></a>
</p>

---

## Table of contents

- [Overview](#overview)
- [About the builder](#about-the-builder)
- [Live surfaces](#live-surfaces)
- [Homepage sections](#homepage-sections)
- [What is shipped](#what-is-shipped)
- [Portfolio features in depth](#portfolio-features-in-depth)
- [Blog & case studies](#blog--case-studies)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [AI model routing](#ai-model-routing)
- [AssistMe & WebMCP tools](#assistme--webmcp-tools)
- [Integrations & OAuth](#integrations--oauth)
- [PWA & installability](#pwa--installability)
- [Performance & lazy loading](#performance--lazy-loading)
- [Security](#security)
- [Quality assurance & CI](#quality-assurance--ci)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Local development](#local-development)
- [Deployment & CI/CD](#deployment--cicd)
- [Documentation](#documentation)
- [Changelog highlights](#changelog-highlights)
- [Contributing](#contributing)
- [License & contact](#license--contact)

---

## Overview

This repository powers [mangeshraut.pro](https://mangeshraut.pro) — a static-first portfolio with a **FastAPI** backend on Vercel, not a React/Next.js app. The runtime is **vanilla ES modules**, **Tailwind CSS v4**, and a custom **esbuild** build pipeline.

**AssistMe** is the on-site AI assistant. It runs **deterministic actions in the browser first** (navigation, resume download, theme toggle, project filters) via regex + **WebMCP** (`navigator.modelContext`). Only when local logic cannot answer does the client call **`POST /api/chat`** with **NDJSON streaming** through **OpenRouter** (`model_router.py`).

The same `dist/` output is deployed to **Vercel** (primary + API) and **GitHub Pages** (static mirror with `apiBaseUrl` pointing at production).

**Repository scale (June 2026):** 6 static HTML entry points · 40+ public GitHub repositories · 12 technical articles · 5 in-depth case studies · 10 WebMCP tools · 99 automated tests (29 Vitest + 70 pytest) · 15 Playwright browser projects.

---

## About the builder

|               |                                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Name**      | Mangesh Raut                                                                                                                  |
| **Role**      | Software Development Engineer                                                                                                 |
| **Education** | MS Computer Science — Drexel University                                                                                       |
| **Focus**     | Production AI products, agentic workflows, developer infrastructure, modern web systems                                       |
| **Site**      | [mangeshraut.pro](https://mangeshraut.pro) — evidence-first portfolio (code, benchmarks, telemetry — not bullet-point claims) |

**What I build:** AI products · agentic systems · full-stack applications · RAG pipelines · developer tools · system monitors · production APIs · design systems.

**Engineering philosophy (from `/systems`):** local-first actions before LLM calls · model routing over provider lock-in · measure everything · ship evidence, not templates.

---

## Live surfaces

| Surface                  | URL                                                                                                 | What you get                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Portfolio**            | [mangeshraut.pro](https://mangeshraut.pro)                                                          | AssistMe, projects, blog, health widget, PWA                  |
| **GitHub Pages mirror**  | [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/) | Same static build; API calls go to `mangeshraut.pro`          |
| **Engineering evidence** | [mangeshraut.pro/systems](https://mangeshraut.pro/systems)                                          | CI-verified benchmarks, architecture tabs, live monitor hooks |
| **System monitor**       | [mangeshraut.pro/monitor](https://mangeshraut.pro/monitor)                                          | Public ops dashboard, integration status, probes              |
| **Travel atlas**         | [mangeshraut.pro/travel](https://mangeshraut.pro/travel)                                            | MapLibre map of visited places + narratives                   |
| **Uses / stack**         | [mangeshraut.pro/uses](https://mangeshraut.pro/uses)                                                | Current tooling and vibe-stack snapshot                       |
| **Blog**                 | [mangeshraut.pro/blog](https://mangeshraut.pro/blog)                                                | 12 generated technical articles (2026 topics)                 |
| **404**                  | [mangeshraut.pro/404](https://mangeshraut.pro/404.html)                                             | Branded not-found page with navigation recovery               |

### Page guides

| Page           | Highlights                                                                                                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`/systems`** | Public engineering notebook — CI-backed Lighthouse tiles, architecture decision log, failed experiments, open-source activity, hiring evidence Q&A, system-design topic tabs (AssistMe, dual hosting, WebMCP), live monitor hooks |
| **`/monitor`** | Public ops dashboard — backend health probes, platform distribution chart, uptime matrix, integration status, CSP reports, AI service metrics, deployment surfaces, engineering telemetry                                         |
| **`/travel`**  | MapLibre GL atlas — visited places, route playback, location gallery, searchable narratives                                                                                                                                       |
| **`/uses`**    | Hardware / software / AI stack snapshot rendered from `usesStack` in `engineering-showcase-data.js`                                                                                                                               |

---

## Homepage sections

The main portfolio (`index.html`) is a single-page app with **13 primary nav landmarks** plus embedded sub-regions:

| Section             | ID                      | What it contains                                                               |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| **Hero**            | `#home`                 | Profile, role rotator, vibe-stack flyout, GA4 portfolio-reach panel, hero CTAs |
| **About**           | `#about`                | Bio, timeline highlights, interactive cards                                    |
| **Skills**          | `#skills`               | Category panels, skills visualization (lazy-loaded)                            |
| **Experience**      | `#experience`           | Work history cards                                                             |
| **Projects**        | `#projects`             | GitHub showcase grid, activity graph, lens filters, XR detail modal            |
| **Education**       | `#education`            | Degree timeline                                                                |
| **Publications**    | `#publications`         | Research / writing citations                                                   |
| **Awards**          | `#awards`               | Honors and recognition                                                         |
| **Recommendations** | `#recommendations`      | LinkedIn-style endorsement cards                                               |
| **Certifications**  | `#certifications`       | Credential grid                                                                |
| **Blog**            | `#blog`                 | 12 technical articles with generated HTML pages                                |
| **Contact**         | `#contact`              | Form, Calendly, social links, merged health + Currently shelf                  |
| **Debug Runner**    | `#debug-runner-section` | Interactive browser game (lazy-loaded)                                         |

**Additional embedded regions:** `#engineering` (evidence teaser linking to `/systems`) · `#currently-section` (shows / books / music tabs with local poster assets) · health widget (WHOOP / Withings when connected).

---

## What is shipped

| Area                | Implementation                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| **Agentic runtime** | `agentic-actions.js` — 10 WebMCP tools + regex fast-path in `chat.js` before any LLM call             |
| **AI chat**         | `api/routes/chat.py` — site knowledge, local fallback, OpenRouter Fusion / Auto / Grok-first routing  |
| **Design system**   | WWDC26 liquid glass (`wwdc26-liquid-glass.css`), solid light/dark surfaces, Apple-premium card system |
| **Projects**        | `github-projects.js` — proxy + multi-origin fallback chain, XR detail modal                           |
| **Media shelf**     | Last.fm now-playing via `/api/music/recent` + iTunes artwork proxy `/api/music/artwork`               |
| **Health**          | WHOOP + Withings OAuth, Supabase daily snapshots, `/api/health-vitals/summary` widget                 |
| **Analytics**       | GA4 reach panel + `@vercel/analytics` (production only)                                               |
| **Accessibility**   | Toolbar (font scale, contrast, reduced motion, glass tint), axe-core CI gate                          |
| **Build**           | `scripts/build/build.js` — esbuild, Sharp, hero-critical CSS bundle, blog/case-study generators       |
| **Testing**         | 15 Playwright projects, 70 pytest API tests, Lighthouse **100/100** CI gate on `dist/`                |

---

## Portfolio features in depth

| Feature                   | Details                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AssistMe chatbot**      | Floating `#chatbot-toggle` · NDJSON streaming · KaTeX + DOMPurify markdown · conversation session persistence · typing indicators                                  |
| **Command palette**       | `#search-overlay` — indexes all homepage sections, blog posts, case studies, travel page, debug runner; `⌘K` / `Ctrl+K` shortcut; lazy-loaded on first interaction |
| **Dynamic Island nav**    | Compact global nav (`#global-nav`) with search, theme toggle, mobile overlay menu, view-transition navigation                                                      |
| **Theme system**          | Light / dark / system via `data-theme` + `html.dark` · solid `#ffffff` / `#000000` surfaces · WWDC26 liquid glass tint popover on a11y toolbar                     |
| **Accessibility toolbar** | Share, keyboard shortcuts, font scale ±, liquid-glass transparency — WCAG 2.2 focus rings, skip links, ARIA live regions                                           |
| **Portfolio reach**       | GA4 Data API panel in hero (`#portfolio-reach-panel`) — realtime users, event counts, page views, country breakdown                                                |
| **Currently shelf**       | Curated shows, books, and Last.fm listening — local raster posters in `assets/images/currently/`; music artwork via `/api/music/artwork` proxy                     |
| **Health widget**         | WHOOP recovery / strain + Withings body metrics when OAuth connected; Supabase daily snapshots                                                                     |
| **Projects showcase**     | Live GitHub repos via multi-origin proxy fallback · release strips · signal pills · technology lens chips · project XR modal                                       |
| **Newsletter**            | `POST /api/newsletter/subscribe` with rate limiting                                                                                                                |
| **Contact form**          | `POST /api/contact` — server-validated with honeypot                                                                                                               |
| **Birthday celebration**  | Seasonal easter-egg module (first-interaction lazy load)                                                                                                           |
| **Apple haptics**         | `apple-haptics.js` — subtle feedback on primary interactive elements (supported devices)                                                                           |
| **View Transitions API**  | `view-transitions-nav.js` — same-origin page transitions on supported browsers                                                                                     |
| **AOD dim mode**          | `aod-dim-mode.js` — reduced luminance for OLED / always-on contexts                                                                                                |

---

## Blog & case studies

### Technical articles (12)

Generated at build time from `blog-data.js` into `dist/blog/*.html`:

| #   | Article                                                                     |
| --- | --------------------------------------------------------------------------- |
| 1   | Google I/O 2026 Field Notes: Agentic Web, Gemini, Gemma, and WebNN          |
| 2   | X Algorithm Field Notes: Retrieval, Hydration, Ranking, and Real-Time Feeds |
| 3   | Google AI Ecosystem Field Notes: Multimodal Intelligence as a Product Layer |
| 4   | OpenClaw Field Notes: Open-Source Agents Need More Than Autonomy            |
| 5   | Wispr Flow Field Notes: Voice Input as a Power Tool                         |
| 6   | NVIDIA Field Notes: Why AI Infrastructure Became the Product                |
| 7   | Global AI Race Field Notes: Models, Nations, and the Infrastructure Layer   |
| 8   | AI Code Editors Field Notes: VS Code, Cursor, Windsurf, and Antigravity     |
| 9   | Apple at 50 Field Notes: The Product Discipline Behind the Myth             |
| 10  | Anthropic Mythos Field Notes: Philosophy, Simulation, and AI Safety         |
| 11  | WWDC 2026 Field Notes: Apple Intelligence, Siri, and Private AI             |
| 12  | NotebookLM 2026 Field Notes: From Document Q&A to Research Workflow         |

### Case studies (5)

Defined in `case-studies-data.js` — searchable in the command palette and linked from `/systems`:

| Case study                                 | Focus                                         |
| ------------------------------------------ | --------------------------------------------- |
| **mangeshraut.pro — Agentic Portfolio**    | This site — dual hosting, WebMCP, CI evidence |
| **HindAI — Grounded Philosophy Assistant** | RAG + citation-grounded answers               |
| **CES Energy Analytics Platform**          | Enterprise dashboard / analytics              |
| **AssistMe Virtual Assistant**             | Multi-surface AI assistant product            |
| **Bug Reporting System**                   | Full-stack defect tracking workflow           |

### Flagship open-source repos

`mangeshrautarchive` · `HindAI` · `AssistMe Virtual Assistant` · `CES Energy Platform` · `Bug Reporting System`

---

## Tech stack

Versions below match `package.json` / `requirements.txt` in this repo.

| Layer                   | Technologies                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **Frontend**            | Vanilla ES modules, Tailwind CSS **4.0.9** (`@tailwindcss/cli` **4.3.1**), no production React framework |
| **Agentic**             | WebMCP `navigator.modelContext`, AssistMe action handler, NDJSON chat UI                                 |
| **AI backend**          | OpenRouter via `model_router.py` (Grok portfolio tier, Fusion compare, Auto general, Gemini fast-path)   |
| **API**                 | FastAPI **0.136.1**, Pydantic **2.13.4**, Uvicorn **0.47.0**, httpx **0.28.1**                           |
| **Data & integrations** | GitHub REST, Last.fm, Google Analytics 4, Firestore reach, Supabase health vitals, WHOOP, Withings       |
| **Build**               | esbuild **0.28.0**, Sharp **0.35.2**, custom Node pipeline                                               |
| **Analytics (client)**  | `@vercel/analytics` **2.0.1**                                                                            |
| **Markdown**            | `marked` **18.0.5**, `isomorphic-dompurify`, KaTeX (chat/blog)                                           |
| **Testing**             | Playwright **1.58.2**, Vitest **4.1.6**, `@axe-core/playwright` **4.11.1**, Lighthouse CI                |
| **Lint / format**       | ESLint **9.21.0**, Stylelint **16.26.1**, Prettier **3.8.4**, flake8 (Python)                            |
| **Static analysis**     | React Doctor **0.5.8** (dependency graph via `src/js/entry.js`; informational in CI)                     |
| **Hosting**             | Vercel (API + CDN) + GitHub Pages (static mirror)                                                        |
| **Runtimes**            | Node **22.x**, Python **3.12**                                                                           |

### Uses page stack (`/uses`)

Rendered from `usesStack` in `engineering-showcase-data.js`:

| Category         | Tools                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| **Hardware**     | MacBook Pro (Apple Silicon), Studio Display, AirPods Pro              |
| **Software**     | macOS, Raycast, Arc / Safari, iTerm                                   |
| **AI stack**     | Cursor, Claude Code, OpenRouter, Codex                                |
| **Engineering**  | FastAPI, React, Next.js, Vercel, GitHub Actions, Playwright           |
| **Fonts**        | SF Pro, Inter (fallback)                                              |
| **Theme**        | Solid white/black surfaces, Apple 2026 design tokens, dark/light sync |
| **Productivity** | Notion, Linear-style task lists, GitHub Projects                      |

---

## Architecture

### System map

```mermaid
flowchart TB
    subgraph Pages["Static pages src/ → dist/"]
        HOME[index.html]
        SYS[systems.html]
        USES[uses.html]
        MON[monitor.html]
        TRV[travel.html]
        BLOG[blog/*.html]
    end

    subgraph Browser["Browser"]
        BOOT[bootstrap.js lazy modules]
        AGENT[agentic-actions.js 10 WebMCP tools]
        CHAT[chatbot.js + chat.js]
        BOOT --> CHAT --> AGENT
    end

    HOME --> BOOT
    SYS --> BOOT
    MON --> BOOT
    TRV --> BOOT

    subgraph Local["Local-first under ~50ms"]
        TOOLS[WebMCP + regex actions]
        SK[site_knowledge.py]
    end

    AGENT --> TOOLS
    CHAT --> TOOLS

    subgraph Vercel["Vercel mangeshraut.pro"]
        STATIC[dist/ CDN]
        API[FastAPI api/index.py]
        ROUTER[model_router.py]
        API --> ROUTER
        STATIC --> API
    end

    subgraph GHPages["GitHub Pages mirror"]
        MIRROR[static dist/]
        CFG[build-config.js apiBaseUrl → mangeshraut.pro]
        MIRROR --> CFG
    end

    CHAT -->|POST /api/chat| API
    CFG -->|cross-origin API| API
    API --> SK

    subgraph External["External"]
        OR[OpenRouter]
        GH[GitHub API]
        LF[Last.fm / iTunes proxy]
        HV[WHOOP / Withings / Supabase]
        GA[Google Analytics 4]
    end

    ROUTER --> OR
    API --> GH
    API --> LF
    API --> HV
    API --> GA

    subgraph CI["GitHub Actions deploy.yml"]
        QA[lint · test · Playwright · Lighthouse 100]
        BUILD[npm run build]
        QA --> BUILD --> STATIC
        BUILD --> MIRROR
    end
```

### Chat request flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Chat UI
    participant AG as Agentic engine
    participant API as POST /api/chat
    participant SK as Site knowledge
    participant OR as OpenRouter

    U->>UI: Message
    UI->>AG: detectAndExecute()
    alt Local action match
        AG-->>UI: Result in browser
    else Needs backend
        UI->>API: NDJSON stream optional
        API->>SK: Deterministic facts?
        alt Site knowledge hit
            SK-->>UI: Answer without LLM
        else OpenRouter configured
            API->>OR: Routed model from model_router.py
            OR-->>UI: Streamed tokens
        else
            API-->>UI: Offline local response
        end
    end
```

**Design principles:** local-first actions · dual surface (Vercel + GitHub Pages) · secrets only in server env · every `main` push runs the full quality gate before deploy.

### Key architecture decisions (documented on `/systems`)

| Decision                                   | Rationale                                             |
| ------------------------------------------ | ----------------------------------------------------- |
| **FastAPI over serverless functions only** | Async streaming for NDJSON chat                       |
| **OpenRouter over single provider**        | Model routing beats lock-in                           |
| **WebMCP + regex before LLM**              | ~20× faster for navigation and portfolio actions      |
| **Vanilla ES modules over React SPA**      | Smaller bundle, no hydration tax, Lighthouse-friendly |
| **Rejected microservices**                 | Complexity without benefit at this scale              |
| **Rejected vector DB**                     | Section-indexed search was sufficient                 |
| **Rejected prompt-only navigation**        | Unreliable vs deterministic handlers                  |

---

## AI model routing

`model_router.py` selects the OpenRouter model per message — no client-side model picker required:

| Tier                  | Model (`api/config.py`)   | When used                                                                   |
| --------------------- | ------------------------- | --------------------------------------------------------------------------- |
| **Portfolio primary** | `x-ai/grok-4.3`           | Questions about Mangesh, skills, experience, projects, hire intent          |
| **Fusion compare**    | `openrouter/fusion`       | Compare / vs / trade-offs / multi-perspective analysis                      |
| **Auto router**       | `openrouter/auto`         | General open-domain queries (allowed families: Grok, Gemini, Claude, GPT-5) |
| **Fast fallback**     | `google/gemini-2.5-flash` | Default when `OPENROUTER_MODEL` unset or as lightweight path                |

**Before any LLM call:** `site_knowledge.py` answers deterministic portfolio facts · regex agentic actions run in the browser · rate limit enforced at **20 requests / 60 seconds** per client.

**Optional web tools:** `should_use_web_tools()` can augment answers for time-sensitive queries when configured.

---

## AssistMe & WebMCP tools

Ten tools are registered when `navigator.modelContext` is available (`agentic-actions.js`):

| Tool                   | Action                                                       |
| ---------------------- | ------------------------------------------------------------ |
| `navigate_to_section`  | Scroll to a portfolio section                                |
| `download_resume`      | Download resume PDF                                          |
| `schedule_meeting`     | Open Calendly popup                                          |
| `open_contact_form`    | Focus contact form                                           |
| `copy_contact_info`    | Copy email / social links                                    |
| `search_portfolio`     | Open global search with query                                |
| `filter_projects`      | Filter GitHub showcase by technology                         |
| `open_social_media`    | Open GitHub, LinkedIn, or X                                  |
| `toggle_theme`         | Switch light / dark / system                                 |
| `update_health_metric` | Update WHOOP/Withings widget metric (connected integrations) |

Natural-language commands in AssistMe use the same handlers via regex detection in `chat.js` before any network call.

**Keyboard shortcuts (accessibility toolbar):** `?` shortcuts panel · `⌘K` command palette · theme persists in `localStorage`.

---

## Integrations & OAuth

Server-side OAuth flows in `api/integrations/` — tokens never exposed to the browser bundle.

| Integration         | Endpoints                                                                  | Purpose                                |
| ------------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| **WHOOP**           | `/api/integrations/whoop/connect` · `/callback`                            | Recovery, strain, sleep metrics        |
| **Withings**        | `/api/integrations/withings/connect` · `/callback`                         | Weight, body composition               |
| **Google Calendar** | `/api/integrations/google-calendar/connect` · `/api/calendar/availability` | Meeting availability for Calendly flow |
| **Supabase**        | Internal store                                                             | Daily health summary snapshots         |
| **Health summary**  | `GET /api/health-vitals/summary` · `POST /api/health-vitals/sync`          | Sanitized widget data for homepage     |
| **Cron sync**       | `POST /api/cron/health-vitals-sync`                                        | Scheduled provider refresh             |

**Optional analytics persistence:** Upstash Redis (`UPSTASH_REDIS_REST_URL`) for shared reach counters across Vercel instances.

**Optional GA4 Data API:** Service account with Viewer on property `537627192` powers the detailed Portfolio Reach hero panel.

See [docs/integration-auth-playbook.md](docs/integration-auth-playbook.md) and [.env.example](.env.example) for full configuration.

---

## PWA & installability

`manifest.json` enables install-to-homescreen on supported platforms:

| Property        | Value                                           |
| --------------- | ----------------------------------------------- |
| **Name**        | Mangesh Raut \| Software Engineer               |
| **Display**     | `standalone` with `minimal-ui` override         |
| **Theme color** | `#007AFF`                                       |
| **Icons**       | SVG + 180×180 / 192×192 PNG (maskable)          |
| **Screenshots** | Wide homepage + narrow iPhone 17 Pro Max splash |

**App shortcuts:** Projects · Contact · Travel Atlas · System Monitor

**Apple web app:** `apple-mobile-web-app-capable` · `black-translucent` status bar · dedicated PWA splash assets in `assets/images/`.

---

## Performance & lazy loading

`bootstrap.js` defers non-critical work to protect LCP and Lighthouse scores:

| Strategy                  | Implementation                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| **Eager modules**         | `accessibility.js` only                                                                            |
| **Section lazy load**     | Intersection Observer loads projects, blog, currently, skills, debug-runner CSS + JS near viewport |
| **Interaction lazy load** | AssistMe, search, share widget load on first click (`bindInteractionModuleLoader`)                 |
| **Deferred styles**       | CSS groups (`projects`, `blog`, `currently`, `assistant`, etc.) injected on demand                 |
| **Deferred analytics**    | GA4 gtag loads after first user interaction; skipped entirely during `perf-audit` runs             |
| **Perf-audit mode**       | `perf-audit-head.js` + `?perf-audit=1` — slim CSS, no analytics, Lighthouse-specific UA detection  |
| **Hero-critical CSS**     | Inlined / bundled separately in `build.js` for first paint                                         |
| **Image pipeline**        | Sharp optimization + WebP conversion at build time                                                 |

**Lighthouse CI:** loopback audits use `?perf-audit=1`; production nightly monitoring audits the live Vercel URL without the flag.

---

## Security

| Control                | Details                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Secrets**            | API keys server-side only — never in `build-config.js` or client bundles                         |
| **Rate limiting**      | 20 req / 60 s default on chat and sensitive endpoints                                            |
| **CSP reporting**      | `POST /api/csp-report` ingested by monitor dashboard                                             |
| **OAuth state**        | HMAC-signed state tokens via `oauth_state.py`                                                    |
| **Integration admin**  | `require_integration_admin` guard on connect/disconnect routes                                   |
| **Input sanitization** | DOMPurify on client markdown · Pydantic validation on API                                        |
| **CI security**        | `npm audit --audit-level=high` + `npm run security-check` on every deploy                        |
| **CORS**               | iTunes artwork proxied through `/api/music/artwork` — no direct third-party fetches from browser |

---

## Quality assurance & CI

### GitHub Actions (`deploy.yml` on every push/PR to `main`)

1. `npm audit --audit-level=high` + `npm run security-check`
2. ESLint + Stylelint
3. Vitest (29 unit tests)
4. React Doctor (`doctor:full`, non-blocking)
5. Python flake8 + dead-code scan + **70** API tests (pytest)
6. Playwright smoke + axe-core (`qa:browser:ci`)
7. Lighthouse desktop + mobile on `dist/` (`qa:lighthouse:ci`)
8. Build → GitHub Pages deploy → live commit verification

Nightly **[post-deploy-monitoring.yml](.github/workflows/post-deploy-monitoring.yml)** checks production reachability and Lighthouse on Vercel.

### Thresholds (June 2026)

| Gate                                          | Target                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Lighthouse CI** (`dist/`, desktop + mobile) | **100** Performance · **100** Accessibility · **100** Best Practices · **100** SEO         |
| **axe-core** (homepage)                       | Zero critical / serious violations                                                         |
| **Playwright**                                | 15 named browser projects (Chrome, Safari, Firefox, Edge, Pixel, iPhone, iPad, responsive) |
| **Vitest**                                    | 29 tests across 4 files                                                                    |
| **pytest**                                    | 70 API tests                                                                               |

### Useful commands

| Command                             | Purpose                                                 |
| ----------------------------------- | ------------------------------------------------------- |
| `npm run check`                     | ESLint + Stylelint + Prettier check + Vitest + pytest   |
| `npm run qa:prod-ready`             | Security + full lint/test + browser + Lighthouse        |
| `npm run qa:lighthouse:ci`          | Build `dist/` and run desktop + mobile Lighthouse gates |
| `npm run qa:browser:ci`             | Playwright smoke + accessibility on dev server          |
| `npm run verify:deploy-sync:remote` | Compare deploy commit on Vercel vs GitHub Pages         |

---

## Project structure

```
mangeshrautarchive/
├── api/                      # FastAPI app (Vercel serverless entry: api/index.py)
│   ├── routes/               # chat, github, media, analytics, monitor, integrations
│   ├── integrations/         # WHOOP, Withings, Supabase sync
│   ├── model_router.py       # OpenRouter model selection
│   └── site_knowledge.py     # Deterministic portfolio answers
├── src/                      # Source of truth for static site
│   ├── index.html            # Main portfolio
│   ├── systems.html          # Engineering evidence
│   ├── uses.html             # Tooling / vibe stack
│   ├── monitor.html          # Public ops dashboard
│   ├── travel.html           # MapLibre atlas
│   ├── assets/               # CSS, images (incl. homepage light/dark screenshots)
│   └── js/                   # core/, modules/, services/, utils/
├── scripts/
│   ├── build/                # build.js, blog generator, image optimization
│   ├── deployment/           # Lighthouse gate, env parity, deploy sync
│   └── utils/                # dev server, serve-dist, Playwright runner
├── tests/
│   ├── api/                  # pytest (70 tests)
│   └── e2e/                  # Playwright smoke, a11y, post-deploy, visual
├── docs/                     # Integration playbooks, CI notes, archived HTML snapshots
├── config/                   # Tooling config fragments
└── .github/workflows/        # deploy.yml, post-deploy-monitoring.yml
```

---

## API reference

Production base: `https://mangeshraut.pro`

### Core & chat

```bash
curl https://mangeshraut.pro/api/health
curl https://mangeshraut.pro/api/status
curl https://mangeshraut.pro/api/monitor/status
curl https://mangeshraut.pro/api/chat/health
curl https://mangeshraut.pro/api/models
```

### Content, GitHub & reach

```bash
curl "https://mangeshraut.pro/api/github/repos/public?username=mangeshraut712"
curl https://mangeshraut.pro/api/github/profile
curl https://mangeshraut.pro/api/analytics/reach
curl https://mangeshraut.pro/api/analytics/views
```

### Media

```bash
curl "https://mangeshraut.pro/api/music/recent?user=mbr63&limit=5"
curl "https://mangeshraut.pro/api/music/artwork?track=Song&artist=Artist"
curl "https://mangeshraut.pro/api/posters/movie?title=Inception"
curl "https://mangeshraut.pro/api/posters/book?title=Deep+Learning"
```

### Health & integrations

```bash
curl https://mangeshraut.pro/api/health-vitals/summary
curl https://mangeshraut.pro/api/integrations/status
curl "https://mangeshraut.pro/api/calendar/availability"
```

### Monitor (public ops)

```bash
curl https://mangeshraut.pro/api/monitor/health
curl https://mangeshraut.pro/api/monitor/metrics
curl https://mangeshraut.pro/api/monitor/events
curl https://mangeshraut.pro/api/monitor/engineering
curl https://mangeshraut.pro/api/monitor/ai-metrics
curl https://mangeshraut.pro/api/monitor/security
```

### Forms

```bash
# Contact and newsletter (POST with JSON body)
curl -X POST https://mangeshraut.pro/api/contact -H "Content-Type: application/json" -d '{"name":"...","email":"...","message":"..."}'
curl -X POST https://mangeshraut.pro/api/newsletter/subscribe -H "Content-Type: application/json" -d '{"email":"..."}'
```

OpenAPI interactive docs: `http://127.0.0.1:8001/docs` when running the API locally. Full monitor API reference: `GET /api/monitor/docs`.

---

## Local development

**Requirements:** Node.js 22.x, Python 3.12+, optional [uv](https://github.com/astral-sh/uv) for faster pytest.

```bash
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive
npm install --no-audit --no-fund

python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

cp .env.example .env    # set OPENROUTER_API_KEY at minimum
npm run dev             # frontend :4000 + API :8001
```

### Environment variables (summary)

Copy [.env.example](.env.example) → `.env` (`.env.local` overrides). Key groups:

| Group            | Variables                                     | Required for                               |
| ---------------- | --------------------------------------------- | ------------------------------------------ |
| **AI**           | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`      | AssistMe chat (minimum viable local setup) |
| **GitHub**       | `GITHUB_TOKEN` / `GITHUB_PAT`                 | Higher rate limits on repo proxy           |
| **Last.fm**      | `LASTFM_API_KEY`, `LASTFM_USERNAME`           | Live listening shelf (defaults to `mbr63`) |
| **Analytics**    | `GA4_PROPERTY_ID`, `GOOGLE_ANALYTICS_*`       | Detailed Portfolio Reach panel             |
| **Redis**        | `UPSTASH_REDIS_REST_*`                        | Shared reach counters in production        |
| **Health OAuth** | WHOOP / Withings / Google Calendar client IDs | Health widget + calendar availability      |
| **Supabase**     | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`   | Health vitals persistence                  |

| Service  | URL                        |
| -------- | -------------------------- |
| Frontend | http://127.0.0.1:4000      |
| FastAPI  | http://127.0.0.1:8001      |
| API docs | http://127.0.0.1:8001/docs |

Production build preview:

```bash
npm run build
PORT=4174 npm run serve:dist
```

### Common dev commands

| Command                         | Purpose                                        |
| ------------------------------- | ---------------------------------------------- |
| `npm run dev`                   | Frontend dev server (:4000) + FastAPI (:8001)  |
| `npm run dev:frontend`          | Frontend only                                  |
| `npm run dev:backend`           | API only (reuses existing instance if running) |
| `npm run build`                 | Production `dist/` output                      |
| `npm run check`                 | Lint + unit + API tests                        |
| `npm run qa:smoke`              | Playwright smoke on dev server                 |
| `npm run qa:lighthouse:desktop` | Lighthouse gate on built `dist/`               |

---

## Deployment & CI/CD

| Workflow                                                                   | Trigger                | Role                                          |
| -------------------------------------------------------------------------- | ---------------------- | --------------------------------------------- |
| [deploy.yml](.github/workflows/deploy.yml)                                 | Push/PR `main`, manual | Quality gates → build → GitHub Pages → verify |
| [post-deploy-monitoring.yml](.github/workflows/post-deploy-monitoring.yml) | Daily 14:00 UTC        | Production reachability + Lighthouse          |

**Dual hosting:** CI deploys GitHub Pages from `dist/`. Vercel production deploys via the repo integration on the same `main` commits. `build-config.json` stores `gitCommit` for cross-surface parity checks.

---

## Documentation

| Doc                                                                        | Contents                                            |
| -------------------------------------------------------------------------- | --------------------------------------------------- |
| [docs/ci-quality-gates-june-2026.md](docs/ci-quality-gates-june-2026.md)   | CI order, Lighthouse thresholds, React Doctor notes |
| [docs/integration-auth-playbook.md](docs/integration-auth-playbook.md)     | OAuth flows for integrations                        |
| [docs/google-calendar-oauth-setup.md](docs/google-calendar-oauth-setup.md) | Calendar OAuth setup                                |

---

## Changelog highlights

**June 2026 (latest)**

- Lighthouse CI gate raised to **100/100** on all four categories (desktop + mobile on `dist/`)
- iTunes artwork proxied through `/api/music/artwork` (fixes CORS + Best Practices on production audits)
- Perf-audit head script for Lighthouse / CI runs; loopback `apiBaseUrl` fix for local audits
- Perf-audit detection narrowed — Playwright E2E no longer misclassified as Lighthouse
- Sitewide card audit: unified CSS cache versions, section subtitles, border-only blue hovers
- Solid `#ffffff` / `#000000` theme surfaces; hero name blue gradient; skills category panels
- Engineering evidence page (`/systems`) with CI-backed benchmark tiles and architecture tabs
- README homepage screenshots for light and dark mode
- README expanded with homepage sections, blog index, integrations, PWA, and security documentation

**Earlier 2026**

- AssistMe WebMCP tools expanded to 10 (added `update_health_metric`)
- Public system monitor (`/monitor`) with live probes and engineering telemetry
- Travel atlas (`/travel`) with MapLibre GL
- Dual-host deploy: Vercel primary + GitHub Pages mirror
- WHOOP / Withings / Google Calendar OAuth integrations
- 12 technical Field Notes articles (build-time generated)
- Command palette search across sections, blog, and case studies

---

## Contributing

Issues and PRs are welcome. Minimum before opening a PR:

```bash
npm run check
```

For larger changes, run `npm run qa:prod-ready`.

---

## License & contact

**MIT License** — see [LICENSE](LICENSE).

**Mangesh Raut**

- Web: [mangeshraut.pro](https://mangeshraut.pro)
- LinkedIn: [linkedin.com/in/mangeshraut71298](https://linkedin.com/in/mangeshraut71298)
- GitHub: [github.com/mangeshraut712](https://github.com/mangeshraut712)
- Email: mbr63@drexel.edu

---

<p align="center">
  <a href="#mangesh-raut--agentic-full-stack-portfolio">Back to top</a>
</p>
