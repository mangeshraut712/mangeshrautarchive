import { expect, test } from '@playwright/test';

const pathPrefix = process.env.TEST_TARGET === 'github' ? '/mangeshrautarchive' : '';
const gotoSite = (page, path = '/') =>
  page.goto(`${pathPrefix}${path}`, { waitUntil: 'domcontentloaded' });

test.describe('Mobile viewport fit', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('homepage has no horizontal document overflow', async ({ page }) => {
    await gotoSite(page);
    await page.waitForSelector('#main-content', { state: 'attached', timeout: 20_000 });
    // mobile-viewport.css is print/onload deferred — wait for load + stylesheet
    await page.waitForLoadState('load');
    await page
      .waitForFunction(
        () =>
          [...document.styleSheets].some(s => {
            try {
              return s.href?.includes('mobile-viewport.css');
            } catch {
              return false;
            }
          }) || !!document.querySelector('link[href*="mobile-viewport.css"]'),
        null,
        { timeout: 15_000 }
      )
      .catch(() => {});

    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      clientW: document.documentElement.clientWidth,
      innerW: window.innerWidth,
      hasMobileCss:
        [...document.styleSheets].some(s => {
          try {
            return s.href?.includes('mobile-viewport.css');
          } catch {
            return false;
          }
        }) || !!document.querySelector('link[href*="mobile-viewport.css"]'),
    }));

    expect(metrics.hasMobileCss).toBe(true);
    expect(metrics.overflow).toBeLessThanOrEqual(2);
  });

  test('hero actions clear floating chrome after scroll', async ({ page }) => {
    await gotoSite(page);
    await page.waitForSelector('.hero-actions', { state: 'visible' });
    await page.evaluate(() => {
      document
        .querySelector('.hero-actions')
        ?.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    await page.waitForTimeout(300);

    const overlap = await page.evaluate(() => {
      const rect = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { t: r.top, b: r.bottom, l: r.left, r: r.right };
      };
      const actions = rect('.hero-actions');
      const toolbar = rect('.a11y-toolbar');
      const chat = rect('#chatbot-toggle');
      const hits = (a, b) => a && b && !(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b);
      return {
        actionsToolbar: hits(actions, toolbar),
        actionsChat: hits(actions, chat),
        actionsMargin: getComputedStyle(document.querySelector('.hero-actions')).marginBottom,
      };
    });

    expect(overlap.actionsToolbar).toBe(false);
    expect(overlap.actionsChat).toBe(false);
    expect(parseFloat(overlap.actionsMargin)).toBeGreaterThan(60);
  });

  test('floating action buttons do not overlap after scroll', async ({ page }) => {
    await gotoSite(page);
    await page.waitForSelector('#chatbot-toggle', { state: 'visible' });
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
    await page.waitForTimeout(400);

    const fabLayout = await page.evaluate(() => {
      const rect = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { t: r.top, b: r.bottom, l: r.left, r: r.right, h: r.height };
      };
      const topBtn = rect('#go-to-top');
      const chatBtn = rect('#chatbot-toggle');
      const hits = (a, b) => a && b && !(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b);
      const gap = topBtn && chatBtn ? topBtn.t - chatBtn.b : null;
      return {
        overlap: hits(topBtn, chatBtn),
        gap,
        chatAboveTop: chatBtn && topBtn ? chatBtn.b <= topBtn.t : null,
      };
    });

    expect(fabLayout.overlap).toBe(false);
    if (fabLayout.gap !== null) {
      expect(fabLayout.gap).toBeGreaterThanOrEqual(8);
    }
    expect(fabLayout.chatAboveTop).toBe(true);
  });

  test('travel atlas fits mobile width', async ({ page }) => {
    await gotoSite(page, '/travel.html');
    await page.waitForTimeout(1000);

    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      layoutWidth: document.querySelector('.travel-layout')?.getBoundingClientRect().width ?? 0,
      innerW: window.innerWidth,
    }));

    expect(metrics.overflow).toBeLessThanOrEqual(2);
    expect(metrics.layoutWidth).toBeLessThanOrEqual(metrics.innerW + 1);
  });

  test('projects view-all button stays within mobile viewport', async ({ page }) => {
    await gotoSite(page);
    await page.waitForSelector('#projects', { state: 'visible', timeout: 20_000 });
    await page.locator('#projects').scrollIntoViewIfNeeded();

    const btn = page.locator('.projects-view-all-btn');
    await expect(btn).toBeVisible();

    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    }
  });

  test('chatbot shows blurred backdrop and opaque panel on mobile', async ({ page }) => {
    await gotoSite(page);
    await page.locator('#chatbot-toggle').click();
    await page.waitForSelector('#chatbot-widget.visible', { state: 'visible' });

    const state = await page.evaluate(() => {
      const backdrop = document.getElementById('chatbot-backdrop');
      const widget = document.getElementById('chatbot-widget');
      const backdropStyle = backdrop ? getComputedStyle(backdrop) : null;
      const widgetStyle = widget ? getComputedStyle(widget) : null;
      return {
        backdropActive: backdrop?.classList.contains('active'),
        bodyLocked: document.body.classList.contains('chatbot-open'),
        backdropBlur: backdropStyle?.webkitBackdropFilter || backdropStyle?.backdropFilter,
        widgetBg: widgetStyle?.backgroundColor,
      };
    });

    expect(state.backdropActive).toBe(true);
    expect(state.bodyLocked).toBe(true);
    expect(state.backdropBlur).toContain('blur');
    expect(state.widgetBg).toMatch(/rgb/);
  });
});
