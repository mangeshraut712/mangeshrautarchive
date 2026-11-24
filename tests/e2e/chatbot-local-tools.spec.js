import { test, expect } from './helpers/isolated-test.js';
import { gotoSite, openChatbot, sendChatbotDraft } from './helpers/site.js';

test.use({ serviceWorkers: 'block' });
for (const [width, theme] of [
  [375, 'light'],
  [375, 'dark'],
  [768, 'light'],
  [768, 'dark'],
  [1440, 'light'],
  [1440, 'dark'],
]) {
  test(`local utilities work offline with exhausted AI quota at ${width}px ${theme}`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(value => localStorage.setItem('theme', value), theme);
    await gotoSite(page, '/');
    await openChatbot(page);
    // Warm only presentation code; all subsequent utility requests must stay offline.
    await sendChatbotDraft(page, '0.1 + 0.2');
    await expect(page.locator('.assistant-message').last()).toContainText('0.3');
    await page.evaluate(() => {
      const d = new Date();
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      localStorage.setItem('assistme-chat-rate-v1', JSON.stringify({ date, count: 40 }));
    });
    let inferenceRequests = 0;
    page.on('request', request => {
      if (/\/api\/chat\/?$/.test(request.url())) inferenceRequests++;
    });
    await context.setOffline(true);
    for (const [prompt, answer] of [
      ['whats the time in new york ?', 'Based on your device clock'],
      ['convert 10 kg to lb', '22.0462262184878'],
      ['what is 15% of 200?', '30'],
      ['1 / 0', 'Division by zero is undefined'],
      ['days between 2024-02-28 and 2024-03-01', '2 days'],
    ]) {
      await sendChatbotDraft(page, prompt);
      await expect(page.locator('.assistant-message').last()).toContainText(answer);
    }
    expect(inferenceRequests).toBe(0);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('assistme-chat-rate-v1')).count)
    ).toBe(40);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false
    );
    await page.waitForTimeout(300);
    await page.screenshot({ path: `artifacts/local-tools-${width}-${theme}.png` });
  });
}
