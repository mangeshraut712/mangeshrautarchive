# Mangesh Raut — Agentic Full-Stack Portfolio

<p align="center">
  <a href="https://mangeshraut.pro">
    <img src="src/assets/images/home-hd.webp" alt="Mangesh Raut — Agentic Portfolio home hero" width="720">
  </a>
</p>

<p align="center">
  <a href="https://mangeshraut.pro">
    <img src="https://img.shields.io/badge/🌐_Live-mangeshraut.pro-0071e3?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Site">
  </a>
  <a href="https://mangeshraut712.github.io/mangeshrautarchive/">
    <img src="https://img.shields.io/badge/📄_GitHub_Pages-mangeshraut712-24292e?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages">
  </a>
  <a href="https://github.com/mangeshraut712/mangeshrautarchive/actions/workflows/deploy.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/mangeshraut712/mangeshrautarchive/deploy.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white" alt="CI Status">
  </a>
  <a href="https://github.com/mangeshraut712/mangeshrautarchive/stargazers">
    <img src="https://img.shields.io/github/stars/mangeshraut712/mangeshrautarchive?style=for-the-badge&logo=github&color=ffd700" alt="GitHub Stars">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/mangeshraut712/mangeshrautarchive?style=for-the-badge" alt="MIT License">
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/node-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node 22">
  </a>
  <a href="https://mangeshraut.pro/monitor">
    <img src="https://img.shields.io/badge/📊_System_Monitor-Online-30d158?style=for-the-badge" alt="System Monitor">
  </a>
</p>

<p align="center">
  <strong>Production-grade AI-first portfolio with deterministic client-side tool calling</strong><br>
  <sub>AssistMe · WebMCP · WWDC26 Liquid Glass · Hybrid Intelligence · 12+ Device Testing Matrix</sub>
</p>

<p align="center">
  <a href="https://mangeshraut.pro"><strong>🌐 Open Live Experience</strong></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://mangeshraut712.github.io/mangeshrautarchive/"><strong>📄 GitHub Pages</strong></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://mangeshraut.pro/monitor"><strong>📊 Live Operations Dashboard</strong></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-engineering-deep-dives"><strong>🔧 See How It Was Built</strong></a>
</p>

---

## ✨ What Makes This Different

This isn't a static portfolio — it's a **production agentic system** you can interact with.

**Core Innovation**: **AssistMe**, an AI assistant that doesn't just chat — it **acts**. Navigate sections, download resumes, schedule meetings, filter projects, toggle themes — all executed instantly in-browser via 9 deterministic WebMCP tools. No page reloads, zero network latency for local actions.

**Built as a reference implementation** — every subsystem engineered to production standards:

- **AssistMe AI Chat** — streaming Markdown, Siri-style voice dictation, writing tools, and contextual follow-up chips
- **12 Technical Writings** — deep-dive blogs covering AI Code Editors, WWDC 2026/Apple Intelligence, NotebookLM 2026, WebMCP tool design, and agentic workflows
- **9 WebMCP Tools** registered with `navigator.modelContext` for native AI agent compatibility
- **Hybrid Execution** — local actions (&lt;50ms) + OpenRouter streaming LLM
- **WWDC26 Liquid Glass Design System** — clear/tinted glass slider, solid theme card surfaces, specular highlights, and reduced-motion fallbacks
- **Health Vitals Widget** — live WHOOP recovery/strain and Withings body composition synced via Supabase
- **Apple Share Sheet** — QR codes, social mirrors, and profile sharing from the accessibility toolbar
- **Multi-Tier Resilience** — 4-layer fallback chain works on Vercel _and_ static GitHub Pages
- **Extreme Testing** — 12+ real browser/device configs (Chrome, Safari, Firefox, Edge, Pixel 7, iPhone 14, iPad Pro)
- **Zero-Downtime Deploys** — dual-surface (Vercel + GitHub Pages) with automated post-deploy verification
- **Modern Build Pipeline** — esbuild v0.28.0 + Sharp v0.34.5 + Tailwind CSS v4.0.9 CLI for rapid CSS compilation and image optimization

**Study it. Fork it. Build on it.**

---

## 📑 Table of Contents

- [🚀 Live Demos](#-live-demos)
- [🔧 Engineering Deep Dives](#-engineering-deep-dives)
- [🧠 Agentic AI Capabilities](#-agentic-ai-capabilities)
- [🎨 Premium User Experience](#-premium-user-experience)
- [🛠 Tech Stack](#-tech-stack)
- [🏗 Architecture](#-architecture)
- [🧪 Quality & Testing](#-quality--testing)
- [⚡ Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🔌 Key API Endpoints](#-key-api-endpoints)
- [📅 Recent Updates](#-recent-updates)
- [💖 Support & Sponsorship](#-support--sponsorship)
- [🗺 Roadmap](#-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📬 Contact](#-contact)

---

## 🚀 Live Demos

| Experience     | Link                                                                                                | Highlights                                                           |
| -------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Main Portfolio | [mangeshraut.pro](https://mangeshraut.pro)                                                          | AssistMe chat, liquid glass UI, spatial projects                     |
| GitHub Pages   | [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/) | Full functionality via static hosting with API fallbacks             |
| System Monitor | [mangeshraut.pro/monitor](https://mangeshraut.pro/monitor)                                          | Real-time latency, service health, deploy status                     |
| Travel Atlas   | [mangeshraut.pro/travel](https://mangeshraut.pro/travel)                                            | MapLibre-powered visited places with narrative AI                    |
| AI Assistant   | Open chat on any page                                                                               | Try: _"download resume"_, _"go to projects"_, _"schedule a meeting"_ |

> **Pro tip**: The agentic engine runs locally first. Many commands execute with zero network round-trip.

---

## 🔧 Engineering Deep Dives

How the key systems actually work — implementation details, not buzzwords.

### 1. AssistMe Agentic Action Engine

**What was built**: A complete deterministic agentic runtime that turns the chat from a passive Q&A box into an active system that performs real UI actions.

**How it works**:

- Two parallel detection systems run on every user message.
- **Primary path** (`chat.js`): `agenticActions.detectAndExecute()` is called **before** any LLM request. If a confident match is found, the action executes locally and the LLM is skipped entirely.
- **Secondary path**: Full WebMCP tool registration in `agentic-actions.js` using `navigator.modelContext.registerTool()` with proper JSON Schema input definitions — discoverable by future native AI agents.
- Every action has rich visual feedback (pulsing "ACTION EXECUTED" badges, glassmorphic toasts).
- History tracking, abort controllers for cleanup, and graceful degradation when WebMCP is unavailable.

**Result**: Sub-50ms execution for common commands like "download resume" or "go to projects" with full privacy.

### 2. WWDC26 Liquid Glass Design System

**What was built**: A unified translucent UI layer inspired by Apple's 2026 design language, applied sitewide with accessibility-safe fallbacks.

**How it works**:

- `wwdc26-liquid-glass.css` and `liquid-glass-tokens.js` centralize blur, tint, specular, and elevation tokens with **clear / tinted / balanced** modes.
- Theme-aware CSS custom properties sync with light/dark/system modes via `bootstrap.js`; card surfaces fall back to solid `#fff` / `#000` where readability matters.
- `prefers-reduced-transparency` and `prefers-reduced-motion` degrade to solid surfaces automatically.
- QA matrix scripts (`scripts/qa/glass-theme-matrix.mjs`) validate contrast and interactivity across pages.

### 3. GitHub Projects Intelligence System

**What was built**: A live, release-aware project showcase that never breaks — even on static GitHub Pages hosting.

**How it works**:

- Four-tier fallback chain in `github-projects.js`:
  1. Local backend proxy (`/api/github/repos/public`)
  2. Production absolute domain fallbacks (`https://mangeshraut.pro/api/…`)
  3. Vercel preview domains
  4. Direct GitHub API (with client-side caching)
- Featured projects have **override logic** — they bypass normal filters and are never dropped.
- Enriched offline `fallbackRepos` contains complete metadata for all featured projects.
- Spatial "XR" modal view for repository structure exploration.

### 4. Travel Atlas — Apple Maps-Inspired Experience

**What was built**: A fully interactive visited-places atlas using MapLibre GL.

**How it works**:

- Custom `travel-engine.js` transforms raw location data into rich narrative objects (stories, categories, photo references).
- Advanced client-side search + multi-category filtering + "featured only" mode.
- Auto-tour mode that cycles through locations with smooth camera flights.
- Strict design constraint: only red pins for places actually visited (no aspirational pins).
- Theme-aware liquid glass styling and full keyboard + screen-reader accessibility.

### 5. Production-Grade Monitoring Dashboard

**What was built**: A real `/monitor` page exposing live system health — publicly.

**How it works**:

- `api/monitoring.py` and `api/routes/monitor.py` implement async health probes using `httpx` + optional `psutil`.
- Measures latency to OpenRouter, GitHub, Firestore, Last.fm, and connected integrations on every request.
- Structured event logging with severity levels and a recent event ring buffer.
- OAuth connect flows for WHOOP, Withings, and Google Calendar with signed state and admin-gated sync.
- Used both for personal observability and as a public transparency feature.

### 6. Health Vitals Sync (WHOOP + Withings)

**What was built**: A privacy-aware health widget on the homepage backed by Supabase daily snapshots.

**How it works**:

- `api/integrations/whoop.py` and `withings.py` normalize recovery, strain, weight, muscle, and body-fat metrics.
- `sync_engine.py` merges provider data with correct measure-type mapping (e.g. Withings type 6 for fat ratio).
- The homepage widget renders live cards with graceful offline fallbacks when integrations are disconnected.

### 7. Apple Sound System (Procedural Web Audio)

**What was built**: A fully synthesized, file-free Apple-inspired sound engine.

**How it works**:

- `apple-sounds.js` creates all sounds procedurally using the Web Audio API — no external `.mp3` files.
- Sounds modeled on macOS/iOS audio design: a "plink" for theme toggle, iOS tri-tone for chatbot open, C-major arpeggio for success, and a Happy Birthday melody for the birthday overlay.
- Singleton design with `localStorage` persistence for user preference and autoplay-policy-safe interaction guard.

### 8. Custom esbuild Build Pipeline

**What was built**: A purpose-built, zero-config-heavy build system.

**How it works**:

- `scripts/build/build.js` uses esbuild directly for JS transformation.
- Intelligent `dist` directory selection — falls back to `/tmp/mangeshrautarchive-dist` when running inside macOS-protected folders to avoid `EPERM` errors.
- Safe public configuration injection only (`build-config.json` + `build-config.js`) — **zero secrets** ever reach the browser.
- Integrated Sharp image optimization pass.
- Static extras (CNAME, manifest, PWA icons/splash) preserved with correct cache headers; stale service workers are purged on load for fresh deploys.

### 9. Extreme Testing Matrix + Post-Deploy Verification

**What was built**: One of the most thorough personal project test setups on GitHub.

**How it works**:

- `playwright.config.js` defines 12+ named projects including specific browser channels (Chrome, msedge) and real mobile devices.
- Separate suites for smoke, accessibility (axe-core), visual regression, and post-deploy.
- Post-deploy tests run against **both** Vercel and GitHub Pages surfaces after every production release.
- Lighthouse CI gates in `deploy.yml` plus nightly production monitoring against live Vercel and GitHub Pages URLs.
- CI uses `npm install` with lockfile cache and system Google Chrome (no bundled Playwright browser download in workflows).
- One-command `npm run qa:prod-ready` runs the full security + lint + unit + E2E + Lighthouse pipeline.

---

## 🧠 Agentic AI Capabilities

9 deterministic tools registered and executable today:

| Tool                  | What It Does                                   |
| --------------------- | ---------------------------------------------- |
| `navigate_to_section` | Instant smooth scroll to any portfolio section |
| `download_resume`     | Direct PDF download                            |
| `schedule_meeting`    | Open Calendly popup                            |
| `open_contact_form`   | Focus and open contact overlay                 |
| `copy_contact_info`   | Copy email / LinkedIn                          |
| `search_portfolio`    | Trigger global search                          |
| `filter_projects`     | Filter the live GitHub showcase                |
| `open_social_media`   | Open GitHub / LinkedIn / X                     |
| `toggle_theme`        | Switch light / dark / system                   |

All tools are functional via natural language in AssistMe **and** exposed via WebMCP for future agent ecosystems.

---

## 🎨 Premium User Experience

- **Zero heavy framework** — pure ES modules + Tailwind CSS 4 + WWDC26 liquid glass design system (no React/Vue/Svelte in production)
- **AssistMe overlay** — streaming Markdown, voice dictation, writing tools, and on-screen context chips
- **Procedural sound engine** — synthesized Web Audio API sounds (theme toggle, chat open, birthday)
- **Glassmorphism & micro-interactions** — spatial cards, buttery transitions, real-time action toasts
- **Accessibility toolbar** — font scaling, contrast modes, reduced motion, keyboard navigation, and Apple-style share sheet
- **Health vitals cards** — WHOOP recovery/strain and Withings body composition on the homepage
- **Birthday celebration system** — Canvas physics (confetti + balloons), aurora gradient overlay, and Apple Happy Birthday melody
- **Last.fm Now Playing** — real-time track updates with spinning album art and animated equalizer bars
- **Progressive Web App** — installable (manifest, splash, mask icon); network-first with stale SW/cache cleanup on load
- **Real-time visitor counter** via Firestore + Vercel Analytics (no fake numbers)
- **Consistent Apple-inspired design** — unified border styling, theme awareness, fluid typography across all sections

---

## 🛠 Tech Stack

| Layer               | Technologies                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Frontend**        | Vanilla ES2024, Tailwind CSS v4.0.9, WWDC26 Liquid Glass Design System                                               |
| **Agentic Runtime** | AssistMe + WebMCP + Custom Action Handler with priority execution                                                    |
| **AI**              | OpenRouter (Grok 4.1 Fast / Gemini) + local deterministic actions                                                    |
| **Backend**         | FastAPI v0.136.1 + Pydantic v2 (v2.13.4) (Vercel Serverless)                                                         |
| **Data**            | Cloud Firestore, Supabase (health vitals), GitHub REST, Last.fm, Upstash Redis (optional)                            |
| **Build**           | esbuild v0.28.0 + Sharp v0.34.5 + custom Node pipeline                                                               |
| **Analytics**       | @vercel/analytics v2.0.1                                                                                             |
| **Testing**         | Playwright v1.58.2 (12+ configs), Vitest v4.1.6, @axe-core/playwright v4.11.1, Lighthouse CI                         |
| **Quality**         | ESLint v9.21.0, Stylelint v16.26.1 (config-standard v36.0.1), Prettier v3.8.1, React Doctor v0.5.1, Security Scanner |
| **Hosting**         | Vercel (primary) + GitHub Pages (resilient static fallback)                                                          |
| **Runtime**         | Node.js v22.x, Python v3.12 (uvicorn v0.47.0, httpx v0.28.1, aiofiles v25.1.0)                                       |

---

## 🏗 Architecture

```mermaid
flowchart TD
    subgraph Browser
        UI[WWDC26 Liquid Glass UI + Sound Engine]
        AssistMe[AssistMe + Agentic Action Engine + WebMCP]
        Chat[Streaming Chat + Voice Dictation]
    end

    subgraph Vercel
        FastAPI[FastAPI Router]
        ChatAPI[/chat → OpenRouter/]
        Analytics[/analytics → Firestore/]
        GitHub[/github → Live Intel/]
        Monitor[/monitor → Health/]
        Media[/media → Last.fm/]
    end

    AssistMe --> UI
    Chat --> AssistMe
    Chat -- only if needed --> ChatAPI
    Analytics --> Firestore
    GitHub --> GitHubAPI
    Monitor --> OpenRouter & GitHub & Firestore
    Media --> LastFM
```

**Guiding Principles**:

- Local-first for speed and privacy
- Cloud LLM only for deep reasoning
- Dual deployment surface with absolute fallbacks
- Every change must pass the full quality gate

---

## 🧪 Quality & Testing

| Gate                   | Threshold / Coverage                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **Playwright**         | 12+ real projects (Desktop Chrome/Safari/Firefox/Edge + Pixel 7 + iPhone 14 + iPad Pro) |
| **Accessibility**      | @axe-core/playwright + manual WCAG AA contrast validation                               |
| **Lighthouse Desktop** | Performance ≥80, Accessibility ≥90, Best Practices ≥90, SEO ≥90                         |
| **Lighthouse Mobile**  | Performance ≥60, Accessibility ≥90, Best Practices ≥90, SEO ≥90                         |
| **Post-deploy**        | Smoke + a11y on Vercel **and** GitHub Pages                                             |
| **Nightly monitoring** | Lighthouse on live URLs (desktop ≥70, mobile ≥55; no perf-audit on remote) |
| **Pre-commit**         | Security scan + ESLint                                                                  |

**Key commands**

| Command                         | Purpose                                                 |
| ------------------------------- | ------------------------------------------------------- |
| `npm run check`                 | ESLint + Stylelint + Vitest + Python API tests          |
| `npm run qa:prod-ready`         | Full security + lint + test + E2E + Lighthouse pipeline |
| `npm run qa:smoke`              | Chrome smoke tests against dev server                   |
| `npm run qa:a11y`               | axe-core accessibility baseline                         |
| `npm run qa:lighthouse:desktop` | Desktop Lighthouse gate                                 |
| `npm run qa:lighthouse:mobile`  | Mobile Lighthouse gate                                  |
| `npm run test:e2e:all`          | Complete multi-device Playwright matrix                 |
| `npm run verify:env-parity`     | Compare local `.env` keys against Vercel production       |
| `npm run verify:deploy-sync:remote` | Confirm GitHub Pages and Vercel share the same build commit |
| `node scripts/qa/cross-viewport-chrome.mjs` | Desktop / tablet / mobile Chrome audit with screenshots |

**Local Playwright note:** E2E and Lighthouse scripts prefer system Chrome when available (`CHROME_PATH` override supported). Set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4000` when reusing an already-running dev server.

---

## ⚡ Quick Start

**Requirements:** Node.js 22.x, Python 3.11+ (for the API), optional `uv` for faster pytest runs.

```bash
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive

npm install --no-audit --no-fund

python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env          # Required: OPENROUTER_API_KEY
# Optional: cp .env.example .env.local  # WHOOP, Withings, Supabase, monitor tokens

npm run dev                   # Frontend :4000 + FastAPI :8001
```

| Service  | Local URL                  |
| -------- | -------------------------- |
| Frontend | http://127.0.0.1:4000      |
| FastAPI  | http://127.0.0.1:8001      |
| API docs | http://127.0.0.1:8001/docs |

Production preview after build:

```bash
npm run build
PORT=4174 npm run serve:dist
```

---

## 📁 Project Structure

```
mangeshrautarchive/
├── api/
│   ├── routes/             # chat, github, media, analytics, monitor, integrations
│   ├── integrations/       # WHOOP, Withings, Supabase sync, OAuth token manager
│   └── config.py           # Centralised config + cache TTLs
├── src/
│   ├── index.html          # Main portfolio experience
│   ├── monitor.html        # Public operations dashboard
│   ├── travel.html         # MapLibre travel atlas
│   ├── assets/css/         # Modular CSS (liquid glass + solid theme surfaces)
│   ├── assets/images/      # Responsive WebP assets (home, avatar, graduation, …)
│   └── js/
│       ├── core/           # Bootstrap, chat, config
│       ├── modules/        # Agentic engine, health widget, share sheet, Last.fm, …
│       ├── services/       # Analytics, Markdown, Streaming, Voice
│       └── utils/          # Theme, liquid-glass tokens, navbar, calendly
├── scripts/
│   ├── build/              # esbuild pipeline, image optimization, clean
│   ├── deployment/         # Lighthouse gates, env parity, deploy sync
│   ├── integrations/       # OAuth helpers + Vercel env sync
│   ├── qa/                 # Liquid glass theme matrix + cross-viewport Chrome QA
│   └── utils/              # Dev servers, Playwright runner
├── tests/
│   ├── api/                # pytest suite (health vitals, monitor, integrations)
│   └── e2e/                # Playwright smoke, a11y, post-deploy, visual
├── config/                 # Python/Stylelint/Vulture config
├── deployment/             # Firebase rules and hosting config
└── .github/workflows/      # CI deploy + nightly production monitoring
```

---

## 🔌 Key API Endpoints

```bash
curl https://mangeshraut.pro/api/health
curl https://mangeshraut.pro/api/monitor/status
curl https://mangeshraut.pro/api/analytics/reach
curl https://mangeshraut.pro/api/github/repos/public
curl https://mangeshraut.pro/api/media/music          # Last.fm Now Playing
curl https://mangeshraut.pro/api/health-vitals/summary  # Sanitized WHOOP/Withings summary
```

Full OpenAPI spec available at `/docs` when running the backend locally.

---

## 📅 Recent Updates

### June 2026

- **Mobile & Short-Viewport Polish** — Hero description wrapping, FAB/a11y-toolbar spacing contract, and compact monitor summary layout for phones and short desktop windows.
- **Theme System Default** — Default theme mode is now `system` (OS `prefers-color-scheme`); solar auto mode remains opt-in via `auto`. Tab visibility re-syncs theme when returning from background.
- **CI Speed & Reliability** — Deploy workflows use `npm ci` with lockfile cache and system Chrome for smoke/Lighthouse instead of downloading Playwright browsers on every run.
- **Build Safety** — Cache busting skips external URLs; Lighthouse gate resolves system Chrome on macOS/Linux before falling back to Playwright Chromium.
- **Share Sheet & Accessibility** — Apple-inspired share widget in the accessibility toolbar with High-ECC QR codes, social mirror tabs, and solid theme card surfaces.
- **Health Vitals Sync** — Fixed Withings body-fat measure mapping, WHOOP record selection, and homepage widget parsing for muscle/fat trends.
- **Liquid Glass Controls** — Clear vs tinted glass slider with nav token overrides; solid white/black card surfaces in light/dark themes.
- **Security Hardening** — OAuth connect gating, signed state, monitor API access controls, and session/personalization IDOR fixes.
- **CI & Monitoring** — Stylelint/dead-code fixes, Playwright Chromium for nightly Lighthouse on production URLs, all deploy workflows green.
- **System Monitor** — Runtime snapshot card, integration env parity scripts, and unified Apple premium hover transitions.
- **New Blog Publications** — WWDC 2026 (Apple Intelligence, Siri AI, AFM 3) and NotebookLM 2026 deep-dives; 12 technical writings total.
- **Quality Gates** — React Doctor 100/100; Lighthouse CI thresholds enforced at Performance ≥80 desktop / ≥60 mobile with a11y ≥90 across the board.

---

## 💖 Support & Sponsorship

If you find this project useful or use it as a reference for your own agentic applications, you can support my work via:

- **Stripe**: [![Sponsor via Stripe](https://img.shields.io/badge/Sponsor_via_Stripe-0071e3?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/14A3cufGUgcV5ePfuA14401)
- **PayPal**: [![Sponsor via PayPal](https://img.shields.io/badge/Sponsor_via_PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/ncp/payment/LXNHJ5SUGNP82)

---

## 🗺 Roadmap

- Full WebNN + Gemma client-side inference
- Voice + vision agentic capabilities
- Public documentation of the WebMCP tool registry
- Extraction of reusable liquid glass components into open-source packages

---

## 🤝 Contributing

PRs and ideas are welcome. Please run `npm run check` at minimum; use `npm run qa:prod-ready` before submitting larger changes.

---

## 📄 License

MIT License — see [LICENSE](LICENSE).

---

## 📬 Contact

**Mangesh Raut**

- 🌐 [mangeshraut.pro](https://mangeshraut.pro)
- 💼 [LinkedIn](https://linkedin.com/in/mangeshraut71298)
- 🐙 [GitHub](https://github.com/mangeshraut712)
- ✉️ mbr63@drexel.edu

---

<p align="center">
  <strong>Built with ❤️ — A reference for production-grade agentic web engineering.</strong>
</p>

<p align="center">
  <a href="#mangesh-raut--agentic-full-stack-portfolio">⬆️ Back to Top</a>
</p>
