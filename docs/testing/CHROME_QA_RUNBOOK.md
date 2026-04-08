# Chrome QA Runbook

This runbook defines the Chrome-focused release gate used to declare the portfolio production‑ready.

## 1. Setup Phase (Chrome Environment)

### 1.1 Environments

- **Local**: used for fast development checks only.
  - Run app locally: `npm run dev` (or `npm run dev:frontend` for frontend-only).
  - Do not use local for final release sign-off.
- **Staging**: production‑like environment used for all formal QA and release decisions.
  - Same build flags as production.
  - Same CDN configuration and caching headers as production, where possible.
  - Target for `qa:chrome` and full release gate.
- **Production**: live portfolio served via GitHub Pages / primary domain.
  - Protected by controlled rollout (GitHub Pages deploy + post‑deploy validation + scheduled monitoring).
  - Previous production artifact/tag must remain immediately redeployable for rollback.

### 1.2 Chrome version policy

- **Primary sign‑off browser**: Google Chrome **Stable** on desktop.
  - Example baseline for this runbook on **February 27, 2026**: `145.0.7632.117`.
- **Automation engine**: Playwright Chromium `145.0.7632.6` (`@playwright/test` `1.58.2`).
- **Secondary compatibility**: latest **Chrome Beta** (desktop).
  - Run quick sanity checks (homepage load, nav, contact/chat, Lighthouse smoke) on each release week.
- **Mobile coverage**:
  - Chrome on Android on a real device for at least the homepage + critical flows.
  - Chrome DevTools device emulation for additional viewport checks.

Pin the **exact Chrome versions** used for each release in the release report.

### 1.3 Local setup

1. Install dependencies: `npm ci`
2. Install Playwright Chromium: `npx playwright install chromium`
3. Start frontend: `npm run dev:frontend`
4. Optional full-stack run: `npm run dev`

Use **local** for rapid iteration; all final sign‑off must be on **staging** with a production‑like build.

### 1.4 Chrome setup and profiles

- **Clean profile** (no extensions):
  - Use for performance and security validation.
  - Validate Lighthouse scores, Core Web Vitals, and security headers.
- **QA profile**:
  - Can include `axe DevTools` and other debugging tools.
  - Use for exploratory testing and accessibility/usability audits.

### 1.5 DevTools configuration

For both desktop and emulated mobile runs:

- Enable **Disable cache** while DevTools is open.
- Use **Network throttling presets** (e.g., Fast 3G/Slow 4G) when validating perf and CWV‑sensitive flows.
- Use **CPU throttling presets** (e.g., 4× slowdown) to approximate lower‑end hardware.
- Use **Device toolbar** for viewport testing at key breakpoints and Chrome on Android parity.

### 1.6 Recommended tools and extensions

- CI uses **CLI‑based checks** (Playwright, Lighthouse, axe‑core), so no extensions are required.
- Recommended for manual deep‑dive:
  - `axe DevTools` extension for in‑browser accessibility analysis.
  - `Lighthouse` extension (optional, to visually mirror CLI audits).
  - `ModHeader` (optional) for validating security headers and CSP behavior when needed.

## 2. Testing Phase (Checklist + Cases + Tools)

Primary checklist and critical cases are maintained in:

- `docs/testing/CHROME_TEST_MATRIX.md`

### Automated gates

- Smoke (functional): `npm run qa:smoke`
- Accessibility baseline: `npm run qa:a11y`
- Lighthouse desktop: `npm run qa:lighthouse:desktop`
- Lighthouse mobile: `npm run qa:lighthouse:mobile`
- Full gate: `npm run qa:chrome`

### Manual checks (release required)

- Keyboard-only navigation and focus visibility
- Mobile + desktop responsive behavior
- Theme toggle and overlay interactions
- Contact + chatbot critical user journey

## 3. Validation and Verification Phase

### Release acceptance criteria

- `npm run qa:prod-ready` passes
- No unresolved Sev-1/Sev-2 defects
- Lighthouse thresholds:
  - Desktop: Perf >= 88, A11y/BP/SEO >= 90
  - Mobile: Perf >= 60, A11y/BP/SEO >= 90

### Verification workflow

1. Execute `npm run qa:prod-ready`.
2. Review artifacts:
   - `artifacts/playwright-report/`
   - `artifacts/lighthouse/`
3. Triage failures, fix, and re-run failed gate(s).
4. Only allow release when all gates are green and defects are dispositioned.
5. Complete release report template.

### Additional acceptance gates

- 100% pass on all **P0** tests defined in `CHROME_TEST_MATRIX.md`.
- No unresolved **Sev-1** or **Sev-2** defects.
- Security: 0 High/Critical unresolved dependency vulnerabilities; no unmitigated high‑risk issues.
- Accessibility: no critical axe violations on homepage and key user journeys; WCAG 2.2 AA baseline for key flows.
- Performance:
  - Target: 100 in all Lighthouse categories (Perf, A11y, Best Practices, SEO) on desktop + mobile.
  - Release floor: desktop Perf ≥ 88 and A11y/BP/SEO ≥ 90; mobile Perf ≥ 60 and A11y/BP/SEO ≥ 90.
  - No regression > 5 points in any category compared to previous release.
- Core Web Vitals (p75): LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200 ms.

### Rollback plan

1. Keep previous stable artifact/tag deployable.
2. If deploy fails or SLOs degrade:
   - Immediate rollback to previous stable artifact
   - Disable risky feature flags if available
3. Log incident timeline, impact, and root cause.
4. Convert incident into regression test(s).

## 4. Documentation

- Release report template:
  - `docs/testing/RELEASE_TEST_REPORT_TEMPLATE.md`
- Testing index and references:
  - `docs/testing/README.md`

## 5. Deployment Phase

1. Build: `npm run build`
2. Deploy via: `.github/workflows/deploy.yml`
3. Post-deploy verification (automated):
   - `qa:postdeploy` against deployed URL
4. Upload and retain QA artifacts in GitHub Actions.

### Post-deploy monitoring tools

- Scheduled Lighthouse monitoring workflow:
  - `.github/workflows/post-deploy-monitoring.yml`
  - Target URL controlled by repository variable `PRODUCTION_URL` (fallback: `https://mangeshraut.pro`)
- Existing runtime telemetry module:
  - `src/js/modules/vercel-analytics.js`

## 6. Post-deployment Review (Feedback Loop)

Detailed workflow is maintained in:

- `docs/testing/POST_DEPLOYMENT_FEEDBACK_LOOP.md`

Minimum policy:

- 24h and 72h release reviews
- Feedback triage with severity + owner
- Convert validated issues into tests and backlog work
