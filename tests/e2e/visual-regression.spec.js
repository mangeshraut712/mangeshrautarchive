import { expect, test } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

const VISUAL_TESTING = process.env.VISUAL_TESTING === '1';
const VIEWPORT = { height: 900, width: 1440 };
const VISUAL_PAGES = [
  { name: 'home', path: '/' },
  { name: 'systems', path: '/systems' },
  { name: 'monitor', path: '/monitor' },
  { name: 'travel', path: '/travel' },
  { name: 'uses', path: '/uses' },
  { name: '404', path: '/404.html' },
  { name: 'offline', path: '/offline.html' },
];
const DYNAMIC_SELECTORS = [
  '#portfolio-reach',
  '#projects-activity-overview',
  '#health-sync-text',
  '#currently-section',
  '#telemetry-refreshed',
  '#systems-telemetry-bento',
  '#monitor-summary-section',
  '#runtime-snapshot-card',
  '#portfolio-surfaces-grid',
  '#backend-system-dashboard',
  '#realtime-metrics-section',
  '#health-checks',
  '#metrics-table-body',
  '#external-apis',
  '#platform-health-summary',
  '#platform-health-grid',
  '#oauth-integrations',
  '#deployment-surfaces',
  '#event-list',
  '#client-probes',
  '#security-threats-log',
  '#rate-limits-container',
  '#ai-metrics',
  '#map-container canvas',
];

test.describe('whole-site visual regression', () => {
  test.skip(!VISUAL_TESTING, 'Set VISUAL_TESTING=1 to run screenshot comparisons.');
  test.use({
    colorScheme: 'light',
    deviceScaleFactor: 1,
    locale: 'en-US',
    reducedMotion: 'reduce',
    timezoneId: 'America/New_York',
    viewport: VIEWPORT,
  });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop Chrome',
      'The initial visual baseline is scoped to Desktop Chrome.'
    );
    await page.addInitScript(() => {
      localStorage.setItem('a11y-reduce-motion', '1');
    });
  });

  for (const { name, path } of VISUAL_PAGES) {
    for (const theme of ['light', 'dark']) {
      test(`${name} remains stable in ${theme} mode`, async ({ page }) => {
        await page.emulateMedia({
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        await page.addInitScript(selectedTheme => {
          localStorage.setItem('themeMode', selectedTheme);
          localStorage.setItem('theme', selectedTheme);
        }, theme);

        await gotoSite(page, path);
        await page.locator('main').first().waitFor({ state: 'attached', timeout: 15_000 });
        await page.waitForLoadState('load');
        await page.evaluate(selectedTheme => {
          document.documentElement.setAttribute('data-theme', selectedTheme);
          document.documentElement.classList.toggle('dark', selectedTheme === 'dark');
        }, theme);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await page.addStyleTag({
          content: `
            *,
            *::before,
            *::after {
              animation-delay: 0s !important;
              animation-duration: 0s !important;
              caret-color: transparent !important;
              scroll-behavior: auto !important;
              transition: none !important;
            }
          `,
        });

        const masks = DYNAMIC_SELECTORS.map(selector => page.locator(selector));
        await expect(page).toHaveScreenshot(`${name}-${theme}.png`, {
          animations: 'disabled',
          caret: 'hide',
          mask: masks,
          maskColor: '#1d1d1f',
        });
      });
    }
  }
});
