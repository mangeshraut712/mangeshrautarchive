/**
 * Comprehensive Theme & Background Audit Script.
 * Checks computed background-color and color of elements across all 5 pages
 * in both Light and Dark themes to find any lingering grey backgrounds, muddy surfaces,
 * or theme-unaware hardcoded background colors.
 */
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4000';
const OUT = '/Users/mangeshraut/.gemini/antigravity/brain/a562c13f-d42b-4eaa-bd31-14ee0ecd6148';

const PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/systems.html', name: 'Systems' },
  { path: '/monitor.html', name: 'Monitor' },
  { path: '/travel.html', name: 'Travel' },
  { path: '/uses.html', name: 'Uses' },
];

async function auditThemeBackgrounds() {
  console.log('🎨 Starting Sitewide Theme & Background Color Audit...\n');
  const browser = await chromium.launch({ headless: true });

  const report = {};

  for (const p of PAGES) {
    report[p.name] = { light: [], dark: [] };
    console.log(`Checking ${p.name} (${p.path})...`);

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1500);

      // Audit Light Mode
      const lightGreyElements = await page.evaluate(() => {
        const results = [];
        const all = document.querySelectorAll('*');

        for (const el of all) {
          const style = getComputedStyle(el);
          const bg = style.backgroundColor;
          const rect = el.getBoundingClientRect();

          if (rect.width === 0 || rect.height === 0) continue;
          if (style.display === 'none' || style.visibility === 'hidden') continue;

          // Check if background color contains grey or semi-transparent grey
          // RGB values where R, G, B are equal or close (grey shade), not pure white (255,255,255,1) or transparent (0,0,0,0)
          const match = bg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
          if (match) {
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            const a = match[4] !== undefined ? parseFloat(match[4]) : 1;

            if (a > 0.05) {
              // Check for grey tint (R, G, B values close together, in range 50..245)
              const diffMaxMin = Math.max(r, g, b) - Math.min(r, g, b);
              const avg = (r + g + b) / 3;

              if (diffMaxMin < 15 && avg > 40 && avg < 248) {
                const tag = el.tagName.toLowerCase();
                const id = el.id ? `#${el.id}` : '';
                const cls =
                  el.className && typeof el.className === 'string'
                    ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
                    : '';
                results.push({
                  selector: `${tag}${id}${cls}`,
                  bg,
                  color: style.color,
                  hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
                });
              }
            }
          }
        }
        return results.slice(0, 30);
      });

      report[p.name].light = lightGreyElements;

      // Toggle to Dark Mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await page.waitForTimeout(1000);

      // Audit Dark Mode
      const darkGreyElements = await page.evaluate(() => {
        const results = [];
        const all = document.querySelectorAll('*');

        for (const el of all) {
          const style = getComputedStyle(el);
          const bg = style.backgroundColor;
          const rect = el.getBoundingClientRect();

          if (rect.width === 0 || rect.height === 0) continue;
          if (style.display === 'none' || style.visibility === 'hidden') continue;

          const match = bg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
          if (match) {
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            const a = match[4] !== undefined ? parseFloat(match[4]) : 1;

            if (a > 0.05) {
              const diffMaxMin = Math.max(r, g, b) - Math.min(r, g, b);
              const avg = (r + g + b) / 3;

              // In dark mode, check for muddy grey surfaces (R, G, B > 35 and < 200, low saturation)
              if (diffMaxMin < 15 && avg > 35 && avg < 200) {
                const tag = el.tagName.toLowerCase();
                const id = el.id ? `#${el.id}` : '';
                const cls =
                  el.className && typeof el.className === 'string'
                    ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
                    : '';
                results.push({
                  selector: `${tag}${id}${cls}`,
                  bg,
                  color: style.color,
                  hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
                });
              }
            }
          }
        }
        return results.slice(0, 30);
      });

      report[p.name].dark = darkGreyElements;

      // Screenshots
      await page.screenshot({
        path: `${OUT}/theme_light_${p.name.toLowerCase()}.png`,
        fullPage: false,
      });
      await page.screenshot({
        path: `${OUT}/theme_dark_${p.name.toLowerCase()}.png`,
        fullPage: false,
      });
    } catch (err) {
      console.error(`Error auditing ${p.name}:`, err.message);
    }

    await context.close();
  }

  await browser.close();

  console.log('\n========================================');
  console.log(' SITEWIDE THEME BACKGROUND COLOR AUDIT REPORT');
  console.log('========================================');

  for (const [pageName, data] of Object.entries(report)) {
    console.log(`\n📌 ${pageName}`);
    console.log(`  Light Mode Grey Background Surfaces (${data.light.length}):`);
    if (data.light.length === 0) {
      console.log('    ✅ Clean solid white / clean theme surfaces');
    } else {
      data.light.slice(0, 10).forEach(item => {
        console.log(`    - ${item.selector} → bg: ${item.bg} (${item.hex}), text: ${item.color}`);
      });
    }

    console.log(`  Dark Mode Grey Background Surfaces (${data.dark.length}):`);
    if (data.dark.length === 0) {
      console.log('    ✅ Clean solid black / clean theme surfaces');
    } else {
      data.dark.slice(0, 10).forEach(item => {
        console.log(`    - ${item.selector} → bg: ${item.bg} (${item.hex}), text: ${item.color}`);
      });
    }
  }
}

auditThemeBackgrounds().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
