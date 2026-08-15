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
