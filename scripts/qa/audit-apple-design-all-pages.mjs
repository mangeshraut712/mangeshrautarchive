import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4225;
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

const PAGES = [
  { name: 'Homepage', path: '/index.html', category: 'Core' },
  { name: 'Systems Keynote', path: '/systems.html', category: 'Core' },
  { name: 'System Monitor', path: '/monitor.html', category: 'Core' },
  { name: 'Travel Atlas', path: '/travel.html', category: 'Feature' },
  { name: 'Uses Stack', path: '/uses.html', category: 'Feature' },
  { name: 'Changelog', path: '/changelog.html', category: 'Feature' },
  { name: '404 Page', path: '/404.html', category: 'Utility' },
  { name: 'Offline Page', path: '/offline.html', category: 'Utility' },
  { name: 'Case Study: Portfolio', path: '/case-studies/portfolio.html', category: 'Case Study' },
  { name: 'Case Study: HindAI', path: '/case-studies/hindai.html', category: 'Case Study' },
  { name: 'Case Study: AssistMe', path: '/case-studies/assistme-va.html', category: 'Case Study' },
  { name: 'Case Study: CES Energy', path: '/case-studies/ces-energy.html', category: 'Case Study' },
  {
    name: 'Case Study: Bug Tracker',
    path: '/case-studies/bug-tracker.html',
    category: 'Case Study',
  },
];

async function runDesignAudit() {
  const server = await startServer();
  console.log(`Static server listening on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  const outputDir = path.resolve('scratch/apple_design_audit');
  fs.mkdirSync(outputDir, { recursive: true });

  const auditReport = [];

  for (const pageInfo of PAGES) {
    console.log(`\n======================================================`);
    console.log(`🎨 Auditing: ${pageInfo.name} (${pageInfo.path})`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });

    const page = await context.newPage();
    const url = `http://127.0.0.1:${PORT}${pageInfo.path}`;

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(600);

      // Evaluate Light Mode Design Metrics
      const lightMetrics = await evaluatePageDesign(page);

      // Screenshot Light
      const lightShot = path.join(
        outputDir,
        `${pageInfo.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Light.png`
      );
      await page.screenshot({ path: lightShot, fullPage: true });

      // Toggle Dark Mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      });
      await page.waitForTimeout(400);

      // Evaluate Dark Mode Design Metrics
      const darkMetrics = await evaluatePageDesign(page);

      // Screenshot Dark
      const darkShot = path.join(
        outputDir,
        `${pageInfo.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Dark.png`
      );
      await page.screenshot({ path: darkShot, fullPage: true });

      const pageVerdict = computePageVerdict(lightMetrics, darkMetrics);

      console.log(`  - Visual Alignment Score: ${pageVerdict.appleScore}/100`);
      console.log(`  - Apple Design Verdict: ${pageVerdict.status}`);
      if (pageVerdict.findings.length > 0) {
        console.log(`  - Findings / Opportunities for Polish:`);
        pageVerdict.findings.forEach(f => console.log(`    • ${f}`));
      }

      auditReport.push({
        name: pageInfo.name,
        path: pageInfo.path,
        category: pageInfo.category,
        appleScore: pageVerdict.appleScore,
        status: pageVerdict.status,
        findings: pageVerdict.findings,
        recommendations: pageVerdict.recommendations,
        lightMetrics,
        darkMetrics,
        screenshots: { light: lightShot, dark: darkShot },
      });
    } catch (err) {
      console.error(`  ❌ Error auditing ${pageInfo.name}:`, err.message);
      auditReport.push({
        name: pageInfo.name,
        path: pageInfo.path,
        category: pageInfo.category,
        appleScore: 0,
        status: 'ERROR',
        findings: [`Load error: ${err.message}`],
        recommendations: ['Check file existence and routing.'],
      });
    }

    await context.close();
  }

  await browser.close();
  server.close();

  const reportPath = path.resolve('scratch/apple_design_audit/design_audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2), 'utf-8');
  console.log(`\n======================================================`);
  console.log(`🎉 Design Audit Complete! Saved to: ${reportPath}`);
  console.log(`======================================================\n`);
}

async function evaluatePageDesign(page) {
  return await page.evaluate(() => {
    const bodyStyles = getComputedStyle(document.body);

    // 1. Typography Inspection
    const headings = document.querySelectorAll('h1, h2, h3');
    const fontFamilies = new Set();
    headings.forEach(h => {
      const ff = getComputedStyle(h).fontFamily.toLowerCase();
      fontFamilies.add(ff);
    });

    const isSfProUsed = Array.from(fontFamilies).some(
      f => f.includes('sf pro') || f.includes('-apple-system') || f.includes('blinkmacsystemfont')
    );

    // 2. Buttons & Close Controls Inspection
    const buttons = document.querySelectorAll('button, .btn, a.btn');
    let hasGradientButtons = false;
    let nonAppleRedCloseButtons = 0;
    let totalCloseButtons = 0;

    buttons.forEach(b => {
      const style = getComputedStyle(b);
      const bgImg = style.backgroundImage;
      if (
        bgImg &&
        bgImg.includes('gradient') &&
        !b.classList.contains('gradient-allowed') &&
        !style.opacity === '0'
      ) {
        hasGradientButtons = true;
      }

      // Check close buttons
      const isClose =
        b.id?.includes('close') ||
        b.className?.includes('close') ||
        b.getAttribute('aria-label')?.toLowerCase().includes('close');
      if (isClose) {
        totalCloseButtons++;
        const bg = style.backgroundColor;
        // Apple red is rgb(255, 59, 48) or rgb(255, 69, 58)
        const isRed = bg.includes('255, 59, 48') || bg.includes('255, 69, 58');
        const isCircular = style.borderRadius.includes('50%') || style.borderRadius.includes('999');
        if (!isRed || !isCircular) {
          nonAppleRedCloseButtons++;
        }
      }
    });

    // 3. Color Tokens & Surface Inspection
    const canvasBg = bodyStyles.backgroundColor;
    const isDark = document.documentElement.classList.contains('dark');
    const expectedCanvas = isDark ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const isCleanSolidCanvas =
      canvasBg === expectedCanvas ||
      canvasBg.includes(isDark ? '0, 0, 0' : '255, 255, 255') ||
      canvasBg.includes(isDark ? '18, 18, 20' : '245, 245, 247');

    // 4. Cards & Containers Inspection
    const cards = document.querySelectorAll(
      '.card, .bento-card, .glass-card, .lg-glass-card, .experience-card, .education-card, .uses-featured-card, .uses-card, .timeline-card, .stat-tile, .monitor-card, .systems-proof-card, .systems-metric-card, .project-card, .publication-card, .project-surface, .case-study-metric, .case-study-story'
    );
    let cardCount = cards.length;
    let cardsWithProperRadius = 0;
    let cardsWithGlassmorphism = 0;

    cards.forEach(c => {
      const style = getComputedStyle(c);
      const br = parseFloat(style.borderRadius);
      if (br >= 12 && br <= 28) {
        cardsWithProperRadius++;
      }
      const filter = style.backdropFilter || style.webkitBackdropFilter;
      if (filter && filter.includes('blur')) {
        cardsWithGlassmorphism++;
      }
    });

    // 5. Cliché / Over-decoration check
    const glowingBorders = document.querySelectorAll(
      '[style*="box-shadow*0 0 20px"], .glow-effect'
    );
    const hasPulsingHeadlineBiscuit = !!document.querySelector('.biscuit-pill, .pulsing-dot-badge');

    return {
      isSfProUsed,
      totalButtons: buttons.length,
      hasGradientButtons,
      totalCloseButtons,
      nonAppleRedCloseButtons,
      canvasBg,
      isCleanSolidCanvas,
      cardCount,
      cardsWithProperRadius,
      cardsWithGlassmorphism,
      glowingBorderCount: glowingBorders.length,
      hasPulsingHeadlineBiscuit,
    };
  });
}

function computePageVerdict(light, dark) {
  let score = 100;
  const findings = [];
  const recommendations = [];

  if (!light.isSfProUsed || !dark.isSfProUsed) {
    score -= 15;
    findings.push(
      'Headings do not explicitly declare SF Pro Display / Apple system typography hierarchy.'
    );
    recommendations.push(
      'Enforce `-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif` font stack on headings.'
    );
  }

  if (light.hasGradientButtons || dark.hasGradientButtons) {
    score -= 10;
    findings.push('Detected non-Apple multi-stop gradient background on button elements.');
    recommendations.push(
      'Replace button gradients with solid Apple Blue `#0071e3` and authentic hover/active states.'
    );
  }

  if (light.nonAppleRedCloseButtons > 0 || dark.nonAppleRedCloseButtons > 0) {
    score -= 10;
    findings.push(
      'Modal or drawer close button is not using signature Apple Red circular styling (`#ff3b30`, 50% radius).'
    );
    recommendations.push(
      'Standardize close buttons to unified circular Apple Red `#ff3b30` controls.'
    );
  }

  if (!light.isCleanSolidCanvas || !dark.isCleanSolidCanvas) {
    score -= 10;
    findings.push(
      `Canvas background does not match Apple solid surface tokens (found light: ${light.canvasBg}, dark: ${dark.canvasBg}).`
    );
    recommendations.push('Set body background to solid `#ffffff` (light) and `#000000` (dark).');
  }

  if (light.cardCount > 0 && light.cardsWithProperRadius / light.cardCount < 0.7) {
    score -= 10;
    findings.push('Some cards use sharp corners or non-Apple border-radius (<12px or >28px).');
    recommendations.push('Standardize card border-radius to Apple standard 14px – 20px.');
  }

  let status = 'MODERN_APPLE_STANDARD';
  if (score < 80) {
    status = 'NEEDS_REFRESH';
  } else if (score < 95) {
    status = 'MINOR_POLISH_RECOMMENDED';
  }

  return { appleScore: Math.max(0, score), status, findings, recommendations };
}

runDesignAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
