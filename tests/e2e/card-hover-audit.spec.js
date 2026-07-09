import { expect, test } from '@playwright/test';

const INDEX_CARD_CHECKS = [
  { section: '#about', selector: '#about .about-text-card', lightBorder: 'rgb(0, 113, 227)' },
  {
    section: '#experience',
    selector: '#experience .experience-content',
    lightBorder: 'rgb(0, 113, 227)',
  },
  {
    section: '#skills',
    selector: '#skills-container .skill-badge',
    lightBorder: 'rgb(0, 113, 227)',
  },
  {
    section: '#projects',
    selector: '#github-projects-container .showcase-project-card',
    lightBorder: 'rgb(0, 113, 227)',
  },
  {
    section: '#education',
    selector: '#education .education-content',
    lightBorder: 'rgb(0, 113, 227)',
  },
  {
    section: '#publications',
    selector: '#publications .publication-card',
    lightBorder: 'rgb(0, 113, 227)',
  },
  { section: '#awards', selector: '#awards .award-card', lightBorder: 'rgb(0, 113, 227)' },
  { section: '#blog', selector: '#blog .blog-card', lightBorder: 'rgb(0, 113, 227)' },
  {
    section: '#recommendations',
    selector: '#recommendations .recommendation-card',
    lightBorder: 'rgb(0, 113, 227)',
  },
  {
    section: '#certifications',
    selector: '#certifications .certification-card',
    lightBorder: 'rgb(0, 113, 227)',
  },
  { section: '#contact', selector: '#contact .contact-card', lightBorder: 'rgb(0, 113, 227)' },
];

const STANDALONE_CARD_CHECKS = [
  {
    path: '/systems.html',
    name: 'systems',
    selector: '#systems-overview-grid .eng-showcase-card',
    waitFor: '#systems-overview-grid .eng-showcase-card',
  },
  {
    path: '/monitor.html',
    name: 'monitor',
    selector: 'body.monitor-page .doc-card',
    waitFor: 'body.monitor-page .doc-card',
  },
  {
    path: '/travel.html',
    name: 'travel',
    selector: '.travel-stop',
    waitFor: '.travel-stop',
  },
];

async function hoverAndReadCardMetrics(
  page,
  locator,
  { checkAppleBlueBorder = false, dark = false, scrollCard = true } = {}
) {
  if (scrollCard) {
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 8000 });
      await page.waitForTimeout(150);
    } catch {
      // Marquee skill badges keep moving; section scroll is sufficient.
    }
  }
  await locator.hover({ force: true });
  await page.waitForTimeout(550);
  return locator.evaluate(
    (node, { checkBlue, isDark: _isDark }) => {
      const style = getComputedStyle(node);
      let isAppleBlueBorder = false;
      if (checkBlue) {
        const { r, g, b } = (() => {
          const match = style.borderTopColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
          }
          return { r: 0, g: 0, b: 0 };
        })();
        isAppleBlueBorder =
          style.borderTopColor.startsWith('oklab(') || (r <= 25 && b >= 200 && b > g && g >= 95);
      }
      return {
        boxShadow: style.boxShadow,
        borderRadius: Number.parseFloat(style.borderRadius) || 0,
        borderTopColor: style.borderTopColor,
        backgroundColor: style.backgroundColor,
        isAppleBlueBorder,
      };
    },
    { checkBlue: checkAppleBlueBorder, isDark: dark }
  );
}

async function readCardMetrics(locator, { checkAppleBlueBorder = false, dark = false } = {}) {
  return locator.evaluate(
    (node, { checkBlue, isDark: _isDark }) => {
      const style = getComputedStyle(node);
      let isAppleBlueBorder = false;
      if (checkBlue) {
        const { r, g, b } = (() => {
          const match = style.borderTopColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
          }
          return { r: 0, g: 0, b: 0 };
        })();
        isAppleBlueBorder =
          style.borderTopColor.startsWith('oklab(') || (r <= 25 && b >= 200 && b > g && g >= 95);
      }
      return {
        boxShadow: style.boxShadow,
        borderRadius: Number.parseFloat(style.borderRadius) || 0,
        borderTopColor: style.borderTopColor,
        backgroundColor: style.backgroundColor,
        isAppleBlueBorder,
      };
    },
    { checkBlue: checkAppleBlueBorder, isDark: dark }
  );
}

async function assertCardHover(page, { section, selector }) {
  await page.locator(section).scrollIntoViewIfNeeded();
  const key = section.replace('#', '');
  await page.waitForFunction((styleKey) => {
    const links = Array.from(document.querySelectorAll(`[data-lazy-style-key~="${styleKey}"]`));
    return links.every(link => link.dataset.styleLoaded === 'true');
  }, key, { timeout: 15_000 }).catch(() => {});

  if (section === '#skills') {
    await page.waitForSelector('#skills-container .skill-badge', { timeout: 20_000 });
  }
  const card = page.locator(selector).first();
  await expect(card, `Expected card in ${section}`).toBeVisible({ timeout: 20_000 });

  const resting = await readCardMetrics(card);
  expect(resting.boxShadow).toBe('none');
  expect(resting.borderRadius).toBeGreaterThanOrEqual(16);
  expect(resting.backgroundColor).toBe('rgb(255, 255, 255)');

  const hovered = await hoverAndReadCardMetrics(page, card, {
    scrollCard: section !== '#skills',
    checkAppleBlueBorder: true,
  });
  if (!hovered.isAppleBlueBorder) {
    console.log(`Failed blue border check on ${section} card. Received borderTopColor: ${hovered.borderTopColor}`);
  }
  expect(hovered.boxShadow).toBe('none');
  expect(hovered.isAppleBlueBorder).toBe(true);
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
      document.getElementById('chatbot-widget')?.remove();
      document.querySelector('.a11y-toolbar')?.remove();
      document.querySelector('header')?.remove();
    });
  });

  for (const check of INDEX_CARD_CHECKS) {
    test(`${check.section} cards: rounded corners, no glow, blue border on hover`, async ({
      page,
    }) => {
      await assertCardHover(page, check);
    });
  }

  test('skills section uses solid white page background', async ({ page }) => {
    await page.locator('#skills').scrollIntoViewIfNeeded();
    const skillsBg = await page
      .locator('#skills')
      .evaluate(node => getComputedStyle(node).backgroundColor);
    expect(skillsBg).toBe('rgb(255, 255, 255)');
  });

  test('all homepage sections have section subtitles', async ({ page }) => {
    const sectionsWithSubtitles = [
      '#about',
      '#education',
      '#skills',
      '#experience',
      '#engineering',
      '#projects',
      '#publications',
      '#awards',
      '#recommendations',
      '#certifications',
      '#blog',
      '#contact',
    ];

    for (const section of sectionsWithSubtitles) {
      const subtitle = page.locator(`${section} .section-subtitle`).first();
      await page.locator(section).scrollIntoViewIfNeeded();
      await expect(subtitle, `Expected subtitle in ${section}`).toBeVisible({ timeout: 15_000 });
      const text = await subtitle.textContent();
      expect(text?.trim().length).toBeGreaterThan(10);
    }
  });
});

test.describe('Standalone page card hover audit', () => {
  for (const check of STANDALONE_CARD_CHECKS) {
    test(`${check.name} cards: rounded corners, no glow, blue border on hover`, async ({
      page,
    }) => {
      await page.goto(check.path, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(check.waitFor, { timeout: 30_000 });
      await page.waitForLoadState('load');
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        document.getElementById('chatbot-widget')?.remove();
        document.querySelector('.a11y-toolbar')?.remove();
        document.querySelector('header')?.remove();
      });
      await page.waitForTimeout(1500);

      const card = page.locator(check.selector).first();
      await expect(card).toBeVisible({ timeout: 20_000 });

      const resting = await readCardMetrics(card);
      expect(resting.boxShadow).toBe('none');
      expect(resting.borderRadius).toBeGreaterThanOrEqual(12);

      const hovered = await hoverAndReadCardMetrics(page, card, { checkAppleBlueBorder: true });
      if (!hovered.isAppleBlueBorder) {
        console.log(`Failed blue border check on standalone page ${check.name} card. Received borderTopColor: ${hovered.borderTopColor}`);
      }
      expect(hovered.boxShadow).toBe('none');
      expect(hovered.isAppleBlueBorder).toBe(true);
    });
  }
});
