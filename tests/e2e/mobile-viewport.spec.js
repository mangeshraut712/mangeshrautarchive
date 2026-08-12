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
    await page.waitForLoadState('load');
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
    expect(parseFloat(overlap.actionsMargin)).toBeLessThanOrEqual(16);
  });

  test('initial mobile hero content is not covered by floating controls', async ({ page }) => {
    await gotoSite(page);
    await page.waitForSelector('#chatbot-toggle', { state: 'visible' });
    await page.waitForSelector('.hero-text-block', { state: 'visible' });
    await page.waitForTimeout(300);

    const overlaps = await page.evaluate(() => {
      const controls = [
        document.querySelector('#chatbot-toggle'),
        document.querySelector('#website-share-toggle'),
        document.querySelector('.a11y-toolbar__main'),
      ];
      const home = document.querySelector('#home');
      const content = [
        '.hero-name',
        '.hero-title',
        '.hero-role-flip',
        '.hero-badge-cluster',
        '.music-card',
        '.hero-description-line',
        '.hero-cta',
      ].flatMap(selector =>
        [...(home?.querySelectorAll(selector) ?? [])].flatMap(element => [
          ...element.getClientRects(),
        ])
      );
      const intersects = (a, b) =>
        a &&
        b &&
        !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);

      return controls.map(control => {
        if (!control || getComputedStyle(control).visibility === 'hidden') return false;
        const controlRect = control.getBoundingClientRect();
        return content.some(contentRect => intersects(contentRect, controlRect));
      });
    });

    expect(overlaps).toEqual([false, false, false]);
  });

  test('mobile identity stays centered beside a vertical utility dock', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 862 });
    await gotoSite(page);
    await page.waitForLoadState('load');
    await page.waitForSelector('#chatbot-toggle', { state: 'visible' });
    await page.waitForTimeout(300);

    const layout = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector)?.getBoundingClientRect() ?? null;
      const controls = [
        rect('.a11y-toolbar__main'),
        rect('#website-share-toggle'),
        rect('#chatbot-toggle'),
      ];
      const nameText = rect('.hero-name-text');
      const verified = rect('.hero-verified-badge');
      const nameLeft = Math.min(
        nameText?.left ?? Number.POSITIVE_INFINITY,
        verified?.left ?? Number.POSITIVE_INFINITY
      );
      const nameRight = Math.max(
        nameText?.right ?? Number.NEGATIVE_INFINITY,
        verified?.right ?? Number.NEGATIVE_INFINITY
      );
      const dockCentersX = controls.map(control =>
        control ? control.left + control.width / 2 : Number.POSITIVE_INFINITY
      );
      const ordered = [...controls].sort((first, second) => (first?.top ?? 0) - (second?.top ?? 0));
      const gaps = ordered
        .slice(1)
        .map((control, index) => (control?.top ?? 0) - (ordered[index]?.bottom ?? 0));

      return {
        nameCenterDelta: Math.abs((nameLeft + nameRight) / 2 - window.innerWidth / 2),
        dockColumnDelta: Math.max(...dockCentersX) - Math.min(...dockCentersX),
        dockRightInset:
          window.innerWidth - Math.max(...controls.map(control => control?.right ?? 0)),
        minimumGap: Math.min(...gaps),
        dockBottom: Math.max(...controls.map(control => control?.bottom ?? 0)),
        viewportHeight: window.innerHeight,
      };
    });

    expect(layout.nameCenterDelta).toBeLessThanOrEqual(2);
    expect(layout.dockColumnDelta).toBeLessThanOrEqual(2);
    expect(layout.dockRightInset).toBeGreaterThanOrEqual(12);
    expect(layout.minimumGap).toBeGreaterThanOrEqual(8);
    expect(layout.minimumGap).toBeLessThanOrEqual(12);
    expect(layout.dockBottom).toBeLessThanOrEqual(layout.viewportHeight - 12);
  });

  test('mobile hero keeps projects above resume within the first viewport', async ({ page }) => {
    await gotoSite(page);
    await page.waitForLoadState('load');

    const layout = await page.evaluate(() => {
      const projects = document.querySelector('.hero-cta-secondary')?.getBoundingClientRect();
      const resume = document.querySelector('.resume-dropdown-wrapper')?.getBoundingClientRect();
      const about = document.querySelector('#about')?.getBoundingClientRect();
      return {
        projectsTop: projects?.top ?? Number.POSITIVE_INFINITY,
        resumeTop: resume?.top ?? Number.NEGATIVE_INFINITY,
        resumeBottom: resume?.bottom ?? Number.POSITIVE_INFINITY,
        aboutTop: about?.top ?? Number.NEGATIVE_INFINITY,
        viewportHeight: window.innerHeight,
      };
    });

    expect(layout.projectsTop).toBeLessThan(layout.resumeTop);
    expect(layout.resumeBottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
    expect(layout.aboutTop).toBeGreaterThanOrEqual(layout.viewportHeight - 1);
  });

  test('compact resume choices open below without scrolling or colliding with the dock', async ({
    page,
  }) => {
    await gotoSite(page);
    await page.waitForLoadState('load');
    await page.waitForTimeout(250);
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.locator('#resume-dropdown-toggle').click();
    await expect(page.locator('#resume-dropdown-menu')).toHaveAttribute('data-placement', 'bottom');

    const layout = await page.evaluate(() => {
      const toggle = document.querySelector('#resume-dropdown-toggle')?.getBoundingClientRect();
      const menu = document.querySelector('#resume-dropdown-menu')?.getBoundingClientRect();
      const dockControls = [
        document.querySelector('.a11y-toolbar'),
        document.querySelector('#website-share-toggle'),
        document.querySelector('#chatbot-toggle'),
      ];
      return {
        gap: toggle && menu ? menu.top - toggle.bottom : Number.NEGATIVE_INFINITY,
        menuBottom: menu?.bottom ?? Number.POSITIVE_INFINITY,
        menuHeight: menu?.height ?? Number.POSITIVE_INFINITY,
        heroTitleOpacity: getComputedStyle(document.querySelector('.hero-title')).opacity,
        scrollAfter: window.scrollY,
        viewportHeight: window.innerHeight,
        dockHidden: dockControls.every(control => {
          if (!control) return true;
          const style = getComputedStyle(control);
          return style.visibility === 'hidden' && style.pointerEvents === 'none';
        }),
      };
    });

    expect(layout.gap).toBeGreaterThanOrEqual(8);
    expect(layout.menuBottom).toBeLessThanOrEqual(layout.viewportHeight - 8);
    expect(layout.menuHeight).toBeLessThanOrEqual(112);
    expect(layout.heroTitleOpacity).toBe('1');
    expect(Math.abs(layout.scrollAfter - scrollBefore)).toBeLessThanOrEqual(1);
    expect(layout.dockHidden).toBe(true);
  });

  test('wide phone hero keeps compact order without duplicate rings', async ({ page }) => {
    await page.setViewportSize({ width: 574, height: 859 });
    await gotoSite(page);
    await page.waitForLoadState('load');

    const layout = await page.evaluate(() => {
      const projects = document.querySelector('.hero-cta-secondary')?.getBoundingClientRect();
      const resume = document.querySelector('.resume-dropdown-wrapper')?.getBoundingClientRect();
      const avatar = document.querySelector('.profile-image-wrapper')?.getBoundingClientRect();
      const image = document.querySelector('#profile-image');
      const wrapper = document.querySelector('.profile-image-wrapper');
      const primary = document.querySelector('.hero-cta-primary');
      const about = document.querySelector('#about')?.getBoundingClientRect();
      return {
        projectsTop: projects?.top ?? Number.POSITIVE_INFINITY,
        resumeTop: resume?.top ?? Number.NEGATIVE_INFINITY,
        resumeBottom: resume?.bottom ?? Number.POSITIVE_INFINITY,
        avatarWidth: avatar?.width ?? Number.POSITIVE_INFINITY,
        imageBorder: image ? getComputedStyle(image).borderTopWidth : '',
        wrapperBorder: wrapper ? getComputedStyle(wrapper).borderTopWidth : '',
        primaryShadow: primary ? getComputedStyle(primary).boxShadow : '',
        primaryBefore: primary ? getComputedStyle(primary, '::before').content : '',
        aboutTop: about?.top ?? Number.NEGATIVE_INFINITY,
        viewportHeight: window.innerHeight,
      };
    });

    expect(layout.projectsTop).toBeLessThan(layout.resumeTop);
    expect(layout.resumeBottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
    expect(layout.avatarWidth).toBeLessThanOrEqual(76);
    expect(layout.imageBorder).toBe('0px');
    expect(layout.wrapperBorder).toBe('2px');
    expect(['none', 'rgba(0, 0, 0, 0) 0px 0px 0px 0px']).toContain(layout.primaryShadow);
    expect(['', 'none', '""']).toContain(layout.primaryBefore);
    expect(layout.aboutTop).toBeGreaterThanOrEqual(layout.viewportHeight - 1);
  });

  test('mobile hero spacing stays balanced without compressing content groups', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 500, height: 862 });
    await gotoSite(page);
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);

    const layout = await page.evaluate(() => {
      const nav = document.querySelector('#global-nav')?.getBoundingClientRect();
      const hero = document.querySelector('.hero-layout-wrapper')?.getBoundingClientRect();
      const home = document.querySelector('#home')?.getBoundingClientRect();
      const about = document.querySelector('#about')?.getBoundingClientRect();
      const heroLayout = document.querySelector('.hero-layout-wrapper');
      const heroText = document.querySelector('.hero-text-block');
      return {
        topGap: (hero?.top ?? Number.POSITIVE_INFINITY) - (nav?.bottom ?? 0),
        bottomGap: (home?.bottom ?? 0) - (hero?.bottom ?? Number.POSITIVE_INFINITY),
        heroBottom: hero?.bottom ?? Number.POSITIVE_INFINITY,
        aboutTop: about?.top ?? Number.NEGATIVE_INFINITY,
        viewportHeight: window.innerHeight,
        layoutGap: Number.parseFloat(getComputedStyle(heroLayout).gap),
        textGap: Number.parseFloat(getComputedStyle(heroText).gap),
      };
    });

    expect(Math.abs(layout.topGap - layout.bottomGap)).toBeLessThanOrEqual(24);
    expect(layout.heroBottom).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.aboutTop).toBeGreaterThanOrEqual(layout.viewportHeight - 1);
    expect(layout.layoutGap).toBeGreaterThanOrEqual(12);
    expect(layout.textGap).toBeGreaterThanOrEqual(12);
  });

  test('short mobile hero uses natural scrolling below the navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 680 });
    await gotoSite(page);
    await page.waitForLoadState('load');

    const layout = await page.evaluate(() => {
      const nav = document.querySelector('#global-nav')?.getBoundingClientRect();
      const hero = document.querySelector('.hero-layout-wrapper')?.getBoundingClientRect();
      const home = document.querySelector('#home')?.getBoundingClientRect();
      return {
        contentStartsBelowNav: (hero?.top ?? 0) >= (nav?.bottom ?? Number.POSITIVE_INFINITY),
        homeExtendsPastViewport: (home?.bottom ?? 0) > window.innerHeight,
        documentCanScroll: document.documentElement.scrollHeight > window.innerHeight,
      };
    });

    expect(layout.contentStartsBelowNav).toBe(true);
    expect(layout.homeExtendsPastViewport).toBe(true);
    expect(layout.documentCanScroll).toBe(true);
  });

  test('support card keeps both blessing images visible and all crypto options in one row', async ({
    page,
  }) => {
    await gotoSite(page, '/#contact');
    await page.waitForLoadState('load');
    await page.locator('.support-donation-card').scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector('.ganesh-blessing-img')).objectFit === 'contain',
      null,
      { timeout: 15_000 }
    );

    const layout = await page.evaluate(() => {
      const images = [...document.querySelectorAll('.ganesh-blessing-img, .hanuman-blessing-img')];
      const crypto = [...document.querySelectorAll('.crypto-mini-btn')];
      const centers = crypto.map(item => {
        const rect = item.getBoundingClientRect();
        return rect.top + rect.height / 2;
      });
      const card = document.querySelector('.support-donation-card');
      const cardStyle = card ? getComputedStyle(card) : null;
      return {
        imageFits: images.map(image => getComputedStyle(image).objectFit),
        cryptoCount: crypto.length,
        cryptoRowDelta: Math.max(...centers) - Math.min(...centers),
        backgroundImage: cardStyle?.backgroundImage ?? '',
        backdropFilter: cardStyle?.backdropFilter ?? '',
      };
    });

    expect(layout.imageFits).toEqual(['contain', 'contain']);
    expect(layout.cryptoCount).toBe(5);
    expect(layout.cryptoRowDelta).toBeLessThanOrEqual(2);
    expect(layout.backgroundImage).toBe('none');
    expect(['none', '']).toContain(layout.backdropFilter);

    await page.locator('[data-blessing="ganesh"]').click();
    await expect(page.locator('.blessing-modal-overlay')).toBeVisible();
  });

  test('earned degree badge uses the original Apple green in both themes', async ({ page }) => {
    await gotoSite(page);
    await page.waitForLoadState('load');
    await page.locator('#education').scrollIntoViewIfNeeded();
    const badge = page.locator('.education-badge.completed').first();
    await expect(badge).toBeVisible();
    await expect
      .poll(() => badge.evaluate(element => getComputedStyle(element).backgroundColor))
      .not.toBe('rgba(0, 0, 0, 0)');

    const colors = {};
    for (const theme of ['light', 'dark']) {
      await page.evaluate(activeTheme => {
        document.documentElement.classList.toggle('dark', activeTheme === 'dark');
        document.documentElement.dataset.theme = activeTheme;
      }, theme);
      colors[theme] = await badge.evaluate(element => {
        const computed = getComputedStyle(element);
        return {
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
        };
      });
    }

    expect(colors.light).toEqual({
      backgroundColor: 'rgb(52, 199, 89)',
      backgroundImage: 'none',
    });
    expect(colors.dark).toEqual({
      backgroundColor: 'rgb(48, 209, 88)',
      backgroundImage: 'none',
    });
  });

  test('calendar today marker and Sunday labels use the original Apple red', async ({ page }) => {
    await gotoSite(page);
    await page.waitForLoadState('load');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(page.locator('.day-cell.today')).toBeVisible();

    const colors = {};
    for (const theme of ['light', 'dark']) {
      const expectedToday = theme === 'dark' ? 'rgb(255, 69, 58)' : 'rgb(255, 59, 48)';
      await page.evaluate(activeTheme => {
        document.documentElement.classList.toggle('dark', activeTheme === 'dark');
        document.documentElement.dataset.theme = activeTheme;
      }, theme);
      await expect
        .poll(() =>
          page
            .locator('.day-cell.today')
            .evaluate(element => getComputedStyle(element).backgroundColor)
        )
        .toBe(expectedToday);
      colors[theme] = await page.evaluate(() => ({
        today: getComputedStyle(document.querySelector('.day-cell.today')).backgroundColor,
        sunday: getComputedStyle(document.querySelector('.ios-weekdays span:first-child')).color,
      }));
    }

    expect(colors.light).toEqual({
      today: 'rgb(255, 59, 48)',
      sunday: 'rgb(255, 59, 48)',
    });
    expect(colors.dark).toEqual({
      today: 'rgb(255, 69, 58)',
      sunday: 'rgb(255, 69, 58)',
    });
  });

  test('WHOOP readiness colors use the vivid traffic-light palette in both themes', async ({
    page,
  }) => {
    await gotoSite(page);
    await page.waitForLoadState('load');
    await page.locator('#currently-section').evaluate(element => {
      element.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    await expect
      .poll(() =>
        page
          .locator('link[data-lazy-style-key="currently"]')
          .evaluate(link => link.dataset.styleLoaded)
      )
      .toBe('true');
    const metric = page.locator('#whoop-recovery-card');
    await expect(metric).toBeVisible();

    const expected = {
      light: {
        green: 'rgb(52, 199, 89)',
        yellow: 'rgb(255, 204, 0)',
        red: 'rgb(255, 59, 48)',
      },
      dark: {
        green: 'rgb(48, 209, 88)',
        yellow: 'rgb(255, 214, 10)',
        red: 'rgb(255, 69, 58)',
      },
    };
    const colors = { light: {}, dark: {} };

    for (const theme of ['light', 'dark']) {
      await page.evaluate(activeTheme => {
        document.documentElement.classList.toggle('dark', activeTheme === 'dark');
        document.documentElement.dataset.theme = activeTheme;
      }, theme);
      for (const tone of ['green', 'yellow', 'red']) {
        colors[theme][tone] = await metric.evaluate((element, activeTone) => {
          element.classList.remove('metric-green', 'metric-yellow', 'metric-red');
          element.classList.add(`metric-${activeTone}`);
          return getComputedStyle(element.querySelector('.metric-value')).color;
        }, tone);
      }
    }

    expect(colors).toEqual(expected);
  });

  test('mobile utility controls stay in a vertical bottom-right dock after scroll', async ({
    page,
  }) => {
    await gotoSite(page);
    await page.waitForLoadState('load');
    await page.waitForSelector('#chatbot-toggle', { state: 'visible' });
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
    await page.waitForTimeout(400);

    const fabLayout = await page.evaluate(() => {
      const rect = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          Number(style.opacity) === 0 ||
          r.width === 0 ||
          r.height === 0
        ) {
          return null;
        }
        return { t: r.top, b: r.bottom, l: r.left, r: r.right, h: r.height };
      };
      const controls = [
        rect('.a11y-toolbar__main'),
        rect('#website-share-toggle'),
        rect('#chatbot-toggle'),
        rect('#go-to-top'),
      ].filter(Boolean);
      const centersX = controls.map(control => (control.l + control.r) / 2);
      const ordered = [...controls].sort((a, b) => a.t - b.t);
      const gaps = ordered.slice(1).map((control, index) => control.t - ordered[index].b);
      return {
        controlCount: controls.length,
        columnDelta: Math.max(...centersX) - Math.min(...centersX),
        rightInset: window.innerWidth - Math.max(...controls.map(control => control.r)),
        bottomInset: window.innerHeight - Math.max(...controls.map(control => control.b)),
        minimumGap: Math.min(...gaps),
      };
    });

    expect(fabLayout.controlCount).toBeGreaterThanOrEqual(3);
    expect(fabLayout.columnDelta).toBeLessThanOrEqual(2);
    expect(fabLayout.rightInset).toBeGreaterThanOrEqual(12);
    expect(fabLayout.bottomInset).toBeGreaterThanOrEqual(12);
    expect(fabLayout.minimumGap).toBeGreaterThanOrEqual(8);
    expect(fabLayout.minimumGap).toBeLessThanOrEqual(12);
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
    await page.waitForLoadState('load');
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
