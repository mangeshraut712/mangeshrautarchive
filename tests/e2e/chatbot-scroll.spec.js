import { expect, test } from '@playwright/test';

const pathPrefix = process.env.TEST_TARGET === 'github' ? '/mangeshrautarchive' : '';
const gotoSite = (page, path = '/') =>
  page.goto(`${pathPrefix}${path}`, { waitUntil: 'domcontentloaded' });

function buildLongMockStream(lineCount = 24) {
  const chunks = Array.from({ length: lineCount }, (_, index) => {
    const words = Array.from({ length: 18 }, (__, wordIndex) => `word${wordIndex}`).join(' ');
    return JSON.stringify({
      type: 'chunk',
      content: `Line ${index + 1}: ${words}\n`,
    });
  });
  chunks.push(JSON.stringify({ type: 'done', metadata: { source: 'mock' } }));
  return `${chunks.join('\n')}\n`;
}

async function openChatbot(page) {
  const toggle = page.locator('#chatbot-toggle');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('#chatbot-widget')).toBeVisible();
  await page.waitForTimeout(500);
}

async function distanceFromBottom(page) {
  return page.evaluate(() => {
    const messages = document.getElementById('chatbot-messages');
    if (!messages) return Number.POSITIVE_INFINITY;
    return messages.scrollHeight - messages.scrollTop - messages.clientHeight;
  });
}

test.describe('Chatbot message scroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/chat', async route => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/x-ndjson',
        body: buildLongMockStream(),
      });
    });
  });

  test('keeps the message list pinned to the bottom while streaming', async ({ page }) => {
    await gotoSite(page);
    const initialPageScroll = await page.evaluate(() => window.scrollY);

    await openChatbot(page);

    await page.locator('#chatbot-input').fill('Give me a long detailed answer');
    await page.locator('.chatbot-send-btn').click();

    await expect(page.locator('#chatbot-messages .message.assistant-message').last()).toBeVisible({
      timeout: 15_000,
    });

    for (let attempt = 0; attempt < 12; attempt += 1) {
      await page.waitForTimeout(250);
      const gap = await distanceFromBottom(page);
      expect(gap, `messages should stay near bottom on poll ${attempt}`).toBeLessThan(96);
    }

    const pageScrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(pageScrollAfter - initialPageScroll)).toBeLessThan(8);
  });

  test('stays pinned after a full mocked reply completes', async ({ page }) => {
    await gotoSite(page);
    await openChatbot(page);

    await page.locator('#chatbot-input').fill('Short test');
    await page.locator('.chatbot-send-btn').click();

    await expect(page.locator('#chatbot-messages .message.assistant-message').last()).toBeVisible({
      timeout: 15_000,
    });

    await page.waitForTimeout(400);
    const gap = await distanceFromBottom(page);
    expect(gap).toBeLessThan(96);
  });
});
