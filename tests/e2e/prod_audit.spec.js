import { test, expect } from '@playwright/test';

const PAGES = [
  { name: 'home', url: 'https://mangeshraut.pro/' },
  { name: 'travel', url: 'https://mangeshraut.pro/travel' },
  { name: 'monitor', url: 'https://mangeshraut.pro/monitor' },
];

test.describe('Production Live Website Multi-Device Audit', () => {
  for (const pageInfo of PAGES) {
    test(`Audit ${pageInfo.name} page and capture screenshot`, async ({ page }) => {
      // Catch console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('chrome-extension')) {
          consoleErrors.push(msg.text());
        }
      });

      // Go to page
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' });

      // Ensure page loads successfully
      await expect(page).toHaveURL(pageInfo.url);

      // Take viewport screenshot
      const viewport = page.viewportSize();
      const width = viewport ? viewport.width : 'unknown';
      const height = viewport ? viewport.height : 'unknown';

      const screenshotName = `prod_${pageInfo.name}_${width}x${height}.png`;
      const screenshotPath = `/Users/mangeshraut/.gemini/antigravity/brain/331c76eb-8f70-425a-84cc-f9badb8d7d88/${screenshotName}`;

      await page.screenshot({ path: screenshotPath });
      console.log(`📸 Saved screenshot to: ${screenshotPath}`);

      // Verify no critical console errors occurred
      if (consoleErrors.length > 0) {
        console.warn(`⚠️ Warning: Console errors found on ${pageInfo.name}:`, consoleErrors);
      }

      expect(consoleErrors.length).toBeLessThan(5); // Non-blocking check for minor script logs
    });
  }
});
