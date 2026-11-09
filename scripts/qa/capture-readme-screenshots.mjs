import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = new URL('../../docs/screenshots/', import.meta.url);
const base = new URL(
  process.env.SCREENSHOT_BASE_URL || 'https://mangeshraut712.github.io/mangeshrautarchive/'
);
const surfaces = [
  ['home', ''],
  ['journal', 'blog/'],
  ['systems', 'systems.html'],
  ['monitor', 'monitor.html'],
  ['travel', 'travel.html'],
  ['uses', 'uses.html'],
  ['changelog', 'changelog.html'],
];
const records = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const width of [1440, 375, 768]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        colorScheme: theme,
        reducedMotion: 'reduce',
      });
      try {
        await context.addInitScript(value => localStorage.setItem('themeMode', value), theme);
        const page = await context.newPage();
        for (const [name, path] of surfaces) {
          const url = new URL(path, base).href;
          const response = await page.goto(url, { waitUntil: 'load' });
          if (!response?.ok()) throw new Error(`${url}: HTTP ${response?.status()}`);
          await page
            .locator(name === 'travel' ? '#place-search' : 'h1')
            .first()
            .waitFor();
          await page.evaluate(() => document.fonts.ready);
          // Let deferred first-viewport widgets settle without changing page content.
          await page.waitForTimeout(3500);
          const layout = await page.evaluate(() => ({
            viewport: innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            theme: document.documentElement.dataset.theme,
            reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
          }));
          if (layout.scrollWidth > width) throw new Error(`${name}/${width}: horizontal overflow`);
          const file = `${name}-${width}-${theme}.webp`;
          const buffer = await page.screenshot({ animations: 'disabled' });
          await sharp(buffer)
            .webp({ quality: 85 })
            .toFile(fileURLToPath(new URL(file, output)));
          records.push({ file, url, viewport: { width, height: 1000 }, theme, layout });
          console.log(`${name}: ${width}px ${theme}, no horizontal overflow`);
        }
      } finally {
        await context.close();
      }
    }
  }
  await writeFile(
    new URL('manifest.json', output),
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
          cwd: root,
          encoding: 'utf8',
        }).trim(),
        browser: `Chrome ${browser.version()}`,
        note: 'Real rendered pages; no network mocks or content replacements. Dynamic data is a snapshot. Reduced motion enabled.',
        records,
      },
      null,
      2
    ) + '\n'
  );
} finally {
  await browser.close();
}
