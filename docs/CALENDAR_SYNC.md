# Calendar sync operations

The public calendar reads `/api/calendar-sync/public` from the existing Cloudflare API.
The owner workspace is `/api/calendar-sync/owner` on that API origin. Its private API
uses an HttpOnly, Secure, one-hour session, the configured Google owner allowlist,
and same-origin CSRF-protected writes. Reminders and ticket references never enter
the public response, static bundle, or localStorage.

## Sources and privacy

- Connect each Google account separately in the owner workspace. Grant Calendar and
  Tasks read-only access plus verified account identity. The existing booking
  integration is separate and is not overwritten. Only events explicitly marked
  Public are published; default/private events remain in the owner view.
- Add the personal Luma iCal subscription in the owner workspace. The feed URL is
  encrypted in Supabase. Registrations in the feed do not prove attendance or RSVP
  approval. Private/confidential events are excluded from the public projection.
  Pass links open Luma in the owner's signed-in session; no ticket QR is stored.
- The [Mac helper](../scripts/integrations/calendar-helper/README.md) reads explicitly
  selected calendars/lists. Google and Luma mirrors are excluded from this installation.
  Apple events remain private because EventKit does not expose a reliable public flag.
  The available Reminders list may be backed by Exchange; a read confirms the Mac's
  cache, not Exchange server freshness.

Cloud refresh runs at minutes 5, 20, 35 and 50. The Mac LaunchAgent runs every 900 seconds
while logged in and awake. The public widget refreshes when visible and every 15 minutes.
The owner workspace offers **Sync now** for cloud sources. Failed/partial reads preserve
last successful snapshots and report delayed updates. Owner diagnostics distinguish
credential decryption, provider HTTP, timeout, and invalid payload failures. Worker logs
contain only a provider name and an allowlisted error category, never raw errors or feed URLs. A valid empty result clears its
source scope. Sources have independent compare-and-swap leases; Google calendar cursors,
events and Tasks commit together only after all pages succeed.

## Storage and activation

Apply `scripts/integrations/calendar-sync-schema.sql` using an administrative Supabase
connection. The new table has RLS enabled, no browser policies, and no `anon` or
`authenticated` privileges. Only the Worker service role reads it. Do not add public
policies to clear the expected informational "RLS enabled, no policy" advisor notice.
Credentials use purpose-bound AES-GCM keys derived from the existing encryption secret.

Required server secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`INTEGRATION_ENCRYPTION_KEY`, `GOOGLE_CALENDAR_CLIENT_ID`,
`GOOGLE_CALENDAR_CLIENT_SECRET`, and `CALENDAR_SYNC_OWNER_EMAILS` (comma-separated).
The Google callback reuses the registered `/api/calendar/callback/google` URL with a
separate state prefix, browser-bound OAuth state and PKCE. Register the Calendar and
Tasks APIs for the Google application; an account consent or organization restriction
must be resolved interactively, never bypassed.

Install the helper at its fixed per-user path, authorize EventKit access, select IDs,
validate, install its scoped token in Keychain, then verify a successful upload before
bootstrapping the LaunchAgent. Rotating/revoking the Mac token immediately invalidates
the previous credential. Local ad hoc signing is supported; upgrading that binary can
require renewed permissions. Do not reset TCC or broaden Keychain access to avoid prompts.

The legacy `npm run sync:apple-calendar` exporter now writes a private local JSON file
under `~/.config/portfolio-calendar-sync/`; it cannot republish unclassified events.
Old Git history is not rewritten. The static fallback contains verified Luma events only.

## Verification and limits

Worker tests cover publication, authentication/CSRF, scoped uploads/replay, occurrence
identity, pagination, expired cursors, cancellations, failed atomic refreshes, and
recurrence timezones. Frontend tests cover replacement, errors, date mapping and late
private responses after sign-out. Check each connected source's last success and an
anonymous private-API 401 after deployment; an installed helper alone is not active sync.

Google expands a bounded rolling window (one year back, two years forward), refreshed
monthly. Apple uses the configured snapshot window and retains older out-of-window
records. Luma retains verified past records when the feed ages them out, and honors
explicit cancellations. Non-UTC ICS timestamps require valid VTIMEZONE definitions;
unsupported feeds fail rather than silently changing event times. Luma may omit declined
registrations or unaccepted invitations. Private source accounts are never modified.

Coding agent: GPT-6 / Codex. Purpose: privacy-preserving hybrid calendar synchronization.
Exact model variant, reasoning mode, and token usage: unavailable.
