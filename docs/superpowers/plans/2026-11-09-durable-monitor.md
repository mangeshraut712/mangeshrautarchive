# Durable portfolio monitoring

Build an independent scheduled Cloudflare Worker and dedicated D1 database. Check six public endpoints every five minutes. Store idempotent slot samples, daily counters for the visible 90-day window, durable per-service state, and persistent incidents. Database triggers atomically maintain rollups and incident transitions; duplicates and out-of-order observations cannot reopen or incorrectly resolve incidents.

Two consecutive failed observations confirm an incident; two consecutive healthy observations resolve it. Missing intervals break confirmation streaks. Uptime means healthy observed samples divided by all observed samples; coverage separately exposes missing scheduled checks. Never backfill unobserved days as healthy.

The public API is read-only. The browser displays daily history and paginated persistent incidents alongside the existing on-demand live checks. Scheduled monitoring runs independently of browser visits. Test transitions against SQLite, verify the actual D1 schema, verify scheduled collection, test UI failure/retry and both themes at 375/768/1440px, then run release gates and verify deployment CI. Preserve existing chat Worker and OAuth cron.
