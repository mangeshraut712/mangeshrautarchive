import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { blogPosts } from '../../src/js/modules/blog-data.js';
import {
  buildTableOfContents,
  escapeHTML,
  formatBlogDate,
  getAllTags,
  getRelatedPosts,
  parseBlogContent,
} from '../../src/js/modules/blog-markdown.js';
import { ASSET_VER, fontAwesomeStylesheet } from './asset-version.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://mangeshraut.pro';
const ASSET_PREFIX = '..';

function sortedPosts() {
  return [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function pageShell({
  title,
  description,
  canonical,
  ogType = 'website',
  jsonLd,
  body,
  extraHead = '',
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="view-transition" content="same-origin" />
    <meta name="description" content="${escapeHTML(description)}" />
    <meta name="author" content="Mangesh Raut" />
    <meta name="robots" content="index, follow, max-image-preview:standard" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${escapeHTML(title)}" />
    <meta property="og:description" content="${escapeHTML(description)}" />
    <meta property="og:image" content="${SITE_URL}/assets/images/profile-icon.png" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHTML(title)}" />
    <meta name="twitter:description" content="${escapeHTML(description)}" />
    <meta name="twitter:image" content="${SITE_URL}/assets/images/profile-icon.png" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHTML(title)}</title>
    <link rel="icon" type="image/png" href="${ASSET_PREFIX}/assets/images/profile-icon.png" />
    <link rel="manifest" href="${ASSET_PREFIX}/manifest.json" />
    <link rel="alternate" type="application/rss+xml" title="RSS" href="${SITE_URL}/rss.xml" />
    <link rel="alternate" type="application/atom+xml" title="Atom" href="${SITE_URL}/feed.xml" />
    <link rel="stylesheet" href="${fontAwesomeStylesheet(ASSET_PREFIX)}" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="${fontAwesomeStylesheet(ASSET_PREFIX)}" /></noscript>
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/apple-design-system.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/typography-system.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/sitewide-design-system.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/global-improvements.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/accessibility.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/liquid-glass.css?v=${ASSET_VER}" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/liquid-glass.css?v=${ASSET_VER}" /></noscript>
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/blog.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/mobile-viewport.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/theme-solid-surfaces.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/apple-platform-features.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/chrome-surfaces.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/ux-polish-fixes.css?v=${ASSET_VER}" />
    <script src="${ASSET_PREFIX}/js/utils/liquid-glass-boot.js?v=${ASSET_VER}"></script>
    <script src="${ASSET_PREFIX}/js/utils/theme-head.js"></script>
    ${extraHead}
    ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}
  </head>
  <body class="blog-standalone-page">
    ${body}
    <script type="module" src="${ASSET_PREFIX}/js/core/subpage-chrome.js?v=${ASSET_VER}"></script>
    <script type="module" src="${ASSET_PREFIX}/js/modules/blog-page.js"></script>
  </body>
</html>`;
}

function renderBlogIndex(posts, tags) {
  const cards = posts
    .map(
      post => `
    <article class="blog-card x-post-card apple-3d-project lg-glass-card" data-id="${post.id}" data-tags="${escapeHTML((post.tags || []).join(','))}">
      <div class="blog-card-content">
        <div class="x-post-card__head">
          <img class="x-post-card__avatar" src="${ASSET_PREFIX}/assets/images/profile-icon.webp" width="44" height="44" alt="" loading="lazy" decoding="async" />
          <div class="x-post-card__identity">
            <div class="x-post-card__name-row">
              <span class="x-post-card__name">Mangesh Raut</span>
              <span class="x-post-card__handle">@mangeshraut</span>
              <span class="x-post-card__dot" aria-hidden="true">·</span>
              <time class="x-post-card__date" datetime="${escapeHTML(post.date)}">${formatBlogDate(post.date)}</time>
            </div>
            <div class="x-post-card__meta-row">
              <span class="blog-kicker">${escapeHTML(post.kicker || 'Field notes')}</span>
              <span class="blog-read-time">${escapeHTML(post.readTime)}</span>
            </div>
          </div>
        </div>
        <h2 class="blog-title"><a href="/blog/${post.id}" class="blog-title-link">${escapeHTML(post.title)}</a></h2>
        <p class="blog-summary">${escapeHTML(post.readerPromise || post.summary)}</p>
        <div class="blog-tags">${(post.tags || [])
          .slice(0, 5)
          .map(
            tag => `<span class="blog-tag">#${escapeHTML(String(tag).replace(/\s+/g, ''))}</span>`
          )
          .join('')}</div>
        <a class="blog-read-btn" href="/blog/${post.id}">Read article <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
      </div>
    </article>`
    )
    .join('');

  const tagFilters = tags
    .map(
      tag =>
        `<button type="button" class="blog-filter-chip" data-tag="${escapeHTML(tag)}" aria-pressed="false">${escapeHTML(tag)}</button>`
    )
    .join('');

  const body = `
    <a href="${ASSET_PREFIX}/" class="blog-back-link"><i class="fas fa-arrow-left" aria-hidden="true"></i> Back to portfolio</a>
    <main id="main-content" class="blog-index-main">
      <header class="blog-index-header lg-glass-card">
        <p class="blog-index-kicker">Technical Writings</p>
        <h1 class="blog-index-title">Field notes on AI, systems, and product engineering</h1>
        <p class="blog-index-lede">Long-form articles with reader promises, practical workflows, and honest tradeoffs — built for engineers who want signal, not hype.</p>
        <div class="blog-index-meta">
          <span>${posts.length} articles</span>
          <a href="${SITE_URL}/rss.xml" class="blog-feed-link">RSS</a>
          <a href="${SITE_URL}/feed.xml" class="blog-feed-link">Atom</a>
        </div>
      </header>
      <div class="blog-filter-bar" role="group" aria-label="Filter by topic">
        <button type="button" class="blog-filter-chip active" data-tag="all" aria-pressed="true">All topics</button>
        ${tagFilters}
      </div>
      <p id="blog-filter-status" class="blog-filter-status" aria-live="polite"></p>
      <div id="blog-posts-container" class="blog-index-grid">${cards}</div>
    </main>`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_URL}/blog#blog`,
    url: `${SITE_URL}/blog`,
    name: 'Mangesh Raut Technical Writings',
    description: 'Technical articles on software engineering, AI, cloud, and product engineering.',
    author: { '@type': 'Person', name: 'Mangesh Raut', url: SITE_URL },
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}/blog/${post.id}`,
      datePublished: post.date,
      description: post.summary,
    })),
  });

  return pageShell({
    title: 'Technical Writings | Mangesh Raut',
    description:
      'Technical articles on AI, systems design, cloud engineering, and product building by Mangesh Raut.',
    canonical: `${SITE_URL}/blog`,
    jsonLd,
    body,
  });
}

function renderBlogPost(post, posts) {
  const { html, headings } = parseBlogContent(post.content, { addHeadingIds: true });
  const toc = buildTableOfContents(headings);
  const related = getRelatedPosts(posts, post.id, 3);

  const relatedHtml = related.length
    ? `<section class="article-related" aria-label="Related articles">
        <h2 class="article-related-title">Related reading</h2>
        <div class="article-related-grid">
          ${related
            .map(
              r => `<a href="/blog/${r.id}" class="article-related-card lg-glass-card">
              <span class="article-related-kicker">${escapeHTML(r.kicker || 'Field notes')}</span>
              <span class="article-related-heading">${escapeHTML(r.title)}</span>
            </a>`
            )
            .join('')}
        </div>
      </section>`
    : '';

  const body = `
    <div class="blog-reading-progress" id="blog-reading-progress" aria-hidden="true"></div>
    <a href="/blog" class="blog-back-link"><i class="fas fa-arrow-left" aria-hidden="true"></i> All articles</a>
    <main id="main-content" class="blog-article-main">
      <article class="blog-article x-article">
        <header class="article-header">
          <div class="article-author-row">
            <img class="article-byline__avatar article-byline__avatar--lg" src="${ASSET_PREFIX}/assets/images/profile-icon.webp" width="48" height="48" alt="" loading="lazy" decoding="async" />
            <div class="article-author-text">
              <div class="article-author-name">Mangesh Raut</div>
              <div class="article-author-handle">@mangeshraut · Field notes</div>
            </div>
          </div>
          <h1 class="article-title">${escapeHTML(post.title)}</h1>
          <p class="article-promise">${escapeHTML(post.readerPromise || post.summary)}</p>
          <div class="article-byline">
            <span class="article-kicker">${escapeHTML(post.kicker || 'Field notes')}</span>
            <span aria-hidden="true">·</span>
            <time datetime="${post.date}">${formatBlogDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>${escapeHTML(post.readTime)}</span>
          </div>
          <div class="article-tags">${(post.tags || [])
            .map(
              tag => `<span class="blog-tag">#${escapeHTML(String(tag).replace(/\s+/g, ''))}</span>`
            )
            .join('')}</div>
        </header>
        <div class="blog-article-layout">
          ${toc ? `<aside class="blog-article-sidebar lg-glass-card">${toc}</aside>` : ''}
          <div class="article-body">${html}</div>
        </div>
        ${relatedHtml}
        <footer class="article-footer x-article-footer">
          <a href="${ASSET_PREFIX}/#contact" class="blog-read-btn">Discuss this topic</a>
        </footer>
      </article>
    </main>`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Person', name: 'Mangesh Raut', url: SITE_URL },
    publisher: { '@type': 'Person', name: 'Mangesh Raut' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.id}` },
    url: `${SITE_URL}/blog/${post.id}`,
    keywords: (post.tags || []).join(', '),
    articleSection: post.kicker || 'Technical Writings',
  });

  return pageShell({
    title: `${post.title} | Mangesh Raut`,
    description: post.summary,
    canonical: `${SITE_URL}/blog/${post.id}`,
    ogType: 'article',
    jsonLd,
    body,
  });
}

export async function generateBlogPages(distDir) {
  const blogDir = resolve(distDir, 'blog');
  await mkdir(blogDir, { recursive: true });

  const posts = sortedPosts();
  const tags = getAllTags(posts);

  await writeFile(resolve(blogDir, 'index.html'), renderBlogIndex(posts, tags), 'utf8');

  await Promise.all(
    posts.map(post =>
      writeFile(resolve(blogDir, `${post.id}.html`), renderBlogPost(post, posts), 'utf8')
    )
  );

  console.log(`📝 Generated blog index + ${posts.length} article pages in dist/blog/`);
  return posts;
}
