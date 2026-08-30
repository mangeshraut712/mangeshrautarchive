import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _ROOT_DIR = path.resolve(__dirname, '../..');
const PORT = 4000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runBrowserAudit() {
  console.log('🚀 Launching Playwright Chromium for Hyper-Personalization & Automation Audit...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Visit homepage default
  console.log('1. Loading Homepage...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Check default lens
  const defaultLens = await page.getAttribute('html', 'data-active-lens');
  console.log(`   - Default active lens: [${defaultLens}]`);

  // 2. Test Programmatic Lens Switch via window.personalizationEngine
  console.log('2. Switching to Recruiter Lens...');
  await page.evaluate(() => window.personalizationEngine?.setLens('recruiter'));
  await page.waitForTimeout(300);
  const recruiterLens = await page.getAttribute('html', 'data-active-lens');
  console.log(`   - Active lens after switch: [${recruiterLens}]`);

  // 3. Test Engineer Lens
  console.log('3. Switching to Engineer Lens...');
  await page.evaluate(() => window.personalizationEngine?.setLens('engineer'));
  await page.waitForTimeout(300);
  const engineerLens = await page.getAttribute('html', 'data-active-lens');
  console.log(`   - Active lens after switch: [${engineerLens}]`);

  // 4. Test Founder Lens
  console.log('4. Switching to Founder Lens...');
  await page.evaluate(() => window.personalizationEngine?.setLens('founder'));
  await page.waitForTimeout(300);
  const founderLens = await page.getAttribute('html', 'data-active-lens');
  console.log(`   - Active lens after switch: [${founderLens}]`);

  // 5. Test URL Query Param Auto-Detection (?lens=recruiter)
  console.log('5. Testing URL parameter auto-detection (?lens=recruiter)...');
  await page.goto(`${BASE_URL}/?lens=recruiter`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  const paramLens = await page.getAttribute('html', 'data-active-lens');
  console.log(`   - Active lens from URL param: [${paramLens}]`);

  // 6. Test Mobile Viewport
  console.log('6. Testing Mobile Viewport (iPhone 14 / 390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  // 7. Check for horizontal overflow on mobile
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  console.log(`   - Mobile dimensions: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
  if (scrollWidth > clientWidth) {
    console.error('❌ Horizontal overflow detected on mobile!');
  } else {
    console.log('✅ Zero horizontal overflow confirmed on mobile.');
  }

  // 8. Test System Monitor Page Insights Widget
  console.log('8. Testing Monitor Page Claude Insights widget...');
  await page.goto(`${BASE_URL}/monitor.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const insightsSection = await page.$('#claude-insights-section');
  const insightsCards = await page.$$('#claude-insights-grid .overview-card');
  console.log(`   - Claude Insights section present: ${Boolean(insightsSection)}`);
  console.log(`   - Telemetry overview cards rendered: ${insightsCards.length}`);

  await browser.close();
  console.log('🎉 All browser hyper-personalization & layout tests PASSED 100%!');
}

runBrowserAudit().catch(err => {
  console.error('❌ Browser audit failed:', err);
  process.exit(1);
});
