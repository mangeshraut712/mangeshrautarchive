import { expect, test } from '@playwright/test';

for (const width of [375, 768, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`utility controls remain reachable at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.addInitScript(mode => localStorage.setItem('themeMode', mode), theme);
      await page.goto('/contact.html');
      const controls = page.locator('#chatbot-toggle, #website-share-toggle, .a11y-toolbar__main');
      await expect(controls).toHaveCount(3);
      for (const control of await controls.all()) await expect(control).toBeVisible();
      const boxes = await controls.evaluateAll(nodes =>
        nodes.map(node => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return { x, y, width, height };
        })
      );
      for (const box of boxes) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      if (width <= 768) {
        expect(
          Math.max(...boxes.map(box => box.y)) - Math.min(...boxes.map(box => box.y))
        ).toBeLessThan(2);
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            expect(Math.abs(boxes[i].x - boxes[j].x)).toBeGreaterThanOrEqual(44);
          }
        }
      }
      await page.locator('.a11y-toolbar__main').click();
      await expect(page.locator('.a11y-toolbar__panel')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
    });
  }
}

test('normal loading does not register a service worker in modern browsers', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForTimeout(3500);
  const scopes = await page.evaluate(async () =>
    (await navigator.serviceWorker.getRegistrations()).map(registration => registration.scope)
  );
  expect(scopes).toEqual([]);
});

test('game difficulty waits for its deferred controls before accepting a tap', async ({ page }) => {
  let release;
  const ready = new Promise(resolve => {
    release = resolve;
  });
  await page.route('**/debug-runner.js*', async route => {
    await ready;
    await route.continue();
  });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');
  await page.locator('.debug-runner-disclosure > summary').click();
  const hard = page.locator('#debug-seg-hard');
  await expect(hard).toBeDisabled();
  release();
  await expect(hard).toBeEnabled();
  await hard.click();
  await expect(hard).toHaveAttribute('aria-selected', 'true');
});
