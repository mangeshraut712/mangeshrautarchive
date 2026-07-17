/**
 * Canonical public portfolio facts — quality gates, PWA policy, uses stack, theme tokens.
 * Keep Systems, Uses, README, and AssistMe site knowledge aligned with these values.
 * Lighthouse floors mirror `.github/workflows/deploy.yml` and `package.json` qa:lighthouse:* scripts.
 */

export const SITE_URL = 'https://mangeshraut.pro';

export const SITE_THEME = {
  appleBlue: '#0071e3',
  appleBlueDark: '#0a84ff',
  lightSurface: '#ffffff',
  darkSurface: '#000000',
};

export const SOCIAL_IMAGE = {
  path: '/assets/images/home.png',
  url: `${SITE_URL}/assets/images/home.png`,
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
  vitest: 67,
  pytest: 122,
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

export const usesStack = {
  hardware: ['MacBook Pro (Apple Silicon)', 'Studio Display', 'AirPods Pro'],
  software: ['macOS', 'Raycast', 'Arc / Safari', 'iTerm'],
  aiStack: ['Cursor', 'Claude Code', 'OpenRouter', 'Codex'],
  engineering: [
    'Vanilla HTML / CSS / ESM',
    'esbuild',
    'FastAPI',
    'Tailwind CSS v4 (generated utilities)',
    'Vercel + GitHub Pages',
    'GitHub Actions',
    'Vitest · pytest · Playwright',
  ],
  fonts: ['SF Pro', 'Inter (fallback)'],
  theme: ['Solid white/black surfaces', 'Apple 2026 design tokens', 'Dark / light sync'],
  productivity: ['Notion', 'Linear-style task lists', 'GitHub Projects'],
  reading: ['Technical blogs', 'Apple HIG', 'AI papers & field notes'],
};

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
