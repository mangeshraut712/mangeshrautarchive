# Portfolio Monitor status redesign — November 9, 2026

Coding agent: GPT-6 / Codex desktop. Purpose: a status-first Monitor with truthful service availability and accessible Apple-style presentation. Exact variant, reasoning mode, token usage: unavailable.

The design uses the clear service hierarchy of [OpenAI Status](https://status.openai.com/) while retaining the portfolio's own typography, rounded controls, white/black surfaces, and blue accents.

## Data and behavior

- The default view reads `/api/monitor/status` from the existing configured API. The primary Cloudflare deployment includes six public probe IDs: `github_pages`, `github_repos`, `chat_health`, `lastfm`, `health_vitals`, and `integrations`.
- Missing IDs, malformed results, invalid timestamps, and results older than two minutes are unverified. A configured API key is not a successful inference check. The legacy FastAPI quick-status payload does not include these probes and therefore cannot make the public view green by itself.
- Refresh every 30 seconds while visible; returning to the tab triggers a fresh check. Requests are bounded and concurrent refreshes share the same work.
- Diagnostics, service matrices, deployments, and security/log controls remain available. Their larger request batch starts only when a diagnostic view is opened.
- Each service disclosure explains the check's scope. Endpoint availability does not prove successful messages, current biometric readings, or individual OAuth authorizations.
- The observation strip holds at most 24 results in memory during the current visit. Empty bars mean no observation. This is not durable incident history or an uptime percentage. Current issues are automated probe findings, not curated incident reports.
- No subscription, email delivery, or incident-persistence feature is implied. Report an issue links to Contact; release history links to Changelog.

## Verification

- Status model unit checks cover fresh, missing, stale, future, degraded and failed probes.
- Browser checks cover 375px, 768px and 1440px in both themes on Chrome and WebKit; disclosures, diagnostics, retry/recovery, escaped API details, request deduplication, and accessibility.
- Existing Monitor actions and layout-stability checks remain part of regression verification.
- Live Cloudflare probes were inspected separately from the preview server's mock data. A successful response is a point-in-time observation, not continuous availability evidence.

The repository release checks and remote CI are required before shipping. Screenshots and detailed command logs are retained as local QA artifacts under `/tmp/portfolio-monitor-redesign/`.

## Recorded local results

| Check                                         | Result                                |
| --------------------------------------------- | ------------------------------------- |
| ESLint, Stylelint, anti-slop, Prettier        | Passed                                |
| API / Worker / unit / critical Chrome         | 213 / 27 / 37 / 20 passed             |
| Monitor regression run, Chrome + WebKit       | 22 passed                             |
| Final status and whole-main accessibility run | 16 passed                             |
| Live API visual matrix                        | Six width/theme states, zero overflow |
| Live diagnostic navigation and event search   | Passed, zero page errors              |
| Secret-pattern scan and production build      | Passed                                |

The two Monitor browser runs overlap; these counts are not distinct features. The deployed CI additionally runs the new status regression file against the production build.
