import { test, expect } from './helpers/isolated-test.js';
import { blogPosts } from '../../src/js/modules/blog-data.js';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000';
const articleUrl = id => `${base.replace(/\/$/, '')}/blog/${id}.html`;

test('journal search includes the lead article and combines with topic filters', async ({
  page,
}) => {
  await page.goto(`${base.replace(/\/$/, '')}/blog/`);
  const cards = page.locator('#blog-posts-container .blog-card:visible');
  // The default view leaves the lead article to the featured slot above the archive.
  await expect(cards).toHaveCount(blogPosts.length - 1);
  const featuredTitle = await page.locator('#blog-featured-title').innerText();
  await page.getByLabel('Search the journal').fill(featuredTitle);
  await expect(cards).toHaveCount(1);
  await expect(cards.first().locator('.blog-title')).toHaveText(featuredTitle);
  await page.getByLabel('Search the journal').fill('openrouter');
  await expect(cards).toHaveCount(1);
  await page.getByRole('button', { name: 'Apple', exact: true }).click();
  await expect(cards).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No articles found' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(cards).toHaveCount(blogPosts.length - 1);
  await expect(page.getByLabel('Search the journal')).toBeFocused();
  await page.getByLabel('Sort by').selectOption('oldest');
  await expect(cards).toHaveCount(blogPosts.length);
  const dates = await cards.evaluateAll(nodes => nodes.map(node => node.dataset.date));
  expect(dates).toEqual([...dates].sort());
  await page.getByLabel('Sort by').selectOption('title');
  const titles = await cards.locator('.blog-title').allTextContents();
  expect(titles).toEqual([...titles].sort((a, b) => a.trim().localeCompare(b.trim())));
});

test('journal search matches the visible excerpt and category on an article card', async ({
  page,
}) => {
  await page.goto(`${base.replace(/\/$/, '')}/blog/`);
  const card = page.locator('[data-id="openrouter-ai-usb-hub-routing-2026"]');
  const search = page.getByLabel('Search the journal');
  await expect(card.locator('.blog-summary')).toContainText('beauty contest');
  await expect(card.locator('.blog-kicker')).toHaveText('Model gateways');

  for (const query of ['beauty contest', 'Model gateways']) {
    await search.fill(query);
    await expect(card).toBeVisible();
  }

  await expect(page.locator('.blog-card[data-search*="undefined"]')).toHaveCount(0);
  await search.fill('undefined');
  await expect(page.locator('#blog-posts-container .blog-card:visible')).toHaveCount(0);
});

test('article progress ends at the body and sharing copies the canonical URL', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async text => {
          window.copiedArticleUrl = text;
        },
      },
    });
  });
  await page.goto(articleUrl(blogPosts[0].id));
  await page.getByRole('button', { name: 'Copy article link', exact: true }).click();
  await expect(page.locator('#article-copy-status')).toHaveText('Article link copied.');
  expect(await page.evaluate(() => window.copiedArticleUrl)).toBe(
    await page.locator('link[rel="canonical"]').getAttribute('href')
  );
  await page.locator('#article-content').evaluate(node => {
    window.scrollTo({
      top: node.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 2,
      behavior: 'instant',
    });
  });
  await expect(page.locator('#blog-reading-progress')).toHaveCSS(
    'transform',
    'matrix(1, 0, 0, 1, 0, 0)'
  );
});

for (const post of blogPosts) {
  test(`article integrity and responsive themes: ${post.id}`, async ({ page }) => {
    await page.goto(articleUrl(post.id));
    await expect(page.locator('h1')).toHaveText(post.title);
    await expect(page.locator('.article-overview')).toBeVisible();
    const missingAnchors = await page
      .locator('#blog-article-toc a')
      .evaluateAll(links =>
        links
          .map(link => decodeURIComponent(link.hash.slice(1)))
          .filter(id => !document.getElementById(id))
      );
    expect(missingAnchors).toEqual([]);
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        await page.evaluate(mode => {
          document.documentElement.classList.toggle('dark', mode === 'dark');
          document.documentElement.dataset.theme = mode;
        }, theme);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${width} ${theme}`
        ).toBe(true);
        const bodyWidth = await page
          .locator('#article-content')
          .evaluate(node => node.getBoundingClientRect().width);
        expect(bodyWidth).toBeLessThanOrEqual(720);
        await expect(page.locator('.article-body .article-p').first()).toHaveCSS(
          'font-size',
          width <= 600 ? '18px' : '19px'
        );
      }
    }
    const images = await page.locator('.article-body img').evaluateAll(async nodes => {
      await Promise.all(nodes.map(node => node.decode().catch(() => {})));
      return nodes.filter(node => !node.naturalWidth).map(node => node.src);
    });
    expect(images).toEqual([]);
    expect(await page.locator('.article-figure__credit a').count()).toBeGreaterThan(0);
  });
}
