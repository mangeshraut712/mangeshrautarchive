/** Single source of truth for static asset cache-bust query strings. */
export const ASSET_VER = '20260716x';

export const FONTAWESOME_VENDOR_CSS = 'assets/vendor/fontawesome/css/all.min.css';

export function fontAwesomeStylesheet(assetPrefix = '', version = ASSET_VER) {
  const prefix = assetPrefix ? `${assetPrefix.replace(/\/$/, '')}/` : '';
  return `${prefix}${FONTAWESOME_VENDOR_CSS}?v=${version}`;
}
