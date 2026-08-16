import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR =
  '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/scratch/mobile_audit';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'iPhone_17_Pro_Max_Safari', width: 440, height: 956, isMobile: true, hasTouch: true },
  { name: 'iPhone_17_Pro_Max_Chrome', width: 440, height: 956, isMobile: true, hasTouch: true },
  { name: 'iPhone_14_Standard_Safari', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'Small_Mobile_Chrome', width: 375, height: 667, isMobile: true, hasTouch: true },
];

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'systems', path: '/systems.html' },
  { name: 'monitor', path: '/monitor.html' },
  { name: 'travel', path: '/travel.html' },
  { name: 'uses', path: '/uses.html' },
  { name: 'changelog', path: '/changelog.html' },
  { name: '404', path: '/404.html' },
];

async function runAudit() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 3,
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
    });

    const page = await context.newPage();

    for (const p of PAGES) {
      console.log(`Auditing ${p.name} on ${vp.name} (${vp.width}x${vp.height})...`);
      try {
        await page.goto(`http://127.0.0.1:4000${p.path}`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(1000);

        const auditData = await page.evaluate(_vpWidth => {
          const docEl = document.documentElement;
          const issues = [];

          const totalDocOverflow = docEl.scrollWidth - window.innerWidth;
          if (totalDocOverflow > 2) {
            issues.push({ type: 'doc_overflow', amount: totalDocOverflow });
          }

          // Check visible sections and cards
          const sections = document.querySelectorAll(
            'section, main, .section-container, .hero-layout-wrapper'
          );
          const sectionMetrics = [];
          for (const sec of sections) {
            const rect = sec.getBoundingClientRect();
            const style = window.getComputedStyle(sec);
            sectionMetrics.push({
              id: sec.id || sec.className,
              width: Math.round(rect.width),
              padX: `${style.paddingLeft} / ${style.paddingRight}`,
              padY: `${style.paddingTop} / ${style.paddingBottom}`,
              marginX: `${style.marginLeft} / ${style.marginRight}`,
            });
          }

          // Check cards and grids
          const cards = document.querySelectorAll(
            '.card, .apple-card, .project-card, .experience-card, .education-card, .blog-card, .stat-card, .skill-card, .bento-card, .hero-card, .about-card'
          );
          const cardMetrics = [];
          for (const c of cards) {
            const rect = c.getBoundingClientRect();
            const style = window.getComputedStyle(c);
            if (rect.width > 0 && rect.height > 0) {
              cardMetrics.push({
                cls: c.className.split(' ').slice(0, 3).join('.'),
                w: Math.round(rect.width),
                h: Math.round(rect.height),
                pad: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
                margin: `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`,
                overflowX: rect.right > window.innerWidth + 2,
              });
            }
          }

          return {
            totalDocOverflow,
            issues,
            sectionMetrics: sectionMetrics.slice(0, 10),
            cardMetrics: cardMetrics.slice(0, 15),
          };
        }, vp.width);

        const screenshotFile = path.join(OUT_DIR, `${p.name}_${vp.name}.png`);
        await page.screenshot({ path: screenshotFile, fullPage: true });

        results.push({
          page: p.name,
          viewport: vp.name,
          width: vp.width,
          height: vp.height,
          overflow: auditData.totalDocOverflow,
          issues: auditData.issues,
          sectionMetrics: auditData.sectionMetrics,
          cardMetrics: auditData.cardMetrics,
          screenshot: screenshotFile,
        });
      } catch (err) {
        console.error(`Error on ${p.name} / ${vp.name}:`, err);
        results.push({ page: p.name, viewport: vp.name, error: err.message });
      }
    }
    await context.close();
  }

  await browser.close();

  fs.writeFileSync(path.join(OUT_DIR, 'audit_report.json'), JSON.stringify(results, null, 2));
  console.log('Mobile audit complete. Results written to audit_report.json');
}

runAudit();
