import { expect, test } from '@playwright/test';

test.describe('Marathi Name Translation and shadcn Copy Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('hero name translates instantly to Marathi on heading click', async ({ page }) => {
    const heading = page.locator('#home-heading');
    const nameText = heading.locator('.hero-name-text');
    const translateBtn = page.locator('#name-translate-btn');

    await expect(nameText).toHaveText('Mangesh Raut');

    // Click heading
    await heading.click();
    await expect(nameText).toHaveText('मंगेश राऊत');
    await expect(translateBtn).toHaveClass(/is-active/);

    // Click translate icon button in identity strip to switch back
    await translateBtn.click();
    await expect(nameText).toHaveText('Mangesh Raut');
    await expect(translateBtn).not.toHaveClass(/is-active/);
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
