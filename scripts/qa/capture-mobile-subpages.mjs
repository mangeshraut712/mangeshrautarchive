/**
 * Capture Mobile Subpages Screenshot Script
 * Audits systems, monitor, travel, uses, changelog, 404 on iPhone 14 (390px).
 */

import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4357;
const DIST = path.resolve(process.cwd(), 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function createStaticServer() {
  return http.createServer((req, res) => {
    let pathname = decodeURIComponent(req.url.split('?')[0]);
    if (pathname === '/' || pathname === '') pathname = '/index.html';
    let file = path.join(DIST, pathname);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

async function captureSubpages() {
  const server = createStaticServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  const outDir = path.resolve(
    '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/scratch/mobile_subpages'
  );
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });

  const pages = [
    { url: '/systems.html', name: 'systems_mobile' },
    { url: '/monitor.html', name: 'monitor_mobile' },
    { url: '/travel.html', name: 'travel_mobile' },
    { url: '/uses.html', name: 'uses_mobile' },
    { url: '/changelog.html', name: 'changelog_mobile' },
    { url: '/404.html', name: '404_mobile' },
  ];

  for (const p of pages) {
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${PORT}${p.url}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const imgPath = path.join(outDir, `${p.name}.png`);
    await page.screenshot({ path: imgPath, fullPage: false });
    console.log(`📸 Captured: ${p.name}.png`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log(`\n✨ All mobile subpage screenshots saved to ${outDir}`);
}

captureSubpages().catch(err => {
  console.error(err);
  process.exit(1);
});
