/**
 * Deep page inspection script for mangeshrautarchive.
 * Checks all pages for console errors, 404 network requests, broken images,
 * unrendered containers, and UI alignment issues.
 */
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4000';
const OUT = '/Users/mangeshraut/.gemini/antigravity/brain/a562c13f-d42b-4eaa-bd31-14ee0ecd6148';

const PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/systems.html', name: 'Systems Evidence' },
  { path: '/monitor.html', name: 'Live Monitor' },
  { path: '/travel.html', name: 'Travel Atlas' },
  { path: '/uses.html', name: 'Uses Stack' },
  { path: '/404.html', name: '404 Error Page' },
];

async function inspectPages() {
  console.log('🔍 Starting Deep Browser Page Inspection...\n');
  const browser = await chromium.launch({ headless: true });

  const auditLog = [];

  for (const pageDef of PAGES) {
    console.log(`----------------------------------------`);
    console.log(`📄 Page: ${pageDef.name} (${pageDef.path})`);
    console.log(`----------------------------------------`);

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const consoleErrors = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('response', resp => {
      if (
        resp.status() >= 400 &&
        !resp.url().includes('favicon') &&
        !resp.url().includes('analytics')
      ) {
        failedRequests.push(`${resp.status()} ${resp.url()}`);
      }
    });

    try {
      const response = await page.goto(`${BASE}${pageDef.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });

      // Scroll through page to trigger lazy-loaded images
      await page.evaluate(async () => {
        await new Promise(resolve => {
          let totalHeight = 0;
          const distance = 400;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              resolve();
            }
          }, 100);
        });
      });
      await page.waitForTimeout(1000);

      // Check truly broken images (only if element is visible in layout and failed to load)
      const brokenImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
          .filter(img => {
            if (!img.src || img.src.startsWith('data:')) return false;
            // Ignore hidden tab contents (display: none)
            const style = getComputedStyle(img);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            const parent = img.closest(
              '.hidden, [style*="display: none"], [style*="display:none"]'
            );
            if (parent) return false;
            return img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0);
          })
          .map(img => img.src || img.getAttribute('data-src') || 'unknown');
      });

      // Check empty containers
      const emptyContainers = await page.evaluate(() => {
        const checkIds = [
          'github-projects-container',
          'github-graph-container',
          'systems-overview-grid',
          'monitor-summary-section',
          'uses-items-grid',
        ];
        const empty = [];
        for (const id of checkIds) {
          const el = document.getElementById(id);
          if (el && el.children.length === 0 && !el.textContent.trim()) {
            empty.push(id);
          }
        }
        return empty;
      });

      // Take desktop screenshot
      const desktopSs = `inspect_desktop_${pageDef.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
      await page.screenshot({ path: `${OUT}/${desktopSs}`, fullPage: true });

      // Mobile check
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(1000);
      const mobileSs = `inspect_mobile_${pageDef.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
      await page.screenshot({ path: `${OUT}/${mobileSs}`, fullPage: true });

      console.log(`  HTTP Status: ${response.status()}`);
      console.log(`  Console Errors: ${consoleErrors.length}`);
      console.log(`  Failed Requests: ${failedRequests.length}`);
      console.log(`  Broken Images: ${brokenImages.length}`);
      console.log(`  Empty Containers: ${emptyContainers.length}`);

      auditLog.push({
        page: pageDef.name,
        path: pageDef.path,
        status: response.status(),
        consoleErrors,
        failedRequests,
        brokenImages,
        emptyContainers,
      });
    } catch (err) {
      console.error(`  ❌ Navigation Error: ${err.message}`);
      auditLog.push({
        page: pageDef.name,
        path: pageDef.path,
        error: err.message,
      });
    }

    await context.close();
  }

  await browser.close();

  console.log('\n========================================');
  console.log(' INSPECTION SUMMARY REPORT');
  console.log('========================================');
  for (const item of auditLog) {
    console.log(`\n📌 ${item.page} (${item.path})`);
    if (item.error) {
      console.log(`   🔴 ERROR: ${item.error}`);
      continue;
    }
    if (item.consoleErrors.length > 0) {
      console.log(`   ⚠️ Console Errors (${item.consoleErrors.length}):`);
      item.consoleErrors.forEach(e => console.log(`      - ${e.substring(0, 100)}`));
    }
    if (item.failedRequests.length > 0) {
      console.log(`   ⚠️ Failed Requests (${item.failedRequests.length}):`);
      item.failedRequests.forEach(r => console.log(`      - ${r}`));
    }
    if (item.brokenImages.length > 0) {
      console.log(`   ❌ Broken Images (${item.brokenImages.length}):`);
      item.brokenImages.forEach(i => console.log(`      - ${i}`));
    }
    if (item.emptyContainers.length > 0) {
      console.log(`   ❌ Empty Containers (${item.emptyContainers.length}):`);
      item.emptyContainers.forEach(c => console.log(`      - #${c}`));
    }
    if (
      !item.consoleErrors.length &&
      !item.failedRequests.length &&
      !item.brokenImages.length &&
      !item.emptyContainers.length
    ) {
      console.log(`   ✅ 100% Clean (0 errors, 0 broken images, 0 empty containers)`);
    }
  }
}

inspectPages().catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
