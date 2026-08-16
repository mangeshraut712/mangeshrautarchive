/**
 * Mobile Section Screenshot Script
 * Takes high-res screenshots of every major section on iPhone 14 (390px)
 * to visually verify luxury card aesthetics, spacing, typography, and layout.
 */

import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4356;
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

async function captureSections() {
  const server = createStaticServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  const outDir = path.resolve(
    '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/scratch/mobile_sections'
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

  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Scroll to hydrate all sections
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight / 3);
    await new Promise(r => setTimeout(r, 300));
    window.scrollTo(0, (document.body.scrollHeight * 2) / 3);
    await new Promise(r => setTimeout(r, 300));
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 500));
    window.scrollTo(0, 0);
  });

  const sections = [
    { id: 'home', name: '01_hero' },
    { id: 'about', name: '02_about' },
    { id: 'currently-section', name: '03_currently' },
    { id: 'skills', name: '04_skills_radar' },
    { id: 'experience', name: '05_experience' },
    { id: 'education', name: '06_education' },
    { id: 'projects', name: '07_projects' },
    { id: 'engineering', name: '08_architecture_tree' },
    { id: 'reach', name: '09_telemetry_rings' },
    { id: 'blog', name: '10_blog' },
    { id: 'publications', name: '11_publications' },
    { id: 'recommendations', name: '12_recommendations' },
    { id: 'awards', name: '13_awards' },
    { id: 'contact', name: '14_contact' },
  ];

  for (const sec of sections) {
    const el = await page.$(`#${sec.id}`);
    if (el) {
      const imgPath = path.join(outDir, `${sec.name}.png`);
      await el.screenshot({ path: imgPath });
      console.log(`📸 Captured: ${sec.name}.png`);
    }
  }

  await browser.close();
  server.close();
  console.log(`\n✨ All section screenshots saved to ${outDir}`);
}

captureSections().catch(err => {
  console.error(err);
  process.exit(1);
});
