# Release Test Report Template

## Build & Environment

- Release version:
- Commit SHA:
- Build ID:
- Test date:
- Tester:
- Chrome Stable version (exact):
- Chrome Beta version (if run):
- Mobile device(s) used (Chrome on Android):
- Environment URL (staging / production):

## Scope

- Features covered:
- Out of scope:

## Test Execution Summary

- Total tests:
- Passed:
- Failed:
- Blocked:

## Results by Category

- Functional (nav, forms, CTAs, chatbot/search):
- Performance (Lighthouse + Core Web Vitals):
- Security (headers, HTTPS, dependency scans):
- Accessibility/Usability (WCAG 2.2 AA, keyboard, screen reader):
- Compatibility (Chrome Stable/Beta, desktop/mobile):

## Automated Results

- `qa:smoke`:
- `qa:a11y`:
- `qa:lighthouse:desktop`:
- `qa:lighthouse:mobile`:
- `qa:postdeploy`:
- Additional security checks (npm audit/Snyk/secret scan):
- Artifact links (Playwright, Lighthouse, monitoring, security scans):

## Critical Test Coverage (P0/P1)

- `F-01` User lands on homepage:
- `F-02` User navigates via top nav/overlay:
- `F-03` User uses keyboard only:
- `F-04` User submits contact/chat flow:
- `F-05` User opens links/downloads resume:
- `P-01` Lighthouse mobile + desktop gate:
- `S-01` Security headers and HTTPS:
- `S-02` Dependency and input security scan:
- `U-01` Mobile responsiveness:
- `A-01` Accessibility automated audit:

## Manual Validation Results

- Keyboard navigation & focus behavior:
- Responsive layout (desktop + mobile breakpoints):
- Theme and overlay behavior:
- Contact/chatbot critical path:
- Screen reader quick pass:
- Browser compatibility notes (Chrome Stable/Beta desktop + Chrome on Android):

## Defects

| ID | Severity | Description | Owner | Status | ETA |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Risks / Waivers

- Risk:
- Mitigation:
- Approver:

## Go / No-Go Decision

- Decision:
- Approvers:
- Timestamp:

## Rollback Readiness

- Previous stable version/tag:
- Rollback method validated (Y/N):
- Rollback owner:
- Rollback notes:

## Post-Deployment Follow-up

- Monitoring dashboards/alerts checked:
- Feedback channels monitored:
- 24h review notes:
- 72h review notes:
- 7-day review notes:
- MTTA:
- MTTR:
