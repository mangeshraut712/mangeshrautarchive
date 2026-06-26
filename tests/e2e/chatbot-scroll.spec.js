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

test.describe('Chatbot scroll engineering', () => {
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

  test('follows the live stream only while the reader is at the bottom edge', async ({ page }) => {
    await gotoSite(page);
    const initialPageScroll = await page.evaluate(() => window.scrollY);

    await openChatbot(page);

    await page.locator('#chatbot-input').fill('Give me a long detailed answer');
    await page.locator('.chatbot-send-btn').click();

    await expect(page.locator('#chatbot-messages .message.assistant-message').last()).toBeVisible({
      timeout: 15_000,
    });

    for (let attempt = 0; attempt < 8; attempt += 1) {
      await page.waitForTimeout(250);
      const gap = await distanceFromBottom(page);
      expect(
        gap,
        `messages should stay near bottom while following on poll ${attempt}`
      ).toBeLessThan(120);
    }

    const pageScrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(pageScrollAfter - initialPageScroll)).toBeLessThan(8);
  });

  test('does not pull the reader when they scroll up during streaming', async ({ page }) => {
    await gotoSite(page);
    await openChatbot(page);

    await page.locator('#chatbot-input').fill('Give me a long detailed answer');
    await page.locator('.chatbot-send-btn').click();

    await expect(
      page.locator('#chatbot-messages .message.assistant-message.streaming').last()
    ).toBeVisible({
      timeout: 15_000,
    });

    await page.evaluate(() => {
      const messages = document.getElementById('chatbot-messages');
      messages.scrollTop = 0;
    });

    await page.waitForTimeout(1200);

    const scrollTop = await page.evaluate(
      () => document.getElementById('chatbot-messages').scrollTop
    );
    expect(scrollTop).toBeLessThan(48);

    await expect(page.locator('.chatbot-jump-latest')).toBeVisible();
    await expect(page.locator('.chatbot-jump-latest')).toContainText(/streaming|latest/i);
  });

  test('jump to latest resumes following and pins near the bottom', async ({ page }) => {
    await gotoSite(page);
    await openChatbot(page);

    await page.locator('#chatbot-input').fill('Give me a long detailed answer');
    await page.locator('.chatbot-send-btn').click();

    await expect(
      page.locator('#chatbot-messages .message.assistant-message.streaming').last()
    ).toBeVisible({
      timeout: 15_000,
    });

    await page.evaluate(() => {
      document.getElementById('chatbot-messages').scrollTop = 0;
    });

    await page.locator('.chatbot-jump-latest').click();
    await page.waitForTimeout(400);

    const gap = await distanceFromBottom(page);
    expect(gap).toBeLessThan(120);
    await expect(page.locator('.chatbot-jump-latest')).toBeHidden();
  });

  test('positions a new user turn near the top of the message viewport', async ({ page }) => {
    await gotoSite(page);
    await openChatbot(page);

    await page.locator('#chatbot-input').fill('First question');
    await page.locator('.chatbot-send-btn').click();

    await expect(page.locator('#chatbot-messages .message.user-message').last()).toBeVisible({
      timeout: 10_000,
    });

    const layout = await page.evaluate(() => {
      const messages = document.getElementById('chatbot-messages');
      const user = messages.querySelector('.user-message:last-of-type');
      return {
        offset: user.offsetTop - messages.scrollTop,
        viewport: messages.clientHeight,
      };
    });

    expect(layout.offset).toBeLessThan(layout.viewport * 0.35);
  });

  test('restores the welcome message after clear chat', async ({ page }) => {
    await gotoSite(page);
    await openChatbot(page);

    await expect(page.locator('#chatbot-messages .welcome-message')).toBeVisible();

    await page.locator('#chatbot-input').fill('Quick test');
    await page.locator('.chatbot-send-btn').click();
    await expect(page.locator('#chatbot-messages .message.user-message')).toBeVisible({
      timeout: 15_000,
    });

    await page.locator('#chatbot-clear-btn').click();
    await expect(page.locator('#chatbot-messages .welcome-message')).toBeVisible({
      timeout: 2_000,
    });
    await expect(page.locator('#chatbot-messages .message.user-message')).toHaveCount(0);
  });
});
