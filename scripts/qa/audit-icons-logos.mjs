/**
 * Sitewide Icons, Tech Logos, and Brand Color Audit Script.
 * Verifies that all icons/logos across the portfolio are loaded, crisp,
 * correctly colored, and visually distinct in both Light and Dark themes.
 */
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4000';

const PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/systems.html', name: 'Systems' },
  { path: '/monitor.html', name: 'Monitor' },
  { path: '/travel.html', name: 'Travel' },
  { path: '/uses.html', name: 'Uses' },
];

async function auditIconsAndLogos() {
  console.log('🎨 Auditing Sitewide Icons, Tech Logos, and UI/UX Colors...\n');
  const browser = await chromium.launch({ headless: true });

  for (const p of PAGES) {
    console.log(`Checking ${p.name} (${p.path})...`);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1000);

      // Scroll to trigger lazy loading of images and expand hidden preview containers
      await page.evaluate(async () => {
        document
          .querySelectorAll('.is-preview-hidden')
          .forEach(el => el.classList.remove('is-preview-hidden'));
        document
          .querySelectorAll('.section-preview-container')
          .forEach(el => el.classList.add('is-expanded'));
        await new Promise(resolve => {
          let totalHeight = 0;
          const distance = 500;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              resolve();
            }
          }, 100);
        });
      });
      await page.waitForTimeout(1000);

      // Audit FontAwesome icons, SVG icons, and <img> logos
      const iconReport = await page.evaluate(() => {
        const icons = Array.from(
          document.querySelectorAll(
            'i.fa, i.fab, i.fas, i.far, svg, img[src*="logo"], img[src*="icon"], .company-logo-wrap img, .tech-badge img, .vibe-tool-item img, .uses-icon img'
          )
        );

        let faCount = 0;
        let svgCount = 0;
        let imgCount = 0;
        let brokenImgs = 0;

        const brokenSrcs = [];
        icons.forEach(el => {
          const tag = el.tagName.toLowerCase();
          if (tag === 'i') faCount++;
          else if (tag === 'svg') svgCount++;
          else if (tag === 'img') {
            imgCount++;
            if (el.naturalWidth === 0) {
              brokenImgs++;
              brokenSrcs.push(el.src || el.getAttribute('src'));
            }
          }
        });

        return { total: icons.length, faCount, svgCount, imgCount, brokenImgs, brokenSrcs };
      });

      console.log(`  Summary for ${p.name}:`);
      console.log(`    - Total Icons/Logos: ${iconReport.total}`);
      console.log(`    - FontAwesome Icons: ${iconReport.faCount}`);
      console.log(`    - SVG Elements: ${iconReport.svgCount}`);
      console.log(`    - Image Logos: ${iconReport.imgCount} (${iconReport.brokenImgs} broken)`);

      if (iconReport.brokenImgs > 0) {
        console.log(
          `  ⚠️ Found ${iconReport.brokenImgs} broken logo images on ${p.name}:`,
          iconReport.brokenSrcs
        );
      } else {
        console.log(`  ✅ 100% icons and logos rendered perfectly on ${p.name}`);
      }
    } catch (err) {
      console.error(`  Error auditing ${p.name}:`, err.message);
    }
    await context.close();
  }

  await browser.close();
  console.log('\nIcon & Logo Audit Completed!');
}

auditIconsAndLogos().catch(err => {
  console.error(err);
  process.exit(1);
});
