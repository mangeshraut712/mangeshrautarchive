# Plan 009: Characterization tests for critical frontend modules

> **Drift check**: `git diff --stat 978494ee..HEAD -- tests/unit/ src/js/modules/hero-flyout-position.js src/js/modules/analytics.js src/js/utils/`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `978494ee`, 2026-07-15

## Why this matters

Unit suite is ~50 Vitest tests focused on markdown/chat/config — strong for AI rendering, weak for portfolio chrome that changes weekly (hero flyouts, nav, asset version, dual-host config). Without characterization tests, refactors of `hero-flyout-position.js`, nav de-dupe, and analytics panel regressions ship uncaught until Playwright full suite (slow / not always local).

## Current state

- Tests live in `tests/unit/**/*.test.js`; runner: `npm test` (Vitest)
- Exemplar: `tests/unit/MarkdownService.test.js`, `tests/unit/vercel-routing.test.js`
- Critical untested (or lightly tested) modules:
  - `src/js/modules/hero-flyout-position.js` — `positionHeroFlyout` / music-slot anchoring
  - `scripts/build/asset-version.mjs` — ASSET_VER export shape
  - Optional: pure helpers extracted from analytics if any exist without DOM

## Commands

| Purpose | Command         | Expected                     |
| ------- | --------------- | ---------------------------- |
| Unit    | `npm test`      | all pass including new files |
| Check   | `npm run check` | exit 0                       |

## Scope

**In scope**:

- New tests under `tests/unit/` only
- Minimal export surface changes **only if required** to test pure functions (prefer testing existing `globalThis.positionHeroFlyout` after loading module in jsdom, or extract pure clamp/position math without rewriting UI)

**Out of scope**:

- Full Playwright expansion
- Snapshot testing entire HTML pages
- API pytest changes

## Steps

### Step 1: Asset version test

`tests/unit/asset-version.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { ASSET_VER, fontAwesomeStylesheet } from '../../scripts/build/asset-version.mjs';

describe('asset-version', () => {
  it('exports non-empty ASSET_VER', () => {
    expect(ASSET_VER).toMatch(/^\d{8}/);
  });
  it('builds fa stylesheet with version query', () => {
    expect(fontAwesomeStylesheet('', ASSET_VER)).toContain(`?v=${ASSET_VER}`);
  });
});
```

**Verify**: `npm test -- tests/unit/asset-version.test.js`

### Step 2: Hero flyout position characterization

Options (pick simplest that works in Vitest):

1. Import/evaluate `hero-flyout-position.js` in happy-dom/jsdom with fake `getBoundingClientRect` on anchor + music card, call `globalThis.positionHeroFlyout`, assert `style.left`/`top`/`width` and `is-flyout-covered` class on `#music-card`.
2. Or extract pure helpers `clamp`, `computeSlotLayout(slotRect, badgeRect, viewport)` into `src/js/utils/hero-flyout-layout.js` and unit-test that pure module — **only if import of existing IIFE is too painful**. Prefer no production refactor beyond a tiny pure export.

Assertions to lock:

- When music slot width > 160, flyout width matches slot width (±1px)
- left aligns with slot.left
- music card gets `is-flyout-covered` when open path runs

**Verify**: `npm test` green

### Step 3: Optional nav link de-dupe test

If `dedupeNavLinks` in `smart-navbar.js` is hard to import, skip. Do not force a large module split.

### Step 4: README / count

Ensure `npm test` still finishes under ~5s locally; no e2e.

## Done criteria

- [ ] ≥2 new unit test files covering asset version + flyout layout (or pure layout helper)
- [ ] `npm run check` pass
- [ ] No flaky timer-only tests without fake timers

## STOP conditions

- Module is pure IIFE with no testable surface and extraction would touch production CSS/positioning — write only asset-version test + document flyout as e2e-only
- Vitest cannot load browser globals for SW or modules that require `window` without config — use existing vitest.config patterns first

## Maintenance notes

Any future change to music-slot flyout positioning should update the characterization expectations in the same PR.
