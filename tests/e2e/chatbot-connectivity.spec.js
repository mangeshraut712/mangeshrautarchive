import { test, expect } from '@playwright/test';

const edge = 'https://assistme-chat.mangeshraut712.workers.dev';
test.use({ serviceWorkers: 'block' });

test('GitHub Pages sends AssistMe health and streamed chat to the edge API', async ({
  page,
  baseURL,
}) => {
  await page.route('https://mangeshraut712.github.io/**', async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/mangeshrautarchive/, '');
    const response = await route.fetch({ url: new URL(path || '/', baseURL).href });
    await route.fulfill({ response });
  });
  let chatRequests = 0;
  await page.route(`${edge}/api/chat/health`, route =>
    route.fulfill({
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': 'https://mangeshraut712.github.io' },
      body: JSON.stringify({ provider_status: 'online', online: true }),
    })
  );
  await page.route(`${edge}/api/chat`, route => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'https://mangeshraut712.github.io',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Access-Control-Allow-Methods': 'POST',
        },
      });
    }
    chatRequests++;
    return route.fulfill({
      contentType: 'application/x-ndjson',
      headers: { 'Access-Control-Allow-Origin': 'https://mangeshraut712.github.io' },
      // A failed attempt is replaced, and the final frame deliberately lacks a newline.
      body: [
        { type: 'chunk', content: 'Discard this interrupted attempt.' },
        { type: 'reset' },
        { type: 'chunk', content: 'An idempotency key prevents duplicate operations.' },
        {
          type: 'done',
          full_content: 'An idempotency key prevents duplicate operations.',
          metadata: { source: 'OpenRouter', model: 'test-provider', tokens: 8 },
        },
      ]
        .map(event => JSON.stringify(event))
        .join('\n'),
    });
  });
  await page.goto('https://mangeshraut712.github.io/mangeshrautarchive/');
  await page.getByRole('button', { name: 'Open AI Assistant', exact: true }).click();
  await expect(page.locator('.chatbot-status-text')).toHaveText('Connected');
  await page.getByRole('textbox', { name: 'Message AssistMe' }).fill('Explain idempotency keys');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  const answer = page.locator('#chatbot-messages .assistant-message').last();
  await expect(answer).toContainText('An idempotency key prevents duplicate operations.');
  await expect(answer).not.toContainText('Discard this interrupted attempt.');
  await expect(answer).toContainText('test-provider');
  await expect(answer).toContainText('8 tokens');
  expect(chatRequests).toBe(1);

  await page.getByRole('button', { name: 'Close chat', exact: true }).click();
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('#go-to-top')).toHaveClass(/visible/);
  await page.getByRole('button', { name: 'Open AI Assistant', exact: true }).click();
  const window = await page.locator('#chatbot-widget').boundingBox();
  const launcher = await page.locator('#chatbot-toggle').boundingBox();
  expect(window.y).toBeLessThan(88);
  expect(window.y + window.height).toBeLessThanOrEqual(launcher.y);
  expect(launcher.y - (window.y + window.height)).toBeLessThan(24);
});
