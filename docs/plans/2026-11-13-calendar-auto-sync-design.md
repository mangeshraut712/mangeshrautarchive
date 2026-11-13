# Automatic portfolio calendar sync

Status: approved for implementation on 2026-11-13. Coding agent: GPT-6 / Codex. Exact model variant,
reasoning mode, and token usage: unavailable.

## Decisions confirmed by the owner

- Use hybrid cloud sync plus a Mac helper.
- Public Luma events and Google/Apple events explicitly marked Public; private reminders and passes require owner sign-in.
- Read both Google accounts, Apple Calendar and Reminders, and personal Luma events.
- Reconcile duplicates without deleting or rewriting the original calendar accounts.

## Approaches

Chosen: Cloudflare performs Google and Luma refreshes; a macOS EventKit helper uploads
Apple changes. Google and Luma continue updating while the Mac sleeps. Apple changes
catch up when the Mac is awake and online.

A Mac-only approach would make every source depend on this computer. A cloud-only
approach would not cover Apple Reminders through the documented EventKit interface.
Neither meets the chosen requirements as well.

## Architecture and scope

Extend the existing live Cloudflare Worker and Supabase storage; do not depend on
the disabled Vercel backend or commit changing calendar data to GitHub on each run.
Use separate calendar source records with account-specific credentials and cursors.
Reuse shared encryption and authorization primitives without changing existing
health or booking account selection. The existing single-provider token record must
not be overwritten when connecting the second Google account.

1. Google: connect each account separately using OAuth with calendar and Tasks read
   access. Enumerate selected calendars and task lists, paginate completely, then
   use incremental event cursors. Handle expired cursors with a full replacement of
   that source only. Keep event notifications distinct from standalone Google Tasks.
2. Luma: securely store and fetch the personal iCal subscription directly. Parse
   UIDs, recurrence, timezones, revisions, cancellations, and status when available.
   Do not infer Going or attendance from feed membership. Feed coverage includes
   approved, pending, and waitlisted registrations; unaccepted invitations may not
   appear. Preserve historical records with their source and last verification date.
3. Apple: a signed/permissioned EventKit executable reads selected Apple calendars
   and reminders. A LaunchAgent runs about every 15 minutes and on login. Export
   stable external identifiers and recurrence instance information. Store a scoped,
   revocable upload credential in Keychain, never in a tracked file or plist. Do not
   copy Google accounts already synced in the cloud through the Apple mirror.
4. Persistence: store source records and sync health separately from normalized
   event occurrences, private tasks, and private ticket references. Enable RLS and
   deny direct anonymous access to private tables. Serve an explicit public field
   allowlist through the Worker; do not rely on hiding private fields in the UI.
5. Public widget: fetch the sanitized event API on load and periodically while
   visible. Show last successful update and stale-source state. Keep verified public
   historical data as a fallback; do not append the old snapshot after every refresh
   or resurrect events removed by a successful live reconciliation.
6. Owner view: authenticate the configured owner through Google, validating identity
   and the owner allowlist server-side. Use short-lived HttpOnly sessions on the
   Worker origin and protect writes against CSRF. Show private reminders, source
   health, connection controls, and Luma pass access there. Do not put session tokens
   or private task data in the public bundle or browser localStorage.

The sync is one-way into the portfolio. Source accounts remain authoritative.
Completing or editing a provider reminder from the website is outside this release;
link to its source app. Existing browser-only reminders remain local and are labeled
accordingly, never silently uploaded or presented as provider-synced tasks.

## Passes and disclosure

Public cards contain approved event titles, dates, timezone, public venue information,
public event links, and known RSVP states. Provider-private events stay owner-only;
new calendars require an explicit publication choice before their contents go public.
Strip descriptions, attendee lists, personal contact details, private locations,
join links, subscription tokens, and ticket credentials from public responses.

Owner pass buttons open the canonical Luma event or ticket page in the owner's signed-in
Luma session. Actual QR codes and Apple Wallet passes remain in Luma. The personal feed
is not a ticket retrieval API; do not manufacture a pass or promise embedded QR codes.
Persist only verified private ticket references if available from an authorized source.

## Identity and reconciliation

Use provider account + calendar/list + item ID as the immutable source key. Match
cross-provider event copies using iCalendar UID + recurrence instance, or an explicit
verified Luma event identity. Normalize timestamps while preserving all-day dates and
the original timezone. A reschedule updates the same event, not a new title/date row.

Use exact normalized title/start/end only as a conservative fallback across different
sources; retain provenance and avoid merging different recurrence instances or two
same-source appointments. Never merge tasks just because their titles match.

Apply a source refresh atomically after all pages succeed. Process cancellations,
deletions, completed reminders, and recurrence exceptions. A partial fetch, timeout,
revoked connection, or sleeping Mac marks that source stale and preserves its previous
successful data. A valid empty response clears only the corresponding source/window.
Use per-source locking and idempotent uploads to avoid concurrent refresh duplication.

## Operations and activation

Target cloud refresh: every 15 minutes; actual latency includes provider propagation,
network delays, and the browser refresh interval. Apple refresh depends on Mac uptime.
Expose per-source last success, last attempt, and reconnect-needed state without secrets.

Activation requires validating existing Google OAuth configuration, connecting both
accounts with the needed read scopes, acquiring the owner's personal Luma feed, applying
the reviewed storage migration, deploying the Worker/frontend, and installing the Mac
helper with Calendar/Reminders access. Reuse existing granted access where sufficient;
stop at any required interactive account consent instead of claiming sync is active.

## Acceptance checks

- Both Google accounts coexist and refresh independently; revoked access is isolated.
- A Google/Luma/Apple copy renders once; separate recurring editions remain separate.
- Creation, reschedule, cancellation, deletion, completion, and timezone changes are
  exercised with fixtures; pagination and expired-cursor recovery are tested.
- Failed or partial sync never erases the last successful source data.
- Anonymous API calls cannot read reminders, private events, feed URLs, or passes.
- Owner session, CSRF, allowlist, upload replay, and credential revocation tests pass.
- A real read-only refresh from every connected source is verified before claiming
  activation; no personal calendar events are created as test fixtures without consent.
- Check the rendered public and owner views at 375px and 1440px in light/dark themes,
  keyboard access, reduced motion, touch targets, and horizontal overflow.
- Run project release gates, monitor deployment jobs, verify the deployed commit, and
  leave source accounts unchanged. Preserve unrelated work in the checkout.

## References

- [Google incremental synchronization](https://developers.google.com/workspace/calendar/api/guides/sync)
- [Google Tasks listing](https://developers.google.com/workspace/tasks/reference/rest/v1/tasks/list)
- [Apple EventKit retrieval](https://developer.apple.com/documentation/eventkit/retrieving-events-and-reminders)
- [Luma personal iCal syncing](https://help.luma.com/p/ical-syncing)
- [Luma registration and private join links](https://help.lu.ma/p/helpart-ULf0wUFr7qsv6r8/event-registration-process)
