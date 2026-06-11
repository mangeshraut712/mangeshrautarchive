import { chromium, devices } from '@playwright/test';
import { join } from 'path';
import { exec } from 'child_process';

function startServer() {
  return new Promise((resolve, reject) => {
    const serverProcess = exec('PORT=4195 node scripts/utils/serve-dist.js');
    let output = '';
    
    serverProcess.stdout.on('data', data => {
      output += data;
      if (output.includes('Production static server running')) {
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on('data', data => {
      console.error('Server error:', data);
    });

    setTimeout(() => {
      reject(new Error('Server start timed out'));
    }, 5000);
  });
}

async function run() {
  console.log('Starting local serve-dist server on port 4195...');
  const serverProcess = await startServer();
  console.log('Server started successfully.');

  const pixel7 = devices['Pixel 7'];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...pixel7,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
  });
  const page = await context.newPage();
  const artifactsDir = '/Users/mangeshraut/.gemini/antigravity/brain/331c76eb-8f70-425a-84cc-f9badb8d7d88/';

  try {
    console.log('Navigating to http://127.0.0.1:4195/...');
    await page.goto('http://127.0.0.1:4195/', { waitUntil: 'networkidle' });

    // Wait for basic rendering & fonts
    await page.waitForTimeout(2000);

    // 1. Verify chatbot toggle visibility and positioning
    const chatbot = page.locator('#chatbot-toggle');
    const a11y = page.locator('.a11y-toolbar');

    if (await chatbot.count() > 0) {
      console.log('✓ Chatbot toggle found.');
      const box = await chatbot.boundingBox();
      console.log(`Chatbot Toggle Box: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);
    } else {
      console.log('✗ Error: Chatbot toggle not found.');
    }

    if (await a11y.count() > 0) {
      console.log('✓ Accessibility toolbar found.');
      const box = await a11y.boundingBox();
      console.log(`Accessibility Toolbar Box: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);
    } else {
      console.log('✗ Error: Accessibility toolbar not found.');
    }

    // Take screenshot of the top hero view showing no button overlays
    const topViewScreenshot = 'chrome_mobile_top_view.png';
    await page.screenshot({ path: join(artifactsDir, topViewScreenshot) });
    console.log(`Saved screenshot: ${topViewScreenshot}`);

    // Scroll down slightly and take another screenshot to show floating bottom buttons
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    const scrollScreenshot = 'chrome_mobile_scrolled.png';
    await page.screenshot({ path: join(artifactsDir, scrollScreenshot) });
    console.log(`Saved screenshot: ${scrollScreenshot}`);

  } catch (err) {
    console.error('Mobile viewport test failed:', err);
  } finally {
    await browser.close();
    serverProcess.kill('SIGINT');
    console.log('Server process terminated.');
  }
}

run().catch(err => {
  console.error('Runner failed:', err);
  process.exit(1);
});
