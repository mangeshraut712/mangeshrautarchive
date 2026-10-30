import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { generateCaseStudyPages } from '../../scripts/build/generate-case-study-pages.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const liveSiteUrl = 'https://mangeshraut712.github.io/mangeshrautarchive';

function readRepositoryFile(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

test('published metadata and discovery files use the active GitHub Pages host', () => {
  const publishedFiles = [
    'src/index.html',
    'src/systems.html',
    'src/monitor.html',
    'src/travel.html',
    'src/uses.html',
    'src/changelog.html',
    'src/about.html',
    'src/contact.html',
    'src/404.html',
    'src/gh.html',
    'src/ai.txt',
    'src/llms.txt',
    'src/llms-full.txt',
    'src/robots.txt',
    'src/sitemap.xml',
    'src/humans.txt',
    'src/security.txt',
    'src/.well-known/security.txt',
  ];

  for (const relativePath of publishedFiles) {
    const source = readRepositoryFile(relativePath);
    assert.doesNotMatch(source, /https:\/\/(?:www\.)?mangeshraut\.pro\b/);
    assert.match(source, new RegExp(liveSiteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('KaTeX stylesheet ships every referenced font from the installed version', () => {
  const css = readRepositoryFile('src/assets/css/katex.min.css');
  const packageVersion = JSON.parse(readRepositoryFile('node_modules/katex/package.json')).version;
  const fontNames = [...css.matchAll(/url\(fonts\/(KaTeX_[^)]+)\)/g)].map(match => match[1]);

  assert.ok(fontNames.length > 0, 'KaTeX stylesheet must reference self-hosted fonts');
  assert.match(css, new RegExp(`katex-version:after\\{content:\\"${packageVersion}\\"`));

  for (const fontName of new Set(fontNames)) {
    assert.equal(
      existsSync(resolve(repoRoot, 'src/assets/css/fonts', fontName)),
      true,
      `Missing KaTeX font referenced by the stylesheet: ${fontName}`
    );
  }
});

test('the monitor All Views tab only controls panels that exist', () => {
  const markup = readRepositoryFile('src/monitor.html');
  const allViewsTab = markup.match(/<button(?=[^>]*\bid="tab-all")[^>]*>/)?.[0];

  assert.ok(allViewsTab, 'Expected the All Views tab control');
  const controls = allViewsTab.match(/aria-controls="([^"]+)"/)?.[1].split(/\s+/) || [];
  assert.ok(controls.length > 0, 'Expected All Views to declare the panels it controls');

  for (const panelId of controls) {
    assert.match(markup, new RegExp(`\\bid="${panelId}"`));
  }
});

test('generated case studies keep public metadata on the active GitHub Pages host', async () => {
  const outputDirectory = mkdtempSync(resolve(tmpdir(), 'case-study-pages-'));

  try {
    await generateCaseStudyPages(outputDirectory);
    const caseStudyDirectory = resolve(outputDirectory, 'case-studies');

    for (const filename of readdirSync(caseStudyDirectory)) {
      const markup = readFileSync(resolve(caseStudyDirectory, filename), 'utf8');
      assert.doesNotMatch(markup, /https:\/\/(?:www\.)?mangeshraut\.pro\b/);
      assert.match(markup, new RegExp(liveSiteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true });
  }
});
