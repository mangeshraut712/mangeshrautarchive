import { test, expect } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

test('case-study metric values fit their cards on narrow phones', async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 812 });
    await gotoSite(page, '/case-studies/portfolio.html');
    await page.waitForLoadState('load');
    const overflowing = await page
      .locator('.case-study-metric strong')
      .evaluateAll(elements =>
        elements
          .filter(element => element.scrollWidth > element.clientWidth + 1)
          .map(element => element.textContent)
      );
    expect(overflowing, `metric overflow at ${width}px`).toEqual([]);
  }
});
