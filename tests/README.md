# Tests

The primary release gate uses the FastAPI test suite (218 tests), the Cloudflare Worker test suite (69 tests), frontend unit checks (67 tests), and twenty critical Playwright browser journeys on Desktop Chrome. Deterministic user journeys are additionally verified across desktop Chromium and mobile WebKit via Tester Army (`e2e`). The broader Playwright suite remains available for multi-browser and device checks.

| Suite                     | Path                                                                                                  | Runner     | Command                       | Coverage                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | ---------- | ----------------------------- | -------------------------------------------------------------------------- |
| API                       | `tests/api/`                                                                                          | pytest     | `npm run test:api`            | 218 tests — FastAPI routes, streaming, OAuth, health probes, middleware    |
| Worker                    | `tests/worker/`                                                                                       | Node test  | `npm run test:worker`         | 69 tests — edge routing, streams, durable uptime and incident transitions  |
| Unit                      | `tests/unit/`                                                                                         | Node test  | `npm run test:unit`           | 67 tests — blog escaping, chart rendering, published surfaces, sync logic  |
| Critical browser journeys | `tests/e2e/critical-journeys.spec.js`, `chatbot-connectivity.spec.js`, `frontend-regressions.spec.js` | Playwright | `npm run test:e2e:critical`   | 20 critical user journeys on Desktop Chrome                                |
| Tester Army journeys      | `tests/tester-army/`                                                                                  | `e2e`      | `npm run test:tester-army`    | 23 journeys on desktop Chromium + mobile WebKit (46 checks total)          |
| Tester Army (CI)          | `tests/tester-army/`                                                                                  | `e2e`      | `npm run test:tester-army:ci` | 23 deterministic journeys on desktop Chromium (release gate in deploy.yml) |
| Full Desktop Chrome suite | `tests/e2e/`                                                                                          | Playwright | `npm run test:e2e:chrome`     | Desktop Chrome browser tests                                               |
| All browser projects      | `tests/e2e/`                                                                                          | Playwright | `npm run test:e2e:all`        | 16 browser projects (Desktop Safari, Firefox, Edge, Mobile WebKit, Chrome) |

`npm test` runs the API suite, worker tests, unit tests, and critical Playwright journeys (`npm run test:api && npm run test:worker && npm run test:unit && npm run test:e2e:critical`). `npm run check` runs ESLint, Stylelint, and Prettier checks.

Use `tests/e2e/helpers/site.js` for browser navigation so local, Vercel, and GitHub Pages paths work consistently. See [docs/TESTER_ARMY.md](../docs/TESTER_ARMY.md) for Tester Army journey boundaries and coverage assertions.

The November 10, 2026 suite inventory is a dated snapshot. Test output is authoritative when cases change. The six new unit cases cover analytics destination spoofing and fixed-origin API proxy URL construction. Run `npm test` plus `npm run test:tester-army:ci` for the release gate. The full 16-project browser suite is broader and must not be implied by a critical-only pass.

Local safety coverage checks non-local DB rejection, secret-safe diagnostics, blocked external DNS, filtered credentials, dry-run preservation, and symlink/escape refusal. All default test commands use the isolated runner. Notification quota tests use mocked providers; the production SQL migration was not executed.
