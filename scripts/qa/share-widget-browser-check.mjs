/**
 * Quick Chrome vs WebKit share-widget diagnostic.
 * Usage: node scripts/qa/share-widget-browser-check.mjs [url]
 */
import { chromium, webkit } from 'playwright';

const url = process.argv[2] || 'https://mangeshraut.pro/';

async function probe(browserType, name) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('.a11y-toolbar', { timeout: 30_000 });

  const before = await page.evaluate(() => ({
    dialogExists: !!document.getElementById('website-share-dialog'),
    toggleExists: !!document.getElementById('website-share-toggle'),
      dialogClasses: document.getElementById('website-share-dialog')?.className || null,
  }));

  await page.locator('#website-share-toggle').click();
  await page.waitForTimeout(400);

  const after = await page.evaluate(() => {
    const dialog = document.getElementById('website-share-dialog');
    const card = document.querySelector('.website-share-card');
    const rect = card?.getBoundingClientRect();
    const dialogStyle = dialog ? getComputedStyle(dialog) : null;
    const cardStyle = card ? getComputedStyle(card) : null;
    return {
      dialogClasses: dialog?.className || null,
      ariaHidden: dialog?.getAttribute('aria-hidden'),
      dialogDisplay: dialogStyle?.display,
      dialogOpacity: dialogStyle?.opacity,
      dialogPointerEvents: dialogStyle?.pointerEvents,
      dialogVisibility: dialogStyle?.visibility,
      cardDisplay: cardStyle?.display,
      cardOpacity: cardStyle?.opacity,
      cardTransform: cardStyle?.transform,
      cardVisible: rect ? rect.width > 0 && rect.height > 0 : false,
      cardRect: rect
        ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        : null,
      copyRow: !!document.getElementById('website-share-copy'),
      qrImg: !!document.querySelector('.website-share-qr'),
    };
  });

  await browser.close();
  return { name, before, after, consoleLogs, pageErrors };
}

const results = await Promise.all([
  probe(chromium, 'Chrome'),
  probe(webkit, 'WebKit/Safari'),
]);

console.log(JSON.stringify(results, null, 2));
