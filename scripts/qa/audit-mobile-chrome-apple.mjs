import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4150;
const ROOT = path.resolve('dist');

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
  };
  return map[ext] || 'application/octet-stream';
}

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const urlPath = req.url.split('?')[0];
      let relPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
      let filePath = path.join(ROOT, relPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const mime = getMime(filePath);
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(PORT, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

const DEVICES = [
  {
    name: 'iPhone_17_Pro_Max_Chrome',
    width: 440,
    height: 956,
    dpr: 3,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  },
  {
    name: 'Pixel_7_Chrome',
    width: 412,
    height: 915,
    dpr: 2.625,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.135 Mobile Safari/537.36',
  },
  {
    name: 'Small_Mobile_Chrome',
    width: 375,
    height: 667,
    dpr: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  },
];

const PAGES = [
  { name: 'Homepage (All 13 Sections)', path: '/index.html', isIndex: true },
  { name: 'Systems Keynote', path: '/systems.html' },
  { name: 'System Monitor', path: '/monitor.html' },
  { name: 'Travel Atlas', path: '/travel.html' },
  { name: 'Uses / Stack', path: '/uses.html' },
  { name: 'Changelog', path: '/changelog.html' },
  { name: '404 Page', path: '/404.html' },
];

async function runAudit() {
  const server = await startServer();
  console.log(`Server started on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });

  const auditReport = {
    timestamp: new Date().toISOString(),
    devicesAudited: DEVICES.map(d => `${d.name} (${d.width}x${d.height} @${d.dpr}x)`),
    pageAudits: [],
    overallVerdict: 'PASS',
  };

  const outputDir = path.resolve('scratch/mobile_chrome_audit');
  fs.mkdirSync(outputDir, { recursive: true });

  for (const dev of DEVICES) {
    console.log(`\n======================================================`);
    console.log(`📱 AUDITING DEVICE: ${dev.name} (${dev.width}x${dev.height})`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: dev.width, height: dev.height },
      deviceScaleFactor: dev.dpr,
      isMobile: true,
      hasTouch: true,
      userAgent: dev.userAgent,
    });

    const page = await context.newPage();

    for (const p of PAGES) {
      console.log(`\n🔎 Testing: ${p.name} [${p.path}]`);
      await page.goto(`http://127.0.0.1:${PORT}${p.path}`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(800);

      // Hydrate all sections if homepage
      if (p.isIndex) {
        const sections = [
          '#about',
          '#skills',
          '#experience',
          '#education',
          '#projects',
          '#engineering',
          '#publications',
          '#awards',
          '#recommendations',
          '#certifications',
          '#blog',
          '#currently-section',
          '#contact',
        ];
        for (const sel of sections) {
          const el = await page.$(sel);
          if (el) {
            await el.scrollIntoViewIfNeeded();
            await page.waitForTimeout(150);
          }
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
      }

      // Capture full-page screenshot
      const shotPath = path.join(
        outputDir,
        `${p.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dev.name}.png`
      );
      await page.screenshot({ path: shotPath, fullPage: true });

      // Run deep layout audit
      const metrics = await page.evaluate(() => {
        const docEl = document.documentElement;
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const scrollW = docEl.scrollWidth;
        const overflowAmount = Math.max(0, scrollW - winW);

        // Check all major cards, containers, sections
        const elements = document.querySelectorAll(
          'section, article, .card, .lg-glass-card, .systems-keynote-section, .monitor-summary-panel, .experience-card, .education-card, .project-card, .showcase-project-card, .skill-category, .uses-section, .changelog-entry, nav, .hero-layout-wrapper'
        );

        const cardOverflows = [];
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > winW + 2) {
            cardOverflows.push({
              tag: el.tagName.toLowerCase(),
              className: el.className.slice(0, 60),
              width: Math.round(rect.width),
              viewportWidth: winW,
            });
          }
        });

        // Touch target check
        const clickables = document.querySelectorAll(
          'a, button, input[type="button"], input[type="submit"], [role="button"], [role="tab"]'
        );
        let smallTouchTargets = 0;
        const smallTargetsSample = [];
        clickables.forEach(el => {
          // Check only visible elements
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && el.offsetParent !== null) {
            if (rect.width < 32 || rect.height < 32) {
              smallTouchTargets++;
              if (smallTargetsSample.length < 5) {
                smallTargetsSample.push({
                  text: (el.textContent || '').trim().slice(0, 30),
                  tag: el.tagName.toLowerCase(),
                  w: Math.round(rect.width),
                  h: Math.round(rect.height),
                });
              }
            }
          }
        });

        // Font size floor check (<11px)
        const textElements = document.querySelectorAll(
          'p, span, h1, h2, h3, h4, h5, h6, li, a, button'
        );
        let sub11pxCount = 0;
        textElements.forEach(el => {
          if (el.textContent && el.textContent.trim().length > 0 && el.offsetParent !== null) {
            const fs = parseFloat(getComputedStyle(el).fontSize);
            if (fs < 11) {
              sub11pxCount++;
            }
          }
        });

        return {
          viewportWidth: winW,
          viewportHeight: winH,
          scrollWidth: scrollW,
          overflowAmount,
          hasHorizontalScroll: overflowAmount > 2,
          totalCardsAudited: elements.length,
          cardOverflowCount: cardOverflows.length,
          cardOverflowSample: cardOverflows.slice(0, 3),
          totalClickablesAudited: clickables.length,
          smallTouchTargetCount: smallTouchTargets,
          smallTargetsSample,
          sub11pxTextCount: sub11pxCount,
        };
      });

      const passed =
        !metrics.hasHorizontalScroll &&
        metrics.cardOverflowCount === 0 &&
        metrics.sub11pxTextCount === 0;

      console.log(`  - Viewport: ${metrics.viewportWidth}x${metrics.viewportHeight}`);
      console.log(
        `  - Document Width: ${metrics.scrollWidth}px (Overflow: ${metrics.overflowAmount}px)`
      );
      console.log(
        `  - Cards audited: ${metrics.totalCardsAudited} (Card overflows: ${metrics.cardOverflowCount})`
      );
      console.log(`  - Sub-11px fonts: ${metrics.sub11pxTextCount}`);
      console.log(`  - Small touch targets (<32px): ${metrics.smallTouchTargetCount}`);
      console.log(
        `  - Page Layout Verdict: ${passed ? '✅ PASS (Fits Screen Perfectly)' : '⚠️ ATTENTION NEEDED'}`
      );

      auditReport.pageAudits.push({
        device: dev.name,
        viewport: `${dev.width}x${dev.height}`,
        page: p.name,
        path: p.path,
        metrics,
        screenshot: shotPath,
        passed,
      });

      if (!passed) {
        auditReport.overallVerdict = 'NEEDS_REVIEW';
      }
    }

    await context.close();
  }

  await browser.close();
  server.close();

  const reportPath = path.resolve('scratch/mobile_chrome_audit/report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2), 'utf-8');
  console.log(`\n======================================================`);
  console.log(`🎉 Audit Complete. Report written to ${reportPath}`);
  console.log(`Overall Result: ${auditReport.overallVerdict}`);
  console.log(`======================================================\n`);
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
