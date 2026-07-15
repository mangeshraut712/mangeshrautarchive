# Plan 008: Shared escapeHtml utility and harden remaining innerHTML sinks

> **Drift check**: `git diff --stat 978494ee..HEAD -- src/js/modules/ src/monitor.html`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (complements DONE 005 Last.fm plan)
- **Category**: security | tech-debt
- **Planned at**: commit `978494ee`, 2026-07-15

## Why this matters

Dozens of modules and `monitor.html` inject HTML via `innerHTML`. Many correctly use a local `escapeHtml`, but the helper is **re-copied** (uses-page, analytics, monitor inline, blog-loader `escapeHTML`, etc.). Inconsistent helpers miss edge cases and invite the next copy-paste without escaping. A single utility + a short audit of high-risk sinks reduces XSS regression risk under CSP that still allows some inline patterns.

## Current state

- Local helpers: e.g. `src/js/modules/uses-page.js` lines 4–10; `src/monitor.html` `function escapeHtml`; blog-loader uses `this.escapeHTML`
- High-volume sinks: `src/monitor.html` (catalog, docs, events), `src/js/modules/github-projects.js`, `real-media-loader.js`, `agentic-actions.js`, `accessibility.js` (mostly static strings)
- Plan 005 already targets Last.fm artwork URLs specifically

**Conventions**: Vanilla ES modules with `.js` extensions in imports; single quotes; no TypeScript.

## Commands

| Purpose | Command         | Expected |
| ------- | --------------- | -------- |
| Unit    | `npm test`      | pass     |
| Lint    | `npm run lint`  | pass     |
| Check   | `npm run check` | pass     |

## Scope

**In scope**:

- New module e.g. `src/js/utils/escape-html.js` exporting `escapeHtml` (and optional `escapeAttr`)
- Unit tests `tests/unit/escape-html.test.js`
- Migrate **3–6** high-traffic modules that already define their own helper (start with: `uses-page.js`, `analytics.js` if present, `blog-loader.js`, one more module with duplicated helper)
- Document pattern in a one-line comment at top of util

**Out of scope**:

- Rewriting all of `monitor.html` to modules in one PR (too large) — either leave monitor local helper calling shared util if import is hard in classic script, or skip monitor and note follow-up
- CSP nonce migration
- Vendor code under `src/js/vendor/`

## Steps

### Step 1: Create utility

```js
// src/js/utils/escape-html.js
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

### Step 2: Unit tests

Cases: empty, null, `<script>`, quotes, ampersand. Match Vitest style of `tests/unit/MarkdownService.test.js`.

**Verify**: `npm test` includes new file and passes.

### Step 3: Migrate modules

For each selected module: `import { escapeHtml } from '../utils/escape-html.js'` (correct relative path), delete local duplicate, keep behavior identical.

**Verify**: `npm run lint` + `npm test`

### Step 4: Spot-check sinks

Search: `grep -n "innerHTML" src/js/modules/*.js | head -40`  
For any **user- or API-controlled** string still interpolated without escape, fix in the same PR only if small; otherwise list in plan maintenance notes as follow-ups.

Prefer `textContent` / `createElement` when rewriting is trivial (e.g. setting a single text node).

## Done criteria

- [ ] Shared util exists and is tested
- [ ] At least three modules import it instead of private helpers
- [ ] `npm run check` exit 0

## STOP conditions

- Build/esbuild does not bundle bare util imports for a page that still uses non-module scripts — adapt or skip that page
- A module’s local escape intentionally differs (document why)

## Maintenance notes

New HTML-building code should import `escape-html.js`. Consider a future lint rule or code review checklist item: “no raw API fields in innerHTML.”
