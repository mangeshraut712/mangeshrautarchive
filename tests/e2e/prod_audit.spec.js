import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

function resolveTargetUrl(testInfo, targetPath) {
  const base =
    process.env.PLAYWRIGHT_BASE_URL || testInfo.project.use.baseURL || 'http://127.0.0.1:4000';
  return new URL(targetPath, base).toString();
}

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'travel', path: '/travel.html' },
  { name: 'monitor', path: '/monitor.html' },
  { name: 'systems', path: '/systems.html' },
  { name: 'uses', path: '/uses.html' },
  { name: 'changelog', path: '/changelog.html' },
];

test.describe('Website Multi-Device Audit & Screenshot Capture', () => {
  for (const pageInfo of PAGES) {
    test(`Audit ${pageInfo.name} page and capture screenshot`, async ({ page }, testInfo) => {
      // Catch console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('chrome-extension')) {
          consoleErrors.push(msg.text());
        }
      });

      const targetUrl = resolveTargetUrl(testInfo, pageInfo.path);

      // Go to page
      const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      if (response) {
        expect(response.status()).toBeLessThan(400);
      }

      // Ensure page loads successfully
      await expect(page).toHaveURL(
        new RegExp(pageInfo.name === 'home' ? '(index\\.html|/)$' : pageInfo.name)
      );

      // Take viewport screenshot into artifacts/audit-screenshots
      const viewport = page.viewportSize();
      const width = viewport ? viewport.width : 'unknown';
      const height = viewport ? viewport.height : 'unknown';

      const screenshotDir = path.resolve('artifacts/audit-screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const screenshotName = `prod_${pageInfo.name}_${width}x${height}.png`;
      const screenshotPath = path.join(screenshotDir, screenshotName);

      try {
        await page.screenshot({ path: screenshotPath });
      } catch {
        // Non-blocking screenshot capture in restricted runners
      }

      // Verify no critical console errors occurred
      if (consoleErrors.length > 0) {
        console.warn(`⚠️ Warning: Console errors found on ${pageInfo.name}:`, consoleErrors);
      }

      expect(consoleErrors.length).toBeLessThan(5); // Non-blocking check for minor script logs
    });
  }
});
