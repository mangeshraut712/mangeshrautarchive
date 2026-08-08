# Centered Home Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a centered, first-viewport homepage hero, show one large Namaste launch, open resume choices below the button, and use solid white/black surfaces.

**Architecture:** Keep the existing semantic hero markup and make `homepage-hero-polish.css` the final layout owner. Correct the launch first-paint state in critical CSS, simplify resume placement in the existing module, and bump the shared asset version so Safari cannot reuse the prior origin-specific CSS cache.

**Tech Stack:** Vanilla HTML, CSS custom properties, JavaScript ES modules, Vitest, Playwright.

## Global Constraints

- Preserve vanilla HTML, CSS, and JavaScript; do not add a UI framework or dependency.
- Light surfaces are solid `#ffffff`; dark surfaces are solid `#000000`.
- The Home section owns the first usable viewport and About starts below it.
- Preserve resume keyboard navigation, focus behavior, downloads, and dual-host-safe URLs.
- Preserve reduced-motion and automation handling for the launch intro.

---

### Task 1: Lock the visual contracts

**Files:**

- Modify: `tests/unit/portfolio-refresh-contract.test.js`
- Modify: `tests/e2e/smoke.spec.js`

**Interfaces:**

- Consumes: existing `#home`, `#about`, `.hero-layout-wrapper`, `#resume-dropdown-toggle`, and `#resume-dropdown-menu` DOM contracts.
- Produces: regression coverage for centered layout, About below fold, one launch paint state, and bottom resume placement.

- [ ] **Step 1: Add failing source contracts**

```js
it('owns a centered first-viewport hero and bottom resume menu', async () => {
  const [css, html, resume] = await Promise.all([
    read('src/assets/css/homepage-hero-polish.css'),
    read('src/index.html'),
    read('src/js/modules/resume-dropdown.js'),
  ]);
  expect(css).toContain('flex-direction: column !important');
  expect(css).toContain('min-height: calc(100svh - var(--site-nav-offset');
  expect(html).toMatch(/\.launch-intro-path\s*\{[\s\S]*?stroke-dashoffset:\s*1/);
  expect(resume).not.toContain("menu.dataset.placement = 'top'");
  expect(resume).toContain("menu.dataset.placement = 'bottom'");
});
```

- [ ] **Step 2: Run the unit contract and confirm RED**

Run: `npx vitest --run tests/unit/portfolio-refresh-contract.test.js`

Expected: FAIL because the desktop hero is a grid, the launch paths have no critical initial state, and the resume module still supports top placement.

- [ ] **Step 3: Update the browser contract**

```js
const metrics = await page.evaluate(() => {
  const home = document.querySelector('#home').getBoundingClientRect();
  const about = document.querySelector('#about').getBoundingClientRect();
  const layout = document.querySelector('.hero-layout-wrapper');
  return {
    display: getComputedStyle(layout).display,
    direction: getComputedStyle(layout).flexDirection,
    centerDelta: Math.abs(
      layout.getBoundingClientRect().left + layout.offsetWidth / 2 - innerWidth / 2
    ),
    aboutTop: about.top,
    viewportHeight: innerHeight,
    homeBottom: home.bottom,
  };
});
expect(metrics.display).toBe('flex');
expect(metrics.direction).toBe('column');
expect(metrics.centerDelta).toBeLessThanOrEqual(2);
expect(metrics.aboutTop).toBeGreaterThanOrEqual(metrics.viewportHeight - 1);
```

- [ ] **Step 4: Run the focused browser test and confirm RED**

Run: `npx playwright test tests/e2e/smoke.spec.js --project='Desktop Chrome' --grep='homepage hero'`

Expected: FAIL because the current desktop layout uses two grid columns and permits About to enter the first viewport.

### Task 2: Implement the centered hero and launch fix

**Files:**

- Modify: `src/assets/css/homepage-hero-polish.css`
- Modify: `src/index.html`

**Interfaces:**

- Consumes: existing hero DOM order and `is-playing` launch class from `src/js/core/bootstrap.js`.
- Produces: centered column layout and a hidden-until-animated Namaste path state.

- [ ] **Step 1: Replace desktop grid ownership with centered column ownership**

```css
#home.hero-section {
  min-height: calc(100svh - var(--site-nav-offset, 4.25rem) - 1px) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: clamp(1rem, 2.4vh, 1.75rem) 1rem !important;
}

#home.hero-section .hero-layout-wrapper {
  display: flex !important;
  width: min(100%, 48rem) !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
}
```

- [ ] **Step 2: Compact descendant spacing and center every hero group**

```css
#home.hero-section .profile-image-wrapper {
  width: 108px !important;
  height: 108px !important;
  min-width: 108px !important;
  min-height: 108px !important;
}

#home.hero-section
  :is(
    .hero-text-block,
    .hero-header,
    .hero-role-flip,
    .hero-insights-band,
    .hero-badge-cluster,
    .hero-body,
    .hero-footer,
    .hero-actions
  ) {
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
}
```

- [ ] **Step 3: Add the launch path state to critical inline CSS**

```css
.launch-intro-path {
  opacity: 0;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
```

The existing `.is-playing` animation remains the only reveal path.

- [ ] **Step 4: Run the focused unit and browser checks and confirm GREEN**

Run: `npx vitest --run tests/unit/portfolio-refresh-contract.test.js`

Run: `npx playwright test tests/e2e/smoke.spec.js --project='Desktop Chrome' --grep='homepage hero'`

Expected: both commands pass.

### Task 3: Place resume options below and invalidate stale assets

**Files:**

- Modify: `src/js/modules/resume-dropdown.js`
- Modify: `src/assets/css/homepage-hero-polish.css`
- Modify: `scripts/build/asset-version.mjs`
- Modify: `src/404.html`
- Modify: `src/about.html`
- Modify: `src/changelog.html`
- Modify: `src/gh.html`
- Modify: `src/index.html`
- Modify: `src/manifest.json`
- Modify: `src/monitor.html`
- Modify: `src/offline.html`
- Modify: `src/systems.html`
- Modify: `src/travel.html`
- Modify: `src/uses.html`

**Interfaces:**

- Consumes: `positionMenu()` and existing `ASSET_VER` build rewriting.
- Produces: `data-placement="bottom"`, solid menu surfaces, and a new shared cache key.

- [ ] **Step 1: Remove upward placement and position beneath the toggle**

```js
menu.style.bottom = 'auto';
menu.style.top = `${Math.round(toggleRect.bottom + gap)}px`;
menu.style.maxHeight = `${Math.max(160, window.innerHeight - toggleRect.bottom - gap - viewportPad)}px`;
menu.style.overflowY = 'auto';
menu.dataset.placement = 'bottom';
```

If the menu exceeds a short viewport, constrain its height and allow internal vertical scrolling instead of moving it above the button.

- [ ] **Step 2: Apply solid menu and secondary-control surfaces**

```css
.resume-dropdown-menu {
  background: #ffffff !important;
  background-image: none !important;
  backdrop-filter: none !important;
}

html.dark .resume-dropdown-menu {
  background: #000000 !important;
}
```

- [ ] **Step 3: Bump and propagate the asset version**

Change `ASSET_VER` to `20260808center1` and replace the prior token in source shells/templates so Vercel and GitHub Pages request the same new CSS URLs.

- [ ] **Step 4: Run regression and quality verification**

Run: `npm run check`

Run: `npm run security-check`

Run: `npm run build`

Run: `npx playwright test tests/e2e/smoke.spec.js tests/e2e/mobile-viewport.spec.js --project='Desktop Chrome' --project='iPhone 14 Safari'`

Expected: all commands exit 0 with no test failures.

- [ ] **Step 5: Review and commit**

Run: `git diff --check && git status --short`

Commit production and test changes with: `fix(home): restore centered first-viewport hero`
