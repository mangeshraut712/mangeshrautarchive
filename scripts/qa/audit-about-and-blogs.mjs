import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../');
const ARTIFACTS_DIR =
  '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/about_and_blog_audit';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function runAudit() {
  console.log('Starting static server for visual audit...');
  const server = spawn('python3', ['-m', 'http.server', '4123', '--directory', 'dist'], {
    cwd: ROOT,
    stdio: 'ignore',
  });

  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to http://127.0.0.1:4123/#about...');
    await page.goto('http://127.0.0.1:4123/#about', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const aboutSection = page.locator('#about');
    await aboutSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // 1. Desktop Light - Full Story
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, '01_desktop_light_about_full_story.png'),
    });
    console.log('Saved 01_desktop_light_about_full_story.png');

    // 2. Desktop Light - Quick Summary Tab Switch
    const quickSummaryBtn = page.locator('#tab-quick-summary');
    await quickSummaryBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, '02_desktop_light_about_quick_summary.png'),
    });
    console.log('Saved 02_desktop_light_about_quick_summary.png');

    // 3. Desktop Dark Mode - Quick Summary
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, '03_desktop_dark_about_quick_summary.png'),
    });
    console.log('Saved 03_desktop_dark_about_quick_summary.png');

    // 4. Desktop Dark Mode - Full Story
    const fullStoryBtn = page.locator('#tab-full-story');
    await fullStoryBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, '04_desktop_dark_about_full_story.png'),
    });
    console.log('Saved 04_desktop_dark_about_full_story.png');

    // 5. Blog Section & Light Mode Article Modal Inspection
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.waitForTimeout(300);

    const blogSection = page.locator('#blog');
    if ((await blogSection.count()) > 0) {
      await blogSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, '05_blog_section_cards_light.png'),
      });
      console.log('Saved 05_blog_section_cards_light.png');

      // Click the first article preview button
      const firstBlogOpenBtn = page.locator('.blog-preview-btn').first();
      if ((await firstBlogOpenBtn.count()) > 0) {
        await firstBlogOpenBtn.click();
        await page.waitForTimeout(600);
        await page.screenshot({
          path: path.join(ARTIFACTS_DIR, '08_desktop_light_blog_modal_opened.png'),
        });
        console.log('Saved 08_desktop_light_blog_modal_opened.png');

        // Scroll modal down to code block
        const codeBlock = page.locator('.article-code-wrap, pre').first();
        if ((await codeBlock.count()) > 0) {
          await codeBlock.scrollIntoViewIfNeeded();
          await page.waitForTimeout(400);
        }
        await page.screenshot({
          path: path.join(ARTIFACTS_DIR, '09_desktop_light_blog_code_block_contrast.png'),
        });
        console.log('Saved 09_desktop_light_blog_code_block_contrast.png');

        // Test in Dark Mode too
        await page.evaluate(() => document.documentElement.classList.add('dark'));
        await page.waitForTimeout(300);
        await page.screenshot({
          path: path.join(ARTIFACTS_DIR, '10_desktop_dark_blog_code_block_contrast.png'),
        });
        console.log('Saved 10_desktop_dark_blog_code_block_contrast.png');

        // Close modal
        const closeBtn = page.locator('.blog-modal-close');
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 6. Mobile 390px Viewport - Full Story & Quick Summary
    await page.setViewportSize({ width: 390, height: 844 });
    await aboutSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, '06_mobile_about_full_story.png'),
    });
    console.log('Saved 06_mobile_about_full_story.png');

    await quickSummaryBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, '07_mobile_about_quick_summary.png'),
    });
    console.log('Saved 07_mobile_about_quick_summary.png');
  } finally {
    await browser.close();
    server.kill();
  }
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
