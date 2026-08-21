# Contributing to mangeshrautarchive

Thank you for your interest in contributing to **mangeshrautarchive**! This repository is an open-source, production-grade agentic full-stack portfolio built with pure Vanilla ESM JavaScript, CSS custom properties, and a Python FastAPI backend.

We welcome contributions from everyone—whether it is fixing a bug, improving accessibility, polishing typography, optimizing performance, or proposing architectural enhancements.

---

## Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) (Contributor Covenant v2.1). Please report any unacceptable behavior to [mbr63@drexel.edu](mailto:mbr63@drexel.edu).

---

## 1. Prerequisites

Before contributing, ensure your development environment meets these version requirements:

- **Node.js**: ≥22.0.0 and <27.0.0 (enforced via `.nvmrc`, `.node-version`, and `package.json`)
- **Python**: 3.12+ (for FastAPI backend and pytest test suite)
- **Git**: 2.30+

```bash
node -v            # must be v22.x.x
python3 --version  # must be 3.12+
```

---

## 2. Quick Setup

1. **Fork and clone the repository:**

   ```bash
   git clone https://github.com/<your-username>/mangeshrautarchive.git
   cd mangeshrautarchive
   ```

2. **Install Node.js dependencies:**

   ```bash
   npm install --no-audit --no-fund
   ```

3. **Set up Python virtual environment:**

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements-dev.txt
   ```

4. **Verify environment readiness:**

   ```bash
   npm run check-node    # Verify Node 22 runtime
   npm run doctor        # Run repo layout and architecture guard
   ```

5. **Start local development servers:**
   ```bash
   npm run dev           # Starts frontend on http://127.0.0.1:4000 and FastAPI on :8001
   ```

---

## 3. Architecture & Code Conventions

### JavaScript (Vanilla ESM)

- **No UI framework runtimes**: This repository strictly does not use React, Next.js, Vue, Angular, or Svelte runtime dependencies.
- **ES Modules**: Use standard ES modules with explicit `.js` extensions on all relative imports (`import { foo } from "./utils.js"`).
- **Formatting**: 2 spaces indent, single quotes, semicolons, 100-character print width (enforced via Prettier & ESLint).

### CSS (Vanilla & Apple HIG Tokens)

- **CSS Custom Properties**: Use centralized design tokens (`var(--apple-blue)`, `var(--apple-surface)`, etc.) from `src/assets/css/`.
- **Solid Surfaces**: Respect high-contrast solid white (`#ffffff`) in light mode and solid black (`#000000`) in dark mode.
- **Zero Tailwind in HTML**: Tailwind CSS v4 generates an auxiliary utility stylesheet; never place utility classes directly in HTML markup.

### Python (FastAPI Backend)

- **FastAPI with Pydantic v2**: Type annotations on all route parameters and models.
- **Style**: 4 spaces indent, 120-character line limit (enforced via flake8 and vulture dead-code scanner).
- **Routes**: Modular route handlers located under `api/routes/`.

---

## 4. Testing & Quality Gates

Every pull request must pass the full quality matrix:

```bash
# 1. Full automated quality check
npm run check             # ESLint + Stylelint + Prettier + 172 Vitest unit tests

# 2. Python API test suite
npm run test:api          # 166 pytest API endpoint & middleware tests

# 3. Codebase health & secret scanning
npm run doctor            # Root layout & framework dependency guard
npm run security-check    # Scans for exposed API keys or secrets

# 4. Production build verification
npm run build             # Production bundle compilation to dist/

# 5. Playwright E2E browser tests (optional locally, runs in CI)
npm run test:e2e:chrome   # Desktop Chrome smoke & a11y tests
```

---

## 5. Submitting a Pull Request

1. **Create a topic branch:**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes with focused, atomic commits:**
   - Commit message convention: `type(scope): description`
   - Examples:
     - `feat(monitor): add latency distribution sparkline`
     - `fix(a11y): improve color contrast ratio on tag chips`
     - `docs(readme): clarify Node 22 setup instructions`

3. **Update the Changelog:**
   - If shipping features or fixes, add a typed entry to `src/js/data/changelog-entries.js`.

4. **Verify quality gates locally:**

   ```bash
   npm run check && npm run test:api && npm run doctor && npm run security-check && npm run build
   ```

5. **Push and open a Pull Request:**
   - Push your branch to GitHub and open a PR against the `main` branch.
   - Complete the Pull Request template checklist.

---

## 6. License & Intellectual Property

By contributing to this repository, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
