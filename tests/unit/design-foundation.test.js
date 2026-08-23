import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function readSrc(relativePath) {
  return readFileSync(join(root, 'src', relativePath), 'utf8');
}

function stylesheetHrefsOutsideNoscript(html) {
  const withoutNoscript = html.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '');
  const hrefs = [];
  const pattern = /(?:href|data-href)=["']([^"']+\.css[^"']*)["']/gi;
  let match;
  while ((match = pattern.exec(withoutNoscript))) {
    hrefs.push(match[1].replace(/\?v=[^"']*$/, ''));
  }
  return hrefs;
}

describe('design foundation ownership', () => {
  it('keeps apple-design-system as the owner of --text-secondary', () => {
    const designSystem = readSrc('assets/css/apple-design-system.css');
    expect(designSystem).toMatch(/--text-secondary:\s*#6e6e73/);
    expect(designSystem).toMatch(/html\.dark[\s\S]*--text-secondary:\s*#a1a1a6/);

    const typography = readSrc('assets/css/typography-system.css');
    expect(typography).toMatch(/--text-secondary-light:\s*#6e6e73/);
    expect(typography).toMatch(/--text-secondary-dark:\s*#a1a1a6/);

    const critical = readSrc('assets/css/critical-tokens.css');
    expect(critical).toMatch(/--text-secondary-light:\s*#6e6e73/);

    const sections = readSrc('assets/css/sections-apple-premium.css');
    expect(sections).not.toMatch(/:root\s*\{[^}]*--apple-blue:/);
    expect(sections).not.toMatch(/html\.dark\s*\{[^}]*--text-secondary:/);
  });

  it('does not double-link stylesheets outside noscript on subpages', () => {
    const pages = ['systems.html', 'monitor.html', 'uses.html', 'travel.html', 'changelog.html'];
    for (const page of pages) {
      const hrefs = stylesheetHrefsOutsideNoscript(readSrc(page));
      const counts = hrefs.reduce((acc, href) => {
        acc[href] = (acc[href] || 0) + 1;
        return acc;
      }, {});
      const duplicates = Object.entries(counts).filter(([, count]) => count > 1);
      expect(duplicates, `${page} duplicate stylesheets`).toEqual([]);
    }
  });

  it('loads accessibility.css (with high-contrast rules) on public shells', () => {
    const accessibility = readSrc('assets/css/accessibility.css');
    expect(accessibility).toMatch(/html\.high-contrast/);
    expect(accessibility).toMatch(/Merged from:.*high-contrast/);

    for (const page of [
      'index.html',
      'systems.html',
      'monitor.html',
      'uses.html',
      'travel.html',
      'changelog.html',
    ]) {
      expect(readSrc(page)).toMatch(/assets\/css\/accessibility\.css/);
    }
  });

  it('guarantees active blog chips and segmented glass presets do not suffer from white-on-white text in light mode', () => {
    const solidSurfaces = readSrc('assets/css/theme-solid-surfaces.css');
    expect(solidSurfaces).toMatch(/\.blog-filter-chip:not\(\.active\)/);
    expect(solidSurfaces).toMatch(/\.uses-control-tile:not\(\.active\)/);

    const premium = readSrc('assets/css/premium-enhancements.css');
    expect(premium).toMatch(/\.blog-filter-chip\.is-active/);
    expect(premium).toMatch(/button\.a11y-glass-preset\.is-active/);

    const accessibility = readSrc('assets/css/accessibility.css');
    expect(accessibility).toMatch(/\.a11y-glass-popover__badge\[data-mode='tinted'\]/);
  });

  it('unifies modal red circular close buttons and prevents ghost pseudo-elements', () => {
    const accessibility = readSrc('assets/css/accessibility.css');
    expect(accessibility).toMatch(
      /button\.shortcuts-modal__close,\s*\.shortcuts-modal__close\s*\{[^}]*background:\s*#ff3b30/
    );

    const blogCss = readSrc('assets/css/blog.css');
    expect(blogCss).toMatch(
      /button\.blog-modal-close,\s*\.blog-modal-close\s*\{[^}]*background:\s*#ff3b30/
    );
    expect(blogCss).toMatch(/button\.blog-modal-close::before/);
    expect(blogCss).toMatch(/\.article-code-block code\s*\{[^}]*color:\s*#f5f5f7/);

    const appleOverrides = readSrc('assets/css/apple-premium-overrides.css');
    expect(appleOverrides).toMatch(/\.shortcuts-modal__close/);
    expect(appleOverrides).toMatch(/\.blog-modal-close/);
  });

  it('documents Apple HIG design standard in docs/DESIGN.md and enforces vibrant Apple Blue gradient buttons', () => {
    expect(existsSync(join(root, 'docs/DESIGN.md'))).toBe(true);

    const designMd = readFileSync(join(root, 'docs/DESIGN.md'), 'utf-8');
    expect(designMd).toContain('# DESIGN.md — Apple Human Interface Portfolio Design System');
    expect(designMd).toContain('#0071e3');
    expect(designMd).toContain('#ff3b30');

    const premium = readSrc('assets/css/premium-enhancements.css');
    expect(premium).toContain('appleBtnShine');
    expect(premium).toMatch(/\.btn-primary,\s*\.hero-cta-primary[^}]*background-color:\s*#0071e3/);
  });
});
