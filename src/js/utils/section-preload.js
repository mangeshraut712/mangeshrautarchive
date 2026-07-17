/** Delay before warming below-fold CSS/modules.
 * Keep near-zero so section CSS arrives before users can scroll into unstyled layout.
 */
export const WARM_SECTION_PRELOAD_DELAY_MS = 0;

/** Delay before kicking project/engineering loaders after DOM ready. */
export const WARM_SECTION_START_DELAY_MS = 100;

export function resolveGithubApiBase(context = globalThis) {
  const location = context.location || {};
  const hostname = location.hostname || '';
  try {
    if (context.sessionStorage?.getItem('portfolio_api_host_dead_v1') === '1') {
      return '';
    }
  } catch {
    // ignore
  }
  const configuredBase = context.APP_CONFIG?.apiBaseUrl || context.buildConfig?.apiBaseUrl || '';

  // GitHub Pages: always prefer AssistMe edge (never raw api.github.com — 403 → PSI BP fail).
  const pagesFallback = hostname.endsWith('github.io')
    ? 'https://assistme-chat.mangeshraut712.workers.dev'
    : '';
  const base = configuredBase || pagesFallback || location.origin || '';
  return String(base).replace(/\/$/, '');
}

export function getGithubProjectsPrefetchUrl(context = globalThis) {
  const base = resolveGithubApiBase(context);
  if (!base) {
    return '';
  }
  return `${base}/api/github/repos/public?username=mangeshraut712&limit=100&no_forks=false`;
}

export function shouldDeferCriticalWarmup(context = globalThis) {
  const connection = context.navigator?.connection;
  if (connection?.saveData) {
    return true;
  }

  const effectiveType = connection?.effectiveType;
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return true;
  }

  return false;
}
