# Tests

The primary release gate uses the FastAPI test suite (185 tests), the Cloudflare Worker test suite (10 tests), and fourteen critical Playwright browser journeys on Desktop Chrome. Deterministic user journeys are additionally verified across desktop Chromium and mobile WebKit via Tester Army (`e2e`). The broader Playwright suite remains available for multi-browser and device checks.

| Suite                     | Path                                                          | Runner     | Command                       | Coverage                                                                   |
| ------------------------- | ------------------------------------------------------------- | ---------- | ----------------------------- | -------------------------------------------------------------------------- |
| API                       | `tests/api/`                                                  | pytest     | `npm run test:api`            | 185 tests — FastAPI routes, streaming, OAuth, health probes, middleware    |
| Worker                    | `tests/worker/`                                               | Node test  | `npm run test:worker`         | 10 tests — edge routing, multimodal routing, and stream boundaries         |
| Critical browser journeys | `tests/e2e/critical-journeys.spec.js`, `chatbot-connectivity` | Playwright | `npm run test:e2e:critical`   | 14 critical user journeys on Desktop Chrome                                |
| Tester Army journeys      | `tests/tester-army/`                                          | `e2e`      | `npm run test:tester-army`    | 23 journeys on desktop Chromium + mobile WebKit (46 checks total)          |
| Tester Army (CI)          | `tests/tester-army/`                                          | `e2e`      | `npm run test:tester-army:ci` | 23 deterministic journeys on desktop Chromium (release gate in deploy.yml) |
| Full Desktop Chrome suite | `tests/e2e/`                                                  | Playwright | `npm run test:e2e:chrome`     | Desktop Chrome browser tests                                               |
| All browser projects      | `tests/e2e/`                                                  | Playwright | `npm run test:e2e:all`        | 16 browser projects (Desktop Safari, Firefox, Edge, Mobile WebKit, Chrome) |

`npm test` runs the API suite, worker tests, and critical Playwright journeys (`npm run test:api && npm run test:worker && npm run test:e2e:critical`). `npm run check` runs ESLint, Stylelint, and Prettier checks.

Use `tests/e2e/helpers/site.js` for browser navigation so local, Vercel, and GitHub Pages paths work consistently. See [docs/TESTER_ARMY.md](../docs/TESTER_ARMY.md) for Tester Army journey boundaries and coverage assertions.
