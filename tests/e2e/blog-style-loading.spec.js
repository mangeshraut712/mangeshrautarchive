import { test, expect } from '@playwright/test';
import { gotoSiteReady, openChatbot } from './helpers/site.js';

test('blog uses its bundled assistant styles and opens AssistMe', async ({ page }) => {
  const duplicateRequests = [];
  page.on('request', request => {
    if (/\/ai-assistant(?:-mobile)?\.css(?:\?|$)/.test(request.url())) {
      duplicateRequests.push(request.url());
    }
  });
  await gotoSiteReady(page, '/blog/');
  await openChatbot(page);
  await expect(page.locator('#chatbot-widget')).toBeVisible();
  expect(duplicateRequests).toEqual([]);
});
