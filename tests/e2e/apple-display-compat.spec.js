import { expect, test } from '@playwright/test';

test.use({ trace: 'off' });

const pathPrefix = process.env.TEST_TARGET === 'github' ? '/mangeshrautarchive' : '';
const gotoSite = (page, path = '/') =>
  page.goto(`${pathPrefix}${path}`, { waitUntil: 'domcontentloaded' });

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
    await page.waitForFunction(
      () =>
        [...document.styleSheets].some(
          s => s.href?.includes('apple-super-retina-display.css') && s.cssRules.length > 0
        ),
      { timeout: 15000 }
    );

    const head = await page.evaluate(() => ({
      viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
      viewportFit: document
        .querySelector('meta[name="viewport"]')
        ?.content.includes('viewport-fit=cover'),
      themeLight: !!document.querySelector('meta[name="theme-color"][media*="light"]'),
      themeDark: !!document.querySelector('meta[name="theme-color"][media*="dark"]'),
      appleTitle: document
        .querySelector('meta[name="apple-mobile-web-app-title"]')
        ?.getAttribute('content'),
      appleCapable: document
        .querySelector('meta[name="apple-mobile-web-app-capable"]')
        ?.getAttribute('content'),
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
      ppiToken: getComputedStyle(document.documentElement)
        .getPropertyValue('--apple-display-ppi')
        .trim(),
      physicalW: getComputedStyle(document.documentElement)
        .getPropertyValue('--apple-display-physical-w')
        .trim(),
      physicalH: getComputedStyle(document.documentElement)
        .getPropertyValue('--apple-display-physical-h')
        .trim(),
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
    expect(head.ppiToken).toBe('460');
    expect(head.physicalW).toBe('1320');
    expect(head.physicalH).toBe('2868');
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
        chromeTop: getComputedStyle(document.documentElement)
          .getPropertyValue('--apple-chrome-top')
          .trim(),
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

  test('iPhone 17 Pro Max compatibility matrix — Liquid Glass overlays hidden', async ({
    page,
  }) => {
    await gotoSite(page);
    await page.waitForTimeout(1500);

    const overlays = await page.evaluate(async () => {
      if (window.websiteShareWidget) {
        await window.websiteShareWidget.ensureShareToggleReady();
      }
      const share = document.getElementById('website-share-dialog');
      const backdrop = document.getElementById('chatbot-backdrop');
      const goTop = document.getElementById('go-to-top');
      const cs = el => (el ? getComputedStyle(el) : null);
      return {
        htmlBg: getComputedStyle(document.documentElement).backgroundColor,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        shareDisplay: cs(share)?.display,
        shareBackdrop: cs(share)?.backdropFilter || cs(share)?.webkitBackdropFilter,
        chatDisplay: cs(backdrop)?.display,
        chatBackdrop: cs(backdrop)?.backdropFilter || cs(backdrop)?.webkitBackdropFilter,
        goTopDisplay: cs(goTop)?.display,
        goTopVisible: goTop?.classList.contains('visible'),
      };
    });

    expect(overlays.shareDisplay).toBe('none');
    expect(overlays.chatDisplay).toBe('none');
    expect(overlays.goTopDisplay).toBe('none');
    expect(overlays.goTopVisible).toBe(false);
    expect(['none', '']).toContain(overlays.shareBackdrop || 'none');
    expect(['none', '']).toContain(overlays.chatBackdrop || 'none');
    expect(overlays.htmlBg).toMatch(/rgb/);
    expect(overlays.bodyBg).toMatch(/rgb/);
  });

  test('iPhone 17 Pro Max compatibility matrix — AOD, XDR, P3, haptics', async ({ page }) => {
    await gotoSite(page);
    await page.waitForFunction(() => typeof globalThis.appleHaptics?.trigger === 'function', {
      timeout: 20_000,
    });
    await page.waitForFunction(
      () =>
        [...document.styleSheets].some(
          s => s.href?.includes('apple-super-retina-display.css') && s.cssRules.length > 0
        ),
      { timeout: 15000 }
    );

    const matrix = await page.evaluate(() => {
      const root = document.documentElement;
      const hero = document.querySelector('.hero-name.xdr-highlight');
      const profile = document.querySelector('.profile-image.xdr-media');
      const hasP3Rules = [...document.styleSheets].some(sheet => {
        try {
          return (
            sheet.href?.includes('apple-super-retina-display.css') &&
            [...sheet.cssRules].some(rule => rule.cssText?.includes('color-gamut: p3'))
          );
        } catch {
          return false;
        }
      });
      return {
        hasAodClassSupport: [...document.styleSheets].some(sheet => {
          try {
            return [...sheet.cssRules].some(rule => rule.cssText?.includes('aod-dim'));
          } catch {
            return false;
          }
        }),
        hasXdrHighlight: !!hero,
        hasXdrMedia: !!profile,
        hasP3Rules,
        hasHapticsApi: typeof globalThis.appleHaptics?.trigger === 'function',
        mainContain: getComputedStyle(document.querySelector('#main-content')).contain,
        ppi:
          root.style.getPropertyValue('--apple-display-ppi') ||
          getComputedStyle(root).getPropertyValue('--apple-display-ppi').trim(),
      };
    });

    await page.evaluate(() => {
      document.documentElement.classList.add('dark', 'aod-dim');
    });
    await page.waitForTimeout(400);

    const aod = await page.evaluate(() => ({
      aodDim: document.documentElement.classList.contains('aod-dim'),
      darkBg: getComputedStyle(document.documentElement).backgroundColor,
      aodCssActive: (() => {
        document.documentElement.classList.add('dark', 'aod-dim');
        return getComputedStyle(document.documentElement).backgroundColor;
      })(),
    }));

    expect(matrix.hasAodClassSupport).toBe(true);
    expect(matrix.hasXdrHighlight).toBe(true);
    expect(matrix.hasXdrMedia).toBe(true);
    expect(matrix.hasP3Rules).toBe(true);
    expect(matrix.hasHapticsApi).toBe(true);
    expect(matrix.ppi).toBe('460');
    expect(aod.aodCssActive).toBe('rgb(0, 0, 0)');
  });

  test('WWDC 2026 matrix — view transitions nav and reduced transparency CSS', async ({ page }) => {
    await gotoSite(page);
    await page.waitForFunction(() => window.__portfolioViewNavReady === true, { timeout: 25_000 });

    const matrix = await page.evaluate(async () => {
      const [lgCss, srCss] = await Promise.all([
        fetch('assets/css/wwdc26-liquid-glass.css').then(r => r.text()),
        fetch('assets/css/apple-super-retina-display.css').then(r => r.text()),
      ]);
      return {
        viewTransitionMeta: document
          .querySelector('meta[name="view-transition"]')
          ?.getAttribute('content'),
        viewNavReady: Boolean(window.__portfolioViewNavReady),
        viewNavBound: Boolean(window.__portfolioViewNavBound),
        viewNavSupported: Boolean(window.__portfolioViewNavSupported),
        hasReducedTransparency: lgCss.includes('prefers-reduced-transparency'),
        hasScrollReveal: srCss.includes('appleSectionScrollReveal'),
      };
    });

    const manifest = await page.evaluate(async () => {
      const res = await fetch('manifest.json');
      const data = await res.json();
      return {
        narrowScreenshot: data.screenshots?.some(s => s.form_factor === 'narrow'),
        icon180: data.icons?.some(i => i.sizes === '180x180'),
      };
    });

    expect(matrix.viewTransitionMeta).toBe('same-origin');
    expect(matrix.viewNavReady).toBe(true);
    if (matrix.viewNavSupported) {
      expect(matrix.viewNavBound).toBe(true);
    }
    expect(matrix.hasReducedTransparency).toBe(true);
    expect(matrix.hasScrollReveal).toBe(true);
    expect(manifest.narrowScreenshot).toBe(true);
    expect(manifest.icon180).toBe(true);
  });
});
