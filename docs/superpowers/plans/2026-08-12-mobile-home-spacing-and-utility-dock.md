# Mobile Home Spacing and Utility Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the mobile Home hero an Apple-style vertical rhythm and place the floating utility controls in a fixed bottom-right column.

**Architecture:** Keep the existing HTML and desktop layout. Change only the final mobile layout owner in `homepage-hero-polish.css`, the final mobile FAB authority in `theme-solid-surfaces.css`, and the focused Playwright assertions that encode those behaviors.

**Tech Stack:** Vanilla CSS, semantic HTML already in place, Playwright E2E, npm quality gates.

## Global Constraints

- Apply only at 768 pixels and below; desktop composition must remain unchanged.
- Preserve 44-by-44-pixel utility controls, solid Apple blue surfaces, white glyphs, and safe-area insets.
- Keep View Projects above Download Resume.
- Keep the dock hidden while the resume menu is open.
- Allow natural scrolling on short phones instead of shrinking text or tap targets.
- Do not introduce horizontal overflow.

---

### Task 1: Encode the vertical utility dock contract

**Files:**

- Modify: `tests/e2e/mobile-viewport.spec.js`
- Test: `tests/e2e/mobile-viewport.spec.js`

**Interfaces:**

- Consumes: Existing `.a11y-toolbar__main`, `#website-share-toggle`, `#chatbot-toggle`, and `#go-to-top` fixed controls.
- Produces: Browser assertions for a right-aligned vertical stack with 10-pixel gaps and safe viewport insets.

- [ ] **Step 1: Replace horizontal-row assertions with vertical-stack assertions**

Collect each visible control rectangle, sort by `top`, and assert:

```js
expect(layout.columnDelta).toBeLessThanOrEqual(2);
expect(layout.minimumGap).toBeGreaterThanOrEqual(8);
expect(layout.minimumGap).toBeLessThanOrEqual(12);
expect(layout.rightInset).toBeGreaterThanOrEqual(12);
expect(layout.bottomInset).toBeGreaterThanOrEqual(12);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx playwright test tests/e2e/mobile-viewport.spec.js --project="Pixel 7 Chrome" --grep="vertical utility dock" --workers=1
```

Expected: FAIL because the existing controls share one horizontal row.

### Task 2: Replace the mobile centered row with right-side slots

**Files:**

- Modify: `src/assets/css/theme-solid-surfaces.css:2400-2463`
- Test: `tests/e2e/mobile-viewport.spec.js`

**Interfaces:**

- Consumes: Existing `--fab-slot-*`, `--theme-fab-edge`, and safe-area CSS variables.
- Produces: One bottom-right column ordered from bottom to top as AssistMe, Share, Accessibility, and Back to Top when visible.

- [ ] **Step 1: Implement the minimal vertical dock**

Inside the existing `@media (width <= 768px)` rule, keep 44-pixel sizing and set every control to the same right inset with `left: auto`. Assign bottom slots using 44-pixel controls plus a 10-pixel gap:

```css
right: max(14px, env(safe-area-inset-right, 0px)) !important;
left: auto !important;
bottom: calc(max(14px, env(safe-area-inset-bottom, 0px)) + var(--mobile-fab-step) * n) !important;
```

- [ ] **Step 2: Run the focused dock test and verify GREEN**

Run the Task 1 command. Expected: PASS.

### Task 3: Restore deliberate mobile hero spacing

**Files:**

- Modify: `src/assets/css/homepage-hero-polish.css:434-572`
- Test: `tests/e2e/mobile-viewport.spec.js`

**Interfaces:**

- Consumes: Existing Home hero DOM and action order.
- Produces: Balanced standard-phone spacing plus top-aligned natural scrolling below 701 pixels of viewport height.

- [ ] **Step 1: Add spacing assertions**

At 500-by-862, assert the main wrapper gap and text-block gap are at least 12 pixels and the content does not overlap the utility dock. At a short-phone height, assert Home can exceed the visible viewport and the content starts below the navigation.

- [ ] **Step 2: Run the focused spacing tests and verify RED**

Run:

```bash
npx playwright test tests/e2e/mobile-viewport.spec.js --project="Pixel 7 Chrome" --grep="mobile hero spacing|short mobile hero" --workers=1
```

Expected: FAIL because both current computed gaps are 7 pixels.

- [ ] **Step 3: Implement adaptive spacing**

Use larger responsive padding and 0.85-to-1rem group gaps on standard phone heights. Retain the existing short-height top alignment while allowing auto height and normal scrolling. Do not alter fonts, tap-target sizes, action order, or desktop selectors.

- [ ] **Step 4: Run the focused spacing tests and verify GREEN**

Run the Task 3 test command. Expected: PASS.

### Task 4: Cross-browser and repository verification

**Files:**

- Verify: `src/assets/css/homepage-hero-polish.css`
- Verify: `src/assets/css/theme-solid-surfaces.css`
- Verify: `tests/e2e/mobile-viewport.spec.js`

**Interfaces:**

- Consumes: Tasks 1 through 3.
- Produces: Verified local mobile and desktop behavior without regressions.

- [ ] **Step 1: Run focused mobile suites**

```bash
npx playwright test tests/e2e/mobile-viewport.spec.js --project="Pixel 7 Chrome" --project="iPhone 14 Safari" --workers=1
```

Expected: all focused mobile tests pass.

- [ ] **Step 2: Run static quality gates**

```bash
npm run lint
npm run lint:css
npm run format:check
npm test
npm run build
npm run security-check
git diff --check
```

Expected: every command exits zero.

- [ ] **Step 3: Capture local browser evidence**

Use the running local server at `http://127.0.0.1:4000`, inspect 500-by-862 and 390-by-844 viewports, and save the final screenshot under `output/playwright/` without committing generated artifacts.
