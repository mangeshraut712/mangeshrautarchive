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
        this.createModal();
    }

    renderPosts() {
        this.container.innerHTML = blogPosts.map(post => `
            <article class="blog-card" data-id="${post.id}">
                <div class="blog-card-content">
                    <div class="blog-meta">
                        <span class="blog-date">${this.formatDate(post.date)}</span>
                        <span class="blog-read-time">${post.readTime}</span>
                    </div>
                    <h3 class="blog-title">${post.title}</h3>
                    <p class="blog-summary">${post.summary}</p>
                    <div class="blog-tags">
                        ${post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                    </div>
                    <button class="blog-read-btn" onclick="window.blogLoader.openPost('${post.id}')">
                        Read Article <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </article>
        `).join('');
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    createModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="blog-modal" class="blog-modal hidden" aria-hidden="true">
                <div class="blog-modal-overlay"></div>
                <div class="blog-modal-container">
                    <button class="blog-modal-close" aria-label="Close article">×</button>
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
        document.addEventListener('keydown', (e) => {
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
                <div class="article-meta">
                    <span>${this.formatDate(post.date)}</span> • <span>${post.readTime}</span>
                </div>
                <h1 class="article-title">${post.title}</h1>
                <div class="article-tags">
                    ${post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                </div>
            </header>
            <div class="article-body">
                ${htmlContent}
            </div>
        `;

        this.modal.classList.remove('hidden');
        this.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    parseContent(content) {
        // Simple Markdown parser
        return content
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/gm, '<pre><code>$1</code></pre>')
            .replace(/\n/gim, '<br>');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.blogLoader = new BlogLoader();
});
