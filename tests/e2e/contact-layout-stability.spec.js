import { test, expect } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

test('built homepage applies shared layout styles before first contentful paint', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Paint timing is measured in Chromium.');
  await page.addInitScript(() => {
    window.__layoutAtFirstPaint = null;
    new PerformanceObserver(list => {
      if (!list.getEntries().some(entry => entry.name === 'first-contentful-paint')) return;
      const shared = document.querySelector('link[href*="premium-deferred.bundle.css"]');
      window.__layoutAtFirstPaint = Boolean(
        shared?.sheet && matchMedia(shared.media || 'all').matches
      );
    }).observe({ type: 'paint', buffered: true });
  });
  await page.route('**/premium-deferred.bundle.css*', async route => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await route.continue();
  });
  await gotoSite(page, '/');
  test.skip(
    (await page.locator('link[href*="premium-deferred.bundle.css"]').count()) === 0,
    'This regression checks production CSS bundling.'
  );
  await expect.poll(() => page.evaluate(() => window.__layoutAtFirstPaint)).toBe(true);
});

test('Contact has its layout styles active before the full page load', async ({ page }) => {
  await page.setViewportSize({ width: 1350, height: 900 });
  await page.route('**/assets/images/profile*.webp*', async route => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await route.continue();
  });
  await gotoSite(page, '/contact.html');
  await page.waitForURL(/#contact$/, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded');
  const early = await page.evaluate(() => {
    const names = ['card-content-accessibility.css', 'apple-super-retina-display.css'];
    return {
      state: document.readyState,
      active: names.map(name => {
        const link = [...document.querySelectorAll('link[rel="stylesheet"]')].find(item =>
          item.href.includes(name)
        );
        return Boolean(link?.sheet && matchMedia(link.media || 'all').matches);
      }),
    };
  });
  expect(early.state).not.toBe('complete');
  expect(early.active).toEqual([true, true]);
  await page.waitForLoadState('load');
});
