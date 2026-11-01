import { test, expect } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

for (const section of ['about', 'projects']) {
  test(`initial ${section} deep link remains aligned as the page loads`, async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 823 });
    await gotoSite(page, `/#${section}`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(6000);
    const top = await page
      .locator(`#${section}`)
      .evaluate(element => element.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(-30);
    expect(top).toBeLessThan(180);
  });
}

test('contact deep link remains at the contact section as the page loads', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 823 });
  await gotoSite(page, '/contact.html');
  await page.waitForLoadState('load');
  await page.waitForTimeout(6000);
  expect(new URL(page.url()).hash).toBe('#contact');
  const top = await page
    .locator('#contact')
    .evaluate(element => element.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(-30);
  expect(top).toBeLessThan(180);
});

test('contact deep-link alignment stops when the visitor scrolls', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: 412, height: 823 });
  await gotoSite(page, '/contact.html');
  await page.waitForLoadState('load');
  await expect
    .poll(() => page.locator('#contact').evaluate(element => element.getBoundingClientRect().top))
    .toBeLessThan(180);
  if (isMobile) {
    await page.touchscreen.tap(10, 200);
    await page.evaluate(() => window.scrollBy({ top: -700, behavior: 'instant' }));
  } else {
    await page.mouse.wheel(0, -700);
  }
  await page.waitForTimeout(3500);
  const top = await page
    .locator('#contact')
    .evaluate(element => element.getBoundingClientRect().top);
  expect(top).toBeGreaterThan(250);
});
