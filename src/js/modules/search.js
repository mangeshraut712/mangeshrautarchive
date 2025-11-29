/**
 * Search Functionality Module - Apple Inspired
 * Provides theme-aware search overlay with suggested searches and real-time filtering
 */

class PortfolioSearch {
    constructor() {
        this.searchOverlay = document.getElementById('search-overlay');
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.getElementById('search-results');
        this.searchToggle = document.getElementById('search-toggle');
        this.searchClose = document.getElementById('search-close');

        this.searchableContent = [];
        this.suggestedSearches = [
            { text: 'Projects', icon: 'fa-code', section: 'projects' },
            { text: 'Skills', icon: 'fa-laptop-code', section: 'skills' },
            { text: 'Experience', icon: 'fa-briefcase', section: 'experience' },
            { text: 'Education', icon: 'fa-graduation-cap', section: 'education' },
            { text: 'Certifications', icon: 'fa-certificate', section: 'certifications' }
        ];

        this.init();
    }

    init() {
        if (!this.searchOverlay || !this.searchInput || !this.searchToggle) {
            console.warn('Search elements not found');
            return;
        }

        this.indexContent();
        this.attachEventListeners();
        this.showSuggestedSearches();
    }

    indexContent() {
        // Index all searchable content from the page
        const sections = [
            // Projects render as education-card via GitHub module
            { selector: '[id="projects"] .education-card', type: 'Project', icon: 'fa-code' },
            { selector: '[id="skills"] .skill-card', type: 'Skill', icon: 'fa-laptop-code' },
            { selector: '[id="experience"] .timeline-item', type: 'Experience', icon: 'fa-briefcase' },
            { selector: '[id="education"] .education-card', type: 'Education', icon: 'fa-graduation-cap' },
            { selector: '[id="publications"] .publication-item', type: 'Publication', icon: 'fa-book' },
            { selector: '[id="awards"] .award-item', type: 'Award', icon: 'fa-trophy' },
            { selector: '[id="certifications"] .certification-card', type: 'Certification', icon: 'fa-certificate' },
            { selector: '[id="blog"] .blog-card', type: 'Blog', icon: 'fa-rss' }
        ];

        sections.forEach(({ selector, type, icon }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element, index) => {
                const title = element.querySelector('h3, h4, h5')?.textContent || '';
                const description = Array.from(element.querySelectorAll('p')).map(p => p.textContent).join(' ') || '';

                // Generic tags
                let tags = Array.from(element.querySelectorAll('.tag, .skill-tag, .tech-tag'))
                    .map(tag => tag.textContent)
                    .join(' ');

                // Specific handling for GitHub Projects (dynamic content)
                if (type === 'Project') {
                    // Extract topics (they have rounded-full and border classes)
                    const topics = Array.from(element.querySelectorAll('span.rounded-full.border'))
                        .map(t => t.textContent.trim());

                    // Extract language (usually next to a colored dot)
                    // We look for the text content in the language section
                    const languageContainer = element.querySelector('.flex.items-center.gap-3');
                    if (languageContainer) {
                        const langText = languageContainer.textContent.trim();
                        if (langText) topics.push(langText);
                    }

                    if (topics.length > 0) {
                        tags += ' ' + topics.join(' ');
                    }
                }

                if (title || description) {
                    this.searchableContent.push({
                        title: title.trim(),
                        description: description.trim(),
                        tags: tags.trim(),
                        type,
                        icon,
                        element,
                        sectionId: selector.split(' ')[0].replace('[id="', '').replace('"]', '')
                    });
                }
            });
        });
    }

    refreshIndex() {
        this.searchableContent = [];
        this.indexContent();
    }

    attachEventListeners() {
        // Open search
        this.searchToggle.addEventListener('click', () => this.openSearch());

        // Close search
        this.searchClose.addEventListener('click', () => this.closeSearch());

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.searchOverlay.classList.contains('active')) {
                this.closeSearch();
            }
            // Open search with Cmd/Ctrl + K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }
        });

        // Close on overlay click
        this.searchOverlay.addEventListener('click', (e) => {
            if (e.target === this.searchOverlay) {
                this.closeSearch();
            }
        });

        // Search input
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length === 0) {
                this.showSuggestedSearches();
            } else {
                this.performSearch(query);
            }
        });
    }

    openSearch() {
        this.searchOverlay.classList.add('active');
        setTimeout(() => {
            this.searchInput.focus();
        }, 100);
        document.body.style.overflow = 'hidden';
    }

    closeSearch() {
        this.searchOverlay.classList.remove('active');
        this.searchInput.value = '';
        this.showSuggestedSearches();
        document.body.style.overflow = '';
    }

    showSuggestedSearches() {
        const html = `
            <div class="search-section-title">Suggested Searches</div>
            ${this.suggestedSearches.map(suggestion => `
                <div class="search-result-item" data-section="${suggestion.section}">
                    <div class="search-result-icon">
                        <i class="fas ${suggestion.icon}"></i>
                    </div>
                    <div class="search-result-content">
                        <div class="search-result-title">${suggestion.text}</div>
                    </div>
                </div>
            `).join('')}
        `;

        this.searchResults.innerHTML = html;
        this.attachResultClickHandlers();
    }

    performSearch(query) {
        if (!query || query.length < 2) {
            this.showSuggestedSearches();
            return;
        }

        // Always re-index so dynamically injected project cards are searchable
        this.refreshIndex();

        const lowerQuery = query.toLowerCase();
        const results = this.searchableContent.filter(item => {
            return item.title.toLowerCase().includes(lowerQuery) ||
                item.description.toLowerCase().includes(lowerQuery) ||
                item.tags.toLowerCase().includes(lowerQuery);
        });

        this.displayResults(results, query);
    }

    displayResults(results, query) {
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-no-results">
                    <div class="search-no-results-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="search-no-results-text">No results found for "${query}"</div>
                </div>
            `;
            return;
        }

        const html = `
            <div class="search-section-title">Results (${results.length})</div>
            ${results.slice(0, 10).map(result => `
                <div class="search-result-item" data-section="${result.sectionId}">
                    <div class="search-result-icon">
                        <i class="fas ${result.icon}"></i>
                    </div>
                    <div class="search-result-content">
                        <div class="search-result-title">${this.highlightQuery(result.title, query)}</div>
                        <div class="search-result-section">${result.type}</div>
                    </div>
                </div>
            `).join('')}
        `;

        this.searchResults.innerHTML = html;
        this.attachResultClickHandlers();
    }

    attachResultClickHandlers() {
        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.dataset.section;
                this.closeSearch();

                // Scroll to section
                setTimeout(() => {
                    const section = document.getElementById(sectionId);
                    if (section) {
                        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            });
        });
    }

    highlightQuery(text, query) {
        if (!query) return text;

        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Initialize search when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PortfolioSearch();
    });
} else {
    new PortfolioSearch();
}
