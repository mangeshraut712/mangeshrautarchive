import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Chrome accessibility baseline', () => {
  test('homepage has no critical/serious axe violations', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // skills-visualization.js loads lazily when #skills enters the viewport
    await page.locator('#skills, #skills-container').first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.getElementById('skills-loading'), {
      timeout: 20000,
    });

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const blockingViolations = results.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    );

    expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
  });
});
