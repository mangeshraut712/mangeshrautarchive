# Tester Army portfolio coverage

Upstream: https://github.com/tester-army/e2e. Official bundled references live in
`node_modules/e2e/docs`. Versions are pinned: `e2e` 0.16.0 and `@e2e-dev/web` 0.11.2.

Commands: `npm run test:tester-army:list`, `npm run test:tester-army`.
Each of 23 tests runs on desktop Chromium (1440 × 900) and mobile WebKit (375 × 812).
The runner manages a frontend server on a free port; `E2E_APP_URL` selects an existing server.
Reports/cache are ignored under `.e2e`; anonymous CLI telemetry is disabled by the npm scripts.

| Flow                                                        | Outcome asserted                                                                 |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Systems, monitor, travel, uses, changelog, 404, offline (7) | Visible main content and heading (travel uses its responsive search field)       |
| Writing archive                                             | 17 nonfeatured articles and navigation to a full article with section navigation |
| Repository preview                                          | Open and close the actual preview dialog                                         |
| Contact save                                                | Simulated successful persistence renders the success message                     |
| Contact validation                                          | Empty submission remains invalid and sends no request                            |
| Chat                                                        | Simulated NDJSON response renders an answer                                      |
| Share                                                       | Dialog presents LinkedIn URL and can close                                       |
| Calendar                                                    | Expand from three to six clocks and collapse                                     |
| Contact rejection                                           | 503 response keeps draft for retry                                               |
| Travel search                                               | No-result state resets and Pune filter returns two stops                         |
| Mobile navigation                                           | Escape closes menu and restores focus                                            |
| Share keyboard                                              | Escape closes dialog and restores opener focus                                   |
| Reminder                                                    | Create, edit and complete a browser-local reminder                               |
| Changelog                                                   | Select fixes and reset to all entries                                            |
| Travel error                                                | Failed map download exposes retry and retains places list                        |

This is a manifest of implemented assertions, not exhaustive coverage of every application state.
Contact persistence and chat generation use request interception, so these tests do not establish
live provider reliability. External social sharing, native share sheets, clipboard permissions,
OAuth, map provider rendering, audio/video playback, live monitoring, and real calendar sync
are outside this deterministic suite. The existing API, Worker and broad Playwright suites remain
available; `npm test` retains their critical regression gate.

Optional agent steps require a chosen provider and its authentication. No credentials or model
subscription are installed by this integration. Deterministic tests need neither. User-requested
Sol 6.1 handles implementation; Luna 6 performs independent verification through Codex agents.

## Additional existing coverage

`npm test` executes 185 API checks, 10 Worker checks, and 14 critical Playwright journeys.
The critical journeys include chat failed-connection draft recovery, multilingual/composition
input protection, image/audio/video/PDF attachment submission, accessibility, mobile overflow,
menu focus handling, blog navigation, repository illustrations, contact clocks, stale Panchang,
and imported event behavior. API/Worker fixtures validate protocols without live provider guarantees.

`tests/e2e/engineering-page.spec.js` and `tests/e2e/smoke.spec.js` cover Systems evidence/case-study
links, Uses tools/quality gates, Monitor service/security/deployment actions, command palette,
resume choice, navigation, music state and travel filters. Execution status must be taken from
the current run, not inferred from their presence.

Request routing uses the supported `headers` engine option to block service workers for
mocked API tests. The offline page check verifies its rendered message; it does not simulate
loss of connectivity or validate service-worker caching.

Additional chat tests simulate a connection failure and verify draft recovery, and cancel a
pending generation through Stop. These isolate the UI recovery paths from provider uptime.

Remaining local feature gaps: the product offers no reminder delete control; the new suite
checks create/edit/complete. Real offline service-worker interaction is not covered by Tester Army. Third-party credential/provider flows require separate live verification.

The deployment workflow also runs `npm run test:tester-army:ci` (desktop Chromium) against its
already-started production server, after the existing critical Playwright gate. The full local
command includes mobile WebKit. CI publication has not been performed by this change.
