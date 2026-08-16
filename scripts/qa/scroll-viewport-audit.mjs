import http from 'node:http';
import { resolve, extname } from 'node:path';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4380;
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
  console.log(`Server running on port ${PORT}`);
  const artifactsDir = resolve(process.cwd(), '.tempmediaStorage/scroll_audit');
  if (!existsSync(artifactsDir)) mkdirSync(artifactsDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Scroll smoothly through entire page to hydrate all sections
    const totalHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`Total page height: ${totalHeight}px`);

    const sections = [
      { id: '#home', name: '01_hero' },
      { id: '#about', name: '02_about' },
      { id: '#currently-section', name: '03_currently' },
      { id: '#skills', name: '04_skills' },
      { id: '#engineering', name: '05_engineering' },
      { id: '#experience', name: '06_experience' },
      { id: '#education', name: '07_education' },
      { id: '#projects', name: '08_projects' },
      { id: '#blog', name: '09_blog' },
      { id: '#publications', name: '10_publications' },
      { id: '#recommendations', name: '11_recommendations' },
      { id: '#awards', name: '12_awards' },
      { id: '#contact', name: '13_contact' },
    ];

    for (const sec of sections) {
      await page.evaluate(selector => {
        const el = document.querySelector(selector);
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, sec.id);
      await page.waitForTimeout(600);

      // Check for horizontal overflow at this scroll position
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      // Capture genuine viewport screenshot (what the user actually sees on screen)
      const shotPath = resolve(artifactsDir, `${sec.name}_viewport.png`);
      await page.screenshot({ path: shotPath });
      console.log(`Captured ${sec.name} (overflow: ${overflow})`);
    }

    // Now audit other subpages as well
    const subpages = [
      { path: '/systems.html', name: 'systems' },
      { path: '/monitor.html', name: 'monitor' },
      { path: '/travel.html', name: 'travel' },
      { path: '/uses.html', name: 'uses' },
      { path: '/changelog.html', name: 'changelog' },
      { path: '/404.html', name: '404' },
    ];

    for (const sub of subpages) {
      await page.goto(`http://127.0.0.1:${PORT}${sub.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const shotPath = resolve(artifactsDir, `page_${sub.name}_viewport.png`);
      await page.screenshot({ path: shotPath });
      console.log(`Captured subpage: ${sub.name}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
