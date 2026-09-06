import { describe, expect, it } from 'vitest';
import {
  ASSET_VER,
  FONTAWESOME_VENDOR_CSS,
  GITHUB_PAGES_ORIGIN,
  ICON_VER,
  fontAwesomeStylesheet,
  pagesIconUrl,
} from '../../scripts/build/asset-version.mjs';

describe('asset-version', () => {
  it('exports a dated, non-empty asset version', () => {
    expect(ASSET_VER).toMatch(/^\d{8}[a-z0-9]*$/);
  });

  it('exports a distinct icon cache stamp and GitHub Pages icon URLs', () => {
    expect(ICON_VER).toMatch(/^\d{8}[a-z0-9]*$/);
    expect(pagesIconUrl('favicon.svg')).toBe(`${GITHUB_PAGES_ORIGIN}/favicon.svg?v=${ICON_VER}`);
  });

  it('appends the asset version to the Font Awesome stylesheet', () => {
    expect(fontAwesomeStylesheet('', ASSET_VER)).toBe(`${FONTAWESOME_VENDOR_CSS}?v=${ASSET_VER}`);
    expect(fontAwesomeStylesheet('/portfolio/', ASSET_VER)).toBe(
      `/portfolio/${FONTAWESOME_VENDOR_CSS}?v=${ASSET_VER}`
    );
  });
});
