# UI/UX Bug Report — mangeshrautarchive

> **Generated:** 2026-07-12  
> **Scope:** All HTML pages, CSS files, JS modules, service worker  
> **Total Issues Found:** 87  
> **Progress tracker:** see [`docs/UI-UX-BUG-FIX-PROGRESS.md`](./UI-UX-BUG-FIX-PROGRESS.md) (reconciled after cleanup + re-audit)  
> **Re-audit snapshot:** unit 40/40 · API 109/109 · focused E2E 32/32 · DOM multi-page scan clean of structural blockers

---

## Severity Legend

| Severity        | Count | Description                                                      |
| --------------- | ----- | ---------------------------------------------------------------- |
| 🔴 **Critical** | 12    | Causes broken UI, invisible content, or complete feature failure |
| 🟠 **High**     | 28    | Significant accessibility or usability barrier                   |
| 🟡 **Medium**   | 31    | Moderate usability or polish issue                               |
| 🔵 **Low**      | 16    | Minor polish or edge case                                        |

---

## 🔴 CRITICAL Issues

### C1. Hero Name Invisible When CSS Gradients Fail

- **File:** `src/index.html` (lines 348–358, 384–390)
- **Problem:** The `<h1>` hero name uses `background-clip: text` with `-webkit-text-fill-color: transparent` and `color: transparent`. If the browser doesn't support CSS gradients or `background-clip: text`, the name "Mangesh Raut" is completely invisible. No solid-color fallback is provided.
- **Fix:** Add `color: #0071e3;` before the gradient/transparent declarations.

### C2. Hardcoded Colors Bypassing CSS Custom Properties (52 of 58 CSS files)

- **Files:** `style.css`, `about.css`, `homepage.css`, `blog.css`, `contact.css`, `awards.css`, `certifications.css`, `animations.css`, and 44 more
- **Problem:** Nearly all CSS files contain hardcoded hex/RGB colors (e.g., `#0071e3`, `#1d1d1f`, `#f5f5f7`, `#000`, `#fff`) instead of using CSS custom properties (`var(--apple-blue)`, `var(--apple-text)`, etc.). This prevents dynamic theme switching, breaks dark mode consistency, and makes maintenance error-prone.
- **Fix:** Replace all hardcoded colors with `var(--apple-*)` custom properties.

### C3. Service Worker Has No Offline Fallback

- **File:** `src/service-worker.js` (lines 28–30)
- **Problem:** The `fetch` handler is intentionally empty. When the user loses connectivity, every navigation request fails with the browser's default error page. No offline fallback HTML is served.
- **Fix:** Implement a cache-first or network-first strategy with an offline fallback page.

### C4. Service Worker Has No Caching Strategy

- **File:** `src/service-worker.js` (lines 28–30)
- **Problem:** No cache-first, network-first, stale-while-revalidate, or any other strategy is implemented. All requests go directly to the network with zero caching, making the PWA non-functional offline.
- **Fix:** Implement appropriate caching strategies for static assets and pages.

### C5. StreamingService Has No Timeout Handling

- **File:** `src/js/services/StreamingService.js` (entire file)
- **Problem:** Zero timeout logic exists. If the server hangs (TCP connection stays open but no data arrives), the user waits indefinitely. No `AbortSignal.timeout()`, no `setTimeout` watchdog, no configurable timeout parameter.
- **Fix:** Add configurable timeout with automatic abort and user-visible error.

### C6. Interactive Map Container Missing ARIA Role

- **File:** `src/travel.html` (lines 170–171)
- **Problem:** `<div id="map-container" class="travel-map"></div>` has no `role` (e.g., `role="application"` or `role="img"`) and no `aria-label`. Screen readers encounter a generic empty `<div>`.
- **Fix:** Add `role="application"` and `aria-label="World travel map with selectable countries and cities"`.

### C7. Chatbot Missing Timeout Handling

- **File:** `src/js/modules/chatbot.js`
- **Problem:** No request timeout is implemented. If the API server hangs, the chatbot appears to be "thinking" indefinitely with no way for the user to recover.
- **Fix:** Add configurable timeout (e.g., 30s) with user-visible error message and retry option.

### C8. Chatbot Missing Abort Controller Support

- **File:** `src/js/modules/chatbot.js`
- **Problem:** No `AbortController` is used. Users cannot cancel an in-flight request, and if the component unmounts, the request continues in the background.
- **Fix:** Create and use `AbortController` for each request; abort on unmount or user cancel.

### C9. Liquid Glass Engine Missing WebGL Fallback

- **File:** `src/js/modules/liquid-glass-engine.js`
- **Problem:** If WebGL is not supported or fails to initialize, there is no graceful fallback. The page may appear broken or the canvas remains blank.
- **Fix:** Detect WebGL support and provide a static CSS gradient fallback.

### C10. Liquid Glass Engine Missing `prefers-reduced-motion` Handling

- **File:** `src/js/modules/liquid-glass-engine.js`
- **Problem:** The engine does not check `prefers-reduced-motion`. Users who prefer reduced motion are forced to experience potentially distracting animations.
- **Fix:** Check `window.matchMedia('(prefers-reduced-motion: reduce)')` and disable or simplify animations.

### C11. Search Missing ARIA Combobox Pattern

- **File:** `src/js/modules/search.js`
- **Problem:** The search input does not use `role="combobox"`, `aria-expanded`, `aria-activedescendant`, or `aria-controls`. Screen reader users cannot effectively use the search feature.
- **Fix:** Implement the full ARIA combobox pattern with `aria-activedescendant` for result navigation.

### C12. Search Missing Keyboard Navigation

- **File:** `src/js/modules/search.js`
- **Problem:** Arrow keys do not navigate through search results. Users cannot select a result with the keyboard.
- **Fix:** Add keyboard event handlers for ArrowDown, ArrowUp, Enter, and Escape.

---

## 🟠 HIGH Issues

### H1. Broken Link: `antigravity.google`

- **File:** `src/index.html` (lines 1331, 1341)
- **Problem:** The URL `https://antigravity.google` appears twice in the vibe-stack marquee. This domain does not exist and will produce a 404/broken page.
- **Fix:** Remove or replace with a valid URL.

### H2. Blog Section Missing `aria-labelledby`

- **File:** `src/index.html` (line 3180)
- **Problem:** The `<section id="blog">` does not have an `aria-labelledby` attribute pointing to its heading.
- **Fix:** Add `aria-labelledby="blog-heading"` to the section.

### H3. JS-Dependent Sections Have No Fallback Content (All Pages)

- **Files:** `src/index.html`, `src/systems.html`, `src/monitor.html`, `src/travel.html`, `src/uses.html`
- **Problem:** Multiple sections are empty `<div>` elements populated by JavaScript. If JS fails or loads slowly, users see blank sections with no loading state, error state, or fallback content.
- **Affected containers:**
  - `index.html`: `#blog`, `#projects-grid`, `#experience-timeline`, `#skills-viz`
  - `systems.html`: `#systems-overview-grid`, `#systems-metrics-grid`, `#systems-case-flows`, `#systems-writing-grid`, `#systems-timeline`, `#systems-token-grid`
  - `monitor.html`: `#monitor-metrics-grid`, `#monitor-health-status`, `#monitor-logs`
  - `travel.html`: `#map-container`, `#travel-timeline`, `#city-detail-panel`
  - `uses.html`: `#uses-grid`
- **Fix:** Add loading spinners/skeletons and error states to all JS-rendered containers.

### H4. Navigation Links Lack List Semantics

- **File:** `src/404.html` (lines 100–105)
- **Problem:** The `<nav aria-label="Popular destinations">` contains bare `<a>` elements. Screen readers will not announce the number of items.
- **Fix:** Wrap links in `<ul><li>…</li></ul>`.

### H5. Uses Grid is JS-Dependent With No SSR Fallback

- **File:** `src/uses.html` (line 183)
- **Problem:** `<div id="uses-grid">` is empty in HTML. If JavaScript fails, users see a blank section.
- **Fix:** Add loading state and error state.

### H6. Filter Category Label Not Associated With Form Control

- **File:** `src/travel.html` (line 306)
- **Problem:** `<label class="travel-filter-label">Categories</label>` has no `for` attribute and doesn't wrap any form control.
- **Fix:** Wrap filter chips in `<fieldset>` with `<legend>Categories</legend>`.

### H7. Empty Timeline Container — No Loading or Empty State

- **File:** `src/travel.html` (lines 388–390)
- **Problem:** The timeline container is empty in HTML with no loading indicator or empty state message.
- **Fix:** Add loading skeleton and "No trips found" empty state.

### H8. Chatbot Missing Typing Indicator

- **File:** `src/js/modules/chatbot.js`
- **Problem:** While waiting for a response, there is no typing indicator or "thinking" animation. The UI appears frozen.
- **Fix:** Add a typing indicator (animated dots) while waiting for API response.

### H9. Chatbot Missing Screen Reader Announcements

- **File:** `src/js/modules/chatbot.js`
- **Problem:** New messages are not announced to screen readers. Users relying on assistive technology won't know when new content appears.
- **Fix:** Use `aria-live="polite"` region or `role="status"` for new messages.

### H10. Chatbot Missing Focus Management on Open/Close

- **File:** `src/js/modules/chatbot.js`
- **Problem:** When the chatbot opens, focus is not moved to the input field. When it closes, focus is not returned to the trigger button.
- **Fix:** Call `.focus()` on the input when opening and on the trigger when closing.

### H11. Chatbot Missing Input Validation

- **File:** `src/js/modules/chatbot.js`
- **Problem:** Empty or whitespace-only messages can be sent. No character limit is enforced.
- **Fix:** Disable send button when input is empty; add maxlength attribute.

### H12. StreamingService Missing Loading/Connecting State

- **File:** `src/js/services/StreamingService.js` (lines 39–63)
- **Problem:** The `stream()` method jumps straight into `fetch()` without emitting any `'connecting'` or `'loading'` event. The UI has no way to know the request has started.
- **Fix:** Emit a `'connecting'` event before starting the fetch.

### H13. StreamingService Missing Retry Logic

- **File:** `src/js/services/StreamingService.js` (lines 84–93)
- **Problem:** When a network error or HTTP error occurs, the error is emitted once and the service stops. No automatic retry or exponential backoff.
- **Fix:** Add configurable retry with exponential backoff.

### H14. Service Worker Missing Update Notification

- **File:** `src/service-worker.js` (line 8)
- **Problem:** `self.skipWaiting()` is called immediately on install. No `controllerchange` listener is registered. Users receive zero notification that the site has been updated.
- **Fix:** Add update notification UI with "Refresh" button.

### H15. Share Widget Missing Focus Trapping

- **File:** `src/js/modules/share-widget.js`
- **Problem:** When the share dialog is open, Tab and Shift+Tab can move focus outside the dialog, trapping keyboard users behind an invisible modal.
- **Fix:** Implement focus trapping within the dialog when open.

### H16. Share Widget Missing ESC to Close

- **File:** `src/js/modules/share-widget.js`
- **Problem:** Pressing Escape does not close the share dialog.
- **Fix:** Add `keydown` listener for Escape key.

### H17. Share Widget Missing Click-Outside to Close

- **File:** `src/js/modules/share-widget.js`
- **Problem:** Clicking outside the share dialog does not close it.
- **Fix:** Add click-outside handler on the backdrop/overlay.

### H18. Share Widget Missing Focus Restoration

- **File:** `src/js/modules/share-widget.js`
- **Problem:** When the share dialog closes, focus is not returned to the element that triggered it.
- **Fix:** Store the previously focused element and restore focus on close.

### H19. Global Search Overlay Missing Focus Trapping

- **File:** `src/js/modules/global-search-overlay.js`
- **Problem:** When the search overlay is open, Tab can move focus outside the overlay.
- **Fix:** Implement focus trapping within the search overlay.

### H20. Global Search Overlay Missing Focus Restoration

- **File:** `src/js/modules/global-search-overlay.js`
- **Problem:** When the search overlay closes, focus is not returned to the search trigger.
- **Fix:** Store and restore the previously focused element.

### H21. Global Search Overlay Missing Scroll Lock

- **File:** `src/js/modules/global-search-overlay.js`
- **Problem:** When the search overlay is open, the background page can still scroll.
- **Fix:** Set `overflow: hidden` on `document.body` when overlay is open.

### H22. Bootstrap Missing Error Boundary

- **File:** `src/js/core/bootstrap.js`
- **Problem:** If one module fails to load or initialize, there is no error boundary. A single module failure could block the entire page from rendering.
- **Fix:** Wrap each module initialization in try/catch with individual error reporting.

### H23. Bootstrap Missing Network Status Detection

- **File:** `src/js/core/bootstrap.js`
- **Problem:** No check for `navigator.onLine` or `window.addEventListener('offline', ...)`. The app doesn't adapt to offline state.
- **Fix:** Add online/offline detection and show appropriate UI.

### H24. Bootstrap Missing Retry Logic for Failed Resource Loads

- **File:** `src/js/core/bootstrap.js`
- **Problem:** If a module script fails to load, there is no retry mechanism.
- **Fix:** Add configurable retry for failed module loads.

### H25. Chat Core Missing Error Handling for API Failures

- **File:** `src/js/core/chat.js`
- **Problem:** API call failures may not be surfaced to the user in a friendly way.
- **Fix:** Add user-visible error messages for all API failure modes.

### H26. Head Section Inconsistency — Missing `apple-touch-icon` on Subpages

- **Files:** `src/systems.html`, `src/monitor.html`, `src/travel.html`, `src/uses.html`, `src/404.html`
- **Problem:** `index.html` has `apple-touch-icon` link tags but the subpages do not. iOS users saving subpages to home screen get a generic icon.
- **Fix:** Add `apple-touch-icon` links to all subpages.

### H27. Head Section Inconsistency — Missing `og:locale` on Subpages

- **Files:** `src/systems.html`, `src/monitor.html`, `src/travel.html`, `src/uses.html`, `src/404.html`
- **Problem:** `index.html` has `og:locale` but subpages do not.
- **Fix:** Add `og:locale` to all subpages.

### H28. Head Section Inconsistency — Missing `twitter:site`/`twitter:creator` on Subpages

- **Files:** `src/systems.html`, `src/monitor.html`, `src/travel.html`, `src/uses.html`, `src/404.html`
- **Problem:** `index.html` has Twitter card meta tags but subpages do not.
- **Fix:** Add Twitter card meta tags to all subpages.

---

## 🟡 MEDIUM Issues

### M1. Blog Section Missing `aria-label`

- **File:** `src/index.html` (line 3180)
- **Problem:** The blog section has no `aria-label` to distinguish it from other sections.
- **Fix:** Add `aria-label="Blog posts"`.

### M2. Architecture Diagram Containers Have No ARIA Labels

- **File:** `src/systems.html`
- **Problem:** Architecture diagram containers have no ARIA labels or fallback text.
- **Fix:** Add `aria-label` describing each diagram.

### M3. Systems Page Missing `apple-touch-icon`

- **File:** `src/systems.html` (line 42)
- **Problem:** Only a standard favicon is provided. iOS devices will not show a proper icon when saving to home screen.
- **Fix:** Add `apple-touch-icon` link tag.

### M4. 404 Page Missing Search or Fallback Mechanism

- **File:** `src/404.html`
- **Problem:** No search box, sitemap link, or "report broken link" option. Users who cannot find a relevant destination have no self-rescue path.
- **Fix:** Add a search box or link to the homepage.

### M5. 404 Page Extra Landmark From Skip-Links Wrapper

- **File:** `src/404.html` (line 68)
- **Problem:** `<div role="navigation" aria-label="Skip links">` adds an unwanted entry to the navigation landmarks list.
- **Fix:** Remove `role="navigation"` from the wrapper div.

### M6. 404 Page "Error" Kicker Text Disconnected From Heading

- **File:** `src/404.html` (line 73)
- **Problem:** The `<p class="error-kicker">Error</p>` is visually separated from the `<h1>` but not programmatically associated.
- **Fix:** Include the kicker text inside the `<h1>` or use `aria-describedby`.

### M7. Uses Page No Subheadings in Main Content

- **File:** `src/uses.html` (lines 174–193)
- **Problem:** `<h1>` present but no `<h2>`–`<h6>` headings in main content. If JS fails, there are no subheadings.
- **Fix:** Add static `<h2>` headings for each category.

### M8. Travel Page City Detail Panel Missing ARIA Live Region

- **File:** `src/travel.html`
- **Problem:** When city details are loaded dynamically, screen readers have no way to know the content changed.
- **Fix:** Add `aria-live="polite"` to the detail panel.

### M9. Travel Page Filter Chips Not in a Fieldset

- **File:** `src/travel.html` (line 306)
- **Problem:** Filter buttons are not grouped in a `<fieldset>` with `<legend>`.
- **Fix:** Wrap in `<fieldset><legend>Filter by category</legend>...</fieldset>`.

### M10. CSS Missing `prefers-reduced-motion` for Animations (Multiple Files)

- **Files:** `animations.css`, `style.css`, `homepage.css`, `about.css`, `awards.css`
- **Problem:** CSS animations and transitions lack `@media (prefers-reduced-motion: reduce)` wrappers.
- **Fix:** Wrap all non-essential animations in `@media (prefers-reduced-motion: no-preference)`.

### M11. CSS `font-size` in `px` Instead of Relative Units

- **Files:** `style.css`, `about.css`, `homepage.css`, `blog.css`, `contact.css`
- **Problem:** Many `font-size` declarations use `px` instead of `rem`/`em`, preventing users from resizing text via browser settings.
- **Fix:** Convert `px` font sizes to `rem` (base: 16px = 1rem).

### M12. CSS Missing `forced-colors` / `prefers-contrast` Support

- **Files:** All CSS files
- **Problem:** No `@media (forced-colors: active)` or `@media (prefers-contrast: high)` rules exist. Windows High Contrast Mode users may see invisible or poorly contrasted elements.
- **Fix:** Add forced-colors and prefers-contrast media queries.

### M13. CSS Missing `safe-area-inset` Handling

- **Files:** `style.css`, `homepage.css`
- **Problem:** Fixed-position elements (navbar, chatbot) do not use `env(safe-area-inset-*)` for notched devices.
- **Fix:** Add `padding: env(safe-area-inset-top)` / `padding: env(safe-area-inset-bottom)` to fixed elements.

### M14. CSS Missing Print Styles

- **Files:** All CSS files
- **Problem:** No `@media print` rules exist. Printed pages may waste ink on backgrounds, hide content, or break layouts.
- **Fix:** Add print stylesheet with `@media print` rules.

### M15. CSS z-index Stacking Conflicts Risk

- **Files:** `style.css`, `homepage.css`, `chatbot.css`
- **Problem:** z-index values are scattered (100, 1000, 9999, 10000, 2147483647) with no documented stacking context.
- **Fix:** Define z-index layers in a single location with documented values.

### M16. Search Missing Debounce/Throttle

- **File:** `src/js/modules/search.js`
- **Problem:** Every keystroke triggers a search, potentially overwhelming the API.
- **Fix:** Add debounce (300ms) on input.

### M17. Search Missing Empty State

- **File:** `src/js/modules/search.js`
- **Problem:** When no results are found, there is no "No results found" message.
- **Fix:** Show "No results found for '[query]'" message.

### M18. Search Missing Error State

- **File:** `src/js/modules/search.js`
- **Problem:** When the search API fails, there is no error message shown to the user.
- **Fix:** Show "Search failed. Please try again." message.

### M19. Search Missing Result Highlighting

- **File:** `src/js/modules/search.js`
- **Problem:** Search results do not highlight the matching query terms.
- **Fix:** Wrap matching terms in `<mark>` or `<strong>`.

### M20. Liquid Glass Engine Missing Performance Degradation for Low-End Devices

- **File:** `src/js/modules/liquid-glass-engine.js`
- **Problem:** No device capability detection. Low-end devices may experience jank or battery drain.
- **Fix:** Detect device capabilities and reduce shader complexity on low-end devices.

### M21. Liquid Glass Engine Missing Canvas Resize Handling

- **File:** `src/js/modules/liquid-glass-engine.js`
- **Problem:** If the canvas container resizes (orientation change, window resize), the canvas may not properly update its dimensions.
- **Fix:** Add `ResizeObserver` to handle canvas resizing.

### M22. Liquid Glass Engine Potential Memory Leak

- **File:** `src/js/modules/liquid-glass-engine.js`
- **Problem:** Missing cleanup/dispose method for WebGL resources when the component unmounts.
- **Fix:** Implement `dispose()` method that releases all WebGL resources.

### M23. Chatbot Missing Message Timestamps

- **File:** `src/js/modules/chatbot.js`
- **Problem:** Messages do not display timestamps, making it hard to understand conversation context.
- **Fix:** Add relative timestamps (e.g., "2m ago") to each message.

### M24. Chatbot Missing Scroll-to-Bottom on New Message

- **File:** `src/js/modules/chatbot.js`
- **Problem:** When a new message arrives, the chat may not auto-scroll to the bottom.
- **Fix:** Auto-scroll to bottom on each new message.

### M25. Chatbot Missing Character Count

- **File:** `src/js/modules/chatbot.js`
- **Problem:** No character count or visual indicator of remaining characters.
- **Fix:** Add character counter near the input.

### M26. Share Widget Missing ARIA Attributes

- **File:** `src/js/modules/share-widget.js`
- **Problem:** The share dialog lacks `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
- **Fix:** Add proper ARIA dialog attributes.

### M27. Global Search Overlay Missing ARIA Attributes

- **File:** `src/js/modules/global-search-overlay.js`
- **Problem:** The search overlay lacks proper ARIA attributes for a dialog/combobox pattern.
- **Fix:** Add `role="dialog"`, `aria-modal="true"`, `aria-label="Search"`.

### M28. Bootstrap Missing User Preference Detection

- **File:** `src/js/core/bootstrap.js`
- **Problem:** No centralized detection of `prefers-color-scheme`, `prefers-reduced-motion`, or `prefers-contrast` at bootstrap.
- **Fix:** Detect and store all user preferences at startup.

### M29. Chat Core Missing Message Grouping

- **File:** `src/js/core/chat.js`
- **Problem:** Consecutive messages from the same sender are not grouped, creating unnecessary visual repetition.
- **Fix:** Group consecutive messages and only show avatar/timestamp on the first.

### M30. Head Section Inconsistency — Missing `theme-color` on Subpages

- **Files:** `src/systems.html`, `src/monitor.html`, `src/travel.html`, `src/uses.html`, `src/404.html`
- **Problem:** `index.html` has `<meta name="theme-color">` but subpages do not.
- **Fix:** Add `theme-color` meta tag to all subpages.

### M31. Head Section Inconsistency — Title Format Inconsistency

- **Files:** All HTML pages
- **Problem:** Title formats are inconsistent:
  - `index.html`: "Mangesh Raut — Portfolio"
  - `systems.html`: "Systems — Mangesh Raut"
  - `monitor.html`: "Monitor — Mangesh Raut"
  - `travel.html`: "Travel — Mangesh Raut"
  - `uses.html`: "/uses — Mangesh Raut" (uses `/uses` prefix)
  - `404.html`: "404 — Mangesh Raut"
- **Fix:** Standardize title format across all pages.

---

## 🔵 LOW Issues

### L1. Hardcoded Copyright Year

- **Files:** All HTML pages
- **Problem:** `&copy; 2026` is hardcoded and will need manual updates annually.
- **Fix:** Use JavaScript to dynamically set the year.

### L2. Missing `og:locale` on Subpages

- **Files:** `src/systems.html`, `src/monitor.html`, `src/travel.html`, `src/uses.html`, `src/404.html`
- **Problem:** Social media crawlers cannot determine the page locale.
- **Fix:** Add `<meta property="og:locale" content="en_US">`.

### L3. Missing `twitter:site` / `twitter:creator` on Subpages

- **Files:** `src/systems.html`, `src/monitor.html`, `src/travel.html`, `src/uses.html`, `src/404.html`
- **Problem:** Twitter cards lack account attribution.
- **Fix:** Add `twitter:site` and `twitter:creator` meta tags.

### L4. Missing `theme-color` on Subpages

- **Files:** `src/systems.html`, `src/monitor.html`, `src/travel.html`, `src/uses.html`, `src/404.html`
- **Problem:** Browser chrome color is not set on subpages.
- **Fix:** Add `<meta name="theme-color" content="...">`.

### L5. Missing `apple-mobile-web-app-title` on Subpages

- **Files:** `src/systems.html`, `src/monitor.html`, `src/travel.html`, `src/uses.html`, `src/404.html`
- **Problem:** iOS home screen shortcut name is not set on subpages.
- **Fix:** Add `<meta name="apple-mobile-web-app-title" content="Mangesh Raut">`.

### L6. Missing `msapplication-TileColor` on Subpages

- **Files:** `src/systems.html`, `src/monitor.html`, `src/travel.html`, `src/uses.html`, `src/404.html`
- **Problem:** Windows tile color is not set on subpages.
- **Fix:** Add `<meta name="msapplication-TileColor" content="...">`.

### L7. CSS `!important` Usage

- **Files:** Multiple CSS files
- **Problem:** `!important` is used in several places, potentially overriding user preferences and making debugging difficult.
- **Fix:** Refactor to use specificity instead of `!important`.

### L8. CSS Dead Code / Unused Selectors

- **Files:** Multiple CSS files
- **Problem:** Some CSS selectors may target elements that no longer exist in the HTML.
- **Fix:** Audit and remove unused CSS.

### L9. Chatbot Missing Message Grouping

- **File:** `src/js/modules/chatbot.js`
- **Problem:** Consecutive messages from the same sender are not visually grouped.
- **Fix:** Group messages and only show avatar on the first in a group.

### L10. Search Missing Recent Searches

- **File:** `src/js/modules/search.js`
- **Problem:** No recent search history is stored or displayed.
- **Fix:** Store recent searches in localStorage and show them.

### L11. Share Widget Missing Touch Event Handling

- **File:** `src/js/modules/share-widget.js`
- **Problem:** Touch events may not be properly handled on mobile devices.
- **Fix:** Add touch event handlers alongside click handlers.

### L12. Global Search Overlay Missing Touch Event Handling

- **File:** `src/js/modules/global-search-overlay.js`
- **Problem:** Touch events may not be properly handled on mobile devices.
- **Fix:** Add touch event handlers.

### L13. Bootstrap Missing Console Warnings for Deprecated Features

- **File:** `src/js/core/bootstrap.js`
- **Problem:** No deprecation warnings are logged for legacy APIs or configurations.
- **Fix:** Add console.warn for deprecated features.

### L14. Chat Core Missing Feature Detection

- **File:** `src/js/core/chat.js`
- **Problem:** No feature detection before using modern APIs (e.g., `fetch`, `AbortController`, `EventSource`).
- **Fix:** Add feature detection with fallback messages.

### L15. Service Worker Missing Background Sync

- **File:** `src/service-worker.js`
- **Problem:** No background sync registration for failed requests.
- **Fix:** Register `sync` event for offline queued actions.

### L16. Service Worker Missing Push Notification Handling

- **File:** `src/service-worker.js`
- **Problem:** No `push` event listener for web push notifications.
- **Fix:** Add push event listener (if push notifications are planned).

---

## Summary by Category

| Category                     | Critical | High   | Medium | Low    | Total  |
| ---------------------------- | -------- | ------ | ------ | ------ | ------ |
| **Accessibility**            | 2        | 6      | 8      | 0      | 16     |
| **CSS/Styling**              | 1        | 0      | 6      | 2      | 9      |
| **JavaScript/Functionality** | 6        | 12     | 10     | 6      | 34     |
| **HTML Structure**           | 1        | 4      | 4      | 0      | 9      |
| **Service Worker/PWA**       | 2        | 1      | 0      | 2      | 5      |
| **Head/Meta Tags**           | 0        | 3      | 3      | 6      | 12     |
| **Performance**              | 0        | 2      | 0      | 0      | 2      |
| **Total**                    | **12**   | **28** | **31** | **16** | **87** |

---

## Top 10 Most Impactful Fixes (Priority Order)

1. **C1** — Fix hero name fallback color (content invisible without CSS gradients)
2. **C3/C4** — Implement service worker caching and offline fallback (PWA non-functional)
3. **C5** — Add timeout to StreamingService (chatbot can hang indefinitely)
4. **C7/C8** — Add timeout and abort controller to chatbot (same indefinite hang risk)
5. **C9/C10** — Add WebGL fallback and reduced-motion to liquid glass engine
6. **C11/C12** — Fix search ARIA combobox and keyboard navigation
7. **H3** — Add loading/error states to all JS-dependent sections (blank pages when JS fails)
8. **H15-H18** — Fix share widget focus trapping, ESC, click-outside, focus restoration
9. **H22-H24** — Add error boundaries and retry logic to bootstrap
10. **C2** — Migrate hardcoded colors to CSS custom properties (52 files affected)
