# Portfolio Status Implementation Plan

**Goal:** A status-first Monitor page inspired by OpenAI Status, styled with the portfolio's Apple design system.

**Architecture:** Keep existing diagnostic panels and API contracts. Default to a lightweight status panel driven by the existing `/api/monitor/status` live probes. Load the diagnostic batch only when requested. Separate status normalization and presentation from the legacy dashboard.

**Tech stack:** Vanilla HTML, CSS, JavaScript modules, Playwright and Node tests.

## Design

A compact masthead leads into a large health statement, last-checked time, and refresh action. Grouped service rows expose probe scope, status, latency, and a 24-observation strip from this visit. Current issues come from failed/degraded checks. Missing or stale data stays unknown; configuration readiness is not proof of AI inference. No invented 90-day uptime or durable incident history. Diagnostics remain available through existing keyboard-accessible tabs. Keep both themes, 44px controls, reduced motion, and no footer.

The selected implementation reuses the live API rather than adding a second monitoring backend. A cosmetic restyle alone would retain excessive request fan-out; a new incident database would exceed the available evidence and this redesign's scope.

## Work

- [x] Add a pure status model and tests for operational, degraded, missing, stale, and invalid data.
- [x] Add the status layout, service disclosures, current issues, and session observations.
- [x] Deduplicate refreshes, bound requests, and defer diagnostics until their tabs open.
- [x] Verify live data and simulated failures/recovery at 375, 768, and 1440px in both themes, Chrome and WebKit; check accessibility and existing monitor interactions.
- [ ] Update release documentation and attribution, run release gates, push main and verify CI and deployment.
