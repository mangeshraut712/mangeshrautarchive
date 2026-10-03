import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

async function openChat(app, browser) {
  await app.open('/');
  await browser.locator('#chatbot-toggle').tap();
  await expect(browser.locator('#chatbot-input')).toBeVisible();
}

test('chat connection failure keeps draft for retry', async ({ app, browser }) => {
  await openChat(app, browser);
  await browser.evaluate(() => {
    const bot = window.appleIntelligenceChatbot;
    bot.chatAPI.ask = async () => {
      throw new Error('Simulated connection interruption');
    };
    bot.chatAPI.basicQueryProcessing = () => null;
  });
  await browser.locator('#chatbot-input').fill('Keep this draft after a connection failure');
  await browser.locator('#chatbot-input').press('Enter');
  await expect(browser.locator('#chatbot-input')).toHaveValue(
    'Keep this draft after a connection failure'
  );
  await expect(browser.locator('#chatbot-messages')).toContainText('Your draft is ready to retry');
});

test('chat Stop cancels pending generation and restores composer', async ({ app, browser }) => {
  await openChat(app, browser);
  await browser.evaluate(() => {
    const bot = window.appleIntelligenceChatbot;
    bot.chatAPI.basicQueryProcessing = () => null;
    bot.chatAPI.ask = async (_message, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
  });
  await browser.locator('#chatbot-input').fill('Explain the detailed architecture choices');
  await browser.locator('#chatbot-input').press('Enter');
  await expect(browser.locator('.chatbot-send-btn')).toHaveAttribute(
    'aria-label',
    'Stop generating'
  );
  await browser.locator('.chatbot-send-btn').tap();
  await expect(browser.locator('.chatbot-send-btn')).toHaveAttribute('aria-label', 'Send message');
  await expect(browser.locator('#chatbot-input')).toHaveAttribute('aria-busy', 'false');
});
