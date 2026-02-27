# Chrome Test Matrix

This matrix defines the release checklist, critical test cases, and tools for Chrome validation.

## A. Checklist

### Functional

- [ ] Global navigation links route to expected sections
- [ ] Search overlay opens/closes and returns expected hits
- [ ] Chatbot opens, sends a message, and renders response/fallback
- [ ] Theme toggle switches and persists correctly
- [ ] Contact flow (CTA + section links) is reachable and functional
- [ ] Core sections (home/about/skills/projects/contact) render without JS errors

### Performance

- [ ] Lighthouse desktop thresholds pass
- [ ] Lighthouse mobile thresholds pass
- [ ] No unexpected increase in render-blocking assets
- [ ] LCP element remains stable and visible without layout regressions

### Security

- [ ] Secret scan passes (`npm run security-check`)
- [ ] No P0/P1 dependency risk accepted without explicit waiver
- [ ] No mixed-content or insecure external URL regressions
- [ ] Security headers behavior validated in production response checks

### Usability and Accessibility

- [ ] Keyboard-only path works for nav/search/chatbot/close actions
- [ ] Axe scan shows zero critical/serious issues
- [ ] Mobile viewport layout is readable and interactive
- [ ] Focus order and Escape-key close behavior are correct

## B. Critical Test Cases (User-Story Based, P0/P1)

| ID  | Priority | User story / Flow | Test steps | Expected result | Automation |
| --- | -------- | ----------------- | ---------- | --------------- | ---------- |
| F-01 | P0 | User lands on homepage | Open `/` and verify title + landmarks. | Page loads with no blank state or blocking errors; nav + main content visible. | `tests/e2e/smoke.spec.js` |
| F-02 | P0 | User navigates via top nav/overlay | Use top nav/overlay to reach key sections. | Correct section navigation; URL/hash updates; no focus trap. | `tests/e2e/smoke.spec.js` |
| F-03 | P0 | User uses keyboard only | Tab/Shift+Tab through nav, overlays, and CTAs. | All interactive elements reachable; visible focus; Escape closes overlays where expected. | `tests/e2e/smoke.spec.js` |
| F-04 | P0 | User submits contact/chat flow | Complete and submit contact/chat form. | Submission works; validation/sanitization enforced; clear success/failure messaging. | `tests/e2e/smoke.spec.js` (future extension for chat/contact) |
| F-05 | P0 | User opens links/downloads resume | Activate resume download and key external links. | Correct asset opens/downloads; no 404 or mixed-content errors. | `tests/e2e/smoke.spec.js` (to be added) |
| P-01 | P0 | Lighthouse mobile + desktop gate | Run Lighthouse (mobile + desktop) via scripts. | Meets configured thresholds (see runbook section 3). | `scripts/lighthouse-gate.js` via `npm run qa:lighthouse:*` |
| S-01 | P0 | Security headers and HTTPS | Inspect production/staging response headers and protocol. | TLS valid; CSP/HSTS/XFO/etc. configured as required; no mixed content. | Manual + `post-deploy-monitoring` artifacts |
| S-02 | P0 | Dependency and input security scan | Run npm/Snyk/secret scans and basic input fuzzing. | No open High/Critical vulnerabilities; no obvious XSS/CSRF-style input holes. | `npm run security-check`, `npm audit`/Snyk |
| U-01 | P1 | Mobile responsiveness | Exercise site on key breakpoints and Chrome on Android. | No overlap/cutoff on key sections/CTAs; touch targets usable. | Manual + DevTools emulation |
| A-01 | P0 | Accessibility automated audit | Run axe baseline on homepage and key flows. | No critical axe violations; WCAG 2.2 AA baseline for main journeys. | `tests/e2e/accessibility.spec.js` |

## C. Tools and Frameworks

### Automated

- `Playwright` (`@playwright/test`) for browser E2E and smoke
- `axe-core` (`@axe-core/playwright`) for accessibility baseline
- `Lighthouse` CLI for performance, best practices, and SEO gates
- `ESLint` / `Stylelint` / `Vitest` for code quality and unit validation
- `scripts/security-check.js` for secret exposure scanning

### Manual

- Chrome DevTools (Elements, Network, Performance, Lighthouse panel)
- axe DevTools browser extension (manual deep accessibility validation)
- Responsive mode checks using Chrome device emulation

## D. Exit Criteria

A release candidate is accepted only when:

1. All automated gates are green.
2. Required manual checks are signed off.
3. No open Sev-1/Sev-2 defects.
4. Release report is completed and linked to CI artifacts.
