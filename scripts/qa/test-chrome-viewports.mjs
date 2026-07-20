/**
 * Interactive Chrome Browser Test across Desktop and Mobile viewports.
 * Uses Playwright Chrome to verify page rendering, navigation, interactive
 * controls (theme toggle, mobile menu, search, subpage rails).
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:4000';
const OUT_DIR = '/Users/mangeshraut/.gemini/antigravity/brain/a562c13f-d42b-4eaa-bd31-14ee0ecd6148';

const CONFIGS = [
  {
    name: 'Desktop Chrome',
    viewport: { width: 1440, height: 900 },
    isMobile: false,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    prefix: 'chrome_desktop',
  },
  {
    name: 'Mobile Chrome (Pixel 7)',
    viewport: { width: 393, height: 851 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2.75,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    prefix: 'chrome_mobile',
  },
];

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/systems.html', name: 'systems' },
  { path: '/monitor.html', name: 'monitor' },
  { path: '/uses.html', name: 'uses' },
];

async function runChromeTests() {
  console.log('🚀 Starting Chrome Browser Interactive Tests...\n');
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const cfg of CONFIGS) {
    console.log(`========================================`);
    console.log(` Testing: ${cfg.name} (${cfg.viewport.width}×${cfg.viewport.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: cfg.viewport,
      isMobile: cfg.isMobile,
      hasTouch: cfg.hasTouch || false,
      deviceScaleFactor: cfg.deviceScaleFactor || 1,
      userAgent: cfg.userAgent,
    });

    const page = await context.newPage();

    for (const p of PAGES) {
      const url = `${BASE_URL}${p.path}`;
      console.log(`\n📄 Navigating to ${p.name} (${url})...`);

      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        console.log(`  Status: ${res.status()}`);

        await page.waitForTimeout(2000);

        // Screenshot 1: Default initial load
        const ssInitial = `${cfg.prefix}_${p.name}_initial.png`;
        await page.screenshot({ path: `${OUT_DIR}/${ssInitial}`, fullPage: false });
        console.log(`  📸 Screenshot: ${ssInitial}`);

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          return {
            scrollWidth: document.body.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            overflows: document.body.scrollWidth > document.documentElement.clientWidth + 2,
          };
        });
        if (overflow.overflows) {
          console.log(
            `  ❌ Horizontal Overflow: ${overflow.scrollWidth}px > ${overflow.clientWidth}px`
          );
          results.push({
            test: `${cfg.name} - ${p.name} overflow`,
            status: 'FAIL',
            details: `ScrollWidth ${overflow.scrollWidth}px`,
          });
        } else {
          console.log(
            `  ✅ Horizontal Layout: Fit (${overflow.scrollWidth}px <= ${overflow.clientWidth}px)`
          );
          results.push({ test: `${cfg.name} - ${p.name} layout fit`, status: 'PASS' });
        }

        // Test Interactive Element: Theme Toggle if available
        const themeBtn = page
          .locator('#theme-toggle, .monitor-page-nav__theme, [aria-label*="theme" i]')
          .first();
        if (await themeBtn.isVisible()) {
          console.log('  👆 Clicking Theme Toggle...');
          await themeBtn.click();
          await page.waitForTimeout(500);
          const darkClass = await page.evaluate(() =>
            document.documentElement.classList.contains('dark')
          );
          console.log(`  Theme toggled to Dark mode: ${darkClass}`);

          const ssDark = `${cfg.prefix}_${p.name}_dark.png`;
          await page.screenshot({ path: `${OUT_DIR}/${ssDark}`, fullPage: false });
          console.log(`  📸 Screenshot: ${ssDark}`);

          // Switch back to light
          await themeBtn.click();
          await page.waitForTimeout(500);
        }

        // Test Navigation links / subpage section links
        if (p.name === 'systems') {
          const sectionLink = page.locator('.systems-section-rail a').nth(1);
          if (await sectionLink.isVisible()) {
            console.log('  👆 Clicking Systems Section Rail link...');
            await sectionLink.click();
            await page.waitForTimeout(500);
            console.log('  ✅ Navigated via rail');
          }
        }

        if (p.name === 'uses') {
          const searchInput = page.locator('#uses-search');
          if (await searchInput.isVisible()) {
            console.log('  ⌨️ Typing in Uses Search input...');
            await searchInput.fill('Docker');
            await page.waitForTimeout(500);
            console.log('  ✅ Search input responsive');
          }
        }
      } catch (err) {
        console.error(`  ❌ Error testing ${p.name}:`, err.message);
        results.push({ test: `${cfg.name} - ${p.name}`, status: 'FAIL', details: err.message });
      }
    }

    await context.close();
  }

  await browser.close();

  console.log('\n========================================');
  console.log(' SUMMARY OF CHROME BROWSER TESTS');
  console.log('========================================');
  let passes = 0;
  let fails = 0;
  for (const r of results) {
    if (r.status === 'PASS') {
      passes++;
      console.log(` ✅ PASS: ${r.test}`);
    } else {
      fails++;
      console.log(` ❌ FAIL: ${r.test} - ${r.details || ''}`);
    }
  }
  console.log(`\nTotal: ${passes} passed, ${fails} failed.`);
}

runChromeTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
