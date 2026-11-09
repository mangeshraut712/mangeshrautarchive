import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const repos = Array.from({ length: 106 }, (_, i) => ({
  name:
    i === 0 ? 'mangeshrautarchive' : i === 105 ? 'प्रयोग' : `project-${String(i).padStart(3, '0')}`,
  full_name: `mangeshraut712/${i === 0 ? 'mangeshrautarchive' : i === 105 ? 'प्रयोग' : `project-${String(i).padStart(3, '0')}`}`,
  description: 'A documented software project.',
  html_url: `https://github.com/mangeshraut712/project-${i}`,
  language: i % 2 ? 'Python' : 'JavaScript',
  stargazers_count: i,
  forks_count: i % 3,
  topics: ['testing'],
  updated_at: '2026-01-01T00:00:00Z',
  pushed_at: '2026-01-01T00:00:00Z',
  owner: { login: 'mangeshraut712' },
}));
async function mockGitHub(page) {
  await page.route('**/api/github/**', async route => {
    const url = new URL(route.request().url());
    const path = url.searchParams.get('path') || url.pathname;
    if (path.includes('/repos/public') || path === '/api/github/repos')
      return route.fulfill({ json: { items: repos.slice(0, 100) } });
    if (path.includes('/users/') && path.includes('/repos'))
      return route.fulfill({ json: repos.slice(100) });
    return route.fulfill({ json: [] });
  });
  await page.route('https://api.github.com/**', route => route.fulfill({ json: [] }));
  await page.route('https://github-contributions-api.jogruber.de/**', route => {
    const year = new URL(route.request().url()).searchParams.get('y');
    return route.fulfill({
      json: {
        contributions: Array.from({ length: 14 }, (_, i) => ({
          date: `${year}-01-${String(i + 1).padStart(2, '0')}`,
          count: i % 3,
          level: i % 3,
        })),
      },
    });
  });
}
for (const width of [375, 768, 1440])
  for (const theme of ['light', 'dark']) {
    test(`showcase discovery and preview at ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.addInitScript(t => localStorage.setItem('themeMode', t), theme);
      await mockGitHub(page);
      await page.goto('/#projects');
      await expect(page.locator('#stat-repos')).toHaveText('106');
      await expect(page.locator('#stat-active-repos')).toHaveText('0');
      await expect(page.locator('#projects-catalog-status')).toContainText('GitHub catalog');
      const search = page.locator('#project-search-input');
      await search.fill('प्रयोग');
      await expect(page.locator('.showcase-project-card')).toHaveCount(1);
      await search.fill('no-such-project-zzzzz');
      await expect(page.getByRole('button', { name: 'Clear filters', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
      await expect(search).toBeFocused();
      await page.locator('#project-sort-select').selectOption('stars');
      await expect(page.locator('.showcase-project-card').first()).toHaveAttribute(
        'data-repo-name',
        'प्रयोग'
      );
      await page.locator('.project-media-open').first().click();
      const modal = page.locator('#repo-preview-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('.blog-modal-close')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(modal.locator('.blog-preview__close-action-btn')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(modal.locator('.blog-modal-close')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(modal).toBeHidden();
      await expect(page.locator('.project-media-open').first()).toBeFocused();
      await page.locator('#projects-expand-btn').click();
      await expect(page.locator('.showcase-project-card')).toHaveCount(106);
      await page.locator('#projects-expand-btn').click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false
      );
      for (const selector of [
        '#projects-refresh-btn',
        '.gh-contrib__settings-btn',
        '.gh-contrib__view-btn',
        '.project-title-btn',
      ]) {
        await expect
          .poll(async () => (await page.locator(selector).first().boundingBox())?.height || 0, {
            message: selector,
          })
          .toBeGreaterThanOrEqual(44);
      }
      const axe = await new AxeBuilder({ page }).include('#projects').analyze();
      expect(axe.violations).toEqual([]);
    });
  }
test('contribution failure clears stale statistics and offers a working retry', async ({
  page,
}) => {
  await mockGitHub(page);
  let fail = false;
  await page.route('https://github-contributions-api.jogruber.de/**', route =>
    fail
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({
          json: {
            contributions: [
              {
                date: `${new URL(route.request().url()).searchParams.get('y')}-01-01`,
                count: 7,
                level: 2,
              },
            ],
          },
        })
  );
  await page.goto('/#projects');
  await expect(page.locator('#gh-total')).toHaveText('7');
  fail = true;
  await page.locator('.gh-contrib__year').nth(1).click();
  await expect(page.locator('#gh-total')).toHaveText('—');
  await expect(page.locator('#gh-contrib-retry')).toBeVisible();
  fail = false;
  await page.locator('#gh-contrib-retry').click();
  await expect(page.locator('#gh-total')).toHaveText('7');
  await expect(page.locator('#gh-contrib-retry')).toBeHidden();
});
test('initial activity loading stays bounded and heatmap has one keyboard entry', async ({
  page,
}) => {
  await mockGitHub(page);
  const requested = new Set();
  page.on('request', r => {
    const path = new URL(r.url()).searchParams.get('path') || '';
    if (path.includes('/commits?')) requested.add(path.split('/commits')[0]);
  });
  await page.goto('/#projects');
  await expect(page.locator('#stat-repos')).toHaveText('106');
  const visible = await page.locator('.showcase-project-card').count();
  await expect(page.locator('#projects-activity-caption')).toContainText(`${visible}/106`);
  expect(requested.size).toBeLessThanOrEqual(8);
  const cells = page.locator('.gh-hm__cell[data-label]');
  await expect(cells).toHaveCount(14);
  await expect(page.locator('.gh-hm__cell[tabindex="0"]')).toHaveCount(1);
  await cells.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(cells.nth(7)).toBeFocused();
});
