import http from 'node:http';
import { resolve, extname } from 'node:path';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4382;
const distDir = resolve(process.cwd(), 'dist');
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  let filePath = resolve(distDir, urlPath.slice(1));
  if (!existsSync(filePath)) {
    filePath = resolve(distDir, 'index.html');
  }
  const ext = extname(filePath);
  const mime = mimeTypes[ext] || 'application/octet-stream';
  try {
    const data = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch (_err) {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const screenshotsDir = resolve(
  '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/agentic_test_run'
);
if (!existsSync(screenshotsDir)) mkdirSync(screenshotsDir, { recursive: true });

server.listen(PORT, async () => {
  console.log(`Deep Interactive Test Server running on port ${PORT}`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  const testResults = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();

    // ── Journey 1: Homepage & Chatbot Open ────────────────────────
    console.log('--- Journey 1: Homepage & Chatbot Launcher ---');
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const chatToggle = page.locator('#chatbot-toggle');
    await chatToggle.click();
    await page.waitForTimeout(600);

    const chatWidget = page.locator('#chatbot-widget');
    const isWidgetVisible = await chatWidget.isVisible();
    console.log(`Chat widget visible: ${isWidgetVisible}`);
    await page.screenshot({ path: resolve(screenshotsDir, '01_chatbot_opened.png') });
    testResults.push({ name: 'Chatbot Launcher Open', passed: isWidgetVisible });

    // ── Journey 2: Chatbot Local Answer & Markdown Code Copy ──────
    console.log('--- Journey 2: Chatbot Markdown Code Copy Testing ---');
    const codeRenderTest = await page.evaluate(async () => {
      const messagesContainer = document.getElementById('chatbot-messages');
      if (!messagesContainer) return { success: false, reason: 'No messages container' };

      const testMsg = document.createElement('div');
      testMsg.className = 'message assistant-message';
      testMsg.innerHTML = `
        <div class="message-content">
          <p>Here is an example Python FastAPI route:</p>
          <pre><code class="language-python">@router.get("/api/health")
async def health_check():
    return {"status": "healthy", "uptime": "99.99%"}</code></pre>
        </div>
      `;
      messagesContainer.appendChild(testMsg);

      const { markdownService } = await import('/js/services/MarkdownService.js');
      markdownService.bindRichInteractions(testMsg);

      const copyBtn = testMsg.querySelector('.rich-code-copy-btn');
      return {
        success: !!copyBtn,
        hasCopyBtn: !!copyBtn,
        btnText: copyBtn?.innerText || '',
      };
    });

    console.log('Code copy render test:', codeRenderTest);
    await page.screenshot({ path: resolve(screenshotsDir, '02_chatbot_code_block_copy.png') });
    testResults.push({
      name: 'Markdown Code Block Copy Button Attachment',
      passed: codeRenderTest.success,
    });

    // Click the copy button in browser
    const copyButton = page.locator('.rich-code-copy-btn').first();
    if ((await copyButton.count()) > 0) {
      await copyButton.click();
      await page.waitForTimeout(300);
      const isCopied = await copyButton.evaluate(el => el.classList.contains('copied'));
      console.log(`Copy button clicked and animated: ${isCopied}`);
      await page.screenshot({ path: resolve(screenshotsDir, '03_chatbot_code_copied_state.png') });
      testResults.push({ name: 'Code Copy Button Click Feedback', passed: isCopied });
    }

    // ── Journey 3: Subpages Navigation & Visual Integrity ─────────
    const subpages = [
      { url: '/changelog.html', name: '04_subpage_changelog', title: 'Changelog Page' },
      { url: '/systems.html', name: '05_subpage_systems', title: 'Systems Page' },
      { url: '/monitor.html', name: '06_subpage_monitor', title: 'Monitor Page' },
      { url: '/travel.html', name: '07_subpage_travel', title: 'Travel Atlas Page' },
      { url: '/uses.html', name: '08_subpage_uses', title: 'Uses Stack Page' },
    ];

    for (const sub of subpages) {
      console.log(`--- Journey: Auditing ${sub.title} ---`);
      await page.goto(`http://127.0.0.1:${PORT}${sub.url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      // Verify no horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      console.log(`${sub.title} overflow: ${overflow}`);
      await page.screenshot({ path: resolve(screenshotsDir, `${sub.name}.png`) });
      testResults.push({ name: `${sub.title} Render & 0px Overflow`, passed: !overflow });
    }

    // ── Journey 4: Mobile Viewport Full Run (iPhone 14) ───────────
    console.log('--- Journey: Mobile Viewport Testing (iPhone 14) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(800);

    const mobileToggle = mobilePage.locator('#chatbot-toggle');
    await mobileToggle.click();
    await mobilePage.waitForTimeout(600);

    const mobileOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    console.log(`Mobile Chatbot sheet overflow: ${mobileOverflow}`);
    await mobilePage.screenshot({ path: resolve(screenshotsDir, '09_mobile_chatbot_sheet.png') });
    testResults.push({ name: 'Mobile Chatbot Sheet Responsive Layout', passed: !mobileOverflow });
  } catch (err) {
    console.error('Interactive test error:', err);
  } finally {
    await browser.close();
    server.close();

    console.log('\n================ TEST RESULTS ================');
    console.table(testResults);
    const allPassed = testResults.every(r => r.passed);
    console.log(`Overall Result: ${allPassed ? 'ALL PASSED ✅' : 'SOME FAILED ❌'}`);
    process.exit(allPassed ? 0 : 1);
  }
});
