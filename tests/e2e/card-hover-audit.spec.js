import { expect, test } from '@playwright/test';

const CARD_CHECKS = [
  { section: '#experience', selector: '#experience .experience-content', lightBorder: 'rgb(0, 113, 227)' },
  { section: '#skills', selector: '#skills-container .skill-badge', lightBorder: 'rgb(0, 113, 227)' },
  { section: '#projects', selector: '#github-projects-container .showcase-project-card', lightBorder: 'rgb(0, 113, 227)' },
  { section: '#education', selector: '#education .education-content', lightBorder: 'rgb(0, 113, 227)' },
  { section: '#publications', selector: '#publications .publication-card', lightBorder: 'rgb(0, 113, 227)' },
  { section: '#blog', selector: '#blog .blog-card', lightBorder: 'rgb(0, 113, 227)' },
  { section: '#recommendations', selector: '#recommendations .recommendation-card', lightBorder: 'rgb(0, 113, 227)' },
  { section: '#certifications', selector: '#certifications .certification-card', lightBorder: 'rgb(0, 113, 227)' },
];

async function hoverCard(page, locator, { scrollCard = true } = {}) {
  if (scrollCard) {
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 8000 });
      await page.waitForTimeout(150);
    } catch {
      // Marquee skill badges keep moving; section scroll is sufficient.
    }
  }
  await locator.hover({ force: true });
  await page.waitForTimeout(250);
}

function isBlueBorder(color, dark = false) {
  if (dark) {
    return color === 'rgb(10, 132, 255)' || color === 'rgb(41, 151, 255)';
  }
  return (
    color === 'rgb(0, 113, 227)' ||
    color === 'rgb(0, 119, 237)' ||
    /^rgba?\(\s*0\s*,\s*113\s*,\s*227/.test(color)
  );
}

async function readCardMetrics(locator) {
  return locator.evaluate(node => {
    const style = getComputedStyle(node);
    return {
      boxShadow: style.boxShadow,
      borderRadius: Number.parseFloat(style.borderRadius) || 0,
      borderTopColor: style.borderTopColor,
      backgroundColor: style.backgroundColor,
    };
  });
}

test.describe('Sitewide card hover audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#main-content', { state: 'attached', timeout: 30_000 });
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });
  });

  for (const check of CARD_CHECKS) {
    test(`${check.section} cards: rounded corners, no glow, blue border on hover`, async ({ page }) => {
      await page.locator(check.section).scrollIntoViewIfNeeded();
      if (check.section === '#skills') {
        await page.waitForSelector('#skills-container .skill-badge', { timeout: 20_000 });
      }
      const card = page.locator(check.selector).first();
      await expect(card, `Expected card in ${check.section}`).toBeVisible({ timeout: 20_000 });

      const resting = await readCardMetrics(card);
      expect(resting.boxShadow).toBe('none');
      expect(resting.borderRadius).toBeGreaterThanOrEqual(16);
      expect(resting.backgroundColor).toBe('rgb(255, 255, 255)');

      await hoverCard(page, card, { scrollCard: check.section !== '#skills' });
      await page.waitForTimeout(200);

      const hovered = await readCardMetrics(card);
      expect(hovered.boxShadow).toBe('none');
      expect(isBlueBorder(hovered.borderTopColor)).toBe(true);
    });
  }

  test('skills section uses solid white page background', async ({ page }) => {
    await page.locator('#skills').scrollIntoViewIfNeeded();
    const skillsBg = await page.locator('#skills').evaluate(node => getComputedStyle(node).backgroundColor);
    expect(skillsBg).toBe('rgb(255, 255, 255)');
  });
});
