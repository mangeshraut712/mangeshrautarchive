# Plan 004: Dual-host API base for newsletter (shared helper)

> **Drift check**: `git diff --stat 915866f2..HEAD -- src/js/modules/newsletter.js src/js/modules/lastfm.js src/js/utils/`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `915866f2`, 2026-07-12

## Why this matters

Newsletter subscribe uses `getApiBase()` that only special-cases `localhost` and otherwise returns `''`. On **GitHub Pages** there is no `/api/*`, so subscribe fails. Last.fm and other modules already resolve `github.io` → `https://mangeshraut.pro`.

## Current state

`src/js/modules/newsletter.js` (~7–12, 34):

```javascript
function getApiBase() {
  if (typeof globalThis !== 'undefined' && globalThis.location?.hostname === 'localhost') {
    return 'http://127.0.0.1:8001';
  }
  return '';
}
// ...
const response = await fetch(`${getApiBase()}/api/newsletter/subscribe`, {
```

Good pattern in `src/js/modules/lastfm.js` (~65–78): loopback → origin; `github.io` → `https://mangeshraut.pro`; else APP_CONFIG / origin.

## Commands

| Purpose | Command         | Expected |
| ------- | --------------- | -------- |
| Unit    | `npm test`      | pass     |
| Lint    | `npm run lint`  | pass     |
| Check   | `npm run check` | pass     |

## Scope

**In scope**:

- `src/js/modules/newsletter.js`
- Optional small shared helper e.g. `src/js/utils/api-base.js` **only if** you can migrate newsletter without large refactors; do not rewrite all modules in this plan

**Out of scope**: Contact form backend, marketing email provider changes

## Steps

### Step 1: Fix getApiBase

Match lastfm logic:

```javascript
function getApiBase() {
  if (typeof window === 'undefined') {
    return globalThis.APP_CONFIG?.apiBaseUrl || '';
  }
  const host = window.location.hostname;
  if (['localhost', '127.0.0.1', '0.0.0.0'].includes(host)) {
    return 'http://127.0.0.1:8001';
  }
  if (host.endsWith('github.io')) {
    return 'https://mangeshraut.pro';
  }
  // same-origin Vercel / apex
  return window.APP_CONFIG?.apiBaseUrl || '';
}
```

Ensure URL join does not produce `//api` double slashes: if base is `''`, path is `/api/newsletter/subscribe`; if base is absolute, use `${base}/api/newsletter/subscribe`.

**Verify**: `npm run lint` exit 0

### Step 2: Test

If pure function exported, unit-test host cases. Otherwise add a tiny exported helper in the same file for tests.

**Verify**: `npm test` pass

### Step 3: Done

Update docs/plans/README.md → 004 DONE

## Done criteria

- [ ] GitHub Pages host resolves to `https://mangeshraut.pro`
- [ ] Loopback uses `:8001`
- [ ] Apex/Vercel uses relative same-origin (`''` base + `/api/...`)
- [ ] `npm run check` exit 0

## STOP conditions

- Newsletter endpoint path changed in API — re-read `api/routes/general.py` for the correct path
- CORS on production would reject github.io for newsletter — report; do not invent CORS changes without checking `api/index.py` allowlist (github.io is already allowed for other APIs)

## Maintenance notes

- Long-term: one shared `resolveApiBase()` used by newsletter, lastfm, chat, health widgets.
