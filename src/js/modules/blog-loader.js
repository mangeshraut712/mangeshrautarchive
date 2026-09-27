import { blogPosts, getBlogPostImage } from './blog-data.js';
import { rescanCardContentAccessibility } from './card-content-accessibility.js';
import { refreshSectionPreview } from './section-preview.js';
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

    this.renderFilters();
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

  renderFilters() {
    const section = this.container.closest('section') || this.container.parentElement;
    if (!section) return;

    let filterBar = section.querySelector('.blog-filter-bar');
    if (!filterBar) {
      filterBar = document.createElement('div');
      filterBar.className = 'blog-filter-bar';
      filterBar.setAttribute('role', 'toolbar');
      filterBar.setAttribute('aria-label', 'Filter articles by topic');
      this.container.before(filterBar);
    }

    const categories = [
      { tag: 'all', label: `All (${blogPosts.length})` },
      { tag: 'model gateways', label: 'Model Gateways' },
      { tag: 'coding agents', label: 'Coding Agents' },
      { tag: 'webmcp', label: 'WebMCP & AI' },
      { tag: 'systems', label: 'Systems & Cloud' },
      { tag: 'apple', label: 'Apple & Design' },
    ];

    filterBar.innerHTML = `
      <div class="blog-filter-chips" role="group" aria-label="Topic filters">
        ${categories
          .map(
            (cat, idx) => `
          <button
            type="button"
            class="blog-filter-chip${idx === 0 ? ' active' : ''}"
            data-blog-filter="${this.escapeHTML(cat.tag)}"
            aria-pressed="${idx === 0 ? 'true' : 'false'}"
          >
            ${this.escapeHTML(cat.label)}
          </button>
        `
          )
          .join('')}
      </div>
      <div class="blog-filter-live-status sr-only" role="status" aria-live="polite"></div>
    `;

    filterBar.addEventListener('click', event => {
      const chip = event.target.closest('[data-blog-filter]');
      if (!chip) return;

      const targetTag = String(chip.dataset.blogFilter || 'all').toLowerCase();
      const chips = filterBar.querySelectorAll('[data-blog-filter]');
      chips.forEach(c => {
        const isActive = c === chip;
        c.classList.toggle('active', isActive);
        c.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      this.filterPosts(targetTag);
    });
  }

  filterPosts(tag = 'all') {
    const cards = Array.from(this.container.querySelectorAll('.blog-card'));
    let visibleCount = 0;

    cards.forEach(card => {
      const cardTags = String(card.dataset.tags || '')
        .toLowerCase()
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const kicker = String(card.dataset.kicker || '').toLowerCase();

      let matches = tag === 'all';
      if (!matches) {
        if (tag === 'model gateways') {
          matches =
            cardTags.some(
              t => t.includes('openrouter') || t.includes('routing') || t.includes('model')
            ) ||
            kicker.includes('gateway') ||
            kicker.includes('model');
        } else if (tag === 'coding agents') {
          matches =
            cardTags.some(
              t =>
                t.includes('grok build') ||
                t.includes('agent') ||
                t.includes('cursor') ||
                t.includes('ide') ||
                t.includes('coding')
            ) ||
            kicker.includes('agent') ||
            kicker.includes('editor');
        } else if (tag === 'webmcp') {
          matches =
            cardTags.some(
              t => t.includes('webmcp') || t.includes('gemini') || t.includes('google')
            ) ||
            kicker.includes('webmcp') ||
            kicker.includes('agentic');
        } else if (tag === 'systems') {
          matches =
            cardTags.some(
              t =>
                t.includes('system') ||
                t.includes('algorithm') ||
                t.includes('nvidia') ||
                t.includes('cloud') ||
                t.includes('hardware')
            ) ||
            kicker.includes('systems') ||
            kicker.includes('infrastructure');
        } else if (tag === 'apple') {
          matches =
            cardTags.some(t => t.includes('apple') || t.includes('wwdc') || t.includes('siri')) ||
            kicker.includes('apple') ||
            kicker.includes('design');
        } else {
          matches = cardTags.includes(tag) || kicker.includes(tag);
        }
      }

      card.hidden = !matches;
      card.classList.toggle('is-filter-hidden', !matches);
      card.setAttribute('aria-hidden', matches ? 'false' : 'true');
      if (matches) visibleCount += 1;
    });

    const statusEl = this.container.parentElement?.querySelector('.blog-filter-live-status');
    if (statusEl) {
      statusEl.textContent =
        tag === 'all'
          ? `Showing all ${visibleCount} articles`
          : `Showing ${visibleCount} article${visibleCount === 1 ? '' : 's'} for ${tag}`;
    }

    refreshSectionPreview(this.container);
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
      const post = blogPosts.find(item => item.id === id);
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
    const sortedPosts = blogPosts.toSorted((a, b) => new Date(b.date) - new Date(a.date));

    this.container.innerHTML = sortedPosts
      .map(post => {
        const fullHref = sitePath(`/blog/${encodeURIComponent(post.id)}.html`);
        const pills = (post.tags || [])
          .slice(0, 3)
          .map(tag => `<span class="blog-topic-pill">${this.escapeHTML(tag)}</span>`)
          .join('');
        const tagsAttr = (post.tags || []).join(',');
        const kicker = post.kicker || 'Field notes';
        const image = sitePath(`/${getBlogPostImage(post)}`);

        return `
            <article class="blog-card blog-card--editorial" data-id="${post.id}" data-kicker="${this.escapeHTML(kicker)}" data-tags="${this.escapeHTML(tagsAttr)}" aria-label="${this.escapeHTML(post.title)}">
                <a class="blog-card-media" href="${fullHref}" aria-label="Read ${this.escapeHTML(post.title)}">
                  <img src="${image}" alt="" width="1600" height="900" loading="lazy" decoding="async" />
                  <span class="blog-card-media-shine" aria-hidden="true"></span>
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
                      <div class="blog-card-actions" aria-label="Listen and translate article card"></div>
                    </div>
                    <h3 class="blog-title"><a class="blog-title-link" href="${fullHref}">${this.escapeHTML(post.title)}</a></h3>
                    <p class="blog-summary">${this.escapeHTML(post.readerPromise || post.summary)}</p>
                    <div class="blog-tags blog-tags--pills">${pills}</div>
                    <div class="blog-card-cta-row">
                      <a class="blog-read-btn" href="${fullHref}">Read full article <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
                    </div>
                </div>
            </article>
        `;
      })
      .join('');

    rescanCardContentAccessibility(this.container);
    refreshSectionPreview(this.container);
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
