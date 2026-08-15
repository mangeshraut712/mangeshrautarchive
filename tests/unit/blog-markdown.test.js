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

  it('verifies all 14 blog posts have complete tags and metadata', () => {
    expect(blogPosts).toHaveLength(14);
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
});
