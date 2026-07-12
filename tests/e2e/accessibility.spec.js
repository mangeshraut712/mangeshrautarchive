import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES, gotoSite } from './helpers/site.js';

const SECONDARY_PAGES = [
  { path: PAGES.systems, name: 'systems' },
  { path: PAGES.travel, name: 'travel' },
  { path: PAGES.monitor, name: 'monitor' },
  { path: PAGES.uses, name: 'uses' },
];

test.describe('Chrome accessibility baseline', () => {
  test('homepage has no critical/serious axe violations', async ({ page }) => {
    await gotoSite(page, PAGES.home);

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

  for (const { path, name } of SECONDARY_PAGES) {
    test(`${name} page has no critical/serious axe violations`, async ({ page }) => {
      await gotoSite(page, path);

      // Wait for subpage-chrome to initialize
      await page.waitForSelector('#main-content', { timeout: 15000 }).catch(() => {});
      // Give dynamic content a moment to render
      await page.waitForTimeout(1000);

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

      const blockingViolations = results.violations.filter(
        violation => violation.impact === 'critical' || violation.impact === 'serious'
      );

      expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
    });
  }
});
