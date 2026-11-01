import { expect, test } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

test('all newly added offscreen animations are paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await gotoSite(page, '/');
  await page.waitForFunction(() => window.__portfolioOffscreenPauseBound === true);
  await page.addStyleTag({
    content:
      '@keyframes audit-spin { to { transform: rotate(360deg) } } .audit-orb { position: absolute; top: 20000px; width: 10px; height: 10px; animation: audit-spin 1s linear infinite; }',
  });
  await page.evaluate(() => {
    for (let i = 0; i < 2; i++) {
      const element = document.createElement('div');
      element.className = 'audit-orb';
      document.body.appendChild(element);
    }
  });
  await expect(page.locator('.audit-orb.is-offscreen-paused')).toHaveCount(2, { timeout: 10000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.audit-orb.is-offscreen-paused')).toHaveCount(0);
});
