/**
 * iPhone 17 Pro Max display compatibility audit (Chrome + Safari UA).
 * Run: node scripts/qa/iphone-17-pro-max-display-compat.mjs [url]
 */
import { chromium, webkit } from '@playwright/test';

const BASE = process.argv[2] || 'https://mangeshraut.pro';
const VIEWPORT = { width: 440, height: 956 };

async function audit(browserType, label) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1200);

  const data = await page.evaluate(() => ({
    title: document.title,
    innerW: window.innerWidth,
    innerH: window.innerHeight,
    dpr: window.devicePixelRatio,
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    viewportFit: document.querySelector('meta[name="viewport"]')?.content.includes('viewport-fit=cover'),
    appleCss: [...document.styleSheets].some(s => {
      try {
        return s.href?.includes('apple-super-retina-display.css');
      } catch {
        return false;
      }
    }),
    mobileCss: [...document.styleSheets].some(s => {
      try {
        return s.href?.includes('mobile-viewport.css');
      } catch {
        return false;
      }
    }),
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    dynamicIsland: !!document.querySelector('.global-nav.dynamic-island'),
    mainPadTop: getComputedStyle(document.querySelector('#main-content')).paddingTop,
    chromeTop: getComputedStyle(document.documentElement).getPropertyValue('--apple-chrome-top').trim(),
  }));

  await browser.close();
  return { engine: label, ...data };
}

const results = await Promise.all([audit(chromium, 'Chrome'), audit(webkit, 'Safari')]);
const failures = [];

for (const r of results) {
  if (r.innerW !== 440 || r.innerH !== 956) failures.push(`${r.engine}: viewport ${r.innerW}x${r.innerH}`);
  if (r.dpr !== 3) failures.push(`${r.engine}: DPR ${r.dpr}`);
  if (r.overflowX > 2) failures.push(`${r.engine}: overflow ${r.overflowX}px`);
  if (!r.viewportFit) failures.push(`${r.engine}: missing viewport-fit=cover`);
  if (!r.appleCss) failures.push(`${r.engine}: apple-super-retina-display.css not loaded`);
  if (!r.dynamicIsland) failures.push(`${r.engine}: Dynamic Island nav missing`);
}

console.log(JSON.stringify({ base: BASE, device: 'iPhone 17 Pro Max', results, failures, passed: !failures.length }, null, 2));
process.exit(failures.length ? 1 : 0);
