# Documentation

| Doc                                                                        | Contents                                                        |
| -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [DESIGN.md](./DESIGN.md)                                                   | Apple Human Interface Portfolio Design System (source of truth) |
| [STRUCTURE.md](./STRUCTURE.md)                                             | Canonical folder map — **start here when organizing code**      |
| [API.md](./API.md)                                                         | FastAPI routes, chat flow, integrations, deploy notes           |
| [foglamp-scan.md](./foglamp-scan.md)                                       | Public AI architecture map (Foglamp) + keep-alive               |
| [seo/gsc-keyword-notepad-2026-07.md](./seo/gsc-keyword-notepad-2026-07.md) | Search Console query notepad + underserved keyword plan         |
| [plans/](./plans/)                                                         | Improve-skill / audit execution plans (historical + active)     |
| [../README.md](../README.md)                                               | Public project README                                           |
| [../CONTRIBUTING.md](../CONTRIBUTING.md)                                   | Contribution guidelines & dev workflow                          |
| [../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)                             | Community code of conduct (Covenant v2.1)                       |
| [../SECURITY.md](../SECURITY.md)                                           | Security policy & vulnerability reporting                       |
| [../AGENTS.md](../AGENTS.md)                                               | AI agent operating brief                                        |
| [../CITATION.cff](../CITATION.cff)                                         | Software citation metadata                                      |
| [../.env.example](../.env.example)                                         | Environment variable template                                   |
| [../scripts/README.md](../scripts/README.md)                               | Tooling map (build / deploy / qa)                               |
| [../tests/README.md](../tests/README.md)                                   | Unit / API / E2E conventions                                    |

### Keep out of `docs/`

Session transcripts, temporary dumps, IDE caches, and build artifacts. Use `artifacts/` (gitignored) for Lighthouse/Playwright output.

### Stack notes

- **No Next.js / React app** — vanilla ESM frontend + FastAPI.
- **Node ≥22** required (`.nvmrc`). Run `npm run check-node` / `npm run doctor:stack`.
