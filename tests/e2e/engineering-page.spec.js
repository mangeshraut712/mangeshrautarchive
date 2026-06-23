import { expect, test } from '@playwright/test';

const pathPrefix = process.env.TEST_TARGET === 'github' ? '/mangeshrautarchive' : '';
const gotoPage = (page, path) =>
  page.goto(`${pathPrefix}${path}`, { waitUntil: 'domcontentloaded' });

const sectionIds = [
  'overview',
  'evidence',
  'production-metrics',
  'architecture',
  'systems',
  'case-studies',
  'open-source',
  'timeline',
];

async function waitForSystemsReady(page) {
  await gotoPage(page, '/systems.html');
  await page.waitForSelector('#systems-evidence-grid .eng-showcase-card', { timeout: 30_000 });
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(2);
}

test.describe('Engineering evidence dashboard', () => {
  test('desktop renders evidence dashboard sections', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForSystemsReady(page);

    await expect(page).toHaveTitle(/Engineering Evidence/i);
    await expect(page.locator('h1')).toContainText(/AI-native products/i);

    for (const id of sectionIds) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }

    await expect(page.locator('#systems-metrics-grid .systems-metric-panel')).toHaveCount(4);
    await expect(page.locator('#systems-case-flows .systems-case-flow').first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('case study links resolve after build', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const res = await page.goto(`${pathPrefix}/case-studies/portfolio.html`, {
      waitUntil: 'domcontentloaded',
    });
    expect(res?.status()).toBeLessThan(400);
  });

  test('uses page renders stack sections', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page, '/uses.html');
    await page.waitForSelector('#uses-grid .uses-section', { timeout: 15_000 });
    await expect(page.locator('#uses-grid .uses-section')).toHaveCount(8);
  });
});
