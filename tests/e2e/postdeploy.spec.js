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

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        const blockingViolations = results.violations.filter((violation) =>
            violation.impact === 'critical' || violation.impact === 'serious');

        expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
    });
});
