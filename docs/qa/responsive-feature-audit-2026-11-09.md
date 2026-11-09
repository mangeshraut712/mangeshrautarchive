# Responsive page and feature audit — November 9, 2026

Coding agent: GPT-6 / Codex desktop. Purpose: resolve reading overlap and audit the portfolio across devices and themes. Exact variant, reasoning mode, and token usage: unavailable.

## Changes

- Mobile and tablet utility controls now form a bottom row through 768px, retaining 44px targets, safe-area spacing, and access to accessibility, share, chat, and back-to-top. Accessibility options open above the controls. Desktop keeps its vertical stack.
- Offline copy gives a reconnection instruction and no longer implies cached destinations exist. Uses identifies the portfolio architecture rather than an Apple event.
- Long case-study navigation titles truncate within their available space.
- Game difficulty buttons wait for the deferred game module before accepting input, preventing a lost first tap.
- Uses no longer presents an unverified frame-rate or LCP value as a current result.
- Numbered article workflows render as semantic ordered lists with readable step spacing, preserved starting numbers, inline formatting, and escaping.
- Structured form errors use readable fallback text instead of object coercion.
- Removed automatic service-worker registration based on unrelated browser feature detection. This contradicted the documented no-service-worker policy and caused deferred WebKit requests to bypass browser interception. Cleanup unregisters stale workers and clears their caches without clearing portfolio preferences.

## Route coverage

The built-site inventory contains 38 reader-facing HTML routes: the main portfolio and aliases, journal, 20 current articles, two retired-article notices, five case studies, systems, monitor, travel, uses, changelog, and error/offline pages. The GitHub redirect and Google verification document are utility endpoints, not visual pages.

Each route is inspected at 375, 768, and 1440 CSS pixels in light and dark themes. The browser captures the top, middle, and bottom of scrollable pages, checks page-level overflow, and detects failed loaded images. Long home-page aliases can redirect into the shared portfolio document; interaction suites separately exercise its navigation and sections. Captures are local QA artifacts, not replacement publisher media.

## Interaction coverage

| Area                              | Checks                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Navigation                        | Desktop links, mobile menu, keyboard focus restoration, command palette, case-study links                                                              |
| Journal and every current article | Search/filter combinations, canonical copying, reading progress, contents targets, typography, all image decoding and publisher credits                |
| Shared controls                   | Layout in both themes, accessibility expansion, glass controls, sharing, QR target, close/Escape, touch sizes, reduced motion                          |
| Contact                           | Standard and guided submission, validation, saved confirmation, rejected submission preserving drafts, calendar clocks, reminders and booking controls |
| AssistMe                          | Stream rendering, failure recovery, Stop, multimodal attachments, model metadata, WebMCP actions and storage denial                                    |
| Travel                            | Place search and empty state recovery, map load failure/retry, responsive header and available places                                                  |
| Systems / Uses / Monitor          | Section rendering, case-study navigation, quality labels, tool/control panels, named search, base security headers                                     |
| Music / identity                  | Compact artwork, preview play/pause rotation, reduced motion, system-theme favicon                                                                     |
| Changelog                         | Type filters, reset, disclosure and responsive layout                                                                                                  |

## Evidence and limits

The release uses the standard lint, API, Worker, unit, critical Chrome, secret-pattern, and build gates. Additional checks include Chrome/WebKit reader tests, desktop/mobile/tablet feature projects, both Tester Army targets, and a service-worker policy regression. The [route results](responsive-route-results-2026-11-09.json) record 228 successful route/device/theme states with zero page-level horizontal overflow and zero failed loaded images. One case-study state initially encountered a 404 while dist was rebuilding; its repeat after build completion passed. Changed surfaces received an additional 30 captures after the final fixes.

| Verification                                                                      | Result                                                        |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `npm run check`, `npm run security-check`, `npm run build`                        | Passed                                                        |
| `npm test`                                                                        | 213 API, 27 Worker, 34 unit, 20 critical Chrome checks passed |
| Tester Army, desktop Chromium and mobile WebKit                                   | 46 passed                                                     |
| Device feature projects, Chrome / Pixel / iPad WebKit                             | 87 passed                                                     |
| Dark-theme reader and feature matrix                                              | 156 passed                                                    |
| Utility row, service-worker policy and deferred-game regressions, Chrome / WebKit | 16 passed                                                     |
| Additional interaction sweep, three widths and two themes                         | 36 passed                                                     |

These suites overlap; their counts are not unique feature totals. Screenshot review and interaction checks were incremental, with the final changed-surface captures checking the last title and game fixes.

Form/newsletter/chat success and rejection tests use explicit mocked responses; they verify browser contracts without creating real messages or subscriptions. The route screenshots do not mock page content. Live production verification checks the deployed revision and representative changed surfaces. Physical-device microphone, OS speech voices, paid checkout completion, external booking completion, third-party availability, and every possible input are not established by this audit. No payments, calendar bookings, or real contact submissions are made for testing. Lighthouse CI audit mode is not a universal normal-load PageSpeed claim.
