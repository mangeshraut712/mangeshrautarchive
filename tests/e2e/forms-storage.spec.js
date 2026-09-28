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

    await page.locator('.contact-manual-details > summary').click();
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

  test('guided contact asks for details and submits only after review', async ({ page }) => {
    let submitted;
    await page.route('**/api/contact', async route => {
      submitted = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          persisted: true,
          id: 'guided-contact-id',
          message: 'Saved successfully.',
        }),
      });
    });
    await gotoSite(page, '/#contact');
    await page.locator('#contact-guided-message-btn').click();
    const input = page.locator('#chatbot-input');
    await expect(input).toBeVisible();
    for (const answer of [
      'Project collaboration',
      'I would like to discuss an architecture review and arrange a call.',
      'Next month',
      'Ada Lovelace',
      'ada@example.com',
    ]) {
      await input.fill(answer);
      await input.press('Enter');
    }
    await expect(page.locator('#chatbot-messages .assistant-message').last()).toContainText(
      'Review your message'
    );
    expect(submitted).toBeUndefined();
    await input.fill('send');
    await input.press('Enter');
    await expect(page.locator('#chatbot-messages .assistant-message').last()).toContainText(
      'Saved successfully.'
    );
    expect(submitted).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Project collaboration',
      source: 'chatbot_contact',
    });
    expect(submitted.message).toContain('Next month');
  });
});
