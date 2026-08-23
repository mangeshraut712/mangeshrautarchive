import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const PAGES_URL = 'https://mangeshraut712.github.io/mangeshrautarchive';
let outputDir;

afterEach(async () => {
  delete process.env.OPENROUTER_SITE_URL;
  delete process.env.PAGES_SITE_URL;
  vi.resetModules();
  if (outputDir) await rm(outputDir, { recursive: true, force: true });
  outputDir = undefined;
});

describe('standalone blog page generation', () => {
  it('renders Pages-canonical discovery metadata and newsletter conversion forms', async () => {
    process.env.PAGES_SITE_URL = PAGES_URL;
    vi.resetModules();
    const { generateBlogPages } = await import('../../scripts/build/generate-blog-pages.mjs');
    outputDir = await mkdtemp(join(tmpdir(), 'blog-pages-'));

    await generateBlogPages(outputDir);

    const index = await readFile(join(outputDir, 'blog', 'index.html'), 'utf8');
    const article = await readFile(
      join(outputDir, 'blog', 'razorpay-vulcan-payments-foundation-model.html'),
      'utf8'
    );

    expect(index).toContain(`<link rel="canonical" href="${PAGES_URL}/blog"`);
    expect(index).toContain('data-newsletter-form');
    expect(index).toContain('data-source="blog_index_newsletter"');
    expect(article).toContain('<meta name="twitter:creator" content="@mrcommando712"');
    expect(article).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(article).toContain(
      `<meta property="og:image" content="${PAGES_URL}/assets/images/blog/razorpay-vulcan-architecture.svg"`
    );
    expect(article).toContain('max-image-preview:large');
    expect(article).toContain('data-source="blog_article_newsletter"');
    expect(article).toContain('data-newsletter-status');
    expect(article).toContain(
      `"image":"${PAGES_URL}/assets/images/blog/razorpay-vulcan-architecture.svg"`
    );
  });
});
