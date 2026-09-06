import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  APPLE_TOUCH_ICON_180,
  GITHUB_PAGES_ORIGIN,
  ICON_VER,
  PWA_ICON_192,
  PWA_ICON_512,
  pagesIconUrl,
} from '../../scripts/build/asset-version.mjs';

const root = process.cwd();
const publicPages = [
  'index.html',
  'about.html',
  '404.html',
  'offline.html',
  'gh.html',
  'systems.html',
  'monitor.html',
  'travel.html',
  'uses.html',
  'changelog.html',
];

function readProjectFile(path) {
  return readFileSync(resolve(root, path), 'utf8');
}

function iconHrefsFromHtml(html) {
  const hrefs = [];
  for (const match of html.matchAll(/<link\b[\s\S]*?>/gi)) {
    const tag = match[0];
    if (!/\brel="(?:icon|apple-touch-icon(?:-precomposed)?)"/.test(tag)) continue;
    const href = tag.match(/\bhref="([^"]+)"/)?.[1];
    if (href) hrefs.push(href);
  }
  return hrefs;
}

describe('public deployment contract', () => {
  it('uses project-path-safe favicon URLs on every source page', () => {
    const faviconSvg = pagesIconUrl('favicon.svg');
    for (const page of publicPages) {
      const html = readProjectFile(`src/${page}`);
      expect(html, page).toContain(`href="${faviconSvg}"`);
      expect(html, page).not.toMatch(/(?:href|src)="\/favicon/);
      expect(html, page).not.toMatch(/href="\/apple-touch-icon/);

      const iconHrefs = iconHrefsFromHtml(html);
      expect(iconHrefs.length, page).toBeGreaterThan(0);
      for (const href of iconHrefs) {
        expect(href, `${page}: ${href}`).toContain(`?v=${ICON_VER}`);
        expect(href, `${page}: ${href}`).toContain(`${GITHUB_PAGES_ORIGIN}/`);
        expect(href, `${page}: ${href}`).not.toMatch(/ganesh/i);
        expect(href, `${page}: ${href}`).not.toMatch(/apple-touch-icon\.png/);
        expect(href, `${page}: ${href}`).not.toMatch(/icon-192\.png(?!-mr-)/);
      }
      expect(html, page).toContain(pagesIconUrl(APPLE_TOUCH_ICON_180));
      expect(html, page).toContain(pagesIconUrl(PWA_ICON_192));
      expect(html, page).toContain(pagesIconUrl(PWA_ICON_512));
    }

    const manifest = JSON.parse(readProjectFile('src/manifest.json'));
    for (const icon of manifest.icons) {
      expect(icon.src).not.toMatch(/^\//);
      expect(icon.src).toContain(`?v=${ICON_VER}`);
      expect(icon.src).toContain(GITHUB_PAGES_ORIGIN);
      expect(icon.src).not.toMatch(/ganesh/i);
    }
  });

  it('points social preview images at GitHub Pages, not the paused apex host', () => {
    const shareImage = `${GITHUB_PAGES_ORIGIN}/assets/images/home.png`;
    for (const page of [
      'index.html',
      'systems.html',
      'monitor.html',
      'travel.html',
      'uses.html',
      'changelog.html',
    ]) {
      const html = readProjectFile(`src/${page}`);
      expect(html, page).toContain(`property="og:image" content="${shareImage}"`);
      expect(html, page).toContain(`name="twitter:image" content="${shareImage}"`);
      expect(html, page).not.toContain('https://mangeshraut.pro/assets/images/home.png');
    }
  });

  it('uses the custom domain for canonical discovery metadata', () => {
    for (const page of publicPages.filter(page => !['404.html', 'offline.html'].includes(page))) {
      const html = readProjectFile(`src/${page}`);
      const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
      expect(canonical?.[1], page).toMatch(/^https:\/\/mangeshraut\.pro(?:\/|#)/);
    }

    expect(readProjectFile('src/robots.txt')).toContain(
      'Sitemap: https://mangeshraut.pro/sitemap.xml'
    );
    expect(readProjectFile('src/sitemap.xml')).not.toContain(
      'mangeshraut712.github.io/mangeshrautarchive'
    );
  });

  it('does not cache mutable favicon URLs as immutable on Vercel', () => {
    const config = JSON.parse(readProjectFile('vercel.json'));
    const faviconHeaders = config.headers.filter(rule =>
      /^\/(?:favicon|apple-touch-icon)/.test(rule.source)
    );

    expect(faviconHeaders.length).toBeGreaterThan(0);
    for (const rule of faviconHeaders) {
      const cacheControl = rule.headers.find(header => header.key === 'Cache-Control')?.value;
      expect(cacheControl, rule.source).toBe('public, max-age=0, must-revalidate');
    }
  });

  it('ships cache-busted MR crown touch icons as real PNG files', () => {
    for (const path of [
      `src/${APPLE_TOUCH_ICON_180}`,
      `src/${PWA_ICON_192}`,
      `src/${PWA_ICON_512}`,
    ]) {
      expect(existsSync(resolve(root, path)), path).toBe(true);
    }
    expect(readProjectFile('src/index.html')).toContain('assets/images/ganesh.png');
    expect(readProjectFile('src/manifest.json')).not.toMatch(/ganesh/i);
  });
});
