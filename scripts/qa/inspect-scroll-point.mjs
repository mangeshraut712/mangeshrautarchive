import http from 'node:http';
import { resolve, extname } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4377;
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

  // Scroll to #about and inspect elements at top-left of the viewport
  await page.evaluate(() => {
    document.querySelector('#about')?.scrollIntoView();
  });
  await page.waitForTimeout(500);

  const elementAtPoint = await page.evaluate(() => {
    // Check points across the top-left area
    const pts = [
      { x: 30, y: 30 },
      { x: 50, y: 50 },
      { x: 80, y: 50 },
    ];
    return pts.map(p => {
      const el = document.elementFromPoint(p.x, p.y);
      return {
        point: p,
        tag: el?.tagName,
        id: el?.id,
        className: el?.className,
        outerHTML: el?.outerHTML?.slice(0, 150),
      };
    });
  });

  console.log('Element at point near #about top-left:', JSON.stringify(elementAtPoint, null, 2));

  await browser.close();
  server.close();
  process.exit(0);
});
