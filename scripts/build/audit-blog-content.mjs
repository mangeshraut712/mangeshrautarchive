import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { blogPosts, getBlogPostImage } from '../../src/js/modules/blog-data.js';
import { parseBlogContent } from '../../src/js/modules/blog-markdown.js';

const issues = [];
const rows = [];

for (const post of blogPosts) {
  const words = post.content.trim().split(/\s+/).length;
  const { html, headings } = parseBlogContent(post.content, { addHeadingIds: true });
  const expectedMinutes = Math.ceil(words / 190 + 1.5);
  const sourceLinks = [...post.content.matchAll(/\[[^\]]+\]\((https:\/\/[^)]+)\)/g)];
  const checks = [
    [words >= 950 && words <= 1350, `length ${words} outside 950–1350 words`],
    [post.readTime === `${expectedMinutes} min read`, `read time does not match ${words} words`],
    [headings.filter(heading => heading.level === 2).length >= 4, 'fewer than four sections'],
    [html.includes('class="article-figure"'), 'missing lead figure'],
    [html.includes('class="article-diagram"'), 'missing conceptual diagram'],
    [
      /class="article-(?:chart|framework|table-wrap)"/.test(html),
      'missing chart, framework, or data table',
    ],
    [/^### Sources\b/m.test(post.content), 'missing source section'],
    [/^## September 2026 evidence update$/m.test(post.content), 'missing dated evidence update'],
    [sourceLinks.length >= 2, `only ${sourceLinks.length} external evidence links`],
    [
      Boolean(post.updatedAt) && post.updatedAt >= post.date,
      'missing or earlier editorial update date',
    ],
  ];
  for (const [passes, issue] of checks) {
    if (!passes) issues.push(`${post.id}: ${issue}`);
  }
  try {
    await access(resolve('src', getBlogPostImage(post)));
  } catch {
    issues.push(`${post.id}: missing lead image`);
  }
  rows.push(`${post.id}: ${words} words, ${expectedMinutes} min, ${headings.length} headings`);
}

if (blogPosts.length !== 18) issues.push(`expected 18 articles; found ${blogPosts.length}`);
if (new Set(blogPosts.map(post => post.id)).size !== blogPosts.length)
  issues.push('duplicate article id');

console.log(rows.join('\n'));
if (issues.length) {
  console.error(`Blog content audit failed:\n${issues.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(
    'Blog content audit passed: 18 complete articles with comparable depth and rich media.'
  );
}
