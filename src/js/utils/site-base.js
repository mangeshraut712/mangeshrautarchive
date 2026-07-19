/**
 * Site path prefix for dual-host deploys (Vercel root vs GitHub Pages /mangeshrautarchive).
 * Uses the live location only — never the canonical URL (that can point at Pages while
 * you are browsing localhost / Vercel apex).
 */

const PAGES_SEGMENT = 'mangeshrautarchive';

/**
 * @returns {string} '' on apex/Vercel, or '/mangeshrautarchive' on GitHub Pages
 */
export function getSiteBase() {
  if (typeof window === 'undefined' || !window.location) return '';

  const path = String(window.location.pathname || '/');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === PAGES_SEGMENT) {
    return `/${PAGES_SEGMENT}`;
  }

  // Project Pages host with a first path segment matching the repo name.
  const host = String(window.location.hostname || '');
  if (host.endsWith('github.io') && parts[0] === PAGES_SEGMENT) {
    return `/${PAGES_SEGMENT}`;
  }

  return '';
}

/**
 * Prefix a root-absolute site path with the deploy base.
 * @param {string} path e.g. '/blog' or '/blog/foo'
 * @returns {string}
 */
export function sitePath(path = '/') {
  const base = getSiteBase();
  const normalized = String(path || '/').startsWith('/') ? String(path) : `/${path}`;
  if (!base) return normalized;
  if (normalized === '/') return `${base}/`;
  return `${base}${normalized}`;
}
