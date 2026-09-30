import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { blogPosts, getBlogPostImage } from '../../src/js/modules/blog-data.js';
import { parseBlogContent } from '../../src/js/modules/blog-markdown.js';

const issues = [];
const rows = [];
const mediaManifest = JSON.parse(await readFile('src/assets/data/blog-media-sources.json', 'utf8'));
const leadMedia = mediaManifest.media.filter(media => media.role === 'lead');
const mediaHashes = new Set();
for (const media of mediaManifest.media) {
  const buffer = await readFile(resolve('src', media.localPath));
  const hash = createHash('sha256').update(buffer).digest('hex');
  if (hash !== media.localSha256) issues.push(`${media.postId}: media checksum mismatch`);
  if (mediaHashes.has(hash)) issues.push(`${media.postId}: duplicate media asset`);
  mediaHashes.add(hash);
  if (media.kind === 'conceptual-fallback') {
    if (!media.fallbackReason || !media.referencePage)
      issues.push(`${media.postId}: conceptual fallback lacks a documented source search`);
  } else if (
    !media.sourcePage?.startsWith('https://') ||
    !media.sourceUrl?.startsWith('https://')
  ) {
    issues.push(`${media.postId}: publisher media lacks original page and asset URLs`);
  }
}
const monthlyCounts = new Map(
  Array.from({ length: 9 }, (_, index) => [`2026-${String(index + 1).padStart(2, '0')}`, 0])
);

function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

for (const post of blogPosts) {
  const media = leadMedia.filter(item => item.postId === post.id);
  if (media.length !== 1 || media[0]?.localPath !== getBlogPostImage(post))
    issues.push(`${post.id}: lead media does not match its provenance record`);
  const month = post.date.slice(0, 7);
  if (!monthlyCounts.has(month))
    issues.push(`${post.id}: outside the January–September 2026 archive`);
  monthlyCounts.set(month, (monthlyCounts.get(month) || 0) + 1);
  const words = post.content.trim().split(/\s+/).length;
  const { html, headings } = parseBlogContent(post.content, { addHeadingIds: true });
  const expectedMinutes = Math.ceil(words / 190 + 1.5);
  const sourceLinks = [...post.content.matchAll(/\[[^\]]+\]\((https:\/\/[^)]+)\)/g)];
  const checks = [
    [
      validDate(post.date) && validDate(post.updatedAt) && validDate(post.publishedAt || post.date),
      'invalid calendar date',
    ],
    [words >= 950 && words <= 1350, `length ${words} outside 950–1350 words`],
    [post.readTime === `${expectedMinutes} min read`, `read time does not match ${words} words`],
    [headings.filter(heading => heading.level === 2).length >= 4, 'fewer than four sections'],
    [html.includes('class="article-figure"'), 'missing lead figure'],
    [html.includes('article-figure__credit'), 'missing visible media attribution'],
    [html.includes('class="article-diagram"'), 'missing conceptual diagram'],
    [
      /class="article-(?:chart|framework|table-wrap)"/.test(html),
      'missing chart, framework, or data table',
    ],
    [/^### Sources\b/m.test(post.content), 'missing source section'],
    [/^## September 2026 evidence update$/m.test(post.content), 'missing dated evidence update'],
    [sourceLinks.length >= 2, `only ${sourceLinks.length} external evidence links`],
    [
      Boolean(post.updatedAt) &&
        post.updatedAt >= (post.publishedAt || post.date) &&
        post.updatedAt >= post.date,
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

for (const [month, count] of monthlyCounts) {
  if (count !== 2) issues.push(`${month}: expected exactly two articles; found ${count}`);
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
    'Blog content audit passed: 18 complete articles, exactly two per month from January through September 2026.'
  );
}
