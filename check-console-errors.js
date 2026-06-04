import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Listen to console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    // Exclude extension or external noise if possible, but keep local errors
    if (type === 'error' || type === 'warning' || type === 'warn') {
      console.log(`[Browser ${type.toUpperCase()}] ${text}`);
    }
  });

  // Track 404 responses
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });

  page.on('pageerror', exception => {
    console.log(`[Unhandled Exception] ${exception.message}`);
  });

  console.log('--- Auditing Homepage ---');
  await page.goto('http://127.0.0.1:4000/', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  // Click chatbot to toggle
  console.log('Toggling Chatbot on Homepage...');
  const chatToggle = page
    .locator('#chatbot-toggle, #chat-toggle, [aria-label="Toggle chat"]')
    .first();
  if ((await chatToggle.count()) > 0) {
    await chatToggle.click();
    await page.waitForTimeout(2000);
  }

  console.log('--- Auditing Travel Page ---');
  await page.goto('http://127.0.0.1:4000/travel', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  console.log('--- Auditing Monitor Page ---');
  await page.goto('http://127.0.0.1:4000/monitor', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  await browser.close();
  console.log('--- Audit Completed ---');
}

run().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
