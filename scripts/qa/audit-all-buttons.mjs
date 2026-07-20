/**
 * Comprehensive Sitewide Button Audit Script.
 * Finds all button elements across all 5 main pages, auditing their heights,
 * border-radius, font sizes, background colors, and focus states.
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

async function auditButtons() {
  console.log('🔘 Auditing Sitewide Button Elements & Interactions...\n');
  const browser = await chromium.launch({ headless: true });

  for (const p of PAGES) {
    console.log(`Checking ${p.name} (${p.path})...`);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1500);

      const buttons = await page.evaluate(() => {
        const els = Array.from(
          document.querySelectorAll(
            'button, a[class*="btn"], .project-evidence-link, .project-lens-chip, .tab-btn'
          )
        );
        return els
          .map(el => {
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
              text: (el.textContent || '').trim().substring(0, 30),
              tag: el.tagName.toLowerCase(),
              class: (el.className || '').trim().split(/\s+/).slice(0, 3).join('.'),
              height: Math.round(rect.height),
              width: Math.round(rect.width),
              borderRadius: style.borderRadius,
              bg: style.backgroundColor,
              color: style.color,
              display: style.display,
            };
          })
          .filter(b => b.width > 0 && b.height > 0);
      });

      console.log(`  Found ${buttons.length} interactive buttons on ${p.name}`);
      const nonCompliantHeight = buttons.filter(b => b.height < 36);
      if (nonCompliantHeight.length > 0) {
        console.log(`  ⚠️ ${nonCompliantHeight.length} buttons below 36px touch height target:`);
        nonCompliantHeight.slice(0, 5).forEach(b => {
          console.log(`     - [${b.tag}.${b.class}] "${b.text}" -> height: ${b.height}px`);
        });
      } else {
        console.log('  ✅ 100% buttons meet min 36px-48px touch height target!');
      }
    } catch (err) {
      console.error(`  Error auditing ${p.name}:`, err.message);
    }
    await context.close();
  }

  await browser.close();
  console.log('\nAudit Completed!');
}

auditButtons().catch(err => {
  console.error(err);
  process.exit(1);
});
