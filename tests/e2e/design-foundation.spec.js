import { test, expect } from './helpers/isolated-test.js';

const routes = [
  '/',
  '/#projects',
  '/#contact',
  '/systems.html',
  '/monitor.html',
  '/travel.html',
  '/uses.html',
  '/changelog.html',
  '/blog/',
  '/blog/gta-vi-launch-engineering-2026.html',
  '/case-studies/portfolio.html',
  '/404.html',
  '/offline.html',
];

for (const width of [390, 768, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`shared presentation at ${width}px in ${theme}`, async ({ page, browserName }) => {
      test.setTimeout(180000);
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.addInitScript(value => localStorage.setItem('themeMode', value), theme);
      for (const route of routes) {
        await page.goto(route);
        const anchor = route.includes('#') ? route.slice(route.indexOf('#')) : 'main';
        await page.locator(anchor).first().scrollIntoViewIfNeeded();
        await expect(page.locator('body')).toBeVisible();
        const result = await page.evaluate(() => {
          const visible = [...document.querySelectorAll('body *')].filter(element => {
            const box = element.getBoundingClientRect();
            return box.width && box.height && box.top < innerHeight && box.bottom > 0;
          });
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            gradients: visible
              .filter(element => /gradient\(/.test(getComputedStyle(element).backgroundImage))
              .map(element => element.className),
            heavyHeadings: visible
              .filter(
                element =>
                  /^H[1-6]$/.test(element.tagName) &&
                  Number(getComputedStyle(element).fontWeight) > 500
              )
              .map(element => element.textContent),
          };
        });
        expect(result, route).toEqual({ overflow: false, gradients: [], heavyHeadings: [] });
        await page.bringToFront();
        // WebKit on macOS uses Option-Tab to include links in keyboard navigation.
        await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
        const focus = page.locator(':focus-visible');
        await expect(focus, route).toHaveCount(1);
        await expect(focus.first()).not.toHaveCSS('outline-style', 'none');
      }
    });
  }
}
