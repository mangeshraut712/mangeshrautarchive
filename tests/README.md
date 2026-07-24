# Tests

| Suite       | Path                 | Runner     | Command                                         | Count (Jul 2026) |
| ----------- | -------------------- | ---------- | ----------------------------------------------- | ---------------- |
| **Unit**    | `tests/unit/`        | Vitest     | `npm test`                                      | 104              |
| **API**     | `tests/api/`         | pytest     | `npm run test:api` (activate `venv` first)      | 122              |
| **E2E**     | `tests/e2e/`         | Playwright | `npm run test:e2e:chrome` / `test:e2e:all`      | 15 projects      |
| **Helpers** | `tests/e2e/helpers/` | —          | Shared `gotoSite`, `PAGES`, GitHub Pages prefix | —                |

## Conventions

- Unit tests import production modules via `../../src/…` (never co-locate `*.test.js` under `src/`).
- Prefer **extensionless** routes in E2E (`/monitor`, `/systems`) — works locally, on Vercel, and on GitHub Pages.
- Use `tests/e2e/helpers/site.js` for navigation instead of duplicating `pathPrefix` logic.
- API tests use FastAPI `TestClient` patterns in `tests/api/`.

## Critical Chrome suite (local)

```bash
# Dev server on :4000 (npm run dev) or let Playwright start it
npx playwright test --project="Desktop Chrome" \
  tests/e2e/smoke.spec.js \
  tests/e2e/accessibility.spec.js \
  tests/e2e/engineering-page.spec.js \
  tests/e2e/apple-platform-audit.spec.js
```
