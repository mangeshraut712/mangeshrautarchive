import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import sharp from 'sharp';

import { generateCaseStudyPages } from '../../scripts/build/generate-case-study-pages.mjs';
import { resolveApiUrl } from '../e2e/helpers/postdeploy.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const liveSiteUrl = 'https://mangeshraut712.github.io/mangeshrautarchive';

test('post-deploy API routing accepts only the portfolio Pages hostname', () => {
  assert.equal(
    resolveApiUrl(liveSiteUrl, '/api/health'),
    'https://assistme-chat.mangeshraut712.workers.dev/api/health'
  );
  for (const host of ['notgithub.io', 'github.io.evil.example', 'other.github.io']) {
    assert.equal(resolveApiUrl(`https://${host}/`, '/api/health'), `https://${host}/api/health`);
  }
});

function readRepositoryFile(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

function assertIncludesLiteral(content, literal, label) {
  assert.ok(content.includes(literal), `Expected ${label} to include ${literal}`);
}

test('literal published URL validation rejects a lookalike host', () => {
  assert.throws(
    () =>
      assertIncludesLiteral(
        'https://mangeshraut712.githubXio/mangeshrautarchive',
        liveSiteUrl,
        'lookalike Pages host'
      ),
    /Expected lookalike Pages host to include/u
  );
});

test('published metadata, images, and discovery files remain consistent', async () => {
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
    assertIncludesLiteral(source, liveSiteUrl, relativePath);
  }

  const markup = readRepositoryFile('src/index.html');
  const picture = markup.match(
    /<picture>\s*<source[^>]*graduation-mobile\.webp[\s\S]*?<\/picture>/
  )?.[0];
  assert.ok(picture, 'Expected the About portrait picture');
  const srcset = picture.match(/srcset="([^"]+)"/)?.[1] || '';
  const sources = [...srcset.matchAll(/(assets\/images\/[^\s,]+)\s+(\d+)w/g)];
  assert.equal(sources.length, 3);
  for (const [, path, width] of sources) {
    const metadata = await sharp(resolve(repoRoot, 'src', path)).metadata();
    assert.equal(Number(width), metadata.width, `${path} width descriptor`);
  }
  const img = picture.match(/<img[^>]+>/)?.[0] || '';
  const width = Number(img.match(/\bwidth="(\d+)"/)?.[1]);
  const height = Number(img.match(/\bheight="(\d+)"/)?.[1]);
  const metadata = await sharp(resolve(repoRoot, 'src/assets/images/graduation.jpg')).metadata();
  assert.equal(width, metadata.width);
  assert.equal(height, metadata.height);

  const experience = markup.match(/<section id="experience"[\s\S]*?<\/section>/)?.[0] || '';
  const icons = [...experience.matchAll(/<svg\b[^>]*>/g)].map(match => match[0]);
  assert.ok(icons.length > 0, 'Expected inline Experience icons');
  for (const icon of icons) {
    assert.match(icon, /\bwidth="20"/);
    assert.match(icon, /\bheight="20"/);
  }
});

test('KaTeX stylesheet ships every referenced font from the installed version', () => {
  const css = readRepositoryFile('src/assets/css/katex.min.css');
  const packageVersion = JSON.parse(readRepositoryFile('node_modules/katex/package.json')).version;
  const fontNames = [...css.matchAll(/url\(fonts\/(KaTeX_[^)]+)\)/g)].map(match => match[1]);

  assert.ok(fontNames.length > 0, 'KaTeX stylesheet must reference self-hosted fonts');
  assertIncludesLiteral(css, `katex-version:after{content:"${packageVersion}"`, 'KaTeX stylesheet');

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
    assertIncludesLiteral(markup, `id="${panelId}"`, `monitor panel ${panelId}`);
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
      assertIncludesLiteral(markup, liveSiteUrl, filename);
    }
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true });
  }
});
