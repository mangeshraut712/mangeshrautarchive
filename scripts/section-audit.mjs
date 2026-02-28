import { chromium, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = 'artifacts/section-audit';
mkdirSync(out, { recursive: true });

const sections = ['projects', 'education', 'recommendations', 'certifications'];

async function run(name, contextOpts) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });

  if (name.includes('dark')) {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.reload({ waitUntil: 'networkidle' });
  }

  for (const sec of sections) {
    const el = page.locator(`#${sec}`);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await el.screenshot({ path: `${out}/${name}-${sec}.png` });

    const info = await el.evaluate(node => {
      const cs = getComputedStyle(node);
      const r = node.getBoundingClientRect();
      const children = [...node.querySelectorAll('*')];
      const tooWide = children.filter(c => {
        const cr = c.getBoundingClientRect();
        return cr.right - r.right > 2 || cr.left < r.left - 2;
      }).length;

      return {
        id: node.id,
        width: Math.round(r.width),
        height: Math.round(r.height),
        bg: cs.backgroundColor,
        overflowX: cs.overflowX,
        tooWide,
      };
    });

    console.log(name, sec, JSON.stringify(info));
  }

  await browser.close();
}

await run('desktop-light', { viewport: { width: 1440, height: 900 } });
await run('desktop-dark', { viewport: { width: 1440, height: 900 } });
await run('mobile-light', { ...devices['Pixel 7'] });
await run('mobile-dark', { ...devices['Pixel 7'] });
