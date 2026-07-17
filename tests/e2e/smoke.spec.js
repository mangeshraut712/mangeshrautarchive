import { expect, test } from '@playwright/test';
import {
  gotoSite,
  gotoSiteReady,
  scrollSelectorIntoView as scrollIntoViewHelper,
} from './helpers/site.js';

const navSections = [
  'home',
  'about',
  'skills',
  'experience',
  'projects',
  'education',
  'publications',
  'awards',
  'recommendations',
  'certifications',
  'blog',
  'contact',
  'debug-runner-section',
];

const sectionUrlPatterns = {
  projects: /#projects$/,
  education: /#education$/,
  contact: /#contact$/,
};

const waitForTravelMap = async page => {
  const mapContainer = page.locator('#map-container');
  await mapContainer.waitFor({ state: 'attached', timeout: 30_000 });
  await page.waitForFunction(
    () =>
      document.getElementById('map-container')?.dataset.mapReady === 'true' ||
      document.querySelector('#map-container canvas'),
    null,
    { timeout: 45_000 }
  );
  await expect(mapContainer.locator('canvas').first()).toBeVisible({ timeout: 10_000 });
};

const waitForCurrentlyReady = async page => {
  const currentlySection = page.locator('#currently-section');
  await expect(currentlySection).toBeAttached({ timeout: 30_000 });
  await scrollSelectorIntoView(page, '#currently-section');
  await page.waitForSelector('#shows-grid .media-card', { state: 'attached', timeout: 30_000 });
  await page.waitForFunction(
    () => document.getElementById('currently-section')?.dataset.currentlyInit === 'true',
    null,
    { timeout: 20_000 }
  );
};

const scrollSelectorIntoView = scrollIntoViewHelper;

const criticalLayoutChecks = [
  {
    name: 'projects grid',
    selector: '#github-projects-container',
    expectedDisplay: 'grid',
  },
  {
    name: 'education timeline',
    selector: '.education-timeline',
    expectedDisplay: 'block',
  },
  {
    name: 'recommendations grid',
    selector: '.recommendations-grid',
    expectedDisplay: 'grid',
  },
  {
    name: 'certifications grid',
    selector: '.certifications-grid',
    expectedDisplay: 'grid',
  },
];

const criticalOverflowChecks = [
  { name: 'projects content', selector: '#github-projects-container' },
  { name: 'education content', selector: '.education-timeline' },
  { name: 'recommendations content', selector: '.recommendations-grid' },
  { name: 'certifications content', selector: '.certifications-grid' },
];

test.describe('Chrome smoke tests', () => {
  test('homepage renders critical landmarks', async ({ page }) => {
    await gotoSiteReady(page);

    await expect(page).toHaveTitle(/Mangesh Raut/i);
    await expect(page.locator('#global-nav, .global-nav').first()).toBeAttached();
    await expect(page.locator('#main-content')).toBeAttached();
    await expect(page.locator('section#home')).toBeAttached();
    await expect(page.locator('#portfolio-reach')).toBeAttached();
    await expect(page.locator('#reach-count')).toBeAttached();
    await expect(page.locator('section#contact')).toBeAttached();
  });

  test('travel atlas search, empty state, and reset flow work', async ({ page }) => {
    test.setTimeout(150_000);
    await gotoSite(page, '/travel');

    await expect(page).toHaveTitle(/Travel Atlas/i);
    await expect(page.locator('#travel-sidebar')).toBeVisible();
    await waitForTravelMap(page);
    await expect(page.locator('#travel-results-summary')).toContainText('places across');
    await expect(page.locator('#country-chapters')).toHaveCount(0);

    const stops = page.locator('.travel-stop');
    await expect(stops.first()).toBeVisible({ timeout: 20_000 });
    const initialStopCount = await stops.count();
    expect(initialStopCount).toBeGreaterThan(50);

    const timelineHeight = await page
      .locator('#travel-timeline')
      .evaluate(node => node.scrollHeight);
    const isMobile = page.viewportSize() ? page.viewportSize().width <= 768 : false;
    expect(timelineHeight).toBeGreaterThan(isMobile ? 150 : 300);

    await page.locator('#spotlight-tour').click();
    await expect(page.locator('#spotlight-tour')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#place-search').fill('zzzz-no-match');
    await expect(page.locator('#spotlight-tour')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.travel-empty-state')).toBeVisible();

    await page.locator('[data-reset-travel]').click();
    await expect(page.locator('#place-search')).toHaveValue('');
    await expect(page.locator('.travel-stop')).toHaveCount(initialStopCount);

    await page.locator('#place-search').fill('Pune');
    await expect(page.locator('#travel-results-summary')).toContainText('"Pune"');
    await expect(page.locator('.travel-stop')).toHaveCount(2);
    await expect(page.locator('.travel-stop__name')).toHaveText(['Pune', 'Sinhagad Fort']);
  });

  test('skip links are keyboard reachable', async ({ page }) => {
    await gotoSiteReady(page);

    const skipLink = page.locator('.skip-link[href="#home"]').first();

    await expect(skipLink).toHaveAttribute('href', '#home');
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
  });

  test('accessibility toolbar is visible with core actions', async ({ page }) => {
    await gotoSiteReady(page);

    await page.waitForSelector('.a11y-toolbar', { state: 'attached' });
    const toolbar = page.locator('.a11y-toolbar');
    await expect(toolbar).toBeAttached();

    const buttons = toolbar.locator('button');
    await expect(buttons).toHaveCount(7);

    const labels = await buttons.evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('aria-label'))
    );
    expect(labels).toEqual([
      'Accessibility options',
      'Keyboard shortcuts',
      'Increase text size',
      'Decrease text size',
      'Toggle high contrast',
      'Toggle reduce motion',
      'Liquid Glass transparency',
    ]);

    // Accessibility toolbar controls must meet 44×44px touch targets when open.
    await page.locator('.a11y-toolbar__main').click();
    await expect(toolbar).toHaveClass(/is-open/);
    const sizes = await buttons.evaluateAll(nodes =>
      nodes.map(node => {
        const r = node.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      })
    );
    for (const size of sizes) {
      expect(size.w).toBeGreaterThanOrEqual(44);
      expect(size.h).toBeGreaterThanOrEqual(44);
    }

    // Share card entry point must remain present and unchanged by id
    await expect(page.locator('#website-share-toggle')).toHaveCount(1);
  });

  test('system monitor actions respond', async ({ page }) => {
    await gotoSite(page, '/monitor');

    await expect(page.locator('h1')).toHaveText(/System Monitor/i);
    await expect(page.locator('#runtime-snapshot-card')).toBeVisible();

    const statusEl = page.locator('#backend-status');
    await statusEl.waitFor({ state: 'visible', timeout: 10000 });
    await expect(statusEl).not.toHaveText(/Checking/i, { timeout: 15000 });

    await expect(page.locator('#health-checks .health-item').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('#status-distribution-chart .donut-chart')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('#platform-health-grid .health-item').first()).toBeVisible({
      timeout: 15000,
    });

    const beforeTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    await page.locator('.control-center-actions button').first().click();
    await page.locator('#event-filter').selectOption('warning');

    const refreshButton = page.locator('button', { hasText: 'Refresh Surfaces' });
    await expect(refreshButton).toBeVisible();

    const responsePromise = page
      .waitForResponse(response => response.url().includes('/api/'), { timeout: 10000 })
      .catch(() => null);
    await refreshButton.click();
    await responsePromise;

    const healthChecksPromise = page
      .waitForResponse(response => response.url().includes('/api/monitor/health'), {
        timeout: 10000,
      })
      .catch(() => null);
    await page.locator('#btn-run-health-checks').click();
    await healthChecksPromise;
    await expect(page.locator('#uptime-history-grid .availability-matrix')).toBeVisible({
      timeout: 10000,
    });

    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', beforeTheme || '');

    const afterTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(afterTheme).not.toBe(beforeTheme);
  });

  test('search overlay opens and closes', async ({ page }) => {
    await gotoSiteReady(page);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

    const openSearch = page.locator('#search-toggle');
    const closeSearch = page.locator('#search-close');
    const searchOverlay = page.locator('#search-overlay');
    const searchInput = page.locator('#search-input');

    await openSearch.waitFor({ state: 'visible' });
    await searchOverlay.waitFor({ state: 'attached' });
    await searchInput.waitFor({ state: 'attached' });

    await expect(searchOverlay).not.toHaveClass(/active/);

    const activateSearch = async () => {
      await openSearch.click();
      await expect(searchOverlay).toHaveClass(/active/, { timeout: 15_000 });
      await expect(searchInput).toBeFocused({ timeout: 10_000 });
    };

    // Search module/styles can lazy-load on first interaction — retry once if needed.
    try {
      await activateSearch();
    } catch {
      await page.waitForTimeout(800);
      await activateSearch();
    }

    await closeSearch.click();
    await expect(searchOverlay).not.toHaveClass(/active/);

    // Keyboard shortcut should also open the overlay after lazy-loading hooks are ready.
    await page.keyboard.press('Control+k');
    await expect(searchOverlay).toHaveClass(/active/, { timeout: 15_000 });
    await expect(searchInput).toBeFocused({ timeout: 10_000 });

    await page.keyboard.press('Escape');
    await expect(searchOverlay).not.toHaveClass(/active/);
  });

  test('contact nav route works', async ({ page }) => {
    await gotoSite(page);

    const isMobile = page.viewportSize() ? page.viewportSize().width <= 768 : false;
    if (isMobile) {
      await page.locator('#menu-btn').click();
      await page.locator('#overlay-menu').waitFor({ state: 'visible' });
      await page.locator('#overlay-menu a.menu-item[href="#contact"]').click();
    } else {
      await page.locator('a.nav-link[href="#contact"]').first().click();
    }

    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator('section#contact')).toBeVisible();
  });

  test('mobile overlay menu does not snap the page back near the top', async ({ page }) => {
    const isMobile = page.viewportSize() ? page.viewportSize().width <= 768 : false;
    if (!isMobile) {
      return;
    }

    await gotoSiteReady(page);

    await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      window.scrollTo(0, Math.max(0, scrollHeight - window.innerHeight - 1000));
    });
    await page.waitForFunction(() => window.scrollY > 500);

    const beforeY = await page.evaluate(() => window.scrollY);
    await page.locator('#menu-btn').click();
    await page.waitForSelector('body.menu-open');
    await page.locator('#overlay-menu').waitFor({ state: 'visible' });

    const openState = await page.evaluate(beforeScrollY => {
      return {
        beforeY: beforeScrollY,
        bodyClass: document.body.className,
        bodyTop: document.body.style.top,
        duringY: window.scrollY,
        overflow: getComputedStyle(document.body).overflow,
        touchAction: getComputedStyle(document.body).touchAction,
      };
    }, beforeY);

    expect(openState.bodyClass).toContain('menu-open');
    expect(openState.overflow).toBe('hidden');
    expect(openState.touchAction).toBe('none');
    expect(openState.beforeY).toBeGreaterThan(500);
    expect(Number.parseInt(openState.bodyTop, 10)).toBeLessThan(-500);

    // Prefer the locked offset (body top) — more reliable on WebKit than a pre-click sample
    const lockedY = Math.abs(Number.parseInt(openState.bodyTop, 10) || 0);
    expect(lockedY).toBeGreaterThan(500);

    await page.evaluate(() => {
      document.getElementById('close-menu-btn')?.click();
    });
    await page.waitForFunction(() => !document.body.classList.contains('menu-open'));
    // Wait for multi-frame scroll restore (WebKit re-applies over ~280ms)
    await page.waitForTimeout(400);
    await page.waitForFunction(minY => window.scrollY > minY, Math.max(400, lockedY - 400), {
      timeout: 5000,
    });

    const afterState = await page.evaluate(() => ({
      y: window.scrollY,
      top: document.body.style.top,
      bodyClass: document.body.className,
    }));

    expect(afterState.bodyClass).not.toContain('menu-open');
    expect(afterState.top).toBe('');
    expect(afterState.y).toBeGreaterThan(400);
    // Compare against the lock-time Y (bodyTop) — not a stale pre-click sample
    expect(Math.abs(afterState.y - lockedY)).toBeLessThan(500);
  });

  test('navbar fast clicks land on intended sections during lazy loading', async ({ page }) => {
    const targets = ['projects', 'education', 'contact'];
    const context = page.context();

    await Promise.all(
      targets.map(async sectionId => {
        const targetPage = await context.newPage();
        try {
          await gotoSite(targetPage);
          const isMobile = targetPage.viewportSize()
            ? targetPage.viewportSize().width <= 768
            : false;
          if (isMobile) {
            await targetPage.locator('#menu-btn').click();
            await targetPage.locator('#overlay-menu').waitFor({ state: 'visible' });
            await targetPage.locator(`#overlay-menu a.menu-item[href="#${sectionId}"]`).click();
          } else {
            await targetPage.locator(`a.nav-link[href="#${sectionId}"]`).first().click();
          }

          await expect(targetPage).toHaveURL(sectionUrlPatterns[sectionId]);
        } finally {
          await targetPage.close();
        }
      })
    );
  });

  test('all primary nav sections are reachable', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoSiteReady(page);

    const sectionStates = await page.evaluate(
      ids =>
        ids.map(id => {
          const node = document.querySelector(`section#${id}`);
          if (!node) return { id, exists: false, linkable: false };
          return {
            id,
            exists: true,
            linkable: node.id === id && node.tagName.toLowerCase() === 'section',
            height: node.getBoundingClientRect().height,
          };
        }),
      navSections
    );

    for (const state of sectionStates) {
      expect(state.exists, `${state.id} should exist`).toBe(true);
      expect(state.linkable, `${state.id} should be section-linkable`).toBe(true);
      expect(state.height, `${state.id} should have layout height`).toBeGreaterThan(0);
    }
  });

  test('critical section layouts remain consistent in light/dark themes', async ({ page }) => {
    await gotoSiteReady(page);

    for (const theme of ['light', 'dark']) {
      await page.evaluate(mode => {
        globalThis.document.documentElement.classList.toggle('dark', mode === 'dark');
        globalThis.localStorage.setItem('theme', mode);
      }, theme);
      await page.waitForFunction(mode => {
        return document.documentElement.classList.contains('dark') === (mode === 'dark');
      }, theme);

      await Promise.all(
        criticalLayoutChecks.map(async check => {
          const sectionNode = page.locator(check.selector);
          await expect(sectionNode, `${check.name} exists in ${theme}`).toBeAttached();
          const display = await sectionNode.evaluate(
            node => globalThis.getComputedStyle(node).display
          );
          expect(
            display,
            `${check.name} should render as ${check.expectedDisplay} in ${theme}`
          ).toBe(check.expectedDisplay);
        })
      );
    }
  });

  test('critical sections do not introduce horizontal overflow', async ({ page }) => {
    await gotoSiteReady(page);

    const overflowStates = await page.evaluate(
      checks =>
        checks.map(check => {
          const node = document.querySelector(check.selector);
          return {
            name: check.name,
            exists: Boolean(node),
            overflowPx: node ? node.scrollWidth - node.clientWidth : null,
          };
        }),
      criticalOverflowChecks
    );

    for (const state of overflowStates) {
      expect(state.exists, `${state.name} exists`).toBe(true);
      expect(state.overflowPx, `${state.name} overflow should be measurable`).not.toBeNull();
      expect(state.overflowPx, `${state.name} overflow should be <= 2px`).toBeLessThanOrEqual(2);
    }
  });

  test('contact page removes portfolio reach and keeps currently media deduplicated', async ({
    page,
  }) => {
    await gotoSite(page, '/#contact');
    await waitForCurrentlyReady(page);

    await expect(page.locator('.contact-label', { hasText: 'Portfolio Reach' })).toHaveCount(0);

    const showsTab = page.locator('.currently-tab[data-tab="shows"]');
    const booksTab = page.locator('.currently-tab[data-tab="books"]');

    await showsTab.click();
    await expect(page.locator('#shows-content')).toHaveClass(/active/);

    const showTitles = await page.locator('#shows-grid .media-card h4').allTextContents();
    expect(new Set(showTitles).size, 'show and movie cards should be unique').toBe(
      showTitles.length
    );

    const showPosterSources = await page
      .locator('#shows-grid .media-card .media-poster img')
      .evaluateAll(nodes => nodes.map(node => node.getAttribute('src') || ''));
    expect(
      showPosterSources.every(
        src => src.includes('assets/images/currently/') && /\.(jpg|webp)$/.test(src)
      ),
      'show and movie cards should use local raster poster assets'
    ).toBe(true);

    await booksTab.scrollIntoViewIfNeeded();
    await booksTab.click();
    await expect(page.locator('#books-content')).toHaveClass(/active/);

    const bookTitles = await page.locator('#books-grid .media-card h4').allTextContents();
    expect(new Set(bookTitles).size, 'book cards should be unique').toBe(bookTitles.length);

    const bookCoverSources = await page
      .locator('#books-grid .media-card .media-poster img')
      .evaluateAll(nodes => nodes.map(node => node.getAttribute('src') || ''));
    expect(
      bookCoverSources.every(
        src => src.includes('assets/images/currently/') && /\.(jpg|webp)$/.test(src)
      ),
      'book cards should use local raster cover assets'
    ).toBe(true);
  });

  test('music tab renders featured listening state with high-quality artwork', async ({ page }) => {
    await gotoSite(page, '/#contact');
    await waitForCurrentlyReady(page);
    const musicTab = page.locator('.currently-tab[data-tab="music"]');
    await musicTab.scrollIntoViewIfNeeded();
    await musicTab.click();
    await expect(page.locator('#music-content')).toHaveClass(/active/);

    await page.waitForFunction(
      () => {
        const loading = document.getElementById('music-loading');
        const empty = document.getElementById('music-empty');
        const recentCount = document.querySelectorAll(
          '#recent-tracks-container .recent-track-card'
        ).length;

        return (
          loading &&
          getComputedStyle(loading).display === 'none' &&
          (recentCount > 0 || (empty && getComputedStyle(empty).display !== 'none'))
        );
      },
      { timeout: 20000 }
    );

    const musicState = await page.evaluate(() => ({
      featuredDisplay: getComputedStyle(document.getElementById('now-playing-card')).display,
      emptyDisplay: getComputedStyle(document.getElementById('music-empty')).display,
      firstShelfArtwork:
        document
          .querySelector('#recent-tracks-container .recent-track-card img')
          ?.getAttribute('src') || '',
      firstShelfArtist:
        document
          .querySelector('#recent-tracks-container .recent-track-card .media-info p')
          ?.textContent?.trim() || '',
      recentArtwork:
        document
          .querySelector('#recent-tracks-container .recent-track-card img')
          ?.getAttribute('src') || '',
      recentCount: document.querySelectorAll('#recent-tracks-container .recent-track-card').length,
    }));

    // If empty state is shown (no API configured), skip detailed checks
    if (musicState.emptyDisplay !== 'none') {
      expect(musicState.featuredDisplay).toBe('none');
      return;
    }

    // Music shelf now renders as one uniform row rather than a distinct featured panel.
    expect(musicState.featuredDisplay).toBe('none');
    expect(musicState.firstShelfArtist.length).toBeGreaterThan(0);
    expect(musicState.recentCount).toBeGreaterThan(0);
    expect(
      musicState.firstShelfArtwork.includes('/300x300/') ||
        musicState.firstShelfArtwork.includes('/600x600bb.') ||
        musicState.firstShelfArtwork.startsWith('data:image/')
    ).toBe(true);
    expect(
      musicState.recentArtwork.includes('/300x300/') ||
        musicState.recentArtwork.includes('/600x600bb.') ||
        musicState.recentArtwork.startsWith('data:image/')
    ).toBe(true);
    expect(musicState.recentArtwork.includes('/64s/')).toBe(false);
    expect(musicState.recentArtwork.includes('/34s/')).toBe(false);
  });
});
