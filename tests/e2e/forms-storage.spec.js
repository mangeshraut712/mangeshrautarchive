import { expect, test } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

async function mockStoredResponse(page, endpoint, id) {
  let payload;
  await page.route(`**${endpoint}`, async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        persisted: true,
        id,
        message: 'Saved successfully.',
      }),
    });
  });
  return () => payload;
}

test.describe('persistent public forms', () => {
  test('standalone article captures daily.dev newsletter attribution', async ({ page }) => {
    const getPayload = await mockStoredResponse(
      page,
      '/api/newsletter/subscribe',
      'newsletter-test-id'
    );
    await gotoSite(
      page,
      '/blog/razorpay-vulcan-payments-foundation-model.html?utm_source=dailydev&utm_medium=community&utm_campaign=vulcan'
    );

    const form = page.locator('[data-source="blog_article_newsletter"]');
    await form.scrollIntoViewIfNeeded();
    await expect(form).toBeVisible();
    await form.locator('input[name="email"]').fill('reader@example.com');
    await form.locator('button[type="submit"]').click();

    await expect(form.locator('[data-newsletter-status]')).toContainText('Saved successfully.');
    await expect(form.locator('input[name="email"]')).toHaveValue('');
    expect(getPayload()).toMatchObject({
      email: 'reader@example.com',
      source: 'dailydev',
      utmSource: 'dailydev',
      utmMedium: 'community',
      utmCampaign: 'vulcan',
    });
  });

  test('blog index newsletter form fits without horizontal overflow', async ({ page }) => {
    await mockStoredResponse(page, '/api/newsletter/subscribe', 'newsletter-index-id');
    await gotoSite(page, '/blog/');

    const form = page.locator('[data-source="blog_index_newsletter"]');
    await form.scrollIntoViewIfNeeded();
    await expect(form).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('contact form stores the message without navigating to mailto', async ({ page }) => {
    const getPayload = await mockStoredResponse(page, '/api/contact', 'contact-test-id');
    await gotoSite(page, '/#contact');

    const form = page.locator('#contact-form');
    await form.scrollIntoViewIfNeeded();
    await expect(form).toBeVisible();
    await form.locator('#contact-name').fill('Ada Lovelace');
    await form.locator('#contact-email').fill('ada@example.com');
    await form.locator('#contact-subject').fill('Architecture review');
    await form.locator('#contact-message').fill('Please review the system architecture.');
    await form.locator('button[type="submit"]').click();

    await expect(page.locator('.contact-feedback-toast')).toContainText('Saved successfully.');
    await expect(form.locator('#contact-name')).toHaveValue('');
    expect(page.url()).not.toMatch(/^mailto:/);
    expect(getPayload()).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Architecture review',
      message: 'Please review the system architecture.',
      source: 'github_pages_contact',
    });
  });
});
