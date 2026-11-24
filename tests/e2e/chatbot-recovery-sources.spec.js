import { test, expect } from './helpers/isolated-test.js';
import { gotoSite, openChatbot, sendChatbotDraft } from './helpers/site.js';

test.use({ serviceWorkers: 'block' });

for (const width of [375, 768, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`chat source links fit ${width}px in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.addInitScript(value => localStorage.setItem('theme', value), theme);
      await page.route('**/api/chat/health', route =>
        route.fulfill({ json: { online: true, provider_status: 'online' } })
      );
      await page.route('**/api/chat', route =>
        route.fulfill({
          contentType: 'application/x-ndjson',
          body: JSON.stringify({
            type: 'done',
            full_content:
              'Here is the available source material. Publication dates may differ from event dates.',
            metadata: {
              source: 'OpenRouter',
              model: 'test/model',
              live_grounded: true,
              live_sources: 2,
              sources: [
                {
                  title: 'A detailed source title that must wrap cleanly on a narrow phone screen',
                  url: 'https://example.com/research',
                },
                { title: 'Unsafe source', url: 'javascript:alert(1)' },
              ],
            },
          }),
        })
      );
      await gotoSite(page, '/');
      await openChatbot(page);
      await sendChatbotDraft(page, 'Explain recent battery research');
      const message = page.locator('.assistant-message').last();
      await expect(message).toContainText('available source material');
      await expect(message.locator('.vector-citation-badge')).toHaveCount(0);
      await message.getByRole('button', { name: 'Details', exact: true }).click();
      const link = message.locator('a.meta-sources-item');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute('href', 'https://example.com/research');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
      await page
        .locator('#chatbot-widget')
        .screenshot({ path: `artifacts/chat-sources-${width}-${theme}.png` });
    });
  }
}

test('truncated response preserves the draft and offers retry instead of a completed answer', async ({
  page,
}) => {
  await page.route('**/api/chat/health', route =>
    route.fulfill({ json: { online: true, provider_status: 'online' } })
  );
  await page.route('**/api/chat', route =>
    route.fulfill({
      contentType: 'application/x-ndjson',
      body: JSON.stringify({ type: 'chunk', content: 'An incomplete answer' }) + '\n',
    })
  );
  await gotoSite(page, '/');
  await openChatbot(page);
  const question = 'Explain idempotency when retrying HTTP requests';
  await sendChatbotDraft(page, question);
  await expect(page.locator('#chatbot-input')).toHaveValue(question);
  await expect(page.locator('#chatbot-messages')).toContainText('Your draft is ready to retry');
});
