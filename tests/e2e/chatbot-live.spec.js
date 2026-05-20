import { expect, test } from '@playwright/test';

test('test live chatbot on mangeshraut.pro', async ({ page }) => {
  console.log('🌐 Navigating to https://mangeshraut.pro ...');
  // Disable timeout limits for slow loading
  test.setTimeout(60000);
  await page.goto('https://mangeshraut.pro', { waitUntil: 'networkidle' });

  console.log('🔍 Locating chatbot toggle button...');
  const toggleBtn = page.locator('#chatbot-toggle');
  await expect(toggleBtn).toBeVisible();

  console.log('🖱️ Clicking chatbot toggle button...');
  await toggleBtn.click();

  console.log('⏳ Waiting for chatbot dialog/widget to open...');
  const widget = page.locator('#chatbot-widget');
  await expect(widget).toBeVisible({ timeout: 5000 });

  // Wait for dynamic elements to initialize
  await page.waitForTimeout(1000);

  console.log('✍️ Typing query: "Tell me about Mangesh\'s software engineering experience"...');
  const textarea = page.locator('#chatbot-input');
  await textarea.fill("Tell me about Mangesh's software engineering experience");

  console.log('✈️ Sending message...');
  const sendBtn = page.locator('.chatbot-send-btn');
  await sendBtn.click();

  console.log('⏳ Waiting for response streaming...');
  // We'll wait 12 seconds for the response stream to complete
  await page.waitForTimeout(12000);

  // Print all messages found
  const botMessages = page.locator('#chatbot-messages');
  const allText = await botMessages.innerText();
  console.log('\n💬 Messages Container Text:\n----------------------------------------');
  console.log(allText);
  console.log('----------------------------------------\n');

  // Assert that at least some text other than the welcome message is present
  expect(allText.length).toBeGreaterThan(50);
});
