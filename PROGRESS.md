# Project status

Reviewed November 10, 2026. This page describes the repository; dated test and deployment evidence belongs in [QA records](docs/qa/).

## Shipped baseline

- GitHub Pages serves the portfolio, journal, systems, monitor, travel, uses, and changelog. Cloudflare supplies the active edge API (AssistMe chat inference and the durable portfolio status engine); FastAPI remains available locally. Vercel is an optional, currently disabled deployment.
- The journal contains 20 articles across January–October 2026. The [November 9 content review](docs/qa/blog-content-review-2026-11-09.md) records primary-source research, worked examples, comparison tables, media provenance, and source-access limits.
- The browser interface preserves its Apple-inspired design and light/dark themes. [Screenshot evidence](docs/screenshots/README.md) is a dated view of the real site, not a mockup.
- The entire system architecture, data flows, and risk matrix are documented in [ARCHITECTURE.md](ARCHITECTURE.md).
- API (218 tests), Worker (69 tests), Unit (67 tests), critical Chrome (20 journeys), and Tester Army checks form the release path. See [tests](tests/README.md) for commands and scope.

## November 10 repository updates

- **GitHub Operating View Harmonization**: The GitHub Operating View header matches Apple-standard center alignment, redundant pill badges and banner text were eliminated, live statistics (100 public repos, 22 unique contributors, 14 stars, 4 forks, 87 30-day commits, 97 active repos, 9 languages) are pre-hydrated, and the contribution graph defaults to dual 3D/2D display mode.
- **Projects Catalog & Accessibility**: The [November 10 project showcase QA](docs/qa/project-showcase-2026-11-10.md) details paginated metadata handling beyond 100 repositories, bounded visible hydration, Unicode search, keyboard navigation, and modal focus traps.
- **System Architecture Mapping**: Comprehensive folder structures, main file purposes, end-to-end data flows with Mermaid sequence diagrams, and the top 5 riskiest files are detailed in [ARCHITECTURE.md](ARCHITECTURE.md).
- **Durable Uptime Engine**: Cloudflare Worker `workers/portfolio-status` with D1 SQLite persistence records 5-minute autonomous probe health across 6 production endpoints with 2-consecutive-sample incident confirmation. See the [operations guide](docs/qa/durable-monitor-2026-11-09.md).

## Evidence limits

A green CodeQL run does not mean zero findings. A Lighthouse audit-mode gate does not establish normal-load PageSpeed scores. A service configured with credentials is not proof that a paid provider or browser capability is available. Read the underlying report before repeating a result.

Outstanding work is kept in [TASKS.md](TASKS.md); historical counts and runtime model names are not current service guarantees.
