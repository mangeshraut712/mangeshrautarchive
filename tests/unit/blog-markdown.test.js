import { describe, expect, it } from 'vitest';
import {
  parseBlogContent,
  buildTableOfContents,
  formatBlogDate,
  getAllTags,
  getTopTags,
} from '../../src/js/modules/blog-markdown.js';
import { blogPosts } from '../../src/js/modules/blog-data.js';

describe('blog markdown parser and rich format suite', () => {
  it('parses markdown tables into semantic HTML table wraps', () => {
    const tableMd = `| Feature | OpenRouter | Direct API |
| --- | --- | --- |
| Provider Diversity | Yes (Multi-host) | Single Provider |
| Sticky Routing | Supported | Custom SDK |`;

    const { html } = parseBlogContent(tableMd);
    expect(html).toContain('class="article-table-wrap"');
    expect(html).toContain('class="article-table"');
    expect(html).toContain('<th>Feature</th>');
    expect(html).toContain('<td>Provider Diversity</td>');
    expect(html).toContain('<td>Yes (Multi-host)</td>');
  });

  it('renders rich code blocks with language badge and copy button', () => {
    const codeMd = '```json\n{\n  "lane": "frontier",\n  "model": "grok-4.5"\n}\n```';
    const { html } = parseBlogContent(codeMd);
    expect(html).toContain('class="article-code-wrap"');
    expect(html).toContain('data-copy-code');
    expect(html).toContain('article-code-lang');
    expect(html).toContain('json');
    expect(html).toContain('"lane": "frontier"');
  });

  it('renders structured callout boxes with proper aria and styling', () => {
    const calloutMd = `:::callout
type: tip
label: ROUTING RULE
text: Always specify session_id for multi-turn caching.
:::`;

    const { html } = parseBlogContent(calloutMd);
    expect(html).toContain('article-callout--tip');
    expect(html).toContain('ROUTING RULE');
    expect(html).toContain('Always specify session_id for multi-turn caching.');
  });

  it('renders rich embed cards with external arrow icon', () => {
    const embedMd = `:::embed
kicker: Official Docs
title: OpenRouter Auto Router
href: https://openrouter.ai/docs/routers
desc: Routing parameters and failover policies
:::`;

    const { html } = parseBlogContent(embedMd);
    expect(html).toContain('article-embed-card');
    expect(html).toContain('Official Docs');
    expect(html).toContain('OpenRouter Auto Router');
    expect(html).toContain('https://openrouter.ai/docs/routers');
  });

  it('verifies all 18 blog posts have complete tags and metadata', () => {
    expect(blogPosts).toHaveLength(18);
    blogPosts.forEach(post => {
      expect(post.id).toBeTruthy();
      expect(post.title).toBeTruthy();
      expect(post.tags).toBeInstanceOf(Array);
      expect(post.tags.length).toBeGreaterThan(0);
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.readTime).toMatch(/min read$/);
      expect(post.summary).toBeTruthy();
      expect(post.readerPromise).toBeTruthy();
      expect(post.pullQuote).toBeTruthy();
    });

    const tags = getAllTags(blogPosts);
    expect(tags.length).toBeGreaterThan(10);
    const topTags = getTopTags(blogPosts, 5);
    expect(topTags.length).toBe(5);

    expect(formatBlogDate('2026-08-15')).toContain('August 15, 2026');
    const toc = buildTableOfContents([
      { level: 2, text: 'Fast Context', id: 'fast-context' },
      { level: 3, text: 'TL;DR', id: 'tldr' },
    ]);
    expect(toc).toContain('class="article-toc"');
    expect(toc).toContain('#fast-context');
  });

  it('parses figure blocks into semantic HTML figures with image and caption', () => {
    const figureMd = `:::figure
src: assets/images/blog/openrouter-routing.jpg
alt: OpenRouter 2026 Routing
caption: Figure 1.0 — Intelligent routing lanes
:::`;

    const { html } = parseBlogContent(figureMd, { assetPrefix: '..' });
    expect(html).toContain('class="article-figure"');
    expect(html).toContain('src="../assets/images/blog/openrouter-routing.jpg"');
    expect(html).toContain('alt="OpenRouter 2026 Routing"');
    expect(html).toContain(
      '<figcaption class="article-figure__caption">Figure 1.0 — Intelligent routing lanes</figcaption>'
    );
  });

  it('verifies all 18 blog posts contain rich media figures', () => {
    blogPosts.forEach(post => {
      expect(post.content).toContain(':::figure');
      expect(post.content).toMatch(/src:\s*assets\/images\/blog\/[\w.-]+/);
      expect(post.content).toContain('alt:');
      expect(post.content).toContain('caption:');
    });
  });

  it('validates Cursor Origin August 2026 post content', () => {
    const cursorPost = blogPosts.find(p => p.id === 'cursor-origin-agent-native-code-hosting');
    expect(cursorPost).toBeDefined();
    expect(cursorPost.date).toBe('2026-08-06');
    expect(cursorPost.tags).toContain('Cursor');
    expect(cursorPost.tags).toContain('Cursor Origin');
    expect(cursorPost.content).toContain('cursor-origin-architecture.jpg');
    expect(cursorPost.content).toContain('Two-Way Real-Time GitHub Sync');
    expect(cursorPost.content).toContain('Vercel');
  });

  it('validates Razorpay Vulcan August 2026 post content', () => {
    const vulcanPost = blogPosts.find(p => p.id === 'razorpay-vulcan-payments-foundation-model');
    expect(vulcanPost).toBeDefined();
    expect(vulcanPost.date).toBe('2026-08-13');
    expect(vulcanPost.tags).toContain('Razorpay Vulcan');
    expect(vulcanPost.tags).toContain('NVIDIA');
    expect(vulcanPost.content).toContain('razorpay-vulcan-architecture.jpg');
    expect(vulcanPost.content).toContain('4 billion payments');
    expect(vulcanPost.content).toContain('3 trillion data points');
  });

  it('validates UPI Tap to Pay September 2026 post content', () => {
    const upiPost = blogPosts.find(p => p.id === 'upi-tap-to-pay-and-2026-payment-architecture');
    expect(upiPost).toBeDefined();
    expect(upiPost.date).toBe('2026-09-14');
    expect(upiPost.tags).toContain('UPI');
    expect(upiPost.tags).toContain('Fintech');
    expect(upiPost.tags).toContain('NFC');
    expect(upiPost.content).toContain('upi-tap-to-pay-architecture.jpg');
    expect(upiPost.content).toContain('Host Card Emulation');
    expect(upiPost.content).toContain('UPI Circle');
  });

  it('validates TypeSafe AI Jev September 2026 post content', () => {
    const jevPost = blogPosts.find(p => p.id === 'typesafe-ai-jev-system-one-decisions-2026');
    expect(jevPost).toBeDefined();
    expect(jevPost.date).toBe('2026-09-18');
    expect(jevPost.tags).toContain('TypeSafe AI');
    expect(jevPost.tags).toContain('Jev');
    expect(jevPost.tags).toContain('System 1');
    expect(jevPost.content).toContain('typesafe-ai-jev-architecture.jpg');
    expect(jevPost.content).toContain('Jevons Paradox');
    expect(jevPost.content).toContain('RLCD');
  });
});
