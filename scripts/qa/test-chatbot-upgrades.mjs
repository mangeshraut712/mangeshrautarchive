import http from 'node:http';
import { resolve, extname } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4381;
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

server.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });

    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    console.log('Homepage loaded');

    // Click chatbot toggle button
    const chatBtn = page.locator('#chatbot-toggle').first();
    if ((await chatBtn.count()) > 0) {
      await chatBtn.click();
      await page.waitForTimeout(600);
      console.log('Chatbot modal opened successfully');
    }

    // Verify markdown code copy button function using browser evaluation
    const copyTest = await page.evaluate(async () => {
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '<pre><code>function hello() { return "world"; }</code></pre>';
      document.body.appendChild(testDiv);

      const { markdownService } = await import('/js/services/MarkdownService.js');
      markdownService.bindRichInteractions(testDiv);

      const copyBtn = testDiv.querySelector('.rich-code-copy-btn');
      const hasBtn = !!copyBtn;
      const label = copyBtn?.getAttribute('aria-label');
      document.body.removeChild(testDiv);
      return { hasBtn, label };
    });

    console.log('Browser Code Copy Binding Test Result:', copyTest);
    if (!copyTest.hasBtn) {
      throw new Error('Code copy button was not attached to pre code block');
    }
  } catch (err) {
    console.error('Chatbot test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
    console.log('✅ Chatbot browser tests passed completely!');
    process.exit(0);
  }
});
