// Global setup for Playwright tests in CI environment
import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🔧 Setting up Playwright test environment for CI...');

  // Optimize browser launch for CI
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-dev-shm-usage', // Prevents memory issues in CI
      '--disable-gpu', // Disable GPU acceleration
      '--no-sandbox', // Required for CI environments
      '--disable-setuid-sandbox',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--memory-pressure-off',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // Reduce resource pressure
    serviceWorkers: 'block',
    permissions: [],
  });

  // Warm up browser and close
  const page = await context.newPage();
  await page.goto('about:blank');
  await context.close();
  await browser.close();

  console.log('✅ Playwright test environment setup complete');
}

export default globalSetup;
