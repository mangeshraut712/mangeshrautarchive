import { blogPosts } from './blog-data.js';

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
    this.activeResultIndex = -1;
    this.suggestedSearches = [
      { title: 'Projects', icon: 'fa-code', sectionId: 'projects', type: 'Portfolio' },
      { title: 'Skills', icon: 'fa-laptop-code', sectionId: 'skills', type: 'Portfolio' },
      { title: 'Experience', icon: 'fa-briefcase', sectionId: 'experience', type: 'Portfolio' },
      { title: 'Technical Writings', icon: 'fa-rss', sectionId: 'blog', type: 'Portfolio' },
      {
        title: 'Certifications',
        icon: 'fa-certificate',
        sectionId: 'certifications',
        type: 'Portfolio',
      },
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

    // Index GitHub projects after a short delay to allow them to load
    this.indexGitHubProjects();
  }

  // Index GitHub projects for search
  async indexGitHubProjects() {
    try {
      // Wait for GitHubProjects to be available
      if (window.GitHubProjects) {
        const github = new window.GitHubProjects('mangeshraut712');
        const projects = await github.getSearchableProjects();

        // Add GitHub projects to searchable content
        projects.forEach(project => {
          this.addSearchableEntry({
            type: 'GitHub Project',
            title: project.title,
            description: project.description,
            icon: 'fab fa-github',
            url: project.url,
            tags: [project.language, ...(project.topics || [])].filter(Boolean).join(' '),
            section: 'projects',
          });
        });

        console.log(`Indexed ${projects.length} GitHub projects for search`);
      }
    } catch (error) {
      console.warn('Failed to index GitHub projects:', error);
    }
  }

  indexContent() {
    this.indexStaticCommands();
    this.indexBlogPosts();

    // Index all searchable content from the page
    const sections = [
      {
        selector: '[id="projects"] .showcase-project-card, [id="projects"] .education-card',
        type: 'Project',
        icon: 'fa-code',
      },
      {
        selector: '[id="skills"] .skill-card',
        type: 'Skill',
        icon: 'fa-laptop-code',
      },
      {
        selector: '[id="experience"] .timeline-item',
        type: 'Experience',
        icon: 'fa-briefcase',
      },
      {
        selector: '[id="education"] .education-card',
        type: 'Education',
        icon: 'fa-graduation-cap',
      },
      {
        selector: '[id="publications"] .publication-item',
        type: 'Publication',
        icon: 'fa-book',
      },
      {
        selector: '[id="awards"] .award-item',
        type: 'Award',
        icon: 'fa-trophy',
      },
      {
        selector: '[id="certifications"] .certification-card',
        type: 'Certification',
        icon: 'fa-certificate',
      },
      { selector: '[id="blog"] .blog-card', type: 'Blog', icon: 'fa-rss' },
    ];

    sections.forEach(({ selector, type, icon }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, _index) => {
        const title = element.querySelector('h3, h4, h5')?.textContent || '';
        const description =
          Array.from(element.querySelectorAll('p'))
            .map(p => p.textContent)
            .join(' ') || '';

        // Generic tags
        let tags = Array.from(element.querySelectorAll('.tag, .skill-tag, .tech-tag, .project-tag'))
          .map(tag => tag.textContent)
          .join(' ');

        // Specific handling for GitHub Projects (dynamic content)
        if (type === 'Project') {
          // Extract topics from both legacy and current card styles.
          const topics = Array.from(
            element.querySelectorAll('span.rounded-full.border, .project-tag')
          ).map(t => t.textContent.trim());

          // Extract language (usually next to a colored dot)
          // We look for the text content in the language section
          const languageCandidates = [
            element.querySelector('.project-language'),
            element.querySelector('.flex.items-center.gap-3'),
          ];
          languageCandidates.forEach(languageContainer => {
            if (!languageContainer) return;
            const langText = languageContainer.textContent.trim();
            if (langText) topics.push(langText);
          });

          if (topics.length > 0) {
            tags += ' ' + topics.join(' ');
          }
        }

        if (title || description) {
          this.addSearchableEntry({
            title: title.trim(),
            description: description.trim(),
            tags: tags.trim(),
            type,
            icon,
            element,
            sectionId: selector.split(' ')[0].replace('[id="', '').replace('"]', ''),
          });
        }
      });
    });
  }

  refreshIndex() {
    this.searchableContent = [];
    this.indexContent();
  }

  addSearchableEntry(entry) {
    this.searchableContent.push({
      ...entry,
      normalizedTitle: String(entry.title || '').toLowerCase(),
      normalizedDescription: String(entry.description || '').toLowerCase(),
      normalizedTags: String(entry.tags || '').toLowerCase(),
    });
  }

  indexStaticCommands() {
    const commands = [
      {
        title: 'Home',
        description: 'Hero, current role, quick links, and GitHub activity',
        icon: 'fa-house',
        sectionId: 'home',
        type: 'Portfolio',
        tags: 'homepage intro profile command palette',
      },
      {
        title: 'About',
        description: 'Background, profile, and personal summary',
        icon: 'fa-user',
        sectionId: 'about',
        type: 'Portfolio',
        tags: 'bio summary profile',
      },
      {
        title: 'Skills',
        description: 'Technical skills and engineering stack',
        icon: 'fa-laptop-code',
        sectionId: 'skills',
        type: 'Portfolio',
        tags: 'languages frameworks tools',
      },
      {
        title: 'Experience',
        description: 'Work history and internships',
        icon: 'fa-briefcase',
        sectionId: 'experience',
        type: 'Portfolio',
        tags: 'work career companies jobs',
      },
      {
        title: 'Projects',
        description: 'Featured projects and GitHub repositories',
        icon: 'fa-code',
        sectionId: 'projects',
        type: 'Portfolio',
        tags: 'github repositories portfolio apps',
      },
      {
        title: 'Education',
        description: 'Drexel MSCS and academic background',
        icon: 'fa-graduation-cap',
        sectionId: 'education',
        type: 'Portfolio',
        tags: 'drexel university mscs academics',
      },
      {
        title: 'Publications',
        description: 'Research papers and publications',
        icon: 'fa-book',
        sectionId: 'publications',
        type: 'Portfolio',
        tags: 'research papers publication',
      },
      {
        title: 'Awards',
        description: 'Awards, honors, and recognition',
        icon: 'fa-trophy',
        sectionId: 'awards',
        type: 'Portfolio',
        tags: 'honors achievements recognition',
      },
      {
        title: 'Recommendations',
        description: 'Professional recommendations and testimonials',
        icon: 'fa-quote-left',
        sectionId: 'recommendations',
        type: 'Portfolio',
        tags: 'testimonials endorsements references',
      },
      {
        title: 'Certifications',
        description: 'Professional certifications and credentials',
        icon: 'fa-certificate',
        sectionId: 'certifications',
        type: 'Portfolio',
        tags: 'certificates credentials badges',
      },
      {
        title: 'Technical Writings',
        description: 'Blog posts and technical articles',
        icon: 'fa-rss',
        sectionId: 'blog',
        type: 'Portfolio',
        tags: 'blog articles writing posts',
      },
      {
        title: 'Contact',
        description: 'Email, phone, pronouns, location, and social links',
        icon: 'fa-address-card',
        sectionId: 'contact',
        type: 'Portfolio',
        tags: 'email phone social linkedin github',
      },
      {
        title: 'Travel Atlas',
        description: 'Open the interactive travel timeline, route playback, and location gallery',
        icon: 'fa-route',
        url: 'travel.html',
        type: 'Page',
        tags: 'travel map atlas journey timeline route flight road gallery mapbox',
      },
      {
        title: 'Game',
        description: 'Interactive debug runner game section',
        icon: 'fa-gamepad',
        sectionId: 'debug-runner-section',
        type: 'Portfolio',
        tags: 'game interactive debug runner',
      },
      {
        title: 'System Monitor',
        description: 'Open the system monitor page',
        icon: 'fa-heart-pulse',
        url: 'monitor.html',
        type: 'Page',
        tags: 'monitor system status health',
      },
      {
        title: 'Download Resume',
        description: 'Open Mangesh Raut resume PDF',
        icon: 'fa-file-arrow-down',
        url: 'assets/files/Mangesh_Raut_Resume.pdf',
        type: 'Action',
        tags: 'resume cv pdf download',
      },
      {
        title: 'GitHub Profile',
        description: 'Open github.com/mangeshraut712',
        icon: 'fab fa-github',
        url: 'https://github.com/mangeshraut712',
        type: 'Social',
        tags: 'github code repositories contributions',
      },
      {
        title: 'LinkedIn Profile',
        description: 'Open LinkedIn profile',
        icon: 'fab fa-linkedin',
        url: 'https://www.linkedin.com/in/mangeshraut71298/',
        type: 'Social',
        tags: 'linkedin professional contact',
      },
    ];

    commands.forEach(command => this.addSearchableEntry(command));
  }

  indexBlogPosts() {
    blogPosts.forEach(post => {
      this.addSearchableEntry({
        title: post.title,
        description: post.summary,
        tags: post.tags.join(' '),
        type: 'Blog',
        icon: 'fa-rss',
        sectionId: 'blog',
      });
    });
  }

  attachEventListeners() {
    // Open search
    this.searchToggle.addEventListener('click', () => this.openSearch());

    // Close search
    this.searchClose.addEventListener('click', () => this.closeSearch());

    // Close on Escape key
    document.addEventListener('keydown', e => {
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
    this.searchOverlay.addEventListener('click', e => {
      if (e.target === this.searchOverlay) {
        this.closeSearch();
      }
    });

    // Search input
    this.searchInput.addEventListener('input', e => {
      const query = e.target.value;
      if (query.length === 0) {
        this.showSuggestedSearches();
      } else {
        this.performSearch(query);
      }
    });

    this.searchInput.addEventListener('keydown', e => this.handleSearchKeydown(e));
  }

  openSearch() {
    this.searchOverlay.style.setProperty('display', 'flex', 'important');
    this.searchOverlay.classList.add('active');
    setTimeout(() => {
      this.searchInput.focus();
    }, 100);
    document.body.style.overflow = 'hidden';
  }

  closeSearch() {
    this.searchOverlay.classList.remove('active');
    this.searchOverlay.style.setProperty('display', 'none', 'important');
    this.searchInput.value = '';
    this.showSuggestedSearches();
    document.body.style.overflow = '';
  }

  showSuggestedSearches() {
    this.activeResultIndex = 0;
    const html = `
      <div class="search-section-title">Suggested Commands</div>
      ${this.suggestedSearches
        .map((suggestion, index) => this.renderResultItem(suggestion, '', index))
        .join('')}
    `;

    this.searchResults.innerHTML = html;
    this.attachResultClickHandlers();
    this.updateActiveResult();
  }

  performSearch(query) {
    if (!query || query.length < 2) {
      this.showSuggestedSearches();
      return;
    }

    // Always re-index so dynamically injected project cards are searchable
    this.refreshIndex();

    const lowerQuery = query.toLowerCase();
    const results = this.searchableContent
      .filter(item =>
        item.normalizedTitle.includes(lowerQuery) ||
        item.normalizedDescription.includes(lowerQuery) ||
        item.normalizedTags.includes(lowerQuery)
      )
      .sort((a, b) => this.rankResult(a, lowerQuery) - this.rankResult(b, lowerQuery));

    this.displayResults(results, query);
  }

  rankResult(item, query) {
    const title = item.normalizedTitle || '';
    const tags = item.normalizedTags || '';
    const description = item.normalizedDescription || '';

    if (title === query) return 0;
    if (title.startsWith(query)) return 1;
    if (title.includes(query)) return 2;
    if (tags.includes(query)) return 3;
    if (description.includes(query)) return 4;
    return 5;
  }

  displayResults(results, query) {
    if (results.length === 0) {
      this.activeResultIndex = -1;
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

    const limitedResults = results.slice(0, 12);
    this.activeResultIndex = 0;
    const groups = this.groupResultsByType(limitedResults);
    const html = groups
      .map(
        group => `
          <div class="search-section-title">${group.type}</div>
          ${group.results
            .map(({ result, index }) => this.renderResultItem(result, query, index))
            .join('')}
        `
      )
      .join('');

    this.searchResults.innerHTML = html;
    this.attachResultClickHandlers();
    this.updateActiveResult();
  }

  groupResultsByType(results) {
    const order = ['Portfolio', 'Blog', 'Project', 'GitHub Project', 'Social', 'Action', 'Page'];
    const grouped = new Map();

    results.forEach((result, index) => {
      const type = result.type || 'Result';
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type).push({ result, index });
    });

    return [...grouped.entries()]
      .toSorted(([a], [b]) => {
        const aIndex = order.indexOf(a);
        const bIndex = order.indexOf(b);
        return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
      })
      .map(([type, groupResults]) => ({ type, results: groupResults }));
  }

  renderResultItem(result, query, index) {
    const iconClass = result.icon?.startsWith('fab ') ? result.icon : `fas ${result.icon}`;
    const sectionAttr = result.sectionId ? `data-section="${this.escapeAttribute(result.sectionId)}"` : '';
    const urlAttr = result.url ? `data-url="${this.escapeAttribute(result.url)}"` : '';
    const description = result.description
      ? `<div class="search-result-section">${this.escapeHtml(result.description)}</div>`
      : `<div class="search-result-section">${this.escapeHtml(result.type || '')}</div>`;

    return `
      <div class="search-result-item" role="option" tabindex="-1" data-index="${index}" ${sectionAttr} ${urlAttr}>
        <div class="search-result-icon">
          <i class="${iconClass}"></i>
        </div>
        <div class="search-result-content">
          <div class="search-result-title">${this.highlightQuery(result.title, query)}</div>
          ${description}
        </div>
        <div class="search-result-shortcut">
          <i class="fas fa-arrow-right"></i>
        </div>
      </div>
    `;
  }

  attachResultClickHandlers() {
    this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        this.activeResultIndex = this.getResultItems().indexOf(item);
        this.updateActiveResult();
      });

      item.addEventListener('click', () => {
        this.navigateResult(item);
      });
    });
  }

  handleSearchKeydown(e) {
    const items = this.getResultItems();
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeResultIndex = Math.min(this.activeResultIndex + 1, items.length - 1);
      this.updateActiveResult();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeResultIndex = Math.max(this.activeResultIndex - 1, 0);
      this.updateActiveResult();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const activeItem = items[this.activeResultIndex] || items[0];
      this.navigateResult(activeItem);
    }
  }

  getResultItems() {
    return Array.from(this.searchResults.querySelectorAll('.search-result-item'));
  }

  updateActiveResult() {
    const items = this.getResultItems();
    items.forEach((item, index) => {
      const isActive = index === this.activeResultIndex;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', isActive.toString());
      if (isActive) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  navigateResult(item) {
    if (!item) return;

    const sectionId = item.dataset.section;
    const url = item.dataset.url;
    this.closeSearch();

    setTimeout(() => {
      if (url) {
        if (/^https?:\/\//.test(url)) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = url;
        }
        return;
      }

      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 700);
        window.setTimeout(() => {
          section.scrollIntoView({ behavior: 'auto', block: 'start' });
        }, 1600);
      }
    }, 100);
  }

  highlightQuery(text, query) {
    if (!query) return text;

    const safeText = this.escapeHtml(text);
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return safeText.replace(regex, '<span class="highlight">$1</span>');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }

  escapeAttribute(value) {
    return this.escapeHtml(value).replace(/"/g, '&quot;');
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
