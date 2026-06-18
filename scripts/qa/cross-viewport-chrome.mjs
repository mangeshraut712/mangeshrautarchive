/**
 * Cross-viewport Chrome QA: desktop / tablet / mobile.
 * Run: PLAYWRIGHT_BASE_URL=http://127.0.0.1:4000 node scripts/qa/cross-viewport-chrome.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000';
const OUT = join(process.cwd(), 'artifacts', 'qa-cross-viewport-chrome');

const VIEWPORTS = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'mobile', width: 390, height: 844 },
];

async function checkPage(page, path, checks) {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}v=qa-cross`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(800);

  const results = [];
  for (const check of checks) {
    try {
      results.push({ ...check, ok: await check.run(page) });
    } catch (error) {
      results.push({ ...check, ok: false, error: error.message });
    }
  }
  return results;
}

const homeChecks = [
  {
    name: 'title',
    run: async page => /Mangesh Raut/i.test(await page.title()),
  },
  {
    name: 'navbar',
    run: async page => page.locator('#global-nav').isVisible(),
  },
  {
    name: 'main-content',
    run: async page => page.locator('#main-content').isVisible(),
  },
  {
    name: 'a11y-toolbar-5-buttons',
    run: async page => {
      await page.waitForSelector('.a11y-toolbar', { state: 'visible', timeout: 15_000 });
      return (await page.locator('.a11y-toolbar button').count()) === 5;
    },
  },
  {
    name: 'search-overlay',
    run: async page => {
      await page.locator('#search-toggle').click();
      const active = await page.locator('#search-overlay').evaluate(el => el.classList.contains('active'));
      await page.keyboard.press('Escape');
      return active;
    },
  },
  {
    name: 'liquid-glass-clear-vs-tinted',
    run: async page => {
      await page.waitForFunction(() => typeof window.a11y?.applyGlassTint === 'function', null, {
        timeout: 15_000,
      });
      const sample = async tint => {
        await page.evaluate(v => window.a11y.applyGlassTint(v, { instant: true }), tint);
        await page.waitForTimeout(250);
        return page.evaluate(() => {
          const root = getComputedStyle(document.documentElement);
          const nav = document.querySelector('.global-nav.dynamic-island');
          const cs = nav ? getComputedStyle(nav) : null;
          return {
            mode: document.documentElement.dataset.lgMode,
            fill: parseFloat(root.getPropertyValue('--lg-nav-light-fill')),
            blur: parseFloat(root.getPropertyValue('--lg-blur-nav')),
            alpha: cs ? parseFloat((cs.backgroundColor.match(/[\d.]+(?=\s*\))/ ) || ['0'])[0]) : 0,
          };
        });
      };
      const clear = await sample(0);
      const tinted = await sample(100);
      return (
        clear.mode === 'clear' &&
        tinted.mode === 'tinted' &&
        tinted.fill - clear.fill > 40 &&
        clear.blur - tinted.blur > 20
      );
    },
  },
  {
    name: 'no-body-horizontal-overflow',
    run: async page =>
      page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth <= 2),
  },
  {
    name: 'chatbot-toggle',
    run: async page => page.locator('#chatbot-toggle').isVisible(),
  },
  {
    name: 'health-vitals-api',
    run: async page => {
      const res = await page.request.get(`${BASE}/api/health-vitals/summary`);
      if (!res.ok()) return false;
      const body = await res.json();
      return body.status === 'live' && body.data?.sleepScore != null;
    },
  },
];

const travelChecks = [
  {
    name: 'travel-title',
    run: async page => /Travel Atlas/i.test(await page.title()),
  },
  {
    name: 'travel-map-canvas',
    run: async page => page.locator('#map-container canvas').first().isVisible({ timeout: 20_000 }),
  },
  {
    name: 'travel-search-pune',
    run: async page => {
      await page.locator('#place-search').fill('Pune');
      await page.waitForTimeout(400);
      const count = await page.locator('.travel-stop').count();
      return count === 2;
    },
  },
  {
    name: 'travel-maplibre-zoom-controls',
    run: async page => {
      const zoomIn = page.locator('.maplibregl-ctrl-zoom-in');
      return (await zoomIn.count()) > 0 && (await zoomIn.first().isVisible());
    },
  },
];

const monitorChecks = [
  {
    name: 'monitor-title',
    run: async page => /System Monitor/i.test(await page.locator('h1').innerText()),
  },
  {
    name: 'monitor-backend-status',
    run: async page => {
      const el = page.locator('#backend-status');
      await el.waitFor({ state: 'visible', timeout: 10_000 });
      const text = await el.innerText();
      return !/Checking/i.test(text);
    },
  },
  {
    name: 'monitor-health-grid',
    run: async page =>
      page.locator('#platform-health-grid .health-item').first().isVisible({ timeout: 15_000 }),
  },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const matrix = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.id === 'mobile',
      hasTouch: vp.id !== 'desktop',
    });
    const page = await context.newPage();

    for (const [pageName, path, checks] of [
      ['home', '/', homeChecks],
      ['travel', '/travel.html', travelChecks],
      ['monitor', '/monitor.html', monitorChecks],
    ]) {
      const results = await checkPage(page, path, checks);
      const shot = `${vp.id}-${pageName}.jpeg`;
      await page.screenshot({
        path: join(OUT, shot),
        type: 'jpeg',
        quality: 85,
        fullPage: pageName === 'home' && vp.id === 'desktop',
      });

      for (const row of results) {
        matrix.push({
          viewport: vp.id,
          size: `${vp.width}x${vp.height}`,
          page: pageName,
          check: row.name,
          pass: row.ok,
          error: row.error || null,
        });
      }
    }

    await context.close();
  }

  await browser.close();

  const failed = matrix.filter(r => !r.pass);
  const report = {
    base: BASE,
    browser: 'Google Chrome',
    total: matrix.length,
    passed: matrix.filter(r => r.pass).length,
    failed: failed.length,
    matrix,
  };

  await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  console.log(`Cross-viewport Chrome QA: ${report.passed}/${report.total} passed`);
  for (const vp of VIEWPORTS) {
    const rows = matrix.filter(r => r.viewport === vp.id);
    const pass = rows.filter(r => r.pass).length;
    console.log(`  ${vp.id} (${vp.width}x${vp.height}): ${pass}/${rows.length}`);
    for (const row of rows.filter(r => !r.pass)) {
      console.log(`    FAIL ${row.page}/${row.check}${row.error ? `: ${row.error}` : ''}`);
    }
  }
  console.log(`Artifacts: ${OUT}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
