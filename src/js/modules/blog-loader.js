import { blogPosts } from './blog-data.js';

/**
 * Blog Loader Module
 * Renders blog posts and handles article modal interactions
 */

class BlogLoader {
  constructor() {
    this.container = document.getElementById('blog-posts-container');
    this.modal = null;
    this.init();
  }

  init() {
    if (!this.container) return;

    this.renderPosts();
    this.bindCardEvents();
    this.createModal();
  }

  renderPosts() {
    // Sort posts by date (most recent first)
    const sortedPosts = blogPosts.toSorted((a, b) => new Date(b.date) - new Date(a.date));

    this.container.innerHTML = sortedPosts
      .map(
        post => `
            <article class="blog-card apple-3d-project" data-id="${post.id}">
                <div class="blog-card-content">
                    <div class="blog-kicker-row">
                        <span class="blog-kicker">${this.escapeHTML(post.kicker || 'Field notes')}</span>
                        <span class="blog-read-time">${this.escapeHTML(post.readTime)}</span>
                    </div>
                    <div class="blog-meta">
                        <span class="blog-date">${this.formatDate(post.date)}</span>
                    </div>
                    <h3 class="blog-title">${this.escapeHTML(post.title)}</h3>

                    <div class="blog-promise">
                        <span class="blog-promise-label">Reader promise</span>
                        <p class="blog-summary">${this.escapeHTML(post.readerPromise || post.summary)}</p>
                    </div>

                    <blockquote class="blog-card-quote">${this.escapeHTML(post.pullQuote || post.summary)}</blockquote>

                    <ul class="blog-highlight-list" aria-label="Article highlights">
                        ${this.renderHighlights(post.highlights)}
                    </ul>

                    <div class="blog-tags">
                        ${post.tags.map(tag => `<span class="blog-tag">${this.escapeHTML(tag)}</span>`).join('')}
                    </div>
                    <button class="blog-read-btn" type="button" data-blog-open="${post.id}">
                        Read Article <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </article>
        `
      )
      .join('');
  }

  bindCardEvents() {
    this.container.addEventListener('click', event => {
      const button = event.target.closest('[data-blog-open]');
      if (!button) return;

      this.openPost(button.dataset.blogOpen);
    });
  }

  formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  }

  renderHighlights(highlights = []) {
    return highlights
      .slice(0, 3)
      .map(item => `<li>${this.escapeHTML(item)}</li>`)
      .join('');
  }

  escapeHTML(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  createModal() {
    // Create modal HTML structure
    const modalHTML = `
            <div id="blog-modal" class="blog-modal hidden" aria-hidden="true">
                <div class="blog-modal-overlay"></div>
                <div class="blog-modal-container">
                    <button class="blog-modal-close" type="button" aria-label="Close article">×</button>
                    <div class="blog-modal-content" id="blog-modal-body">
                        <!-- Content injected here -->
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    this.modal = document.getElementById('blog-modal');
    const closeBtn = this.modal.querySelector('.blog-modal-close');
    const overlay = this.modal.querySelector('.blog-modal-overlay');

    const closeModal = () => this.closeModal();

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        closeModal();
      }
    });
  }

  openPost(id) {
    const post = blogPosts.find(p => p.id === id);
    if (!post) return;

    const modalBody = document.getElementById('blog-modal-body');

    // Convert markdown-like content to HTML (simple parser)
    const htmlContent = this.parseContent(post.content);

    modalBody.innerHTML = `
            <header class="article-header">
                <span class="article-kicker">${this.escapeHTML(post.kicker || 'Field notes')}</span>
                <div class="article-meta">
                    <span>${this.formatDate(post.date)}</span> • <span>${this.escapeHTML(post.readTime)}</span>
                </div>
                <h1 class="article-title">${this.escapeHTML(post.title)}</h1>
                <p class="article-promise">${this.escapeHTML(post.readerPromise || post.summary)}</p>
                <div class="article-tags">
                    ${post.tags.map(tag => `<span class="blog-tag">${this.escapeHTML(tag)}</span>`).join('')}
                </div>
            </header>
            <div class="article-body">
                ${htmlContent}
            </div>
        `;

    this.modal.classList.remove('hidden');
    // Force browser reflow to enable CSS transition
    this.modal.offsetHeight;
    this.modal.classList.add('active');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  closeModal() {
    this.modal.classList.remove('active');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Delay hidden class to let fade-out transition complete
    setTimeout(() => {
      if (!this.modal.classList.contains('active')) {
        this.modal.classList.add('hidden');
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
