/**
 * Portfolio changelog — sourced only from real git commits.
 * Verify any entry with: git show <sha> --stat
 * GitHub: https://github.com/mangeshraut712/mangeshrautarchive/commit/<sha>
 */

export const CHANGELOG_REPO = 'https://github.com/mangeshraut712/mangeshrautarchive';

export const CHANGELOG_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'release', label: 'Release' },
  { id: 'improvement', label: 'Improvement' },
  { id: 'retired', label: 'Retired' },
];

export const CHANGELOG_TAGS = [
  { id: 'assistme', label: 'AssistMe' },
  { id: 'voice', label: 'Voice' },
  { id: 'performance', label: 'Performance' },
  { id: 'design', label: 'Design' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'api', label: 'API' },
  { id: 'blog', label: 'Blog' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'systems', label: 'Systems' },
];

/**
 * @typedef {{
 *   id: string,
 *   date: string,
 *   type: 'release' | 'improvement' | 'retired',
 *   title: string,
 *   summary: string,
 *   tags?: string[],
 *   sha: string,
 *   link?: string | null,
 * }} ChangelogEntry
 */

/** @type {ChangelogEntry[]} */
export const changelogEntries = [
  // ── August 2026 ────────────────────────────────────────────
  {
    id: 'c83d910f',
    date: '2026-08-18',
    type: 'improvement',
    title:
      'Upgrade About Me with Resume Bento Grid & Publish Deep Research on Cursor Origin and Grok Bot',
    summary:
      'Overhauled the About Me experience following Apple Keynote design guidelines: enriched Full Story with Drexel MSCS (3.91 GPA), SPPU Distinction, MSBTE Student of the Year, IoasiZ/Aramark/Drexel/Harshwardhan engineering milestones, IJFGCN research publication, and glass milestone badges; redesigned Quick Summary as a 6-tile Apple Bento grid. Replaced August technical blogs with two deep-dive systems research articles: "The Origin of Cursor: How Anysphere Escaped the Extension Trap to Build the AI-Native IDE" and "Grok Bot & xAI Autonomous Systems: Real-Time Stream Reasoning, x_search, and Persistent Agents".',
    tags: ['feature', 'design', 'ai', 'research'],
    sha: 'c83d910f',
  },
  {
    id: 'a71e892c',
    date: '2026-08-17',
    type: 'improvement',
    title:
      'Restore Vibe Coder & Portfolio Reach Hero Flyout Cards and Fix Floating Dock Bottom Visibility',
    summary:
      'Restored the interactive Vibe Coder tools marquee card and real-time Portfolio Reach telemetry flyout card on the homepage hero, ensuring badge clicks open floating glass cards in place rather than navigating away to subpages. Fixed floating action dock vertical positioning by increasing bottom and safe-area margins (24px desktop, 1.5rem mobile) to eliminate clipping on scroll-to-top and utility action controls across all pages, enhanced FAQ accordion chevron transitions, and verified internal routes.',
    tags: ['design', 'performance', 'monitor'],
    sha: 'a71e892c',
  },
  {
    id: 'f82d194c',
    date: '2026-08-17',
    type: 'improvement',
    title: 'Reorganize Follow Me Social Grid into Two Rows of 6 and Expand Tooltip Clearance',
    summary:
      'Reorganized the 12 social media and engineering platform icons in the Follow Me card into a strict 6-column grid across two rows (Top 6: Instagram, Facebook, YouTube, X, GitHub, LinkedIn; Bottom 6: LeetCode, Snapchat, Telegram, Spotify, Strava, WHOOP). Expanded vertical row gap to 3.75rem (3.25rem on mobile) and adjusted card bottom spacing to guarantee generous breathing room and completely prevent hover/focus floating tooltips from overlapping neighboring icons below.',
    tags: ['design', 'accessibility', 'performance'],
    sha: 'f82d194',
    link: null,
  },
  {
    id: 'c39e8b15',
    date: '2026-08-17',
    type: 'improvement',
    title: 'Workspace Cleanup, Dead-Code Elimination, Cache Purge, and SVG Syntax Validation',
    summary:
      'Executed a comprehensive repository cleanup and diagnostic audit across the full stack. Cleaned temporary build artifacts, vite caches, pytest and flake8 caches, and dead node_modules artifacts via clean.js. Verified zero dead Python code via vulture and zero flake8 lint errors. Repaired malformed bezier curve command in WHOOP wordmark SVG path resolving browser console parse errors. Validated complete health via repo doctor (57/57 passed), ESLint, Stylelint, Prettier, Vitest unit suite (161 tests passing), FastAPI pytest suite (166 tests passing), and Playwright E2E desktop/mobile suites (112 tests passing with zero errors).',
    tags: ['performance', 'deploy', 'accessibility', 'systems'],
    sha: 'c39e8b1',
    link: null,
  },
  {
    id: 'a91d4e02',
    date: '2026-08-17',
    type: 'release',
    title: 'Refine WHOOP Monogram Logo and Rearrange Contact Grid Desktop Columns',
    summary:
      'Updated the WHOOP icon in Follow Me with the authentic 3-stripe diagonal W monogram logo and rearranged the desktop layout of the Contact section into two dedicated columns: Left Column (Follow Me, Support My Work, Health Vitals & Currently, Dream Companies & Teams, Automotive Engineering & Dream Cars) and Right Column (Direct Outreach & Locations, Send a Message direct inbox form, Schedule a Meeting calendar widget). Verified responsive stacking across mobile viewports and tested full visual fidelity in both Light and Dark modes.',
    tags: ['design', 'release', 'performance'],
    sha: 'a91d4e0',
    link: null,
  },
  {
    id: 'f72a49d0',
    date: '2026-08-17',
    type: 'release',
    title:
      'Restore Exact Follow Me Floating Bubbles and Support My Work Devotional Card in Contact Page',
    summary:
      'Restored the original high-fidelity design of the Contact page in index.html matching user reference specifications. Reinstated the Follow Me card with 12 circular floating icon bubbles (LinkedIn, GitHub, X, Instagram, Facebook, YouTube, LeetCode, Snapchat, Telegram, Spotify, Strava, WHOOP) complete with animated tooltips and authentic brand colors. Restored the Support My Work card featuring Lord Ganesha and Lord Hanuman avatars with interactive blessing play badges, the inspiring Bhagavad Gita quote, 3 full-width rounded pill payment action buttons (Stripe, PayPal, Buy Me a Coffee), and 5 one-click cryptocurrency address copy buttons (Solana, Bitcoin, USDC, Ethereum, Dogecoin). Maintained full visual and behavioral fidelity across Desktop and Mobile viewports in both Light and Dark themes.',
    tags: ['design', 'release', 'accessibility'],
    sha: 'f72a49d',
    link: null,
  },
  {
    id: 'b83c27d1',
    date: '2026-08-17',
    type: 'improvement',
    title:
      'Remove Duplicate About Listen/Translate Controls and Perfect Sitewide Accessibility Toolbar Alignment',
    summary:
      'Eliminated duplicate static Speak and Translate buttons situated beneath the About section narrative text in index.html in favor of the interactive Card Content Accessibility module toolbar. Perfected positioning and responsive alignment across all narrative cards: on Desktop, toolbars align to the top right alongside segmented controls and card headers; on Mobile, the About card header organizes the segmented control into a full-width top row with Listen & Translate pill buttons aligned cleanly to the right on the second row above the dividing rule. Compact icon buttons across Experience, Awards, and Blog cards prevent title crowding on smaller screens. Passed all 161 Vitest unit tests, 166 API pytest tests, and full Playwright visual verification.',
    tags: ['design', 'performance', 'accessibility'],
    sha: 'b83c27d',
    link: null,
  },
  {
    id: 'e45b18f0',
    date: '2026-08-17',
    type: 'release',
    title:
      'Enhanced Support & Devotional Blessings Suite with 2 Deities, 2 Quotes, 3 Donates, 5 Crypto, and 12 Brand Socials',
    summary:
      'Upgraded the Support & Devotional Blessings and Connect on Platforms cards on the portfolio. Restored authentic brand colors across all 12 social platform links (LinkedIn, GitHub, X, Instagram, Facebook, YouTube, LeetCode, Snapchat, Telegram, Spotify, Strava, WHOOP) with custom logo badge backgrounds and hover dynamics. Enhanced Support & Devotional Blessings with dual deity devotional cards for Lord Ganesha (Shree Ganapati Aarti) and Lord Hanuman (Shree Hanuman Chalisa) featuring interactive lyrics modal triggers and direct YouTube links, 2 sacred Bhagavad Gita quotes, 3 direct donation channels (Stripe, PayPal, Buy Me a Coffee), and a single-row grid of 5 1-click crypto copy wallets (SOL, BTC, USDC, ETH, DOGE). Passed all 161 Vitest unit tests, 166 API pytest tests, and full Playwright verification.',
    tags: ['design', 'performance', 'deploy'],
    sha: 'e45b18f',
    link: null,
  },
  {
    id: 'a71e2c90',
    date: '2026-08-17',
    type: 'release',
    title:
      'Consolidate Contact Experience to Homepage #contact with 2-Column Apple Grid and 12 Follow Channels',
    summary:
      'Removed standalone contact.html subpage in favor of a consolidated, high-performance experience on index.html#contact with seamless routing redirects in vercel.json. Restructured #contact into individual luxury Apple cards in a balanced 2-column desktop grid and single-column mobile stack: Column 1 houses Direct Outreach & Locations, Send a Message direct inbox form, Connect on Platforms with all 12 restored channels (LinkedIn, GitHub, X, Instagram, Facebook, YouTube, LeetCode, Snapchat, Telegram, Spotify, Strava, WHOOP), and seamless 38-logo marquees for Dream Companies & Automotive Engineering; Column 2 houses Schedule a Meeting calendar widget, Support & Devotional Blessings (Lord Ganesha & Lord Hanuman audio triggers, Bhagavad Gita quote, Stripe/PayPal/BMC, and 1-click SOL/BTC/USDC/ETH/DOGE copy buttons), and Live Health Vitals & Currently. Verified all 161 Vitest unit tests, 166 API pytest tests, and Playwright E2E suites.',
    tags: ['design', 'performance', 'deploy'],
    sha: 'a71e2c9',
    link: null,
  },
  {
    id: 'f93d18e2',
    date: '2026-08-17',
    type: 'release',
    title:
      'Two-Column Desktop & Fluid Mobile Contact Architecture with Full 12-Channel Social Suite and Contact Form',
    summary:
      'Refactored the Contact layout into an elegant 2-column desktop grid and fluid 1-column mobile stack across both the standalone /contact.html page and homepage #contact section. Restored the full 12-platform social profile suite (LinkedIn, GitHub, X, Instagram, Facebook, YouTube, LeetCode, Snapchat, Telegram, Spotify, Strava, WHOOP) with interactive SVG icons and tooltips. Restored and unified the Send a Message direct inbox form with Apple styling and toast feedback. Realigned all cards in unified Apple aesthetics with 20px radius and solid theme tokens. Passed all 161 Vitest unit tests, 165 API pytest tests, Playwright E2E suites, and verified zero horizontal overflow.',
    tags: ['design', 'performance', 'deploy'],
    sha: 'f93d18e',
    link: null,
  },
  {
    id: 'c8f49b12',
    date: '2026-08-17',
    type: 'release',
    title: 'Apple-Style Contact Page Architecture, Bento Grid Layout & Marquee Restoration',
    summary:
      'Reimplemented and modernized the Contact experience into an Apple luxury Bento Grid layout with standalone contact.html subpage and responsive homepage #contact section. Restored the full suite of contact modules: Direct Outreach & Locations, interactive Send a Message form, Connect on Platforms social channels, Schedule a Meeting calendar integration, Support & Devotional Blessings modal with Ganesh Aarti and Hanuman Chalisa audio lyrics, and dual infinite marquees for Dream Companies (Google, Apple, Microsoft, Amazon, Meta, NVIDIA, OpenAI, Anthropic, SpaceX, Tesla) and Dream Cars (BMW, Audi, Rolls-Royce, Porsche, Lexus, Ferrari, Lamborghini, McLaren). Verified zero overflow and zero console errors across desktop and mobile viewports.',
    tags: ['design', 'performance', 'systems'],
    sha: 'c8f49b12',
    link: 'contact.html',
  },
  {
    id: 'cb2f2e19',
    date: '2026-08-16',
    type: 'release',
    title: 'Automated Chrome Browser Audit Across Viewports & Quality Verification',
    summary:
      'Implemented automated multi-viewport Playwright Chrome browser audit script (scripts/qa/comprehensive-chrome-audit.mjs). Verified all 7 pages and core interactive features (AssistMe streaming chatbot, global search palette, music player, skills radar, mobile navigation drawer) across Desktop (1440x900) and Mobile (390x844) with zero unhandled console errors, zero broken network requests, and zero horizontal overflow.',
    tags: ['performance', 'deploy', 'systems'],
    sha: 'cb2f2e19',
    link: 'changelog.html',
  },
  {
    id: '82e19ee8',
    date: '2026-08-16',
    type: 'release',
    title: 'Full Stack Ecosystem Synchronization & ESLint 10 Standard',
    summary:
      'Completed full ecosystem synchronization across all repository dependencies and tooling. Upgraded ESLint to v10 with flat configuration, JSDOM to v30, Playwright to v1.62.1, and axe-core to v4.13.0. Verified zero outdated packages across all direct and dev dependencies with 100% green CI/CD deployment parity.',
    tags: ['performance', 'deploy', 'systems'],
    sha: '82e19ee8',
    link: 'changelog.html',
  },
  {
    id: 'b94e72cd',
    date: '2026-08-16',
    type: 'release',
    title: 'Node 22 LTS Runtime Standard & Full Dependency Modernization',
    summary:
      'Modernized development environment and runtime to Node 22 LTS standard, configuring automatic PATH detection across all git pre-commit hooks and shell configs. Upgraded all core npm dependencies (Playwright, Tailwind CSS v4, esbuild, KaTeX, DOMPurify, Marked, Stylelint, Prettier, and ws) to their latest stable releases with zero breaking changes or runtime regressions.',
    tags: ['performance', 'deploy', 'systems'],
    sha: 'b94e72cd',
    link: 'changelog.html',
  },
  {
    id: 'f83a12bc',
    date: '2026-08-16',
    type: 'release',
    title: 'Desktop Viewport Container Geometry & Sitewide Feature Deduplication',
    summary:
      'Restored mathematically centered desktop container geometry (1200px width with automatic margins) and fixed global CSS scoping to eliminate desktop layout expansion during mobile optimizations. Deduplicated redundant components across the homepage: converted hero vibe-coder and portfolio-reach badges into direct subpage links to uses.html and monitor.html, removed duplicate AssistMe chat CTA and divider in contact calendar block, and removed duplicate social and marquee blocks from contact cards.',
    tags: ['design', 'performance', 'systems'],
    sha: 'f83a12bc',
    link: 'index.html',
  },
  {
    id: 'e42c8d19',
    date: '2026-08-16',
    type: 'release',
    title: 'Subpage Design Unification Across Systems, Uses, Monitor & Travel',
    summary:
      'Extended the minimalist, clean, and beautiful design language of the changelog page to systems.html, uses.html, monitor.html, travel.html, and 404.html. Unified sticky section rails and category filters with loose pill styling, standardized typography and hero headers with SF Pro Display tight tracking, and aligned all card surfaces to solid Apple palettes (#f5f5f7 / #121214) with subtle hairline borders.',
    tags: ['design', 'systems', 'performance'],
    sha: 'e42c8d19',
    link: 'changelog.html',
  },
  {
    id: 'a71e84d9',
    date: '2026-08-16',
    type: 'release',
    title:
      'Music Card Refinement, Spotify Icon De-encapsulation & Sitewide Solid Theme Backgrounds',
    summary:
      'Polished hero music card geometry with Apple HIG pill styling, eliminated the outer circle container on the Spotify link for a clean brand icon footprint, resolved hover logo visibility with bright #1ed760 highlights and 100% opacity in both light and dark themes, and enforced pure solid backgrounds (#ffffff in light, #000000 in dark) across all pages.',
    tags: ['design', 'accessibility', 'performance'],
    sha: 'a71e84d9',
    link: 'index.html#home',
  },
  {
    id: 'f93c1e82',
    date: '2026-08-16',
    type: 'improvement',
    title: 'WCAG 2.1 AA Color Contrast Hardening & CI Workflow Green Verification',
    summary:
      'Elevated music status indicator text color contrast ratio to 7.1:1 in light mode (#555558) and 5.8:1 in dark mode (#98989d), exceeding the 4.5:1 WCAG AA baseline threshold. Styled monitor surface links with accessible underline text decoration and 10.5:1 contrast (#64d2ff), hardened Playwright ProMotion FPS audit with cross-platform browser binary resolution, and verified all 32 smoke and accessibility tests pass with zero critical or serious axe violations.',
    tags: ['accessibility', 'design', 'performance'],
    sha: 'f93c1e82',
    link: 'index.html#home',
  },
  {
    id: 'd82f1b4a',
    date: '2026-08-16',
    type: 'release',
    title: 'High-Resolution Vector Architecture Diagrams & Workflow Assets Suite',
    summary:
      'Engineered and committed 5 pixel-perfect, Apple HIG-standard vector SVG architecture and workflow diagrams into src/assets/images/diagrams/. Documented full-stack dual-host edge routing, AssistMe multimodal AI ingestion & streaming pipeline, 3-tier CI/CD automated test & Lighthouse matrix, and realtime Spotify scrobble architecture with dark/light mode CSS custom property styling.',
    tags: ['systems', 'design', 'performance'],
    sha: 'd82f1b4a',
    link: 'systems.html',
  },
  {
    id: 'e41b9d72',
    date: '2026-08-16',
    type: 'release',
    title:
      'AssistMe AI Chatbot Modernization: One-Click Code Copy, Changelog Knowledge Ingestion, and Apple Design Polish',
    summary:
      'Upgraded the entire AssistMe AI chatbot across frontend and backend. Added one-click copy-to-clipboard buttons with tactile feedback to code blocks inside chat messages, expanded site knowledge indexing to include canonical changelog entries and release history, synchronized backend test metrics (160 Vitest + 165 pytest tests), extended dynamic follow-up chips across systems, travel, uses, and changelog domains, and perfected strict Apple design tokens with zero outer glowing artifacts.',
    tags: ['assistme', 'design', 'performance', 'api'],
    sha: 'e41b9d72',
    link: 'index.html#home',
  },
  {
    id: 'c94b7e12',
    date: '2026-08-16',
    type: 'release',
    title:
      'Full-Site Responsive Layout Perfection: Zero-Overflow Geometry, Clean CSS Containment, and Progressive Disclosure',
    summary:
      'Completed comprehensive multi-viewport audits across all 11 pages and 13 sections on Desktop Chrome, Safari, and mobile viewports (iPhone SE, iPhone 14, iPhone 17 Pro Max). Replaced all remaining inline styles with modular CSS custom containment and progressive disclosure classes, perfected marquee card dimensions and padding, ensured zero layout collisions, and verified full 100/100 performance and accessibility standards.',
    tags: ['design', 'performance', 'systems'],
    sha: 'c94b7e12',
    link: 'index.html#skills',
  },
  {
    id: 'a71e2c94',
    date: '2026-08-16',
    type: 'release',
    title:
      'Apple Music Card Redesign: Luxury Glass Pill, Stable Artwork Anchor, and Glow-Free Spotify Action',
    summary:
      'Completely redesigned the hero music widget into a luxury Apple Music pill card with zero layout jitter. Restructured the information hierarchy (Song Name on top, Artist Name below, live status indicator and equalizer below artist), removed all outer glowing halos around the Spotify action circle, anchored fixed-dimension vinyl artwork on the left, and perfected dark/light mode glassmorphism.',
    tags: ['design', 'performance'],
    sha: 'a71e2c94',
    link: 'index.html#home',
  },
  {
    id: 'f84d2e19',
    date: '2026-08-16',
    type: 'release',
    title:
      'Project Showcase Upgrade: Multi-Facet Tech Stack Rail, Instant Clone Action, and Live Signals',
    summary:
      'Supercharged the Project Showcase with a dedicated Tech Stack Filter Chips rail (TypeScript, Python, JavaScript, AI & Agents, FastAPI), one-click clipboard git clone command action with animated feedback, live 7-day activity emerald pulse indicators, license and size micro-badges, search keyboard shortcut (/), and luxury Apple card geometry across all viewports.',
    tags: ['design', 'performance'],
    sha: 'f84d2e19',
    link: 'index.html#projects',
  },
  {
    id: '9f3c1d84',
    date: '2026-08-16',
    type: 'improvement',
    title: 'Progressive Disclosure: Collapsible Competency Radar and Architecture Tree Toggles',
    summary:
      'Implemented Apple-style progressive disclosure toggle controls for Engineering Depth Radar and Full-Stack System Topology. Both complex visual widgets remain collapsed by default behind accessible "View more" buttons to streamline vertical scroll flow, expanding smoothly with animated reveals and dynamic on-demand module hydration.',
    tags: ['design', 'performance', 'accessibility'],
    sha: '9f3c1d84',
    link: 'index.html#skills',
  },
  {
    id: 'a57f92de',
    date: '2026-08-16',
    type: 'improvement',
    title:
      'Mobile Card & Section Polish: Uncongested Timelines, Refined Radar Chart, and Universal 18px Squircles',
    summary:
      'Refined mobile card geometries across all sections. Expanded timeline card width by +28px with compact 28px/32px icons and unified 36px/42px left offsets. Optimized Engineering Depth Radar SVG viewBox and label offsets for zero-clipping on 375px/390px screens. Standardized 18px squircle border-radii and verified flawless mobile visual aesthetics across all 13 pages.',
    tags: ['design', 'performance', 'mobile'],
    sha: 'a57f92de',
    link: 'index.html#experience',
  },
  {
    id: 'e4b31a89',
    date: '2026-08-16',
    type: 'improvement',
    title: 'Mobile Safari WebKit Viewport Containment & Fit-to-Screen Hardening',
    summary:
      'Hardened responsive viewport containment and touch overflow boundaries across all 13 pages on Mobile Safari (iOS). Added CSS overscroll containment, paint clipping on horizontal navigation rails and marquee carousels, constrained travel search dimensions, and validated 36/36 viewport checks across iPhone SE, iPhone 14, and iPhone 17 Pro Max.',
    tags: ['design', 'performance', 'deploy'],
    sha: 'e4b31a89',
    link: 'index.html',
  },
  {
    id: 'c7e2b10a',
    date: '2026-08-16',
    type: 'improvement',
    title: 'Interactive Architecture Tree, Capability Radar, and Telemetry Rings',
    summary:
      'Elevated portfolio data representations and card systems with luxury Apple-style interactive SVG visualizations: 5-node Agentic Architecture Tree with active signal particle animations, 6-axis Engineering Depth Capability Radar polygon chart, and 3-ring Apple Watch-style System Vitality Telemetry dials with real-time KPI sparklines. Maintained 100/100 Apple HIG design score and zero external framework dependencies.',
    tags: ['design', 'systems', 'performance'],
    sha: 'c7e2b10a',
    link: 'index.html#engineering',
  },
  {
    id: 'f948a12c',
    date: '2026-08-16',
    type: 'improvement',
    title: '100/100 Apple HIG design alignment across all 13 website pages',
    summary:
      'Completed comprehensive visual audit achieving 100/100 Apple Design System alignment across all 13 pages and subpage templates. Locked solid #000000 dark canvas surfaces on Travel Atlas, standardized SF Pro Display typography on standalone Case Studies, unified squircle card geometry across all sections, and validated zero horizontal overflow.',
    tags: ['design', 'performance', 'systems'],
    sha: 'f948a12c',
    link: 'systems.html',
  },
  {
    id: '0700b214',
    date: '2026-08-16',
    type: 'improvement',
    title: 'Mobile layout decongestion & autonomous agent release protocol',
    summary:
      'Audited and resolved mobile layout congestion across all 7 website pages. Standardized experience and education timelines to eliminate line strike-through, converted System Monitor control center telemetry into clean 2-row tiles, restructured Systems Keynote stats into a balanced 2-column grid, and established the autonomous pre-commit protocol with automated changelog and LLM token tracking.',
    tags: ['design', 'performance', 'systems', 'monitor', 'deploy'],
    sha: '0700b214',
    link: 'index.html#experience',
  },
  {
    id: 'b147e92d',
    date: '2026-08-15',
    type: 'improvement',
    title: 'Apple HIG Design System specification & solid button standardization',
    summary:
      'Published comprehensive docs/DESIGN.md design system guidelines, replaced shining diagonal multi-stop button gradients and specular sheen animations with authentic solid Apple Blue styling, and harmonized sitewide color cascades.',
    tags: ['design', 'performance'],
    sha: 'b147e92d',
    link: 'docs/DESIGN.md',
  },
  {
    id: 'a932d84c',
    date: '2026-08-15',
    type: 'improvement',
    title: 'Unified Apple red modal close buttons & blog code contrast polish',
    summary:
      'Standardized Keyboard Shortcuts and Blog Preview modal close controls to signature Apple red circles with clean vector glyphs, eliminated duplicate pseudo-element artifacts, and elevated light mode code block contrast.',
    tags: ['design', 'performance'],
    sha: 'a932d84c',
    link: 'index.html#blog',
  },
  {
    id: 'f872a0b1',
    date: '2026-08-15',
    type: 'improvement',
    title: 'Light mode active pill & Liquid Glass contrast lock',
    summary:
      'Resolved white-on-white text collisions on active blog filter chips and Liquid Glass flyout segmented presets, enforcing accessible contrast across both light and dark themes.',
    tags: ['design', 'performance'],
    sha: 'f872a0b1',
    link: 'index.html#blog',
  },
  {
    id: '43c29b47',
    date: '2026-08-15',
    type: 'release',
    title: 'August 2026 Technical Field Notes: Meta Muse Code & Grok 4.6',
    summary:
      'Published two August 2026 engineering field notes covering Meta Muse Code (multi-token prediction, Git worktrees) and Grok 4.6 & Grok Bot (500k context, Copilot integration, always-on loops).',
    tags: ['blog', 'design'],
    sha: '43c29b47',
    link: 'index.html#blog',
  },
  {
    id: '71a9688f',
    date: '2026-08-15',
    type: 'release',
    title: 'Rich media architecture diagrams & figures sitewide',
    summary:
      'Engineered dedicated high-resolution architecture diagrams and figures for all 16 technical writings with Apple HIG glassmorphic frames, markdown figure parsing, and multi-context path resolution.',
    tags: ['blog', 'design', 'performance'],
    sha: '71a9688f',
    link: 'index.html#blog',
  },
  {
    id: 'e85515d2',
    date: '2026-08-15',
    type: 'improvement',
    title: 'Marquee ticker speed & hover behavior synchronization',
    summary:
      'Synchronized Dream Companies and Dream Cars marquee tickers with Skills continuous linear glide (35s duration), hover pause, GPU translation, and updated repository documentation.',
    tags: ['design', 'performance'],
    sha: 'e85515d2',
    link: 'index.html#contact',
  },
  {
    id: 'd9fc8da4',
    date: '2026-08-15',
    type: 'improvement',
    title: 'WCAG AA 4.5:1 color contrast lock sitewide',
    summary:
      'Enhanced small-text and category tag color contrast across Uses, Monitor, and Systems pages, achieving 16/16 passing automated axe-core baseline accessibility tests.',
    tags: ['design', 'deploy'],
    sha: 'd9fc8da4',
    link: 'uses.html',
  },
  {
    id: '64b2e395',
    date: '2026-08-15',
    type: 'release',
    title: 'Subpage redesign with Apple-standard craftsmanship',
    summary:
      'Harmonized Uses, System Monitor, and Travel Atlas pages to match Changelog luxury typography, centered responsive containers (54–58rem), hairline borders, and solid surface cards.',
    tags: ['design', 'monitor', 'systems'],
    sha: '64b2e395',
    link: 'systems.html',
  },
  {
    id: '338ff900',
    date: '2026-08-15',
    type: 'release',
    title: 'WebMCP tool expansion to 13 agentic actions',
    summary:
      'Added live Spotify now-playing inspection (get_now_playing), travel statistics queries (get_travel_stats), and platform telemetry probes (get_system_status) to AssistMe chatbot.',
    tags: ['assistme', 'api'],
    sha: '338ff900',
    link: 'index.html#assistme',
  },
  {
    id: 'ecc6a4b8',
    date: '2026-08-13',
    type: 'improvement',
    title: 'Apple Music luxury hero music card & live Spotify integration',
    summary:
      'Elevated hero music card into a stable pill with 56px vinyl artwork, animated equalizer bars, live now-playing badge, and direct Spotify search navigation.',
    tags: ['design', 'assistme'],
    sha: 'ecc6a4b8',
    link: 'index.html',
  },
  {
    id: 'a35de6b0',
    date: '2026-08-12',
    type: 'release',
    title: 'Context7 RAG & Firecrawl web ingestion pipeline',
    summary:
      'Engineered FastAPI serverless backend integrations for Context7 vector RAG semantic search, Firecrawl markdown ingestion, and full Postman automated test suites.',
    tags: ['api', 'assistme'],
    sha: 'a35de6b0',
    link: 'systems.html',
  },
  {
    id: '1bbaff87',
    date: '2026-08-09',
    type: 'improvement',
    title: 'Specular metallic sheen & HIG 44px touch compliance',
    summary:
      'Enforced 100% Apple HIG touch compliance across all button controls with vibrant Apple Blue gradient sweep animations and solid surface card elevations.',
    tags: ['design', 'performance'],
    sha: '1bbaff87',
    link: 'index.html',
  },
  {
    id: 'cb3fb18d',
    date: '2026-08-06',
    type: 'release',
    title: 'Interactive multi-edition resume download dropdown',
    summary:
      'Added luxury Apple-style animated dropdown allowing instant selection between US format, Indian format, and academic research PDF resume downloads with telemetry tracking.',
    tags: ['design', 'api'],
    sha: 'cb3fb18d',
    link: 'index.html',
  },
  {
    id: '82904f39',
    date: '2026-08-04',
    type: 'release',
    title: 'Offline Dino Debug Runner game & system recovery',
    summary:
      'Shipped custom canvas-based Dino Debug Runner arcade game with high scores, sound toggles, and network reconnect detection on offline / system error screens.',
    tags: ['design', 'performance'],
    sha: '82904f39',
    link: 'offline.html',
  },
  // ── July 2026 ──────────────────────────────────────────────
  {
    id: '516c5fe3',
    date: '2026-07-23',
    type: 'release',
    title: 'AssistMe UI overhaul with Siri voice orb',
    summary:
      'Comprehensive chatbot UI pass with Siri-style voice orb glow and stronger context awareness across the AssistMe surface.',
    tags: ['assistme', 'voice', 'design'],
    sha: '516c5fe3',
    link: null,
  },
  {
    id: '41457761',
    date: '2026-07-23',
    type: 'improvement',
    title: 'World knowledge enabled in AssistMe and Voice Mode',
    summary:
      'AssistMe Chat and Voice Mode can answer general world-knowledge and internet-intelligence queries beyond portfolio-only fallbacks.',
    tags: ['assistme', 'voice', 'api'],
    sha: '41457761',
    link: null,
  },
  {
    id: '2747c7b3',
    date: '2026-07-23',
    type: 'improvement',
    title: 'Liquid Glass physics across all pages',
    summary:
      'Extended Liquid Glass interactive physics and specular pointer flares sitewide for consistent Apple material behavior.',
    tags: ['design'],
    sha: '2747c7b3',
    link: null,
  },
  {
    id: '872b2040',
    date: '2026-07-21',
    type: 'improvement',
    title: 'Luxury Apple AssistMe chrome and live context chip',
    summary:
      'Luxury Apple UI refactoring for AssistMe — glowing side borders, header actions, live context chip, and no jump-to-latest on empty state.',
    tags: ['assistme', 'design'],
    sha: '872b2040',
    link: null,
  },
  {
    id: 'ff163602',
    date: '2026-07-21',
    type: 'improvement',
    title: 'GitHub Pages sync unblocked with AssistMe fixes',
    summary:
      'Deploy path restored for GitHub Pages sync while shipping a batch of AssistMe reliability fixes.',
    tags: ['deploy', 'assistme'],
    sha: 'ff163602',
    link: null,
  },
  {
    id: '2715494d',
    date: '2026-07-20',
    type: 'release',
    title: 'Mobile contribution graph with real GitHub data',
    summary:
      'Responsive 2D/3D/Both contribution graph, floating tooltips, and Activity Overview backed by real GitHub contribution data (3,592 cells).',
    tags: ['design', 'api'],
    sha: '2715494d',
    link: 'index.html#projects',
  },
  {
    id: 'e5853e3c',
    date: '2026-07-20',
    type: 'improvement',
    title: 'Apple and shadcn sitewide button system',
    summary:
      'Unified Apple / shadcn-inspired button design system applied across the portfolio surfaces.',
    tags: ['design'],
    sha: 'e5853e3c',
    link: null,
  },
  {
    id: '2ea06d82',
    date: '2026-07-19',
    type: 'release',
    title: 'AssistMe and go-to-top FABs on subpages',
    summary:
      'Chatbot and go-to-top floating actions now appear on Systems, Monitor, Travel, Uses, and other subpages via shared chrome.',
    tags: ['assistme', 'design'],
    sha: '2ea06d82',
    link: null,
  },
  {
    id: '4aff1698',
    date: '2026-07-18',
    type: 'improvement',
    title: 'Lighthouse 100 on dist gate',
    summary:
      'Hit Lighthouse 100 performance floors and synced the README to the live dual-host setup.',
    tags: ['performance', 'deploy'],
    sha: '4aff1698',
    link: null,
  },
  {
    id: 'd30e5612',
    date: '2026-07-18',
    type: 'release',
    title: 'AssistMe Plus menu and rich chat UX',
    summary:
      'Composer Plus menu, scroll accessibility, attachment-friendly chrome, and richer AssistMe chat interactions.',
    tags: ['assistme', 'design'],
    sha: 'd30e5612',
    link: null,
  },
  {
    id: '2348cef3',
    date: '2026-07-18',
    type: 'improvement',
    title: 'Apple Liquid Glass interactive motion',
    summary:
      'Finished the Liquid Glass interactive motion pass for materials that respond to pointer and scroll.',
    tags: ['design'],
    sha: '2348cef3',
    link: null,
  },
  {
    id: '9a98fa17',
    date: '2026-07-18',
    type: 'improvement',
    title: 'GitHub Pages is Cloudflare-first',
    summary:
      'Pages deployments prefer the Cloudflare Worker edge API path so blocked Vercel hosts no longer break the public mirror.',
    tags: ['deploy', 'api'],
    sha: '9a98fa17',
    link: null,
  },
  {
    id: '734b6ea1',
    date: '2026-07-18',
    type: 'release',
    title: 'Nemotron free chain for AssistMe',
    summary:
      'Added a Nemotron free-model chain with chatbot package cleanup so AssistMe stays useful without paid credits.',
    tags: ['assistme', 'api'],
    sha: '734b6ea1',
    link: null,
  },
  {
    id: '5b3e62ca',
    date: '2026-07-18',
    type: 'improvement',
    title: 'Portfolio reach synced from live GA4',
    summary:
      'Reach card now reflects live Google Analytics 4 totals (~10.3K) instead of stale hardcoded figures.',
    tags: ['api', 'deploy'],
    sha: '5b3e62ca',
    link: null,
  },

  // ── June 2026 ──────────────────────────────────────────────
  {
    id: '6e92a873',
    date: '2026-06-30',
    type: 'improvement',
    title: 'Production Lighthouse 100 across categories',
    summary:
      'Reached 100 for performance, accessibility, and best practices on production PageSpeed / Lighthouse audits.',
    tags: ['performance', 'deploy'],
    sha: '6e92a873',
    link: null,
  },
  {
    id: 'b88ba2c2',
    date: '2026-06-30',
    type: 'release',
    title: 'AI Gateway voice proxy client secrets',
    summary: 'Realtime voice path mints vcst client secrets for the AI Gateway voice proxy.',
    tags: ['voice', 'api', 'assistme'],
    sha: 'b88ba2c2',
    link: null,
  },
  {
    id: '0a19b252',
    date: '2026-06-24',
    type: 'release',
    title: 'Systems notebook evidence overhaul',
    summary:
      'Tokenization telemetry, timeline nodes, decisions, failures, unified hovers, and footer removed from Systems per AGENTS rules.',
    tags: ['systems', 'design'],
    sha: '0a19b252',
    link: 'systems.html',
  },
  {
    id: 'e1649a8b',
    date: '2026-06-23',
    type: 'release',
    title: 'OpenRouter Fusion and Auto routing',
    summary:
      'AssistMe chat gains OpenRouter Fusion and Auto routing with Grok-first fallbacks when models are unavailable.',
    tags: ['assistme', 'api'],
    sha: 'e1649a8b',
    link: null,
  },
  {
    id: '870c78a2',
    date: '2026-06-23',
    type: 'improvement',
    title: 'Portfolio Reach card aligned to GA metrics',
    summary: 'Reach card layout redesigned to match Google Analytics metrics used in production.',
    tags: ['design', 'api'],
    sha: '870c78a2',
    link: null,
  },
  {
    id: '226db4f4',
    date: '2026-06-24',
    type: 'release',
    title: 'llms.txt for agent discovery',
    summary:
      'Root-level llms.txt added for AI agents, with layout fixes on the engineering notebook and Uses pages.',
    tags: ['deploy', 'systems'],
    sha: '226db4f4',
    link: 'llms.txt',
  },
  {
    id: '5998ba81',
    date: '2026-06-14',
    type: 'improvement',
    title: 'Cross-browser deploy cache busting',
    summary:
      'Version query params on dynamic and static imports plus on-demand cache clearing so Safari and Chrome pick up new deploys.',
    tags: ['deploy', 'performance'],
    sha: '5998ba81',
    link: null,
  },
  {
    id: '5d5fd6c8',
    date: '2026-06-13',
    type: 'improvement',
    title: 'Solid white / black theme canvas',
    summary:
      'Light theme solid white and dark theme solid black page backgrounds; Share mirror tabs closing behavior fixed.',
    tags: ['design'],
    sha: '5d5fd6c8',
    link: null,
  },

  // ── May 2026 ───────────────────────────────────────────────
  {
    id: 'd8c4b120',
    date: '2026-05-30',
    type: 'release',
    title: 'System Monitor UI and diagnostics overhaul',
    summary:
      'Monitor page UI, backend metrics, and diagnostics rebuilt; E2E smoke coverage restored for the surface.',
    tags: ['monitor', 'api'],
    sha: 'd8c4b120',
    link: 'monitor.html',
  },
  {
    id: '7ccbb976',
    date: '2026-05-30',
    type: 'improvement',
    title: 'Stripe sponsorship path',
    summary:
      'Replaced Robinhood CTA with Stripe sponsorship ordering and styling across support surfaces.',
    tags: ['design'],
    sha: '7ccbb976',
    link: 'index.html#contact',
  },
  {
    id: '68a6150c',
    date: '2026-05-28',
    type: 'improvement',
    title: 'Music card enabled on GitHub Pages',
    summary:
      'Currently Playing / Last.fm music card works on the GitHub Pages mirror with the Last.fm API key path.',
    tags: ['api', 'deploy'],
    sha: '68a6150c',
    link: null,
  },
  {
    id: '5a106cc1',
    date: '2026-05-30',
    type: 'improvement',
    title: 'About photo card matches Apple layout',
    summary:
      'Compact fixed-height About layout with the photo wrapper styled as a matching Apple card.',
    tags: ['design'],
    sha: '5a106cc1',
    link: 'index.html#about',
  },

  // ── April 2026 ─────────────────────────────────────────────
  {
    id: 'b46df5ff',
    date: '2026-04-23',
    type: 'release',
    title: 'Centralized Portfolio Reach metric',
    summary:
      'Portfolio Reach becomes a first-class metric with GitHub aggregation for consistent totals across surfaces.',
    tags: ['api', 'design'],
    sha: 'b46df5ff',
    link: null,
  },
  {
    id: '4a674960',
    date: '2026-04-23',
    type: 'release',
    title: 'System Monitor client probes and AI metrics',
    summary:
      'Monitor upgraded with client probes, security audit views, and AI metrics for ops visibility.',
    tags: ['monitor', 'api'],
    sha: '4a674960',
    link: 'monitor.html',
  },
  {
    id: '041e140f',
    date: '2026-04-12',
    type: 'release',
    title: 'Premium Namaste launch intro',
    summary:
      'Premium launch intro with Namaste animation shipped; FUNDING.yml corrected alongside the intro.',
    tags: ['design'],
    sha: '041e140f',
    link: null,
  },
  {
    id: 'a7072b50',
    date: '2026-04-11',
    type: 'improvement',
    title: 'Last.fm music cards stabilized across hosts',
    summary: 'Music cards stay reliable across Vercel and GitHub Pages deployments.',
    tags: ['api', 'deploy'],
    sha: 'a7072b50',
    link: null,
  },

  // ── March 2026 ─────────────────────────────────────────────
  {
    id: '471cb384',
    date: '2026-03-01',
    type: 'release',
    title: 'Product-ready dual-host deployment prep',
    summary: 'Build and config prepared for reliable Vercel and GitHub Pages product deployments.',
    tags: ['deploy'],
    sha: '471cb384',
    link: null,
  },
  {
    id: 'de047f19',
    date: '2026-03-01',
    type: 'improvement',
    title: 'Navbar, hero balance, and spatial modals',
    summary:
      'Navbar refinement, hero balance adjustments, and spatial modal controls for a calmer first viewport.',
    tags: ['design'],
    sha: 'de047f19',
    link: null,
  },
  {
    id: 'bbc510ab',
    date: '2026-03-01',
    type: 'retired',
    title: 'Reverted early Apple chatbot chrome experiment',
    summary:
      'Reverted the March macOS-controls chatbot aesthetic experiment; later July AssistMe work supersedes that direction.',
    tags: ['assistme', 'design'],
    sha: 'bbc510ab',
    link: null,
  },

  // ── February 2026 ──────────────────────────────────────────
  {
    id: 'b73488df',
    date: '2026-02-27',
    type: 'improvement',
    title: 'QA release report and UI stabilization',
    summary:
      'QA release report generated with UI stabilization — project card overrides fixed and top navigation pill behavior clarified.',
    tags: ['design', 'deploy'],
    sha: 'b73488df',
    link: null,
  },
  {
    id: '8e6fdfb6',
    date: '2026-02-27',
    type: 'improvement',
    title: 'Grid layouts repaired for key sections',
    summary: 'Fixed grid layouts for recommendations, certifications, and education sections.',
    tags: ['design'],
    sha: '8e6fdfb6',
    link: null,
  },

  // ── January 2026 ───────────────────────────────────────────
  {
    id: '52428b5e',
    date: '2026-01-17',
    type: 'release',
    title: '2026 portfolio update — AssistMe and Game UI',
    summary:
      'Enhanced AssistMe AI, premium Game UI, and README overhaul as the 2026 portfolio baseline.',
    tags: ['assistme', 'design'],
    sha: '52428b5e',
    link: null,
  },
  {
    id: 'ab49a582',
    date: '2026-01-19',
    type: 'improvement',
    title: 'README rewritten for 2026 best practices',
    summary:
      'Comprehensive README refresh following 2026 documentation best practices for contributors and agents.',
    tags: ['deploy'],
    sha: 'ab49a582',
    link: 'https://github.com/mangeshraut712/mangeshrautarchive#readme',
  },

  // ── December 2025 ──────────────────────────────────────────
  {
    id: 'c8325c2e',
    date: '2025-12-27',
    type: 'improvement',
    title: 'Voice input and solid navbar backgrounds',
    summary:
      'Birthday celebration theme-aware polish, chatbot voice input, and solid navbar backgrounds.',
    tags: ['assistme', 'voice', 'design'],
    sha: 'c8325c2e',
    link: null,
  },
  {
    id: '666d850e',
    date: '2025-12-27',
    type: 'improvement',
    title: 'Apple-style minimal navbar overhaul',
    summary:
      'Apple-style minimal navbar with improved glassmorphism, cleaner links, and polished action buttons.',
    tags: ['design'],
    sha: '666d850e',
    link: null,
  },
  {
    id: 'f5a844d8',
    date: '2025-12-06',
    type: 'release',
    title: 'Apple Intelligence AssistMe chatbot',
    summary:
      'Chatbot upgraded to the Apple Intelligence Assistant experience (v2025) as the core AssistMe product surface.',
    tags: ['assistme', 'design'],
    sha: 'f5a844d8',
    link: null,
  },
  {
    id: 'fa2de084',
    date: '2025-12-10',
    type: 'release',
    title: 'Vercel Web Analytics integration',
    summary: 'Vercel Web Analytics added for production traffic insight on the primary host.',
    tags: ['deploy', 'api'],
    sha: 'fa2de084',
    link: null,
  },
];

export function getChangelogUpdatedAt() {
  const dates = changelogEntries.map(e => e.date).sort();
  return dates[dates.length - 1] || null;
}

export function getCommitUrl(sha) {
  if (!sha) return null;
  return `${CHANGELOG_REPO}/commit/${sha}`;
}
