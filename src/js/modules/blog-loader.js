import { blogPosts } from './blog-data.js';
import { parseBlogContent } from './blog-markdown.js';
import { rescanCardContentAccessibility } from './card-content-accessibility.js';
import { refreshSectionPreview } from './section-preview.js';
import { escapeHTML as escapeHtmlShared } from '../utils/escape-html.js';

/**
 * Blog Loader Module
 * Renders blog posts and handles article modal interactions
 */

class BlogLoader {
  constructor() {
    this.container = document.getElementById('blog-posts-container');
    this.modal = null;
    this.lastFocus = null;
    this.init();
  }

  init() {
    if (!this.container) return;

    this.renderPosts();
    this.bindCardEvents();
    this.createModal();
    this.bindDeepLinks();
    this.syncPostCount();
  }

  syncPostCount() {
    const countEl = document.getElementById('blog-post-count');
    if (countEl) {
      countEl.textContent = `(${blogPosts.length})`;
    }
  }

  bindDeepLinks() {
    const tryOpenFromHash = () => {
      const pending = window.__pendingBlogOpen;
      if (pending) {
        this.openPost(pending);
        delete window.__pendingBlogOpen;
        return;
      }

      const match = window.location.hash.match(/^#blog-read-([^&]+)/);
      if (!match) return;
      this.openPost(decodeURIComponent(match[1]));
    };

    window.addEventListener('portfolio:open-blog', event => {
      const postId = event.detail?.id;
      if (postId) {
        window.__pendingBlogOpen = postId;
        tryOpenFromHash();
      }
    });

    tryOpenFromHash();
    window.addEventListener('hashchange', tryOpenFromHash);
  }

  renderPosts() {
    // Sort posts by date (most recent first)
    const sortedPosts = blogPosts.toSorted((a, b) => new Date(b.date) - new Date(a.date));

    this.container.innerHTML = sortedPosts
      .map(
        post => `
            <article class="blog-card x-post-card apple-3d-project" data-id="${post.id}" tabindex="0" aria-label="${this.escapeHTML(post.title)}">
                <div class="blog-card-content">
                    <div class="blog-card-actions" aria-label="Listen and translate article card"></div>
                    <div class="x-post-card__head">
                      <img class="x-post-card__avatar" src="assets/images/profile-icon.webp" width="44" height="44" alt="" loading="lazy" decoding="async" />
                      <div class="x-post-card__identity">
                        <div class="x-post-card__name-row">
                          <span class="x-post-card__name">Mangesh Raut</span>
                          <span class="x-post-card__handle">@mangeshraut</span>
                          <span class="x-post-card__dot" aria-hidden="true">·</span>
                          <time class="x-post-card__date" datetime="${this.escapeHTML(post.date)}">${this.formatDate(post.date)}</time>
                        </div>
                        <div class="x-post-card__meta-row">
                          <span class="blog-kicker">${this.escapeHTML(post.kicker || 'Field notes')}</span>
                          <span class="blog-read-time">${this.escapeHTML(post.readTime)}</span>
                        </div>
                      </div>
                    </div>
                    <h3 class="blog-title">${this.escapeHTML(post.title)}</h3>
                    <p class="blog-summary">${this.escapeHTML(post.readerPromise || post.summary)}</p>
                    ${
                      post.pullQuote
                        ? `<blockquote class="blog-card-quote">${this.escapeHTML(post.pullQuote)}</blockquote>`
                        : ''
                    }
                    <div class="blog-tags">
                        ${post.tags
                          .slice(0, 5)
                          .map(
                            tag =>
                              `<span class="blog-tag">#${this.escapeHTML(tag.replace(/\s+/g, ''))}</span>`
                          )
                          .join('')}
                    </div>
                    <button class="blog-read-btn publication-read-btn" type="button" data-blog-open="${post.id}">
                        <span>Read article</span>
                        <i class="fas fa-arrow-right" aria-hidden="true"></i>
                    </button>
                </div>
            </article>
        `
      )
      .join('');

    rescanCardContentAccessibility(this.container);
    // Progressive disclosure after inject (View more articles)
    refreshSectionPreview(this.container);
  }

  bindCardEvents() {
    this.container.addEventListener('click', event => {
      // Don't hijack listen/translate toolbar or external links
      if (event.target.closest('.blog-card-actions, a:not(.blog-title-link)')) return;

      const openControl = event.target.closest('[data-blog-open]');
      if (openControl) {
        event.preventDefault();
        this.openPost(openControl.dataset.blogOpen);
        return;
      }

      const card = event.target.closest('.blog-card[data-id]');
      if (card?.dataset?.id) {
        this.openPost(card.dataset.id);
      }
    });

    this.container.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('.blog-card[data-id]');
      if (!card || event.target.closest('a, button, .blog-card-actions')) return;
      event.preventDefault();
      this.openPost(card.dataset.id);
    });
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

  renderHighlights(highlights = []) {
    return highlights
      .slice(0, 3)
      .map(item => `<li>${this.escapeHTML(item)}</li>`)
      .join('');
  }
  escapeHTML(value = '') {
    return escapeHtmlShared(value);
  }

  createModal() {
    // Create modal HTML structure
    const modalHTML = `
            <div id="blog-modal" class="blog-modal hidden" role="dialog" aria-modal="true" aria-labelledby="blog-modal-title" aria-hidden="true">
                <div class="blog-modal-overlay" data-blog-close></div>
                <div class="blog-modal-container" tabindex="-1">
                    <button class="blog-modal-close" type="button" aria-label="Close article" data-blog-close>×</button>
                    <div class="blog-modal-content" id="blog-modal-body">
                        <!-- Content injected here -->
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    this.modal = document.getElementById('blog-modal');
    const closeModal = () => this.closeModal();

    this.modal.addEventListener('click', e => {
      if (e.target.closest('[data-blog-close]')) closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
        closeModal();
        return;
      }
      // Simple focus trap while modal is open
      if (e.key !== 'Tab' || !this.modal || this.modal.classList.contains('hidden')) return;
      const focusable = this.modal.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  openPost(id) {
    const post = blogPosts.find(p => p.id === id);
    if (!post || !this.modal) return;

    this.lastFocus = document.activeElement;
    const modalBody = document.getElementById('blog-modal-body');
    const { html: htmlContent } = parseBlogContent(post.content, { addHeadingIds: true });
    const fullPageHref = `/blog/${encodeURIComponent(post.id)}`;

    modalBody.innerHTML = `
            <article class="x-article">
            <header class="article-header">
                <div class="article-author-row">
                  <img class="article-byline__avatar article-byline__avatar--lg" src="assets/images/profile-icon.webp" width="48" height="48" alt="" loading="lazy" decoding="async" />
                  <div class="article-author-text">
                    <div class="article-author-name">Mangesh Raut</div>
                    <div class="article-author-handle">@mangeshraut · Field notes</div>
                  </div>
                </div>
                <h1 class="article-title" id="blog-modal-title">${this.escapeHTML(post.title)}</h1>
                <p class="article-promise">${this.escapeHTML(post.readerPromise || post.summary)}</p>
                <div class="article-byline">
                  <span class="article-kicker">${this.escapeHTML(post.kicker || 'Field notes')}</span>
                  <span aria-hidden="true">·</span>
                  <time datetime="${this.escapeHTML(post.date)}">${this.formatDate(post.date)}</time>
                  <span aria-hidden="true">·</span>
                  <span>${this.escapeHTML(post.readTime)}</span>
                </div>
                <div class="article-tags">
                    ${post.tags
                      .map(
                        tag =>
                          `<span class="blog-tag">#${this.escapeHTML(String(tag).replace(/\s+/g, ''))}</span>`
                      )
                      .join('')}
                </div>
            </header>
            <div class="article-body">
                ${htmlContent}
            </div>
            <footer class="x-article-footer">
              <a class="x-article-footer__link" href="${fullPageHref}">Open full page</a>
            </footer>
            </article>
        `;

    this.modal.classList.remove('hidden');
    // Force browser reflow to enable CSS transition
    this.modal.offsetHeight;
    this.modal.classList.add('active');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('blog-modal-open');

    // Deep-link hash for shareable open state (without fighting #blog)
    try {
      const nextHash = `#blog-read-${encodeURIComponent(post.id)}`;
      if (window.location.hash !== nextHash) {
        history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}${nextHash}`
        );
      }
    } catch {
      // ignore history errors
    }

    rescanCardContentAccessibility(modalBody);
    // Move focus into the dialog
    requestAnimationFrame(() => {
      this.modal.querySelector('.blog-modal-close')?.focus();
      this.modal.querySelector('.blog-modal-container')?.scrollTo?.(0, 0);
      modalBody.scrollTop = 0;
    });
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.documentElement.classList.remove('blog-modal-open');

    // Clear deep-link hash when closing from hash open
    try {
      if (/^#blog-read-/.test(window.location.hash)) {
        history.replaceState(null, '', `${window.location.pathname}${window.location.search}#blog`);
      }
    } catch {
      // ignore
    }

    const restore = this.lastFocus;
    this.lastFocus = null;

    // Delay hidden class to let fade-out transition complete
    setTimeout(() => {
      if (!this.modal.classList.contains('active')) {
        this.modal.classList.add('hidden');
      }
      if (restore && typeof restore.focus === 'function') {
        try {
          restore.focus();
        } catch {
          // ignore
        }
      }
    }, 300);
  }

  parseContent(content) {
    if (!content) return '';

    // Extract code blocks first to protect them from regexes
    const codeBlocks = [];
    let placeholderCount = 0;

    let processedContent = content.replace(/```([\s\S]*?)```/g, (match, code) => {
      const placeholder = `__CODE_BLOCK_PLACEHOLDER_${placeholderCount}__`;
      codeBlocks.push({
        placeholder,
        code: code.trim(),
      });
      placeholderCount++;
      return placeholder;
    });

    const paragraphs = processedContent.split(/\n\n+/);
    const html = [];
    let inList = false;
    let listItems = [];

    const closeList = () => {
      if (inList) {
        html.push(`<ul class="article-list">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
    };

    const codeMap = new Map(codeBlocks.map(c => [c.placeholder, c]));

    for (let block of paragraphs) {
      block = block.trim();
      if (!block) continue;

      // Code block placeholder check
      if (block.startsWith('__CODE_BLOCK_PLACEHOLDER_')) {
        closeList();
        const placeholder = block;
        const found = codeMap.get(placeholder);
        if (found) {
          const escapedCode = found.code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          html.push(`<pre class="article-code-block"><code>${escapedCode}</code></pre>`);
        }
        continue;
      }

      // Headers
      if (block.startsWith('# ')) {
        closeList();
        html.push(`<h1 class="article-h1">${this.parseInline(block.substring(2))}</h1>`);
        continue;
      }
      if (block.startsWith('## ')) {
        closeList();
        html.push(`<h2 class="article-h2">${this.parseInline(block.substring(3))}</h2>`);
        continue;
      }
      if (block.startsWith('### ')) {
        closeList();
        html.push(`<h3 class="article-h3">${this.parseInline(block.substring(4))}</h3>`);
        continue;
      }

      // Horizontal Rule
      if (block === '---' || block === '***') {
        closeList();
        html.push('<hr class="article-hr">');
        continue;
      }

      // Blockquotes
      if (block.startsWith('>')) {
        closeList();
        const lines = block.split('\n').map(line => line.replace(/^>\s*/, ''));
        html.push(
          `<blockquote class="article-blockquote">${this.parseInline(lines.join('<br>'))}</blockquote>`
        );
        continue;
      }

      // Unordered Lists
      const lines = block.split('\n');
      const firstLine = lines[0].trim();
      if (firstLine.startsWith('- ') || firstLine.startsWith('* ') || firstLine.startsWith('• ')) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        for (let line of lines) {
          line = line.trim();
          if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
            listItems.push(
              `<li class="article-list-item">${this.parseInline(line.replace(/^[-*•]\s*/, ''))}</li>`
            );
          } else if (line) {
            if (listItems.length > 0) {
              listItems[listItems.length - 1] += ' ' + this.parseInline(line);
            } else {
              listItems.push(`<li class="article-list-item">${this.parseInline(line)}</li>`);
            }
          }
        }
        continue;
      }

      // Normal Paragraph
      closeList();
      html.push(`<p class="article-p">${this.parseInline(block)}</p>`);
    }

    closeList();
    return html.join('\n');
  }

  parseInline(text) {
    if (!text) return '';
    return (
      text
        // Bold: **text**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic: *text* or _text_
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Inline code: `code`
        .replace(/`(.*?)`/g, '<code class="article-inline-code">$1</code>')
        // Links: [text](url)
        .replace(
          /\[(.*?)\]\((.*?)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="article-link">$1</a>'
        )
    );
  }
}

// Initialize
const initBlogLoader = () => {
  window.blogLoader = new BlogLoader();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlogLoader);
} else {
  initBlogLoader();
}
