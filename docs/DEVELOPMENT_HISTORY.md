# Development history

Archived from the README on October 1, 2026. These dated records preserve contributor attribution and earlier implementation decisions; they are not a statement of current runtime behavior or test counts. See the [current README](../README.md) and [release changelog](../src/js/data/changelog-entries.js) for the maintained overview.

## Multi-agent development record

This repository is maintained across Codex/ChatGPT, Claude Code, Cursor, GitHub Copilot, and Google
Antigravity. [`AGENTS.md`](../AGENTS.md) is the canonical shared project briefing; platform-specific
files contain only the differences for that environment.

The runtime model behind AssistMe is independent of the coding agent that changed the repository.
The release record in [`src/js/data/changelog-entries.js`](../src/js/data/changelog-entries.js) tracks
shipped changes, their purpose, and the exposed coding model when the environment provides it.

Current documentation pass:

| Coding agent                          | Purpose                                                                                                                                                                                     | Exact variant / reasoning / token usage                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| GPT-5 / Codex                         | README accuracy audit, architecture consolidation, contributor onboarding                                                                                                                   | Unavailable from the active runtime                            |
| Grok 4.7 / Cursor                     | Live-site audit: Pages `/contact` redirect, feed and profile-image hosts, agent-map rewrite                                                                                                 | `grok-4.7`; reasoning unavailable; token usage unavailable     |
| Claude / Cursor                       | README status-snapshot refresh (Sep 22 CI + host facts) and GA4 reach-sync note                                                                                                             | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Systems Tokenization & AI Burn dashboard overhaul: Apple HIG Bento cards, 3-tab segmented telemetry, multi-IDE profiles                                                                     | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Anti-Slop (dmmulroy/anti-slop) Oxlint integration, vendoring, code cleanups, and repo doctor rules                                                                                          | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Portfolio-wide elevation: 15.75B telemetry sync across all surfaces, system monitor probe repair (handling paused Vercel), navbar fluid geometry, and dark mode globe atmospheric backlight | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Test hardening & UI resilience: E2E race condition fixes, eager monitor health/overview rendering, chatbot mid-stream aria-busy reset, and Vitest jsdom worker timeout tuning               | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Uses stack elevation: Separate all 10 AI tools with dedicated brand SVG squircles, dark-mode icon styling, Figma SVG squircle, 501-test gate sync, and E2E coverage                         | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Visual & system coherence: Travel Atlas active action palette (Route, Spotlight, Featured), Architecture Tree 501-test gate sync, and resilient Playwright cross-page audit harness         | Unavailable from the active runtime                            |
| GPT-5.6 Sol / Codex                   | September 2026 blog archive redesign, unified article artwork, and responsive visual QA                                                                                                     | `gpt-5.6-sol`; reasoning and token usage unavailable           |
| GPT-6 / Codex                         | Retire Vitest tests, focus CI on six built-site browser journeys and API tests, and repair blog routing and contrast regressions                                                            | Reasoning and token usage unavailable                          |
| GPT-6 / Codex                         | Generate and integrate 18 article-specific blog covers with Codex's built-in OpenAI image tool; verify mobile and desktop presentation                                                      | Image model identifier, reasoning, and token usage unavailable |
| GPT-6 / Codex                         | Audit all 18 blog pages, repair contrast and catalog coverage, and check recent financial and AI claims against primary sources                                                             | Reasoning and token usage unavailable                          |
| GPT-6 / Codex                         | Rework GitHub repository cards and homepage writing previews into a clearer editorial layout across desktop and mobile                                                                      | Reasoning and token usage unavailable                          |
| GPT-6 / Codex                         | Map 27 merged README screenshots to an image-led project gallery; remove repeated card details and group secondary Spatial and clone actions                                                | Reasoning and token usage unavailable                          |
| GPT-6 / Codex                         | Audit remaining repositories and add four verified README visuals to project cards, keeping chart labels and source dimensions accurate                                                     | Reasoning and token usage unavailable                          |
| GPT-6 / Codex                         | Add source-credited README imagery for two user-facing forks and mark their cards as forks; reject an empty simulator capture for the older SwiftUI trading app                             | Reasoning and token usage unavailable                          |
| GPT-6 / Codex                         | Verify README image coverage for 31 of 39 owned repos, align Featured with the curated gallery order, and reduce mobile utility overlap on cards                                            | Reasoning and token usage unavailable                          |
| GPT-6 / Codex                         | Make full blog pages the primary reading path, add 18 conceptual diagrams, normalize article depth, and verify archive and article journeys                                                 | Reasoning and token usage unavailable                          |
| GPT-6 / Codex                         | Review 18 blog articles against primary sources, correct dated claims, and expose evidence and source navigation in each article                                                            | Reasoning and token usage unavailable                          |
| Gemini 3.8 Flash / Google Antigravity | CodeQL security remediation: resolve all 4 open code scanning alerts down to 0, URL substring sanitization hardening, redirect safety, and doc sync                                         | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Elevate blog previews and repository cards with an in-situ modal preview and repository-supplied details                                                                                    | Unavailable from the active runtime                            |
| GPT-6 / Codex                         | Restore the GitHub Operating View above project cards and add repository-specific concept maps and readable GitHub data signals                                                             | Reasoning and token usage unavailable                          |
| GPT-6 / Codex                         | Clarify contact calendar availability, export browser tasks accurately, and keep event details out of the public free/busy response                                                         | Reasoning and token usage unavailable                          |
| GPT-6 / Codex                         | Simplify contact with guided message intake, a compact manual form, one Calendly action, and smaller responsive repository cards                                                            | Reasoning and token usage unavailable                          |
| Gemini 3.8 Flash / Google Antigravity | Restore canonical Apple system colors (#ff3b30, #ff453a, #34c759, #ffcc00), fix dev-all child process leaks, and stabilize Playwright E2E suite                                             | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Eliminate scroll mask and fadeIn contrast drops, elevate media CTA contrast (#004494), clean catch bindings across 20+ modules, and purge aria-busy locks                                   | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Link and verify commit provenance for all September 2026 changelog entries, integrate upstream improvements, and verify full-stack gates                                                    | Unavailable from the active runtime                            |
| GPT-6 / Codex                         | Import the authorized public 2026 Apple Calendar snapshot, deduplicate occurrences, and add day, week, month, and year views                                                                | Reasoning and token usage unavailable                          |
| Gemini 3.8 Flash / Google Antigravity | Restore Apple direct-manipulation scroll physics, eliminate WebKit repaint thrash, debounce section spy, and contain trackpad overscroll                                                    | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Zero-warning code quality remediation: fix Unicorn and ESLint warnings, typed Array.from initializers, startsWith migration, and anti-slop config                                           | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Apple-grade scrolling behavior & root scroller architecture overhaul: single-scroller hierarchy, mobile menu scroll hijack fix, modal overscroll containment, and rail scroll-snap          | Unavailable from the active runtime                            |
| Gemini 3.8 Flash / Google Antigravity | Eager section observer registration & Playwright CI resilience: decouple section activation from window.onload, add read button polling, and fix whoburnedmore launchd sync Node 24 path    | Unavailable from the active runtime                            |
| GPT-6 / Codex                         | Correct the monthly blog archive, research September Apple and OpenAI event articles, create matching editorial covers, and preserve publication provenance                                 | Exact variant, reasoning mode, and token usage unavailable     |
| GPT-6 / Codex                         | Audit all blog media, replace generated covers with original publisher assets, add provenance and attribution, and verify responsive rendering                                              | Exact variant, reasoning mode, and token usage unavailable     |
| GPT-6 / Codex                         | Audit the entire website, repair laptop navigation and travel map retries, improve reading accessibility, and synchronize publication routes and public metrics                             | Exact variant, reasoning mode, and token usage unavailable     |

The contact calendar displays a dated 2026 snapshot of the visible Apple Calendar sources on the author's Mac. To refresh it on macOS after granting Calendar access, run `npm run sync:apple-calendar -- --year=2026 --include-notes`, review the generated public `src/js/data/apple-calendar-snapshot.js`, and deploy the change. The import excludes the hidden Luma calendar and collapses identical occurrences. Website reminders are saved only in the current browser; they do not write back to Apple Calendar. The Kalnirnay link opens the official app page and does not import its almanac data.

No exact variant, reasoning mode, or token count is inferred when the runtime does not expose it.

Local visual audit (September 22, 2026): GPT-6 / Codex reviewed all 18 blog illustrations against
their articles, added access to full-size figures, preserved intrinsic image proportions, and
corrected escaped ampersands in the Razorpay caption. Several illustrations still require editorial
replacement or source verification; this audit does not certify their embedded claims. Exact model
variant, reasoning mode, and token usage: unavailable.

Local artwork refresh (September 27, 2026): Codex's built-in OpenAI image tool produced 18 new
article-specific covers. The exact image model identifier was not exposed, so these are not
attributed to a particular model version. Each new WebP is used for its article figure and the
corresponding archive card, while the original JPEGs remain in the repository. Figure captions now
describe conceptual artwork without asserting undocumented vendor internals. A September 27 follow-up
checked all 18 article pages and archive cards across mobile and desktop themes, corrected selected
Razorpay, NPCI, and TypeSafe claims, and generated the complete 18-post assistant catalog. The
[deploy workflow](https://github.com/mangeshraut712/mangeshrautarchive/actions/workflows/deploy.yml)
is the source of truth for publication status.

The September 30 media audit replaces 17 generated blog covers with relevant original publisher
images, screenshots, diagrams, or announcement artwork. Apple’s September article includes official
Duo and Pro / Pro Max press images. One X algorithm cover remains clearly labeled conceptual after
a documented source search. All 18 articles now show media credits and source or reference links,
and cards preserve full images without cropping. The [media audit](../docs/BLOG_MEDIA_AUDIT.md) and
[provenance manifest](../src/assets/data/blog-media-sources.json) provide complete per-article coverage.
The build gate verifies media hashes, unique assets, attribution, and fallback documentation.
GPT-6 / Codex performed source verification and responsive browser review; exact variant, reasoning
mode, and token usage were unavailable.

The September 29 archive edit keeps **18 active articles, exactly two per month from January
through September 2026**. September now covers Apple's September 9 event and OpenAI DevDay
on September 29; both new articles were published September 29. Razorpay Vulcan belongs to the
August 18 issue, with its original September 10 publication retained separately in the article,
structured metadata, and feeds. Retired UPI and TypeSafe URLs explain the topic replacement.
The build audit rejects invalid dates and monthly counts other than two. GPT-6 / Codex researched
primary sources and created two new conceptual covers with the built-in OpenAI image tool;
the image model identifier was unavailable. Archive cards and articles share each cover.

The September 27 reading pass makes homepage cards open complete articles directly. Previously
shared preview hashes also forward to the corresponding article. Each article has section navigation.
Each of the 18 articles includes a conceptual diagram, an image, a source section, and a chart,
framework, or data table. The `npm run audit:blog-content` build gate checks article length,
reading-time labels, heading structure, and media coverage. Conceptual diagrams and editorial
frameworks are labeled as such; they do not represent measured vendor performance.

The September 27 evidence pass adds a dated source update and direct source navigation to all 18
articles. It corrects the Cursor Origin release and beta scope, the Gemini Notebook rename, Wispr
privacy-setting distinctions, and Razorpay provenance. Article metadata now separates publication
from the editorial update date, and canonical URLs match the generated `.html` pages. The content
audit checks for dated evidence notes and multiple external links; vendor benchmarks remain labeled
as company-reported results. The release also keeps homepage text fully opaque during scroll
reveals so interactive labels retain accessible contrast.

The September 28 discovery pass moves repository cards ahead of the GitHub activity graph, gives
their descriptions and actions more space, and makes repository titles direct links. The homepage
writing shelf now presents the latest article and three recent stories; the complete 18-article
collection stays in the dedicated archive, where previews use two columns and the featured story
appears once. This removes the extra homepage filters and expansion control while preserving the
full article reading path.
