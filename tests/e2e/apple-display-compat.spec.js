import { expect, test } from '@playwright/test';

const pathPrefix = process.env.TEST_TARGET === 'github' ? '/mangeshrautarchive' : '';
const gotoSite = (page, path = '/') => page.goto(`${pathPrefix}${path}`, { waitUntil: 'domcontentloaded' });

test.describe('Apple Super Retina / iPhone 17 Pro Max display compat', () => {
  test.use({
    viewport: { width: 440, height: 956 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1',
  });

  test('viewport meta and Apple display CSS are present', async ({ page }) => {
    await gotoSite(page);

    const head = await page.evaluate(() => ({
      viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
      viewportFit: document.querySelector('meta[name="viewport"]')?.content.includes('viewport-fit=cover'),
      themeLight: !!document.querySelector('meta[name="theme-color"][media*="light"]'),
      themeDark: !!document.querySelector('meta[name="theme-color"][media*="dark"]'),
      appleTitle: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content'),
      appleCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content'),
      hasAppleCss: [...document.styleSheets].some(s => {
        try {
          return s.href?.includes('apple-super-retina-display.css');
        } catch {
          return false;
        }
      }),
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      innerW: window.innerWidth,
      innerH: window.innerHeight,
      dpr: window.devicePixelRatio,
    }));

    expect(head.viewportFit).toBe(true);
    expect(head.themeLight).toBe(true);
    expect(head.themeDark).toBe(true);
    expect(head.appleCapable).toBe('yes');
    expect(head.hasAppleCss).toBe(true);
    expect(head.colorScheme).toMatch(/light|dark/);
    expect(head.innerW).toBe(440);
    expect(head.innerH).toBe(956);
    expect(head.dpr).toBe(3);
  });

  test('Dynamic Island nav clears safe-area and main content offset', async ({ page }) => {
    await gotoSite(page);
    await page.waitForSelector('#global-nav', { state: 'visible' });

    const layout = await page.evaluate(() => {
      const nav = document.querySelector('.global-nav.dynamic-island')?.getBoundingClientRect();
      const main = document.querySelector('#main-content')?.getBoundingClientRect();
      const mainPad = getComputedStyle(document.querySelector('#main-content')).paddingTop;
      return {
        navTop: nav?.top ?? null,
        navHeight: nav?.height ?? null,
        mainTop: main?.top ?? null,
        mainPad,
        chromeTop: getComputedStyle(document.documentElement).getPropertyValue('--apple-chrome-top').trim(),
      };
    });

    expect(layout.navTop).toBeGreaterThanOrEqual(0);
    expect(layout.navHeight).toBeGreaterThanOrEqual(52);
    expect(parseFloat(layout.mainPad)).toBeGreaterThanOrEqual(layout.navHeight);
    expect(layout.chromeTop).toMatch(/^calc\(/);
  });

  test('no horizontal overflow at 440px logical width', async ({ page }) => {
    await gotoSite(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
