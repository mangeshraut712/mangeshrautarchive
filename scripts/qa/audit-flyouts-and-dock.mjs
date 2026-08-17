import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fork } from 'node:child_process';

const outDir =
  '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/flyouts_and_dock_audit';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const serverProcess = fork('scripts/utils/local-server.js', [], {
  env: { ...process.env, PORT: '4112' },
  stdio: 'pipe',
});

// Wait for server to start
await new Promise(resolve => setTimeout(resolve, 1500));
const baseUrl = 'http://127.0.0.1:4112';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log(`Navigating to ${baseUrl} ...`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 1. Check Hero Vibe Coder button click
  console.log('Clicking Vibe Coder badge...');
  const vibeBadge = await page.$('#vibe-coder-badge');
  if (vibeBadge) {
    await vibeBadge.click();
    await page.waitForTimeout(600);
    const isVibeOpen = await page.evaluate(() => {
      const flyout = document.getElementById('vibe-stack-flyout');
      return flyout && !flyout.hidden && flyout.classList.contains('is-open');
    });
    console.log(`Vibe Stack Flyout open state: ${isVibeOpen}`);
    await page.screenshot({ path: path.join(outDir, '01_vibe_coder_flyout_open.png') });
  }

  // 2. Check Hero Portfolio Reach button click
  console.log('Clicking Portfolio Reach badge...');
  const reachBadge = await page.$('#portfolio-reach');
  if (reachBadge) {
    await reachBadge.click();
    await page.waitForTimeout(600);
    const isReachOpen = await page.evaluate(() => {
      const flyout = document.getElementById('reach-flyout');
      const panel = document.getElementById('portfolio-reach-panel');
      return (
        flyout &&
        !flyout.hidden &&
        (flyout.classList.contains('is-open') || (panel && !panel.hidden))
      );
    });
    console.log(`Portfolio Reach Flyout open state: ${isReachOpen}`);
    await page.screenshot({ path: path.join(outDir, '02_portfolio_reach_flyout_open.png') });
  }

  // 3. Check FAQ section and scroll button dock
  console.log('Scrolling to FAQ section...');
  await page.evaluate(() => {
    document.querySelector('#faq')?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '03_faq_and_floating_dock.png') });

  // 4. Open first FAQ accordion
  console.log('Opening first FAQ accordion item...');
  const firstFaq = await page.$('#faq .faq-item summary');
  if (firstFaq) {
    await firstFaq.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '04_faq_first_item_opened.png') });
  }

  // 5. Test subpages floating dock
  const subpages = [
    'systems.html',
    'travel.html',
    'monitor.html',
    'uses.html',
    'changelog.html',
    '404.html',
  ];
  for (const sp of subpages) {
    console.log(`Checking ${sp}...`);
    await page.goto(`${baseUrl}/${sp}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, `05_subpage_${sp.replace('.html', '')}.png`) });
  }

  // 6. Test Mobile Viewport
  console.log('Testing mobile viewport (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const mobileVibeBadge = await page.$('#vibe-coder-badge');
  if (mobileVibeBadge) {
    await mobileVibeBadge.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '06_mobile_vibe_flyout.png') });
  }

  const mobileReachBadge = await page.$('#portfolio-reach');
  if (mobileReachBadge) {
    await mobileReachBadge.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '07_mobile_reach_flyout.png') });
  }

  // 7. Test Dark Theme
  console.log('Testing Dark Mode...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(300);

  const darkVibeBadge = await page.$('#vibe-coder-badge');
  if (darkVibeBadge) {
    await darkVibeBadge.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '09_dark_vibe_flyout.png') });
  }

  const darkReachBadge = await page.$('#portfolio-reach');
  if (darkReachBadge) {
    await darkReachBadge.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '10_dark_reach_flyout.png') });
  }

  await page.evaluate(() => {
    document.querySelector('#faq')?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  const darkFirstFaq = await page.$('#faq .faq-item summary');
  if (darkFirstFaq) {
    await darkFirstFaq.click();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(outDir, '11_dark_faq_and_dock.png') });

  await browser.close();
  serverProcess.kill();
  console.log('Audit completed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Audit failed:', err);
  serverProcess.kill();
  process.exit(1);
});
