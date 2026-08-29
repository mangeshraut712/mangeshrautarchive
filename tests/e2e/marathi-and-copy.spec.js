import { expect, test } from '@playwright/test';

test.describe('Marathi Name Translation, Speech Controls, and shadcn Copy Features', () => {
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

  test('speech settings menu opens and displays speed and voice options', async ({ page }) => {
    const settingsBtn = page.locator('#name-pronounce-settings-btn');
    const menu = page.locator('#name-pronounce-menu');

    await expect(settingsBtn).toBeVisible();
    await expect(menu).toBeHidden();

    // Click settings button
    await settingsBtn.click();
    await expect(menu).toBeVisible();

    const speedPills = menu.locator('.speed-pill');
    await expect(speedPills).toHaveCount(3);

    // Select 0.75x speed
    const slowPill = menu.locator('.speed-pill[data-speed="0.75"]');
    await slowPill.click();
    await expect(slowPill).toHaveClass(/is-active/);
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
