/**
 * iPhone 17 Pro Max Chrome mobile audit — 440×956, DPR 3.
 * Run: node scripts/qa/iphone-17-pro-max-chrome-audit.mjs [url] [outDir]
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.argv[2] || 'https://mangeshraut.pro';
const OUT = process.argv[3] || 'artifacts/qa/iphone-17-pro-max-chrome';
const VIEWPORT = { width: 440, height: 956 };

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1';

async function shot(page, name) {
  const path = join(OUT, `${name}.jpeg`);
  await page.screenshot({ path, type: 'jpeg', quality: 88, scale: 'css', fullPage: false });
  return path;
}

async function layoutCheck(page) {
  return page.evaluate(() => {
    const overlap = (a, b) => {
      if (!a || !b) return false;
      return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    };
    const box = sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, w: r.width, h: r.height };
    };
    const inViewport = r =>
      r && r.top >= -2 && r.left >= -2 && r.bottom <= window.innerHeight + 2 && r.right <= window.innerWidth + 2;
    const top = box('#go-to-top');
    const chat = box('#chatbot-toggle');
    const toolbar = box('.a11y-toolbar');
    const close = box('.website-share-close');
    const lastTab = box('.share-mirror-tab:last-child');
    const backdrop = document.getElementById('chatbot-backdrop');
    const widget = document.getElementById('chatbot-widget');
    const backdropStyle = backdrop ? getComputedStyle(backdrop) : null;
    const widgetStyle = widget ? getComputedStyle(widget) : null;
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      fabOverlap: overlap(top, chat),
      fabGap: top && chat ? top.top - chat.bottom : null,
      toolbarInView: inViewport(toolbar),
      shareCloseOverlapsTab: overlap(close, lastTab),
      shareCloseClearance: close && lastTab ? close.left - lastTab.right : null,
      hasShareHeaderRow: !!document.querySelector('.website-share-card-top'),
      shareDialogHidden: document.getElementById('website-share-dialog')?.classList.contains('hidden'),
      chatbotBackdropActive: backdrop?.classList.contains('active'),
      chatbotBodyLocked: document.body.classList.contains('chatbot-open'),
      chatbotBackdropVisible: backdropStyle ? backdropStyle.visibility === 'visible' && parseFloat(backdropStyle.opacity) > 0.5 : false,
      chatbotBackdropBlur: backdropStyle?.webkitBackdropFilter || backdropStyle?.backdropFilter || '',
      chatbotWidgetBg: widgetStyle?.backgroundColor || '',
      healthSleep: document.getElementById('whoop-sleep-val')?.textContent,
      healthSync: document.getElementById('health-sync-text')?.textContent,
    };
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: UA,
  });
  const page = await context.newPage();
  const report = { device: 'iPhone 17 Pro Max Chrome', base: BASE, viewport: VIEWPORT, shots: {}, checks: [] };

  // Homepage — scrolled top
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('.a11y-toolbar', { timeout: 20_000 });
  await page.waitForTimeout(1200);
  report.shots.homeTop = await shot(page, '01-home-top');
  let layout = await layoutCheck(page);
  report.checks.push({ id: 'home-top', ...layout });

  // FAB stack after scroll
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
  await page.waitForTimeout(500);
  report.shots.homeFab = await shot(page, '02-home-fab-stack');
  layout = await layoutCheck(page);
  report.checks.push({ id: 'home-fab-stack', ...layout });

  // About section
  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  report.shots.about = await shot(page, '03-about-section');
  layout = await layoutCheck(page);
  report.checks.push({ id: 'about-section', ...layout });

  // Share dialog
  await page.keyboard.press('Escape');
  await page.locator('#website-share-toggle').click();
  await page.waitForFunction(() => {
    const dialog = document.getElementById('website-share-dialog');
    if (!dialog?.classList.contains('active')) return false;
    const style = getComputedStyle(dialog);
    return style.visibility === 'visible' && parseFloat(style.opacity || '0') >= 0.85;
  }, { timeout: 15_000 });
  await page.waitForTimeout(400);
  report.shots.shareOpen = await shot(page, '04-share-dialog');
  layout = await layoutCheck(page);
  report.checks.push({ id: 'share-open', ...layout });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Chatbot open
  await page.locator('#chatbot-toggle').click();
  await page.waitForSelector('#chatbot-widget.visible', { timeout: 15_000 });
  await page.waitForTimeout(800);
  report.shots.chatbotOpen = await shot(page, '05-chatbot-open');
  layout = await layoutCheck(page);
  report.checks.push({ id: 'chatbot-open', ...layout });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Currently / health
  await page.locator('#currently-section').scrollIntoViewIfNeeded();
  await page.waitForTimeout(6000);
  report.shots.currently = await shot(page, '06-currently-health');
  layout = await layoutCheck(page);
  report.checks.push({ id: 'currently-health', ...layout });

  // Travel
  await page.goto(`${BASE}/travel.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  report.shots.travel = await shot(page, '07-travel');
  layout = await layoutCheck(page);
  report.checks.push({ id: 'travel', ...layout });

  await browser.close();

  const failures = [];
  for (const c of report.checks) {
    if (c.overflowX > 2) failures.push(`${c.id}: horizontal overflow ${c.overflowX}px`);
    if (c.fabOverlap) failures.push(`${c.id}: FAB overlap`);
    if (c.shareCloseOverlapsTab) failures.push(`${c.id}: share close overlaps GitHub tab`);
    if (c.id === 'chatbot-open') {
      if (!c.chatbotBackdropActive) failures.push('chatbot-open: backdrop not active');
      if (!c.chatbotBodyLocked) failures.push('chatbot-open: body not locked');
      if (!c.chatbotBackdropBlur.includes('blur')) failures.push('chatbot-open: backdrop missing blur');
    }
    if (c.id === 'share-open' && !c.hasShareHeaderRow) failures.push('share-open: missing card header row');
    if (c.id === 'share-open' && c.shareDialogHidden) failures.push('share-open: dialog has stale hidden class');
    if (c.id === 'share-open' && c.shareCloseClearance !== null && c.shareCloseClearance < 4) {
      failures.push(`share-open: close clearance only ${c.shareCloseClearance}px`);
    }
  }

  report.failures = failures;
  report.passed = failures.length === 0;
  await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, failures, shots: report.shots }, null, 2));
  process.exit(report.passed ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
