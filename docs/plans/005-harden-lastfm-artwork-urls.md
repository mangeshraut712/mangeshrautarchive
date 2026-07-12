# Plan 005: Harden Last.fm artwork URLs (no raw URL in innerHTML)

> **Drift check**: `git diff --stat 915866f2..HEAD -- src/js/modules/lastfm.js`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `915866f2`, 2026-07-12

## Why this matters

`renderMusicShelf` builds `innerHTML` with unvalidated artwork URLs in `src` and inline `onerror=...`. Track titles are escaped, but URLs are not. Production CSP still allows `'unsafe-inline'` scripts, so attribute breakout is higher risk. Prefer DOM property assignment and URL allowlisting.

## Current state

`src/js/modules/lastfm.js` (~410–432 area per audit): string `innerHTML` with `src="${artwork}"` and `onerror="this.src='${fallback}'"`. `escapeHtml` exists on the class for text. `getBestImage` returns remote image URLs.

**Conventions**: Prefer DOM APIs over HTML strings when injecting remote data; keep module vanilla ES.

## Commands

| Purpose | Command        | Expected |
| ------- | -------------- | -------- |
| Unit    | `npm test`     | pass     |
| Lint    | `npm run lint` | pass     |

## Scope

**In scope**: `src/js/modules/lastfm.js`, optional unit test file  
**Out of scope**: Global CSP removal of `unsafe-inline` (larger plan); other shelves (books/movies) unless same pattern is one-line fix nearby

## Steps

### Step 1: Safe URL helper

Add:

```javascript
function isSafeHttpsUrl(value) {
  try {
    const u = new URL(String(value), 'https://example.invalid');
    return u.protocol === 'https:' || u.protocol === 'http:'; // prefer https only in prod
  } catch {
    return false;
  }
}
```

Prefer **https only** for remote artwork. Optionally allowlist host suffixes used by Last.fm/CDN (e.g. `lastfm.freetls.fastly.net`, `*.mzstatic.com`) — if allowlist is too strict and breaks artwork, fall back to https-only.

### Step 2: Stop string-injecting URLs

Refactor render path to:

- Create elements with `document.createElement`
- Set `img.src` only if `isSafeHttpsUrl(artwork)`; else use local fallback constant
- Use `img.addEventListener('error', …)` instead of inline `onerror` attribute
- Keep `escapeHtml` for text nodes / textContent

**Verify**: `grep -n "onerror=" src/js/modules/lastfm.js` → no matches for artwork path

### Step 3: Tests

Unit-test `isSafeHttpsUrl` / sanitizer:

- `javascript:alert(1)` → false
- `https://evil.com/a" onload="…` → parse fails or rejected
- valid https Last.fm-like URL → true

**Verify**: `npm test` pass

### Step 4: Done

Update docs/plans/README.md → 005 DONE

## Done criteria

- [ ] Artwork URLs not interpolated into HTML attribute strings
- [ ] No inline `onerror=` handlers for music shelf images
- [ ] `npm run check` exit 0

## STOP conditions

- Music shelf is rendered by a different module now — re-find with `renderMusicShelf` / `getBestImage`
- Changing render breaks layout CSS that depends on exact HTML structure — preserve class names on elements

## Maintenance notes

- Apply same pattern to any other `innerHTML` + remote URL in currently shelf (scan for `innerHTML` + `http` in `src/js/modules/currently.js` if present; fix only if identical issue and low risk).
