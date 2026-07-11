/** Delay before warming below-fold CSS/modules.
 * Keep near-zero so section CSS arrives before users can scroll into unstyled layout.
 */
export const WARM_SECTION_PRELOAD_DELAY_MS = 0;

/** Delay before kicking project/engineering loaders after DOM ready. */
export const WARM_SECTION_START_DELAY_MS = 100;

export function resolveGithubApiBase(context = globalThis) {
  const location = context.location || {};
  const hostname = location.hostname || '';
  const configuredBase =
    context.APP_CONFIG?.apiBaseUrl ||
    context.buildConfig?.apiBaseUrl ||
    (hostname.endsWith('github.io') ? 'https://mangeshraut.pro' : '');

  const base = configuredBase || location.origin || '';
  return String(base).replace(/\/$/, '');
}

export function getGithubProjectsPrefetchUrl(context = globalThis) {
  return `${resolveGithubApiBase(context)}/api/github/repos/public?username=mangeshraut712&limit=100&no_forks=false`;
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
