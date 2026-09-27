import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { gotoSite, openChatbot } from './helpers/site.js';

test('homepage navigation loads the writing section and all article cards', async ({ page }) => {
  await gotoSite(page, '/');
  await expect(page.locator('main')).toBeAttached();
  await page.locator('a.nav-link[href="#blog"]').click();
  await expect(page).toHaveURL(/#blog$/);
  await expect(page.locator('#blog .blog-card')).toHaveCount(18);
  await expect(page.locator('#blog .blog-title-link').first()).toHaveAttribute('href', /\/blog\//);
});

test('blog archive opens a full article with its lead image', async ({ page }) => {
  await gotoSite(page, '/blog/');
  await expect(page.locator('.blog-index-title')).toBeVisible();
  await expect
    .poll(() => page.locator('#blog-posts-container .blog-card').count())
    .toBeGreaterThanOrEqual(17);
  await page.locator('#blog-posts-container .blog-title-link').first().click();
  await expect(page.locator('main h1')).toBeVisible();
  const leadImage = page.locator('.article-figure img').first();
  await expect(leadImage).toBeAttached();
  await leadImage.evaluate(image => {
    image.loading = 'eager';
    image.scrollIntoView({ block: 'center' });
  });
  await expect.poll(() => leadImage.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
});

test('homepage preview leads to a complete article with section navigation', async ({ page }) => {
  await gotoSite(page, '/');
  await page.locator('#blog').scrollIntoViewIfNeeded();
  await expect(page.locator('.blog-section-intro-actions a')).toHaveAttribute('href', 'blog/');
  await page.locator('#blog .blog-preview-btn').first().click();
  const preview = page.locator('#blog-modal.active');
  await expect(preview.getByText('Article preview')).toBeVisible();
  await expect(preview.locator('.article-body')).toHaveCount(0);
  await preview.getByRole('link', { name: 'Read full article' }).click();
  await expect(page).toHaveURL(/\/blog\/[^/]+\.html$/);
  await expect(page.locator('.article-toc__list a').first()).toBeAttached();
  await expect(page.locator('.article-diagram')).toHaveCount(1);
});

test('contact form sends a message and confirms storage', async ({ page }) => {
  let submitted;
  await page.route('**/api/contact', async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        persisted: true,
        id: 'contact-e2e',
        message: 'Saved successfully.',
      }),
    });
  });
  await gotoSite(page, '/#contact');
  const form = page.locator('#contact-form');
  await form.locator('#contact-name').fill('Ada Lovelace');
  await form.locator('#contact-email').fill('ada@example.com');
  await form.locator('#contact-subject').fill('Project question');
  await form.locator('#contact-message').fill('Please get in touch about this project.');
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('.contact-feedback-toast')).toContainText('Saved successfully.');
  expect(submitted).toMatchObject({ email: 'ada@example.com', subject: 'Project question' });
});

test('chatbot renders a streamed answer', async ({ page }) => {
  await page.route('**/api/chat', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson',
      body: '{"type":"chunk","content":"Here is **the answer**."}\n{"type":"done","metadata":{"source":"e2e"}}\n',
    });
  });
  await gotoSite(page, '/');
  await openChatbot(page);
  await page.locator('#chatbot-input').fill('Explain the portfolio');
  await page.locator('#chatbot-input').press('Enter');
  await expect(page.locator('#chatbot-messages .assistant-message').last()).toContainText(
    'the answer'
  );
});

test('homepage has no serious accessibility violations', async ({ page }) => {
  await gotoSite(page, '/');
  await expect(page.locator('main')).toBeAttached();
  await page.waitForLoadState('load');
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.getElementById('skills-loading'));
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(result.violations.filter(item => ['critical', 'serious'].includes(item.impact))).toEqual(
    []
  );
});

test('mobile homepage fits without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoSite(page, '/');
  await expect(page.locator('main')).toBeAttached();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
    .toBeLessThanOrEqual(1);
});
