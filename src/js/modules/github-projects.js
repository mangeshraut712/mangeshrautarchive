/**
 * GitHub Projects Dynamic Loader
 * Fetches and displays latest repositories from GitHub API
 * 2026 Portfolio Enhancement
 */

class GitHubProjects {
  constructor(username = 'mangeshraut712') {
    this.username = username;
    this.apiUrl = `https://api.github.com/users/${username}/repos`;
    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    this.localCacheKey = `github_repos_${username}`;
  }

  /**
   * Fetch repositories from GitHub API
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

    try {
      const response = await fetch(`${this.apiUrl}?per_page=100&sort=updated`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from GitHub API');
      }
      const repos = JSON.parse(text);

      // Filter out forked repos and sort by updated date
      const filteredRepos = repos
        .filter(repo => !repo.fork)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      // Cache the results
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
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      return [];
    }
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
   * Get custom metadata for priority projects
   */
  getProjectMetadata(repoName) {
    const metadata = {
      'AssistMe-VirtualAssistant': {
        description: 'Intelligent desktop assistant with voice control and LLM integration.',
        wins: ['90% Command Accuracy', 'Low-Latency Audio', 'Plugin Architecture']
      },
      'Bug-Reporting-System': {
        description: 'Enterprise bug tracker with real-time updates and RBAC.',
        wins: ['Concurrent Locking', 'WebSocket Support', 'Secure RBAC']
      },
      'Real-Time-Face-Emotion-Recognition-System': {
        description: 'CNN-based emotion detection from live video streams.',
        wins: ['94.5% Accuracy', '<15ms Inference', '60 FPS Processing']
      },
      'Crime-Investigation-System': {
        description: 'Secure centralized case management for law enforcement.',
        wins: ['AES-256 Encryption', 'Scalable Schema', '80% Less Paperwork']
      },
      'mangeshrautarchive': {
        description: 'Next-gen AI portfolio with agentic capabilities and 3D effects.',
        wins: ['60 tok/sec Streaming', '3D Interactive UX', 'Agentic UI Control']
      },
      'Starlight-Blogging-Website': {
        description: 'Modern blogging platform with markdown and SEO optimization.',
        wins: ['100 Lighthouse Score', 'Real-time Markdown', 'JWT Security']
      }
    };
    return metadata[repoName] || null;
  }

  /**
   * Create project card HTML
   */
  createProjectCard(repo, _index) {
    const meta = this.getProjectMetadata(repo.name);
    const language = repo.language || 'Unknown';
    const languageColor = this.getLanguageColor(language);
    const description = meta ? meta.description : (repo.description || 'No description available');
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const homepage = repo.homepage;

    const winsHtml = meta ? `
      <div class="project-wins">
        ${meta.wins.map(win => `<span class="win-tag"><i class="fas fa-check-circle"></i> ${win}</span>`).join('')}
      </div>
    ` : '';

    return `
      <div class="project-card group">
        <div class="project-header">
          <h3 class="project-title">
            <i class="fas fa-book-bookmark project-icon text-accent"></i>
            ${repo.name}
          </h3>
          <p class="project-description">
            ${description}
          </p>
          ${winsHtml}
        </div>

        <div class="project-body">
          <div class="project-stats">
            ${stars > 0 ? `
              <div class="project-stat">
                <i class="fas fa-star"></i>
                <span>${stars}</span>
              </div>
            ` : ''}
            ${forks > 0 ? `
              <div class="project-stat">
                <i class="fas fa-code-branch"></i>
                <span>${forks}</span>
              </div>
            ` : ''}
          </div>

          <div class="project-tags">
            ${language !== 'Unknown' ? `
              <div class="project-language">
                <span class="language-dot" style="background-color: ${languageColor}"></span>
                ${language}
              </div>
            ` : ''}
            ${repo.topics && repo.topics.length > 0 ? repo.topics.slice(0, 2).map(topic => `
              <span class="project-tag">${topic}</span>
            `).join('') : ''}
          </div>
        </div>

        <div class="project-footer">
          <a href="${repo.html_url}" target="_blank" class="project-action-btn btn-github">
            <i class="fab fa-github"></i>
            <span>Code</span>
          </a>
          ${homepage ? `
            <a href="${homepage}" target="_blank" class="project-action-btn btn-demo">
              <i class="fas fa-external-link-alt"></i>
              <span>Live Demo</span>
            </a>
          ` : ''}
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

      if (repos.length === 0) {
        container.innerHTML = `
          <div class="col-span-full text-center py-12">
            <i class="fas fa-folder-open text-6xl text-accent opacity-20 mb-4"></i>
            <p class="text-secondary">No repositories found</p>
          </div>
        `;
        return;
      }

      // Priority projects list (curated selection)
      const priorityProjects = [
        'mangeshrautarchive',
        'AssistMe-VirtualAssistant',
        'Bug-Reporting-System',
        'ces-ltd.com',
        'kashishbeautyparlour',
        'Real-Time-Face-Emotion-Recognition-System',
        'Crime-Investigation-System',
        'Starlight-Blogging-Website'
      ];

      // Filter for priority projects (all 8, with or without demos)
      let filteredRepos = repos.filter(repo => {
        return priorityProjects.includes(repo.name);
      });

      // Sort by priority order
      filteredRepos.sort((a, b) => {
        const indexA = priorityProjects.indexOf(a.name);
        const indexB = priorityProjects.indexOf(b.name);
        return indexA - indexB;
      });

      // If we don't have enough priority projects, add other projects with demos as fallback
      if (filteredRepos.length < limit) {
        const otherReposWithDemos = repos.filter(repo => {
          const notInPriority = !priorityProjects.includes(repo.name);
          const hasDemo = repo.homepage && repo.homepage.trim() !== '';
          return notInPriority && hasDemo;
        });
        filteredRepos = [...filteredRepos, ...otherReposWithDemos];
      }

      if (filteredRepos.length === 0) {
        container.innerHTML = `
          <div class="col-span-full text-center py-12">
            <i class="fas fa-folder-open text-6xl text-accent opacity-20 mb-4"></i>
            <p class="text-secondary">No priority projects found</p>
          </div>
        `;
        return;
      }

      // Render project cards
      const projectsHTML = filteredRepos
        .slice(0, limit)
        .map((repo, index) => this.createProjectCard(repo, index))
        .join('');

      container.innerHTML = projectsHTML;



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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GitHubProjects;
}

// Make available globally
window.GitHubProjects = GitHubProjects;
