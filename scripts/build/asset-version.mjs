/** Single source of truth for static asset cache-bust query strings. */
export const ASSET_VER = '20260826cache1';

/**
 * Icon/PWA/touch-icon cache stamp. Bumped independently of CSS/JS so Safari
 * Favorites and apple-touch probes cannot keep a prior synthesized tile.
 */
export const ICON_VER = '20260906mr';

/** Live GitHub Pages origin — use for apple-touch / favicon / OG image URLs. */
export const GITHUB_PAGES_ORIGIN = 'https://mangeshraut712.github.io/mangeshrautarchive';

export const APPLE_TOUCH_ICON_180 = 'apple-touch-icon-mr-20260906.png';
export const PWA_ICON_192 = 'assets/icons/icon-192-mr-20260906.png';
export const PWA_ICON_512 = 'assets/icons/icon-512-mr-20260906.png';

export function pagesIconUrl(relativePath, version = ICON_VER) {
  const path = String(relativePath).replace(/^\//, '');
  return `${GITHUB_PAGES_ORIGIN}/${path}?v=${version}`;
}

export const FONTAWESOME_VENDOR_CSS = 'assets/vendor/fontawesome/css/all.min.css';

export function fontAwesomeStylesheet(assetPrefix = '', version = ASSET_VER) {
  const prefix = assetPrefix ? `${assetPrefix.replace(/\/$/, '')}/` : '';
  return `${prefix}${FONTAWESOME_VENDOR_CSS}?v=${version}`;
}
