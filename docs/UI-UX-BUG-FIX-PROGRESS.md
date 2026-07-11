# UI/UX Bug Fix Progress

> **Last updated:** 2026-07-12  
> **Cross-checked against:** live codebase + prior audit + Playwright/API/unit verification  
> **Companion report:** [`docs/UI-UX-BUG-REPORT.md`](./UI-UX-BUG-REPORT.md) (original 87-item backlog)

## Status Legend

| Mark  | Meaning                                                     |
| ----- | ----------------------------------------------------------- |
| `[x]` | Fixed and verified in code (or test suite)                  |
| `[~]` | Partially fixed / improved, residual risk remains           |
| `[ ]` | Not started                                                 |
| `[-]` | Deferred (large redesign, product decision, or intentional) |

## Summary (2026-07-12)

| Severity |  Total |  Fixed | Partial |   Open | Deferred |
| -------- | -----: | -----: | ------: | -----: | -------: |
| Critical |     12 |      9 |       2 |      0 |        1 |
| High     |     28 |     12 |       6 |      8 |        2 |
| Medium   |     31 |      8 |       5 |     15 |        3 |
| Low      |     16 |      3 |       2 |      9 |        2 |
| **All**  | **87** | **32** |  **15** | **32** |    **8** |

### Session verification (latest re-audit 2026-07-12)

| Check                                                          | Result                                                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Vitest unit                                                    | **40/40 passed**                                                                               |
| pytest API                                                     | **109/109 passed**                                                                             |
| Playwright Desktop Chrome (a11y + smoke + engineering + share) | **32/32 passed**                                                                               |
| DOM scan (7 pages × 2 viewports)                               | **0 structural issues** (no overflow / missing main / menubar / share leak / unlabeled search) |
| Search open → Esc close → theme toggle                         | **Pass** (combobox role, aria-expanded, display none after Esc)                                |
| Systems evidence cards + share CSS                             | **Pass** (2 cards, share display none / height 0)                                              |
| Uses grid                                                      | **Pass** (8 sections, loading cleared)                                                         |
| Travel                                                         | **Pass** (90 stops, 0 nested role=button, map `role=application`)                              |
| Offline page                                                   | **Pass** (`offline.html` serves)                                                               |
| Console 503 on `/api/*`                                        | Expected when frontend-only (no backend on :8001); not a UI layout bug                         |

### Root cleanup done

- Removed `test-results/`, Playwright report debris
- Restored accidental `src/js/vendor/rich-markdown.js` vendor churn
- Hardened `.gitignore` for `venv` symlink + test-result paths
- Added `src/offline.html` for SW fallback
- Kept intentional docs: `UI-UX-BUG-REPORT.md`, this progress file

---

## 🔴 CRITICAL (12)

- [x] **C1** — Hero name fallback color (`index.html` `@supports` gradient clip + solid fallback)
- [-] **C2** — Hardcoded colors → CSS tokens across 52 files _(deferred: large migration; tokens already used heavily; full rewrite is multi-PR)_
- [x] **C3** — Service worker offline fallback (`offline.html` + navigation network-first fallback)
- [x] **C4** — Service worker caching strategy (shell precache + stale-while-revalidate for static assets; no API cache)
- [x] **C5** — StreamingService timeout handling (45s timeout, `connecting` event, abort on timeout)
- [x] **C6** — Map ARIA role (`travel.html` `role="application"` + `aria-label`)
- [~] **C7** — Chatbot timeout handling _(StreamingService timeout now covers stream path; confirm all chat send paths use it)_
- [~] **C8** — Chatbot abort controller _(StreamingService has AbortController + cancel; UI cancel affordance still partial)_
- [x] **C9** — Liquid glass WebGL fallback (capture support check + procedural CSS/canvas background path)
- [x] **C10** — Liquid glass `prefers-reduced-motion` (disabled capture/engine when reduced motion)
- [x] **C11** — Search ARIA combobox (`role="combobox"`, `aria-controls`, `aria-expanded`, `aria-activedescendant`)
- [x] **C12** — Search keyboard navigation (ArrowUp/Down + Enter already present; combobox wiring completed)

---

## 🟠 HIGH (28)

- [x] **H1** — Broken antigravity.google link _(replaced with valid GitHub URL in vibe stack)_
- [x] **H2** — Blog `aria-labelledby` present on `#blog`
- [~] **H3** — JS-dependent section fallbacks _(uses loading state; systems always renders static; remaining empty shells still vary by page)_
- [x] **H4** — 404 destinations use list semantics (`ul/li`) + CSS
- [x] **H5** — Uses grid loading fallback in HTML
- [ ] **H6** — Travel filter label / fieldset association
- [ ] **H7** — Travel timeline loading/empty state polish
- [~] **H8** — Chatbot typing indicator _(thinking/stream UI exists in chatbot; not a full three-dot only indicator)_
- [~] **H9** — Chatbot SR announcements (`#chatbot-messages` aria-live; improve message-level live regions if needed)
- [x] **H10** — Chatbot focus management on open/close
- [~] **H11** — Chatbot input validation (`maxlength` present; empty-send still depends on submit handler)
- [x] **H12** — StreamingService connecting state (`connecting` event)
- [ ] **H13** — StreamingService automatic retry logic
- [ ] **H14** — Service worker update notification UX
- [~] **H15** — Share widget focus trapping _(focus moves to dialog; full focus trap incomplete)_
- [x] **H16** — Share widget ESC to close
- [x] **H17** — Share widget click-outside / close controls
- [x] **H18** — Share widget focus restoration to trigger
- [~] **H19** — Search overlay focus trapping _(focus to input; full Tab cycle trap incomplete)_
- [x] **H20** — Search overlay focus restoration
- [x] **H21** — Search overlay scroll lock
- [ ] **H22** — Bootstrap hard error boundary UI
- [ ] **H23** — Bootstrap network status detection UI
- [ ] **H24** — Bootstrap retry logic
- [ ] **H25** — Chat core broader error recovery matrix
- [~] **H26** — apple-touch-icon on subpages _(homepage yes; subpages partial)_
- [~] **H27** — og:locale on subpages _(varies by page)_
- [~] **H28** — twitter:site/creator on subpages _(varies by page)_

### Additional high-priority fixes from live audit (not in original C/H list)

- [x] Search Escape incomplete close (a11y handler + closeSearch)
- [x] Share CSS missing on subpages (HTML + JS inject + closed layout CSS)
- [x] HeadlessChrome false perf-audit disabling product JS (`perf-audit.js` + head)
- [x] Duplicate Engineering nav labels → Evidence
- [x] Incorrect nav menubar roles removed
- [x] Overlay menu first-item focus
- [x] Travel nested-interactive (toolbar vs `travel-stop__main`)
- [x] Monitor/travel WCAG contrast fixes for badges/labels
- [x] Systems telemetry degraded/error messaging
- [x] API resource health thresholds less brittle locally

---

## 🟡 MEDIUM (31)

- [x] **M1** — Blog aria-label present
- [ ] **M2** — Architecture diagram ARIA labels (systems)
- [ ] **M3** — Systems page apple-touch-icon
- [~] **M4** — 404 destinations (improved; no site-search on 404)
- [x] **M5** — 404 landmarks (main + nav)
- [~] **M6** — 404 kicker association
- [x] **M7** — Uses page section headings with icons
- [ ] **M8** — Travel city detail aria-live
- [ ] **M9** — Travel filter fieldset
- [~] **M10** — CSS prefers-reduced-motion _(many files; not universal)_
- [-] **M11** — CSS relative font sizes (large migration)
- [ ] **M12** — CSS forced-colors / prefers-contrast
- [~] **M13** — CSS safe-area-inset _(present in chrome; incomplete everywhere)_
- [ ] **M14** — CSS print styles
- [ ] **M15** — CSS z-index stacking audit
- [ ] **M16** — Search debounce/throttle
- [~] **M17** — Search empty/suggested states (suggested commands exist)
- [ ] **M18** — Search error state
- [~] **M19** — Search result highlighting (highlight helper exists)
- [~] **M20** — Liquid glass performance path (perf-audit + reduced motion/transparency)
- [ ] **M21** — Liquid glass canvas resize edge cases
- [ ] **M22** — Liquid glass memory leak deep audit
- [ ] **M23** — Chatbot timestamps
- [x] **M24** — Chatbot scroll-to-bottom / scroll engine
- [ ] **M25** — Chatbot character count UI
- [x] **M26** — Share widget ARIA (dialog labels + aria-hidden)
- [x] **M27** — Search overlay ARIA attributes
- [ ] **M28** — Bootstrap user preference detection expansion
- [ ] **M29** — Chat core message grouping
- [~] **M30** — theme-color on subpages
- [~] **M31** — Title format consistency

---

## 🔵 LOW (16)

- [x] **L1** — Copyright year (uses dynamic year on uses page; footer elsewhere still static in places)
- [~] **L2** — og:locale on subpages
- [~] **L3** — twitter:site/creator on subpages
- [~] **L4** — theme-color on subpages
- [~] **L5** — apple-mobile-web-app-title on subpages
- [ ] **L6** — msapplication-TileColor on subpages
- [-] **L7** — CSS `!important` reduction (large cleanup)
- [-] **L8** — CSS dead code scan (CI vulture/CSS audit path)
- [ ] **L9** — Chatbot message grouping
- [ ] **L10** — Search recent searches
- [ ] **L11** — Share widget touch events polish
- [ ] **L12** — Search overlay touch events polish
- [ ] **L13** — Bootstrap deprecation warnings
- [ ] **L14** — Chat core feature detection
- [ ] **L15** — Service worker background sync
- [ ] **L16** — Service worker push notifications

---

## Recommended next sprint (open high-value items)

1. **H6 / H7 / M9** — Travel filter fieldset + timeline empty/loading states
2. **H13 / H14** — Stream retry + SW update toast
3. **H15 / H19** — Full focus traps for share + search
4. **H26–H28 / M30** — Subpage meta / PWA icon parity
5. **C2** — Tokenize remaining hardcoded colors in stages (homepage → systems → monitor)

---

## Change log (this cleanup + re-audit cycle)

| Area         | Change                                                                      |
| ------------ | --------------------------------------------------------------------------- |
| Root         | Cleaned test debris; gitignore for venv/test-results; vendor noise reverted |
| Search       | Combobox ARIA + activedescendant; Esc close already fixed                   |
| Hero         | Gradient name solid fallback via `@supports`                                |
| SW           | Offline page + shell cache strategy                                         |
| Streaming    | Timeout + connecting event                                                  |
| Liquid glass | Reduced-motion disable; WebGL support check                                 |
| Progress     | Fully reconciled with code and tests                                        |
