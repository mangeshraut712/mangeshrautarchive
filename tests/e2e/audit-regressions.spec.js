import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

test.use({ viewport: { width: 375, height: 812 } });

test('music status changes do not resize the hero card', async ({ page }) => {
  await gotoSite(page, '/');
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
  const heights = await page.evaluate(() => {
    const status = document.querySelector('#status-text');
    const card = document.querySelector('#music-card .music-card-inner');
    status.textContent = 'Listening';
    const loading = card.getBoundingClientRect().height;
    status.textContent = 'Recently Played';
    return { loading, loaded: card.getBoundingClientRect().height };
  });
  expect(Math.abs(heights.loading - heights.loaded)).toBeLessThan(1);
});

test('mobile travel header has room for its places control', async ({ page }) => {
  await gotoSite(page, '/travel.html');
  await page.waitForLoadState('load');
  const result = await page.evaluate(() => {
    const panel = document.querySelector('#travel-sidebar-toggle').getBoundingClientRect();
    const brand = document.querySelector('.travel-nav__brand').getBoundingClientRect();
    return {
      width: panel.width,
      height: panel.height,
      gap: panel.left - brand.right,
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  expect(result.width).toBeGreaterThanOrEqual(80);
  expect(result.height).toBeGreaterThanOrEqual(44);
  expect(result.gap).toBeGreaterThan(0);
  expect(result.overflow).toBe(0);
});

test('calendar dates meet contrast requirements in light mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    localStorage.setItem('themeMode', 'light');
    localStorage.setItem('theme', 'light');
  });
  await gotoSite(page, '/contact.html');
  await page.waitForLoadState('load');
  await expect(page.locator('#calendar-widget .day-cell:not(.empty)').first()).toBeVisible();
  const result = await new AxeBuilder({ page })
    .include('#calendar-widget')
    .withRules(['color-contrast'])
    .analyze();
  expect(result.violations).toEqual([]);
});
