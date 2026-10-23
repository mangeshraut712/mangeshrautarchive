# Tests

The primary release gate uses the FastAPI test suite (191 tests), the Cloudflare Worker test suite (12 tests), frontend unit checks, and fifteen critical Playwright browser journeys on Desktop Chrome. Deterministic user journeys are additionally verified across desktop Chromium and mobile WebKit via Tester Army (`e2e`). The broader Playwright suite remains available for multi-browser and device checks.

| Suite                     | Path                                                          | Runner     | Command                       | Coverage                                                                   |
| ------------------------- | ------------------------------------------------------------- | ---------- | ----------------------------- | -------------------------------------------------------------------------- |
| API                       | `tests/api/`                                                  | pytest     | `npm run test:api`            | 191 tests — FastAPI routes, streaming, OAuth, health probes, middleware    |
| Worker                    | `tests/worker/`                                               | Node test  | `npm run test:worker`         | 12 tests — edge routing, CORS, multimodal routing, and streams             |
| Unit                      | `tests/unit/`                                                 | Node test  | `npm run test:unit`           | Blog HTML escaping and AssistMe chart rendering                            |
| Critical browser journeys | `tests/e2e/critical-journeys.spec.js`, `chatbot-connectivity` | Playwright | `npm run test:e2e:critical`   | 15 critical user journeys on Desktop Chrome                                |
| Tester Army journeys      | `tests/tester-army/`                                          | `e2e`      | `npm run test:tester-army`    | 23 journeys on desktop Chromium + mobile WebKit (46 checks total)          |
| Tester Army (CI)          | `tests/tester-army/`                                          | `e2e`      | `npm run test:tester-army:ci` | 23 deterministic journeys on desktop Chromium (release gate in deploy.yml) |
| Full Desktop Chrome suite | `tests/e2e/`                                                  | Playwright | `npm run test:e2e:chrome`     | Desktop Chrome browser tests                                               |
| All browser projects      | `tests/e2e/`                                                  | Playwright | `npm run test:e2e:all`        | 16 browser projects (Desktop Safari, Firefox, Edge, Mobile WebKit, Chrome) |

`npm test` runs the API suite, worker tests, unit tests, and critical Playwright journeys (`npm run test:api && npm run test:worker && npm run test:unit && npm run test:e2e:critical`). `npm run check` runs ESLint, Stylelint, and Prettier checks.

Use `tests/e2e/helpers/site.js` for browser navigation so local, Vercel, and GitHub Pages paths work consistently. See [docs/TESTER_ARMY.md](../docs/TESTER_ARMY.md) for Tester Army journey boundaries and coverage assertions.
