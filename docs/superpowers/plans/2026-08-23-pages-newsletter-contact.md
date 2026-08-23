# GitHub Pages Newsletter and Contact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist GitHub Pages newsletter and contact submissions through the Cloudflare Worker into secured Supabase tables and improve standalone blog conversion metadata.

**Architecture:** The Worker is the only database boundary and uses a server-only Supabase service-role key. Shared browser form helpers submit normalized attribution to Worker endpoints; generated blog pages reuse the newsletter module and Pages canonical URL.

**Tech Stack:** Vanilla JavaScript ES modules, Cloudflare Workers, Supabase Postgres/PostgREST, esbuild, Vitest, pytest, Playwright.

## Global Constraints

- Node.js 22 through 26 only.
- No framework runtime, TypeScript, JSX, inline styles, or browser-exposed database keys.
- GitHub Pages is the active canonical surface while `mangeshraut.pro` is disabled.
- Use Apple design tokens and preserve zero horizontal overflow.
- Every behavior change follows red-green testing.

---

### Task 1: Secure storage schema

**Files:**

- Verify: Supabase project `ruugmnbhnxjhpgruwbym`

**Interfaces:**

- Produces: `public.newsletter_subscribers` and `public.contact_messages` writable only by `service_role`.

- [ ] Apply one migration that creates both tables, constraints, indexes, RLS settings, and grants.
- [ ] List both tables through MCP and verify columns and `rls_enabled=true`.
- [ ] Run Supabase security and performance advisors and resolve findings caused by the migration.

### Task 2: Worker persistence contract

**Files:**

- Modify: `workers/assistme-chat/src/index.js`
- Create: `tests/unit/edge-form-storage.test.js`

**Interfaces:**

- Consumes: Worker `env.SUPABASE_URL` and `env.SUPABASE_SERVICE_ROLE_KEY`.
- Produces: `POST /api/newsletter/subscribe` and `POST /api/contact` responses with `{ success, persisted, id, message }`.

- [ ] Write tests that expect valid newsletter/contact payloads to call the correct PostgREST table and return persisted success.
- [ ] Run the focused test and confirm it fails because contact routing and strict persistence do not exist.
- [ ] Add shared JSON parsing, field normalization, honeypot, payload length, and Supabase insert helpers.
- [ ] Return `503` for missing storage configuration and `502` for rejected upstream writes.
- [ ] Run the focused test and confirm all edge storage cases pass.

### Task 3: Browser form clients

**Files:**

- Create: `src/js/services/form-submission.js`
- Modify: `src/js/modules/newsletter.js`
- Modify: `src/js/modules/contact-page.js`
- Test: `tests/unit/form-submission.test.js`

**Interfaces:**

- Produces: `getFormsApiBase()`, `getSubmissionContext()`, and `submitStoredForm(endpoint, payload)`.
- Consumes: those helpers from newsletter and contact modules.

- [ ] Write failing tests for GitHub Pages base URL selection, UTM extraction, and error normalization.
- [ ] Implement the shared helper without database or secret knowledge.
- [ ] Update newsletter initialization to bind every `[data-newsletter-form]` instance.
- [ ] Update contact submission to POST JSON and preserve form contents on failure.
- [ ] Run the focused unit tests and verify green.

### Task 4: Standalone blog conversion and metadata

**Files:**

- Modify: `scripts/build/generate-blog-pages.mjs`
- Modify: `scripts/build/build.js`
- Modify: `scripts/utils/local-server.js`
- Modify: `src/assets/css/blog.css`
- Test: `tests/unit/blog-pages-build.test.js`

**Interfaces:**

- Produces: Pages-canonical blog index/articles with newsletter forms and article-specific share metadata.

- [ ] Write a failing build test for Pages canonical URLs, `twitter:creator`, large cards, article image metadata, and newsletter forms.
- [ ] Add deterministic article-image mapping to existing blog assets.
- [ ] Render one compact form on the blog index and one after each article body.
- [ ] Use the Pages URL as the fallback for feeds and generated pages.
- [ ] Add responsive, dual-theme newsletter styles using existing Apple tokens.
- [ ] Build and confirm the generated artifacts satisfy the test.

### Task 5: Changelog and verification

**Files:**

- Modify: `src/js/data/changelog-entries.js`
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**

- Documents the active Pages/Worker/Supabase architecture and verification evidence.

- [ ] Add one typed changelog entry describing persistent Pages forms and blog acquisition support.
- [ ] Synchronize architecture/storage documentation and current test counts after verification.
- [ ] Run `npm run check`, `npm run test:api`, `npm run security-check`, and `npm run build` under Node 22.
- [ ] Run focused Playwright desktop and iPhone checks against the local production bundle.
- [ ] Review `git diff --check`, repository status, and the final diff.

### Task 6: Live release verification

**Files:**

- Deploy: GitHub Pages and `workers/assistme-chat`

**Interfaces:**

- Produces: exact-SHA live Pages/Worker release with verified storage writes.

- [ ] Commit and push the verified change to `main` using the repository commit convention.
- [ ] Wait for Pages and Worker GitHub Actions to pass for the exact SHA.
- [ ] Submit synthetic newsletter and contact records through the live Worker.
- [ ] Query Supabase by synthetic marker, verify normalized attribution, then delete the synthetic rows.
- [ ] Recheck live Pages article metadata, forms, feeds, and zero-overflow mobile layout.
