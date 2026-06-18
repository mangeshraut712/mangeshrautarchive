/**
 * iPhone 17 Pro Max Safari (WebKit) QA — 440×956 CSS viewport, DPR 3.
 * Run: node scripts/qa/iphone-17-pro-max-safari.mjs [url]
 */
import { webkit } from '@playwright/test';

const BASE = process.argv[2] || 'https://mangeshraut.pro';
const VIEWPORT = { width: 440, height: 956 };

const IPHONE_17_PRO_MAX_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1';

async function auditPage(page, path) {
  const url = `${BASE}${path}`;
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1500);

  const metrics = await page.evaluate(() => {
    const rect = sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right) };
    };
    const hits = (a, b) => a && b && !(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b);
    const actions = rect('.hero-actions');
    const toolbar = rect('.a11y-toolbar');
    const chat = rect('#chatbot-toggle');
    return {
      title: document.title,
      innerW: window.innerWidth,
      innerH: window.innerHeight,
      dpr: window.devicePixelRatio,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      hasMobileCss: [...document.styleSheets].some(s => {
        try {
          return s.href?.includes('mobile-viewport.css');
        } catch {
          return false;
        }
      }),
      navVisible: !!document.querySelector('#global-nav')?.offsetParent,
      toolbarVisible: !!document.querySelector('.a11y-toolbar')?.offsetParent,
      toolbarButtons: document.querySelectorAll('.a11y-toolbar button').length,
      actionsToolbar: hits(actions, toolbar),
      actionsChat: hits(actions, chat),
      safeAreaBottom: getComputedStyle(document.body).paddingBottom,
    };
  });

  let shareOk = null;
  if (path === '/' || path === '') {
    const toggle = page.locator('#website-share-toggle');
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();
      await page.waitForTimeout(400);
      shareOk = await page.evaluate(() => {
        const dialog = document.getElementById('website-share-dialog');
        const card = document.querySelector('.website-share-card');
        const r = card?.getBoundingClientRect();
        return {
          active: dialog?.classList.contains('active'),
          cardVisible: r ? r.width > 0 && r.height > 0 : false,
          fits:
            r &&
            r.top >= 0 &&
            r.bottom <= window.innerHeight + 2 &&
            r.left >= 0 &&
            r.right <= window.innerWidth + 2,
        };
      });
      await page.keyboard.press('Escape');
    }
  }

  return { path: path || '/', url, metrics, shareOk, consoleErrors: consoleErrors.slice(0, 5) };
}

async function main() {
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: IPHONE_17_PRO_MAX_UA,
  });
  const page = await context.newPage();

  const results = [];
  for (const path of ['/', '/travel.html', '/monitor.html']) {
    results.push(await auditPage(page, path));
  }

  await browser.close();

  const checks = [];
  for (const row of results) {
    const m = row.metrics;
    checks.push({
      page: row.path,
      viewport: `${m.innerW}x${m.innerH}`,
      overflow: m.overflow,
      overflowOk: m.overflow <= 2,
      mobileCss: m.hasMobileCss,
      toolbar: m.toolbarButtons,
      share: row.shareOk,
      consoleErrors: row.consoleErrors.length,
    });
  }

  console.log(JSON.stringify({ device: 'iPhone 17 Pro Max Safari (WebKit)', base: BASE, results, checks }, null, 2));

  const failed = checks.filter(c => !c.overflowOk || (c.page === '/' && c.toolbar !== 5));
  process.exit(failed.length ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
