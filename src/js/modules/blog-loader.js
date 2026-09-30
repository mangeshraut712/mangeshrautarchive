import { blogPosts, getBlogPostImage, getBlogPostImageFit, retiredBlogPosts } from './blog-data.js';
import { escapeHTML as escapeHtmlShared } from '../utils/escape-html.js';
import { sitePath } from '../utils/site-base.js';

/**
 * Blog Loader Module
 * Renders blog cards with direct links to complete articles
 */

class BlogLoader {
  constructor() {
    this.container = document.getElementById('blog-posts-container');
    this.init();
  }

  init() {
    if (!this.container) return;

    this.renderPosts();
    this.bindCodeCopy();
    this.bindDeepLinks();
    this.syncPostCount();
  }

  syncPostCount() {
    const countEl = document.getElementById('blog-post-count');
    if (countEl) {
      countEl.textContent = `(${blogPosts.length})`;
    }
  }

  bindCodeCopy() {
    document.addEventListener('click', event => {
      const copyBtn = event.target.closest('[data-copy-code]');
      if (!copyBtn) return;
      const wrap = copyBtn.closest('.article-code-wrap');
      const codeEl = wrap?.querySelector('code');
      if (!codeEl) return;
      const originalHtml = copyBtn.innerHTML;
      navigator.clipboard
        .writeText(codeEl.innerText)
        .then(() => {
          copyBtn.classList.add('is-copied');
          copyBtn.innerHTML =
            '<i class="fas fa-check" aria-hidden="true"></i> <span>Copied!</span>';
          setTimeout(() => {
            copyBtn.classList.remove('is-copied');
            copyBtn.innerHTML = originalHtml;
          }, 2000);
        })
        .catch(() => {});
    });
  }

  bindDeepLinks() {
    // Preserve shared preview URLs while taking readers to the full article.
    const openFullArticle = id => {
      const post = [...blogPosts, ...retiredBlogPosts].find(item => item.id === id);
      if (!post) return;
      window.location.assign(sitePath(`/blog/${encodeURIComponent(post.id)}.html`));
    };

    const tryLegacyLink = () => {
      const pending = window.__pendingBlogOpen;
      if (pending) {
        delete window.__pendingBlogOpen;
        openFullArticle(pending);
        return;
      }
      const match = window.location.hash.match(/^#blog-read-([^&]+)/);
      if (match) openFullArticle(decodeURIComponent(match[1]));
    };

    window.addEventListener('portfolio:open-blog', event => {
      if (event.detail?.id) openFullArticle(event.detail.id);
    });
    tryLegacyLink();
    window.addEventListener('hashchange', tryLegacyLink);
  }

  renderPosts() {
    const sortedPosts = blogPosts.toSorted(
      (a, b) => new Date(b.date) - new Date(a.date) || b.id.localeCompare(a.id)
    );

    this.container.innerHTML = sortedPosts
      .slice(0, 4)
      .map((post, index) => {
        const fullHref = sitePath(`/blog/${encodeURIComponent(post.id)}.html`);
        const pills = (post.tags || [])
          .slice(0, 2)
          .map(tag => `<span class="blog-topic-pill">${this.escapeHTML(tag)}</span>`)
          .join('');
        const kicker = post.kicker || 'Field notes';
        const image = sitePath(`/${getBlogPostImage(post)}`);

        return `
            <article class="blog-card blog-card--editorial ${index === 0 ? 'blog-card--featured-home' : 'blog-card--recent-home'}" data-id="${post.id}" aria-label="${this.escapeHTML(post.title)}">
                <a class="blog-card-media blog-media--${getBlogPostImageFit(post)}" href="${fullHref}" aria-label="Read ${this.escapeHTML(post.title)}">
                  <img src="${image}" alt="" width="1600" height="900" loading="lazy" decoding="async" />
                  <span class="blog-card-media-shine" aria-hidden="true"></span>
                  ${index === 0 ? '<span class="blog-card-feature-label">Latest field note</span>' : ''}
                </a>
                <div class="blog-card-content">
                    <div class="blog-card-top">
                      <div class="blog-card-meta">
                        <span class="blog-kicker">${this.escapeHTML(kicker)}</span>
                        <span class="blog-card-meta-sep" aria-hidden="true">·</span>
                        <time class="blog-card-date" datetime="${this.escapeHTML(post.date)}">${this.formatDate(post.date)}</time>
                        <span class="blog-card-meta-sep" aria-hidden="true">·</span>
                        <span class="blog-read-time"><i class="far fa-clock" aria-hidden="true"></i> ${this.escapeHTML(post.readTime)}</span>
                      </div>
                    </div>
                    <h3 class="blog-title"><a class="blog-title-link" href="${fullHref}">${this.escapeHTML(post.title)}</a></h3>
                    <p class="blog-summary">${this.escapeHTML(post.readerPromise || post.summary)}</p>
                    <div class="blog-tags blog-tags--pills">${pills}</div>
                    <div class="blog-card-cta-row">
                      <a class="blog-read-btn" href="${fullHref}">Read article <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
                    </div>
                </div>
            </article>
        `;
      })
      .join('');
  }

  formatDate(dateString) {
    const raw = String(dateString || '').trim();
    const isoDay = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = isoDay
      ? new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]), 12, 0, 0)
      : new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  escapeHTML(value = '') {
    return escapeHtmlShared(value);
  }
}

const initBlogLoader = () => {
  window.blogLoader = new BlogLoader();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlogLoader);
} else {
  initBlogLoader();
}
