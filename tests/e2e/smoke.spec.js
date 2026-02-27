import { expect, test } from '@playwright/test';

test.describe('Chrome smoke tests', () => {
    test('homepage renders critical landmarks', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        await expect(page).toHaveTitle(/Mangesh Raut/i);
        await expect(page.locator('#global-nav')).toBeVisible();
        await expect(page.locator('#main-content')).toBeVisible();
        await expect(page.locator('section#home')).toBeVisible();
        await expect(page.locator('section#contact')).toBeAttached();
    });

    test('skip links are keyboard reachable', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const skipLink = page.locator('.skip-link[href="#main-content"]').first();

        await expect(skipLink).toHaveAttribute('href', '#main-content');
        await skipLink.focus();
        await expect(skipLink).toBeFocused();
    });

    test('search overlay opens and closes', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const openSearch = page.locator('#search-toggle');
        const closeSearch = page.locator('#search-close');
        const searchOverlay = page.locator('#search-overlay');

        await openSearch.click();
        await expect(searchOverlay).toHaveClass(/active/);

        await closeSearch.click();
        await expect(searchOverlay).not.toHaveClass(/active/);
    });

    test('contact nav route works', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        await page.locator('a.nav-link[href="#contact"]').first().click();
        await expect(page).toHaveURL(/#contact$/);
    });
});
