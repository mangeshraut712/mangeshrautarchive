# Google Calendar Booking and Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake Contact calendar and reminders with secure Google Calendar availability, booking invitations, and owner reminders on GitHub Pages.

**Architecture:** The Cloudflare Worker owns Google OAuth, token refresh, signed availability slots, event creation, and Supabase audit writes. The browser consumes only sanitized slots and submits a signed slot token plus visitor details.

**Tech Stack:** Vanilla JavaScript, Cloudflare Workers, Google Calendar API v3, Supabase Postgres/PostgREST, Vitest, Playwright.

## Global Constraints

- Node.js 22 through 26 only.
- GitHub Pages + Cloudflare Worker is the active production path.
- Never expose Google, Supabase, or integration secrets to browser code.
- Use only `calendar.events.owned` and `calendar.freebusy` Google scopes.
- Follow `docs/DESIGN.md`, support light/dark themes, 44px controls, and zero horizontal overflow.
- Every behavior change follows red-green testing.

---

### Task 1: Booking audit schema

**Files:**

- Verify: Supabase project `ruugmnbhnxjhpgruwbym`

**Interfaces:**

- Produces: `public.calendar_bookings` with service-role-only access and unique active slot reservations.

- [ ] Apply a migration defining attendee, slot, event, status, attribution, timestamp, and constraint columns.
- [ ] Enable RLS, revoke `anon` and `authenticated`, grant `service_role`, and add active-slot and created-at indexes.
- [ ] Verify the schema, privileges, and Supabase security/performance advisors.

### Task 2: Worker Calendar domain module

**Files:**

- Create: `workers/assistme-chat/src/google-calendar.js`
- Modify: `workers/assistme-chat/src/health-sync.js`
- Test: `tests/unit/google-calendar-edge.test.js`

**Interfaces:**

- Produces: OAuth handlers, `handleCalendarAvailability`, `handleCalendarBooking`, and signed-slot helpers.
- Consumes: `persistOAuthTokens` and exported `getValidAccessToken` from `health-sync.js`.

- [ ] Write failing tests for slot generation, signatures, OAuth URLs/callbacks, free/busy filtering, booking payloads, reminders, and conflicts.
- [ ] Run the focused suite and confirm failures come from missing Calendar Worker behavior.
- [ ] Add Google token refresh support to the shared encrypted token manager.
- [ ] Implement the Calendar module with strict input validation and private event creation.
- [ ] Run the focused suite and confirm all cases pass.

### Task 3: Worker routes and deployment configuration

**Files:**

- Modify: `workers/assistme-chat/src/index.js`
- Modify: `workers/assistme-chat/src/whoop-oauth.js`
- Modify: `workers/assistme-chat/wrangler.toml`
- Modify: `.github/workflows/deploy-chat-worker.yml`
- Test: `tests/unit/edge-form-storage.test.js`

**Interfaces:**

- Produces: `/api/calendar/availability`, `/api/calendar/book`, `/api/integrations/google-calendar/connect`, `/api/calendar/callback/google`, and protected admin connect URL support.

- [ ] Write route-level failing tests for Calendar status, booking, and owner-only connection URL behavior.
- [ ] Register Calendar handlers and expose safe integration readiness metadata.
- [ ] Pass existing Google credential secrets to Wrangler and set the permanent Worker redirect URI.
- [ ] Keep owner reconnect URLs out of public Actions logs; rotate the admin secret with `gh` and request the ten-minute URL locally during release verification.
- [ ] Run route and workflow lint tests.

### Task 4: Contact booking interface

**Files:**

- Replace: `src/js/modules/calendar.js`
- Modify: `src/assets/css/contact.css`
- Modify: `src/assets/css/contact-solid.css`
- Modify: `src/index.html`
- Test: `tests/unit/calendar-widget.test.js`
- Test: `tests/e2e/calendar-booking.spec.js`

**Interfaces:**

- Consumes: sanitized availability and booking endpoints.
- Produces: accessible slot picker and booking form with truthful connection/error states.

- [ ] Write failing DOM tests for live slots, fake-reminder removal, booking payload, and success/error states.
- [ ] Implement the new Calendar widget using the existing public API base configuration.
- [ ] Remove Calendly from the Contact widget and render visitor-local times with ET context.
- [ ] Generate one RFC 5545 `.ics` fallback locally and expose it through Apple Calendar and Outlook download actions after booking.
- [ ] Add responsive Apple-style status, slot, and form styling.
- [ ] Run focused unit and desktop/iPhone Playwright tests.

### Task 5: Release verification

**Files:**

- Modify: `src/js/data/changelog-entries.js`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/API.md`
- Modify: `tests/README.md`

**Interfaces:**

- Documents exact test counts, scopes, storage, and active Pages/Worker topology.

- [ ] Run `npm run check`, `npm run test:api`, `npm run security-check`, and `npm run build` under Node 22.
- [ ] Commit implementation with model/reasoning/token-availability metadata, then add a changelog entry referencing that real SHA.
- [ ] Push to `main` and wait for exact-SHA Pages and Worker workflows.
- [ ] Rotate the protected admin secret, generate the reconnect URL locally, complete Google owner consent if required, and delete the local secret file.
- [ ] Create one synthetic booking through the live UI, verify the Calendar event and Supabase row, delete both, and confirm zero synthetic rows remain.
