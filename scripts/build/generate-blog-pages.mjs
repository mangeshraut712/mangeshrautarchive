import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'esbuild';
import {
  blogPosts,
  getBlogPostImage,
  getBlogPostImageFit,
  retiredBlogPosts,
} from '../../src/js/modules/blog-data.js';
import {
  buildTableOfContents,
  escapeHTML,
  formatBlogDate,
  getRelatedPosts,
  getTopTags,
  parseBlogContent,
} from '../../src/js/modules/blog-markdown.js';
import {
  APPLE_TOUCH_ICON_180,
  ASSET_VER,
  PWA_ICON_192,
  PWA_ICON_512,
  fontAwesomeStylesheet,
  faviconLinks,
  pagesIconUrl,
} from './asset-version.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL =
  process.env.OPENROUTER_SITE_URL ||
  process.env.PAGES_SITE_URL ||
  'https://mangeshraut712.github.io/mangeshrautarchive';
const ASSET_PREFIX = '..';
const BLOG_STYLE_GROUPS = {
  'blog-core.bundle.css': [
    'apple-design-system.css',
    'typography-system.css',
    'sitewide-design-system.css',
    'global-improvements.css',
    'accessibility.css',
  ],
  'blog-layout.bundle.css': ['blog.css', 'mobile-viewport.css'],
  'blog-widgets.bundle.css': [
    'ux-polish-fixes.css',
    'ai-assistant.css',
    'ai-assistant-mobile.css',
    'share-widget.css',
  ],
};

/** Deploy path prefix ('' on Vercel apex, '/mangeshrautarchive' on GitHub Pages). */
function routePrefixFromSiteUrl(siteUrl) {
  try {
    const pathname = new URL(siteUrl).pathname.replace(/\/+$/, '');
    return !pathname || pathname === '/' ? '' : pathname;
  } catch {
    return '';
  }
}

const ROUTE_PREFIX = routePrefixFromSiteUrl(SITE_URL);

/** Relative in-folder links work on Vercel + GitHub Pages without cleanUrls. */
function blogPostHref(id) {
  return `./${encodeURIComponent(id)}.html`;
}

function blogIndexHref() {
  return './';
}

function sortedPosts() {
  return [...blogPosts].sort(
    (a, b) =>
      new Date(b.publishedAt || b.date) - new Date(a.publishedAt || a.date) ||
      b.id.localeCompare(a.id)
  );
}

function postImagePath(post) {
  return getBlogPostImage(post);
}

function postImageUrl(post) {
  const image = postImagePath(post);
  return /^https?:\/\//i.test(image) ? image : `${SITE_URL}/${image.replace(/^\/+/, '')}`;
}

function newsletterCard({ id, source, title }) {
  const safeId = String(id)
    .replace(/[^a-z0-9-]/gi, '-')
    .toLowerCase();
  return `<aside class="newsletter-card newsletter-card--standalone" aria-labelledby="${safeId}-title">
    <div class="icon-box blue newsletter-icon" aria-hidden="true"><i class="fas fa-envelope-open-text"></i></div>
    <h2 id="${safeId}-title">${escapeHTML(title)}</h2>
    <p>Two field notes each month on AI systems, developer tools, and product engineering.</p>
    <form class="newsletter-form" data-newsletter-form data-source="${escapeHTML(source)}" novalidate>
      <label class="sr-only" for="${safeId}-email">Email address for newsletter</label>
      <input class="apple-input" id="${safeId}-email" name="email" type="email" maxlength="200" autocomplete="email" inputmode="email" placeholder="you@example.com" required aria-required="true" />
      <label class="form-honeypot" aria-hidden="true">Website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
      <button class="btn-primary newsletter-submit-btn" type="submit"><span class="newsletter-submit-text">Subscribe</span></button>
      <p class="newsletter-status" data-newsletter-status role="status" aria-live="polite" hidden></p>
    </form>
    <p class="newsletter-privacy">Your email is stored securely for newsletter updates only.</p>
  </aside>`;
}

function topicPills(tags = [], limit = 3) {
  return (tags || [])
    .slice(0, limit)
    .map(tag => `<span class="blog-topic-pill">${escapeHTML(tag)}</span>`)
    .join('');
}

function pageShell({
  title,
  description,
  canonical,
  ogType = 'website',
  jsonLd,
  body,
  extraHead = '',
  image = `${SITE_URL}/assets/images/profile-icon.png`,
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="view-transition" content="same-origin" />
    <meta name="description" content="${escapeHTML(description)}" />
    <meta name="author" content="Mangesh Raut" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${escapeHTML(title)}" />
    <meta property="og:description" content="${escapeHTML(description)}" />
    <meta property="og:image" content="${escapeHTML(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:creator" content="@mrcommando712" />
    <meta name="twitter:title" content="${escapeHTML(title)}" />
    <meta name="twitter:description" content="${escapeHTML(description)}" />
    <meta name="twitter:image" content="${escapeHTML(image)}" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHTML(title)}</title>
    ${faviconLinks('../')}
    <link rel="apple-touch-icon" href="${pagesIconUrl(APPLE_TOUCH_ICON_180)}" sizes="180x180" />
    <link rel="apple-touch-icon-precomposed" href="${pagesIconUrl(APPLE_TOUCH_ICON_180)}" sizes="180x180" />
    <link rel="apple-touch-icon" href="${pagesIconUrl(PWA_ICON_192)}" sizes="192x192" />
    <link rel="apple-touch-icon-precomposed" href="${pagesIconUrl(PWA_ICON_192)}" sizes="192x192" />
    <link rel="apple-touch-icon" href="${pagesIconUrl(PWA_ICON_512)}" sizes="512x512" />
<link rel="manifest" href="${ASSET_PREFIX}/manifest.json" />
    <link rel="alternate" type="application/rss+xml" title="RSS" href="${SITE_URL}/rss.xml" />
    <link rel="alternate" type="application/atom+xml" title="Atom" href="${SITE_URL}/feed.xml" />
    <link rel="stylesheet" href="${fontAwesomeStylesheet(ASSET_PREFIX)}" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="${fontAwesomeStylesheet(ASSET_PREFIX)}" /></noscript>
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/blog-core.bundle.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/liquid-glass.css?v=${ASSET_VER}" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/liquid-glass.css?v=${ASSET_VER}" /></noscript>
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/blog-layout.bundle.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/theme-solid-surfaces.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/apple-platform-features.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/chrome-surfaces.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/blog-widgets.bundle.css?v=${ASSET_VER}" data-includes-styles="ai-assistant.css ai-assistant-mobile.css" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/wwdc26-liquid-glass.css?v=${ASSET_VER}" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/wwdc26-liquid-glass.css?v=${ASSET_VER}" /></noscript>
    <script src="${ASSET_PREFIX}/js/utils/liquid-glass-boot.js?v=${ASSET_VER}"></script>
    <script src="${ASSET_PREFIX}/js/utils/theme-head.js?v=${ASSET_VER}"></script>
    <script src="${ASSET_PREFIX}/js/utils/deferred-analytics.js?v=${ASSET_VER}" defer></script>
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/blog-reader.css?v=${ASSET_VER}" />
    ${extraHead}
    ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}
  </head>
  <body class="blog-standalone-page">
    <div class="skip-links" role="navigation" aria-label="Skip links">
      <a href="#main-content" class="skip-link">Skip to main content</a>
    </div>
    ${body}
    <script type="module" src="${ASSET_PREFIX}/js/core/subpage-chrome.js?v=${ASSET_VER}"></script>
    <script type="module" src="${ASSET_PREFIX}/js/modules/blog-page.js"></script>
  </body>
</html>`;
}

function renderBlogIndex(posts, tags) {
  const [featured] = posts;
  const archivePosts = posts;
  const cards = archivePosts
    .map(
      post => `
    <article class="blog-card blog-card--editorial" data-id="${post.id}" data-date="${escapeHTML(post.publishedAt || post.date)}" data-search="${escapeHTML([post.title, post.summary, ...(post.tags || [])].join(' '))}" data-tags="${escapeHTML((post.tags || []).join(','))}">
      <a class="blog-card-media blog-media--${getBlogPostImageFit(post)}" href="${blogPostHref(post.id)}" aria-label="Read ${escapeHTML(post.title)}">
        <img src="../${escapeHTML(postImagePath(post))}" alt="" width="1600" height="900" loading="lazy" decoding="async" />
        <span class="blog-card-media-shine" aria-hidden="true"></span>
      </a>
      <div class="blog-card-content">
        <div class="blog-card-top">
          <div class="blog-card-meta">
            <span class="blog-kicker">${escapeHTML(post.kicker || 'Field notes')}</span>
            <span class="blog-card-meta-sep" aria-hidden="true">·</span>
            <time class="blog-card-date" datetime="${escapeHTML(post.publishedAt || post.date)}">${formatBlogDate(post.publishedAt || post.date)}</time>
            <span class="blog-card-meta-sep" aria-hidden="true">·</span>
            <span class="blog-read-time">${escapeHTML(post.readTime)}</span>
          </div>
        </div>
        <h2 class="blog-title"><a href="${blogPostHref(post.id)}" class="blog-title-link">${escapeHTML(post.title)}</a></h2>
        <p class="blog-summary">${escapeHTML(post.readerPromise || post.summary)}</p>
        <div class="blog-tags blog-tags--pills">${topicPills(post.tags, 2)}</div>
        <div class="blog-card-cta-row">
          <a class="blog-read-btn" href="${blogPostHref(post.id)}">Read article <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
        </div>
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
    <main id="main-content" class="blog-index-main">
      <a href="${ASSET_PREFIX}/" class="blog-back-link"><i class="fas fa-arrow-left" aria-hidden="true"></i> Back to portfolio</a>
      <header class="blog-index-header">
        <p class="blog-index-kicker">The engineering journal</p>
        <h1 class="blog-index-title">Field notes on AI, systems, and product engineering</h1>
        <p class="blog-index-lede">Ideas, evidence, and practical lessons on building with technology. Explore AI, developer tools, and product engineering through the decisions that matter.</p>
        <div class="blog-index-meta">
          <span>${posts.length} articles</span>
          <span>Two articles per month · January–October 2026</span>
          <span>Latest editorial update ${formatBlogDate(
            posts
              .map(post => post.updatedAt || post.date)
              .sort()
              .at(-1)
          )}</span>
        </div>
      </header>
      <section class="blog-featured" aria-labelledby="blog-featured-title">
        <a class="blog-featured-media blog-media--${getBlogPostImageFit(featured)}" href="${blogPostHref(featured.id)}" aria-label="Read ${escapeHTML(featured.title)}">
          <img src="../${escapeHTML(postImagePath(featured))}" alt="" width="1600" height="900" decoding="async" fetchpriority="high" />
          <span class="blog-featured-badge">Latest field note</span>
        </a>
        <div class="blog-featured-copy">
          <p class="blog-index-kicker">${escapeHTML(featured.kicker || 'Field notes')}</p>
          <time class="blog-card-date" datetime="${escapeHTML(featured.publishedAt || featured.date)}">${formatBlogDate(featured.publishedAt || featured.date)}</time>
          <h2 id="blog-featured-title"><a href="${blogPostHref(featured.id)}">${escapeHTML(featured.title)}</a></h2>
          <p>${escapeHTML(featured.readerPromise || featured.summary)}</p>
          <div class="blog-tags blog-tags--pills">${topicPills(featured.tags, 3)}</div>
          <a class="blog-read-btn" href="${blogPostHref(featured.id)}">Read the latest <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
        </div>
      </section>
      <div class="blog-archive-heading">
        <div>
          <p class="blog-index-kicker">The archive</p>
          <h2>Explore every field note</h2>
        </div>
        <p>${archivePosts.length} practical reads across AI, infrastructure, developer tools, and product systems.</p>
      </div>
      <form class="blog-discovery" role="search" id="blog-search-form">
        <label for="blog-search">Search the journal
          <input id="blog-search" type="search" placeholder="Search articles, ideas, or topics" autocomplete="off" maxlength="160" aria-controls="blog-posts-container" />
        </label>
        <label for="blog-sort">Sort by
          <select id="blog-sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select>
        </label>
      </form>
      <div class="blog-filter-bar" role="group" aria-label="Filter by topic">
        <button type="button" class="blog-filter-chip active" data-tag="all" aria-pressed="true">All topics</button>
        ${tagFilters}
      </div>
      <p id="blog-filter-status" class="blog-filter-status" role="status" aria-live="polite">${posts.length} articles</p>
      <div id="blog-empty-state" class="blog-empty-state" hidden><h3>No articles found</h3><p>Try another search or clear the selected topic.</p><button type="button" id="blog-reset" class="blog-reader-button">Reset filters</button></div>
      <div id="blog-posts-container" class="blog-index-grid is-expanded">${cards}</div>
      ${newsletterCard({ id: 'blog-index-newsletter', source: 'blog_index_newsletter', title: 'Get the next field note' })}
    </main>`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_URL}/blog/#blog`,
    url: `${SITE_URL}/blog/`,
    name: 'Mangesh Raut Technical Writings',
    description: 'Technical articles on software engineering, AI, cloud, and product engineering.',
    author: { '@type': 'Person', name: 'Mangesh Raut', url: SITE_URL },
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}/blog/${post.id}.html`,
      datePublished: post.publishedAt || post.date,
      dateModified: post.updatedAt || post.date,
      description: post.summary,
    })),
  });

  return pageShell({
    title: 'Technical Writings | Mangesh Raut',
    description:
      'Technical articles on AI, systems design, cloud engineering, and product building by Mangesh Raut.',
    canonical: `${SITE_URL}/blog/`,
    jsonLd,
    body,
    image: postImageUrl(posts[0]),
  });
}

function renderBlogPost(post, posts) {
  const { html, headings } = parseBlogContent(post.content, {
    addHeadingIds: true,
    assetPrefix: '..',
  });
  const toc = buildTableOfContents(headings);
  const evidenceHeading = headings.find(heading =>
    /^(September|October) 2026 evidence update$/.test(heading.text)
  );
  const sourcesHeading = headings.find(heading => heading.text.startsWith('Sources'));
  const related = getRelatedPosts(posts, post.id, 3);

  const relatedHtml = related.length
    ? `<section class="article-related" aria-label="Related articles">
        <h2 class="article-related-title">Related reading</h2>
        <div class="article-related-grid">
          ${related
            .map(
              r => `<a href="${blogPostHref(r.id)}" class="article-related-card">
              <span class="article-related-kicker">${escapeHTML(r.kicker || 'Field notes')}</span>
              <span class="article-related-heading">${escapeHTML(r.title)}</span>
              <span class="article-related-meta">${escapeHTML(r.readTime)}</span>
            </a>`
            )
            .join('')}
        </div>
      </section>`
    : '';

  const body = `
    <div class="blog-reading-progress" id="blog-reading-progress" aria-hidden="true"></div>
    <main id="main-content" class="blog-article-main" data-post-id="${escapeHTML(post.id)}">
      <article class="blog-article blog-article--editorial x-article" data-post-id="${escapeHTML(post.id)}">
        <nav class="blog-article-nav" aria-label="Article navigation">
          <a href="${blogIndexHref()}" class="blog-back-link"><i class="fas fa-arrow-left" aria-hidden="true"></i> All articles</a>
          <div class="article-header-tools" aria-hidden="false"></div>
        </nav>
        <header class="article-header">
          <p class="article-kicker">${escapeHTML(post.kicker || 'Field notes')}</p>
          <h1 class="article-title">${escapeHTML(post.title)}</h1>
          <p class="article-promise">${escapeHTML(post.readerPromise || post.summary)}</p>
          <div class="article-byline article-byline--editorial">
            <img class="article-byline__avatar" src="${ASSET_PREFIX}/assets/images/profile.webp" width="40" height="40" alt="Mangesh Raut" loading="lazy" decoding="async" />
            <div class="article-byline__text">
              <a class="article-byline__name" href="../about.html">Mangesh Raut</a>
              <span class="article-byline__meta">
                <span>${post.publishedAt ? 'Issue date ' : 'Published '}<time datetime="${post.date}">${formatBlogDate(post.date)}</time></span>
                ${post.publishedAt ? `<span>First published <time datetime="${escapeHTML(post.publishedAt)}">${formatBlogDate(post.publishedAt)}</time></span>` : ''}
                <span aria-hidden="true">·</span>
                <span>${escapeHTML(post.readTime)}</span>
                <span aria-hidden="true">·</span>
                <span>Updated <time datetime="${escapeHTML(post.updatedAt || post.date)}">${formatBlogDate(post.updatedAt || post.date)}</time></span>
              </span>
            </div>
          </div>
          <div class="article-reader-actions">
            <button type="button" class="blog-reader-button" data-copy-article>Copy article link</button>
            <a class="blog-reader-button" href="${SITE_URL}/rss.xml">Follow via RSS</a>
            <span id="article-copy-status" role="status" aria-live="polite"></span>
          </div>
          <div class="article-tags blog-tags--pills">${topicPills(post.tags, 6)}</div>
          <nav class="article-evidence-nav" aria-label="Article evidence and sources">
            <span class="article-evidence-nav__label">Evidence trail</span>
            ${evidenceHeading ? `<a href="#${escapeHTML(evidenceHeading.id)}">What changed in 2026</a>` : ''}
            ${sourcesHeading ? `<a href="#${escapeHTML(sourcesHeading.id)}">Original sources</a>` : ''}
          </nav>
        </header>
        <div class="blog-article-layout">
          ${toc ? `<aside class="blog-article-sidebar" id="blog-article-toc">${toc}</aside>` : ''}
          <div class="article-body article-body--measure" id="article-content">
            ${(post.highlights || []).length ? `<aside class="article-overview" aria-label="In this field note"><h2>In this field note</h2><ul>${post.highlights.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul></aside>` : ''}
            ${html}
          </div>
        </div>
        <aside class="article-author-note" aria-label="About the author">
          <img src="../assets/images/profile.webp" alt="" width="56" height="56" loading="lazy" decoding="async" />
          <div><h2>Written by Mangesh Raut</h2><p>Field notes on AI, software systems, and product engineering. Explore the projects and engineering work behind this journal.</p><a href="../about.html">About Mangesh <span aria-hidden="true">→</span></a></div>
        </aside>
        ${newsletterCard({ id: `blog-${post.id}-newsletter`, source: 'blog_article_newsletter', title: 'Continue the field notes' })}
        <div data-blog-reactions-host></div>
        ${relatedHtml}
      </article>
    </main>`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt || post.date,
    dateModified: post.updatedAt || post.date,
    author: { '@type': 'Person', name: 'Mangesh Raut', url: SITE_URL },
    publisher: { '@type': 'Person', name: 'Mangesh Raut' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.id}.html` },
    url: `${SITE_URL}/blog/${post.id}.html`,
    keywords: (post.tags || []).join(', '),
    articleSection: post.kicker || 'Technical Writings',
    image: postImageUrl(post),
  });

  return pageShell({
    title: `${post.title} | Mangesh Raut`,
    description: post.summary,
    canonical: `${SITE_URL}/blog/${post.id}.html`,
    ogType: 'article',
    jsonLd,
    body,
    image: postImageUrl(post),
  });
}

export async function generateBlogPages(distDir) {
  const blogDir = resolve(distDir, 'blog');
  const cssDir = resolve(distDir, 'assets/css');
  await Promise.all([mkdir(blogDir, { recursive: true }), mkdir(cssDir, { recursive: true })]);
  await Promise.all(
    Object.entries(BLOG_STYLE_GROUPS).map(async ([outputName, files]) => {
      const styles = await Promise.all(
        files.map(file => readFile(resolve(__dirname, '../../src/assets/css', file), 'utf8'))
      );
      const result = await transform(styles.join('\n'), { loader: 'css', minify: true });
      await writeFile(resolve(cssDir, outputName), result.code, 'utf8');
    })
  );

  const posts = sortedPosts();
  const tags = getTopTags(posts, 8);

  await writeFile(resolve(blogDir, 'index.html'), renderBlogIndex(posts, tags), 'utf8');

  await Promise.all(
    posts.map(post =>
      writeFile(resolve(blogDir, `${post.id}.html`), renderBlogPost(post, posts), 'utf8')
    )
  );

  // Keep old incoming links honest: explain the retirement rather than silently
  // redirecting a payments or decision-model URL to an unrelated event article.
  for (const retired of retiredBlogPosts) {
    const replacement = posts.find(post => post.id === retired.replacementId);
    const body = `<main id="main-content" class="blog-index-main">
      <a class="blog-back-link" href="./">Back to the archive</a>
      <header class="blog-index-header">
        <p class="blog-index-kicker">Archive update · September 29, 2026</p>
        <h1 class="blog-index-title">This article has been retired</h1>
        <p class="blog-index-lede">The ${escapeHTML(retired.title)} article was removed from the active September issue when the archive was revised to two articles per month.</p>
        <p>Its September slot now features <a href="${blogPostHref(replacement.id)}">${escapeHTML(replacement.title)}</a>.</p>
      </header>
    </main>`;
    await writeFile(
      resolve(blogDir, `${retired.id}.html`),
      pageShell({
        title: 'Retired article | Mangesh Raut',
        description: 'This article has been retired from the monthly archive.',
        canonical: `${SITE_URL}/blog/`,
        extraHead: '<meta name="robots" content="noindex,follow" />',
        body,
      }),
      'utf8'
    );
  }

  return { count: posts.length, routePrefix: ROUTE_PREFIX };
}
