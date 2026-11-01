import { chromium, expect, test } from '@playwright/test';
import { sitePath } from './helpers/site.js';

test('native WebMCP exposes the portfolio tools in Chromium', async ({ baseURL }) => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-features=WebMCP'] });
  try {
    const page = await browser.newPage();
    await page.goto(new URL(sitePath('/'), baseURL).href, { waitUntil: 'load' });
    await page.locator('#chatbot-toggle').click();
    await expect
      .poll(
        async () => page.evaluate(async () => (await document.modelContext.getTools()).length),
        {
          timeout: 15_000,
        }
      )
      .toBeGreaterThanOrEqual(22);
    const names = await page.evaluate(async () =>
      (await document.modelContext.getTools()).map(tool => tool.name)
    );
    expect(names).toContain('navigate_to_section');
    expect(names).toContain('open_blog_article');
    expect(names).toContain('search_blog_articles');
    expect(names).toContain('inspect_case_study');
    const results = await page.evaluate(async () => {
      const tools = await document.modelContext.getTools();
      const call = async (name, input) => {
        const tool = tools.find(entry => entry.name === name);
        return JSON.parse(await document.modelContext.executeTool(tool, input));
      };
      return {
        search: await call('search_blog_articles', { query: 'PROLED' }),
        empty: await call('search_blog_articles', { query: '   ' }),
        study: await call('inspect_case_study', { slug: 'portfolio' }),
        missing: await call('inspect_case_study', { slug: 'unknown' }),
      };
    });
    expect(
      results.search.results.some(post => post.id === 'macbook-pro-touchscreen-proled-xdr-2026')
    ).toBe(true);
    expect(results.empty.success).toBe(false);
    expect(results.study.caseStudy.slug).toBe('portfolio');
    expect(results.study.caseStudy.url).toContain('/case-studies/portfolio.html');
    expect(results.missing.success).toBe(false);
  } finally {
    await browser.close();
  }
});
