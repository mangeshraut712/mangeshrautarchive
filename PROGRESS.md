# Project status

Reviewed November 9, 2026. This page describes the repository; dated test and deployment evidence belongs in [QA records](docs/qa/).

## Shipped baseline

- GitHub Pages serves the portfolio, journal, systems, monitor, travel, uses, and changelog. Cloudflare supplies the active edge API; FastAPI remains available locally. Vercel is an optional, currently disabled deployment.
- The journal contains 20 articles across January–October 2026. The [November 9 content review](docs/qa/blog-content-review-2026-11-09.md) records primary-source research, worked examples, comparison tables, media provenance, and source-access limits.
- The browser interface preserves its Apple-inspired design and light/dark themes. [Screenshot evidence](docs/screenshots/README.md) is a dated view of the real site, not a mockup.
- API, Worker, unit, critical Chrome, and Tester Army checks form the release path. See [tests](tests/README.md) for commands and scope.

## November 9 repository maintenance

The [maintenance record](docs/qa/repository-review-2026-11-09.md) tracks the CodeQL configuration repair, analytics URL validation, local proxy hardening, branch reconciliation, documentation review, and release checks. The former status and task lists are preserved under [history](docs/history/2026-11-09-progress.md).

## Evidence limits

A green CodeQL run does not mean zero findings. A Lighthouse audit-mode gate does not establish normal-load PageSpeed scores. A service configured with credentials is not proof that a paid provider or browser capability is available. Read the underlying report before repeating a result.

Outstanding work is kept in [TASKS.md](TASKS.md); historical counts and runtime model names are not current service guarantees.
