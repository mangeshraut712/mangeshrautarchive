/**
 * GitHub Projects Dynamic Loader
 * Fetches and displays latest repositories from GitHub API.
 *
 * Data flow:
 * 1) backend proxy (/api/github/repos/public) for repo catalog + server cache
 * 2) production proxy fallback
 * 3) direct GitHub API fallback
 */

class GitHubProjects {
  constructor(username = 'mangeshraut712') {
    this.username = username;
    this.proxyCandidates = [
      '/api/github/repos/public',
      '/api/github/repos',
      'https://mangeshrautarchive.vercel.app/api/github/repos/public',
      'https://mangeshrautarchive.vercel.app/api/github/repos',
    ];
    this.directApiUrl = `https://api.github.com/users/${username}/repos`;

    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 10 * 60 * 1000;
    this.localCacheKey = `github_repos_${username}`;
    this.repoSchemaVersion = 2;

    this.activityCacheDuration = 15 * 60 * 1000;
    this.activityStoragePrefix = `github_repo_activity_${username}_`;
    this.activitySchemaVersion = 2;
    this.repoActivityCache = new Map();

    this.featuredProjectOrder = [
      'mangeshrautarchive',
      'AssistMe-VirtualAssistant',
      'Bug-Reporting-System',
      'ces-ltd.com',
      'kashishbeautyparlour',
      'Real-Time-Face-Emotion-Recognition-System',
      'Crime-Investigation-System',
      'Starlight-Blogging-Website',
    ];

    this.showcaseExcludes = new Set([this.username.toLowerCase(), '.github']);
  }

  normalizeRepoShape(repo = {}) {
    const stars = Number(repo.stargazers_count ?? repo.stars ?? 0);
    const forks = Number(repo.forks_count ?? repo.forks ?? 0);
    const watchers = Number(repo.subscribers_count ?? repo.watchers_count ?? repo.watchers ?? 0);
    const openIssues = Number(repo.open_issues_count ?? repo.open_issues ?? 0);
    const size = Number(repo.size ?? 0);

    const rawLicense = repo.license;
    const license = typeof rawLicense === 'string' ? { spdx_id: rawLicense } : rawLicense || null;

    return {
      ...repo,
      stargazers_count: Number.isFinite(stars) ? stars : 0,
      forks_count: Number.isFinite(forks) ? forks : 0,
      watchers_count: Number.isFinite(watchers) ? watchers : 0,
      open_issues_count: Number.isFinite(openIssues) ? openIssues : 0,
      size: Number.isFinite(size) ? size : 0,
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      license,
      fork: Boolean(repo.fork),
      archived: Boolean(repo.archived),
    };
  }

  async fetchRepositories(forceRefresh = false) {
    // Force refresh bypasses all caches
    if (forceRefresh) {
      this.cache = null;
      this.cacheTime = null;
      localStorage.removeItem(this.localCacheKey);
    }

    if (this.cache && this.cacheTime && Date.now() - this.cacheTime < this.cacheDuration) {
      return this.cache;
    }

    try {
      const cached = localStorage.getItem(this.localCacheKey);
      if (cached) {
        const { repos, timestamp, version } = JSON.parse(cached);
        if (
          version === this.repoSchemaVersion &&
          repos &&
          timestamp &&
          Date.now() - timestamp < this.cacheDuration
        ) {
          this.cache = repos;
          this.cacheTime = timestamp;
          return repos;
        }
      }
    } catch (err) {
      console.warn('Local cache read failed:', err);
    }

    let rawRepos = null;

    for (const proxyBase of this.proxyCandidates) {
      try {
        const proxyResp = await fetch(
          `${proxyBase}?username=${this.username}&limit=100&no_forks=false`,
          { headers: { Accept: 'application/json' } }
        );

        if (!proxyResp.ok) {
          console.warn(`Proxy ${proxyBase} returned ${proxyResp.status}`);
          continue;
        }

        const data = await proxyResp.json();
        if (data.success && Array.isArray(data.data)) {
          console.log(`✅ GitHub repos via proxy ${proxyBase}`);
          rawRepos = data.data;
          break;
        }
      } catch (err) {
        console.warn(`Proxy ${proxyBase} failed:`, err.message);
      }
    }

    if (!rawRepos) {
      try {
        const response = await fetch(`${this.directApiUrl}?per_page=100&sort=updated`, {
          headers: { Accept: 'application/vnd.github.v3+json' },
        });

        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        rawRepos = await response.json();
        console.log('ℹ️ GitHub repos loaded directly (unauthenticated mode)');
      } catch (err) {
        console.error('Error fetching GitHub repositories:', err);
        // If we have stale cache, return it with a warning
        const staleCache = localStorage.getItem(this.localCacheKey);
        if (staleCache) {
          try {
            const { repos } = JSON.parse(staleCache);
            if (repos && repos.length > 0) {
              console.warn('Using stale cache due to API error:', err.message);
              return repos;
            }
          } catch {
            // Ignore stale cache parse failure and return empty below.
          }
        }
        return [];
      }
    }

    const normalizedRepos = Array.isArray(rawRepos)
      ? rawRepos.map(repo => this.normalizeRepoShape(repo))
      : [];

    const sortedRepos = normalizedRepos.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    this.cache = sortedRepos;
    this.cacheTime = Date.now();

    try {
      localStorage.setItem(
        this.localCacheKey,
        JSON.stringify({
          version: this.repoSchemaVersion,
          repos: sortedRepos,
          timestamp: this.cacheTime,
        })
      );
    } catch (err) {
      console.warn('Local cache write failed:', err);
    }

    return sortedRepos;
  }

  getLanguageColor(language) {
    const colors = {
      JavaScript: '#f1e05a',
      TypeScript: '#3178c6',
      Python: '#3572A5',
      Java: '#b07219',
      Swift: '#ffac45',
      HTML: '#e34c26',
      CSS: '#563d7c',
      'C++': '#f34b7d',
      C: '#555555',
      Go: '#00ADD8',
      Rust: '#dea584',
      PHP: '#4F5D95',
      Ruby: '#701516',
      'Jupyter Notebook': '#DA5B0B',
      Shell: '#89e051',
      Dart: '#00B4AB',
      Kotlin: '#A97BFF',
      default: '#6e7681',
    };
    return colors[language] || colors.default;
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  formatCompactNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    if (number < 1000) return String(number);
    if (number < 1000000) return `${(number / 1000).toFixed(1).replace('.0', '')}k`;
    return `${(number / 1000000).toFixed(1).replace('.0', '')}m`;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.max(0, now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }

  formatRelativeDateCompact(dateString) {
    if (!dateString) return 'unknown';

    const date = new Date(dateString);
    const timestamp = date.getTime();
    if (!Number.isFinite(timestamp)) return 'unknown';

    const diffMs = Math.max(0, Date.now() - timestamp);
    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;
    const yearMs = 365 * dayMs;

    if (diffMs < hourMs) return 'now';
    if (diffMs < dayMs) return `${Math.floor(diffMs / hourMs)}h ago`;
    if (diffMs < weekMs) return `${Math.floor(diffMs / dayMs)}d ago`;
    if (diffMs < monthMs) return `${Math.floor(diffMs / weekMs)}w ago`;
    if (diffMs < yearMs) return `${Math.floor(diffMs / monthMs)}mo ago`;
    return `${Math.floor(diffMs / yearMs)}y ago`;
  }

  formatAbsoluteDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
      .map(topic =>
        String(topic || '')
          .trim()
          .toLowerCase()
      )
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

    const score = Math.round(freshness * 0.42 + traction * 0.28 + completeness * 0.3);
    return { score, freshness, traction, completeness, updatedAgeDays };
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

    const confidenceBand =
      showcaseScore.score >= 72 ? 'strong' : showcaseScore.score >= 52 ? 'balanced' : 'emerging';

    return `AI brief: ${signals.join(' · ')}. Quality signal: ${confidenceBand} (${showcaseScore.score}/100).`;
  }

  isRepositoryShowcaseReady(repo) {
    if (!repo || repo.fork || repo.archived) return false;

    const name = String(repo.name || '')
      .trim()
      .toLowerCase();
    if (!name || this.showcaseExcludes.has(name)) return false;

    const description = String(repo.description || '')
      .trim()
      .toLowerCase();
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

    const eligible = repos.filter(repo => this.isRepositoryShowcaseReady(repo));
    if (eligible.length === 0) return [];

    const featuredMap = new Map(this.featuredProjectOrder.map((name, index) => [name, index]));

    const scored = eligible
      .map(repo => ({
        ...repo,
        __showcase: this.getShowcaseScore(repo),
      }))
      .sort((a, b) => {
        const aFeatured = featuredMap.has(a.name);
        const bFeatured = featuredMap.has(b.name);

        if (aFeatured && bFeatured) return featuredMap.get(a.name) - featuredMap.get(b.name);
        if (aFeatured) return -1;
        if (bFeatured) return 1;

        if (b.__showcase.score !== a.__showcase.score) {
          return b.__showcase.score - a.__showcase.score;
        }

        return new Date(b.updated_at) - new Date(a.updated_at);
      });

    return scored.slice(0, limit);
  }

  extractRepoIdentity(repo) {
    const fullName = String(repo?.full_name || '').trim();
    if (fullName.includes('/')) {
      const [owner, name] = fullName.split('/');
      return { fullName, owner, name };
    }

    const htmlUrl = String(repo?.html_url || '').trim();
    if (htmlUrl) {
      try {
        const parsed = new URL(htmlUrl);
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          return {
            fullName: `${parts[0]}/${parts[1]}`,
            owner: parts[0],
            name: parts[1],
          };
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  getActivityStorageKey(fullName) {
    const slug = String(fullName || '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    return `${this.activityStoragePrefix}${slug}`;
  }

  readRepoActivityCache(fullName) {
    if (!fullName) return null;

    const inMemory = this.repoActivityCache.get(fullName);
    if (inMemory && Date.now() - inMemory.timestamp < this.activityCacheDuration) {
      return inMemory.data;
    }

    try {
      const key = this.getActivityStorageKey(fullName);
      const cachedRaw = localStorage.getItem(key);
      if (!cachedRaw) return null;

      const parsed = JSON.parse(cachedRaw);
      if (!parsed?.data || !parsed?.timestamp) return null;
      if (parsed?.version !== this.activitySchemaVersion) return null;
      if (Date.now() - parsed.timestamp >= this.activityCacheDuration) return null;

      this.repoActivityCache.set(fullName, parsed);
      return parsed.data;
    } catch {
      return null;
    }
  }

  writeRepoActivityCache(fullName, data) {
    if (!fullName || !data) return;

    const payload = {
      timestamp: Date.now(),
      version: this.activitySchemaVersion,
      data,
    };

    this.repoActivityCache.set(fullName, payload);

    try {
      const key = this.getActivityStorageKey(fullName);
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors.
    }
  }

  parseCommitDate(commit) {
    return commit?.commit?.author?.date || commit?.commit?.committer?.date || '';
  }

  buildGitHubProxyUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== 'https://api.github.com') return '';
      const pathWithQuery = `${parsed.pathname}${parsed.search || ''}`;
      return `/api/github/proxy?path=${encodeURIComponent(pathWithQuery)}`;
    } catch {
      return '';
    }
  }

  async fetchJson(url, headers = {}) {
    const proxyUrl = this.buildGitHubProxyUrl(url);

    if (proxyUrl) {
      try {
        const response = await fetch(proxyUrl, { headers: { Accept: 'application/json' } });
        if (response.ok) {
          return await response.json();
        }
      } catch {
        // Fall through to direct GitHub call.
      }
    }

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async fetchJsonWithMeta(url, headers = {}) {
    const proxyUrl = this.buildGitHubProxyUrl(url);

    const attemptFetch = async targetUrl => {
      const response = await fetch(targetUrl, { headers });
      const link = response.headers.get('link') || '';
      const data = response.ok ? await response.json() : null;
      return {
        ok: response.ok,
        status: response.status,
        link,
        data,
      };
    };

    if (proxyUrl) {
      try {
        const proxied = await attemptFetch(proxyUrl);
        if (proxied.ok || proxied.status === 404) {
          return proxied;
        }
      } catch {
        // Fall through to direct GitHub call.
      }
    }

    try {
      return await attemptFetch(url);
    } catch {
      return {
        ok: false,
        status: 0,
        link: '',
        data: null,
      };
    }
  }

  getLastPageFromLink(linkHeader = '') {
    if (!linkHeader) return null;

    const candidates = linkHeader
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);

    const last = candidates.find(part => part.includes('rel="last"'));
    const next = candidates.find(part => part.includes('rel="next"'));
    const target = last || next;
    if (!target) return null;

    const match = target.match(/[?&]page=(\d+)/);
    if (!match) return null;

    const page = Number.parseInt(match[1], 10);
    return Number.isFinite(page) && page > 0 ? page : null;
  }

  toFiniteMetric(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  getPopularityScore(repo) {
    const activity = repo.__activity || {};
    const stars = Number(repo.stargazers_count || 0);
    const forks = Number(repo.forks_count || 0);
    const watchers = Number(repo.watchers_count || 0);
    const commits30d = Number(activity.commits30d || 0);
    const contributors = Number(activity.contributors || 0);
    const showcaseQuality = Number(repo.__showcase?.score || 0);

    return (
      stars * 5 + forks * 7 + watchers * 2 + commits30d * 4 + contributors * 3 + showcaseQuality
    );
  }

  async fetchRepoActivity(repo) {
    const identity = this.extractRepoIdentity(repo);
    if (!identity) {
      return {
        commits30d: null,
        commitSample: 0,
        contributors: null,
        latestCommitAt: repo?.pushed_at || repo?.updated_at || '',
        unavailable: true,
      };
    }

    const cached = this.readRepoActivityCache(identity.fullName);
    if (cached) return cached;

    const headers = { Accept: 'application/vnd.github+json' };
    const baseUrl = `https://api.github.com/repos/${identity.owner}/${identity.name}`;
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [commitsMeta, contributorsMeta] = await Promise.all([
      this.fetchJsonWithMeta(
        `${baseUrl}/commits?per_page=1&since=${encodeURIComponent(since30d)}`,
        headers
      ),
      this.fetchJsonWithMeta(`${baseUrl}/contributors?per_page=1&anon=1`, headers),
    ]);

    const commitsPayload = Array.isArray(commitsMeta.data) ? commitsMeta.data : null;
    const contributorsPayload = Array.isArray(contributorsMeta.data) ? contributorsMeta.data : null;

    let commits30d = null;
    let latestCommitAt = repo?.pushed_at || repo?.updated_at || '';
    if (commitsMeta.ok && commitsPayload) {
      if (commitsPayload.length === 0) {
        commits30d = 0;
      } else {
        const pageCount = this.getLastPageFromLink(commitsMeta.link);
        commits30d = pageCount || commitsPayload.length;
        latestCommitAt = this.parseCommitDate(commitsPayload[0]) || latestCommitAt;
      }
    }

    let contributorCount = null;
    if (contributorsMeta.ok && contributorsPayload) {
      if (contributorsPayload.length === 0) {
        contributorCount = 0;
      } else {
        const pageCount = this.getLastPageFromLink(contributorsMeta.link);
        contributorCount = pageCount || contributorsPayload.length;
      }
    }

    const unavailable = commits30d === null && contributorCount === null;

    const activity = {
      commits30d,
      commitSample: Number.isFinite(commits30d) ? commits30d : 0,
      contributors: contributorCount,
      latestCommitAt,
      unavailable,
    };

    this.writeRepoActivityCache(identity.fullName, activity);
    return activity;
  }

  async hydrateReposWithActivity(repos = []) {
    if (!Array.isArray(repos) || repos.length === 0) return repos;

    await Promise.all(
      repos.map(async repo => {
        if (!repo || repo.__activityLoaded) return;
        const activity = await this.fetchRepoActivity(repo);
        repo.__activity = activity;
        repo.__activityLoaded = true;
      })
    );

    return repos;
  }

  createProjectCard(repo, _index) {
    const showcase = repo.__showcase || this.getShowcaseScore(repo);
    const language = repo.language || 'Unknown';
    const languageColor = this.getLanguageColor(language);
    const description = repo.description || 'No repository description provided yet.';

    const stars = Number(repo.stargazers_count || 0);
    const forks = Number(repo.forks_count || 0);
    const openIssues = Number(repo.open_issues_count || 0);
    const watchers = Number(repo.watchers_count || 0);

    const activity = repo.__activity || {};
    const commits30d = this.toFiniteMetric(activity.commits30d);
    const contributors = this.toFiniteMetric(activity.contributors);
    const latestCommitAt = activity.latestCommitAt || repo.pushed_at || repo.updated_at || '';

    const homepage = this.normalizeHomepageUrl(repo.homepage);
    const hasDemo = Boolean(homepage);

    const updatedRelativeCompact = this.formatRelativeDateCompact(repo.updated_at);
    const updatedAbsolute = this.formatAbsoluteDate(repo.updated_at);
    const updatedBadgeText = `${updatedRelativeCompact} · ${updatedAbsolute}`;
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
    const safeHomepage = hasDemo ? this.escapeHtml(homepage) : '';
    const safeUpdatedAbsolute = this.escapeHtml(updatedAbsolute);
    const safeUpdatedBadgeText = this.escapeHtml(updatedBadgeText);
    const safeInsight = this.escapeHtml(aiInsight);
    const safeScore = this.escapeHtml(showcase.score);
    const safeLicense = this.escapeHtml(repoLicense);
    const safeBranch = this.escapeHtml(repoBranch);
    const safeRepoSize = this.escapeHtml(repoSize);
    const safeOpenIssues = this.escapeHtml(openIssues);

    const topics = this.getTopics(repo);
    const topicsJson = this.escapeHtml(JSON.stringify(topics));

    const updatedAt = this.escapeHtml(repo.updated_at || '');
    const createdAt = this.escapeHtml(repo.created_at || '');
    const pushedAt = this.escapeHtml(repo.pushed_at || '');
    const lastCommitAtSafe = this.escapeHtml(latestCommitAt);

    const commitsText = commits30d === null ? '--' : this.formatCompactNumber(commits30d);
    const contributorsText = contributors === null ? '--' : this.formatCompactNumber(contributors);

    return `
      <article class="showcase-project-card apple-3d-project group" aria-label="${safeName} project card">
        <div class="project-header">
          <div class="project-head-top">
            <div class="project-title-wrap">
              <h3 class="project-title">
                <span class="project-title-text">${safeName}</span>
              </h3>
              <a class="project-repo-link" href="${safeRepoUrl}" target="_blank" rel="noopener noreferrer" aria-label="Open ${safeName} repository on GitHub">
                ${safeRepoPath}
              </a>
            </div>
            <span class="project-repo-updated" title="Updated ${safeUpdatedAbsolute}">
              <i class="fas fa-clock"></i>
              ${safeUpdatedBadgeText}
            </span>
          </div>

          <p class="project-description">${safeDescription || 'No description available'}</p>

          <div class="project-signal-row">
            <span class="project-signal-pill" title="Stars">
              <i class="fas fa-star"></i>${this.formatCompactNumber(stars)}
            </span>
            <span class="project-signal-pill" title="Forks">
              <i class="fas fa-code-fork"></i>${this.formatCompactNumber(forks)}
            </span>
            <span class="project-signal-pill" title="Commits in last 30 days">
              <i class="fas fa-code-commit"></i>${commitsText}
            </span>
            <span class="project-signal-pill" title="Contributors">
              <i class="fas fa-users"></i>${contributorsText}
            </span>
            <span class="project-signal-score">Signal ${safeScore}/100</span>
          </div>

          <div class="project-tags">
            ${
              language !== 'Unknown'
                ? `
              <span class="project-language">
                <span class="language-dot" style="background-color: ${languageColor}"></span>
                ${safeLanguage}
              </span>
            `
                : ''
            }
            ${
              topics.length > 0
                ? topics
                    .slice(0, 3)
                    .map(topic => `<span class="project-tag">${this.escapeHtml(topic)}</span>`)
                    .join('')
                : ''
            }
          </div>
        </div>

        <div class="project-footer">
          <button
            type="button"
            class="project-action-btn btn-ar"
            data-project-name="${safeName}"
            data-project-full-name="${safeRepoPath}"
            data-project-url="${safeRepoUrl}"
            data-project-demo-url="${safeHomepage}"
            data-project-repo-url="${safeRepoUrl}"
            data-project-updated-at="${updatedAt}"
            data-project-created-at="${createdAt}"
            data-project-stars="${stars}"
            data-project-forks="${forks}"
            data-project-open-issues="${safeOpenIssues}"
            data-project-watchers="${watchers}"
            data-project-size-kb="${safeRepoSize}"
            data-project-license="${safeLicense}"
            data-project-default-branch="${safeBranch}"
            data-project-pushed-at="${pushedAt}"
            data-project-last-commit-at="${lastCommitAtSafe}"
            data-project-commits-30d="${commits30d === null ? '' : commits30d}"
            data-project-contributors="${contributors === null ? '' : contributors}"
            data-project-score="${safeScore}"
            data-project-language="${safeLanguage}"
            data-project-topics="${topicsJson}"
            data-project-ai-insight="${safeInsight}"
            aria-label="Open ${safeName} spatial detail card"
          >
            <i class="fas fa-cube"></i>
            <span>Spatial View</span>
          </button>

          ${
            hasDemo
              ? `<a href="${safeHomepage}" target="_blank" rel="noopener noreferrer" class="project-action-btn btn-demo" aria-label="Open demo website for ${safeName}">
                <i class="fas fa-arrow-up-right-from-square"></i>
                <span>Demo Website</span>
              </a>`
              : `<button type="button" class="project-action-btn btn-demo is-disabled" disabled aria-disabled="true" aria-label="Demo unavailable for ${safeName}">
                <i class="fas fa-link-slash"></i>
                <span>Demo Unavailable</span>
              </button>`
          }
        </div>
      </article>
    `;
  }

  async renderProjects(containerId = 'github-projects-container', limit = 12) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

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

      await this.hydrateReposWithActivity(showcaseRepos);

      const projectsHTML = showcaseRepos
        .map((repo, index) => this.createProjectCard(repo, index))
        .join('');

      container.innerHTML = projectsHTML;

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

  async getStats() {
    const repos = await this.fetchRepositories();

    const stats = {
      totalRepos: repos.length,
      totalStars: repos.reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0),
      totalForks: repos.reduce((sum, repo) => sum + Number(repo.forks_count || 0), 0),
      languages: {},
      mostStarred: [...repos].sort(
        (a, b) => Number(b.stargazers_count || 0) - Number(a.stargazers_count || 0)
      )[0],
      recentlyUpdated: repos[0],
    };

    repos.forEach(repo => {
      if (!repo.language) return;
      stats.languages[repo.language] = (stats.languages[repo.language] || 0) + 1;
    });

    return stats;
  }

  // Search repositories by name, description, or topics
  async searchRepos(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const repos = await this.fetchRepositories();
    const queryLower = query.toLowerCase().trim();

    return repos.filter(repo => {
      const nameMatch = repo.name?.toLowerCase().includes(queryLower);
      const descMatch = repo.description?.toLowerCase().includes(queryLower);
      const topicMatch = repo.topics?.some(topic => topic?.toLowerCase().includes(queryLower));
      const langMatch = repo.language?.toLowerCase().includes(queryLower);

      return nameMatch || descMatch || topicMatch || langMatch;
    });
  }

  // Sort repositories by different criteria
  sortRepos(repos, sortBy = 'updated') {
    const sorted = [...repos];

    switch (sortBy) {
      case 'stars':
        sorted.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
        break;
      case 'forks':
        sorted.sort((a, b) => (b.forks_count || 0) - (a.forks_count || 0));
        break;
      case 'name':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'created':
        sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'updated':
      default:
        sorted.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
        break;
    }

    return sorted;
  }

  // Get repositories ready for search indexing
  async getSearchableProjects() {
    const repos = await this.fetchRepositories();
    return repos.map(repo => ({
      type: 'GitHub Project',
      title: repo.name,
      description: repo.description || '',
      url: repo.html_url,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language,
      topics: repo.topics || [],
      updated: repo.updated_at,
    }));
  }
}

if (typeof window !== 'undefined') {
  window.GitHubProjects = GitHubProjects;
}

export default GitHubProjects;
