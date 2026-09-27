# Tests

The release gate uses 182 FastAPI tests and six critical browser journeys. The broader Playwright suite remains available for focused visual and device checks.

| Suite                     | Path                                  | Runner     | Command                     |
| ------------------------- | ------------------------------------- | ---------- | --------------------------- |
| API                       | `tests/api/`                          | pytest     | `npm run test:api`          |
| Critical browser journeys | `tests/e2e/critical-journeys.spec.js` | Playwright | `npm run test:e2e:critical` |
| Full Desktop Chrome suite | `tests/e2e/`                          | Playwright | `npm run test:e2e:chrome`   |
| All browser projects      | `tests/e2e/`                          | Playwright | `npm run test:e2e:all`      |

`npm test` runs the API suite and six critical browser journeys. `npm run check` runs lint and format checks.

Use `tests/e2e/helpers/site.js` for browser navigation so local, Vercel, and GitHub Pages paths work consistently. API tests use FastAPI `TestClient` patterns in `tests/api/`.
