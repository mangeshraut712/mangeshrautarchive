import { expect, test } from '@playwright/test';
import { PAGES, gotoSite, pathPrefix } from './helpers/site.js';

const sectionIds = [
  'overview',
  'production',
  'architecture',
  'projects',
  'experiments',
  'open-source',
  'writing',
  'timeline',
  'tokenization',
];

async function waitForSystemsReady(page) {
  await gotoSite(page, PAGES.systems);
  await page.waitForSelector('#systems-overview-grid .eng-showcase-card', { timeout: 30_000 });
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

    await expect(page).toHaveTitle(/Systems/i);
    await expect(page.locator('h1')).toContainText(/build, ship, think/i);

    for (const id of sectionIds) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }

    await expect(page.locator('#systems-metrics-grid .systems-metric-panel')).toHaveCount(4);
    await expect(page.locator('#systems-case-flows .systems-case-flow').first()).toBeVisible();
    await expect(page.locator('#systems-token-grid .systems-token-row')).toHaveCount(12);
    await assertNoHorizontalOverflow(page);
  });

  test('case study links resolve after build', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const res = await page.goto(`${pathPrefix}/case-studies/portfolio.html`, {
      waitUntil: 'domcontentloaded',
    });
    expect(res?.status()).toBeLessThan(400);
  });

  test('mobile engineering page has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForSystemsReady(page);
    await expect(page.locator('#systems-token-grid .systems-token-row')).toHaveCount(12);
    await assertNoHorizontalOverflow(page);

    const shellBox = await page.locator('.systems-shell').boundingBox();
    const viewport = page.viewportSize();
    if (shellBox && viewport) {
      const leftGap = shellBox.x;
      const rightGap = viewport.width - (shellBox.x + shellBox.width);
      expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(4);
    }
  });

  test('quality budgets bento tiles are full width on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForSystemsReady(page);
    await page.waitForSelector('#systems-telemetry-bento .systems-bento-tile', { timeout: 30_000 });

    const tileWidths = await page
      .locator('#systems-telemetry-bento .systems-bento-tile')
      .evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));

    expect(tileWidths).toHaveLength(4);
    tileWidths.forEach(width => {
      expect(width).toBeGreaterThan(280);
    });
  });

  test('quality budgets cards render on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForSystemsReady(page);
    await page.waitForSelector('#systems-telemetry-bento .systems-bento-tile', { timeout: 30_000 });

    const bentoWidths = await page
      .locator('#systems-telemetry-bento .systems-bento-tile')
      .evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));

    expect(bentoWidths).toHaveLength(4);
    bentoWidths.forEach(width => {
      expect(width).toBeGreaterThan(180);
    });

    const metricWidths = await page
      .locator('#systems-metrics-grid .systems-metric-panel')
      .evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));

    expect(metricWidths).toHaveLength(4);
    metricWidths.forEach(width => {
      expect(width).toBeGreaterThan(200);
    });
  });

  test('uses page renders stack sections', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoSite(page, PAGES.uses);
    await page.waitForSelector('#uses-grid .uses-section', { timeout: 15_000 });
    await expect(page.locator('#uses-grid .uses-section')).toHaveCount(8);
    await expect(page.locator('.systems-footer-links a[href="systems.html"]')).toBeVisible();
  });

  test('case study flows expose Repo/Demo/Architecture/Story evidence links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForSystemsReady(page);

    const portfolioRow = page.locator('#case-study-portfolio .project-evidence-row');
    await expect(portfolioRow).toBeVisible();
    await expect(
      portfolioRow.locator('a.project-evidence-link', { hasText: 'Repo' })
    ).toHaveAttribute('href', 'https://github.com/mangeshraut712/mangeshrautarchive');
    await expect(
      portfolioRow.locator('a.project-evidence-link', { hasText: 'Architecture' })
    ).toHaveAttribute('href', 'systems.html#architecture-dual-host');
    await expect(
      portfolioRow.locator('a.project-evidence-link', { hasText: 'Story' })
    ).toHaveAttribute('href', 'case-studies/portfolio.html');
  });

  test('architecture section stays within viewport on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForSystemsReady(page);
    await page.locator('#architecture').scrollIntoViewIfNeeded();

    const stage = page.locator('.systems-arch-stage');
    await expect(stage).toBeVisible();

    const stageBox = await stage.boundingBox();
    const viewport = page.viewportSize();
    if (stageBox && viewport) {
      expect(stageBox.x).toBeGreaterThanOrEqual(-1);
      expect(stageBox.x + stageBox.width).toBeLessThanOrEqual(viewport.width + 1);
    }

    await assertNoHorizontalOverflow(page);
  });
});
