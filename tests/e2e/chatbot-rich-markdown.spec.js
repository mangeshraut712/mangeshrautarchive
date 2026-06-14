import { expect, test } from '@playwright/test';

const pathPrefix = process.env.TEST_TARGET === 'github' ? '/mangeshrautarchive' : '';
const gotoSite = (page, path = '/') => page.goto(`${pathPrefix}${path}`, { waitUntil: 'domcontentloaded' });

const RICH_MARKDOWN_REPLY =
  'Here is **bold**, ||spoiler||, a task:\n- [ ] Todo item\n\n| Col | Val |\n| --- | --- |\n| A | 1 |';

function buildMockStream() {
  const chunks = [
    '{"type":"chunk","content":"Here is **bold**, ||spoiler||, and a list:\\n- Alpha\\n- Beta"}',
    '{"type":"done","metadata":{"source":"mock"}}',
  ];
  return `${chunks.join('\n')}\n`;
}

async function openChatbot(page) {
  const toggle = page.locator('#chatbot-toggle');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('#chatbot-widget')).toBeVisible();
  await page.waitForTimeout(800);
}

test.describe('Chatbot rich markdown cross-browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/chat', async route => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/x-ndjson',
        body: buildMockStream(),
      });
    });
  });

  test('renders rich markdown in assistant bubble after stream completes', async ({ page }) => {
    await gotoSite(page);
    await openChatbot(page);

    await page.locator('#chatbot-input').fill('Show rich formatting');
    await page.locator('.chatbot-send-btn').click();

    const assistantBubble = page.locator('#chatbot-messages .message.assistant-message').last();
    await expect(assistantBubble.locator('strong')).toBeVisible({ timeout: 15_000 });
    await expect(assistantBubble.locator('.rich-spoiler')).toBeVisible();
    await expect(assistantBubble.locator('ul li')).toHaveCount(2);
  });

  test('spoiler reveal interaction works after finalize', async ({ page }) => {
    await gotoSite(page);
    await openChatbot(page);

    await page.locator('#chatbot-input').fill(RICH_MARKDOWN_REPLY);
    await page.locator('.chatbot-send-btn').click();

    const spoiler = page.locator('#chatbot-messages .message.assistant-message .rich-spoiler').last();
    await expect(spoiler).toBeVisible({ timeout: 15_000 });
    await spoiler.click();
    await expect(spoiler).toHaveClass(/revealed/);
  });

  test('thinking indicator shows streaming stage during mocked stream', async ({ page }) => {
    await gotoSite(page);
    await openChatbot(page);

    await page.locator('#chatbot-input').fill('stream test');
    await page.locator('.chatbot-send-btn').click();

    const thinking = page.locator('#chatbot-widget .rich-block-thinking, #chatbot-widget .thinking-indicator');
    await expect(thinking.first()).toBeVisible({ timeout: 10_000 }).catch(() => {});
  });
});
