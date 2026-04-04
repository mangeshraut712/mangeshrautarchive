import { blogPosts } from './blog-data.js';

class BlogLoader {
  constructor() {
    this.container = document.getElementById('blog-posts-container');
    this.allPosts = blogPosts;
    this.limit = 3;
    this.isExpanded = false;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.renderPosts();
    this.createModal();
    this.addStyles();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const externalBtn = document.getElementById('blog-view-more-static');
    if (externalBtn) {
      externalBtn.addEventListener('click', () => {
        this.toggleExpand();
      });
    }
  }

  renderPosts() {
    const postsToShow = this.isExpanded ? this.allPosts : this.allPosts.slice(0, this.limit);

    this.container.innerHTML = postsToShow
      .map(
        post => `
            <article class="blog-card" data-id="${post.id}">
                <div class="blog-card-content">
                    <div class="blog-meta">
                        <span class="blog-date">${this.formatDate(post.date)}</span>
                        <span class="blog-read-time">${post.readTime}</span>
                    </div>
                    <h3 class="blog-title">${post.title}</h3>
                    
                    <!-- Apple Intelligence TL;DR -->
                    <div class="apple-tldr">
                        <div class="tldr-header">
                            <i class="fas fa-sparkles" style="margin-right: 6px; color: var(--text-color-primary);"></i> 
                            <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-color-primary);">AI Summary</span>
                        </div>
                        <p class="tldr-text" style="font-size: 0.9rem; font-style: italic; color: var(--text-color-secondary); margin-bottom: 0;">${post.summary}</p>
                    </div>

                    <div class="blog-tags" style="margin-top: 1rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${post.tags.map(tag => `<span class="blog-tag" style="font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--apple-border-light); background: rgba(128,128,128,0.05); color: var(--text-color-secondary);">${tag}</span>`).join('')}
                    </div>
                    
                    <button class="blog-read-btn btn-secondary" onclick="window.blogLoader.openPost('${post.id}')" style="margin-top: auto; width: 100%;">
                        Read Article <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
                    </button>
                </div>
            </article>
        `
      )
      .join('');

    // Handle external View More button display
    const externalBtn = document.getElementById('blog-view-more-static');
    if (externalBtn) {
      externalBtn.innerHTML = this.isExpanded
        ? `Show Less <i class="fas fa-chevron-up"></i>`
        : `View More <i class="fas fa-chevron-down"></i>`;
      externalBtn.style.display = this.allPosts.length > this.limit ? 'inline-block' : 'none';
    }
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    console.log(`[BlogLoader] Toggling expand: ${this.isExpanded}. Total posts: ${this.allPosts.length}`);
    
    if (this.container) {
      if (this.isExpanded) {
        this.container.classList.add('expanded');
      } else {
        this.container.classList.remove('expanded');
      }
    }
    
    this.renderPosts();
    
    if (!this.isExpanded) {
      document.getElementById('blog').scrollIntoView({ behavior: 'smooth' });
    }
  }

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  createModal() {
    if (document.getElementById('blog-modal')) return;

    document.body.insertAdjacentHTML(
      'beforeend',
      `
            <div id="blog-modal" class="blog-modal hidden" aria-hidden="true">
                <div class="blog-modal-overlay"></div>
                <div class="blog-modal-container" style="background: var(--apple-bg-light); border-radius: 24px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative; z-index: 10001; margin: 5vh auto; padding: 3rem; border: 1px solid var(--apple-border-light);">
                    <button class="blog-modal-close" aria-label="Close article" style="position: absolute; top: 20px; right: 20px; font-size: 2rem; background: none; border: none; cursor: pointer; color: var(--text-color-secondary);">&times;</button>
                    <div class="blog-modal-content" id="blog-modal-body">
                        <!-- Content injected here -->
                    </div>
                </div>
            </div>
        `
    );

    this.modal = document.getElementById('blog-modal');
    const closeBtn = this.modal.querySelector('.blog-modal-close');
    const overlay = this.modal.querySelector('.blog-modal-overlay');

    const close = () => this.closeModal();
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        close();
      }
    });
  }

  openPost(id) {
    const post = this.allPosts.find(p => p.id === id);
    if (!post) return;

    const body = document.getElementById('blog-modal-body');
    const content = this.parseContent(post.content);

    // Theme aware modal background
    const isDark = document.documentElement.classList.contains('dark');
    const modalContainer = this.modal.querySelector('.blog-modal-container');
    modalContainer.style.background = isDark ? '#000000' : '#ffffff';
    modalContainer.style.borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

    body.innerHTML = `
            <header class="article-header" style="margin-bottom: 2.5rem; text-align: left;">
                <div class="article-meta" style="color: var(--text-color-secondary); font-size: 0.9rem; margin-bottom: 1rem;">
                    <span>${this.formatDate(post.date)}</span> • <span>${post.readTime}</span>
                </div>
                <h1 class="article-title" style="font-size: 2.5rem; line-height: 1.1; margin-bottom: 1.5rem;">${post.title}</h1>
                <div class="article-tags" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${post.tags.map(tag => `<span class="blog-tag" style="font-size: 0.75rem; padding: 0.3rem 0.8rem; border-radius: 6px; border: 1px solid var(--apple-border-light); background: rgba(128,128,128,0.05); color: var(--text-color-secondary);">${tag}</span>`).join('')}
                </div>
            </header>
            <div class="article-body" style="font-size: 1.125rem; line-height: 1.6; color: var(--text-color-primary);">
                ${content}
            </div>
        `;

    this.modal.classList.remove('hidden');
    this.modal.classList.add('visible');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modal.classList.add('hidden');
    this.modal.classList.remove('visible');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  parseContent(content) {
    return content
      .replace(/^# (.*$)/gm, '<h1 style="margin-top: 2rem; margin-bottom: 1rem;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="margin-top: 2rem; margin-bottom: 1rem;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="margin-top: 1.5rem; margin-bottom: 0.75rem;">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(
        /`([^`]+)`/gim,
        '<code style="background: var(--apple-border-light); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace;">$1</code>'
      )
      .replace(
        /```([\s\S]*?)```/gm,
        '<pre style="background: var(--apple-bg-dark); color: #fff; padding: 1.5rem; border-radius: 12px; overflow-x: auto; margin: 1.5rem 0;"><code>$1</code></pre>'
      )
      .replace(/\n/gim, '<br>');
  }

  addStyles() {
    if (document.getElementById('blog-loader-styles')) return;
    const style = document.createElement('style');
    style.id = 'blog-loader-styles';
    style.textContent = `
            .blog-modal {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .blog-modal.visible {
                opacity: 1;
                pointer-events: auto;
            }
            .blog-modal-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
            }
            html.dark .blog-modal-overlay {
                background: rgba(0, 0, 0, 0.7);
            }
            .blog-modal.hidden { display: none; }
            .article-body h1, .article-body h2, .article-body h3 { color: var(--text-color-primary); }
            .article-body strong { color: var(--text-color-primary); }
            .article-body br + br { display: block; margin-top: 1rem; content: ""; }
        `;
    document.head.appendChild(style);
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
