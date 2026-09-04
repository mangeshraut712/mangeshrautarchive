import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { gotoSiteReady } from './helpers/site.js';

const safeScreenshot = async (page, filePath) => {
  try {
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await page.screenshot({ path: filePath });
  } catch {
    // Graceful fallback for CI environments where local artifact dir does not exist
  }
};

test.describe('Apple Music Card — Permanent Compact Player & UX Polish', () => {
  test('renders permanent compact player with all controls visible and polished hover states', async ({
    page,
  }) => {
    await gotoSiteReady(page);

    const musicCard = page.locator('#music-card');
    await expect(musicCard).toBeVisible();

    // 1. Verify permanent compact card geometry (370px max width)
    const box = await musicCard.boundingBox();
    expect(box).toBeTruthy();
    expect(box.width).toBeLessThanOrEqual(380);
    expect(box.height).toBeGreaterThanOrEqual(75);

    // Album art should be prominent (~58px on desktop)
    const artBox = await page.locator('.album-art-container').boundingBox();
    expect(artBox.width).toBeGreaterThanOrEqual(56);
    expect(artBox.height).toBeGreaterThanOrEqual(56);

    // Verify hero action buttons fit comfortably above the fold (within 820px)
    const actionsBox = await page.locator('.hero-actions').boundingBox();
    expect(actionsBox.y + actionsBox.height).toBeLessThanOrEqual(800);

    // 2. Verify all core controls and elements are directly visible
    await expect(page.locator('#album-art')).toBeVisible();
    await expect(page.locator('#track-name')).toBeVisible();
    await expect(page.locator('#artist-name')).toBeVisible();
    await expect(page.locator('.status-badge')).toBeVisible();
    await expect(page.locator('#music-preview-btn')).toBeVisible();
    await expect(page.locator('#music-apple-link')).toBeVisible();
    const spotifyLink = page.locator('#music-spotify-link');
    await expect(spotifyLink).toBeVisible();
    await expect(page.locator('#music-scrubber-container')).toBeVisible();

    // Expand button should NOT be present
    await expect(page.locator('#music-expand-btn')).toHaveCount(0);

    // 3. Capture screenshot in Light mode
    await safeScreenshot(
      page,
      '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/audit_screens/music_card_permanent_light.png'
    );

    // 4. Test Spotify hover state — icon must be crisp white on green background
    await spotifyLink.hover();
    await page.waitForTimeout(400);

    const spotifyIconColor = await spotifyLink.locator('i').evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    // In CSS rgb(255, 255, 255) is white
    expect(spotifyIconColor).toBe('rgb(255, 255, 255)');

    await safeScreenshot(
      page,
      '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/audit_screens/music_card_spotify_hover.png'
    );

    // 5. Test Dark theme toggle
    const themeBtn = page.locator('#theme-toggle');
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await page.waitForTimeout(400);
    await expect(musicCard).toBeVisible();
    await safeScreenshot(
      page,
      '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/audit_screens/music_card_permanent_dark.png'
    );

    // Test Spotify hover state in dark mode
    await spotifyLink.hover();
    await page.waitForTimeout(400);
    const darkSpotifyIconColor = await spotifyLink.locator('i').evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    expect(darkSpotifyIconColor).toBe('rgb(255, 255, 255)');
    await safeScreenshot(
      page,
      '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/audit_screens/music_card_spotify_hover_dark.png'
    );
  });

  test('permanent compact player renders cleanly on mobile viewports with no overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoSiteReady(page);

    const musicCard = page.locator('#music-card');
    await expect(musicCard).toBeVisible();

    const box = await musicCard.boundingBox();
    expect(box.width).toBeLessThanOrEqual(390);

    // Verify all primary elements are visible on mobile
    await expect(page.locator('#album-art')).toBeVisible();
    await expect(page.locator('#track-name')).toBeVisible();
    await expect(page.locator('#music-preview-btn')).toBeVisible();
    await expect(page.locator('#music-spotify-link')).toBeVisible();

    // Verify zero horizontal page overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    await safeScreenshot(
      page,
      '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/audit_screens/music_card_permanent_mobile.png'
    );
  });
});
