import { expect, test } from '@playwright/test';

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
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Mangesh Raut/i);
    await expect(page.locator('#global-nav')).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('section#home')).toBeVisible();
    await expect(page.locator('section#contact')).toBeAttached();
  });

  test('skip links are keyboard reachable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const skipLink = page.locator('.skip-link[href="#home"]').first();

    await expect(skipLink).toHaveAttribute('href', '#home');
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
  });

  test('accessibility toolbar is visible with three actions', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('.a11y-toolbar', { state: 'visible' });
    const toolbar = page.locator('.a11y-toolbar');
    await expect(toolbar).toBeVisible();

    const buttons = toolbar.locator('button');
    await expect(buttons).toHaveCount(3);

    const labels = await buttons.evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('aria-label'))
    );
    expect(labels).toEqual(['Keyboard shortcuts', 'Increase text size', 'Decrease text size']);
  });

  test('system monitor actions respond', async ({ page }) => {
    await page.goto('/monitor.html', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toHaveText(/System Monitor/i);
    await expect(page.locator('#runtime-snapshot-card')).toBeVisible();

    await page.waitForFunction(() => {
      const el = document.getElementById('backend-status');
      return Boolean(el && el.textContent && el.textContent.trim() !== 'Checking...');
    });

    const beforeTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    await page.locator('.monitor-header .header-actions .btn').first().click();
    await page.waitForTimeout(500);

    await page.locator('#event-filter').selectOption('warning');
    await page.waitForTimeout(300);

    await page.locator('button', { hasText: 'Refresh Providers' }).click();
    await expect(page.locator('#deployment-surfaces .health-item').first()).toBeVisible();
    const toastCount = await page.locator('#toast-container .toast').count();
    expect(toastCount).toBeGreaterThan(0);

    await expect(page.locator('#monitor-docs-grid .doc-card').first()).toBeVisible();

    await page.locator('#theme-toggle').click();
    await page.waitForTimeout(200);

    const afterTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(afterTheme).not.toBe(beforeTheme);
  });

  test('search overlay opens and closes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const openSearch = page.locator('#search-toggle');
    const closeSearch = page.locator('#search-close');
    const searchOverlay = page.locator('#search-overlay');
    const searchInput = page.locator('#search-input');

    await expect(searchOverlay).not.toHaveClass(/active/);
    await openSearch.click();
    await expect(searchOverlay).toHaveClass(/active/);
    await expect(searchInput).toBeFocused();

    await closeSearch.click();
    await expect(searchOverlay).not.toHaveClass(/active/);

    // Keyboard shortcut should also open the overlay after lazy-loading hooks are ready.
    await page.keyboard.press('Control+k');
    await expect(searchOverlay).toHaveClass(/active/);
    await expect(searchInput).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(searchOverlay).not.toHaveClass(/active/);
  });

  test('contact nav route works', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    if (testInfo.project.name === 'Mobile Chrome') {
      await page.locator('#menu-btn').click();
      await page.waitForTimeout(250);
      await page.locator('#overlay-menu a.menu-item[href="#contact"]').click();
      await page.waitForTimeout(3200);
    } else {
      await page.locator('a.nav-link[href="#contact"]').first().click();
    }

    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator('section#contact')).toBeVisible();
  });

  test('mobile overlay menu does not snap the page back near the top', async ({
    page,
  }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    if (testInfo.project.name !== 'Mobile Chrome') {
      return;
    }

    await page.evaluate(() => {
      const contact = document.getElementById('contact');
      if (contact) {
        window.scrollTo(0, Math.max(0, contact.offsetTop - 120));
      }
    });
    await page.waitForTimeout(300);

    const openState = await page.evaluate(() => {
      const beforeY = window.scrollY;
      document.getElementById('menu-btn')?.click();
      return {
        beforeY,
        bodyClass: document.body.className,
        duringY: window.scrollY,
        overflow: getComputedStyle(document.body).overflow,
        touchAction: getComputedStyle(document.body).touchAction,
      };
    });
    await page.waitForTimeout(250);

    expect(openState.bodyClass).toContain('menu-open');
    expect(openState.overflow).toBe('hidden');
    expect(openState.touchAction).toBe('none');
    expect(Math.abs(openState.duringY - openState.beforeY)).toBeLessThanOrEqual(4);

    await page.evaluate(() => {
      document.getElementById('close-menu-btn')?.click();
    });
    await page.waitForTimeout(300);

    const afterState = await page.evaluate(() => ({
      y: window.scrollY,
      top: document.body.style.top,
      bodyClass: document.body.className,
    }));
    const contactViewport = await page.evaluate(() => {
      const contact = document.getElementById('contact');
      if (!contact) return null;
      const rect = contact.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        viewportHeight: window.innerHeight,
      };
    });

    expect(afterState.bodyClass).not.toContain('menu-open');
    expect(afterState.top).toBe('');
    expect(contactViewport).not.toBeNull();
    expect(contactViewport.bottom).toBeGreaterThan(120);
    expect(contactViewport.top).toBeLessThan(contactViewport.viewportHeight - 120);
  });

  test('navbar fast clicks land on intended sections during lazy loading', async ({
    page,
  }, testInfo) => {
    const targets = ['projects', 'education', 'contact'];

    for (const sectionId of targets) {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(testInfo.project.name === 'Mobile Chrome' ? 250 : 350);

      if (testInfo.project.name === 'Mobile Chrome') {
        await page.locator('#menu-btn').click();
        await page.waitForTimeout(250);
        await page.locator(`#overlay-menu a.menu-item[href="#${sectionId}"]`).click();
      } else {
        await page.locator(`a.nav-link[href="#${sectionId}"]`).first().click();
      }

      await expect(page).toHaveURL(new RegExp(`#${sectionId}$`));
      await page.waitForFunction(
        ({ id, allowedDelta }) => {
          const navHeight = globalThis.document.querySelector('.global-nav')?.offsetHeight || 0;
          const section = globalThis.document.getElementById(id);
          if (!section) return false;

          const expectedOffset = navHeight + 12;
          const rectTop = section.getBoundingClientRect().top;
          return Math.abs(rectTop - expectedOffset) <= allowedDelta;
        },
        {
          id: sectionId,
          allowedDelta: testInfo.project.name === 'Mobile Chrome' ? 120 : 140,
        },
        {
          timeout: testInfo.project.name === 'Mobile Chrome' ? 6000 : 4000,
        }
      );

      const info = await page.evaluate(id => {
        const navHeight = globalThis.document.querySelector('.global-nav')?.offsetHeight || 0;
        const section = globalThis.document.getElementById(id);
        if (!section) {
          return { missing: true };
        }

        const rectTop = section.getBoundingClientRect().top;
        return {
          rectTop,
          navHeight,
        };
      }, sectionId);

      expect(info?.missing, `${sectionId} section should exist`).not.toBe(true);

      const expectedOffset =
        testInfo.project.name === 'Mobile Chrome' ? info.navHeight + 12 : info.navHeight + 12;
      const allowedDelta = testInfo.project.name === 'Mobile Chrome' ? 120 : 3000;
      const topDistance = Math.abs(info.rectTop - expectedOffset);
      expect(
        topDistance,
        `${sectionId} should align near navbar offset after lazy-load reflow`
      ).toBeLessThanOrEqual(allowedDelta);
    }
  });

  test('all primary nav sections are reachable', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/', { waitUntil: 'networkidle' });

    for (const sectionId of navSections) {
      const section = page.locator(`section#${sectionId}`);
      await expect(section, `${sectionId} should exist`).toBeAttached();
      await section.scrollIntoViewIfNeeded();
      await expect(section, `${sectionId} should be visible`).toBeVisible();
    }
  });

  test('critical section layouts remain consistent in light/dark themes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    for (const theme of ['light', 'dark']) {
      await page.evaluate(mode => {
        globalThis.document.documentElement.classList.toggle('dark', mode === 'dark');
        globalThis.localStorage.setItem('theme', mode);
      }, theme);
      await page.waitForTimeout(200);

      for (const check of criticalLayoutChecks) {
        const sectionNode = page.locator(check.selector);
        await expect(sectionNode, `${check.name} exists in ${theme}`).toBeAttached();
        const display = await sectionNode.evaluate(
          node => globalThis.getComputedStyle(node).display
        );
        expect(display, `${check.name} should render as ${check.expectedDisplay} in ${theme}`).toBe(
          check.expectedDisplay
        );
      }
    }
  });

  test('critical sections do not introduce horizontal overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    for (const check of criticalOverflowChecks) {
      const sectionNode = page.locator(check.selector);
      await expect(sectionNode, `${check.name} exists`).toBeAttached();
      await sectionNode.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);

      const overflowPx = await sectionNode.evaluate(node => node.scrollWidth - node.clientWidth);
      expect(overflowPx, `${check.name} overflow should be <= 2px`).toBeLessThanOrEqual(2);
    }
  });

  test('contact page removes portfolio reach and keeps currently media deduplicated', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const currentSection = page.locator('#currently-section');
    await currentSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    await expect(page.locator('.contact-label', { hasText: 'Portfolio Reach' })).toHaveCount(0);

    const showsTab = page.locator('.currently-tab[data-tab="shows"]');
    const booksTab = page.locator('.currently-tab[data-tab="books"]');

    await showsTab.click();
    await page.waitForTimeout(400);
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
        src => src.includes('assets/images/currently/') && src.endsWith('.jpg')
      ),
      'show and movie cards should use local raster poster assets'
    ).toBe(true);

    await booksTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator('#books-content')).toHaveClass(/active/);

    const bookTitles = await page.locator('#books-grid .media-card h4').allTextContents();
    expect(new Set(bookTitles).size, 'book cards should be unique').toBe(bookTitles.length);

    const bookCoverSources = await page
      .locator('#books-grid .media-card .media-poster img')
      .evaluateAll(nodes => nodes.map(node => node.getAttribute('src') || ''));
    expect(
      bookCoverSources.every(
        src => src.includes('assets/images/currently/') && src.endsWith('.jpg')
      ),
      'book cards should use local raster cover assets'
    ).toBe(true);
  });

  test('music tab renders featured listening state with high-quality artwork', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const currentSection = page.locator('#currently-section');
    await currentSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    await page.locator('.currently-tab[data-tab="music"]').click();
    await expect(page.locator('#music-content')).toHaveClass(/active/);

    await page.waitForFunction(
      () => {
        const loading = document.getElementById('music-loading');
        const featured = document.getElementById('now-playing-card');
        const empty = document.getElementById('music-empty');
        const _recentCount = document.querySelectorAll(
          '#recent-tracks-container .recent-track-card'
        ).length;

        return (
          loading &&
          getComputedStyle(loading).display === 'none' &&
          ((featured && getComputedStyle(featured).display !== 'none') ||
            (empty && getComputedStyle(empty).display !== 'none'))
        );
      },
      { timeout: 15000 }
    );

    const musicState = await page.evaluate(() => ({
      featuredDisplay: getComputedStyle(document.getElementById('now-playing-card')).display,
      emptyDisplay: getComputedStyle(document.getElementById('music-empty')).display,
      featuredArtwork: document.getElementById('now-playing-img')?.getAttribute('src') || '',
      featuredArtist: document.getElementById('now-playing-artist')?.textContent?.trim() || '',
      featuredDescription:
        document.getElementById('now-playing-description')?.textContent?.trim() || '',
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

    // If featured content is loaded, check quality
    expect(musicState.featuredDisplay).not.toBe('none');
    expect(musicState.featuredArtist.length).toBeGreaterThan(0);
    expect(musicState.recentCount).toBeGreaterThan(0);
    expect(
      musicState.featuredArtwork.includes('/300x300/') ||
        musicState.featuredArtwork.includes('/600x600bb.') ||
        musicState.featuredArtwork.startsWith('data:image/')
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
