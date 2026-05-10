import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

function resolveTargetUrl(testInfo) {
  return process.env.PLAYWRIGHT_BASE_URL || testInfo.project.use.baseURL;
}

test.describe('Post-deploy Chrome checks', () => {
  test('deployed homepage renders critical landmarks', async ({ page }, testInfo) => {
    const targetUrl = resolveTargetUrl(testInfo);
    expect(targetUrl, 'A base URL is required for post-deploy checks').toBeTruthy();

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Mangesh Raut/i);
    await expect(page.locator('#global-nav')).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('section#home')).toBeVisible();
  });

  test('deployed homepage has no critical/serious axe violations', async ({ page }, testInfo) => {
    const targetUrl = resolveTargetUrl(testInfo);
    expect(targetUrl, 'A base URL is required for post-deploy checks').toBeTruthy();

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const blockingViolations = results.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    );

    expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
  });

  test('deployed travel atlas renders distinct accessible Pune cards', async ({ page }, testInfo) => {
    const targetUrl = resolveTargetUrl(testInfo);
    expect(targetUrl, 'A base URL is required for post-deploy checks').toBeTruthy();

    await page.goto(new URL('travel.html', targetUrl).toString(), { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Travel Atlas/i);
    await expect(page.locator('#travel-sidebar')).toBeVisible();
    await expect(page.locator('#map-container canvas').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#country-chapters')).toHaveCount(0);
    await page.locator('#place-search').fill('Pune');

    const stops = page.locator('.travel-stop');
    await expect(stops).toHaveCount(2);
    await expect(page.locator('.travel-stop__name')).toHaveText(['Pune', 'Sinhagad Fort']);

    const labels = await stops.evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
    expect(labels.every(Boolean)).toBe(true);
  });
});
