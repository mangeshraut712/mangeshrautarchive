import { test, expect } from '@playwright/test';

test.describe('Systems Page (Engineering Evidence) Audit', () => {
  test('audit page for layout, styles, and console issues (desktop & mobile)', async ({ page }) => {
    const consoleErrors = [];
    const consoleWarnings = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // 1. Desktop Audit
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/systems.html');
    await page.waitForSelector('#systems-evidence-grid .eng-showcase-card', { timeout: 15000 });

    console.log('--- Desktop Console Errors:', consoleErrors);
    console.log('--- Desktop Console Warnings:', consoleWarnings);

    expect(consoleErrors).toEqual([]);

    // Check font and basic styles on body
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      return {
        fontFamily: style.fontFamily,
        backgroundColor: style.backgroundColor,
      };
    });
    console.log('Body styles (Light Mode):', bodyStyles);
    expect(bodyStyles.fontFamily).toContain('-apple-system');

    // Check that Bento cards have glassmorphism backgrounds
    await page.waitForSelector('.systems-bento-tile', { state: 'attached', timeout: 20000 });
    const firstBentoCardStyles = await page.evaluate(() => {
      const card = document.querySelector('.systems-bento-tile');
      if (!card) return null;
      const style = window.getComputedStyle(card);
      return {
        background: style.background,
        backgroundColor: style.backgroundColor,
        backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
        border: style.border,
        boxShadow: style.boxShadow,
      };
    });
    console.log('Bento Card styles (Light Mode):', firstBentoCardStyles);
    expect(firstBentoCardStyles).not.toBeNull();
    expect(firstBentoCardStyles.backdropFilter).toContain('blur');

    // 2. Toggle Dark Mode and Audit
    await page.locator('#theme-toggle').click();
    await page.waitForTimeout(500);

    const darkBodyStyles = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const bodyStyle = window.getComputedStyle(body);
      return {
        htmlClass: html.className,
        bodyBg: bodyStyle.backgroundColor,
      };
    });
    console.log('Body styles (Dark Mode):', darkBodyStyles);
    expect(darkBodyStyles.htmlClass).toContain('dark');

    const darkCardStyles = await page.evaluate(() => {
      const card = document.querySelector('.systems-bento-tile');
      if (!card) return null;
      const style = window.getComputedStyle(card);
      return {
        backgroundColor: style.backgroundColor,
        border: style.border,
      };
    });
    console.log('Bento Card styles (Dark Mode):', darkCardStyles);

    // 3. Mobile Viewport Audit
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/systems.html');
    await page.waitForSelector('#systems-evidence-grid .eng-showcase-card', { timeout: 15000 });

    const mobileLayout = await page.evaluate(() => {
      const rail = document.getElementById('systems-section-rail');
      const railStyle = rail ? window.getComputedStyle(rail) : null;
      const evidenceGrid = document.getElementById('systems-evidence-grid');
      const gridStyle = evidenceGrid ? window.getComputedStyle(evidenceGrid) : null;
      return {
        railDisplay: railStyle?.display,
        gridDisplay: gridStyle?.display,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    console.log('Mobile layout info:', mobileLayout);
    // Ensure no horizontal overflow
    expect(mobileLayout.scrollWidth - mobileLayout.innerWidth).toBeLessThanOrEqual(2);
  });
});
