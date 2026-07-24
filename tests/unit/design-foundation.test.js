import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
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
});
