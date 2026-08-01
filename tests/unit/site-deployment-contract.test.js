import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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

describe('public deployment contract', () => {
  it('uses project-path-safe favicon URLs on every source page', () => {
    for (const page of publicPages) {
      const html = readProjectFile(`src/${page}`);
      expect(html, page).toContain('rel="icon" href="favicon.svg"');
      expect(html, page).not.toMatch(/(?:href|src)="\/favicon/);
      expect(html, page).not.toMatch(/href="\/apple-touch-icon/);
    }

    const manifest = JSON.parse(readProjectFile('src/manifest.json'));
    for (const icon of manifest.icons) {
      expect(icon.src).not.toMatch(/^\//);
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
});
