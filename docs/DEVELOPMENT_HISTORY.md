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

## README attribution archive — preserved November 9, 2026

Historical implementation and verification notes moved out of the public overview. Dates and limitations below describe their original runs, not current service availability. Source links point back to the repository implementation.

### 5.1 Coding agents and provenance

**All-article research and content revision:** GPT-6 / Codex desktop; purpose: review primary sources for all 20 articles, correct unsupported product claims, add original worked examples and comparison tables, and record publisher-image provenance while preserving the Apple-style reader. Exact model variant, reasoning mode, and token usage: unavailable. See the [November 9 content evidence ledger](../docs/qa/blog-content-review-2026-11-09.md) for article-by-article sources, calculations, image limitations, and verification.

**Classic hero presentation and devotional support restoration:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: clean up hero section by removing recruiter quick-action strip and reverse interview chips, restoring clean personal narrative and portfolio callouts; restore classic devotional blessings and PayPal support card in Contact section. Exact model variant, reasoning mode, and token usage: unavailable.

**Journal reading experience:** GPT-6 / Codex desktop; purpose: improve all 20 article layouts, add archive search and sorting, preserve credited media and evidence links, and correct article-body reading progress. Exact model variant, reasoning mode, and token usage: unavailable. Focused verification: `tests/e2e/blog-reader.spec.js` (22 cases covering all articles and discovery controls).

**Apple Music iOS 27.2 monochrome design, sub-1s scrobble sync, Currently shelf real-time hydration, and WCAG AA contrast:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: resolve Last.fm scrobble latency by prioritizing authentic Last.fm CDN images over synchronous external iTunes queries in api/routes/media.py, slashing response times from >5s to <200ms; eagerly hydrate the Currently music shelf directly from Cloudflare Worker and local caches to eradicate solitary "No live playback" states; enforce iOS 27.2 monochrome Apple Music button design (pure black in light mode, pure white in dark mode, zero red) on solid #ffffff and #000000 card backgrounds without dull grey; and lock commercial advisory badge color contrast to 7.2:1 with #0056b3/#ffffff, passing all Axe accessibility gates. Exact model variant, reasoning mode, and token usage: unavailable.

**Recruiter Quick-Action Strip, Reverse Technical Interview Sandbox, Commercial Advisory, and Full GA4 Telemetry:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: deploy Hero Recruiter Quick-Action Strip with availability vitals, 1-click USA resume download, and 15m screen booking; deploy interactive "Reverse Technical Interview" evaluation sandbox with live architecture prompt chips connected to AssistMe; transform support section into high-value commercial "1:1 Architecture & AI Systems Advisory ($250 / 45-min session)" with Stripe checkout alongside open-source tips; and wire full GA4 conversion telemetry to all checkout channels (Stripe, PayPal, BMC, GitHub Sponsors), contact form submissions, newsletter subscriptions, and recruiter quick-actions. Exact model variant, reasoning mode, and token usage: unavailable.

**Apple Music iOS 27.2 monochrome design, 1s scrobble sync, Currently shelf parity, and 44px touch targets:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: modernize Apple Music button to iOS 27.2 monochrome design (pure black in light mode, pure white in dark mode, no red) on solid pure backgrounds with zero grey surfaces, eliminate the solitary "No live playback" void on Currently music shelf via immediate hydration from cache or curated tracks and eager preloading, implement 1-second ultra-low latency Last.fm scrobble syncing with direct Cloudflare Edge Worker failover, synchronize Currently shelf and Hero Music Card in real time, enforce strict vinyl rotation physics (spins strictly when playing or previewing, strictly stationary when idle), resolve offline dark button contrast to WCAG 2 AA (>4.6:1), and unify 44px Apple HIG touch targets across all surfaces. Exact model variant, reasoning mode, and token usage: unavailable.

**Debug Runner endless mode high scoring and leaderboard tracking:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: enable endless Normal mode loop progression past 1,000m allowing score to scale past 5,000, 10,000, and 50,000+ points without premature rooftop reset pedestal triggering (scoped strictly to Hard and Nightmare modes). Add stage loop indicator toast notifications, unclamp distance display in deployment failed card, expose window.debugRunnerGame handle, and verify 5,010, 10,020, and 50,020 automated playthroughs populating Top 3 leaderboard in light and dark themes. Exact model variant, reasoning mode, and token usage: unavailable.

**Debug Ascent: Rooftop Reset Edition and Apple Arcade upgrade:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: major Apple Arcade upgrade to the developer portfolio runner (`#debug-runner-section`) integrating mechanics from `poteto.com`'s viral Rooftop Reset. Features 3 difficulty tiers (Normal endless, Hard with stage checkpoints at 8.6x speed, Nightmare with 0 checkpoints at 10.5x speed resetting to localhost basement on collision), invulnerable Air Dash (Shift / X / D or mobile button with cyan particle trail and ground refueling cooldown), 6 cloud architecture ascending floors (Localhost -> Staging CI -> Code Review -> Kubernetes -> Global CDN -> Production Rooftop), oscillating titanium saws, duckable laser beams, hydraulic compiler compression gates, and an elevated glass pedestal with glowing red RESET button at 1,000m triggering victory state with clear time and death counter. Styled with Apple HIG frosted glass cards, native segmented pill difficulty switcher, tactile mobile controls (`SLIDE`, `DASH`, `JUMP` with specular shine), and sandbox-safe storage. Exact model variant, reasoning mode, and token usage: unavailable.

**Currently music shelf pre-hydration, zero-void resilience, and 1.5s scrobble sync:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: pre-render 6 rich curated tracks directly in HTML on the Currently music shelf, eliminate loading wipes and lonely empty-card voids in `start()` and `showLoadingState()`, accelerate live scrobble sync to 1.5s (3.5s idle) with direct Edge Worker fallback, enforce iOS 27.2 monochrome Apple Music branding, and guarantee spinning artwork strictly tracks active playback. Exact model variant, reasoning mode, and token usage: unavailable.

**WhoBurnedMore 23.12B telemetry sync, compact music card, and instant shelf hydration:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: synchronize WhoBurnedMore 23.12B tokens ($19,649 spend, rank #64 / 358 devs, 254 active days) across Systems, Uses, and Monitor surfaces, reduce hero music card width to 324px (312px mobile) for tighter visual balance, fix vinyl artwork hover rotation physics, eliminate Currently shelf loading void via instant hydration, and lower Last.fm scrobble latency to 2s. Exact model variant, reasoning mode, and token usage: unavailable.

**Live GitHub profile and metrics synchronization:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: synchronize public repositories (108 total, 42 original non-fork repos + 66 forks), total stars (13: 8 on Gravity-SaaS-Agent, 3 on Stanford-CS336, 1 on Dotfit-Fitness, 1 on mangeshrautarchive), total forks (4), followers (15), following (8), and 2026 contributions (4,865) directly from GitHub API via authenticated gh CLI. Elevate prominent starred projects in featured portfolio order, update systems overview metrics, and harden regressions test timing. Exact model variant, reasoning mode, and token usage: unavailable.

**Apple Music iOS 27.2 monochrome design and 5s scrobble sync:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: transition Apple Music icon from red to iOS 27.2 monochrome (solid black in light theme, pure white in dark theme), eliminate grey backgrounds in favor of solid pure white and black, enforce strict artwork spin when playing vs paused when idle, and reduce Last.fm sync latency from 25s down to 5s with instant tab/focus triggers. Exact model variant, reasoning mode, and token usage: unavailable.

**Resilient music edge proxy and curated fallback:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: eliminate empty music placeholder void and subtitle text truncation across hero music card and Currently music shelf via edge worker proxy fallback, curated playlist ("Hale Dil", "Main Yahaan Hoon", "Aadat", "Deewaana Deewaana", "Teri Deewani", "Aap Ki Kashish", "Kaho Na Kaho", "Zara Zara") with authentic artwork and 30s previews, and local development edge proxy. Exact model variant, reasoning mode, and token usage: unavailable.

**Music card brand colors and preview APIs:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: enforce authentic brand colors across all browsers (Spotify Green `#1DB954`, Apple Music Pink/Red `#FA243C`, Apple Blue `#0071e3` Play button), fix light and dark theme CSS color cascades for preview tag and timestamps satisfying WCAG 2 AA contrast, and enhance FastAPI backend media endpoints (`/api/music/artwork`, `/api/music/details`, `/api/music/preview`) to resolve and return full rich iTunes metadata with 30-second audio preview streams. Exact model variant, reasoning mode, and token usage: unavailable.

**Music card compact proportions and vinyl rotation:** Gemini 3.8 Flash, in Google Antigravity IDE; purpose: right-size hero music card container width (352px) narrower than hero sections below, restore spinning vinyl artwork rotation whenever music is actively playing or previewing, and refine Spotify and Apple Music hover states while guaranteeing 44px touch targets. Exact model variant, reasoning mode, and token usage: unavailable.

**System-theme tab icons and music controls:** GPT-6 / Codex desktop; purpose: keep browser favicons legible in both OS themes with explicit contrasting icon backgrounds, enlarge music artwork and symbols, and preserve accessible hit areas around smaller visible controls. Exact model variant, reasoning mode, and token usage: unavailable.

**Compact music player:** GPT-6 / Codex; purpose: compact the hero music card, place controls at the upper right, and bind artwork rotation to preview playback. Exact model variant, reasoning mode, and token usage: unavailable.

**Tester Army contribution:** GPT-6.1 Sol / Codex; purpose: deterministic browser journeys and coverage boundaries. Reasoning mode and token usage: unavailable. Independent verification uses GPT-6 Luna / Codex.

**Responsive audit fixes:** GPT-6 / Codex desktop; purpose: stabilize first paint and improve travel navigation and contact contrast. Exact variant, reasoning mode, and token usage: unavailable.

**Full-load performance work:** GPT-6 / Codex desktop; purpose: reduce startup work and measure real page loads while preserving the responsive interface. Exact variant, reasoning mode, and token usage: unavailable.

**Animation scheduling:** GPT-6 / Codex desktop; purpose: batch offscreen animation checks and retain newly added elements. Exact variant, reasoning mode, and token usage: unavailable.

**Style loading and accessibility:** GPT-6 / Codex desktop; purpose: prevent redundant stylesheet work and align accessible names with visible labels. Exact variant, reasoning mode, and token usage: unavailable.

**Dependency and audit review:** GPT-6 / Codex desktop; purpose: align Python dependency pins, address a test hostname finding, and document score limitations. Exact variant, reasoning mode, and token usage: unavailable.

**Frontend characterization:** GPT-6 / Codex desktop; purpose: cover the asset-version contract and hero flyout behavior with focused Node tests. Exact variant, reasoning mode, and token usage: unavailable.

**Lighthouse evidence:** GPT-6 / Codex desktop; purpose: record raw lab results and their measurement limits. Exact variant, reasoning mode, and token usage: unavailable.

**Sitewide score record:** GPT-6 / Codex desktop; purpose: document full-load mobile and desktop measurements for each published URL. Exact variant, reasoning mode, and token usage: unavailable.

**Portfolio fact corrections:** GPT-6 / Codex desktop; purpose: correct stale references and score labels, and fit case-study metrics on narrow screens. Exact variant, reasoning mode, and token usage: unavailable.

**WebMCP compatibility:** GPT-6 / Codex desktop; purpose: support the current document API and add read-only blog and case-study tools. Exact variant, reasoning mode, and token usage: unavailable.

**Worker deployment repair:** GPT-6 / Codex desktop; purpose: resolve the Wrangler dependency conflict in the Worker deployment workflow. Exact variant, reasoning mode, and token usage: unavailable.

**Deep-link alignment:** GPT-6 / Codex desktop; purpose: keep initial homepage section links aligned as content loads and respect visitor scrolling. Exact variant, reasoning mode, and token usage: unavailable.

**Portrait and icon sizing:** GPT-6 / Codex desktop; purpose: align responsive image metadata and reserve Experience icon dimensions before their stylesheet loads. Exact variant, reasoning mode, and token usage: unavailable.

**Desktop Contact startup:** GPT-6 / Codex desktop; purpose: prepare existing disclosure controls before direct Contact navigation settles. Exact variant, reasoning mode, and token usage: unavailable.

**Deep-link music loading:** GPT-6 / Codex desktop; purpose: defer offscreen homepage music on section deep links until Home is visible. Exact variant, reasoning mode, and token usage: unavailable.

**Music artwork sizing:** GPT-6 / Codex desktop; purpose: reduce the Last.fm image payload for the compact hero disc while retaining high-density display coverage. Exact variant, reasoning mode, and token usage: unavailable.

**First-paint styles:** GPT-6 / Codex desktop; purpose: apply existing layout styles before page load to reduce late style recalculation. Exact variant, reasoning mode, and token usage: unavailable.

**Mobile Contact startup:** GPT-6 / Codex desktop; purpose: prepare existing section disclosures earlier for mobile Contact links and measure layout stability. Exact variant, reasoning mode, and token usage: unavailable.

**First-visit greeting:** GPT-6 Astra / Codex desktop; purpose: run the greeting during loading, release ready content independently of the application bundle, and parse the complete hero before loading its badge enhancements. Localhost and automation use the same first-visit behavior as production. Reasoning mode and token usage: unavailable.

**Input-aware loading:** GPT-6 Astra / Codex desktop; purpose: prevent scripted scrolling from starting analytics early and load Contact widgets when relevant. GA4 configuration, queued events, idle fallback, and page-exit loading remain covered by regression tests. Reasoning mode and token usage: unavailable.

**Shared layout delivery:** GPT-6 Astra / Codex desktop; purpose: stabilize shared styles before first paint, reduce repeated layout work, and correct Lighthouse browser selection. Reasoning mode and token usage: unavailable. Normal-load verification remains in progress; this is not a claim of universal 100 scores.

**Contact style warm-up:** GPT-6 / Codex desktop; purpose: prevent offscreen section styles from shifting a direct Contact link during idle loading. Exact variant, reasoning mode, and token usage: unavailable.

Mangesh Raut maintains this portfolio with contributions from Codex, Claude Code, Google Antigravity,
Cursor, and GitHub Copilot. Shipped changes record the exposed agent/model family, engineering
purpose, and verified commit in the [changelog](../src/js/data/changelog-entries.js).

| Current contribution                             | Attribution                                                                                                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coding agent                                     | Composer, in Cursor                                                                                                                                                                            |
| Purpose                                          | Live WhoBurnedMore telemetry refresh (22.89B tokens, #61 of 357), cross-surface Systems/Uses/Monitor sync, smoke assertion alignment, and sync-whoburnedmore.mjs formatting hardening          |
| Exact model variant, reasoning mode, token usage | unavailable                                                                                                                                                                                    |
| Portfolio chatbot model                          | Configured separately in [api/model_router.py](../api/model_router.py) and [Worker configuration](../workers/assistme-chat/wrangler.toml); each live response reports the actual serving model |

**Analytics workflow token review:** GPT-5 / Codex desktop; purpose: limit the review-artifact workflow to read-only repository access. Exact variant, reasoning mode, and token usage: unavailable.

**AssistMe verification — October 3, 2026:** GPT-6 / Codex in Codex desktop; purpose: live multimodal verification, accurate model labels, billing provenance, and responsive chatbot reliability. Exact variant, reasoning mode, and token usage: unavailable.

AssistMe on GitHub Pages uses the Cloudflare Worker at
`https://assistme-chat.mangeshraut712.workers.dev`. The frontend checks `/api/chat/health`
and sends chat requests to `/api/chat` on that host. An unavailable AI provider falls back to
explicitly labeled local answers. Interrupted streams discard the failed attempt before trying
another model; provider token usage is retained when supplied, and estimates remain labeled.
The chat window uses the available area below navigation, with a scrolling transcript and a
reachable composer. The deployed-host browser regression covers routing, fallback resets, and
final-frame metadata in Chrome and Safari. It is included in the 18-journey critical Chrome
release gate; Safari is also checked separately when changing this path.

Coding attribution in historical entries is contributor-reported in commit messages. A verified
commit link confirms the repository reference; it does not authenticate the actual model runtime.
Missing model, tool, reasoning, or token records are not inferred. See the
[changelog attribution audit](../docs/CHANGELOG_ATTRIBUTION_AUDIT.md).

Previous contributor records are preserved in
[Development history](../docs/DEVELOPMENT_HISTORY.md), with dated context for superseded implementations.

### Security, privacy, and responsible reuse

Provider credentials belong in backend or deployment secret stores. Public calendar endpoints expose
sanitized availability, while integration setup and private account data require protected server
configuration. Optional integrations and analytics should be reviewed before deploying your own copy.

Report vulnerabilities through [SECURITY.md](../SECURITY.md). See [.env.example](../.env.example) for the
configuration template. Replace personal profile data, contact destinations, OAuth settings, and
analytics identifiers when adapting this repository.

### AssistMe text model verification — October 2, 2026

The live text primary is [Nemotron 3 Ultra free](https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b:free). OpenRouter's live catalog reports zero prompt and completion token prices. An authenticated inference probe returned HTTP 200, the exact requested model ID, and zero cost. Nemotron Super remains the next free fallback. Ultra is text-only; image requests retain the existing free vision chain. Local/server environment overrides remain explicit.

[NVIDIA's model release](https://research.nvidia.com/labs/nemotron/Nemotron-3-Ultra/) documents 550B total and 55B active parameters, released June 4, 2026. Availability and free-tier limits depend on the provider. Coding agent: GPT-6 / Codex in Codex desktop; exact variant, reasoning mode, and token usage: unavailable.

### AssistMe multimodal routing — October 2, 2026

The live Worker refreshes the [OpenRouter model catalog](https://openrouter.ai/api/v1/models) hourly
and filters models by the inputs required by each request. New models become fallback candidates
only when their advertised capabilities match. Safety classifiers, embeddings, and rerankers are
excluded from conversation routing. The browser cannot select arbitrary upstream models.

| Input or feature         | Current behavior                                                           | Verification                                                                 |
| ------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Text and reasoning       | Nemotron Ultra with compatible free recovery                               | Live streamed reply verified                                                 |
| Short turns              | Gemma 4, Apodex Mini, then compatible free recovery                        | Live document question verified                                              |
| Programming              | Cohere North Mini Code, then Ultra                                         | Live JavaScript reply verified                                               |
| Images and short videos  | Gemma 4 first; compatible Omni/Qwen recovery                               | Live image and MP4 description verified                                      |
| PDF and text files       | Explicit free Cloudflare PDF parser / bounded UTF-8 text                   | Live order-number extraction verified                                        |
| Audio files              | Omni/Inkling; compatible Gemini 3.8 recovery before Auto                   | October 3: Gemini 3.8 Flash via Google AI Studio BYOK transcribed the sample |
| Dictation and read-aloud | Browser speech features; cloud TTS when funded                             | Cloud TTS returned HTTP 402; device support depends on browser and OS        |
| Paid Auto Router         | Low-cost recovery after free candidates fail                               | Free-only Auto test returned no matching candidates                          |
| Fusion                   | Deep text research/comparison, gated by server config and positive balance | Current account returned HTTP 402; no successful Fusion inference claimed    |
| Image/video generation   | Not connected to this chat interface                                       | No generated-asset claims or fabricated image URLs                           |

Two attachments per turn are supported: images up to 1.2 MB, audio/video/PDF up to 3 MB per file,
and text/Markdown/CSV/JSON up to 75 KB. Files are uploaded only when the message is sent; their
contents are source material rather than instructions. Failed media processing never falls back
to an invented description. Regeneration retains the selected turn's files during the open session.

Streaming records the concrete answering model, provider, generation ID, supplied usage/cost,
finish reason, and routing task. The main reply stays readable; technical details are collapsed.
Stopping cancels upstream work. Unsupported or interrupted streams recover without concatenating
answers from different models. Token estimates remain labeled.

[Auto Router](https://openrouter.ai/docs/guides/routing/routers/auto-router) selects models by task.
[Fusion](https://openrouter.ai/docs/guides/features/plugins/fusion) runs a panel and analyst in
addition to the outer request, so it is reserved for deep text comparisons and requires credits.
A free model ID does not guarantee access: the observed Omni audio minimum was $0.50 and video
minimum $1.00; Gemma video succeeded without that balance. These provider restrictions may change.

Regression coverage: 212 API tests, 27 Worker routing/stream boundary tests, frontend unit checks, 16 accessibility tests, and 20 critical Chrome
journeys. The attachment journey also runs in Safari. October 3 live checks confirmed text, code, image, video, PDF, and audio processing. Audio recovered through Auto to Gemini 3.8 Flash using Google AI Studio BYOK. OpenRouter reported a zero charge and a provider-side inference cost of $0.002493 for the sample; a zero OpenRouter charge does not prove that BYOK inference is free. A longer conversation caused Auto to return HTTP 402; direct compatible Gemini 3.8 fallback restored the same audio request, so audio now tries that route before Auto. Cloud TTS remains unavailable and Fusion has no successful inference evidence. Coding agent: GPT-6 / Codex in Codex desktop; purpose: live multimodal verification, honest billing metadata, and responsive chatbot review. Exact variant, reasoning mode, and token usage: unavailable.
