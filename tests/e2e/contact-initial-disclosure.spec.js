import { test, expect } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

test('desktop Contact prepares section disclosures independently of the main bootstrap', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The early Contact path is desktop-only.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/js/core/bootstrap.js?*', route => route.abort());
  await gotoSite(page, '/#contact');
  const preview = page.locator('#experience-timeline');
  await expect(preview).toHaveAttribute('data-preview-bound', 'true');
  await expect(preview.locator('.experience-item.is-preview-hidden')).toHaveCount(3);
  const expand = page.locator('[data-preview-for="experience-timeline"] button');
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
  await expand.click();
  await expect(preview.locator('.experience-item.is-preview-hidden')).toHaveCount(0);
  await expect(expand).toHaveAttribute('aria-expanded', 'true');
});
