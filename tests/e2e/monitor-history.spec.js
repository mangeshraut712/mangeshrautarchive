import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { storedHistory } from './helpers/status-history.js';
const origin = 'https://portfolio-status.mangeshraut712.workers.dev';
for (const width of [375, 768, 1440])
  for (const theme of ['light', 'dark']) {
    test(`persistent history remains usable at ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.addInitScript(t => localStorage.setItem('themeMode', t), theme);
      const history = storedHistory();
      const now = Date.now();
      history.incidents = [
        {
          id: 'github_pages:100',
          service_id: 'github_pages',
          started_at: now - 1200000,
          confirmed_at: now - 900000,
          last_failure_at: now - 600000,
          resolved_at: now - 300000,
          severity: 'unhealthy',
          http_status: 503,
        },
      ];
      history.next_cursor = '100|github_pages:100';
      await page.route(origin + '/api/history', route => route.fulfill({ json: history }));
      await page.route(origin + '/api/incidents?*', route =>
        route.fulfill({
          json: {
            incidents: [
              { ...history.incidents[0], id: 'github_pages:50', started_at: now - 86400000 },
            ],
            next_cursor: null,
          },
        })
      );
      await page.goto('/monitor.html');
      await expect(page.locator('.status-uptime').first()).toContainText('50.00% sampled uptime');
      await expect(page.locator('.status-uptime').first()).toContainText('66.67% coverage');
      await expect(page.locator('.status-observations').first().locator('.status-bar')).toHaveCount(
        90
      );
      await page.locator('.status-service summary').first().click();
      await page.locator('.status-daily summary').first().click();
      await expect(page.locator('.status-daily table').first()).toContainText('2 / 3');
      await expect(page.locator('#persistent-incidents')).toContainText('Resolved');
      await page.locator('#history-retry').click();
      await expect(page.locator('.status-daily table').first()).toBeVisible();
      const accessibility = await new AxeBuilder({ page }).include('#public-status').analyze();
      expect(accessibility.violations).toEqual([]);
      await page.locator('#history-load-more').click();
      await expect(page.locator('[data-incident-id]')).toHaveCount(2);
      await expect(page.locator('#history-load-more')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
      await page.reload();
      await expect(page.locator('[data-incident-id="github_pages:100"]')).toBeVisible();
      await expect(page.locator('.status-uptime').first()).toContainText('50.00%');
    });
  }
test('history outage is explicit and retry recovers without claiming an empty healthy history', async ({
  page,
}) => {
  let offline = true;
  await page.route(origin + '/api/history', route =>
    route.fulfill(
      offline ? { status: 503, json: { error: 'unavailable' } } : { json: storedHistory() }
    )
  );
  await page.goto('/monitor.html');
  await expect(page.locator('#history-status')).toContainText('History refresh unavailable');
  await expect(page.locator('#persistent-incidents')).toContainText('unavailable');
  offline = false;
  await page.locator('#history-retry').click();
  await expect(page.locator('#history-status')).toContainText('Last stored check');
  await expect(page.locator('#persistent-incidents')).toContainText('No confirmed incidents');
});
