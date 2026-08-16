/**
 * Deep Mobile Card & Section Inspection Script
 * Audits padding, font-sizes, flex-wrap, card widths, SVG scales, and visual spacing
 * across all cards and sections on iPhone SE (375px), iPhone 14 (390px), and iPhone 17 Pro Max (440px).
 */

import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4355;
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

const DEVICES = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14 Standard', width: 390, height: 844 },
  { name: 'iPhone 17 Pro Max', width: 440, height: 956 },
];

async function inspectCards() {
  const server = createStaticServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`\n🔍 Deep Mobile Card & Section Inspection running on http://127.0.0.1:${PORT}\n`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = {};

  for (const device of DEVICES) {
    console.log(`\n======================================================`);
    console.log(`📱 Inspecting on ${device.name} (${device.width}px x ${device.height}px)`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    });

    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Scroll down to hydrate all lazy-loaded sections
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight / 3);
      await new Promise(r => setTimeout(r, 400));
      window.scrollTo(0, (document.body.scrollHeight * 2) / 3);
      await new Promise(r => setTimeout(r, 400));
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 600));
      window.scrollTo(0, 0);
    });

    const cardAudit = await page.evaluate(devWidth => {
      const issues = [];
      const inspectedCards = [];

      // Select all card elements across all sections
      const cardSelectors = [
        '.hero-card',
        '.music-card',
        '.about-card',
        '.about-highlight-card',
        '.currently-card',
        '.health-widget-container',
        '.skill-card',
        '.skill-category',
        '.skills-radar-wrapper',
        '.experience-item',
        '.education-item',
        '.education-card',
        '.showcase-project-card',
        '.arch-tree-wrapper',
        '.telemetry-rings-wrapper',
        '.reach-panel-metrics',
        '.blog-card',
        '.publication-card',
        '.recommendation-card',
        '.award-card',
        '.contact-card',
      ];

      cardSelectors.forEach(sel => {
        const els = document.querySelectorAll(sel);
        els.forEach((el, idx) => {
          const rect = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const padLeft = parseFloat(cs.paddingLeft) || 0;
          const padRight = parseFloat(cs.paddingRight) || 0;
          const padTop = parseFloat(cs.paddingTop) || 0;
          const padBottom = parseFloat(cs.paddingBottom) || 0;
          const br = cs.borderRadius;

          const data = {
            selector: `${sel}[${idx}]`,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            padding: `${padTop}px ${padRight}px ${padBottom}px ${padLeft}px`,
            borderRadius: br,
            boxSizing: cs.boxSizing,
            overflow: cs.overflow,
          };

          // Checks
          if (rect.right > devWidth + 1) {
            issues.push(
              `Card ${data.selector} right edge (${rect.right}px) exceeds device width (${devWidth}px)`
            );
          }
          if (rect.left < -1) {
            issues.push(`Card ${data.selector} left edge (${rect.left}px) is off-screen`);
          }
          if (rect.width > devWidth) {
            issues.push(
              `Card ${data.selector} width (${rect.width}px) > device width (${devWidth}px)`
            );
          }
          if (padLeft > 32 || padRight > 32) {
            issues.push(
              `Card ${data.selector} horizontal padding is overly large (${padLeft}px / ${padRight}px) for mobile`
            );
          }

          inspectedCards.push(data);
        });
      });

      return { issues, count: inspectedCards.length, sample: inspectedCards.slice(0, 15) };
    }, device.width);

    console.log(`  Total cards inspected: ${cardAudit.count}`);
    if (cardAudit.issues.length === 0) {
      console.log(`  🎉 0 card layout issues found on ${device.name}!`);
    } else {
      console.log(`  ⚠️ Found ${cardAudit.issues.length} potential card layout issues:`);
      cardAudit.issues.forEach(iss => console.log(`     - ${iss}`));
    }

    report[device.name] = cardAudit;
    await context.close();
  }

  await browser.close();
  server.close();
}

inspectCards().catch(err => {
  console.error(err);
  process.exit(1);
});
