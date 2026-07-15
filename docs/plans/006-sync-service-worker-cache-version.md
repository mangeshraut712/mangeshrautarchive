# Plan 006: Sync service worker CACHE_VERSION with ASSET_VER on every deploy

> **Executor instructions**: Follow step by step. Run every verification. If a STOP condition hits, stop and report — do not improvise. Update `docs/plans/README.md` status when done (unless a reviewer maintains the index).
>
> **Drift check (run first)**: `git diff --stat 978494ee..HEAD -- src/service-worker.js scripts/build/asset-version.mjs scripts/build/`
> If those files changed, re-read live excerpts before proceeding.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug | perf
- **Planned at**: commit `978494ee`, 2026-07-15
- **Implemented**: 2026-07-15 — `CACHE_VERSION = 'portfolio-shell-v__ASSET_VER__'` + build injects `ASSET_VER` before minify

## Why this matters

HTML/CSS/JS ship with `?v=ASSET_VER` (`20260716d` today), but the service worker still uses a hard-coded shell cache name:

```js
const CACHE_VERSION = 'portfolio-shell-v20260712w';
```

After deploys, returning visitors can keep an old offline shell while page assets are new (or the reverse). Users see stale chrome, broken paths, or “hard refresh required” behavior. One version string for shell cache + assets fixes that class of dual-host stale UX.

## Current state

- `scripts/build/asset-version.mjs` — single source of truth: `export const ASSET_VER = '20260716d'`
- `src/service-worker.js` lines 6–15 — hard-coded `CACHE_VERSION` + small `PRECACHE_URLS` allowlist
- Build already rewrites HTML/JS asset query strings from `ASSET_VER` (see `scripts/build/build.js` and generators)
- Activate handler already deletes old `portfolio-shell-*` caches when version changes — good; only the version string is stale

**Conventions**: Vanilla ESM; no React; prefer build-time injection over runtime imports in SW (SW cannot use node import of `.mjs` unless bundled). Match existing build patterns in `scripts/build/`.

## Commands you will need

| Purpose    | Command                  | Expected on success |
| ---------- | ------------------------ | ------------------- |
| Lint JS    | `npm run lint`           | exit 0              |
| Unit       | `npm test`               | all pass            |
| Full check | `npm run check`          | exit 0              |
| Security   | `npm run security-check` | no exposed secrets  |

## Scope

**In scope**:

- `src/service-worker.js`
- Build step that injects/syncs cache version (prefer one of):
  - `scripts/build/build.js` (or whatever copies SW to `dist/`), **or**
  - A tiny replace of `__ASSET_VER__` / `portfolio-shell-v${ASSET_VER}` at build time
- Optional unit/integration test that asserts dist SW contains current `ASSET_VER`

**Out of scope**:

- Expanding precache to all CSS/JS (would bloat offline cache)
- Changing fetch strategies (network-first vs cache-first) beyond version bump
- Push/PR unless operator asks

## Git workflow

- Branch: `fix/sync-sw-cache-version` (or `advisor/006-sync-service-worker-cache-version`)
- Commit style: `fix(pwa): sync service worker cache with ASSET_VER`

## Steps

### Step 1: Choose injection approach

**Preferred**: In `src/service-worker.js` set:

```js
const CACHE_VERSION = 'portfolio-shell-v__ASSET_VER__';
```

Then in the production build path that emits `dist/service-worker.js` (find with `grep -n "service-worker" scripts/build/*.js scripts/build/*.mjs`), replace `__ASSET_VER__` with the value of `ASSET_VER` from `asset-version.mjs`.

**Alternative** if build already string-replaces versions in JS: append the SW file to that replace list using the same helper.

**Verify**: `grep -n "CACHE_VERSION\|ASSET_VER\|service-worker" scripts/build/build.js scripts/build/*.mjs | head -40` — identify the write path before editing.

### Step 2: Wire CACHE_VERSION

After change, built SW must contain e.g. `portfolio-shell-v20260716d` (matching current `ASSET_VER`), not `20260712w`.

**Verify**:

```bash
npm run build
grep -n "CACHE_VERSION" dist/service-worker.js
# expect portfolio-shell-v + current ASSET_VER from asset-version.mjs
node -e "import {ASSET_VER} from './scripts/build/asset-version.mjs'; console.log(ASSET_VER)"
```

### Step 3: Keep activate cleanup

Do not remove the activate handler that deletes old `portfolio-shell-*` names. Confirm it still filters on prefix.

**Verify**: `grep -A20 "activate" src/service-worker.js` still deletes non-matching caches.

### Step 4: Optional test

Add a small unit or build-smoke test under `tests/unit/` or an assertion in an existing build test:

- Read `ASSET_VER` and assert `dist/service-worker.js` includes `portfolio-shell-v${ASSET_VER}` after build (skip if dist not built in unit env — then document manual verify only).

### Step 5: Done criteria checklist

Update `docs/plans/README.md` row 006 → `DONE`.

## Test plan

- Build locally; open DevTools → Application → Service Workers → confirm new cache name after reload
- Offline toggle still serves `offline.html` / shell
- `npm run check` green

## Done criteria

- [ ] `CACHE_VERSION` in shipped SW equals `portfolio-shell-v` + current `ASSET_VER`
- [ ] Bumping `ASSET_VER` alone + rebuild updates SW cache name without manual SW edit
- [ ] `npm run check` exit 0

## STOP conditions

- Service worker is generated entirely by a tool you cannot find — report path and stop
- Replacing version breaks GitHub Pages base path registration — report and stop
- Build does not copy `service-worker.js` to dist (registration path differs) — locate real registration in `src/js` first

## Maintenance notes

Whenever `ASSET_VER` is bumped for CSS/JS, SW cache automatically invalidates after next deploy. Document one line in `AGENTS.md` or `docs/STRUCTURE.md` under build: “SW cache version tracks ASSET_VER.”
