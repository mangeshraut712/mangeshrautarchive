# Plan 001: Fix AssistMe host detection, stream timeout, and server-AI recovery

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `docs/plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 915866f2..HEAD -- src/js/core/chat.js src/js/modules/chatbot.js tests/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `915866f2`, 2026-07-12

## Why this matters

On production apex (`mangeshraut.pro`), `initialize()` mis-classifies the host as a static mirror and, after any stream failure, `markServerUnavailable()` permanently disables server AI for the tab because recovery re-runs that broken path. Streaming also aborts at a hard **30s** while the server allows **60s**, so long answers cut mid-stream and flip the client into offline mode. Users see local/canned answers instead of AssistMe even though the API is healthy.

## Current state

- `src/js/core/chat.js` — API base + IntelligentAssistant
- `src/js/modules/chatbot.js` — widget close / stream consumer (abort wiring optional in this plan)

**Host detection treats custom domain as GitHub Pages** (`src/js/core/chat.js` ~163–182):

```javascript
const isGitHubPages =
  hostname.includes('github.io') ||
  hostname.includes('mangeshraut712.github.io') ||
  !navigator.onLine ||
  (window.location.protocol === 'https:' &&
    !['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) &&
    !hostname.endsWith('.vercel.app') &&
    !hostname.endsWith('.herokuapp.com') &&
    !hostname.endsWith('.netlify.app'));

if (isGitHubPages) {
  if (API_BASE && (API_BASE.includes('vercel.app') || API_BASE.startsWith('http'))) {
    this.canUseServerAI = true;
    // ...
  } else {
    this.isReadyState = true;
    return false; // leaves canUseServerAI false after markServerUnavailable
  }
}
```

**callApi gate** (~361–363) still requires `API_BASE.includes('vercel.app')` for github.io fallback.

**Hard 30s abort** (~392): `signal: AbortSignal.timeout(30000)`.

**Recovery** (~1088–1092): `markServerUnavailable()` sets `canUseServerAI = false` then `setTimeout(() => this.initialize(), 30000)`.

**Conventions**: Vanilla ES modules with `.js` import extensions; single quotes; Vitest under `tests/unit/`. Commit style: `fix(chatbot): …`.

## Commands you will need

| Purpose      | Command                | Expected on success |
| ------------ | ---------------------- | ------------------- |
| Unit tests   | `npm test`             | exit 0, all pass    |
| Lint JS      | `npm run lint`         | exit 0              |
| Format check | `npm run format:check` | exit 0              |
| Full check   | `npm run check`        | exit 0              |

## Scope

**In scope**:

- `src/js/core/chat.js`
- New unit tests (prefer `tests/unit/chat-api-base.test.js` or export pure helpers from `chat.js` for testability)
- Optional: `src/js/modules/chatbot.js` only if needed to pass AbortSignal into `chatAPI.ask` / closeWidget (see Step 4)

**Out of scope**:

- OpenRouter / `api/routes/chat.py` timeout changes (unless you only document alignment)
- Service worker registration
- Realtime voice WebSocket
- Rate limiting / security plans 002–005

## Git workflow

- Branch: `fix/chat-host-timeout-recovery`
- Commit messages: `fix(chatbot): recover server AI on apex and raise stream budget`
- Do NOT push unless the operator asked

## Steps

### Step 1: Extract pure host/API helpers

In `src/js/core/chat.js`, extract (or add) pure functions that can be unit-tested without full DOM boot:

- `isStaticMirrorHost(hostname)` → true only for `github.io` (and known static-only hosts), **not** for `mangeshraut.pro` or `*.vercel.app`
- `canEnableServerAI({ hostname, apiBase, online })` → true for:
  - loopback
  - `*.vercel.app`
  - hostname ends with `mangeshraut.pro`
  - static mirror **with** absolute `apiBase` starting with `https://` (any production API origin, not only `vercel.app`)
  - same-origin empty `apiBase` on apex / Vercel (API available at relative `/api/*`)

Replace the broad `isGitHubPages` block in `initialize()` to use these helpers. On recovery, always set `this.canUseServerAI = true` when helpers say yes.

**Verify**: `npm run lint` → exit 0

### Step 2: Fix `callApi` allow gate

Replace:

```javascript
hostname.includes('github.io') && API_BASE && API_BASE.includes('vercel.app');
```

with a helper that allows any configured absolute HTTPS API base or same-origin empty base when host is allowed.

**Verify**: `npm run lint` → exit 0

### Step 3: Align stream timeout

- Introduce a named constant, e.g. `SERVER_STREAM_TIMEOUT_MS = 90000` (or 60_000 to match server), used instead of bare `30000`.
- Prefer idle-style timeout only if easy; minimum bar is total budget ≥ server OpenRouter timeout (60s in `api/routes/chat.py`).
- On abort due to timeout, do **not** call `markServerUnavailable()` if some chunks already arrived (optional enhancement); at minimum, recovery after mark must re-enable AI (Step 1).

**Verify**: `grep -n "AbortSignal.timeout(30000)" src/js/core/chat.js` → no matches

### Step 4 (optional but recommended): Abort on widget close

If `chatbot.js` can pass an `AbortSignal` into `ask`/`callApi` without large refactor:

- Create controller per turn; abort in `closeWidget`.
- If this requires >30 lines of structural change, **skip** and note deferred in Maintenance.

**Verify**: `npm run lint` → exit 0

### Step 5: Unit tests

Add tests for pure helpers:

1. `mangeshraut.pro` + empty apiBase → server AI enabled
2. `mangeshraut712.github.io` + `https://mangeshraut.pro` → enabled
3. `mangeshraut712.github.io` + empty apiBase → disabled (or offline mode)
4. `localhost` → enabled
5. After simulated `markServerUnavailable` + `initialize`, apex re-enables (if you can unit-test the class with mocked hostname)

Export helpers for testing if needed (`export { isStaticMirrorHost, canEnableServerAI }` at end of module or small `chat-host.js`).

**Verify**: `npm test` → exit 0, new tests listed in output

### Step 6: Final gates

**Verify**:

```bash
npm run check
```

→ exit 0

Update `docs/plans/README.md` row 001 → `DONE`.

## Test plan

- New pure-function tests as above.
- Manual (operator): on local `npm run dev`, send a long streaming prompt; stream should exceed 30s without flipping to offline if server responds. After killing backend briefly then restoring, AssistMe should recover within ~30s without full reload.

## Done criteria

- [ ] `npm run check` exits 0
- [ ] No `AbortSignal.timeout(30000)` left in `chat.js`
- [ ] `initialize()` does not treat `mangeshraut.pro` as static-only
- [ ] `callApi` does not require `vercel.app` substring
- [ ] New unit tests cover apex + github.io + empty base cases
- [ ] No out-of-scope files modified
- [ ] `docs/plans/README.md` status updated

## STOP conditions

- `chat.js` structure no longer matches (class renamed / module split) — re-read and adapt only if still clearly the AssistMe entry; otherwise STOP.
- Changing exports breaks chatbot import graph and requires rewriting `chatbot.js` beyond optional Step 4.
- Tests require a full browser environment and cannot be unit-tested — report and propose a minimal exported helper module instead of inventing jsdom for the whole class.

## Maintenance notes

- Keep host allowlists next to `API_BASE` setup at top of `chat.js`.
- Reviewers: ensure custom domains added later are allowlisted.
- Deferred: shared `StreamingService` integration; durable rate limits (separate plan).
