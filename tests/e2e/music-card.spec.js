import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { gotoSiteReady } from './helpers/site.js';

const safeScreenshot = async (page, filePath) => {
  try {
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (fs.existsSync(dir)) {
      await page.screenshot({ path: filePath });
    }
  } catch {
    // Graceful fallback for CI environments where local artifact dir does not exist
  }
};

test.describe('Apple Music Card — Dynamic Island Pill & Expansion', () => {
  test('renders compact pill by default and expands/collapses smoothly', async ({ page }) => {
    await gotoSiteReady(page);

    const musicCard = page.locator('#music-card');
    await expect(musicCard).toBeVisible();

    // 1. Verify default compact state
    await expect(musicCard).toHaveAttribute('data-expanded', 'false');
    await expect(musicCard).toHaveAttribute('aria-expanded', 'false');

    const compactBox = await musicCard.boundingBox();
    expect(compactBox).toBeTruthy();
    expect(compactBox.width).toBeLessThanOrEqual(380);
    expect(compactBox.height).toBeLessThanOrEqual(55);

    // Scrubber is hidden in compact mode
    const scrubber = page.locator('#music-scrubber-container');
    await expect(scrubber).toBeHidden();

    // Streaming service links are hidden in compact mode
    await expect(page.locator('#music-apple-link')).toBeHidden();
    await expect(page.locator('#music-spotify-link')).toBeHidden();

    // Mini preview button and expand button are visible
    await expect(page.locator('#music-preview-btn')).toBeVisible();
    const expandBtn = page.locator('#music-expand-btn');
    await expect(expandBtn).toBeVisible();
    await expect(page.locator('#music-expand-icon')).toHaveClass(/fa-chevron-down/);

    // 2. Click compact pill to expand
    await musicCard.click();
    await expect(musicCard).toHaveAttribute('data-expanded', 'true');
    await expect(musicCard).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#music-expand-icon')).toHaveClass(/fa-chevron-up/);

    // Scrubber and streaming links are now visible
    await expect(scrubber).toBeVisible();
    await expect(page.locator('#music-apple-link')).toBeVisible();
    await expect(page.locator('#music-spotify-link')).toBeVisible();

    const expandedBox = await musicCard.boundingBox();
    expect(expandedBox.height).toBeGreaterThan(65);

    // Take screenshot of expanded state
    await safeScreenshot(
      page,
      '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/audit_screens/music_card_expanded_desktop.png'
    );

    // 3. Click collapse button to collapse back to pill
    await expandBtn.click();
    await expect(musicCard).toHaveAttribute('data-expanded', 'false');
    await expect(musicCard).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#music-expand-icon')).toHaveClass(/fa-chevron-down/);
    await expect(scrubber).toBeHidden();

    // Take screenshot of compact state
    await safeScreenshot(
      page,
      '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/audit_screens/music_card_compact_desktop.png'
    );

    // 4. Expand again, then click outside to collapse
    await musicCard.click();
    await expect(musicCard).toHaveAttribute('data-expanded', 'true');

    // Click outside on body
    await page.locator('body').click({ position: { x: 50, y: 50 } });
    await expect(musicCard).toHaveAttribute('data-expanded', 'false');
  });

  test('compact pill renders cleanly on mobile viewports with no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoSiteReady(page);

    const musicCard = page.locator('#music-card');
    await expect(musicCard).toBeVisible();
    await expect(musicCard).toHaveAttribute('data-expanded', 'false');

    const compactBox = await musicCard.boundingBox();
    expect(compactBox.width).toBeLessThanOrEqual(340);

    // Verify zero horizontal page overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    await safeScreenshot(
      page,
      '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/audit_screens/music_card_compact_mobile.png'
    );

    // Expand on mobile
    await musicCard.click();
    await expect(musicCard).toHaveAttribute('data-expanded', 'true');

    await safeScreenshot(
      page,
      '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/audit_screens/music_card_expanded_mobile.png'
    );
  });
});
