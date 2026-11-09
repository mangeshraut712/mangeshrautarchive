# Project showcase verification — November 10, 2026

Coding agent: GPT-6 / Codex desktop. Purpose: improve GitHub catalog accuracy, accessible project exploration, and bounded loading. Exact model variant, reasoning mode, and token usage: unavailable. Chatbot runtime unchanged.

## Findings and fixes

- Catalog pagination stopped at 100 repositories. The current public account has 107; pagination now deduplicates records and explicitly marks incomplete loads.
- Background activity hydration traversed the catalog (136 GitHub-related baseline requests during initial inspection). Hydration now follows visible cards: three on mobile, four on tablet, six on desktop. This is a bound on repositories hydrated, not total HTTP requests.
- Cached, bundled, partial, and live catalog states now disclose provenance. Zero counts remain zero; missing activity stays unknown. Loaded contributor and commit totals disclose coverage.
- The Worker forwards GitHub Link headers and exposes degraded-response metadata to browsers. FastAPI preserves cached pagination headers. Rate-limit fallback arrays are not treated as verified zero activity. See [GitHub pagination documentation](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api).
- Preview dialogs trap and restore focus; search supports Unicode, copy failures are announced, year failures clear stale contribution totals and offer retry, and heatmaps use one keyboard entry with arrow navigation.
- Project website links no longer imply every homepage is a running demo. Generated stats JSON follows repository formatting so scheduled syncs do not break formatting checks.

## Verification

- `npm run check`, `npm test`, and production build passed during implementation: 214 API, 37 Worker, 43 unit, and 20 critical browser checks.
- Showcase suite: eight scenarios across Chromium and WebKit, 16 passes. Covers 375/768/1440 widths, light/dark themes, full pagination, sorting, Unicode search, reset, previews, show-all, failure/retry, bounded hydration, keyboard navigation, and axe accessibility.
- Real-data visual inspection at 375, 768, and 1440 pixels in both themes: 107 repositories, no horizontal overflow, no page errors. Screenshots are local QA artifacts, not shipped assets.
- Security scan and all 23 desktop Tester Army journeys passed.
- Link audit: 69 repository homepages inspected; 68 returned HTTP 200. Reddit returned HTTP 403 to the automated request, so that link remains unverified rather than being classified as broken.

Activity values reflect the available GitHub API response and loaded subset; contributor results are capped by the endpoint page. GitHub rate limits, caching, and availability can affect freshness. Historical contribution years depend on the configured provider.
