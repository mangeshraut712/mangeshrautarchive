import { expect, test } from '@playwright/test';

test.describe('Marathi Name Translation, Clean Speech Player, and shadcn Copy Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('hero name translates instantly to Marathi on heading click and back', async ({ page }) => {
    const heading = page.locator('#home-heading');
    const nameText = heading.locator('.hero-name-text');

    await expect(nameText).toHaveText('Mangesh Raut');

    // Click heading to translate to Marathi
    await heading.click();
    await expect(nameText).toHaveText('मंगेश राऊत');

    // Click heading again to translate back to English
    await heading.click();
    await expect(nameText).toHaveText('Mangesh Raut');
  });

  test('hero pronounce button is clean single button and clickable', async ({ page }) => {
    const pronounceBtn = page.locator('#name-pronounce-btn');
    await expect(pronounceBtn).toBeVisible();

    // Verify settings button and menu are removed
    const settingsBtn = page.locator('#name-pronounce-settings-btn');
    await expect(settingsBtn).toHaveCount(0);

    // Click pronounce button
    await pronounceBtn.click();
    await expect(pronounceBtn).toBeVisible();
  });

  test('music card album art renders as circular rotating artwork without pin', async ({
    page,
  }) => {
    const albumArt = page.locator('#album-art');
    await expect(albumArt).toBeVisible();

    // Verify circular border radius
    const borderRadius = await albumArt.evaluate(el => getComputedStyle(el).borderRadius);
    expect(borderRadius).toMatch(/50%|\d+px/);

    const pin = page.locator('.album-art-pin');
    await expect(pin).toBeHidden();

    // Verify animation runs when is-playing is present
    await page.locator('#music-card').evaluate(el => {
      el.classList.add('is-playing');
    });
    const playState = await albumArt.evaluate(el => getComputedStyle(el).animationPlayState);
    expect(playState).toBe('running');
  });

  test('contact channel copy button copies email and triggers toast', async ({
    page,
    browserName,
  }) => {
    if (browserName === 'chromium') {
      try {
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      } catch {
        // Permission not required
      }
    }

    const copyBtn = page.locator(
      '.contact-channel-copy-btn[data-copy-text="mbr63drexel@gmail.com"]'
    );
    await copyBtn.scrollIntoViewIfNeeded();
    await expect(copyBtn).toBeVisible();

    await copyBtn.click();

    // Verify is-copied class and toast appearance
    await expect(copyBtn).toHaveClass(/is-copied/);
    const toast = page.locator('#shadcn-copy-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Primary email copied');
  });
});
