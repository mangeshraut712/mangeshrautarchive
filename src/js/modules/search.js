import { blogPosts } from './blog-data.js';
import { caseStudies } from './case-studies-data.js';
import { sitePath } from '../utils/site-base.js';

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
    this._domIndexed = false;
    this.suggestedSearches = this.buildSuggestedSearches();

    this.init();
  }

  buildSuggestedSearches() {
    const onBlog = document.body.classList.contains('blog-standalone-page');
    if (onBlog) {
      return [
        {
          title: 'All Technical Writings',
          icon: 'fa-newspaper',
          url: sitePath('/blog/'),
          type: 'Page',
          description: 'Browse the full writing archive',
        },
        {
          title: 'Back to portfolio',
          icon: 'fa-house',
          url: sitePath('/'),
          type: 'Page',
          description: 'Home, projects, experience, and more',
        },
        {
          title: 'Systems notebook',
          icon: 'fa-diagram-project',
          url: sitePath('/systems.html'),
          type: 'Page',
        },
        {
          title: 'Open AssistMe',
          icon: 'fa-comments',
          action: 'open-chat',
          type: 'Action',
          description: 'Ask the portfolio assistant',
        },
        {
          title: 'Download Resume',
          icon: 'fa-file-arrow-down',
          url: sitePath('/assets/files/Mangesh_Raut_Resume.pdf'),
          type: 'Action',
        },
      ];
    }
    return [
      { title: 'Projects', icon: 'fa-code', sectionId: 'projects', type: 'Portfolio' },
      { title: 'Skills', icon: 'fa-laptop-code', sectionId: 'skills', type: 'Portfolio' },
      { title: 'Experience', icon: 'fa-briefcase', sectionId: 'experience', type: 'Portfolio' },
      {
        title: 'Technical Writings',
        icon: 'fa-newspaper',
        sectionId: 'blog',
        type: 'Portfolio',
        description: 'Field notes and long-form posts',
      },
      {
        title: 'Open AssistMe',
        icon: 'fa-comments',
        action: 'open-chat',
        type: 'Action',
        description: 'Ask the portfolio assistant',
      },
    ];
  }

  init() {
    if (!this.searchOverlay || !this.searchInput || !this.searchToggle) {
      console.warn('Search elements not found');
      return;
    }

    // Closed by default for AT + layout
    this.searchOverlay.setAttribute('aria-hidden', 'true');
    this.searchOverlay.style.setProperty('display', 'none', 'important');
    this.searchToggle.setAttribute('aria-expanded', 'false');
    this.searchToggle.setAttribute('aria-controls', 'search-overlay');
    if (!this.searchInput.getAttribute('aria-label')) {
      this.searchInput.setAttribute('aria-label', 'Search portfolio, pages, and actions');
    }
    // ARIA combobox pattern for results navigation
    this.searchInput.setAttribute('role', 'combobox');
    this.searchInput.setAttribute('aria-autocomplete', 'list');
    this.searchInput.setAttribute('aria-controls', 'search-results');
    this.searchInput.setAttribute('aria-expanded', 'false');
    this.searchInput.setAttribute('aria-haspopup', 'listbox');
    if (this.searchResults && !this.searchResults.getAttribute('role')) {
      this.searchResults.setAttribute('role', 'listbox');
      this.searchResults.setAttribute('aria-label', 'Search results');
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
      }
    } catch (error) {
      console.warn('Failed to index GitHub projects:', error);
    }
  }

  indexContent() {
    this.indexStaticCommands();
    this.indexBlogPosts();
    this.indexCaseStudies();
    this.indexSitePages();
    this.indexDomSections();
  }

  indexDomSections() {
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
        selector: '[id="experience"] .experience-item',
        type: 'Experience',
        icon: 'fa-briefcase',
      },
      {
        selector: '[id="education"] .education-item',
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
      { selector: '[id="blog"] .blog-card', type: 'Blog', icon: 'fa-newspaper' },
      {
        selector: 'body.blog-standalone-page .blog-card--editorial',
        type: 'Blog',
        icon: 'fa-newspaper',
      },
    ];

    sections.forEach(({ selector, type, icon }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, _index) => {
        const title =
          element.querySelector('.blog-title, h2, h3, h4, h5')?.textContent ||
          element.getAttribute('aria-label') ||
          '';
        const description =
          Array.from(element.querySelectorAll('p, .blog-summary'))
            .map(p => p.textContent)
            .join(' ') || '';

        // Generic tags
        let tags = Array.from(
          element.querySelectorAll('.tag, .skill-tag, .tech-tag, .project-tag, .blog-topic-pill')
        )
          .map(tag => tag.textContent)
          .join(' ');

        // GitHub project cards (github-projects.js): .project-tag + .project-language
        if (type === 'Project') {
          const topics = Array.from(element.querySelectorAll('.project-tag'))
            .map(t => t.textContent.trim())
            .filter(Boolean);

          const languageEl = element.querySelector('.project-language');
          const langText = languageEl?.textContent?.trim();
          if (langText) {
            topics.push(langText);
          }

          if (topics.length > 0) {
            tags += ' ' + topics.join(' ');
          }
        }

        const postId = element.dataset?.id;
        if (title || description) {
          this.addSearchableEntry({
            title: title.trim(),
            description: description.trim().slice(0, 180),
            tags: tags.trim(),
            type,
            icon,
            element,
            sectionId:
              type === 'Blog' && postId
                ? undefined
                : selector.split(' ')[0].replace('[id="', '').replace('"]', ''),
            url:
              type === 'Blog' && postId
                ? sitePath(`/blog/${encodeURIComponent(postId)}.html`)
                : undefined,
          });
        }
      });
    });
    this._domIndexed = true;
  }

  refreshIndex({ includeDom = true } = {}) {
    this.searchableContent = [];
    this.indexStaticCommands();
    this.indexBlogPosts();
    this.indexCaseStudies();
    this.indexSitePages();
    if (includeDom) this.indexDomSections();
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
        icon: 'fa-newspaper',
        sectionId: 'blog',
        type: 'Portfolio',
        tags: 'blog articles writing posts field notes',
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
        title: 'Game — Debug Runner',
        description: 'Interactive debug runner game section',
        icon: 'fa-gamepad',
        sectionId: 'debug-runner-section',
        type: 'Portfolio',
        tags: 'game interactive debug runner',
      },
      {
        title: 'Engineering',
        description:
          'Architecture, benchmarks, case studies — open full notebook from the homepage section',
        icon: 'fa-diagram-project',
        sectionId: 'engineering',
        type: 'Portfolio',
        tags: 'engineering architecture benchmarks evidence building systems notebook',
      },
      {
        title: 'Open AssistMe',
        description: 'Ask the AI portfolio assistant',
        icon: 'fa-comments',
        action: 'open-chat',
        type: 'Action',
        tags: 'chatbot assistme assistant ai help ask',
      },
      {
        title: 'Toggle theme',
        description: 'Switch light and dark appearance',
        icon: 'fa-circle-half-stroke',
        action: 'toggle-theme',
        type: 'Action',
        tags: 'dark mode light mode appearance theme',
      },
      {
        title: 'Download Resume',
        description: 'Open Mangesh Raut resume PDF',
        icon: 'fa-file-arrow-down',
        url: sitePath('/assets/files/Mangesh_Raut_Resume.pdf'),
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

  indexSitePages() {
    const pages = [
      {
        title: 'Writings archive',
        description: 'All technical articles with topic filters',
        icon: 'fa-newspaper',
        url: sitePath('/blog/'),
        type: 'Page',
        tags: 'blog archive writings articles rss feed technical',
      },
      {
        title: 'Systems notebook',
        description: 'Architecture notes, flows, and engineering systems',
        icon: 'fa-diagram-project',
        url: sitePath('/systems.html'),
        type: 'Page',
        tags: 'systems architecture notebook engineering',
      },
      {
        title: 'System monitor',
        description: 'Live health, endpoints, and ops status',
        icon: 'fa-heart-pulse',
        url: sitePath('/monitor.html'),
        type: 'Page',
        tags: 'monitor system status health ops',
      },
      {
        title: 'Uses / Setup',
        description: 'Hardware, software, AI stack, and engineering tools',
        icon: 'fa-desktop',
        url: sitePath('/uses.html'),
        type: 'Page',
        tags: 'uses setup stack tools hardware software',
      },
      {
        title: 'Changelog',
        description: 'Releases, improvements, and retirements across the portfolio',
        icon: 'fa-clock-rotate-left',
        url: sitePath('/changelog.html'),
        type: 'Page',
        tags: 'changelog release notes updates shipping voice assistme',
      },
      {
        title: 'Travel atlas',
        description: 'Interactive travel timeline, routes, and galleries',
        icon: 'fa-route',
        url: sitePath('/travel.html'),
        type: 'Page',
        tags: 'travel map atlas journey timeline route flight road gallery',
      },
      {
        title: 'Home',
        description: 'Portfolio homepage',
        icon: 'fa-house',
        url: sitePath('/'),
        type: 'Page',
        tags: 'home portfolio landing',
      },
    ];
    pages.forEach(page => this.addSearchableEntry(page));
  }

  indexBlogPosts() {
    blogPosts.forEach(post => {
      this.addSearchableEntry({
        title: post.title,
        description: post.readerPromise || post.summary,
        tags: [...(post.tags || []), post.kicker, 'blog', 'article'].filter(Boolean).join(' '),
        type: 'Blog',
        icon: 'fa-newspaper',
        url: sitePath(`/blog/${encodeURIComponent(post.id)}.html`),
      });
    });
  }

  indexCaseStudies() {
    caseStudies.forEach(cs => {
      this.addSearchableEntry({
        title: `Case study: ${cs.title}`,
        description: cs.tagline,
        tags: `${cs.slug} case study architecture demo ${(cs.stack || []).join(' ')}`,
        type: 'Case Study',
        icon: 'fa-book-open',
        url: sitePath(`/case-studies/${cs.slug}.html`),
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

    // Close on backdrop / overlay chrome click
    this.searchOverlay.addEventListener('click', e => {
      if (
        e.target === this.searchOverlay ||
        e.target?.classList?.contains('search-overlay-backdrop') ||
        e.target?.closest?.('[data-search-close]')
      ) {
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
    this.searchOverlay.setAttribute('aria-hidden', 'false');
    this.searchOverlay.removeAttribute('hidden');
    if (this.searchToggle) {
      this.searchToggle.setAttribute('aria-expanded', 'true');
    }
    this.searchInput?.setAttribute('aria-expanded', 'true');
    // Keep keyboard/SR focus inside the modal (static overlay never gets MutationObserver trap)
    this._setPageInert(true);
    this._bindFocusTrap();
    setTimeout(() => {
      this.searchInput?.focus();
    }, 100);
    document.body.style.overflow = 'hidden';
  }

  closeSearch() {
    this.searchOverlay.classList.remove('active');
    this.searchOverlay.style.setProperty('display', 'none', 'important');
    this.searchOverlay.setAttribute('aria-hidden', 'true');
    this._unbindFocusTrap();
    this._setPageInert(false);
    if (this.searchToggle) {
      this.searchToggle.setAttribute('aria-expanded', 'false');
    }
    if (this.searchInput) {
      this.searchInput.value = '';
      this.searchInput.setAttribute('aria-expanded', 'false');
      this.searchInput.removeAttribute('aria-activedescendant');
    }
    this.activeResultIndex = -1;
    this.showSuggestedSearches();
    document.body.style.overflow = '';
    // Restore focus only when the toggle is a real visible control (homepage nav)
    if (
      this.searchToggle &&
      !this.searchToggle.hidden &&
      this.searchToggle.offsetParent &&
      typeof this.searchToggle.focus === 'function'
    ) {
      try {
        this.searchToggle.focus({ preventScroll: true });
      } catch {
        this.searchToggle.focus();
      }
    }
  }

  _setPageInert(inert) {
    const main = document.getElementById('main-content') || document.querySelector('main');
    const chrome = [
      main,
      document.querySelector('header'),
      document.querySelector('nav'),
      document.getElementById('chatbot-toggle'),
      document.querySelector('.chatbot-container'),
      document.querySelector('footer'),
    ].filter(Boolean);
    for (const el of chrome) {
      if (el === this.searchOverlay || this.searchOverlay?.contains(el)) continue;
      if (inert) {
        el.setAttribute('inert', '');
      } else {
        el.removeAttribute('inert');
      }
    }
  }

  _focusableInOverlay() {
    if (!this.searchOverlay) return [];
    const sel =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(this.searchOverlay.querySelectorAll(sel)).filter(
      el => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }

  _bindFocusTrap() {
    this._unbindFocusTrap();
    this._focusTrapHandler = e => {
      if (e.key !== 'Tab' || !this.searchOverlay?.classList.contains('active')) return;
      const nodes = this._focusableInOverlay();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (
          document.activeElement === first ||
          !this.searchOverlay.contains(document.activeElement)
        ) {
          e.preventDefault();
          last.focus();
        }
      } else if (
        document.activeElement === last ||
        !this.searchOverlay.contains(document.activeElement)
      ) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', this._focusTrapHandler, true);
  }

  _unbindFocusTrap() {
    if (this._focusTrapHandler) {
      document.removeEventListener('keydown', this._focusTrapHandler, true);
      this._focusTrapHandler = null;
    }
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
    const trimmed = String(query || '').trim();
    if (!trimmed || trimmed.length < 1) {
      this.showSuggestedSearches();
      return;
    }

    // Re-index DOM once per session so late-loaded cards are included, not every keystroke.
    if (!this._domIndexed) {
      this.refreshIndex({ includeDom: true });
    }

    const tokens = trimmed
      .toLowerCase()
      .split(/[\s,/|+]+/)
      .map(t => t.trim())
      .filter(t => t.length >= 1);

    const results = this.searchableContent
      .map(item => ({ item, score: this.scoreResult(item, trimmed.toLowerCase(), tokens) }))
      .filter(entry => entry.score < 100)
      .sort(
        (a, b) => a.score - b.score || a.item.normalizedTitle.localeCompare(b.item.normalizedTitle)
      )
      .map(entry => entry.item);

    // De-dupe by title+type (blog posts indexed both statically and from DOM)
    const seen = new Set();
    const unique = results.filter(item => {
      const key = `${item.type}|${item.normalizedTitle}|${item.url || item.sectionId || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    this.displayResults(unique, trimmed);
  }

  scoreResult(item, query, tokens) {
    const title = item.normalizedTitle || '';
    const tags = item.normalizedTags || '';
    const description = item.normalizedDescription || '';
    const haystack = `${title} ${tags} ${description}`;

    if (title === query) return 0;
    if (title.startsWith(query)) return 1;
    if (title.includes(query)) return 2;
    if (tags.includes(query)) return 3;
    if (description.includes(query)) return 4;

    // Multi-token: rank by how many tokens hit (Spotlight-style, not strict AND)
    if (tokens.length > 1) {
      const hits = tokens.filter(token => haystack.includes(token)).length;
      if (hits === 0) return 100;
      const titleHits = tokens.filter(token => title.includes(token)).length;
      if (hits === tokens.length) return 5 + (tokens.length - titleHits);
      return 18 + (tokens.length - hits) * 4 - titleHits;
    }

    // Fuzzy-ish: token contained with light typo tolerance via startsWith on words
    const words = haystack.split(/[^a-z0-9+#.-]+/).filter(Boolean);
    if (tokens[0] && words.some(word => word.startsWith(tokens[0]))) return 6;
    return 100;
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
    const order = [
      'Action',
      'Page',
      'Blog',
      'Case Study',
      'Portfolio',
      'Project',
      'GitHub Project',
      'Skill',
      'Experience',
      'Social',
    ];
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
    const sectionAttr = result.sectionId
      ? `data-section="${this.escapeAttribute(result.sectionId)}"`
      : '';
    const urlAttr = result.url ? `data-url="${this.escapeAttribute(result.url)}"` : '';
    const actionAttr = result.action ? `data-action="${this.escapeAttribute(result.action)}"` : '';
    const description = result.description
      ? `<div class="search-result-section">${this.escapeHtml(result.description)}</div>`
      : `<div class="search-result-section">${this.escapeHtml(result.type || '')}</div>`;

    return `
      <div class="search-result-item" role="option" tabindex="-1" data-index="${index}" ${sectionAttr} ${urlAttr} ${actionAttr}>
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
      if (!item.id) {
        item.id = `search-result-${index}`;
      }
      item.setAttribute('role', 'option');
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', isActive.toString());
      if (isActive) {
        item.scrollIntoView({ block: 'nearest' });
        this.searchInput?.setAttribute('aria-activedescendant', item.id);
      }
    });
    if (this.activeResultIndex < 0 || !items[this.activeResultIndex]) {
      this.searchInput?.removeAttribute('aria-activedescendant');
    }
  }

  navigateResult(item) {
    if (!item) return;

    const sectionId = item.dataset.section;
    const url = item.dataset.url;
    const action = item.dataset.action;
    this.closeSearch();

    setTimeout(() => {
      if (action === 'open-chat') {
        document.getElementById('chatbot-toggle')?.click();
        return;
      }
      if (action === 'toggle-theme') {
        document.getElementById('theme-toggle')?.click();
        return;
      }

      if (url) {
        if (/^https?:\/\//.test(url)) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = url;
        }
        return;
      }

      if (!sectionId) return;

      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 700);
        return;
      }

      // From subpages, jump to the homepage section.
      window.location.href = `${sitePath('/')}#${encodeURIComponent(sectionId)}`;
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

export { PortfolioSearch };

function autoInitSearch() {
  if (!document.getElementById('search-overlay') || window.portfolioSearch) return;
  window.portfolioSearch = new PortfolioSearch();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInitSearch, { once: true });
} else {
  autoInitSearch();
}
