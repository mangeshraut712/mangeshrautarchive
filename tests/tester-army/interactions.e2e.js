import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('travel search recovers from no results', async ({ app, browser }) => {
  await app.open('/travel');
  await browser.locator('#place-search').fill('zzzz-no-match');
  await expect(browser.locator('.travel-empty-state')).toBeVisible();
  await browser.locator('[data-reset-travel]').tap();
  await expect(browser.locator('#place-search')).toHaveValue('');
  await browser.locator('#place-search').fill('Pune');
  await expect(browser.locator('.travel-stop')).toHaveCount(2);
});

test('mobile navigation opens and restores focus on escape', async ({ app, browser }) => {
  await browser.setViewport({ width: 375, height: 812 });
  await app.open('/');
  await browser.locator('#menu-btn').tap();
  await expect(browser.locator('[aria-label="Site navigation"]')).toBeVisible();
  await browser.locator('[aria-label="Close navigation menu"]').press('Escape');
  await expect(browser.locator('[aria-label="Site navigation"]')).not.toBeVisible();
  await expect(browser.locator('#menu-btn')).toBeFocused();
});

test('share escape restores the opener', async ({ app, browser }) => {
  await app.open('/');
  await browser.locator('#website-share-toggle').tap();
  await expect(browser.locator('#website-share-dialog')).toBeVisible();
  await browser.locator('.website-share-close').press('Escape');
  await expect(browser.locator('#website-share-dialog')).not.toBeVisible();
  await expect
    .poll(() => browser.evaluate(() => document.activeElement?.id))
    .toBe('website-share-toggle');
});

test('contact rejection preserves the message for retry', async ({ app, browser }) => {
  await browser.route('**/api/contact', route =>
    route.fulfill({ status: 503, json: { detail: 'Please try again later.' } })
  );
  await app.open('/#contact');
  await browser.locator('.contact-manual-details > summary').press('Enter');
  await browser.locator('#contact-name').fill('Ada Lovelace');
  await browser.locator('#contact-email').fill('ada@example.com');
  await browser.locator('#contact-subject').fill('Project question');
  await browser.locator('#contact-message').fill('Preserve this draft for retry.');
  await browser.locator('#contact-form button[type="submit"]').tap();
  await expect(browser.locator('.contact-feedback-toast')).toBeVisible();
  await expect(browser.locator('#contact-message')).toHaveValue('Preserve this draft for retry.');
});

test('calendar reminder can be created edited and completed', async ({ app, browser }) => {
  await app.open('/#contact');
  await browser.locator('[aria-label="Add new reminder"]').tap();
  await browser.locator('.smart-modal-textarea').fill('Review portfolio tomorrow');
  await browser.locator('.smart-modal-btn.btn-save').tap();
  await browser.locator('.reminders-search-input').fill('Review portfolio');
  await expect(browser.locator('.reminder-card')).toHaveCount(1);
  const stopEdit = await browser.onDialog(dialog => dialog.accept('Updated portfolio reminder'));
  await browser.locator('.reminder-card .edit-btn').tap();
  await stopEdit();
  await browser.locator('.reminders-search-input').fill('Updated portfolio reminder');
  await expect(browser.locator('.reminder-card')).toContainText('Updated portfolio reminder');
  await browser.locator('.reminder-card .status-circle').tap();
  await expect(browser.locator('.reminder-card')).toHaveAttribute('class', /completed/);
});

test('changelog filters select fixes and reset', async ({ app, browser }) => {
  await app.open('/changelog');
  await browser.locator('#changelog-filters-toggle').tap();
  await browser.locator('#changelog-type-filters [data-type="fix"]').tap();
  await expect(browser.locator('.changelog-entry:not([data-type="fix"])')).toHaveCount(0);
  await expect(browser.locator('.changelog-entry').first()).toBeVisible();
  await browser.locator('#changelog-type-filters [data-type="all"]').tap();
  await expect(browser.locator('.changelog-entry:not([data-type="fix"])').first()).toBeVisible();
});
