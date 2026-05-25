# Mangesh Raut | Agentic Full-Stack Portfolio

<p align="center">
  <a href="https://mangeshraut.pro"><img alt="Live Site" src="https://img.shields.io/badge/live-mangeshraut.pro-0071e3?style=for-the-badge&logo=vercel&logoColor=white"></a>
  <a href="https://github.com/mangeshraut712/mangeshrautarchive/actions"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/mangeshraut712/mangeshrautarchive/deploy.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/mangeshraut712/mangeshrautarchive?style=for-the-badge"></a>
</p>

**Live Agentic Portfolio** at [mangeshraut.pro](https://mangeshraut.pro) — AI-first web platform featuring deterministic client-side tool calling, streaming cloud intelligence, and enterprise-grade quality gates.

---

## Live Demos

| Feature | URL | Try This |
|---------|-----|----------|
| **Main Portfolio** | [mangeshraut.pro](https://mangeshraut.pro) | Agentic chat, spatial projects, travel atlas |
| **System Monitor** | [mangeshraut.pro/monitor](https://mangeshraut.pro/monitor) | Live latency, health checks, API status |
| **Travel Atlas** | [mangeshraut.pro/travel](https://mangeshraut.pro/travel) | Interactive world map with photo memories |
| **Fallback** | [GitHub Pages](https://mangeshraut712.github.io/mangeshrautarchive) | Static deployment with API proxying |
| **AI Chat** | Click chat icon on site | Try: "download resume", "go to projects", "toggle dark mode" |

---

## Key Features

### Agentic AI System
- **9 WebMCP Tools**: Navigate sections, download resume, schedule meetings, filter projects, toggle themes, copy contact info, search portfolio, open social media — all executed instantly in-browser
- **Hybrid Intelligence**: Local actions (zero latency) + OpenRouter Gemini 2.5 streaming for complex reasoning
- **Visual Feedback**: Real-time "ACTION EXECUTED" confirmations with streaming Markdown responses

### Apple-Inspired Premium UX
- Spatial project cards with glassmorphism and micro-animations
- Live GitHub intelligence: release metadata, commits-since-release, language breakdowns
- Real-time visitor reach counter (Firestore + Vercel Analytics)
- PWA with offline support and service worker caching

### Enterprise Quality Gates
- **Testing**: Playwright 1.58 across 12+ browser/device configs (Chrome, Safari, Firefox, Edge, Pixel 7, iPhone 14, iPad Pro)
- **Performance**: Lighthouse CI gates (Desktop ≥95, Mobile ≥90)
- **Security**: Pre-commit scanning, dependency auditing, secret detection
- **Accessibility**: axe-core validation, WCAG AA compliant

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla ES2024, Tailwind CSS 4, Apple Design System |
| **Agentic** | WebMCP Tool Registry, Custom Action Engine |
| **AI** | OpenRouter + Gemini 2.5, Streaming Markdown |
| **Backend** | FastAPI 0.136, Pydantic v2, Vercel Serverless |
| **Data** | Cloud Firestore, GitHub API, Vercel Analytics |
| **Build** | esbuild, Sharp, Tailwind CLI 4, Node 22 |
| **Testing** | Playwright 1.58, Vitest 4, Lighthouse CI |
| **Hosting** | Vercel (Primary) + GitHub Pages (Fallback) |

---

## Quick Start

```bash
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive

npm install --no-audit --no-fund

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # Add OPENROUTER_API_KEY
npm run dev
```

**Local**: Frontend at http://127.0.0.1:4000, API at http://127.0.0.1:8001

### Essential Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Concurrent frontend + FastAPI with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run qa:prod-ready` | Full validation (security + lint + test + E2E + Lighthouse) |
| `npm run test:e2e:all` | Complete Playwright matrix |
| `npm run lint:dead-code` | Ruff + Vulture analysis |

---

## Architecture

```
Browser (Vanilla + WebMCP Tools)
    ↓ Local actions (instant)
    ↓ Cloud fallback → Vercel FastAPI → OpenRouter / Firestore / GitHub
```

**Design Principles**:
- Local-first for instant, private interactions
- Cloud LLM only for reasoning depth
- Dual-surface deployment (Vercel + GitHub Pages fallback)
- Zero-downtime atomic deploys with post-deploy verification

---

## Project Structure

```
mangeshrautarchive/
├── api/                    # FastAPI backend
├── src/                    # Frontend source
│   ├── index.html          # Main portfolio
│   ├── monitor.html        # Ops dashboard
│   ├── travel.html         # Travel atlas
│   ├── js/                 # ES modules (chat, agentic, projects)
│   └── assets/             # CSS, images, service-worker
├── scripts/                # Build, deploy, QA tooling
├── tests/e2e/              # Playwright suites
└── .github/workflows/      # CI/CD
```

---

## API Endpoints

```bash
# Health & service status
curl https://mangeshraut.pro/api/health

# Live visitor reach (Firestore + GitHub)
curl https://mangeshraut.pro/api/analytics/reach

# GitHub project intelligence
curl https://mangeshraut.pro/api/github/repos/public
```

---

## License & Contact

MIT License — see [LICENSE](LICENSE)

**Mangesh Raut**
- 🌐 [mangeshraut.pro](https://mangeshraut.pro)
- 💼 [LinkedIn](https://linkedin.com/in/mangeshraut71298)
- 🐙 [GitHub](https://github.com/mangeshraut712)
- ✉️ mbr63@drexel.edu

---

<p align="center">
  <sub>Built with ❤️ — Agentic Web, done right.</sub>
</p>
