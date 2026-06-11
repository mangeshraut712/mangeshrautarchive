/**
 * Playwright-interactive QA for WWDC26 liquid glass (local dist preview).
 * Run: PLAYWRIGHT_BASE_URL=http://127.0.0.1:4196 node scripts/qa/interactive-liquid-glass-qa.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4196';
const OUT = join(process.cwd(), 'artifacts', 'qa-liquid-glass');

const results = [];

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function sampleGlass(page) {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const pick = sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        backdrop: cs.backdropFilter,
        bg: cs.backgroundColor,
        border: cs.border,
        radius: cs.borderRadius,
      };
    };
    return {
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      tint: root.getPropertyValue('--lg-tint').trim(),
      blurCard: root.getPropertyValue('--lg-blur-card').trim(),
      cardFill: root.getPropertyValue('--lg-card-light-fill').trim(),
      cardFillDark: root.getPropertyValue('--lg-card-dark-fill').trim(),
      experience: pick('.experience-content'),
      skillCategory: pick('#skills-container .skill-category'),
      skillBadge: pick('#skills-container .skill-scroll-wrapper .skill-badge'),
    };
  });
}

async function setTheme(page, mode) {
  await page.evaluate(mode => {
    document.documentElement.classList.remove('dark', 'light');
    if (mode === 'dark') document.documentElement.classList.add('dark');
    if (mode === 'light') document.documentElement.classList.remove('dark');
  }, mode);
}

async function applyTintViaHelper(page, ratio) {
  return page.evaluate(ratio => {
    if (typeof window.a11y?.applyGlassTint === 'function') {
      window.a11y.applyGlassTint(Math.round(ratio * 100));
    } else {
      document.documentElement.style.setProperty('--lg-tint', String(ratio));
    }
    return {
      tint: getComputedStyle(document.documentElement).getPropertyValue('--lg-tint').trim(),
      blurCard: getComputedStyle(document.documentElement).getPropertyValue('--lg-blur-card').trim(),
      cardFill: getComputedStyle(document.documentElement).getPropertyValue('--lg-card-light-fill').trim(),
    };
  }, ratio);
}

async function shot(page, name) {
  const path = join(OUT, `${name}.jpeg`);
  await page.screenshot({ path, type: 'jpeg', quality: 85, scale: 'css' });
  return path;
}

async function waitForA11y(page) {
  await page.waitForFunction(() => typeof window.a11y?.applyGlassTint === 'function', null, {
    timeout: 20_000,
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  try {
    const home = await page.goto(`${BASE}/?v=qa-glass`, { waitUntil: 'domcontentloaded' });
    record('Homepage loads', home?.ok() === true, `status ${home?.status()}`);

    await expectVisible(page, '#global-nav', 'Global nav visible');
    await expectVisible(page, '#main-content', 'Main content visible');

    await page.goto(`${BASE}/#skills?v=qa-glass`, { waitUntil: 'networkidle' });
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await page.locator('#skills-container .skill-category').first().waitFor({ state: 'visible', timeout: 45_000 });

    await setTheme(page, 'dark');
    const darkSample = await sampleGlass(page);
    record(
      'Dark mode skill category glass',
      Boolean(darkSample.skillCategory?.backdrop?.includes('blur')),
      darkSample.skillCategory?.backdrop || 'missing'
    );
    record(
      'Dark mode experience card glass',
      Boolean(darkSample.experience?.backdrop?.includes('blur')),
      darkSample.experience?.backdrop || 'missing'
    );
    await shot(page, '01-skills-dark');

    await setTheme(page, 'light');
    const lightSample = await sampleGlass(page);
    record(
      'Light mode skill category glass',
      Boolean(lightSample.skillCategory?.backdrop?.includes('blur')),
      lightSample.skillCategory?.backdrop || 'missing'
    );
    await shot(page, '02-skills-light');

    await page.goto(`${BASE}/#experience?v=qa-glass`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.locator('.experience-content').first().waitFor({ state: 'visible', timeout: 15_000 });
    await shot(page, '03-experience-light');

    await waitForA11y(page);
    await page.locator('button[aria-label="Liquid Glass transparency"]').click();
    await page.locator('.a11y-glass-popover.is-open').waitFor({ state: 'visible', timeout: 5000 });
    await shot(page, '04-glass-slider-open');

    const clearTokens = await applyTintViaHelper(page, 0);
    record(
      'Tint clear → max blur',
      clearTokens.blurCard === '44px',
      `blur=${clearTokens.blurCard}, fill=${clearTokens.cardFill}`
    );
    await page.waitForTimeout(350);
    await shot(page, '05-skills-clear-glass');

    const tintedTokens = await applyTintViaHelper(page, 1);
    record(
      'Tint full → min blur',
      tintedTokens.blurCard === '20px',
      `blur=${tintedTokens.blurCard}, fill=${tintedTokens.cardFill}`
    );
    await page.waitForTimeout(350);
    await shot(page, '06-skills-tinted-glass');

    await page.evaluate(() => window.a11y.applyGlassTint(55));

    const viewportFit = await page.evaluate(() => {
      const nav = document.querySelector('#global-nav')?.getBoundingClientRect();
      const a11y = document.querySelector('.a11y-toolbar')?.getBoundingClientRect();
      const w = window.innerWidth;
      const h = window.innerHeight;
      const inViewport = r =>
        r && r.top >= 0 && r.left >= 0 && r.bottom <= h + 1 && r.right <= w + 1;
      return { navOk: inViewport(nav), a11yOk: inViewport(a11y), w, h };
    });
    record(
      'Viewport fit (nav + a11y toolbar)',
      viewportFit.navOk && viewportFit.a11yOk,
      JSON.stringify(viewportFit)
    );

    const travel = await page.goto(`${BASE}/travel.html?v=qa-glass`, { waitUntil: 'domcontentloaded' });
    record('Travel page loads', travel?.ok() === true, `status ${travel?.status()}`);
    await page.locator('#travel-sidebar').waitFor({ state: 'visible', timeout: 15_000 });
    await shot(page, '07-travel');

    const monitor = await page.goto(`${BASE}/monitor.html?v=qa-glass`, { waitUntil: 'domcontentloaded' });
    record('Monitor page loads', monitor?.ok() === true, `status ${monitor?.status()}`);
    await page.locator('.overview-card, .monitor-summary-card, #monitor-app').first().waitFor({
      state: 'visible',
      timeout: 20_000,
    });
    await shot(page, '08-monitor');

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(`${BASE}/#skills?v=qa-glass`, { waitUntil: 'networkidle' });
    await mobilePage.locator('#skills').scrollIntoViewIfNeeded();
    await mobilePage.locator('#skills-container .skill-category').first().waitFor({
      state: 'visible',
      timeout: 45_000,
    });
    const mobileGlass = await sampleGlass(mobilePage);
    record(
      'Mobile skills glass',
      Boolean(mobileGlass.skillCategory?.backdrop?.includes('blur')),
      mobileGlass.skillCategory?.backdrop || 'missing'
    );
    await mobilePage.screenshot({
      path: join(OUT, '09-skills-mobile.jpeg'),
      type: 'jpeg',
      quality: 85,
      scale: 'css',
    });
    await mobile.close();
  } finally {
    await browser.close();
  }

  const failed = results.filter(r => !r.pass);
  const summary = {
    base: BASE,
    passed: results.filter(r => r.pass).length,
    failed: failed.length,
    results,
    screenshots: OUT,
  };
  await writeFile(join(OUT, 'report.json'), JSON.stringify(summary, null, 2));

  console.log('\n--- Summary ---');
  console.log(`Passed: ${summary.passed}/${results.length}`);
  console.log(`Artifacts: ${OUT}`);
  process.exit(failed.length ? 1 : 0);
}

async function expectVisible(page, selector, label) {
  try {
    await page.locator(selector).waitFor({ state: 'visible', timeout: 15_000 });
    record(label, true);
  } catch (error) {
    record(label, false, error.message);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
