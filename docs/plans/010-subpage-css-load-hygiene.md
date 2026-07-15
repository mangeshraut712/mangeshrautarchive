# Plan 010: Subpage CSS load hygiene (Systems / Monitor / Uses / Travel)

> **Drift check**: `git diff --stat 978494ee..HEAD -- src/systems.html src/monitor.html src/uses.html src/travel.html src/assets/css/`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf | tech-debt
- **Planned at**: commit `978494ee`, 2026-07-15

## Why this matters

Repo ships **~60k lines of CSS** across many files. Index alone links ~50 stylesheets. Subpages (systems/monitor/uses) each pull overlapping stacks (`monitor.css` + `systems.css` + `sitewide` + `sections-apple-premium` + liquid-glass + theme-solid, etc.). Cascade conflicts already required `!important` solid-surface overrides. Reducing **duplicate links** and ensuring **critical CSS first** improves FCP/LCP on subpages without a full design-system rewrite.

## Current state

- `src/systems.html` — `systems-critical.css` first (good), then deferred/full sheets
- `src/monitor.html` / `src/uses.html` — recently gained `systems-critical` for nav; still load large `monitor.css` / `systems.css`
- Prior advisor note (README): full CSS mega-bundle consolidation deferred as PERF-01 due to cascade risk

## Commands

| Purpose                   | Command                         | Expected                 |
| ------------------------- | ------------------------------- | ------------------------ |
| CSS lint                  | `npm run lint:css`              | exit 0                   |
| Check                     | `npm run check`                 | exit 0                   |
| Optional Lighthouse local | `npm run qa:lighthouse:desktop` | floors per project gates |

## Scope

**In scope**:

- Head `<link>` order and **dedupe** on `systems.html`, `monitor.html`, `uses.html`, `travel.html` only
- Ensure no stylesheet is linked twice (sync + noscript + deferred duplicates)
- Prefer: critical path = critical tokens + page-critical + solid surfaces; defer heavy glass/animation where safe
- Keep visual parity (solid white/black cards, nav pill)

**Out of scope**:

- Merging all CSS into one file
- Deleting large legacy files (`style.css`, `apple-premium-overrides.css`)
- Homepage index.html full cascade rewrite

## Steps

### Step 1: Inventory links

For each subpage HTML, list unique `href` of stylesheets (including `data-href` lazy). Flag duplicates.

**Verify**: document list in PR description; each page has unique hrefs only once.

### Step 2: Remove duplicates

Delete redundant `<link>` / noscript pairs that load the same CSS twice (common after dual progressive-enhancement blocks).

**Verify**: `grep -c 'href=.*systems.css' src/systems.html` etc. — no double full loads without reason.

### Step 3: Order

Recommended order:

1. `systems-critical.css` or page-critical equivalent
2. `theme-solid-surfaces.css`
3. Page-specific (`systems.css` / `monitor.css` / `travel-atlas.css`)
4. Shared design (`sitewide`, typography)
5. Decorative (liquid-glass, chrome) deferred with `media="print" onload="this.media='all'"` **only if already used elsewhere and visual check passes**

### Step 4: Visual smoke

Open each page light + dark:

- Nav readable, theme toggle visible
- Cards solid, not glass-milky
- Travel map still full-bleed

### Step 5: Lint

`npm run lint:css` + `npm run check`

## Done criteria

- [ ] No duplicate stylesheet hrefs per subpage head
- [ ] Visual smoke OK on four pages light/dark
- [ ] `npm run check` pass

## STOP conditions

- Removing a “duplicate” breaks FOUC or FOUC-prevention pattern intentionally loading twice for noscript — keep noscript-only fallback
- Lighthouse subpage score drops >5 points on Performance — revert deferral of critical file

## Maintenance notes

When adding CSS to a subpage, add **one** link in the critical or deferred group, not both. Prefer extending `systems-critical.css` for shared nav chrome over new one-off files.
