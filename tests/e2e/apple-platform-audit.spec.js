import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/systems.html', name: 'systems' },
  { path: '/uses.html', name: 'uses' },
  { path: '/travel.html', name: 'travel' },
  { path: '/monitor.html', name: 'monitor' },
  { path: '/404.html', name: '404' },
];

test.describe('Apple Platform 2026 audit', () => {
  for (const page of PAGES) {
    test(`${page.name} loads liquid glass boot + solid page background`, async ({ page: pw }) => {
      await pw.goto(page.path, { waitUntil: 'domcontentloaded' });
      const mode = await pw.evaluate(() => document.documentElement.dataset.lgMode || 'clear');
      expect(['clear', 'balanced', 'tinted']).toContain(mode);
      const bg = await pw.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toMatch(/rgb\(255, 255, 255\)|rgb\(0, 0, 0\)/);
    });
  }

  test('subpages expose accessibility toolbar after interaction', async ({ page }) => {
    await page.goto('/systems.html');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    const toolbar = page.locator('.a11y-toolbar');
    await expect(toolbar).toHaveCount(1, { timeout: 15000 });
  });

  test('clear vs tinted glass toggles on uses control center', async ({ page }) => {
    await page.goto('/uses.html');
    await page.waitForSelector('#uses-control-center', { timeout: 15000 });
    await page.click('[data-control="glass-tinted"]');
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.dataset.lgMode))
      .toBe('tinted');
    await page.click('[data-control="glass-clear"]');
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.dataset.lgMode))
      .toBe('clear');
  });

  test('command palette works on systems page', async ({ page }) => {
    await page.goto('/systems.html');
    await page.waitForTimeout(1000);
    await page.keyboard.press('ControlOrMeta+KeyK');
    await expect(page.locator('#search-overlay.active')).toBeVisible({ timeout: 10000 });
  });

  test('skills section renders categories without filter bar', async ({ page }) => {
    await page.goto('/#skills');
    await page.waitForSelector('#skills-container .skill-category', { timeout: 20000 });
    await expect(page.locator('#skills-filter-input')).toHaveCount(0);
    const categories = await page.locator('#skills-container .skill-category').count();
    expect(categories).toBeGreaterThan(0);
  });
});
