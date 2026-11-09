# Documentation

Start with the [portfolio README](../README.md) for the product and local setup. This index separates maintained operating guides from dated evidence and historical plans.

## Current guides

| Guide                                                                | Purpose                                                              |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [Architecture](../ARCHITECTURE.md)                                   | Runtime boundaries and browser-to-service data flow                  |
| [Folder map](STRUCTURE.md)                                           | Where source, tooling, generated output, and documentation belong    |
| [Product requirements](../PRD.md)                                    | Audience, product scope, and performance goals                       |
| [Design system](DESIGN.md)                                           | Canonical tokens, component behavior, and visual QA checklist        |
| [Design overview](../DESIGN.md)                                      | Short introduction to the visual language                            |
| [API](API.md)                                                        | FastAPI routes, Worker deployment, streaming, and integrations       |
| [Contact calendar](CONTACT_CALENDAR.md)                              | World clocks, reminders, booking boundaries, and Panchang freshness  |
| [Tests](../tests/README.md)                                          | Current suite inventory and commands                                 |
| [Tester Army](TESTER_ARMY.md)                                        | Deterministic journey assertions and excluded live-provider behavior |
| [Contributing](../CONTRIBUTING.md)                                   | Setup, changes, review, and release checks                           |
| [Engineering practices](BEST_PRACTICES.md)                           | Architecture, testing, and maintenance guidance                      |
| [Agent instructions](../AGENTS.md) / [rules](../RULES.md)            | Shared contributor constraints and attribution                       |
| [Security](../SECURITY.md)                                           | Private reporting and implemented boundaries                         |
| [Tools](../scripts/README.md) / [configuration](../config/README.md) | Development and QA script ownership                                  |
| [Status](../PROGRESS.md) / [roadmap](../TASKS.md)                    | Current state and remaining verification work                        |
| [Environment template](../.env.example)                              | Optional local service configuration; never commit credentials       |

## Evidence and media

- [November 9 repository review](qa/repository-review-2026-11-09.md): findings, branch decisions, documentation inventory, and validation scope.
- [Live website screenshots](screenshots/README.md): seven surfaces, three viewports, both themes, with a capture manifest.
- [November 9 article research](qa/blog-content-review-2026-11-09.md): all 20 articles, source-to-claim mapping, examples, and media checks.
- [Blog media audit](BLOG_MEDIA_AUDIT.md): current provenance and preserved September evidence.
- [Repository-card media audit](REPO_SCREENSHOT_COVERAGE.md): dated project imagery coverage, not current GitHub totals.
- [QA records](qa/): reports describe the revision, date, configuration, and checks actually run.

## Historical records and specialist guides

[Development history](DEVELOPMENT_HISTORY.md) preserves contributor records; the [attribution audit](CHANGELOG_ATTRIBUTION_AUDIT.md) explains their evidence limits. [Earlier status snapshots](history/) and plans in [plans/](plans/), [design-plans/](design-plans/), and [superpowers/](superpowers/) are historical context, not a replacement for the implemented source.

[SEO notes](seo/), [the October site audit](SITE_AUDIT_2026-10-01.md), [Foglamp setup](foglamp-scan.md), and [local Insights](INSIGHTS.md) retain their own dates and operational limits. The [community code of conduct](../CODE_OF_CONDUCT.md), [license](../LICENSE), and [citation metadata](../CITATION.cff) remain separate policies.

Keep session transcripts, credentials, local reports, and build output out of tracked documentation. Use ignored `artifacts/` for raw test output; publish only intentional evidence and documentation assets. Do not rewrite historical counts to look current.
