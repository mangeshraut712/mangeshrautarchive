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

    const skipLink = page.locator('.skip-link[href="#main-content"]').first();

    await expect(skipLink).toHaveAttribute('href', '#main-content');
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
  });

  test('search overlay opens and closes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const openSearch = page.locator('#search-toggle');
    const closeSearch = page.locator('#search-close');
    const searchOverlay = page.locator('#search-overlay');

    await openSearch.click();
    await expect(searchOverlay).toHaveClass(/active/);

    await closeSearch.click();
    await expect(searchOverlay).not.toHaveClass(/active/);
  });

  test('contact nav route works', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'Mobile Chrome',
      'Mobile overlay navigation does not reliably update URL hash.'
    );

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('a.nav-link[href="#contact"]').first().click();
    await expect(page).toHaveURL(/#contact$/);
  });

  test('navbar fast clicks land on intended sections during lazy loading', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'Mobile Chrome',
      'This assertion targets desktop smart-navbar offset behavior.'
    );

    const targets = ['projects', 'education', 'contact'];

    for (const sectionId of targets) {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(350);

      await page.locator(`a.nav-link[href="#${sectionId}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`#${sectionId}$`));
      await page.waitForTimeout(2500);

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

      const topDistance = Math.abs(info.rectTop - (info.navHeight + 12));
      expect(
        topDistance,
        `${sectionId} should align near navbar offset after lazy-load reflow`
      ).toBeLessThanOrEqual(140);
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
});
