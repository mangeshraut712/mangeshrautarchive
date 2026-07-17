# Implementation Plans

Generated / extended by the **improve** skill.

- **Wave 1** (2026-07-12, `915866f2`): plans 001–005 — **all DONE**
- **Wave 2** (2026-07-15, `978494ee`): plans 006–010 — **TODO**

Execute in the order below unless dependencies say otherwise. Each executor: read the plan fully before starting, honor STOP conditions, and update your row when done.

**Verification baseline (recon @ `978494ee`):**

| Check       | Command                                        | Notes                                  |
| ----------- | ---------------------------------------------- | -------------------------------------- |
| Stack guard | `npm run doctor:stack`                         | Vanilla ESM only — no React runtime    |
| Unit        | `npm test`                                     | ~50 Vitest tests                       |
| Lint+unit   | `npm run check`                                | ESLint + Stylelint + Prettier + Vitest |
| API         | `source venv/bin/activate && npm run test:api` | pytest suite                           |
| Security    | `npm run security-check`                       | no leaked secrets                      |
| Node        | 22.x–26.x per `package.json` engines           |                                        |

Runtime: Node 22+ · Python 3.12 · vanilla ES modules + FastAPI · dual host Vercel + GitHub Pages.

## Execution order & status

| Plan | Title                                                               | Priority | Effort | Depends on | Status |
| ---- | ------------------------------------------------------------------- | -------- | ------ | ---------- | ------ |
| 001  | Fix AssistMe host detection, stream timeout, and server-AI recovery | P1       | S      | —          | DONE   |
| 002  | Fail-closed Google Calendar webhook verification                    | P1       | S      | —          | DONE   |
| 003  | Trust platform client IP for rate limits (ignore spoofed XFF)       | P1       | S      | —          | DONE   |
| 004  | Dual-host API base for newsletter (and shared helper)               | P1       | S      | —          | DONE   |
| 005  | Harden Last.fm artwork URLs (no raw URL in innerHTML)               | P1       | S      | —          | DONE   |
| 006  | Sync service worker CACHE_VERSION with ASSET_VER on every deploy    | P1       | S      | —          | DONE   |
| 007  | Durable rate limiting for serverless (replace process memory)       | P1       | M      | —          | TODO   |
| 008  | Shared escapeHtml utility and harden remaining innerHTML sinks      | P2       | M      | —          | TODO   |
| 009  | Characterization tests for critical frontend modules                | P2       | M      | —          | TODO   |
| 010  | Subpage CSS load hygiene (Systems / Monitor / Uses / Travel)        | P2       | M      | —          | DONE   |

Status values: `TODO` | `IN PROGRESS` | `DONE` | `BLOCKED` | `REJECTED`

## Recommended order (wave 2)

1. **006** first — small, high user-visible deploy freshness win; no API risk
2. **009** early — characterization tests de-risk later UI work
3. **008** — security hygiene for HTML sinks
4. **007** — rate limit durability (needs careful env design; memory default must stay green in CI)
5. **010** — CSS load hygiene after UI is characterization-tested

006 / 008 / 009 can parallelize on separate branches.

## Dependency notes

- 007 does not depend on 003 (IP trust already landed) but benefits from it.
- 008 complements DONE 005; do not re-open Last.fm artwork if already fixed — verify before re-touching `lastfm.js`.
- 010 is independent of 006–009 but visual; smoke light/dark after.

## Findings considered and rejected (wave 2 @ `978494ee`)

- **improve-react / React Doctor 100**: Not a React codebase; score is “rules gated off,” not a clean React bill of health. Do not introduce React.
- **GitHub proxy open proxy**: Already allowlisted to `mangeshraut712` paths in `api/routes/github.py` — not re-planned.
- **Full CSS mega-merge (single bundle)**: Still too high cascade risk; 010 is scoped hygiene only.
- **CSP nonce / remove unsafe-inline**: Large dual-host + analytics effort; defer until after 008.
- **God-module split chatbot/bootstrap**: Still needs characterization tests first (009 helps adjacent chrome only).
- **Hard-fail CI when Vercel lags Pages**: Would flake; keep soft dual-host verify.

## Direction (product — not ranked against bugs)

1. **AssistMe offline quality** — richer local portfolio Q&A when OpenRouter is down (product, not security).
2. **Travel atlas progressive enhancement** — map-less list-first mobile path if WebGL/map tiles fail.
3. **Monitor public digests** — weekly “status email” or static JSON snapshot for GH Pages-only visitors.
4. **Uses stack as data** — keep gear list in one JSON consumed by Uses page + chatbot site_knowledge.

## Not audited in depth (wave 2)

- OAuth vault / Supabase RLS
- Full Playwright 15-browser matrix re-run
- Liquid-glass WebGL GPU cost profiling
- Supply-chain Socket.dev beyond `npm audit`
- Uncommitted local React Doctor package.json WIP (operator choice whether to keep)

## Audit table (wave 2 — vetted)

| #   | Finding                                                           | Category      | Impact | Effort | Risk | Evidence                                                         |
| --- | ----------------------------------------------------------------- | ------------- | ------ | ------ | ---- | ---------------------------------------------------------------- |
| 1   | SW cache name stuck on `20260712w` while ASSET_VER is `20260716d` | bug/perf      | HIGH   | S      | LOW  | `src/service-worker.js:6` vs `scripts/build/asset-version.mjs:2` |
| 2   | Rate limits in process memory only                                | security      | HIGH   | M      | MED  | `api/config.py` `rate_limit_store` + serverless multi-isolate    |
| 3   | Duplicated `escapeHtml` / many `innerHTML` sinks                  | security/debt | MED    | M      | MED  | `uses-page.js`, `monitor.html`, modules under `src/js/modules/`  |
| 4   | Thin unit coverage of portfolio chrome                            | tests         | MED    | M      | LOW  | 50 Vitest tests; flyout/nav untested                             |
| 5   | Subpage CSS duplicate/heavy heads                                 | perf/debt     | MED    | M      | MED  | ~60k CSS LOC; multi-link heads on systems/monitor/uses/travel    |
