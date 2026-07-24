/**
 * Shared Playwright navigation helpers for dual-host (local / Vercel / GitHub Pages).
 */

export const pathPrefix = process.env.TEST_TARGET === 'github' ? '/mangeshrautarchive' : '';

/** Prefix a site path for GitHub Pages base when needed. */
export function sitePath(path = '/') {
  if (!path || path === '/') {
    return pathPrefix ? `${pathPrefix}/` : '/';
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${pathPrefix}${normalized}`;
}

/**
 * Navigate to a portfolio path. Prefer extensionless URLs (`/monitor`) — local, Vercel,
 * and Pages all resolve them. `.html` still works as a fallback.
 */
export function gotoSite(page, path = '/', options = { waitUntil: 'domcontentloaded' }) {
  return page.goto(sitePath(path), options);
}

/** Home (or path) until main content is attached and load settles. */
export async function gotoSiteReady(page, path = '/', settleMs = 800) {
  await gotoSite(page, path);
  await page.waitForSelector('#main-content', { state: 'attached', timeout: 30_000 });
  await page.waitForLoadState('load');
  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }
}

export async function scrollSelectorIntoView(page, selector) {
  return page.evaluate(targetSelector => {
    const node = document.querySelector(targetSelector);
    if (!node) return false;
    node.scrollIntoView({ block: 'center', inline: 'nearest' });
    return true;
  }, selector);
}

/** Canonical subpage paths (extensionless). */
export const PAGES = {
  home: '/',
  systems: '/systems',
  monitor: '/monitor',
  travel: '/travel',
  uses: '/uses',
  changelog: '/changelog',
  offline: '/offline',
  notFound: '/404',
};
