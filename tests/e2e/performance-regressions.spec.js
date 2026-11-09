import { expect, test } from '@playwright/test';
import { gotoSite, sitePath } from './helpers/site.js';

test('long hero roles keep the same height on narrow phones', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await gotoSite(page, '/');
  await page.waitForLoadState('load');
  const heights = await page.evaluate(() => {
    const role = document.querySelector('#hero-role-word');
    const container = document.querySelector('.hero-role-flip');
    role.textContent = 'AI Builder';
    const short = container.getBoundingClientRect().height;
    role.textContent = 'Research-Driven Problem Solver';
    role.classList.add('is-long');
    const roleBox = role.getBoundingClientRect();
    return {
      short,
      long: container.getBoundingClientRect().height,
      roleFits: roleBox.left >= 0 && roleBox.right <= innerWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(Math.abs(heights.short - heights.long)).toBeLessThan(2);
  expect(heights.roleFits).toBe(true);
  expect(heights.overflow).toBe(false);
});

test('assistant is loaded on demand and remains usable', async ({ page }) => {
  const assistantRequests = [];
  page.on('request', request => {
    if (/\/js\/modules\/chatbot\.js(?:\?|$)/.test(request.url()))
      assistantRequests.push(request.url());
  });
  await gotoSite(page, '/');
  await page.waitForLoadState('load');
  await page.waitForTimeout(2500);
  expect(assistantRequests).toHaveLength(0);
  await page.locator('#chatbot-toggle').click();
  await expect(page.locator('#chatbot-widget')).toBeVisible();
  expect(assistantRequests.length).toBeGreaterThan(0);
});

test('systems hero keeps its original text node during initialization', async ({ page }) => {
  let releaseModule;
  const holdModule = new Promise(resolve => {
    releaseModule = resolve;
  });
  await page.route('**/js/modules/systems-page.js*', async route => {
    await holdModule;
    await route.continue();
  });
  await gotoSite(page, '/systems.html', { waitUntil: 'commit' });
  await page.locator('#systems-hero-lead').waitFor({ state: 'attached' });
  await page.evaluate(() => {
    window.__initialSystemsLead = document.querySelector('#systems-hero-lead').firstChild;
  });
  releaseModule();
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
  expect(
    await page.evaluate(
      () => document.querySelector('#systems-hero-lead').firstChild === window.__initialSystemsLead
    )
  ).toBe(true);
});

test('the GitHub Pages monitor reserves its status shell before its module loads', async ({
  page,
  baseURL,
}) => {
  if (new URL(baseURL).hostname !== 'mangeshraut712.github.io') {
    await page.route('https://mangeshraut712.github.io/**', async route => {
      const requestPath = new URL(route.request().url()).pathname.replace(
        /^\/mangeshrautarchive/,
        ''
      );
      const response = await route.fetch({ url: new URL(requestPath || '/', baseURL).href });
      await route.fulfill({ response });
    });
  }
  let releaseModule;
  const holdModule = new Promise(resolve => {
    releaseModule = resolve;
  });
  await page.route('**/js/modules/monitor-page.js*', async route => {
    await holdModule;
    await route.fallback();
  });
  try {
    await page.goto('https://mangeshraut712.github.io/mangeshrautarchive/monitor.html', {
      waitUntil: 'commit',
    });
    await page.locator('#public-status').waitFor({ state: 'attached' });
    await expect(page.locator('#public-status-title')).toBeVisible({ timeout: 5000 });
  } finally {
    releaseModule();
  }
  await page.waitForLoadState('load');
});

test('monitor status and navigation do not shift the first viewport during load', async ({
  page,
}) => {
  await page.setViewportSize({ width: 412, height: 823 });
  await page.addInitScript(() => {
    window.__monitorShifts = [];
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__monitorShifts.push(entry.value);
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await gotoSite(page, '/monitor.html');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1500);
  const shift = await page.evaluate(() =>
    window.__monitorShifts.reduce((sum, value) => sum + value, 0)
  );
  expect(shift).toBeLessThan(0.1);
});

test('below-fold styles wait for interest and load when their section is visited', async ({
  page,
}) => {
  const experienceRequests = [];
  page.on('request', request => {
    if (/\/assets\/css\/experience\.css(?:\?|$)/.test(request.url()))
      experienceRequests.push(request.url());
  });
  await gotoSite(page, '/');
  await page.waitForLoadState('load');
  await page.waitForTimeout(2500);
  expect(experienceRequests).toHaveLength(0);
  await page.locator('#experience').scrollIntoViewIfNeeded();
  await expect.poll(() => experienceRequests.length).toBeGreaterThan(0);
  await expect(page.locator('#experience')).toBeVisible();
});

test('built changelog metadata avoids shifting the first viewport', async ({ page }) => {
  const source = await page.request.get(sitePath('/changelog.html'));
  test.skip(
    !(await source.text()).includes('>Updated '),
    'The production build injects the initial changelog metadata.'
  );
  await page.setViewportSize({ width: 412, height: 823 });
  await page.addInitScript(() => {
    window.__changelogShifts = [];
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__changelogShifts.push(entry.value);
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await gotoSite(page, '/changelog.html');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
  const shift = await page.evaluate(() =>
    window.__changelogShifts.reduce((sum, value) => sum + value, 0)
  );
  expect(shift).toBeLessThan(0.1);
});

test('a desktop-sized viewport does not silently enable audit mode', async ({ page }) => {
  await page.setViewportSize({ width: 1350, height: 940 });
  await gotoSite(page, '/');
  await page.waitForLoadState('load');
  expect(await page.evaluate(() => window.__PERF_AUDIT__ === true)).toBe(false);
  await expect(page.locator('#music-card')).toBeVisible();
});

test('explicit audit mode remains available for the existing CI gate', async ({ page }) => {
  await gotoSite(page, '/?perf-audit=1');
  await page.waitForLoadState('load');
  expect(await page.evaluate(() => window.__PERF_AUDIT__ === true)).toBe(true);
});

test('systems paints its hero before initializing below-fold details', async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        requestAnimationFrame(() => {
          const hero = document.querySelector('#systems-hero-lead');
          const details = document.querySelector('#systems-arch-decisions');
          window.__systemsFirstFrame = {
            hero: Boolean(hero?.textContent.trim()),
            details: details?.childElementCount,
          };
        });
      },
      { once: true }
    );
  });
  await gotoSite(page, '/systems.html');
  await page.waitForLoadState('load');
  await expect
    .poll(() => page.evaluate(() => window.__systemsFirstFrame))
    .toEqual({ hero: true, details: 0 });
  await expect(page.locator('#systems-arch-decisions > *').first()).toBeAttached();
});
