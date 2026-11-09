# Persistent portfolio monitoring — November 9, 2026

Coding agent: GPT-6 / Codex desktop. Purpose: real scheduled availability sampling, durable incident history, and accessible status presentation. Exact model variant, reasoning mode, and token usage: unavailable. This does not change the portfolio chatbot's runtime model.

## What is measured

A dedicated Cloudflare Worker, `portfolio-status`, checks six public endpoints every five minutes independently of browser visits. The targets are the published homepage, public repository feed, chat health, recent music, health summary, and integration status. The existing AssistMe Worker, chatbot, analytics, and OAuth refresh schedule are unchanged.

These are HTTP availability checks, not transaction tests: a healthy chat-health response does not establish successful inference, and a healthy integrations response does not establish every user's authorization. Requests time out after 12 seconds. HTTP 2xx/3xx results are healthy, 401/403/404/429 are degraded, and other responses or connection failures are unavailable.

- **Sampled uptime:** healthy recorded checks / all recorded checks. Degraded checks are not healthy.
- **Coverage:** recorded checks / expected five-minute slots since this service's first stored check, within the displayed window. A newly started slot can briefly lower coverage while its probe is still running.
- **History:** 90 UTC calendar days including today. Days before tracking began have no data; no historical availability is invented.
- **Scope:** one scheduled collector, not a global multi-region SLA measurement. Short failures between samples may go undetected. Collector failures produce missing coverage, not assumed healthy samples.

The main status headline still uses the existing on-demand probes and freshness rules. Stored uptime and incident history have separate timestamps. A live recovery can precede the two-check incident recovery confirmation.

## Durable records and incidents

Cloudflare D1 database `portfolio-status` stores samples, daily totals, per-service transition state, and incidents. Unique service/slot keys prevent duplicate executions from inflating uptime. Atomic SQLite triggers update counters and incident transitions. Older checks do not overwrite current transition state.

Two adjacent unsuccessful slots confirm an incident, with its start set to the first failed check. Two adjacent healthy slots confirm recovery. Missing slots break both confirmation streaks. One unsuccessful sample still affects sampled uptime even when it does not create a confirmed incident.

Raw samples are retained for seven days; daily aggregates retain the rolling history window. Incident records are not deleted by retention cleanup. The API returns active incidents and the newest 20 records; cursor pagination exposes older records. All timestamps in the displayed incident timeline and daily table are UTC. The interface retains previous records when a refresh fails and explicitly labels them as previously retrieved data.

No fabricated incidents are inserted into production for testing. Failure, recovery, pagination, and retention scenarios use isolated test databases and browser fixtures.

## Operations

- Worker source and binding: `workers/portfolio-status/src/index.js`, `workers/portfolio-status/wrangler.json`.
- Database schema and triggers: `workers/portfolio-status/migrations/0001_monitor.sql`.
- Public read-only API: [history](https://portfolio-status.mangeshraut712.workers.dev/api/history), [incidents](https://portfolio-status.mangeshraut712.workers.dev/api/incidents), [release health](https://portfolio-status.mangeshraut712.workers.dev/health).
- Deployment: `.github/workflows/deploy-status-worker.yml` runs the database tests, applies schema, deploys the Worker, sets the cron, and verifies the published commit and API. It uses the existing Cloudflare repository credentials; Workers edit and D1 edit permissions are required.
- Deployment preserves the D1 database. Migration SQL is replayed and must be idempotent; the initial schema uses `IF NOT EXISTS`. Future trigger changes need a new explicit migration, not edits to an already-created trigger's original definition.
- Never delete/recreate the D1 database to deploy code. Its identifier is configuration, not a credential. No secrets are shipped to the browser.
- A delayed last stored check (over 15 minutes) is surfaced in Monitor. Cloudflare Cron changes may take time to propagate. Inspect Worker scheduled events and D1 records if checks remain delayed.

## Verification

The eight collector tests exercise the actual SQLite schema: database close/reopen, failure/recovery, duplicate and out-of-order samples, missing intervals, retention, coverage, timeouts, pagination, and unavailable storage. Browser tests exercise persistence across reloads, expanded daily tables across refresh, older incident pagination, retry, and inaccessible storage. Responsive and accessibility checks cover 375px, 768px, and 1440px in light and dark themes using Chromium and WebKit. Production collection is checked separately from fixtures.

The standard release gate remains `npm run check`, `npm test`, `npm run test:tester-army:ci`, `npm run security-check`, and `npm run build`, followed by remote Actions and live-page verification. Local logs and visual captures are retained under `/tmp/portfolio-uptime/` during this maintenance session.

## Local release evidence

- `npm run check`: passed ESLint, Stylelint, anti-slop, and formatting.
- `npm test`: 213 API, 35 Worker, 37 unit, and 20 critical Chrome checks passed.
- `npm run test:tester-army:ci`: all 23 journeys passed.
- Monitor browser matrix: 30 checks passed across Chromium and WebKit, including expanded-table accessibility, pagination, history retry, and six viewport/theme combinations.
- Live-API local visual captures: no horizontal overflow, no page errors, and no visible status control below 44px at 375/768/1440px in both themes. The pre-collection state explicitly showed empty history.
- Secret-pattern scan and production build passed. Production cron samples and remote CI are verified after publishing; these local results alone do not establish production operation.
