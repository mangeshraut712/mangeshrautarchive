/**
 * Test Disclosure Behavior Script
 * Validates that Competency Matrix & Radar and System Topology Tree
 * are hidden by default and expand/collapse cleanly on View More click.
 */

import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4359;
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

async function run() {
  const server = createStaticServer();
  await new Promise(resolve => server.listen(PORT, resolve));

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });

  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('--- 1. Testing Initial Hidden State ---');
  const radarHidden = await page.$eval('#skills-radar-container', el => el.hasAttribute('hidden'));
  const archHidden = await page.$eval('#architecture-tree-container', el =>
    el.hasAttribute('hidden')
  );

  console.log(`Skills Radar hidden initially: ${radarHidden}`);
  console.log(`Architecture Tree hidden initially: ${archHidden}`);

  if (!radarHidden || !archHidden) {
    throw new Error('Expected both widgets to be hidden initially');
  }

  console.log('\n--- 2. Testing Skills Radar Expansion ---');
  await page.click('#skills-radar-toggle-btn');
  await page.waitForTimeout(500);

  const radarExpandedAttr = await page.$eval('#skills-radar-toggle-btn', el =>
    el.getAttribute('aria-expanded')
  );
  const radarNowHidden = await page.$eval('#skills-radar-container', el =>
    el.hasAttribute('hidden')
  );
  const radarBtnText = await page.$eval('#skills-radar-toggle-btn .btn-text', el =>
    el.textContent.trim()
  );

  console.log(`Radar expanded attr: ${radarExpandedAttr}`);
  console.log(`Radar hidden attr now: ${radarNowHidden}`);
  console.log(`Radar button text: "${radarBtnText}"`);

  if (radarExpandedAttr !== 'true' || radarNowHidden || !radarBtnText.includes('Hide')) {
    throw new Error('Radar expansion failed');
  }

  console.log('\n--- 3. Testing Skills Radar Collapse ---');
  await page.click('#skills-radar-toggle-btn');
  await page.waitForTimeout(500);

  const radarCollapsedHidden = await page.$eval('#skills-radar-container', el =>
    el.hasAttribute('hidden')
  );
  const radarResetText = await page.$eval('#skills-radar-toggle-btn .btn-text', el =>
    el.textContent.trim()
  );

  console.log(`Radar hidden after collapse: ${radarCollapsedHidden}`);
  console.log(`Radar button text after collapse: "${radarResetText}"`);

  if (!radarCollapsedHidden || !radarResetText.includes('View')) {
    throw new Error('Radar collapse failed');
  }

  console.log('\n--- 4. Testing Architecture Tree Expansion ---');
  await page.click('#arch-tree-toggle-btn');
  await page.waitForTimeout(500);

  const archExpandedAttr = await page.$eval('#arch-tree-toggle-btn', el =>
    el.getAttribute('aria-expanded')
  );
  const archNowHidden = await page.$eval('#architecture-tree-container', el =>
    el.hasAttribute('hidden')
  );
  const archBtnText = await page.$eval('#arch-tree-toggle-btn .btn-text', el =>
    el.textContent.trim()
  );

  console.log(`Arch tree expanded attr: ${archExpandedAttr}`);
  console.log(`Arch tree hidden attr now: ${archNowHidden}`);
  console.log(`Arch tree button text: "${archBtnText}"`);

  if (archExpandedAttr !== 'true' || archNowHidden || !archBtnText.includes('Hide')) {
    throw new Error('Arch tree expansion failed');
  }

  console.log('\n--- 5. Testing Architecture Tree Collapse ---');
  await page.click('#arch-tree-toggle-btn');
  await page.waitForTimeout(500);

  const archCollapsedHidden = await page.$eval('#architecture-tree-container', el =>
    el.hasAttribute('hidden')
  );
  const archResetText = await page.$eval('#arch-tree-toggle-btn .btn-text', el =>
    el.textContent.trim()
  );

  console.log(`Arch tree hidden after collapse: ${archCollapsedHidden}`);
  console.log(`Arch tree button text after collapse: "${archResetText}"`);

  if (!archCollapsedHidden || !archResetText.includes('View')) {
    throw new Error('Arch tree collapse failed');
  }

  console.log('\n🎉 ALL DISCLOSURE BEHAVIOR TESTS PASSED (5/5)!');

  await browser.close();
  server.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
