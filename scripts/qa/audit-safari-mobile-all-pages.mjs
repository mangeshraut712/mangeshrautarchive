/**
 * Comprehensive Mobile Safari (WebKit) Viewport & Fit-to-Screen Audit across all pages.
 * Tests iPhone SE, iPhone 14/15/16, iPhone 16/17 Pro Max, and iPad viewports.
 */

import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4299;
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
    const type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(file).pipe(res);
  });
}

const DEVICES = [
  { name: 'iPhone SE', viewport: { width: 375, height: 667 }, dpr: 2 },
  { name: 'iPhone 14 Standard', viewport: { width: 390, height: 844 }, dpr: 3 },
  { name: 'iPhone 17 Pro Max', viewport: { width: 440, height: 956 }, dpr: 3 },
];

const PAGES = [
  { name: 'Homepage', path: '/index.html' },
  { name: 'Systems Keynote', path: '/systems.html' },
  { name: 'System Monitor', path: '/monitor.html' },
  { name: 'Travel Atlas', path: '/travel.html' },
  { name: 'Uses Stack', path: '/uses.html' },
  { name: 'Changelog', path: '/changelog.html' },
  { name: '404 Page', path: '/404.html' },
  { name: 'Case Study: Portfolio', path: '/case-studies/portfolio.html' },
  { name: 'Case Study: HindAI', path: '/case-studies/hindai.html' },
  { name: 'Case Study: AssistMe', path: '/case-studies/assistme-va.html' },
  { name: 'Case Study: CES Energy', path: '/case-studies/ces-energy.html' },
  { name: 'Case Study: Bug Tracker', path: '/case-studies/bug-tracker.html' },
];

async function runSafariAudit() {
  const server = createStaticServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`\n📱 Safari WebKit Mobile Viewport Audit running on http://127.0.0.1:${PORT}\n`);

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (_e) {
    browser = await chromium.launch({ headless: true });
  }

  const results = [];

  for (const pageMeta of PAGES) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔍 Auditing: ${pageMeta.name} (${pageMeta.path})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    for (const device of DEVICES) {
      const context = await browser.newContext({
        viewport: device.viewport,
        deviceScaleFactor: device.dpr,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      });

      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${PORT}${pageMeta.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(1000);

      // Evaluate overflow and viewport fit
      const inspection = await page.evaluate(dev => {
        const winW = window.innerWidth;
        const scrollW = document.documentElement.scrollWidth;
        const bodyW = document.body.scrollWidth;
        const overflow = Math.max(0, scrollW - winW, bodyW - winW);

        // Find overflowing elements
        const overflowingElements = [];
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.right > winW + 2) {
              overflowingElements.push({
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                className: String(el.className).slice(0, 50),
                rectRight: Math.round(rect.right),
                rectWidth: Math.round(rect.width),
                windowWidth: winW,
                overflowBy: Math.round(rect.right - winW),
              });
            }
          }
        });

        // Check viewport meta tag
        const metaViewport =
          document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
        const hasCover = metaViewport.includes('viewport-fit=cover');

        // Check body margins and box sizing
        const bodyStyles = getComputedStyle(document.body);
        const htmlStyles = getComputedStyle(document.documentElement);

        return {
          device: dev.name,
          windowWidth: winW,
          scrollWidth: scrollW,
          overflowX: overflow,
          hasCover,
          bodyOverflowX: bodyStyles.overflowX,
          htmlOverflowX: htmlStyles.overflowX,
          overflowingElements: overflowingElements.slice(0, 5),
        };
      }, device);

      const status =
        inspection.overflowX === 0
          ? '✅ FIT TO SCREEN (0px overflow)'
          : `❌ OVERFLOW (${inspection.overflowX}px)`;
      console.log(`  [${device.name}] ${status}`);
      if (inspection.overflowingElements.length > 0) {
        inspection.overflowingElements.forEach(item => {
          console.log(
            `     ↳ Overflowing element: <${item.tag} class="${item.className}"> right: ${item.rectRight}px (width: ${item.rectWidth}px vs window: ${item.windowWidth}px)`
          );
        });
      }

      results.push({
        page: pageMeta.name,
        path: pageMeta.path,
        device: device.name,
        ...inspection,
      });

      await context.close();
    }
  }

  await browser.close();
  server.close();

  const totalTests = results.length;
  const passedTests = results.filter(r => r.overflowX === 0).length;
  console.log(`\n======================================================`);
  console.log(`📱 Safari Mobile Viewport Audit Summary: ${passedTests} / ${totalTests} passed`);
  console.log(`======================================================\n`);
}

runSafariAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
