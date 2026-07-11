#!/usr/bin/env node
/**
 * Full-site frontend audit (Playwright).
 * Visits every page, scrolls mid-band, exercises View more, captures console/page errors.
 *
 * Usage: node scripts/qa/frontend-audit.mjs
 * Env: PLAYWRIGHT_BASE_URL (default http://127.0.0.1:4000)
 */
import { chromium, devices } from 'playwright';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000';
const PAGES = [
  { path: '/', name: 'home' },
  { path: '/systems.html', name: 'systems' },
  { path: '/monitor.html', name: 'monitor' },
  { path: '/travel.html', name: 'travel' },
  { path: '/uses.html', name: 'uses' },
  { path: '/404.html', name: '404' },
  { path: '/offline.html', name: 'offline' },
];

const HOME_SECTIONS = [
  'home',
  'about',
  'skills',
  'experience',
  'engineering',
  'projects',
  'education',
  'publications',
  'awards',
  'recommendations',
  'certifications',
  'blog',
  'contact',
  'debug-runner-section',
];

const findings = [];

function add(severity, page, message, detail = {}) {
  findings.push({ severity, page, message, ...detail });
  const tag = severity === 'error' ? '❌' : severity === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${tag} [${severity}] ${page}: ${message}`);
}

async function collectPageMetrics(page, pageName) {
  const metrics = await page.evaluate(() => {
    const issues = [];
    const vw = window.innerWidth;
    const doc = document.documentElement;

    // Horizontal overflow
    if (doc.scrollWidth > vw + 2) {
      issues.push({
        type: 'overflow-x',
        scrollWidth: doc.scrollWidth,
        clientWidth: vw,
      });
    }

    // Empty main
    const main = document.querySelector('main');
    if (main && main.offsetHeight < 80) {
      issues.push({ type: 'main-too-short', height: main.offsetHeight });
    }

    // Images without alt
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('alt')) {
        issues.push({
          type: 'img-missing-alt',
          src: (img.currentSrc || img.src || '').slice(0, 120),
        });
      }
    });

    // Buttons without accessible name
    document.querySelectorAll('button').forEach(btn => {
      const label =
        btn.getAttribute('aria-label') ||
        btn.getAttribute('title') ||
        btn.textContent?.trim() ||
        '';
      if (!label && btn.offsetParent !== null) {
        issues.push({
          type: 'button-no-name',
          id: btn.id || null,
          className: String(btn.className).slice(0, 80),
        });
      }
    });

    // Broken display none on critical sections while they should be visible
    // Zero-height visible sections with content expected
    document.querySelectorAll('main > section[id]').forEach(sec => {
      const style = getComputedStyle(sec);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const h = sec.getBoundingClientRect().height;
      if (h < 24 && sec.id !== 'launch-intro') {
        issues.push({ type: 'section-collapsed', id: sec.id, height: h });
      }
    });

    // Inline style count on body (noise indicator)
    const inlineStyled = document.querySelectorAll('[style]').length;

    // Duplicate IDs
    const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
    const seen = new Set();
    const dups = new Set();
    ids.forEach(id => {
      if (!id) return;
      if (seen.has(id)) dups.add(id);
      seen.add(id);
    });

    return {
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim()?.slice(0, 80) || null,
      sectionCount: document.querySelectorAll('main > section, main section').length,
      inlineStyled,
      duplicateIds: Array.from(dups),
      issues,
      bodyHeight: doc.scrollHeight,
      bodyWidth: doc.scrollWidth,
    };
  });

  if (!metrics.title) add('error', pageName, 'Missing document title');
  if (!metrics.h1) add('warn', pageName, 'No h1 found');
  if (metrics.duplicateIds.length) {
    add('error', pageName, `Duplicate IDs: ${metrics.duplicateIds.slice(0, 12).join(', ')}`, {
      ids: metrics.duplicateIds,
    });
  }

  for (const issue of metrics.issues) {
    if (issue.type === 'overflow-x') {
      add('error', pageName, `Horizontal overflow ${issue.scrollWidth}px > ${issue.clientWidth}px`);
    } else if (issue.type === 'main-too-short') {
      add('error', pageName, `Main content too short (${issue.height}px)`);
    } else if (issue.type === 'img-missing-alt') {
      add('warn', pageName, `Image missing alt: ${issue.src}`);
    } else if (issue.type === 'button-no-name') {
      add('warn', pageName, `Button without accessible name (${issue.id || issue.className})`);
    } else if (issue.type === 'section-collapsed') {
      add('error', pageName, `Section #${issue.id} collapsed to ${issue.height}px`);
    }
  }

  return metrics;
}

async function auditHome(page, label) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore extension / known noise
      if (
        /message channel closed|runtime\.lastError|favicon|Failed to load resource.*favicon/i.test(
          text
        )
      ) {
        return;
      }
      consoleErrors.push(text.slice(0, 300));
    }
  });
  page.on('pageerror', err => pageErrors.push(String(err.message || err).slice(0, 300)));

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);

  // Section presence + non-zero height after scroll into view
  for (const id of HOME_SECTIONS) {
    const section = page.locator(`#${id}`);
    const count = await section.count();
    if (!count) {
      add('error', label, `Missing section #${id}`);
      continue;
    }
    await section.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(200);
    const box = await section.boundingBox().catch(() => null);
    if (!box || box.height < 40) {
      add('error', label, `Section #${id} not visible or too short`, { box });
    }
  }

  // Progressive disclosure buttons
  const viewMore = page.locator('.section-preview-btn:visible');
  const viewMoreCount = await viewMore.count();
  if (viewMoreCount === 0) {
    add('warn', label, 'No visible View more buttons (expected on dense homepage)');
  } else {
    add('info', label, `Found ${viewMoreCount} View more control(s)`);
    // Click first few and ensure expand
    const n = Math.min(viewMoreCount, 4);
    for (let i = 0; i < n; i++) {
      const btn = viewMore.nth(i);
      const before = await btn.getAttribute('aria-expanded');
      await btn.click({ timeout: 5000 }).catch(err => {
        add('error', label, `View more click failed #${i}: ${err.message}`);
      });
      await page.waitForTimeout(250);
      const after = await btn.getAttribute('aria-expanded');
      if (before === 'false' && after !== 'true') {
        add('warn', label, `View more #${i} did not expand (aria-expanded ${before}→${after})`);
      }
    }
  }

  // About tabs
  const fullStory = page.locator('#tab-full-story');
  if (await fullStory.count()) {
    await page.locator('#about').scrollIntoViewIfNeeded();
    const qsVisible = await page
      .locator('#quick-summary-panel')
      .isVisible()
      .catch(() => false);
    if (!qsVisible) add('warn', label, 'Quick Summary panel not visible by default');
    await fullStory.click().catch(() => {});
    await page.waitForTimeout(200);
    const fsVisible = await page
      .locator('#full-story-panel')
      .isVisible()
      .catch(() => false);
    if (!fsVisible) add('error', label, 'Full Story tab does not show panel');
  }

  // Mid-page jump
  await page
    .locator('#certifications')
    .scrollIntoViewIfNeeded()
    .catch(() => {});
  await page.waitForTimeout(400);
  const certs = await page.locator('#certifications-grid .certification-card:visible').count();
  if (certs < 1) add('error', label, 'No visible certification cards mid-page');
  else add('info', label, `${certs} certification card(s) visible`);

  await page
    .locator('#blog')
    .scrollIntoViewIfNeeded()
    .catch(() => {});
  await page.waitForTimeout(800);
  const blogs = await page.locator('#blog-posts-container .blog-card:visible').count();
  if (blogs < 1) add('warn', label, 'No visible blog cards after load');
  else add('info', label, `${blogs} blog card(s) visible`);

  // Nav links
  const nav = page.locator('#global-nav');
  if (!(await nav.count())) add('error', label, 'Missing global nav');

  // Footer presence on home (expected)
  const footer = page.locator('footer');
  if (!(await footer.count())) add('warn', label, 'No footer on homepage');

  // systems/monitor must not be on this page — skip

  await collectPageMetrics(page, label);

  for (const err of pageErrors.slice(0, 10)) {
    add('error', label, `Page error: ${err}`);
  }
  for (const err of consoleErrors.slice(0, 15)) {
    add('warn', label, `Console error: ${err}`);
  }
}

async function auditSubpage(page, pageDef, label) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (/message channel closed|runtime\.lastError|favicon/i.test(text)) return;
      consoleErrors.push(text.slice(0, 300));
    }
  });
  page.on('pageerror', err => pageErrors.push(String(err.message || err).slice(0, 300)));

  const res = await page.goto(`${BASE}${pageDef.path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  if (!res || res.status() >= 400) {
    add('error', label, `HTTP ${res?.status()} for ${pageDef.path}`);
    return;
  }
  await page.waitForTimeout(900);

  // Guardrails: systems/monitor no footer
  if (pageDef.name === 'systems' || pageDef.name === 'monitor') {
    const footers = await page.locator('footer').count();
    if (footers > 0) add('error', label, 'Footer present (forbidden on systems/monitor)');
  }

  // Scroll page end
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  await collectPageMetrics(page, label);

  for (const err of pageErrors.slice(0, 8)) add('error', label, `Page error: ${err}`);
  for (const err of consoleErrors.slice(0, 10)) add('warn', label, `Console error: ${err}`);
}

async function runViewport(browser, deviceName, device) {
  console.log(`\n═══ Viewport: ${deviceName} ═══`);
  const context = await browser.newContext({
    ...device,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  await auditHome(page, `home@${deviceName}`);

  for (const p of PAGES.filter(x => x.name !== 'home')) {
    const sub = await context.newPage();
    await auditSubpage(sub, p, `${p.name}@${deviceName}`);
    await sub.close();
  }

  await context.close();
}

async function main() {
  console.log(`Frontend audit → ${BASE}\n`);
  // Prefer bundled Chromium; fall back to system Chrome if browsers not installed.
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  }

  try {
    await runViewport(browser, 'Desktop', {
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });

    await runViewport(browser, 'iPhone14', devices['iPhone 14']);

    await runViewport(browser, 'iPad', {
      ...devices['iPad Pro 11'],
      viewport: { width: 834, height: 1194 },
    });
  } finally {
    await browser.close();
  }

  const errors = findings.filter(f => f.severity === 'error');
  const warns = findings.filter(f => f.severity === 'warn');
  console.log('\n════════ SUMMARY ════════');
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warns.length}`);
  console.log(`Info: ${findings.filter(f => f.severity === 'info').length}`);

  if (errors.length) {
    console.log('\nErrors detail:');
    errors.forEach(e => console.log(`  - ${e.page}: ${e.message}`));
  }
  if (warns.length) {
    console.log('\nWarnings detail:');
    warns.slice(0, 40).forEach(e => console.log(`  - ${e.page}: ${e.message}`));
  }

  // Write report
  const fs = await import('node:fs/promises');
  await fs.mkdir('artifacts', { recursive: true });
  await fs.writeFile(
    'artifacts/frontend-audit.json',
    JSON.stringify({ base: BASE, at: new Date().toISOString(), findings }, null, 2)
  );
  console.log('\nWrote artifacts/frontend-audit.json');

  process.exit(errors.length ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});
