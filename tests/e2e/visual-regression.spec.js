import { test, expect } from '@playwright/test';

/**
 * Visual Layout & Regression Spec
 * Validates critical viewport rendering, contrast boundaries, and theme consistency.
 */

test.describe('Visual Layout & Regression Checks', () => {
  test('homepage hero section renders cleanly in light and dark mode', async ({ page }) => {
    await page.goto('/#home', { waitUntil: 'networkidle' });
    const hero = page.locator('#home');
    await expect(hero).toBeVisible();

    // Verify hero container dimensions and bounds
    const box = await hero.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(300);
    expect(box.height).toBeGreaterThan(200);

    // Switch to dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(200);

    // Verify dark theme stays rendered without layout collapse
    await expect(hero).toBeVisible();
  });

  test('contact section cards render with solid black background in dark mode', async ({
    page,
  }) => {
    await page.goto('/#contact', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(200);

    const outreachCard = page.locator('.direct-outreach-card');
    await expect(outreachCard).toBeVisible();

    const bgColor = await outreachCard.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // Should be rgb(0, 0, 0) in dark mode
    expect(bgColor).toBe('rgb(0, 0, 0)');
  });

  test('systems page architecture diagrams render without horizontal overflow', async ({
    page,
  }) => {
    await page.goto('/systems.html', { waitUntil: 'networkidle' });
    const main = page.locator('main');
    await expect(main).toBeVisible();

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test('monitor page summary panels render with 100% visible indicators', async ({ page }) => {
    await page.goto('/monitor.html', { waitUntil: 'networkidle' });
    const summary = page.locator('#monitor-summary-section, .monitor-summary-card');
    await expect(summary.first()).toBeVisible();
  });
});
