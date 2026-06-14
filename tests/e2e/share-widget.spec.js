import { expect, test } from '@playwright/test';

const pathPrefix = process.env.TEST_TARGET === 'github' ? '/mangeshrautarchive' : '';
const gotoSite = (page, path = '/') => page.goto(`${pathPrefix}${path}`, { waitUntil: 'domcontentloaded' });

async function openShareDialog(page) {
  await page.waitForSelector('#website-share-toggle', { state: 'visible', timeout: 20_000 });
  await page.locator('#website-share-toggle').click();
  await expect(page.locator('#website-share-dialog')).toHaveClass(/active/);
  await page.waitForFunction(() => {
    const dialog = document.getElementById('website-share-dialog');
    if (!dialog?.classList.contains('active')) return false;
    return Number.parseFloat(getComputedStyle(dialog).opacity || '0') >= 0.85;
  });
}

test.describe('Share widget cross-browser', () => {
  test('repairs the share button when the accessibility toolbar is restored from an older state', async ({ page }) => {
    await gotoSite(page);

    await expect(page.locator('.a11y-toolbar')).toBeVisible();
    await expect(page.locator('#website-share-toggle')).toBeVisible();

    await page.locator('#website-share-toggle').evaluate(button => button.remove());
    await expect(page.locator('#website-share-toggle')).toHaveCount(0);

    await page.evaluate(async () => {
      await window.websiteShareWidget.ensureShareToggleReady();
    });

    await expect(page.locator('#website-share-toggle')).toBeVisible();
    await openShareDialog(page);
  });

  test('share card opens with QR, copy row, and mirror tabs', async ({ page }) => {
    await gotoSite(page);

    await expect(page.locator('.a11y-toolbar')).toBeVisible();
    await openShareDialog(page);

    const card = page.locator('.website-share-card');
    await expect(card).toBeVisible();

    const cardBox = await card.boundingBox();
    expect(cardBox?.width ?? 0).toBeGreaterThan(300);
    expect(cardBox?.height ?? 0).toBeGreaterThan(400);

    await expect(page.locator('.website-share-qr')).toBeVisible();
    await expect(page.locator('#website-share-copy')).toBeVisible();
    await expect(page.locator('.share-mirror-tab')).toHaveCount(3);

    const dialogState = await page.evaluate(() => {
      const dialog = document.getElementById('website-share-dialog');
      const style = dialog ? getComputedStyle(dialog) : null;
      return {
        active: dialog?.classList.contains('active'),
        display: style?.display,
        visibility: style?.visibility,
        opacity: style?.opacity,
      };
    });

    expect(dialogState.active).toBe(true);
    expect(dialogState.display).toBe('grid');
    expect(dialogState.visibility).toBe('visible');
    expect(Number.parseFloat(dialogState.opacity || '0')).toBeGreaterThan(0.85);
  });

  test('share card closes with escape', async ({ page }) => {
    await gotoSite(page);
    await openShareDialog(page);

    await page.keyboard.press('Escape');
    await expect(page.locator('#website-share-dialog')).not.toHaveClass(/active/);
  });

  test('mirror tabs update QR code source', async ({ page }) => {
    await gotoSite(page);
    await openShareDialog(page);

    const initialSrc = await page.locator('.website-share-qr').getAttribute('src');
    expect(initialSrc).toContain(encodeURIComponent('https://mangeshraut.pro'));

    await page.locator('.share-mirror-tab[data-mirror-idx="1"]').click();
    const vercelSrc = await page.locator('.website-share-qr').getAttribute('src');
    expect(vercelSrc).toContain(encodeURIComponent('https://mraut.vercel.app'));
    expect(vercelSrc).not.toBe(initialSrc);
  });
});
