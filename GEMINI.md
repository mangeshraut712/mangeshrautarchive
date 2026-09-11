# GEMINI.md — Project Developer & Agent Rules

> **Project:** mangeshrautarchive (Mangesh Raut Portfolio & Agentic Platform)  
> **Version:** 2026.1  
> **Standard:** Google Antigravity & Linux Foundation AGENTS.md

---

## 🛑 Project Directives (Non-Negotiable)

1. **Zero UI Framework Runtime:**
   - Pure Vanilla HTML5, CSS custom properties, and native ES modules (`src/`).
   - Never install, import, or introduce React, Next.js, Vue, Angular, or Svelte runtime dependencies.
2. **Apple HIG Design Standards:**
   - High-contrast solid canvas (`#ffffff` light, `#000000` dark) per [docs/DESIGN.md](docs/DESIGN.md).
   - Vibrant Apple Blue (`#0071e3`) gradient with specular shine animation.
   - Zero horizontal overflow (`document.documentElement.scrollWidth - window.innerWidth <= 2px`) on all viewports.
3. **Environment & Runtime:**
   - Node.js ≥22 (see `.nvmrc`).
   - Python 3.12+ in `./venv` with FastAPI for serverless functions and local dev.
4. **Active Model Check & Observability:**
   - Explicitly record the active AI model name, purpose, and metrics in `src/js/data/changelog-entries.js` and Git commit bodies.

---

## 🏛️ Software Engineering Best Practices for Long-Term Success

All developers and autonomous AI agents working in this repository must implement and preserve these 14 principles (see full specification in [docs/BEST_PRACTICES.md](docs/BEST_PRACTICES.md)):

1. **Explicit Architecture:** Maintain clear boundaries between Presentation (`src/`), Edge/API (`api/`), and Tooling (`scripts/`).
2. **Loosely Coupled Modules:** Decouple components with single responsibilities; keep state changes localized.
3. **Design for Growth:** Build stateless serverless compute, stable Pydantic schemas, and horizontal scalability.
4. **Self-Documenting Naming:** Use descriptive identifiers (`hasActiveStreamingSession`, `assertNoHorizontalOverflow`); reserve comments for rationale.
5. **Simple Control Flow:** Prefer early returns, guard clauses, and transparent logic over clever, dense constructs.
6. **Small, Single-Purpose Functions:** Keep functions under 50 lines with focused single responsibilities.
7. **Enforced Code Standards:** Enforce zero-tolerance linting and formatting via ESLint, Stylelint, Prettier, and flake8.
8. **Documented Invariants & APIs:** Keep [docs/STRUCTURE.md](docs/STRUCTURE.md), [docs/API.md](docs/API.md), and [docs/DESIGN.md](docs/DESIGN.md) synchronized.
9. **First-Class Automated Testing:** Maintain 100% passing tests (242 Vitest, 175 pytest, 16-browser Playwright matrix).
10. **Continuous Refactoring:** Prune dead code, consolidate design tokens, and streamline without behavior regressions.
11. **Intentional Debt Paydown:** Actively track, document, and remediate technical debt; never let shortcuts become permanent architecture.
12. **Reviewable Git History:** Write conventional commits (`type(scope): description`) with bisectable history.
13. **Rigorous Code Reviews:** Enforce automated quality gates before any code merges to `main`.
14. **Fully Automated CI/CD:** Build, test, audit Lighthouse (100/100/100/100), and deploy exclusively through GitHub Actions.

---

## 🛠️ Mandatory Quality Gate Verification

Before finalizing any task or pushing to `main`, always run:

```bash
# 1. Full Check Gate (ESLint + Stylelint + Prettier + 242 Vitest Tests)
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/Cellar/node@22/22.23.2/bin:$PATH" && npm run check

# 2. Security Check & Production Bundle Build
npm run security-check && npm run build

# 3. Python API Test Suite (175 pytest tests)
source venv/bin/activate && npm run test:api

# 4. CI/CD Pipeline Monitoring
git push origin main && gh run list --limit 3
```
