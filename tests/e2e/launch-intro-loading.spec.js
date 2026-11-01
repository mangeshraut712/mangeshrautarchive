import { test, expect } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

test('first-visit greeting releases ready content even when the main bootstrap fails', async ({
  page,
}) => {
  await page.route('**/js/core/bootstrap.js?*', route => route.abort());
  await gotoSite(page, '/');
  const intro = page.locator('#launch-intro');
  await expect(intro).toHaveAttribute('data-launch-intro-bound', 'true');
  await expect(intro).toHaveAttribute('data-launch-intro-complete', 'true');
  await expect(intro).toBeHidden();
  await expect(page.locator('#home-heading')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.classList.contains('launch-intro-active'))
  ).toBe(false);
});

test('greeting runs during loading, ends on input, and does not replay in the session', async ({
  page,
}) => {
  await page.route('**/assets/images/profile*.webp*', async route => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.continue();
  });
  await gotoSite(page, '/');
  const intro = page.locator('#launch-intro');
  await expect(intro).toHaveClass(/is-playing/);
  await page.keyboard.press('Escape');
  await expect(intro).toBeHidden();
  await page.reload();
  await expect(intro).toBeHidden();
  expect(
    await page.evaluate(() => sessionStorage.getItem('portfolio-launch-intro-seen-v2026'))
  ).toBe('1');
});

test('deep links and reduced-motion visits open directly to their content', async ({ page }) => {
  await gotoSite(page, '/#contact');
  await expect(page.locator('#launch-intro')).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoSite(page, '/');
  await expect(page.locator('#launch-intro')).toBeHidden();
});
