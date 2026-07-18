/**
 * Canonical public portfolio facts — quality gates, PWA policy, uses stack, theme tokens.
 * Keep Systems, Uses, README, and AssistMe site knowledge aligned with these values.
 * Lighthouse floors mirror `.github/workflows/deploy.yml` and `package.json` qa:lighthouse:* scripts.
 */

/** Brand / custom domain (may be offline while Vercel is DEPLOYMENT_DISABLED). */
export const SITE_URL = 'https://mangeshraut.pro';

/** Live static host — use for OG images and public demos until apex is restored. */
export const LIVE_SITE_URL = 'https://mangeshraut712.github.io/mangeshrautarchive';

export const SITE_THEME = {
  appleBlue: '#0071e3',
  appleBlueDark: '#0a84ff',
  lightSurface: '#ffffff',
  darkSurface: '#000000',
};

export const SOCIAL_IMAGE = {
  path: '/assets/images/home.png',
  url: `${LIVE_SITE_URL}/assets/images/home.png`,
  width: 3024,
  height: 1722,
  alt: 'Mangesh Raut Software Engineer Portfolio',
};

/** Deploy CI gates on built dist (`.github/workflows/deploy.yml`). */
export const LIGHTHOUSE_DEPLOY_GATES = {
  desktop: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 },
  mobile: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 },
};

/** Post-deploy monitoring floors for live GitHub Pages (`npm run qa:lighthouse:ci`). */
export const LIGHTHOUSE_PAGES_GATES = {
  desktop: { performance: 90, accessibility: 90, bestPractices: 90, seo: 90 },
  mobile: { performance: 85, accessibility: 90, bestPractices: 90, seo: 90 },
};

/** Live Vercel floors (`npm run qa:lighthouse:vercel`). */
export const LIGHTHOUSE_VERCEL_GATES = {
  desktop: { performance: 55, accessibility: 90, bestPractices: 90, seo: 90 },
  mobile: { performance: 55, accessibility: 90, bestPractices: 90, seo: 90 },
};

export const TEST_COUNTS = {
  vitest: 89,
  pytest: 132,
  playwrightProjects: 15,
};

export const WEBMCP_TOOL_COUNT = 10;

export const PWA_POLICY = {
  installable: true,
  serviceWorkerRegistered: false,
  offlineMode: 'manual-reconnect-only',
  summary:
    'Installable via manifest (standalone shortcuts). Service worker registration is disabled for iOS Safari stability; offline.html is a manual reconnect page, not a full offline cache.',
};

/**
 * Rich /uses catalog — names, why-notes, tags, featured daily drivers.
 * Inspired by the uses.tech tradition: specific tools + personal rationale.
 */
export const usesCatalog = [
  {
    id: 'hardware',
    label: 'Hardware',
    icon: 'fa-laptop',
    blurb: 'Apple Silicon desk setup optimized for long AI + full-stack sessions.',
    items: [
      {
        name: 'MacBook Pro (Apple Silicon)',
        note: 'Primary machine for local builds, map work, and multi-agent coding.',
        tag: 'Daily',
        featured: true,
      },
      {
        name: 'Studio Display',
        note: 'Single large canvas for editor + browser + design reference.',
        tag: 'Desk',
        featured: true,
      },
      {
        name: 'AirPods Pro',
        note: 'Calls, focus audio, and walk-and-think debugging loops.',
        tag: 'Audio',
      },
    ],
  },
  {
    id: 'software',
    label: 'Software',
    icon: 'fa-layer-group',
    blurb: 'OS and utilities that stay out of the way and speed navigation.',
    items: [
      {
        name: 'macOS',
        note: 'Native windowing, SF Pro, and solid battery life for travel builds.',
        tag: 'OS',
        featured: true,
      },
      {
        name: 'Raycast',
        note: 'Launcher, snippets, and quick window management.',
        tag: 'Launcher',
        featured: true,
      },
      {
        name: 'Arc / Safari',
        note: 'Arc for research workspaces; Safari for WebKit QA parity.',
        tag: 'Browser',
      },
      {
        name: 'iTerm',
        note: 'Split panes for backend, frontend, and test runners together.',
        tag: 'Terminal',
      },
    ],
  },
  {
    id: 'aiStack',
    label: 'AI stack',
    icon: 'fa-robot',
    blurb: 'Agentic coding loop — IDE agents, model routing, and review pairs.',
    items: [
      {
        name: 'Cursor',
        note: 'Primary AI-native IDE for multi-file refactors and portfolio work.',
        tag: 'IDE',
        featured: true,
      },
      {
        name: 'Claude Code',
        note: 'CLI agent for long-running repo tasks and shell-driven fixes.',
        tag: 'Agent',
        featured: true,
      },
      {
        name: 'OpenRouter',
        note: 'Model gateway for AssistMe and server-side chat routing.',
        tag: 'API',
        featured: true,
      },
      {
        name: 'Codex',
        note: 'Secondary pair-programmer for alternate model opinions.',
        tag: 'Agent',
      },
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering',
    icon: 'fa-gears',
    blurb: 'Vanilla ESM frontend + FastAPI backend — no React runtime on this site.',
    items: [
      {
        name: 'Vanilla HTML / CSS / ESM',
        note: 'Zero framework runtime; modules ship with .js extensions.',
        tag: 'Frontend',
        featured: true,
      },
      {
        name: 'esbuild',
        note: 'Production JS bundling into dist/ for Vercel and Pages.',
        tag: 'Build',
      },
      {
        name: 'FastAPI',
        note: 'Python 3.12 API for chat, health, and integrations.',
        tag: 'Backend',
        featured: true,
      },
      {
        name: 'Tailwind CSS v4 (generated utilities)',
        note: 'Utility generation only — no Tailwind classes in HTML markup.',
        tag: 'CSS',
      },
      {
        name: 'Cloudflare Worker + GitHub Pages',
        note: 'Pages is the live static host; AssistMe/API edge runs on Cloudflare Workers.',
        tag: 'Deploy',
        featured: true,
      },
      {
        name: 'GitHub Actions',
        note: 'Security, lint, unit, API, E2E, and Lighthouse deploy gates.',
        tag: 'CI',
      },
      {
        name: 'Vitest · pytest · Playwright',
        note: 'Full three-suite gate before merge to main.',
        tag: 'QA',
        featured: true,
      },
    ],
  },
  {
    id: 'fonts',
    label: 'Fonts',
    icon: 'fa-font',
    blurb: 'System-first typography with Apple SF Pro as the design voice.',
    items: [
      {
        name: 'SF Pro',
        note: 'Display + text faces for headings and UI chrome.',
        tag: 'Primary',
        featured: true,
      },
      {
        name: 'Inter (fallback)',
        note: 'Cross-platform fallback when SF Pro is unavailable.',
        tag: 'Fallback',
      },
    ],
  },
  {
    id: 'theme',
    label: 'Theme',
    icon: 'fa-palette',
    blurb: 'Solid surfaces and Apple tokens — clear light/dark, no muddy greys.',
    items: [
      {
        name: 'Solid white/black surfaces',
        note: 'Cards and chrome stay #fff / #000 for contrast and performance.',
        tag: 'Surface',
        featured: true,
      },
      {
        name: 'Apple 2026 design tokens',
        note: 'Shared --apple-blue, radii, and motion curves across subpages.',
        tag: 'Tokens',
      },
      {
        name: 'Dark / light sync',
        note: 'Theme toggle + system preference with durable local storage.',
        tag: 'Mode',
        featured: true,
      },
    ],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: 'fa-bolt',
    blurb: 'Lightweight planning without ceremony.',
    items: [
      {
        name: 'Notion',
        note: 'Notes, specs, and long-form research capture.',
        tag: 'Notes',
      },
      {
        name: 'Linear-style task lists',
        note: 'Issue-shaped todos for feature slices and polish passes.',
        tag: 'Tasks',
        featured: true,
      },
      {
        name: 'GitHub Projects',
        note: 'Public roadmap and PR tracking tied to the monorepo.',
        tag: 'Roadmap',
      },
    ],
  },
  {
    id: 'reading',
    label: 'Reading',
    icon: 'fa-book-open',
    blurb: 'Sources that shape product taste and system design.',
    items: [
      {
        name: 'Technical blogs',
        note: 'Engineering write-ups on performance, a11y, and agent tooling.',
        tag: 'Web',
      },
      {
        name: 'Apple HIG',
        note: 'Interaction patterns, hierarchy, and control affordances.',
        tag: 'Design',
        featured: true,
      },
      {
        name: 'AI papers & field notes',
        note: 'Model behavior, tooling papers, and build logs from real agents.',
        tag: 'AI',
        featured: true,
      },
    ],
  },
];

/** Flat string lists for API/site knowledge consumers. */
export const usesStack = Object.fromEntries(
  usesCatalog.map(category => [category.id, category.items.map(item => item.name)])
);

export function getUsesStats() {
  const tools = usesCatalog.reduce((sum, cat) => sum + cat.items.length, 0);
  const featured = usesCatalog.reduce(
    (sum, cat) => sum + cat.items.filter(item => item.featured).length,
    0
  );
  return {
    categories: usesCatalog.length,
    tools,
    featured,
    platforms: 2,
  };
}

/** Short label for hero metrics — cites deploy CI gate, not live-host variance. */
export function formatDeployLighthouseGate() {
  const { performance, accessibility, bestPractices, seo } = LIGHTHOUSE_DEPLOY_GATES.mobile;
  return `${performance}/${accessibility}/${bestPractices}/${seo}`;
}

export function formatQualitySummary() {
  const gates = LIGHTHOUSE_DEPLOY_GATES.mobile;
  return (
    `${TEST_COUNTS.vitest} Vitest · ${TEST_COUNTS.pytest} pytest · ` +
    `${TEST_COUNTS.playwrightProjects} Playwright projects · ` +
    `Lighthouse deploy gate ${gates.performance}/${gates.accessibility}/` +
    `${gates.bestPractices}/${gates.seo} (dist homepage)`
  );
}
