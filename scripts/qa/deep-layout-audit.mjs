import http from 'node:http';
import { resolve, extname } from 'node:path';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4370;
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
  console.log(`Auditor server listening on port ${PORT}`);
  const artifactsDir = resolve(process.cwd(), '.tempmediaStorage/deep_audit');
  if (!existsSync(artifactsDir)) mkdirSync(artifactsDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const auditReport = [];

  try {
    const viewports = [
      { name: 'iPhone_14_Safari', width: 390, height: 844, isMobile: true },
      { name: 'iPhone_SE_Safari', width: 375, height: 667, isMobile: true },
      { name: 'iPhone_17_Pro_Max', width: 440, height: 956, isMobile: true },
      { name: 'Desktop_Mac_Chrome', width: 1280, height: 900, isMobile: false },
    ];

    const pages = [
      { path: '/', name: 'home' },
      { path: '/systems.html', name: 'systems' },
      { path: '/monitor.html', name: 'monitor' },
      { path: '/travel.html', name: 'travel' },
      { path: '/uses.html', name: 'uses' },
      { path: '/changelog.html', name: 'changelog' },
      { path: '/404.html', name: '404' },
    ];

    for (const vp of viewports) {
      console.log(`\n========================================`);
      console.log(`📱 Auditing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: vp.isMobile
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
          : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      });
      const page = await context.newPage();

      for (const p of pages) {
        await page.goto(`http://127.0.0.1:${PORT}${p.path}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);

        // Check horizontal overflow
        const overflowDetails = await page.evaluate(() => {
          const docW = document.documentElement.scrollWidth;
          const winW = window.innerWidth;
          const hasOverflow = docW > winW + 1;

          const overflowingElements = [];
          if (hasOverflow) {
            document.querySelectorAll('*').forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.right > winW + 1) {
                overflowingElements.push({
                  tag: el.tagName.toLowerCase(),
                  id: el.id || '',
                  className: String(el.className || '').slice(0, 50),
                  rectRight: rect.right,
                  rectWidth: rect.width,
                });
              }
            });
          }
          return { hasOverflow, docW, winW, overflowingElements: overflowingElements.slice(0, 5) };
        });

        // Check for card overlaps on this page
        const overlapIssues = await page.evaluate(() => {
          const cards = Array.from(
            document.querySelectorAll(
              '.apple-card, .squircle-card, .project-card, .experience-card, .education-card, .certification-card, .blog-card, .publication-card, .award-card, .recommendation-card, .currently-card, .music-card'
            )
          );
          const overlaps = [];
          for (let i = 0; i < cards.length; i++) {
            const rA = cards[i].getBoundingClientRect();
            if (rA.width === 0 || rA.height === 0) continue;
            for (let j = i + 1; j < cards.length; j++) {
              const rB = cards[j].getBoundingClientRect();
              if (rB.width === 0 || rB.height === 0) continue;
              // Check if they overlap significantly without parent-child relationship
              if (cards[i].contains(cards[j]) || cards[j].contains(cards[i])) continue;

              const isOverlap = !(
                rA.right <= rB.left ||
                rA.left >= rB.right ||
                rA.bottom <= rB.top ||
                rA.top >= rB.bottom
              );

              if (isOverlap) {
                overlaps.push({
                  cardA: `${cards[i].tagName}.${cards[i].className.slice(0, 30)}`,
                  cardB: `${cards[j].tagName}.${cards[j].className.slice(0, 30)}`,
                  rA: { top: rA.top, bottom: rA.bottom, left: rA.left, right: rA.right },
                  rB: { top: rB.top, bottom: rB.bottom, left: rB.left, right: rB.right },
                });
              }
            }
          }
          return overlaps;
        });

        console.log(
          `Page ${p.name}: Overflow = ${overflowDetails.hasOverflow ? '❌ YES' : '✅ NO'} (doc: ${overflowDetails.docW}px, win: ${overflowDetails.winW}px), Overlaps = ${overlapIssues.length}`
        );

        auditReport.push({
          viewport: vp.name,
          page: p.name,
          overflow: overflowDetails,
          overlaps: overlapIssues,
        });

        // Capture full page screenshot for review
        const screenshotPath = resolve(artifactsDir, `${p.name}_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      // If homepage on iPhone 14, capture section-by-section screenshots
      if (vp.name === 'iPhone_14_Safari') {
        await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);

        const sections = [
          '#home',
          '#about',
          '#currently-section',
          '#skills',
          '#experience',
          '#education',
          '#projects',
          '#engineering',
          '#blog',
          '#publications',
          '#recommendations',
          '#awards',
          '#contact',
        ];

        for (const secSelector of sections) {
          const sec = page.locator(secSelector);
          if (await sec.isVisible()) {
            const secName = secSelector.replace('#', '');
            const secShotPath = resolve(artifactsDir, `section_${secName}_iPhone14.png`);
            await sec.screenshot({ path: secShotPath });
            console.log(`  📸 Captured section: ${secName}`);
          }
        }
      }

      await context.close();
    }

    writeFileSync(
      resolve(artifactsDir, 'audit_summary.json'),
      JSON.stringify(auditReport, null, 2)
    );
    console.log(
      `\nAudit complete. Summary written to .tempmediaStorage/deep_audit/audit_summary.json`
    );
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
