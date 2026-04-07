<div align="center">

# Mangesh Raut

### Software Engineer & AI-Powered Portfolio

[![Live](https://img.shields.io/badge/🌐_Live-mangeshraut.pro-0071e3?style=for-the-badge)](https://mangeshraut.pro)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github)](https://github.com/mangeshraut712)

</div>

---

## Overview

A next-generation developer portfolio featuring an intelligent AI assistant, live GitHub integration, and a premium glassmorphism UI design inspired by Apple's 2026 design language.

**Live Demo:** [mangeshraut.pro](https://mangeshraut.pro)

---

## Key Features

### AssistMe — AI Assistant

- Real-time streaming responses with conversation memory
- Voice input/output via Web Speech API
- Agentic actions: theme toggle, navigation, resume download
- Privacy dashboard with full data control
- Offline fallback mode

### Debug Runner — Canvas Game

- 60 FPS HTML5 Canvas arcade game
- Mobile touch controls with progressive difficulty
- Local storage high scores

### Live GitHub Integration

- Auto-updating repository showcase
- Real-time statistics (stars, forks, commits)
- Fuzzy search with typo tolerance
- 10-minute intelligent caching

### Design System

- **Apple 2026 Glassmorphism** — Backdrop blur, oklch() colors, GPU animations
- **Container Queries** — Component-level responsive design
- **WCAG 2.2 AA** — Full keyboard accessibility
- **Performance First** — Lazy loading, code splitting, edge CDN

---

## Tech Stack

**Frontend:** HTML5, CSS3 (30+ modular stylesheets), JavaScript ES2024+, Tailwind CSS 4.x, Prism.js, Font Awesome

**Backend:** Python 3.12+, FastAPI, Uvicorn, httpx, Pydantic

**AI:** OpenRouter API (Grok 4.1 Fast default, Claude 3.5 Sonnet alternate), Streaming NDJSON

**DevOps:** Docker, GitHub Actions, Vercel Edge

---

## Quick Start

```bash
# Clone and setup
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive
npm ci
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add OPENROUTER_API_KEY for AI features

# Start development
npm run dev          # Frontend: 3000, Backend: 8000
npm run dev:frontend # Frontend only
npm run dev:backend  # Backend only
```

---

## Project Structure

```
mangeshrautarchive/
├── api/              # FastAPI backend + serverless handlers
├── src/
│   ├── assets/       # CSS, images, files
│   └── js/
│       ├── core/     # Bootstrap + orchestration
│       ├── modules/  # Feature modules
│       ├── services/ # Shared runtime services
│       ├── components/ # UI components
│       └── utils/    # Helpers
├── scripts/          # Build/dev/QA scripts
├── tests/e2e/        # Playwright tests
├── docs/             # Documentation
│   ├── PROJECT_STRUCTURE.md
│   └── testing/      # QA runbooks
└── .github/workflows/# CI/CD
```

**Structure Rules:**

- Startup wiring: `src/js/core/bootstrap.js`
- Product behavior: `src/js/modules/*`
- Shared primitives: `src/js/services/*`
- Generated output: Keep out of commits

---

## Documentation

- [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) — Source layout and ownership
- [`docs/testing/CHROME_QA_RUNBOOK.md`](docs/testing/CHROME_QA_RUNBOOK.md) — Release verification
- [`docs/testing/CHROME_TEST_MATRIX.md`](docs/testing/CHROME_TEST_MATRIX.md) — Checklist
- [`docs/testing/RELEASE_TEST_REPORT_TEMPLATE.md`](docs/testing/RELEASE_TEST_REPORT_TEMPLATE.md) — Sign-off template
- [`docs/testing/POST_DEPLOYMENT_FEEDBACK_LOOP.md`](docs/testing/POST_DEPLOYMENT_FEEDBACK_LOOP.md) — Triage loop

---

## Scripts

| Command                    | Description       |
| -------------------------- | ----------------- |
| `npm run dev`              | Start full stack  |
| `npm run build`            | Production build  |
| `npm run lint`             | ESLint checks     |
| `npm run lint:css`         | Stylelint         |
| `npm run format`           | Prettier format   |
| `npm run test`             | Vitest suite      |
| `npm run test:e2e:chrome`  | Playwright smoke  |
| `npm run test:a11y:chrome` | Axe accessibility |
| `npm run qa:chrome`        | Full QA gate      |
| `npm run qa:prod-ready`    | Pre-release gate  |
| `npm run security-check`   | Secret scanning   |
| `npm run clean`            | Remove artifacts  |

---

## Quality Gates

Release readiness validated by executable gates:

```bash
npm run qa:smoke           # Smoke tests
npm run qa:a11y            # Accessibility
npm run qa:lighthouse:desktop  # Desktop perf
npm run qa:lighthouse:mobile   # Mobile perf
npm run qa:chrome          # Full QA
npm run qa:prod-ready      # Pre-release
```

**Lighthouse Floors:**

- Desktop: Perf ≥88, A11y/Best Practices/SEO ≥90
- Mobile: Perf ≥60, A11y/Best Practices/SEO ≥90

---

## Performance Practices

- ✅ Lazy loading for images and components
- ✅ Modular JavaScript with code splitting
- ✅ WebP images, minified CSS/JS
- ✅ Edge CDN delivery
- ✅ Service worker with cache-first strategy
- ✅ Zero layout shift with proper dimensions

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

**Guidelines:**

- Run `npm run lint:fix` before committing
- Write clear commit messages
- Update docs for new features

---

## License

MIT License — see [LICENSE](LICENSE)

You're free to use this code for your portfolio. Please:

- Give appropriate credit
- Don't claim as entirely your own work
- Modify to make it unique

---

## Connect

**Mangesh Raut** — Software Engineer @ Customized Energy Solutions

- 🌐 [Portfolio](https://mangeshraut.pro)
- 💼 [LinkedIn](https://linkedin.com/in/mangeshraut71298)
- 🐙 [GitHub](https://github.com/mangeshraut712)
- 📧 [Email](mailto:mbr63@drexel.edu)

**Location:** Philadelphia, PA, USA

---

<div align="center">

⭐ If you found this project helpful, please give it a star!

**© 2026 Mangesh Raut — Built with ❤️ in Philadelphia**

</div>
