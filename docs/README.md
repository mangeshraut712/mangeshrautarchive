# Documentation

| Doc                                                                        | Contents                                                    |
| -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [STRUCTURE.md](./STRUCTURE.md)                                             | Canonical folder map — **start here when organizing code**  |
| [foglamp-scan.md](./foglamp-scan.md)                                       | Public AI architecture map (Foglamp) + keep-alive           |
| [seo/gsc-keyword-notepad-2026-07.md](./seo/gsc-keyword-notepad-2026-07.md) | Search Console query notepad + underserved keyword plan     |
| [plans/](./plans/)                                                         | Improve-skill / audit execution plans (historical + active) |
| [../README.md](../README.md)                                               | Public project README                                       |
| [../AGENTS.md](../AGENTS.md)                                               | AI agent briefing                                           |
| [../SECURITY.md](../SECURITY.md)                                           | Security policy                                             |
| [../.env.example](../.env.example)                                         | Environment variable template                               |
| [../scripts/README.md](../scripts/README.md)                               | Tooling map (build / deploy / qa)                           |
| [../tests/README.md](../tests/README.md)                                   | Unit / API / E2E conventions                                |

### Keep out of `docs/`

Session transcripts, temporary dumps, IDE caches, and build artifacts. Use `artifacts/` (gitignored) for Lighthouse/Playwright output.

### Stack notes

- **No Next.js / React app** — vanilla ESM frontend + FastAPI.
- **Node ≥22** required (`.nvmrc`). Run `npm run check-node` / `npm run doctor:stack`.
