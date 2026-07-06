import { expect, test } from '@playwright/test';

const pathPrefix = process.env.TEST_TARGET === 'github' ? '/mangeshrautarchive' : '';
const gotoSite = (page, path = '/') =>
  page.goto(`${pathPrefix}${path}`, { waitUntil: 'domcontentloaded' });

const gotoSiteReady = async (page, path = '/') => {
  await gotoSite(page, path);
  await page.waitForSelector('#main-content', { state: 'attached', timeout: 30_000 });
  await page.waitForLoadState('load');
  await page.waitForTimeout(1200);
};

async function openChatbot(page) {
  const toggle = page.locator('#chatbot-toggle');
  await expect(toggle).toBeVisible();
  await page.evaluate(() => document.getElementById('chatbot-toggle').click());
  await expect(page.locator('#chatbot-widget')).toBeVisible();
  await page.waitForTimeout(1000); // Allow widget styles and layout to settle
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
    page.on('console', msg => console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`));
    page.on('pageerror', err => console.error(`BROWSER ERROR: ${err.message}\n${err.stack}`));
  });

  test('follows the live stream only while the reader is at the bottom edge', async ({ page }) => {
    await gotoSiteReady(page);
    await openChatbot(page);

    const initialPageScroll = await page.evaluate(() => window.scrollY);

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
    await gotoSiteReady(page);
    await openChatbot(page);

    await page.locator('#chatbot-input').fill('Give me a long detailed answer');
    await page.locator('.chatbot-send-btn').click();

    await expect(
      page.locator('#chatbot-messages .message.assistant-message.streaming').last()
    ).toBeVisible({
      timeout: 15_000,
    });

    // Simulate real user mouse wheel scrolling up
    const messages = page.locator('#chatbot-messages');
    await messages.hover();
    await page.mouse.wheel(0, -800);
    await page.waitForTimeout(100);

    // Let the stream run for a while
    await page.waitForTimeout(1200);

    // Check that we stayed scrolled up (scrollTop should be small, i.e. not pulled to bottom)
    const scrollTop = await page.evaluate(
      () => document.getElementById('chatbot-messages').scrollTop
    );
    expect(scrollTop).toBeLessThan(150);

    await expect(page.locator('.chatbot-jump-latest')).toBeVisible();
    await expect(page.locator('.chatbot-jump-latest')).toContainText(/streaming|latest/i);
  });

  test('jump to latest resumes following and pins near the bottom', async ({ page }) => {
    await gotoSiteReady(page);
    await openChatbot(page);

    await page.locator('#chatbot-input').fill('Give me a long detailed answer');
    await page.locator('.chatbot-send-btn').click();

    await expect(
      page.locator('#chatbot-messages .message.assistant-message.streaming').last()
    ).toBeVisible({
      timeout: 15_000,
    });

    // Simulate real user mouse wheel scrolling up
    const messages = page.locator('#chatbot-messages');
    await messages.hover();
    await page.mouse.wheel(0, -800);
    await page.waitForTimeout(100);

    await page.locator('.chatbot-jump-latest').click();
    await page.waitForTimeout(400);

    const gap = await distanceFromBottom(page);
    expect(gap).toBeLessThan(120);
    await expect(page.locator('.chatbot-jump-latest')).toBeHidden();
  });

  test('positions a new user turn near the top of the message viewport', async ({ page }) => {
    await gotoSiteReady(page);
    await openChatbot(page);

    // Make the message viewport scrollable to allow positioning the user message near the top
    await page.evaluate(() => {
      const messages = document.getElementById('chatbot-messages');
      if (messages) {
        const topSpacer = document.createElement('div');
        topSpacer.style.height = '1000px';
        topSpacer.style.flexShrink = '0';
        messages.prepend(topSpacer);

        const bottomSpacer = document.createElement('div');
        bottomSpacer.style.height = '1000px';
        bottomSpacer.style.flexShrink = '0';
        messages.appendChild(bottomSpacer);
      }
    });

    await page.locator('#chatbot-input').fill('First question');
    await page.locator('.chatbot-send-btn').click();

    await expect(page.locator('#chatbot-messages .message.user-message').last()).toBeVisible({
      timeout: 10_000,
    });

    const layout = await page.evaluate(() => {
      const messages = document.getElementById('chatbot-messages');
      const userList = messages.querySelectorAll('.user-message');
      const user = userList[userList.length - 1];
      return {
        offset: user ? user.offsetTop - messages.scrollTop : 999,
        viewport: messages.clientHeight,
      };
    });

    expect(layout.offset).toBeLessThan(layout.viewport * 0.35);
  });

  test('restores the welcome message after clear chat', async ({ page }) => {
    await gotoSiteReady(page);
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
