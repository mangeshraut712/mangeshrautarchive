/**
 * Liquid glass + transparency matrix: light/dark × clear/default/tinted.
 * Run: PLAYWRIGHT_BASE_URL=http://127.0.0.1:4196 node scripts/qa/glass-theme-matrix.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4196';
const OUT = join(process.cwd(), 'artifacts', 'qa-glass-themes');
const TINTS = [
  { label: 'clear', value: 0 },
  { label: 'default', value: 55 },
  { label: 'tinted', value: 100 },
];
const SECTIONS = ['#skills', '#experience', '#projects', '#contact'];

function sample(page) {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const pick = sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        backdrop: cs.backdropFilter,
        bg: cs.backgroundColor,
        border: cs.borderColor,
      };
    };
    return {
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      tint: root.getPropertyValue('--lg-tint').trim(),
      blurCard: root.getPropertyValue('--lg-blur-card').trim(),
      cardFillLight: root.getPropertyValue('--lg-card-light-fill').trim(),
      cardFillDark: root.getPropertyValue('--lg-card-dark-fill').trim(),
      skillCategory: pick('#skills-container .skill-category'),
      experience: pick('.experience-content'),
      project: pick(
        '#github-projects-container article.showcase-project-card, .showcase-project-card'
      ),
      contact: pick('#contact .contact-card, .contact-card'),
      nav: pick('.global-nav.dynamic-island'),
    };
  });
}

async function setTheme(page, theme) {
  await page.evaluate(theme => {
    document.documentElement.classList.remove('dark', 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  }, theme);
}

async function applyTint(page, value) {
  await page.waitForFunction(() => typeof window.a11y?.applyGlassTint === 'function', null, {
    timeout: 20_000,
  });
  await page.evaluate(v => window.a11y.applyGlassTint(v), value);
  await page.waitForTimeout(400);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  const matrix = [];

  try {
    await page.goto(`${BASE}/#skills?v=glass-matrix`, { waitUntil: 'networkidle' });
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await page.locator('#skills-container .skill-category').first().waitFor({
      state: 'visible',
      timeout: 45_000,
    });

    for (const theme of ['dark', 'light']) {
      await setTheme(page, theme);

      for (const tint of TINTS) {
        await applyTint(page, tint.value);

        for (const hash of SECTIONS) {
          await page.goto(`${BASE}/${hash}?v=glass-matrix`, { waitUntil: 'domcontentloaded' });
          if (hash === '#skills') {
            await page.locator('#skills-container .skill-category').first().waitFor({
              state: 'visible',
              timeout: 20_000,
            });
          } else if (hash === '#experience') {
            await page
              .locator('.experience-content')
              .first()
              .waitFor({ state: 'visible', timeout: 15_000 });
          } else if (hash === '#projects') {
            await page
              .locator('#github-projects-container')
              .waitFor({ state: 'visible', timeout: 15_000 });
          } else {
            await page.locator('#contact .contact-card, .contact-card').first().waitFor({
              state: 'visible',
              timeout: 15_000,
            });
          }

          const data = await sample(page);
          const shot = `${theme}-${tint.label}-${hash.slice(1)}.jpeg`;
          await page.screenshot({ path: join(OUT, shot), type: 'jpeg', quality: 85, scale: 'css' });

          const cardKey =
            hash === '#skills'
              ? 'skillCategory'
              : hash === '#experience'
                ? 'experience'
                : hash === '#projects'
                  ? 'project'
                  : 'contact';
          const card = data[cardKey];
          const hasBlur = Boolean(card?.backdrop?.includes('blur'));
          const expectedBlur = tint.value === 0 ? '44px' : tint.value === 100 ? '20px' : null;

          const pass =
            hasBlur &&
            (expectedBlur === null || data.blurCard === expectedBlur) &&
            data.theme === theme;

          matrix.push({
            theme,
            tint: tint.label,
            section: hash.slice(1),
            pass,
            blurCard: data.blurCard,
            cardBackdrop: card?.backdrop ?? 'missing',
            cardBg: card?.bg ?? 'missing',
            screenshot: shot,
          });
        }
      }
    }
  } finally {
    await browser.close();
  }

  const failed = matrix.filter(r => !r.pass);
  const report = {
    base: BASE,
    total: matrix.length,
    passed: matrix.filter(r => r.pass).length,
    failed: failed.length,
    matrix,
  };
  await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  console.log(`Glass theme matrix: ${report.passed}/${report.total} passed`);
  for (const row of matrix) {
    console.log(
      `${row.pass ? 'PASS' : 'FAIL'}  ${row.theme}/${row.tint}/${row.section}  blur=${row.blurCard}  card=${row.cardBackdrop?.slice(0, 40)}`
    );
  }
  console.log(`Artifacts: ${OUT}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
