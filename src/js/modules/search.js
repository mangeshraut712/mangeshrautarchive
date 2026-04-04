class PortfolioSearch {
  constructor() {
    ((this.searchOverlay = document.getElementById('search-overlay')),
      (this.searchInput = document.getElementById('search-input')),
      (this.searchResults = document.getElementById('search-results')),
      (this.searchToggle = document.getElementById('search-toggle')),
      (this.searchClose = document.getElementById('search-close')),
      (this.searchableContent = []),
      (this.suggestedSearches = [
        { text: 'Projects', icon: 'fa-code', section: 'projects' },
        { text: 'Skills', icon: 'fa-laptop-code', section: 'skills' },
        { text: 'About', icon: 'fa-user', section: 'about' },
        { text: 'Experience', icon: 'fa-briefcase', section: 'experience' },
      ]),
      this.init());
  }
  init() {
    this.searchOverlay && this.searchInput && this.searchToggle
      ? (this.indexContent(),
        this.attachEventListeners(),
        this.showSuggestedSearches(),
        this.indexGitHubProjects())
      : console.warn('Search elements not found');
  }
  async indexGitHubProjects() {
    try {
      if (window.GitHubProjects) {
        const e = new window.GitHubProjects('mangeshraut712'),
          t = await e.getSearchableProjects();
        if (t && t.length > 0) {
          (t.forEach(e => {
            this.searchableContent.push({
              type: 'GitHub Project',
              title: e.title,
              description: e.description,
              icon: 'fab fa-github',
              url: e.url,
              tags: [e.language, ...(e.topics || [])].filter(Boolean).join(' '),
              section: 'projects',
            });
          }),
            console.log(`Indexed ${t.length} GitHub projects for search`));
        }
      }
    } catch (e) {
      console.warn('Failed to index GitHub projects:', e);
    }
  }
  indexContent() {
    this.searchableContent = [];
    [
      { selector: '[id="projects"] .showcase-project-card', type: 'Project', icon: 'fa-code' },
      { selector: '[id="skills"] .skill-badge', type: 'Skill', icon: 'fa-laptop-code' },
      {
        selector: '[id="experience"] .experience-item, [id="experience"] .timeline-item',
        type: 'Experience',
        icon: 'fa-briefcase',
      },
      {
        selector: '[id="education"] .education-card',
        type: 'Education',
        icon: 'fa-graduation-cap',
      },
      { selector: '[id="publications"] .publication-item', type: 'Publication', icon: 'fa-book' },
      { selector: '[id="awards"] .award-item', type: 'Award', icon: 'fa-trophy' },
      {
        selector: '[id="certifications"] .certification-card',
        type: 'Certification',
        icon: 'fa-certificate',
      },
      { selector: '[id="blog"] .blog-card', type: 'Blog', icon: 'fa-rss' },
      { selector: '[id="about"] .about-text', type: 'About', icon: 'fa-user' },
    ].forEach(({ selector: e, type: t, icon: s }) => {
      const i = e.split(' ')[0].replace('[id="', '').replace('"]', '');
      document.querySelectorAll(e).forEach(c => {
        const r = c.querySelector('h1, h2, h3, h4, h5, .skill-badge-name')?.textContent || '',
          a =
            Array.from(
              c.querySelectorAll(
                'p, .about-intro-text, .about-description, .skill-badge-percentage'
              )
            )
              .map(e => e.textContent)
              .join(' ') || '';
        let n =
          Array.from(c.querySelectorAll('.tag, .skill-tag, .tech-tag, .project-tag'))
            .map(e => e.textContent)
            .join(' ') +
          ' ' +
          i +
          ' ' +
          t;
        (r || a) &&
          this.searchableContent.push({
            title: r.trim(),
            description: a.trim(),
            tags: n.trim(),
            type: t,
            icon: s,
            element: c,
            sectionId: i,
          });
      });
    });
  }
  refreshIndex() {
    this.indexContent();
  }
  attachEventListeners() {
    (this.searchToggle.addEventListener('click', () => this.openSearch()),
      this.searchClose.addEventListener('click', () => this.closeSearch()),
      document.addEventListener('keydown', e => {
        ('Escape' === e.key &&
          this.searchOverlay.classList.contains('active') &&
          this.closeSearch(),
          (e.metaKey || e.ctrlKey) && 'k' === e.key && (e.preventDefault(), this.openSearch()));
      }),
      this.searchOverlay.addEventListener('click', e => {
        e.target === this.searchOverlay && this.closeSearch();
      }),
      this.searchInput.addEventListener('input', e => {
        const t = e.target.value;
        0 === t.length ? this.showSuggestedSearches() : this.performSearch(t);
      }),
      this.searchOverlay.addEventListener('click', e => {
        const t = e.target.closest('#search-clear');
        t &&
          (e.stopPropagation(),
          (this.searchInput.value = ''),
          this.searchInput.focus(),
          this.showSuggestedSearches());
      }));
  }
  openSearch() {
    (this.searchOverlay.classList.add('active'),
      this.indexContent(),
      setTimeout(() => {
        this.searchInput.focus();
      }, 100),
      (document.body.style.overflow = 'hidden'));
  }
  closeSearch() {
    (this.searchOverlay.classList.remove('active'),
      (this.searchInput.value = ''),
      this.showSuggestedSearches(),
      (document.body.style.overflow = ''));
  }
  showSuggestedSearches() {
    const e = `\n            <div class="search-section-title">Suggested Searches</div>\n            ${this.suggestedSearches.map(e => `\n                <div class="search-result-item" data-section="${e.section}">\n                    <div class="search-result-icon">\n                        <i class="fas ${e.icon}"></i>\n                    </div>\n                    <div class="search-result-content">\n                        <div class="search-result-title">${e.text}</div>\n                    </div>\n                </div>\n            `).join('')}\n        `;
    ((this.searchResults.innerHTML = e), this.attachResultClickHandlers());
  }
  performSearch(e) {
    if (!e || e.length < 2) return void this.showSuggestedSearches();
    const t = e.toLowerCase(),
      s = this.searchableContent.filter(
        e =>
          e.title.toLowerCase().includes(t) ||
          e.description.toLowerCase().includes(t) ||
          e.tags.toLowerCase().includes(t)
      );
    this.displayResults(s, e);
  }
  displayResults(e, t) {
    if (0 === e.length)
      return void (this.searchResults.innerHTML = `\n                <div class="search-no-results">\n                    <div class="search-no-results-icon">\n                        <i class="fas fa-search"></i>\n                    </div>\n                    <div class="search-no-results-text">No results found for "${t}"</div>\n                </div>\n            `);
    const s = `\n            <div class="search-section-title">Results (${e.length})</div>\n            ${e
      .slice(0, 10)
      .map(e => {
        const s =
          e.description.length > 85 ? e.description.substring(0, 82) + '...' : e.description;
        return `\n                <div class="search-result-item" data-section="${e.sectionId}">\n                    <div class="search-result-icon">\n                        <i class="fas ${e.icon}"></i>\n                    </div>\n                    <div class="search-result-content">\n                        <div class="search-result-title">${this.highlightQuery(e.title, t)}</div>\n                        <div class="search-result-snippet">${this.highlightQuery(s, t)}</div>\n                        <div class="search-result-section">${e.type}</div>\n                    </div>\n                </div>\n            `;
      })
      .join('')}\n        `;
    ((this.searchResults.innerHTML = s), this.attachResultClickHandlers());
  }
  attachResultClickHandlers() {
    this.searchResults.querySelectorAll('.search-result-item').forEach(e => {
      e.addEventListener('click', () => {
        const t = e.dataset.section;
        (this.closeSearch(),
          setTimeout(() => {
            const e = document.getElementById(t);
            e && e.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100));
      });
    });
  }
  highlightQuery(e, t) {
    if (!t) return e;
    const s = new RegExp(`(${this.escapeRegex(t)})`, 'gi');
    return e.replace(s, '<span class="highlight">$1</span>');
  }
  escapeRegex(e) {
    return e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
'loading' === document.readyState
  ? document.addEventListener('DOMContentLoaded', () => {
      new PortfolioSearch();
    })
  : new PortfolioSearch();
