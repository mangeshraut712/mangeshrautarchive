import { test, expect } from '@playwright/test';
import { gotoSite, openChatbot } from './helpers/site.js';

test('Contact loads its calendar when the calendar approaches the viewport', async ({ page }) => {
  const calendarRequests = [];
  page.on('request', request => {
    if (/\/modules\/calendar\.js(?:\?|$)/.test(request.url())) calendarRequests.push(request.url());
  });
  await gotoSite(page, '/#contact');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1500);
  expect(calendarRequests).toHaveLength(0);
  await page.keyboard.press('PageDown');
  await page.locator('#calendar-widget').scrollIntoViewIfNeeded();
  await expect.poll(() => calendarRequests.length).toBeGreaterThan(0);
  await expect(page.locator('#calendar-widget button.day-cell').first()).toBeVisible();
});

test('Contact keeps AssistMe available without loading it just for the section', async ({
  page,
}) => {
  const chatbotRequests = [];
  page.on('request', request => {
    if (/\/modules\/chatbot\.js(?:\?|$)/.test(request.url())) chatbotRequests.push(request.url());
  });
  await gotoSite(page, '/#contact');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1500);
  expect(chatbotRequests).toHaveLength(0);
  await openChatbot(page);
  await expect.poll(() => chatbotRequests.length).toBeGreaterThan(0);
  await expect(page.locator('#chatbot-widget')).toBeVisible();
});

test('Contact world clocks remain available independently of the calendar module', async ({
  page,
}) => {
  await page.route('**/modules/calendar.js?*', route => route.abort());
  await gotoSite(page, '/#contact');
  await page.waitForFunction(() => window.__smartNavbarInitialized === true);
  await page.keyboard.press('PageDown');
  await page.locator('#contact-world-clocks').scrollIntoViewIfNeeded();
  await expect(page.locator('.world-clock:visible')).toHaveCount(3);
  await page.getByRole('button', { name: 'View 3 more clocks' }).click();
  await expect(page.locator('.world-clock:visible')).toHaveCount(6);
});
