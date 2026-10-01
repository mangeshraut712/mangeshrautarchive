# Website audit — October 1, 2026

Coding agent: GPT-6 / Codex. Purpose: sitewide browser verification, accessibility, reliable controls, publication routes, and responsive design. Exact model variant, reasoning mode, and token usage: unavailable.

## Scope

Review the homepage, Systems, Monitor, Travel, Uses, Changelog, 404, offline recovery, blog archive, all 18 articles, and five case studies. Preserve the existing design and content; fix reproducible defects.

## Changes

- Keep the complete navigation menu available at desktop and laptop widths. Verify all page links, dialog focus entry, Tab containment, Escape dismissal, and restored focus before and after deferred modules load.
- Restore the Travel map prompt inside the viewport. Place positioning on a wrapper so shared button styles cannot override it. Remove failed MapLibre loader scripts so a second attempt downloads again; announce failure and retain the places list.
- Restore component ownership of article and case-study evidence colors. Improve light-theme inline code and callout contrast. Make horizontally scrolling code examples keyboard-focusable.
- Give the case-study back link an accessible name when its label is hidden on mobile, and point it to the real Systems HTML page.
- Publish RSS, Atom, and sitemap links to generated HTML files rather than extensionless GitHub Pages paths.
- Generate the Systems article count from the canonical blog data without importing full article bodies. Synchronize Uses and quality metrics with 184 API tests and 11 critical journeys. Correct the Uses font descriptions to match the system font implementation.

## Verification

Record final test and deployment results with the release. Browser audits distinguish application errors from unavailable external services. Map download failure and retry are exercised with a deliberately blocked request; loading live map tiles requires external network access. The manual offline page remains a reconnect screen, not an offline cache.

### Local release results

- Eleven representative surfaces checked at 1440px and 390px in light and dark themes. Affected article and case-study states were rechecked after the cascade fix.
- All 18 articles and five case studies separately passed WCAG A/AA axe scans and horizontal overflow checks at mobile/light and desktop/dark settings.
- No application exceptions, duplicate IDs, broken loaded images, or missing fragment targets were found in the inspected states after corrections.
- Every local destination referenced by the generated sitemap, RSS, and Atom feed exists in the production output.
- Node 22 lint, Stylelint, anti-slop lint, formatting, security scan, and production build passed.
- All 184 API tests and all 11 critical browser journeys passed, including dialog keyboard behavior and two failed map-download attempts.
