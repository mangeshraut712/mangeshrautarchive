# Apple calendar sync helper

Coding agent: GPT-6 / Codex. Purpose: private, one-way EventKit snapshots with
explicit selection and scoped Keychain credentials. Exact model variant, reasoning
mode, and token usage: unavailable. Requires macOS 14+, Xcode command line tools;
installation also uses Python 3. An existing stable signing identity is preferred,
but a local ad hoc build is supported with explicit opt-in; no paid developer
certificate is required for this local installation.

Nothing is installed, authorized, scheduled, or uploaded merely by building/testing.
Run `bash scripts/integrations/calendar-helper/test.sh` for local tests and a temporary
signed build. Test signing is ad hoc. A stable signing identity avoids tying macOS permissions
and Keychain access to an individual build. Ad hoc installation keeps macOS consent
and app-specific Keychain access intact; it does not weaken signing requirements,
reset TCC, disable Gatekeeper, or trust unrelated executables.

## Activation (owner-operated after backend deployment)

1. Copy `config.example.json` to a private location outside the repository. Set the
   HTTPS Worker upload endpoint. Placeholder selection IDs allow initial authorization;
   they cannot produce an upload. Remove a selection array if that resource is not used.
2. Set `CALENDAR_SIGNING_IDENTITY` to an existing Apple signing identity, then run
   `install.sh /absolute/path/config.json`. If no signing identity is available, run
   `install.sh /absolute/path/config.json --allow-ad-hoc-signing` instead. This builds the app in
   `~/Library/Application Support/PortfolioCalendarSync`, copies the private config,
   and creates a LaunchAgent plist. It does **not** start the agent.
3. Open the installed `CalendarSync.app` as a GUI application to grant EventKit access
   to the helper itself. Launching with no arguments performs **authorization only**
   using `~/Library/Application Support/PortfolioCalendarSync/config.json`; it never
   uploads. A native AppKit window and application run loop keep the helper alive
   through permission dialogs and display a readable success or failure until closed.
   GUI startup uses a synchronous main entry point so the native run loop can service
   the authorization task; command-line operations use a separate asynchronous task.
   `run.sh authorize` remains available, but a terminal launch may inherit
   the terminal or coding app's permission attribution. A successful terminal run
   does not establish that the LaunchAgent has access; verify the scheduled process
   separately after GUI consent. Apple names
   this permission “full access”; the helper never modifies any provider records.
   Then run `run.sh list-calendars` and edit the installed `config.json` with exact
   selected calendar and reminder-list IDs. This command prints calendar/list names
   and IDs for selection, never event/reminder content. Do not share this metadata.
4. Run `run.sh validate`. It checks access, all selections, full fetch completion,
   identity uniqueness, and snapshot encoding prerequisites without uploading.
5. Create a **scoped Apple upload credential** in the backend. Pipe it securely into
   `run.sh install-token`; stdin must be a pipe, never an argument or terminal input.
   Use an approved secret manager's stdout pipeline. Do not use shell literals,
   history, tracked files, or the Worker admin token. The helper cannot distinguish
   credential scopes locally; the backend must reject tokens without Apple upload scope.
   Keychain entries are bound to the exact endpoint and this service:
   `pro.mangeshraut.calendar-sync.apple-upload`.
6. Run `run.sh sync` and verify server source health. Only after success, use the
   `launchctl bootstrap gui/<uid> <plist>` command printed by the installer. The plist
   is `~/Library/LaunchAgents/pro.mangeshraut.calendar-sync.plist`.

The per-user LaunchAgent runs at login/load and every approximately 900 seconds while
logged in and awake. It does not wake the Mac or guarantee missed executions during
sleep. Launchd serializes this job; source locking and atomic reconciliation also belong
on the server. Stop only this job with
`launchctl bootout gui/$(id -u)/pro.mangeshraut.calendar-sync`. No broad process kills.
The app has no persistent background process between runs. Status/error logs contain
only generic outcomes and grow with executions; rotate them operationally if needed.

For upgrades, stop the job, rebuild with the same signing identity, then validate
permissions and Keychain access before reloading. With ad hoc signing, retain the
installed bundle at its fixed path and do not rebuild it on each scheduled run.
Changed builds have a different code identity: run `authorize` interactively again
and renew this helper's Calendar/Reminders permissions in System Settings if needed.
The existing Keychain item may also require explicit approval for the new build or
owner-managed replacement; never grant access to all applications. Noninteractive
sync deliberately fails instead of prompting for Keychain access. A fixed path alone
does not guarantee permission continuity. Actual EventKit consent and LaunchAgent
access on this Mac must still be verified; Apple's signing documentation establishes
per-build identity behavior, not a guarantee for every macOS permission state. The installer refuses to overwrite
an existing install. Revoke the server credential before removing the Keychain item
and the specific installation directory/plist. No uninstall command deletes data
implicitly.

## Selection and privacy

Both calendar ID lists are explicit; no selection means no collection for that type.
At least one list must be nonempty. Local and iCloud sources are allowed by default;
other sources require `allowOtherSources: true`. Google/Gmail/Googlemail source titles
are separately blocked unless `allowGoogleMirrors: true`. Account names are editable,
so this is a conservative convenience check, **not proof of provider identity**:
review each selected ID and leave Google accounts to cloud sync. Do not enable either
override simply to suppress a selection error.

Every event is uploaded with `visibility: "private"`. EventKit does not expose a
reliable Google-style Public flag in this implementation; no publication decision is
inferred from a title or calendar name. Event URLs remain private and can contain
sensitive join links. No notes, locations, attendee lists, alarms, or credentials are
collected. Reminder lists include completed and undated reminders; no content or
snapshot is printed. A server public endpoint must independently enforce its allowlist.

## Upload contract

`POST /api/calendar-sync/apple/upload`, JSON, `Authorization: Bearer <scoped-token>`.
HTTPS only, no URL credentials/query/fragment; redirects are refused. Ephemeral network
sessions avoid response caching. One full payload is submitted only after successful
collection. Errors never print provider descriptions, server bodies, item text, URLs,
or tokens. Snapshot payload:

- `schemaVersion: 1`, `snapshotId: UUID`, `generatedAt: ISO-8601 UTC`.
- `window: {start, end}`: ISO UTC, half-open event reconciliation window. Defaults to
  365 days before/after today; maximum total 1460 days (EventKit four-year limit).
- `calendars: [{id, title, sourceType, sourceTitle}]`: raw EventKit calendar IDs;
  `sourceType` is EventKit's integer source type.
- `events: [{id, calendarId, uid, recurrenceId?, title, start, end, allDay,
timeZone, visibility, url?, status}]`. Timed dates use UTC ISO strings. All-day
  dates use `YYYY-MM-DD` with exclusive end and preserved timezone. Status is
  `confirmed`, `tentative`, `cancelled`, or `unknown`; it is not an RSVP inference.
- `reminders: [{id, calendarId, title, due?, completed, completedAt?}]`. Date-only
  due values use `YYYY-MM-DD`; timed due/completion values use UTC ISO strings.
  Optional nil values are omitted, not serialized as empty strings.

IDs use SHA-256 over the Apple namespace, calendar ID, provider external identifier
(or EventKit local identifier when unavailable), and original recurrence occurrence
instant. Rescheduling a recurring exception preserves its original occurrence date;
missing recurrence identity aborts the upload. Calendar moves, account removal/re-add,
or EventKit database resets can change IDs. `uid` is the external identifier Apple
exposes and is not guaranteed to be a raw interoperable iCalendar UID for every provider.
Reminders have list-scoped identity; never merge them by title.

The backend must atomically reconcile selected source calendars plus the event window,
retain out-of-window history, replace selected reminder lists completely, and honor
idempotency, scoped credential revocation, and source locking. A valid empty result
clears only the selected scope. Do not replace unrelated Apple calendars or sources.
The helper aborts on missing access/selection, nil reminder fetch, 45-second fetch timeout,
store-change notifications during collection, or duplicate IDs. EventKit's synchronous
`events(matching:)` has no public error result; silent OS/provider cache failures cannot
be detected reliably. A successful fetch reflects the local EventKit cache, not proof
that iCloud just completed network synchronization. Full live consent/fetch/upload and
LaunchAgent execution must be verified during activation before claiming active sync.

References:
[Apple EventKit retrieval](https://developer.apple.com/documentation/eventkit/retrieving-events-and-reminders),
[external identifiers](https://developer.apple.com/documentation/eventkit/ekcalendaritem/calendaritemexternalidentifier),
[full access](https://developer.apple.com/documentation/eventkit/ekauthorizationstatus/fullaccess).

Local signing references:
[Apple code signing requirement language](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/RequirementLang/RequirementLang.html),
[Apple ad hoc signature semantics](https://developer.apple.com/documentation/security/seccodesignatureflags/adhoc),
[Apple DTS confirmation that changed ad hoc builds have new identities](https://developer.apple.com/forums/thread/819406).
