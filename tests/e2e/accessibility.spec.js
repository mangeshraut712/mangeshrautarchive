import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES, gotoSite } from './helpers/site.js';

const MAIN_PAGES = [
  { path: PAGES.home, name: 'homepage' },
  { path: PAGES.systems, name: 'systems' },
  { path: PAGES.travel, name: 'travel' },
  { path: PAGES.monitor, name: 'monitor' },
  { path: PAGES.uses, name: 'uses' },
];

const ERROR_PAGES = [
  { path: '/404.html', name: '404' },
  { path: '/offline.html', name: 'offline' },
];

// Keep the gate green around known homepage debt while still failing every new
// critical/serious rule + selector pair. Remove entries as the underlying UI is fixed.
const HOMEPAGE_DEBT = {
  common: [
    {
      id: 'aria-required-children',
      target: '.skill-scroll-wrapper[role="list"]',
    },
  ],
  dark: [
    { id: 'color-contrast', target: '.section-subtitle' },
    { id: 'color-contrast', target: '.skills-section-subtitle' },
    { id: 'color-contrast', target: '.engineering-open-btn' },
  ],
  light: [{ id: 'color-contrast', target: 'button[aria-label="View ' }],
  mobile: [
    { id: 'color-contrast', target: 'button[aria-label="View ' },
    { id: 'scrollable-region-focusable', target: '.github-graph-scroll' },
  ],
};

async function configureAccessibilityMode(page, { highContrast = false, theme = 'light' } = {}) {
  await page.emulateMedia({
    colorScheme: theme,
    reducedMotion: 'reduce',
  });
  await page.addInitScript(
    settings => {
      localStorage.setItem('themeMode', settings.theme);
      localStorage.setItem('theme', settings.theme);
      localStorage.setItem('a11y-high-contrast', settings.highContrast ? '1' : '0');
      localStorage.setItem('a11y-reduce-motion', '1');
    },
    { highContrast, theme }
  );
}

async function waitForAccessiblePage(page, path) {
  await gotoSite(page, path);
  await page.locator('main').first().waitFor({ state: 'attached', timeout: 15_000 });
  await page.waitForLoadState('load');

  if (path === PAGES.home) {
    // skills-visualization.js loads lazily when #skills enters the viewport.
    await page.locator('#skills, #skills-container').first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.getElementById('skills-loading'), {
      timeout: 20_000,
    });
  }
}

function knownHomepageDebt(mode) {
  return [...HOMEPAGE_DEBT.common, ...(HOMEPAGE_DEBT[mode] || [])];
}

async function expectNoBlockingViolations(page, knownDebt = []) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const blockingViolations = results.violations.flatMap(violation => {
    if (violation.impact !== 'critical' && violation.impact !== 'serious') {
      return [];
    }

    const nodes = violation.nodes.filter(node => {
      const target = node.target.join(' ');
      return !knownDebt.some(debt => debt.id === violation.id && target.includes(debt.target));
    });

    return nodes.length > 0 ? [{ ...violation, nodes }] : [];
  });

  expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
}

test.describe('Chrome accessibility baseline', () => {
  for (const { path, name } of [...MAIN_PAGES, ...ERROR_PAGES]) {
    test(`${name} has no critical/serious axe violations in light mode`, async ({ page }) => {
      await configureAccessibilityMode(page);
      await waitForAccessiblePage(page, path);
      await expectNoBlockingViolations(page, path === PAGES.home ? knownHomepageDebt('light') : []);
    });
  }

  for (const { path, name } of MAIN_PAGES) {
    test(`${name} has no critical/serious axe violations in dark mode`, async ({ page }) => {
      await configureAccessibilityMode(page, { theme: 'dark' });
      await waitForAccessiblePage(page, path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await expectNoBlockingViolations(page, path === PAGES.home ? knownHomepageDebt('dark') : []);
    });
  }

  test('homepage has no critical/serious axe violations in high contrast', async ({ page }) => {
    await configureAccessibilityMode(page, { highContrast: true });
    await waitForAccessiblePage(page, PAGES.home);
    await expect(page.locator('html')).toHaveClass(/high-contrast/);
    await expectNoBlockingViolations(page, knownHomepageDebt('light'));
  });

  test.describe('mobile viewport', () => {
    test.use({
      isMobile: true,
      viewport: { height: 844, width: 390 },
    });

    test('homepage has no critical/serious axe violations on mobile', async ({ page }) => {
      await configureAccessibilityMode(page);
      await waitForAccessiblePage(page, PAGES.home);
      await expectNoBlockingViolations(page, knownHomepageDebt('mobile'));
    });
  });
});
