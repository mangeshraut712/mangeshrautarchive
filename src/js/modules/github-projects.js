/**
 * GitHub Projects Dynamic Loader
 * Fetches and displays latest repositories from GitHub API
 * 2025 Portfolio Enhancement
 */

class GitHubProjects {
  constructor(username = 'mangeshraut712') {
    this.username = username;
    this.apiUrl = `https://api.github.com/users/${username}/repos`;
    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch repositories from GitHub API
   */
  async fetchRepositories() {
    // Check cache first
    if (this.cache && this.cacheTime && (Date.now() - this.cacheTime < this.cacheDuration)) {
      return this.cache;
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

      const repos = await response.json();
      
      // Filter out forked repos and sort by updated date
      const filteredRepos = repos
        .filter(repo => !repo.fork)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      // Cache the results
      this.cache = filteredRepos;
      this.cacheTime = Date.now();

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
   * Create project card HTML
   */
  createProjectCard(repo, index) {
    const language = repo.language || 'Unknown';
    const languageColor = this.getLanguageColor(language);
    const description = repo.description || 'No description available';
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const updated = this.formatDate(repo.updated_at);
    const homepage = repo.homepage;

    return `
      <div class="education-card bg-primary rounded-2xl p-6 shadow-light hover:shadow-xl transition-all duration-300 group"
        data-animate="tilt-in"
        data-animate-delay="${120 + (index * 40)}"
      >
        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="text-xl font-semibold mb-2 group-hover:text-accent transition-colors duration-300">
                ${repo.name}
              </h3>
              ${repo.topics && repo.topics.length > 0 ? `
                <div class="flex flex-wrap gap-1 mb-2">
                  ${repo.topics.slice(0, 3).map(topic => `
                    <span class="px-2 py-0.5 bg-accent/5 text-accent text-xs rounded-full border border-accent/20">
                      ${topic}
                    </span>
                  `).join('')}
                </div>
              ` : ''}
            </div>
            ${stars > 0 ? `
              <div class="flex items-center gap-1 text-sm opacity-60">
                <i class="fas fa-star text-yellow-500"></i>
                <span>${stars}</span>
              </div>
            ` : ''}
          </div>

          <!-- Description -->
          <p class="text-sm opacity-80 mb-4 leading-tight flex-1">
            ${description.length > 120 ? description.substring(0, 120) + '...' : description}
          </p>

          <!-- Language & Stats -->
          <div class="flex items-center justify-between mb-4 text-xs opacity-60">
            <div class="flex items-center gap-3">
              ${language !== 'Unknown' ? `
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" style="background-color: ${languageColor}"></span>
                  <span>${language}</span>
                </div>
              ` : ''}
              ${forks > 0 ? `
                <div class="flex items-center gap-1">
                  <i class="fas fa-code-branch"></i>
                  <span>${forks}</span>
                </div>
              ` : ''}
            </div>
            <span class="text-xs opacity-50">Updated ${updated}</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-3 border-t border-border">
            <a href="${repo.html_url}" target="_blank" 
               class="text-accent hover:text-accent text-sm font-medium flex items-center gap-1 transition-all duration-300 hover:gap-2">
              <i class="fab fa-github"></i>
              <span>View Code</span>
            </a>
            ${homepage ? `
              <a href="${homepage}" target="_blank" 
                 class="text-accent hover:text-accent text-sm font-medium flex items-center gap-1 transition-all duration-300 hover:gap-2">
                <i class="fas fa-external-link-alt"></i>
                <span>Live Demo</span>
              </a>
            ` : ''}
          </div>
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
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
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

      // Render project cards
      const projectsHTML = repos
        .slice(0, limit)
        .map((repo, index) => this.createProjectCard(repo, index))
        .join('');

      container.innerHTML = projectsHTML;

      // Trigger animations if available
      if (window.initAnimations) {
        window.initAnimations();
      }

    } catch (error) {
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
    repos.forEach(repo => {
      if (repo.language) {
        stats.languages[repo.language] = (stats.languages[repo.language] || 0) + 1;
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
