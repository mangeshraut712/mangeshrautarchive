import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

for (const path of ['/systems', '/monitor', '/travel', '/uses', '/changelog', '/404', '/offline']) {
  test(`page ${path} presents its content`, async ({ app, browser }) => {
    await app.open(path);
    await expect(browser.locator('main')).toBeVisible();
    await expect(
      browser.locator(path === '/travel' ? '#place-search' : 'h1').first()
    ).toBeVisible();
  });
}

test('writing archive opens a complete article', async ({ app, browser }) => {
  await app.open('/blog/');
  await expect(browser.locator('#blog-posts-container .blog-card')).toHaveCount(17);
  await browser.locator('#blog-posts-container .blog-title-link').first().tap();
  await expect(browser.locator('main h1')).toBeVisible();
  await expect(browser.locator('.article-toc__list a').first()).toHaveAttribute('href', /#/);
});

test('repository preview opens and closes', async ({ app, browser }) => {
  await app.open('/#projects');
  await browser.locator('.project-media-open').first().tap();
  await expect(browser.locator('#repo-preview-modal')).toBeVisible();
  await browser.locator('#repo-preview-modal .blog-modal-close').tap();
  await expect(browser.locator('#repo-preview-modal')).not.toBeVisible();
});

test('contact submission confirms saved message', async ({ app, browser }) => {
  await browser.route('**/api/contact', route =>
    route.fulfill({
      json: { success: true, persisted: true, id: 'e2e', message: 'Saved successfully.' },
    })
  );
  await app.open('/#contact');
  await browser.locator('.contact-manual-details > summary').press('Enter');
  await browser.locator('#contact-name').fill('Ada Lovelace');
  await browser.locator('#contact-email').fill('ada@example.com');
  await browser.locator('#contact-subject').fill('Project question');
  await browser.locator('#contact-message').fill('Please contact me about a project.');
  await browser.locator('#contact-form button[type="submit"]').tap();
  await expect(browser.locator('.contact-feedback-toast')).toContainText('Saved successfully.');
});

test('travel map failure allows retry and retains places', async ({ app, browser }) => {
  await browser.route('**/maplibre-gl.js', route => route.abort());
  await app.open('/travel');
  await browser.locator('#travel-map-load').tap();
  await expect(browser.locator('#travel-map-load')).toContainText('Retry interactive map');
  await expect(browser.locator('#travel-map-prompt-status')).toContainText('places list');
});

test('share dialog provides a portable social link and closes', async ({ app, browser }) => {
  await app.open('/');
  await browser.locator('#website-share-toggle').tap();
  await expect(browser.locator('#website-share-dialog')).toBeVisible();
  await expect(browser.locator('[data-social="LinkedIn"]')).toHaveAttribute('href', /linkedin/);
  await browser.locator('.website-share-close').tap();
  await expect(browser.locator('#website-share-dialog')).not.toBeVisible();
});

test('calendar clocks expand and collapse', async ({ app, browser }) => {
  await app.open('/#contact');
  await expect(browser.locator('.world-clock:visible')).toHaveCount(3);
  await browser.locator('.world-clocks-toggle').tap();
  await expect(browser.locator('.world-clock:visible')).toHaveCount(6);
  await browser.locator('.world-clocks-toggle').tap();
  await expect(browser.locator('.world-clock:visible')).toHaveCount(3);
});

test('chat displays a streamed answer', async ({ app, browser }) => {
  await browser.route('**/api/chat/health', route =>
    route.fulfill({ json: { provider_status: 'online' } })
  );
  await browser.route('**/api/chat', route =>
    route.fulfill({
      contentType: 'application/x-ndjson',
      body: '{"type":"chunk","content":"Here is **the answer**."}\n{"type":"done","metadata":{"source":"e2e"}}\n',
    })
  );
  await app.open('/');
  await browser.locator('#chatbot-toggle').tap();
  await browser.locator('#chatbot-input').fill('Explain the portfolio');
  await browser.locator('#chatbot-input').press('Enter');
  await expect(browser.locator('#chatbot-messages .assistant-message').last()).toContainText(
    'the answer'
  );
});

test('contact validation prevents an empty submission', async ({ app, browser }) => {
  let requests = 0;
  await browser.route('**/api/contact', route => {
    requests += 1;
    return route.fulfill({ json: { success: true } });
  });
  await app.open('/#contact');
  await browser.locator('.contact-manual-details > summary').press('Enter');
  await browser.locator('#contact-form button[type="submit"]').tap();
  expect(requests).toBe(0);
  expect(
    await browser.evaluate(() => document.querySelector('#contact-form').checkValidity())
  ).toBe(false);
});
