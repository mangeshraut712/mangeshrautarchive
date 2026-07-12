# Tests

| Suite      | Path            | Runner     | Command                                    |
| ---------- | --------------- | ---------- | ------------------------------------------ |
| **Unit**   | `tests/unit/`   | Vitest     | `npm test`                                 |
| **API**    | `tests/api/`    | pytest     | `npm run test:api` (activate `venv` first) |
| **E2E**    | `tests/e2e/`    | Playwright | `npm run test:e2e:chrome` / `test:e2e:all` |
| **Config** | `tests/config/` | Playwright | included in e2e where wired                |

## Conventions

- Unit tests import production modules with relative paths into `src/…` (e.g. `../../src/js/modules/foo.js`).
- Do **not** co-locate `*.test.js` under `src/` — keep product code free of test files.
- API tests use FastAPI `TestClient` patterns already in `tests/api/`.
- E2E specs target multi-browser projects defined in root `playwright.config.js`.
