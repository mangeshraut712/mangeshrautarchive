import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STATUS_SERVICES } from '../../src/js/utils/portfolio-status.js';

function snapshot(status = 'healthy') {
  return {
    status: status === 'healthy' ? 'ok' : status,
    timestamp: new Date().toISOString(),
    checks: STATUS_SERVICES.map((service, index) => ({
      id: service.id,
      status: index === 0 ? status : 'healthy',
      detail:
        index === 0 && status !== 'healthy' ? '<img src=x onerror=alert(1)> HTTP 503' : 'HTTP 200',
      latency_ms: 120,
    })),
  };
}

for (const width of [375, 768, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`status is readable and accessible at ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.addInitScript(mode => localStorage.setItem('themeMode', mode), theme);
      let requests = 0;
      await page.route('**/api/monitor/**', route => {
        requests++;
        return route.request().url().endsWith('/status')
          ? route.fulfill({ json: snapshot() })
          : route.fallback();
      });
      await page.goto('/monitor.html');
      await expect(page.locator('#public-status-title')).toHaveText(
        'All monitored services operational'
      );
      await expect(page.locator('.status-service')).toHaveCount(6);
      expect(requests).toBe(1);
      await page.locator('.status-service summary').first().click();
      await expect(page.locator('.status-service-detail').first()).toContainText(
        'published homepage'
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
      const box = await page.locator('.status-refresh').boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      const axe = await new AxeBuilder({ page })
        .include('#main-content')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(axe.violations).toEqual([]);
      await page.getByRole('tab', { name: 'Security & Logs' }).click();
      await expect(page.getByRole('searchbox', { name: 'Search system events' })).toBeVisible();
      await page.getByRole('tab', { name: 'Status', exact: true }).click();
      await expect(page.locator('#public-status')).toBeVisible();
    });
  }
}

test('status reports failures safely, retries, and records only observed results', async ({
  page,
}) => {
  let mode = 'unhealthy';
  await page.route('**/api/monitor/status', route =>
    mode === 'offline' ? route.abort() : route.fulfill({ json: snapshot(mode) })
  );
  await page.goto('/monitor.html');
  await expect(page.locator('#public-status-title')).toHaveText(
    'A service is currently unavailable'
  );
  await expect(page.locator('#status-issues')).toContainText(
    '<img src=x onerror=alert(1)> HTTP 503'
  );
  await expect(page.locator('#status-issues img')).toHaveCount(0);
  await expect(page.locator('#status-observation-count')).toHaveText(
    '1 of 24 observations · this visit only'
  );
  mode = 'healthy';
  await page.getByRole('button', { name: 'Refresh service status' }).click();
  await expect(page.locator('#public-status-title')).toHaveText(
    'All monitored services operational'
  );
  await expect(page.locator('#status-issues')).toContainText('No issues detected');
  mode = 'offline';
  await page.getByRole('button', { name: 'Refresh service status' }).click();
  await expect(page.locator('#public-status-title')).toHaveText('Service status is not verified');
  await expect(page.locator('#public-status-description')).toContainText(
    'does not confirm a website outage'
  );
  await expect(page.getByRole('button', { name: 'Refresh service status' })).toBeEnabled();
});

test('old results never appear operational and refreshing cannot overlap requests', async ({
  page,
}) => {
  let calls = 0;
  await page.route('**/api/monitor/status', async route => {
    calls++;
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.fulfill({ json: { ...snapshot(), timestamp: '2020-01-01T00:00:00Z' } });
  });
  await page.goto('/monitor.html');
  await expect(page.locator('#public-status-title')).toHaveText('Service status is not verified');
  await page.evaluate(() =>
    Promise.all([window.refreshData({ silent: true }), window.refreshData({ silent: true })])
  );
  expect(calls).toBe(2);
  await expect(page.locator('.status-label[data-state="healthy"]')).toHaveCount(0);
});
