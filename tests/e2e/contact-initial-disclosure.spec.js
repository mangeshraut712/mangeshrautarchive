import { test, expect } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

test('Contact prepares section disclosures independently of the main bootstrap', async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize(isMobile ? { width: 412, height: 823 } : { width: 1440, height: 900 });
  await page.route('**/js/core/bootstrap.js?*', route => route.abort());
  await gotoSite(page, '/#contact');
  const preview = page.locator('#experience-timeline');
  await expect(preview).toHaveAttribute('data-preview-bound', 'true');
  await expect(preview.locator('.experience-item.is-preview-hidden')).toHaveCount(3);
  const expand = page.locator('[data-preview-for="experience-timeline"] button');
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
  await expand.scrollIntoViewIfNeeded();
  await expand.click();
  await expect(preview.locator('.experience-item.is-preview-hidden')).toHaveCount(0);
  await expect(expand).toHaveAttribute('aria-expanded', 'true');
});

test('Contact does not load homepage music until the visitor returns to Home', async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize(isMobile ? { width: 412, height: 823 } : { width: 1440, height: 900 });
  let musicRequests = 0;
  page.on('request', request => {
    if (new URL(request.url()).pathname.endsWith('/js/modules/lastfm.js')) musicRequests += 1;
  });
  await gotoSite(page, '/#contact');
  await page.waitForLoadState('load');
  await page.waitForTimeout(3000);
  expect(musicRequests).toBe(0);
  if (isMobile) {
    await page.touchscreen.tap(10, 200);
  } else {
    await page.mouse.wheel(0, -20000);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(100);
  await expect.poll(() => musicRequests).toBeGreaterThan(0);
});
