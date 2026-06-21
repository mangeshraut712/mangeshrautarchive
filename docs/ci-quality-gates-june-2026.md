# CI & Quality Gates — June 2026

This document tracks the active quality pipeline for `mangeshrautarchive` as of June 2026.

## Workflows

| Workflow | Trigger | Blocking? |
| -------- | ------- | --------- |
| [`deploy.yml`](../.github/workflows/deploy.yml) | Push/PR to `main`, manual | Yes (quality + deploy) |
| [`post-deploy-monitoring.yml`](../.github/workflows/post-deploy-monitoring.yml) | Daily 14:00 UTC, manual | Yes (production checks) |

## `deploy.yml` gate order

1. `npm audit --audit-level=high`
2. `npm run security-check`
3. `npm run lint` / `npm run lint:css`
4. `npm test` (Vitest)
5. `npm run doctor:full` (React Doctor — informational, non-blocking)
6. Python flake8 + dead-code scan + `npm run test:api`
7. `npm run qa:browser:ci` (Playwright smoke + axe-core)
8. `npm run qa:lighthouse:ci` (dist desktop + mobile thresholds)
9. Build → GitHub Pages deploy → live commit verification

## Lighthouse thresholds

| Surface | Performance | Accessibility | Best Practices | SEO |
| ------- | ----------- | ------------- | -------------- | --- |
| CI dist gate (desktop) | ≥ 80 | ≥ 90 | ≥ 90 | ≥ 90 |
| CI dist gate (mobile) | ≥ 60 | ≥ 90 | ≥ 90 | ≥ 90 |
| Nightly production (Vercel) | ≥ 70 | ≥ 90 | ≥ 90 | ≥ 90 |
| Nightly production (mobile) | ≥ 55 | ≥ 90 | ≥ 90 | ≥ 90 |

Local verification (June 2026): `npm run qa:lighthouse:ci` reached **100/100** on all four categories for both desktop and mobile against `dist/`.

## Accessibility

- Homepage axe baseline: zero **critical** or **serious** violations (`tests/e2e/accessibility.spec.js`).
- Currently tabs use valid `role="tablist"` / `role="tab"` / `role="tabpanel"` wiring.

## React Doctor & React Review

- **React Doctor** (`npm run doctor:full`) scans the static React dependency graph via `src/js/entry.js`. Score is tracked in CI for regression awareness; the portfolio runtime is primarily vanilla JS modules loaded through `bootstrap.js`.
- **React Review** (`.reactreviewrc.json`) documents dynamic-import modules that static analysis cannot reach.

## Nightly monitoring

Production workflow checks:

1. Reachability of Vercel + GitHub Pages + health API
2. Lighthouse on `https://mangeshraut.pro/`
3. Cross-surface commit parity (`--parity`) between GitHub Pages and Vercel production `build-config.json`

## Local prod-ready command

```bash
npm run qa:prod-ready
```

Runs security, lint, unit/API tests, browser smoke, axe, and Lighthouse in one pipeline.
