/**
 * GitHub Projects Dynamic Loader
 * Fetches and displays latest repositories from GitHub API
 * 2026 Portfolio Enhancement
 *
 * GitHub API calls now go through the backend proxy at /api/github/repos
 * which applies server-side 10-min caching and optional PAT auth (5000 req/hr).
 * Direct browser → GitHub is only used as a fallback.
 */

class GitHubProjects {
  constructor(username = 'mangeshraut712') {
    this.username = username;
    // Backend proxy — preferred (server-side cache + optional auth)
    this.proxyUrl = 'https://mangeshrautarchive.vercel.app/api/github/repos';
    // Direct GitHub — fallback only (60 req/hr unauthenticated)
    this.directApiUrl = `https://api.github.com/users/${username}/repos`;
    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 10 * 60 * 1000; // 10 minutes — matches server TTL
    this.localCacheKey = `github_repos_${username}`;
    this.featuredProjectOrder = [
      'mangeshrautarchive',
      'AssistMe-VirtualAssistant',
      'Bug-Reporting-System',
      'ces-ltd.com',
      'kashishbeautyparlour',
      'Real-Time-Face-Emotion-Recognition-System',
      'Crime-Investigation-System',
      'Starlight-Blogging-Website'
    ];
    this.showcaseExcludes = new Set([
      this.username.toLowerCase(),
      '.github'
    ]);
  }

  /**
   * Fetch repositories from the backend proxy (preferred) or GitHub directly (fallback).
   */
  async fetchRepositories() {
    // 1) In-memory cache
    if (this.cache && this.cacheTime && (Date.now() - this.cacheTime < this.cacheDuration)) {
      return this.cache;
    }

    // 2) LocalStorage cache (survives reloads)
    try {
      const cached = localStorage.getItem(this.localCacheKey);
      if (cached) {
        const { repos, timestamp } = JSON.parse(cached);
        if (repos && timestamp && (Date.now() - timestamp < this.cacheDuration)) {
          this.cache = repos;
          this.cacheTime = timestamp;
          return repos;
        }
      }
    } catch (err) {
      console.warn('Local cache read failed:', err);
    }

    // 3) Try backend proxy first (server-side cache + optional PAT auth)
    let rawRepos = null;
    try {
      const proxyResp = await fetch(
        `${this.proxyUrl}?username=${this.username}&limit=100&no_forks=false`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (proxyResp.ok) {
        const data = await proxyResp.json();
        if (data.success && Array.isArray(data.data)) {
          rawRepos = data.data;
          console.log(`✅ GitHub repos via backend proxy (${data.rate_mode})`);
        }
      }
    } catch (err) {
      console.warn('⚠️ Backend proxy unavailable, trying GitHub directly:', err.message);
    }

    // 4) Fallback: direct GitHub API
    if (!rawRepos) {
      try {
        const response = await fetch(
          `${this.directApiUrl}?per_page=100&sort=updated`,
          { headers: { 'Accept': 'application/vnd.github.v3+json' } }
        );
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        rawRepos = await response.json();
        console.log('ℹ️ GitHub repos loaded directly (unauthenticated, 60 req/hr)');
      } catch (err) {
        console.error('Error fetching GitHub repositories:', err);
        return [];
      }
    }

    // Filter forks, sort by updated date
    const filteredRepos = rawRepos
      .filter(repo => !repo.fork)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    // Update caches
    this.cache = filteredRepos;
    this.cacheTime = Date.now();
    try {
      localStorage.setItem(this.localCacheKey, JSON.stringify({
        repos: filteredRepos,
        timestamp: this.cacheTime
      }));
    } catch (err) {
      console.warn('Local cache write failed:', err);
    }

    return filteredRepos;
  }

  /**
   * Get language color for badges
   */
  getLanguageColor(language) {
    const colors = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#3178c6',
      'Python': '#3572A5',
      'Java': '#b07219',
      'Swift': '#ffac45',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'C++': '#f34b7d',
      'C': '#555555',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Jupyter Notebook': '#DA5B0B',
      'Shell': '#89e051',
      'Dart': '#00B4AB',
      'Kotlin': '#A97BFF',
      'default': '#6e7681'
    };
    return colors[language] || colors.default;
  }

  /**
   * Escape text for safe HTML insertion.
   */
  escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  /**
   * Get tech stack icons
   */
  getTechIcon(tech) {
    const icons = {
      'JavaScript': 'fab fa-js',
      'TypeScript': 'fab fa-js-square',
      'Python': 'fab fa-python',
      'Java': 'fab fa-java',
      'Swift': 'fab fa-swift',
      'HTML': 'fab fa-html5',
      'CSS': 'fab fa-css3-alt',
      'React': 'fab fa-react',
      'Node.js': 'fab fa-node-js',
      'Angular': 'fab fa-angular',
      'Vue': 'fab fa-vuejs',
      'Docker': 'fab fa-docker',
      'AWS': 'fab fa-aws',
      'Git': 'fab fa-git-alt',
      'default': 'fas fa-code'
    };
    return icons[tech] || icons.default;
  }

  /**
   * Format date to relative time
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  /**
   * Format to a human readable absolute date.
   */
  formatAbsoluteDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  normalizeHomepageUrl(homepage) {
    if (!homepage) return '';
    const value = String(homepage).trim();
    if (!value) return '';

    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const parsed = new URL(withProtocol);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      return parsed.toString();
    } catch {
      return '';
    }
  }

  getTopics(repo) {
    if (!Array.isArray(repo?.topics)) return [];
    return repo.topics
      .map((topic) => String(topic || '').trim().toLowerCase())
      .filter(Boolean);
  }

  getRepoAgeDays(dateString) {
    if (!dateString) return Number.POSITIVE_INFINITY;
    const ts = new Date(dateString).getTime();
    if (Number.isNaN(ts)) return Number.POSITIVE_INFINITY;
    const diff = Date.now() - ts;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  getShowcaseScore(repo) {
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const watchers = repo.watchers_count || 0;
    const topics = this.getTopics(repo);
    const updatedAgeDays = this.getRepoAgeDays(repo.updated_at);

    const freshness = Math.max(0, 100 - Math.min(updatedAgeDays, 180) * 0.55);
    const traction = Math.min(100, stars * 18 + forks * 24 + watchers * 6);
    const completeness = Math.min(
      100,
      (repo.description ? 34 : 0) +
      (repo.language ? 20 : 0) +
      (topics.length ? Math.min(topics.length, 4) * 9 : 0) +
      (repo.homepage ? 26 : 0) +
      (repo.license?.spdx_id ? 10 : 0)
    );

    const score = Math.round(freshness * 0.42 + traction * 0.28 + completeness * 0.30);
    return { score, freshness, traction, completeness, updatedAgeDays };
  }

  getMomentumLabel(repo, showcaseScore) {
    const hasDemo = Boolean(this.normalizeHomepageUrl(repo.homepage));
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const updatedAgeDays = showcaseScore.updatedAgeDays;

    if (updatedAgeDays <= 14 && hasDemo) return { label: 'Launch Ready', tone: 'launch' };
    if (updatedAgeDays <= 30 && (stars + forks >= 3)) return { label: 'High Momentum', tone: 'momentum' };
    if (updatedAgeDays <= 60) return { label: 'Actively Maintained', tone: 'active' };
    if (stars + forks >= 5) return { label: 'Validated Build', tone: 'validated' };
    return { label: 'Stable Archive', tone: 'stable' };
  }

  buildAiInsight(repo, showcaseScore) {
    const topics = this.getTopics(repo);
    const hasDemo = Boolean(this.normalizeHomepageUrl(repo.homepage));
    const updated = this.formatDate(repo.updated_at);
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const traction = stars + forks;

    const signals = [];
    signals.push(`Updated ${updated}`);
    if (hasDemo) signals.push('live demo available');
    if (topics.length) signals.push(`${Math.min(topics.length, 4)} tagged capabilities`);
    if (traction > 0) signals.push(`${traction} public engagement signals`);

    const confidenceBand = showcaseScore.score >= 72
      ? 'strong'
      : showcaseScore.score >= 52
        ? 'balanced'
        : 'emerging';

    return `AI brief: ${signals.join(' · ')}. Quality signal: ${confidenceBand} (${showcaseScore.score}/100).`;
  }

  isRepositoryShowcaseReady(repo) {
    if (!repo || repo.fork || repo.archived) return false;
    const name = String(repo.name || '').trim().toLowerCase();
    if (!name || this.showcaseExcludes.has(name)) return false;

    const description = String(repo.description || '').trim().toLowerCase();
    const isProfileReadme = description.includes('profile readme');
    const hasSignal =
      Boolean(repo.description) ||
      Boolean(this.normalizeHomepageUrl(repo.homepage)) ||
      (repo.stargazers_count || 0) > 0 ||
      (repo.forks_count || 0) > 0 ||
      this.getTopics(repo).length > 0;

    if (!hasSignal) return false;
    if (isProfileReadme && !repo.homepage) return false;
    return true;
  }

  getShowcaseRepos(repos, limit = 12) {
    if (!Array.isArray(repos) || repos.length === 0) return [];
    const eligible = repos.filter((repo) => this.isRepositoryShowcaseReady(repo));
    if (eligible.length === 0) return [];

    const featuredMap = new Map(this.featuredProjectOrder.map((name, index) => [name, index]));

    const scored = eligible
      .map((repo) => {
        const showcase = this.getShowcaseScore(repo);
        return {
          ...repo,
          __showcase: showcase
        };
      })
      .sort((a, b) => {
        const aFeatured = featuredMap.has(a.name);
        const bFeatured = featuredMap.has(b.name);
        if (aFeatured && bFeatured) return featuredMap.get(a.name) - featuredMap.get(b.name);
        if (aFeatured) return -1;
        if (bFeatured) return 1;
        if (b.__showcase.score !== a.__showcase.score) return b.__showcase.score - a.__showcase.score;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });

    return scored.slice(0, limit);
  }

  /**
   * Create project card HTML
   */
  createProjectCard(repo, _index) {
    const showcase = repo.__showcase || this.getShowcaseScore(repo);
    const language = repo.language || 'Unknown';
    const languageColor = this.getLanguageColor(language);
    const description = repo.description || 'No repository description provided yet.';
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const openIssues = repo.open_issues_count || 0;
    const homepage = this.normalizeHomepageUrl(repo.homepage);
    const updatedRelative = this.formatDate(repo.updated_at);
    const updatedAbsolute = this.formatAbsoluteDate(repo.updated_at);
    const repoPath = repo.full_name || `${this.username}/${repo.name}`;
    const repoLicense = repo.license?.spdx_id || '';
    const repoSize = Number.isFinite(repo.size) ? repo.size : '';
    const repoBranch = repo.default_branch || '';
    const aiInsight = this.buildAiInsight(repo, showcase);
    const safeName = this.escapeHtml(repo.name);
    const safeRepoPath = this.escapeHtml(repoPath);
    const safeDescription = this.escapeHtml(description);
    const safeLanguage = this.escapeHtml(language);
    const safeRepoUrl = this.escapeHtml(repo.html_url);
    const safeHomepage = homepage ? this.escapeHtml(homepage) : '';
    const hasDemo = Boolean(homepage);
    const spatialTarget = safeRepoUrl;
    const topicsJson = this.escapeHtml(JSON.stringify(this.getTopics(repo)));
    const updatedAt = this.escapeHtml(repo.updated_at || '');
    const createdAt = this.escapeHtml(repo.created_at || '');
    const pushedAt = this.escapeHtml(repo.pushed_at || '');
    const safeUpdatedRelative = this.escapeHtml(updatedRelative);
    const safeUpdatedAbsolute = this.escapeHtml(updatedAbsolute);
    const safeInsight = this.escapeHtml(aiInsight);
    const safeScore = this.escapeHtml(showcase.score);
    const safeLicense = this.escapeHtml(repoLicense);
    const safeBranch = this.escapeHtml(repoBranch);
    const safeRepoSize = this.escapeHtml(repoSize);
    const safeOpenIssues = this.escapeHtml(openIssues);
    const topics = this.getTopics(repo);

    return `
      <div class="project-card apple-3d-project group">
        <div class="project-header">
          <div class="project-head-top">
            <h3 class="project-title">
              <span class="project-title-text">${safeName}</span>
            </h3>
            <span class="project-repo-updated" title="Updated ${safeUpdatedAbsolute}">
              <i class="fas fa-clock"></i>
              ${safeUpdatedRelative}
            </span>
          </div>
          <p class="project-description">${safeDescription}</p>
          <div class="project-tags">
            ${language !== 'Unknown' ? `
              <div class="project-language">
                <span class="language-dot" style="background-color: ${languageColor}"></span>
                ${safeLanguage}
              </div>
            ` : ''}
            ${topics.length > 0 ? topics.slice(0, 2).map(topic => `
              <span class="project-tag">${this.escapeHtml(topic)}</span>
            `).join('') : ''}
            ${stars > 0 ? `<span class="project-star-badge"><i class="fas fa-star"></i> ${stars}</span>` : ''}
          </div>
        </div>

        <div class="project-footer">
          <button
            type="button"
            class="project-action-btn btn-ar"
            data-project-name="${safeName}"
            data-project-full-name="${safeRepoPath}"
            data-project-url="${spatialTarget}"
            data-project-demo-url="${safeHomepage}"
            data-project-repo-url="${safeRepoUrl}"
            data-project-updated-at="${updatedAt}"
            data-project-created-at="${createdAt}"
            data-project-stars="${stars}"
            data-project-forks="${forks}"
            data-project-open-issues="${safeOpenIssues}"
            data-project-watchers="${this.escapeHtml(repo.watchers_count || stars)}"
            data-project-size-kb="${safeRepoSize}"
            data-project-license="${safeLicense}"
            data-project-default-branch="${safeBranch}"
            data-project-pushed-at="${pushedAt}"
            data-project-score="${safeScore}"
            data-project-language="${safeLanguage}"
            data-project-topics="${topicsJson}"
            data-project-ai-insight="${safeInsight}"
            aria-label="Open ${safeName} spatial view">
            <i class="fas fa-cube"></i>
            <span>Spatial</span>
          </button>
          ${hasDemo ? `
            <a href="${safeHomepage}" target="_blank" rel="noopener noreferrer" class="project-action-btn btn-demo" aria-label="Open live demo for ${safeName}">
              <i class="fas fa-arrow-up-right-from-square"></i>
              <span>Live Demo</span>
            </a>
          ` : `
            <a href="${safeRepoUrl}" target="_blank" rel="noopener noreferrer" class="project-action-btn btn-demo" aria-label="View ${safeName} on GitHub">
              <i class="fab fa-github"></i>
              <span>GitHub</span>
            </a>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Render projects to container
   */
  async renderProjects(containerId = 'github-projects-container', limit = 12) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    // Show loading state
    container.innerHTML = `
      <div class="col-span-full flex items-center justify-center py-12">
        <div class="text-center">
          <div class="loading-spinner mb-4 mx-auto"></div>
          <p class="text-secondary">Loading projects from GitHub...</p>
        </div>
      </div>
    `;

    try {
      const repos = await this.fetchRepositories();
      const showcaseRepos = this.getShowcaseRepos(repos, limit);

      if (showcaseRepos.length === 0) {
        container.innerHTML = `
          <div class="col-span-full text-center py-12">
            <i class="fas fa-folder-open text-6xl text-accent opacity-20 mb-4"></i>
            <p class="text-secondary">No showcase-ready repositories found</p>
          </div>
        `;
        return;
      }

      // Render project cards
      const projectsHTML = showcaseRepos
        .map((repo, index) => this.createProjectCard(repo, index))
        .join('');

      container.innerHTML = projectsHTML;

      // Apply 3D tilt to new cards
      if (window.PremiumEnhancements && window.PremiumEnhancements.applyTiltToElement) {
        const newCards = container.querySelectorAll('.apple-3d-project');
        newCards.forEach(card => window.PremiumEnhancements.applyTiltToElement(card));
      }
    } catch {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-exclamation-triangle text-6xl text-red-500 opacity-20 mb-4"></i>
          <p class="text-secondary">Failed to load projects. Please try again later.</p>
        </div>
      `;
    }
  }

  /**
   * Get repository statistics
   */
  async getStats() {
    const repos = await this.fetchRepositories();

    const stats = {
      totalRepos: repos.length,
      totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
      languages: {},
      mostStarred: repos.sort((a, b) => b.stargazers_count - a.stargazers_count)[0],
      recentlyUpdated: repos[0]
    };

    // Count languages
    repos.forEach((project, _index) => {
      if (project.language) {
        stats.languages[project.language] = (stats.languages[project.language] || 0) + 1;
      }
    });

    return stats;
  }
}

if (typeof window !== 'undefined') {
  window.GitHubProjects = GitHubProjects;
}

export default GitHubProjects;
