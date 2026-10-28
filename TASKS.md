# Project Tasks & Execution Roadmap

> **Approach**: Small, verifiable, incremental steps — one task at a time.  
> **Status Overview**: Phase 1 & 2 Completed; Phase 3 Active; Phase 4 Planned.

---

## Phase 1: Security, System Toolchain & Dependencies ✅ (Completed)

- [x] **Task 1.1: Node.js Security Upgrades**
  - Upgraded local macOS runtime to Node.js 22 LTS `v22.23.4`.
  - Upgraded Node.js 24 LTS to `v24.22.1`.
  - Addressed October 2026 security advisories (CVE-2026-111497, CVE-2026-105482, CVE-2026-105483, CVE-2026-106069).
- [x] **Task 1.2: System Toolchain Upgrades**
  - Updated Homebrew formulas: `git` 2.56.0, `gh` 2.103.0, `uv` 0.13.5, `cloudflared` 2026.10.3, `certifi` 2026.10.19, `openssl@3/4`.
  - Purged bottle caches with `brew cleanup` (reclaimed 189.3 MB).
- [x] **Task 1.3: Lockfile Multi-Platform Hardening**
  - Preserved cross-platform optional dependencies in `package-lock.json` (`@esbuild/linux-x64`, `@tailwindcss/oxide-linux-*`, `@img/sharp-linux-*`, `@oxlint/binding-linux-*`).
  - Verified clean builds across Darwin and Ubuntu CI runners.

---

## Phase 2: Edge Parity & Platform Health Performance ✅ (Completed)

- [x] **Task 2.1: Health Concurrency & Caching**
  - Refactored `api/platform_health.py` to run Supabase probes, health vitals, and catalog checks in parallel with `asyncio.gather()`.
  - Implemented 30-second TTL in-memory caching to eliminate redundant outbound queries.
- [x] **Task 2.2: Cloudflare Edge Route Parity**
  - Implemented `GET /api/github/profile` handler on the Cloudflare Worker (`workers/assistme-chat/src/index.js`).
  - Added test case to `tests/worker/chat-routing.test.js` (11/11 tests passing).
- [x] **Task 2.3: GitHub CodeQL Remediation**
  - Resolved 6/6 CodeQL security and quality code scanning alerts across frontend, backend, and worker.

---

## Phase 3: Agent Scaffolding & Documentation Blueprint 🔄 (Active)

- [x] **Task 3.1: Synchronize Dependency Documentation**
  - Updated `README.md` and `docs/TESTER_ARMY.md` to reflect `e2e@0.21.2` runner.
- [x] **Task 3.2: Allowlist Core Blueprint Files in Repo Doctor**
  - Added `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, and `PROGRESS.md` to `allowedRootFiles` in `scripts/utils/repo-doctor.mjs`.
- [x] **Task 3.3: Author 6 Core Guidance Files**
  - [x] Create `PRD.md` (Product vision, user personas, functional and non-functional requirements).
  - [x] Create `ARCHITECTURE.md` (Tech stack, folder structure, Mermaid data flow).
  - [x] Create `DESIGN.md` (Apple HIG aesthetic, colors, typography, components).
  - [x] Create `RULES.md` (Guardrails, style guide, what AI must never do).
  - [x] Create `TASKS.md` (Incremental task backlog and milestones).
  - [x] Create `PROGRESS.md` (Completed work, bug fixes, operational metrics).
- [x] **Task 3.4: Synchronize GitHub Operating View with Live GitHub Platform**
  - Scraped and synchronized live GitHub profile and repository catalog for @mangeshraut712 (58 public repos, 12 stars, 4 forks, 10 followers).
  - Calibrated static fallback catalog in `src/js/modules/github-projects.js`, added `erdos142` research notebook, and aligned all telemetry across `systems.html`, `uses.html`, and `monitor.html`.
- [x] **Task 3.5: Crosscheck & Synchronize All Surfaces with Authoritative Live Platforms**
  - Scraped real-time WhoBurnedMore telemetry for `@mrcommando712`: 20.25B lifetime tokens, $18,090 spend, 244 active days, 56d streak, rank #67 of 342 devs (Top 20%), 94.54% cache hit rate ($40,635 saved), Codex (10.61B tokens, 52.4%) and Cursor (8.89B tokens, 43.9%).
  - Synced official Kalnirnay Panchang for October 23, 2026 from `kalnirnay.com` (Ashwin Shukla Paksha Dwadashi, Nakshatra P.Bhadrapada, Yog Dhruv, Karan Kaulav, Sunrise 6:37 AM / Sunset 6:08 PM).
  - Aligned WebMCP tools count portfolio-wide to 20 across `systems.html`, `uses.html`, and `index.html`.
  - Created automated sync utility `scripts/integrations/sync-whoburnedmore.mjs` and npm scripts `sync:whoburnedmore` and `sync:kalnirnay`.
- [x] **Task 3.6: Run Quality Gates & Format Checks**
  - Executed `npm run check` (Prettier, ESLint, Stylelint, Oxlint).
  - Executed `npm run doctor:strict` (57/57 passed).
  - Executed `npm run build` (zero errors), `npm run test:worker` (11/11), `npm run test:api` (185/185), and `npm run test:e2e:critical` (14/14).
- [x] **Task 3.7: Deep Quality Pass, Security Hardening & Test Suite Expansion**
  - Hardened Upstash vector search against query injection with bounded length and top_k validation.
  - Added SSRF defense and private IP / loopback blocking to Firecrawl URL ingestion.
  - Bound CSP report payload size to 32KB to prevent memory exhaustion; resolved Cloudflare Worker 204 TypeError.
  - Unified client IP extraction across requests and unhandled exceptions.
  - Robustly parsed concatenated NDJSON stream chunks and SSE tokens; added accessible aria-labels to chat attachment buttons.
  - Expanded test suites: pytest to 192 tests (`npm run test:api`), Cloudflare Worker edge routes to 20 tests (`npm run test:worker`).
  - Synchronized live WhoBurnedMore telemetry (21.14B tokens, $19,062 spend, 245 active days, 57d streak, rank #64), official Kalnirnay Panchang for October 28, 2026 (Ashwin Krishna Paksha Tritiya, Nakshatra Kruttika, Yog Vyatipat / Variyan, Karan Vanij), and multi-calendar ecosystem (Google, Apple, Outlook, Luma).

---

## Phase 4: Feature Enhancements & Advanced Agentic Tools 📋 (Upcoming)

- [ ] **Task 4.1: Expand WebMCP Client Tools**
  - Implement `searchBlogArticles` tool enabling AssistMe to query full-text blog content.
  - Implement `inspectCaseStudy` tool for deep-linking into engineering case studies.
- [ ] **Task 4.2: Mobile Safari Voice Interaction Polish**
  - Audit Web Audio API buffer playback and mic permissions on iOS Safari.
  - Verify zero audio latency stall during streaming speech-to-text.
- [ ] **Task 4.3: Visual Regression Snapshots**
  - Re-generate Playwright visual regression snapshots across dark, light, and high-contrast modes.
