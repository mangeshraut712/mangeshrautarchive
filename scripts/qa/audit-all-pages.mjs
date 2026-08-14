import { chromium } from 'playwright';

const LOCAL_URL = 'http://127.0.0.1:4000/';

const PAGES = [
  { name: 'Home', path: '' },
  { name: 'System Monitor', path: 'monitor.html' },
  { name: 'Travel Atlas', path: 'travel.html' },
  { name: 'Stack & Uses', path: 'uses.html' },
  { name: 'Systems Notebook', path: 'systems.html' },
  { name: 'Changelog', path: 'changelog.html' },
  { name: '404 Page', path: '404.html' },
  { name: 'Offline Page', path: 'offline.html' },
];

async function auditAllPages() {
  console.log('🔍 Starting Comprehensive Full-Site Audit across all pages...\n');
  const browser = await chromium.launch({ headless: true });

  const auditResults = [];

  for (const pageInfo of PAGES) {
    console.log(`=======================================================`);
    console.log(`🧪 Auditing Page: ${pageInfo.name} (/${pageInfo.path})`);
    console.log(`=======================================================`);

    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const consoleErrors = [];
    const consoleWarnings = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (
        msg.type() === 'error' &&
        !msg.text().includes('favicon') &&
        !msg.text().includes('402')
      ) {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(`[PageError] ${err.message}`);
    });

    page.on('requestfailed', req => {
      if (!req.url().includes('favicon') && !req.url().includes('402')) {
        failedRequests.push(
          `${req.method()} ${req.url()} - ${req.failure()?.errorText || 'failed'}`
        );
      }
    });

    const pageUrl = `${LOCAL_URL}${pageInfo.path}`;
    const start = Date.now();
    const res = await page
      .goto(pageUrl, { waitUntil: 'networkidle', timeout: 25000 })
      .catch(e => ({ status: () => e.message }));
    const loadTime = Date.now() - start;

    const status = typeof res.status === 'function' ? res.status() : res.status;
    const title = await page.title();

    // Check for horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    // Check images without alt or broken src
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src || img.getAttribute('src'));
    });

    // Check buttons without aria-label or text
    const unlabelledButtons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns
        .filter(
          btn =>
            !btn.getAttribute('aria-label') && !btn.textContent.trim() && !btn.getAttribute('title')
        )
        .map(btn => btn.outerHTML.substring(0, 80));
    });

    // Test Mobile viewport (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    const result = {
      name: pageInfo.name,
      path: pageInfo.path,
      status,
      title,
      loadTime: `${loadTime}ms`,
      consoleErrors,
      consoleWarnings: consoleWarnings.length,
      failedRequests,
      hasHorizontalScroll,
      mobileOverflow,
      brokenImagesCount: brokenImages.length,
      brokenImages,
      unlabelledButtonsCount: unlabelledButtons.length,
      unlabelledButtons,
    };

    auditResults.push(result);

    console.log(`  ✓ Status: ${status}`);
    console.log(`  ✓ Title: "${title}"`);
    console.log(`  ✓ Load Time: ${loadTime}ms`);
    console.log(`  ✓ Desktop Overflow: ${hasHorizontalScroll ? '⚠️ YES' : 'None (Clean)'}`);
    console.log(`  ✓ Mobile 375px Overflow: ${mobileOverflow ? '⚠️ YES' : 'None (Clean)'}`);
    console.log(`  ✓ Broken Images: ${brokenImages.length}`);
    if (brokenImages.length > 0) console.log(`    Images:`, brokenImages);
    console.log(`  ✓ Unlabelled Buttons: ${unlabelledButtons.length}`);
    if (unlabelledButtons.length > 0) console.log(`    Buttons:`, unlabelledButtons);
    console.log(`  ✓ Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) console.log(`    Errors:`, consoleErrors);
    console.log(`  ✓ Failed Requests: ${failedRequests.length}\n`);

    await context.close();
  }

  await browser.close();
  console.log('\n📊 Full Audit Summary:');
  console.table(
    auditResults.map(r => ({
      Page: r.name,
      Status: r.status,
      Load: r.loadTime,
      Errors: r.consoleErrors.length,
      MobileOverflow: r.mobileOverflow,
      BrokenImages: r.brokenImagesCount,
      UnlabelledBtns: r.unlabelledButtonsCount,
    }))
  );
}

auditAllPages().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
