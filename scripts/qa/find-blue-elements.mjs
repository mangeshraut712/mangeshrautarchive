import http from 'node:http';
import { resolve, extname } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4375;
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
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const culprits = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      const isBlue =
        bg.includes('0, 113, 227') ||
        bg.includes('10, 132, 255') ||
        bg.includes('0, 122, 255') ||
        bg === 'rgb(0, 113, 227)' ||
        bg === 'rgb(0, 122, 255)';
      if (isBlue) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 20 && rect.height > 20) {
          results.push({
            tag: el.tagName,
            id: el.id,
            className: typeof el.className === 'string' ? el.className : '',
            rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
            position: style.position,
            zIndex: style.zIndex,
            parent:
              el.parentElement?.tagName +
              '.' +
              (typeof el.parentElement?.className === 'string' ? el.parentElement.className : ''),
          });
        }
      }
    });
    return results;
  });

  console.log('Blue elements found:', JSON.stringify(culprits, null, 2));
  await browser.close();
  server.close();
  process.exit(0);
});
