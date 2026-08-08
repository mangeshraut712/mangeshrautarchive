import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = path => readFile(resolve(process.cwd(), path), 'utf8');

describe('portfolio visual refresh contracts', () => {
  it('ships one Hindi-only launch greeting with critical final geometry', async () => {
    const html = await read('src/index.html');
    const launchStart = html.indexOf('<div id="launch-intro"');
    const launchEnd = html.indexOf('<script>', launchStart);
    const launch = html.slice(launchStart, launchEnd);

    expect(html.match(/id="launch-intro"/g)).toHaveLength(1);
    expect(launch).toContain('aria-label="नमस्ते"');
    expect(launch).not.toMatch(/Mangesh Raut|ARCHIVE/);
    expect(html).toMatch(/\.launch-intro-hello\s*\{[\s\S]*?width:/);
  });

  it('owns a centered first-viewport hero and bottom resume menu', async () => {
    const [css, html, resume] = await Promise.all([
      read('src/assets/css/homepage-hero-polish.css'),
      read('src/index.html'),
      read('src/js/modules/resume-dropdown.js'),
    ]);

    expect(css).not.toContain('grid-template-columns');
    expect(css).toContain('min-height: calc(100svh - var(--site-nav-offset');
    expect(css).toMatch(
      /#home\.hero-section \.hero-layout-wrapper\s*\{[\s\S]*?display:\s*flex !important;[\s\S]*?flex-direction:\s*column !important;/
    );
    expect(css).toMatch(/\.resume-dropdown-menu\s*\{[\s\S]*?background:\s*#ffffff !important;/);
    expect(css).toMatch(
      /#home\.hero-section \.profile-image-wrapper[\s\S]*?box-shadow:\s*none !important;/
    );
    expect(css).toMatch(
      /#home\.hero-section #profile-image\s*\{[\s\S]*?border:\s*0 !important;[\s\S]*?box-shadow:\s*none !important;/
    );
    expect(css).toContain('@media (max-width: 768px)');
    expect(html).toMatch(/\.launch-intro-path\s*\{[\s\S]*?stroke-dashoffset:\s*1/);
    expect(html).not.toContain('resume-menu-header');
    expect(html.match(/class="resume-dropdown-item"/g)).toHaveLength(2);
    expect(resume).not.toContain("menu.dataset.placement = 'top'");
    expect(resume).toContain("menu.dataset.placement = 'bottom'");
    expect(resume).not.toContain("menu.style.overflowY = 'auto'");
  });

  it('versions every explicit homepage icon reference', async () => {
    const [html, versionSource] = await Promise.all([
      read('src/index.html'),
      read('scripts/build/asset-version.mjs'),
    ]);
    const version = versionSource.match(/ASSET_VER = '([^']+)'/)?.[1];
    expect(version).toBeTruthy();

    const iconHrefs = [
      ...html.matchAll(/<link[^>]+rel="(?:icon|apple-touch-icon)"[^>]+href="([^"]+)"/g),
    ].map(match => match[1]);
    expect(iconHrefs.length).toBeGreaterThanOrEqual(4);
    expect(iconHrefs.every(href => href.includes(`?v=${version}`))).toBe(true);
  });

  it('uses Baseline loading and bitmap decoding on relevant paths', async () => {
    const [publications, blog, bitmap] = await Promise.all([
      read('src/js/modules/publications-preview.js'),
      read('src/js/modules/blog-markdown.js'),
      read('src/js/utils/image-bitmap.js'),
    ]);

    expect(publications).toContain('loading="lazy"');
    expect(blog).toContain('loading="lazy"');
    expect(bitmap).toContain('createImageBitmap');
  });
});
