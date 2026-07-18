/**
 * GitHub Projects Dynamic Loader
 * Fetches and displays latest repositories from GitHub API.
 *
 * Data flow:
 * 1) backend proxy (/api/github/repos/public) for repo catalog + server cache
 * 2) configured production proxy fallback
 * 3) direct GitHub API fallback
 */

import { renderRepoEvidenceRow } from './case-studies-data.js';
import { escapeHtml as escapeHtmlShared } from '../utils/escape-html.js';

// Hoisted Intl formatters for performance
const absoluteDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const repoCatalogMemoryCache = new Map();
const repoCatalogPendingRequests = new Map();

class GitHubProjects {
  constructor(username = 'mangeshraut712') {
    this.username = username;
    const isLocal =
      typeof window !== 'undefined' &&
      ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

    const base =
      globalThis.APP_CONFIG?.apiBaseUrl ||
      (typeof globalThis.buildConfig !== 'undefined' && globalThis.buildConfig.apiBaseUrl) ||
      '';
    let apiBase = base ? String(base).replace(/\/$/, '') : '';
    // On GitHub Pages prefer configured edge worker; only use Vercel if still configured as base
    if (
      !apiBase &&
      typeof window !== 'undefined' &&
      window.location.hostname.endsWith('github.io')
    ) {
      apiBase = '';
    }
    const apiBaseNormalized = apiBase;

    const candidates = [];
    if (isLocal) {
      candidates.push('/api/github/repos/public', '/api/github/repos');
    } else if (apiBaseNormalized) {
      candidates.push(
        `${apiBaseNormalized}/api/github/repos/public`,
        `${apiBaseNormalized}/api/github/repos`
      );
    }
    // Edge worker catalog (Pages when Vercel is blocked)
    const edgeBase = 'https://assistme-chat.mangeshraut712.workers.dev';
    if (!apiBaseNormalized || !apiBaseNormalized.includes('workers.dev')) {
      candidates.push(`${edgeBase}/api/github/repos/public`, `${edgeBase}/api/github/repos`);
    }
    // Do not add blocked Vercel hosts — they only produce CORS noise on Pages.
    this.proxyCandidates = candidates;
    this.directApiUrl = `https://api.github.com/users/${username}/repos`;

    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 10 * 60 * 1000;
    this.localCacheKey = `github_repos_${username}`;
    this.repoSchemaVersion = 2;

    this.activityCacheDuration = 15 * 60 * 1000;
    this.activityStoragePrefix = `github_repo_activity_${username}_`;
    this.activitySchemaVersion = 3;
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

    this.fallbackRepos = [
      {
        name: 'mangeshrautarchive',
        full_name: 'mangeshraut712/mangeshrautarchive',
        description: 'Personal portfolio site with project showcase and AI assistant.',
        homepage: 'https://mangeshraut712.github.io/mangeshrautarchive/',
        html_url: 'https://github.com/mangeshraut712/mangeshrautarchive',
        language: 'JavaScript',
        topics: ['frontend', 'portfolio', 'web', 'ai-assistant'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 51202,
        license: null,
        default_branch: 'main',
        updated_at: '2026-04-08T22:11:02Z',
        created_at: '2025-04-08T23:10:08Z',
        pushed_at: '2026-04-08T22:10:55Z',
        fork: false,
        archived: false,
      },
      {
        name: 'AssistMe-VirtualAssistant',
        full_name: 'mangeshraut712/AssistMe-VirtualAssistant',
        description:
          'Multi-modal AI assistant with voice mode and research tools (React + FastAPI).',
        homepage: 'https://assist-me-virtual-assistant.vercel.app/',
        html_url: 'https://github.com/mangeshraut712/AssistMe-VirtualAssistant',
        language: 'JavaScript',
        topics: [
          'ai-assistant',
          'fastapi',
          'full-stack',
          'python',
          'react',
          'tailwindcss',
          'vite',
          'voice',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 64202,
        license: null,
        default_branch: 'main',
        updated_at: '2026-03-27T09:25:25Z',
        created_at: '2025-10-04T05:08:53Z',
        pushed_at: '2026-03-27T09:25:21Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Bug-Reporting-System',
        full_name: 'mangeshraut712/Bug-Reporting-System',
        description: 'Full-stack bug tracker with Django REST API and React UI.',
        homepage: 'https://bug-reporting-system-psi.vercel.app/',
        html_url: 'https://github.com/mangeshraut712/Bug-Reporting-System',
        language: 'Python',
        topics: ['bug-tracker', 'django', 'docker', 'drf', 'full-stack', 'postgresql', 'react'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 652,
        license: null,
        default_branch: 'main',
        updated_at: '2026-03-27T09:27:09Z',
        created_at: '2025-11-11T11:16:35Z',
        pushed_at: '2026-03-27T09:27:05Z',
        fork: false,
        archived: false,
      },
      {
        name: 'ces-ltd.com',
        full_name: 'mangeshraut712/ces-ltd.com',
        description: 'Redesign concept for CES energy intelligence platform (Next.js + Three.js).',
        homepage: 'https://ces-ltd-com.vercel.app/',
        html_url: 'https://github.com/mangeshraut712/ces-ltd.com',
        language: 'TypeScript',
        topics: [
          'design',
          'energy',
          'frontend',
          'marketing-site',
          'nextjs',
          'react',
          'threejs',
          'typescript',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 13829,
        license: null,
        default_branch: 'main',
        updated_at: '2026-03-27T09:27:15Z',
        created_at: '2025-11-05T09:55:41Z',
        pushed_at: '2026-03-27T09:27:11Z',
        fork: false,
        archived: false,
      },
      {
        name: 'kashishbeautyparlour',
        full_name: 'mangeshraut712/kashishbeautyparlour',
        description: 'Website for Kashish Beauty Parlour and Training Center (Next.js).',
        homepage: 'https://kashishbeautyparlour.vercel.app/',
        html_url: 'https://github.com/mangeshraut712/kashishbeautyparlour',
        language: 'TypeScript',
        topics: [
          'booking',
          'nextjs',
          'portfolio-site',
          'react',
          'small-business',
          'tailwindcss',
          'typescript',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 216277,
        license: null,
        default_branch: 'main',
        updated_at: '2026-03-27T09:28:21Z',
        created_at: '2025-10-07T07:32:39Z',
        pushed_at: '2026-03-27T09:28:17Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Real-Time-Face-Emotion-Recognition-System',
        full_name: 'mangeshraut712/Real-Time-Face-Emotion-Recognition-System',
        description: 'Real-time face emotion recognition using TensorFlow with a React dashboard.',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/Real-Time-Face-Emotion-Recognition-System',
        language: 'Python',
        topics: ['computer-vision', 'emotion-recognition', 'python', 'react', 'tensorflow'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 31275,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-03-27T09:30:53Z',
        created_at: '2024-06-27T00:57:38Z',
        pushed_at: '2026-03-27T09:30:49Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Crime-Investigation-System',
        full_name: 'mangeshraut712/Crime-Investigation-System',
        description:
          'Java and MySQL crime investigation management system (FIRs, cases, officers).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/Crime-Investigation-System',
        language: 'Java',
        topics: ['backend', 'case-management', 'crud', 'database', 'java', 'mysql'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 1,
        size: 1900,
        license: null,
        default_branch: 'main',
        updated_at: '2026-03-27T09:28:48Z',
        created_at: '2025-04-10T21:44:03Z',
        pushed_at: '2026-03-27T09:28:45Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Starlight-Blogging-Website',
        full_name: 'mangeshraut712/Starlight-Blogging-Website',
        description: 'Full-stack blogging platform (Angular frontend + Flask backend).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/Starlight-Blogging-Website',
        language: 'TypeScript',
        topics: ['angular', 'blog', 'flask', 'full-stack', 'python'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 1102,
        license: null,
        default_branch: 'main',
        updated_at: '2026-03-27T09:30:33Z',
        created_at: '2025-02-13T19:43:25Z',
        pushed_at: '2026-03-27T09:30:30Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Vitals.AI',
        full_name: 'mangeshraut712/Vitals.AI',
        description:
          'Privacy-first AI health dashboard for biomarkers, body composition, recovery, and digital twin insights.',
        homepage: 'https://vitals-ai.vercel.app',
        html_url: 'https://github.com/mangeshraut712/Vitals.AI',
        language: 'TypeScript',
        topics: ['ai', 'health-tech', 'nextjs', 'react', 'typescript'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 3,
        watchers_count: 0,
        subscribers_count: 0,
        size: 1969,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-03-27T09:25:48Z',
        created_at: '2026-02-12T13:25:03Z',
        pushed_at: '2026-04-06T11:53:40Z',
        fork: false,
        archived: false,
      },
      {
        name: 'SanskritNova',
        full_name: 'mangeshraut712/SanskritNova',
        description:
          'Production-ready Sanskrit learning app with FastAPI backend, async AI chat, and multi-platform deployment.',
        homepage: 'https://sanskrit-nova.vercel.app',
        html_url: 'https://github.com/mangeshraut712/SanskritNova',
        language: 'Python',
        topics: ['ai-assistant', 'education', 'fastapi', 'rag', 'sanskrit'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 3,
        watchers_count: 0,
        subscribers_count: 0,
        size: 2921,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-03-28T12:35:04Z',
        created_at: '2026-03-26T11:09:49Z',
        pushed_at: '2026-04-06T09:44:15Z',
        fork: false,
        archived: false,
      },
      {
        name: 'career-agent-pro',
        full_name: 'mangeshraut712/career-agent-pro',
        description:
          'AI job-search copilot for role analysis, resume tailoring, and application prep.',
        homepage: 'https://ai-job-helper-steel.vercel.app/',
        html_url: 'https://github.com/mangeshraut712/career-agent-pro',
        language: 'TypeScript',
        topics: ['ai-agent', 'career', 'job-search', 'resume', 'typescript'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 9,
        watchers_count: 0,
        subscribers_count: 0,
        size: 733,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-03-27T09:26:39Z',
        created_at: '2025-12-21T11:56:06Z',
        pushed_at: '2026-03-30T23:58:00Z',
        fork: false,
        archived: false,
      },
      {
        name: 'ForexScalpingBot',
        full_name: 'mangeshraut712/ForexScalpingBot',
        description: 'SwiftUI iOS trading-assistant UI demo for forex signals.',
        homepage: null,
        html_url: 'https://github.com/mangeshraut712/ForexScalpingBot',
        language: 'Swift',
        topics: ['fintech', 'forex', 'ios', 'swiftui', 'trading'],
        stargazers_count: 2,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 2,
        subscribers_count: 0,
        size: 929,
        license: null,
        default_branch: 'master',
        updated_at: '2026-03-27T09:36:17Z',
        created_at: '2025-10-16T08:55:06Z',
        pushed_at: '2026-03-27T09:36:13Z',
        fork: false,
        archived: false,
      },
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

  extractRepoList(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    if (payload && Array.isArray(payload.data)) return payload.data;
    if (payload && Array.isArray(payload.repos)) return payload.repos;
    return null;
  }

  async fetchRepositories(forceRefresh = false) {
    const sharedCacheKey = `${this.username}:${this.repoSchemaVersion}`;

    // Force refresh bypasses all caches
    if (forceRefresh) {
      this.cache = null;
      this.cacheTime = null;
      localStorage.removeItem(this.localCacheKey);
      repoCatalogMemoryCache.delete(sharedCacheKey);
      repoCatalogPendingRequests.delete(sharedCacheKey);
    }

    if (this.cache && this.cacheTime && Date.now() - this.cacheTime < this.cacheDuration) {
      return this.cache;
    }

    const sharedCache = repoCatalogMemoryCache.get(sharedCacheKey);
    if (
      !forceRefresh &&
      sharedCache?.repos &&
      sharedCache.timestamp &&
      Date.now() - sharedCache.timestamp < this.cacheDuration
    ) {
      this.cache = sharedCache.repos;
      this.cacheTime = sharedCache.timestamp;
      return sharedCache.repos;
    }

    if (!forceRefresh && repoCatalogPendingRequests.has(sharedCacheKey)) {
      const repos = await repoCatalogPendingRequests.get(sharedCacheKey);
      this.cache = repos;
      this.cacheTime = Date.now();
      return repos;
    }

    try {
      const cached = localStorage.getItem(this.localCacheKey);
      if (cached) {
        const { repos, timestamp, version } = JSON.parse(cached);
        if (
          version === this.repoSchemaVersion &&
          Array.isArray(repos) &&
          timestamp &&
          Date.now() - timestamp < this.cacheDuration
        ) {
          this.cache = repos;
          this.cacheTime = timestamp;
          repoCatalogMemoryCache.set(sharedCacheKey, { repos, timestamp });
          return repos;
        }
      }
    } catch (err) {
      console.warn('Local cache read failed:', err);
    }

    const networkLoad = (async () => {
      let rawRepos = null;

      // Prefer configured edge/API bases; skip only hosts marked dead this session.
      const candidates = this.proxyCandidates.filter(base => {
        try {
          if (sessionStorage.getItem('portfolio_api_host_dead_v1') === '1') {
            // Still allow non-Vercel workers.dev / custom CHAT_API_BASE
            return (
              !String(base).includes('mangeshraut.pro') && !String(base).includes('vercel.app')
            );
          }
        } catch {
          // ignore
        }
        return true;
      });

      for (const proxyBase of candidates) {
        try {
          const proxyResp = await fetch(
            `${proxyBase}?username=${this.username}&limit=100&no_forks=false`,
            { headers: { Accept: 'application/json' } }
          );

          if (proxyResp.status === 402 || proxyResp.status === 503) {
            if (
              String(proxyBase).includes('mangeshraut.pro') ||
              String(proxyBase).includes('vercel.app')
            ) {
              try {
                sessionStorage.setItem('portfolio_api_host_dead_v1', '1');
              } catch {
                // ignore
              }
            }
            continue;
          }

          if (!proxyResp.ok) {
            continue;
          }

          const body = await proxyResp.json();
          const repoList = this.extractRepoList(body);
          if (repoList) {
            rawRepos = repoList;
            break;
          }
        } catch {
          // Quiet: proxy may be offline on static mirrors
        }
      }

      if (!rawRepos) {
        try {
          const response = await fetch(`${this.directApiUrl}?per_page=100&sort=updated`, {
            headers: { Accept: 'application/vnd.github+json' },
          });

          if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
          rawRepos = await response.json();
        } catch {
          // Prefer any local cache (even stale), then bundled catalog
          const staleCache = localStorage.getItem(this.localCacheKey);
          if (staleCache) {
            try {
              const { repos } = JSON.parse(staleCache);
              if (repos && repos.length > 0) {
                return repos;
              }
            } catch {
              // Ignore stale cache parse failure
            }
          }
          return this.fallbackRepos.map(repo => this.normalizeRepoShape(repo));
        }
      }

      const normalizedRepos = Array.isArray(rawRepos)
        ? rawRepos.map(repo => this.normalizeRepoShape(repo))
        : [];

      const sortedRepos = normalizedRepos.toSorted(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );

      this.cache = sortedRepos;
      this.cacheTime = Date.now();
      repoCatalogMemoryCache.set(sharedCacheKey, {
        repos: sortedRepos,
        timestamp: this.cacheTime,
      });

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
    })();

    if (!forceRefresh) {
      repoCatalogPendingRequests.set(sharedCacheKey, networkLoad);
    }

    try {
      return await networkLoad;
    } finally {
      repoCatalogPendingRequests.delete(sharedCacheKey);
    }
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
    return escapeHtmlShared(value);
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
    return absoluteDateFormatter.format(date);
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
    return repo.topics.flatMap(topic => {
      const normalized = String(topic || '')
        .trim()
        .toLowerCase();
      return normalized ? [normalized] : [];
    });
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

  normalizeReleasePayload(release) {
    if (!release || typeof release !== 'object') return null;

    const tagName = String(release.tag_name || '').trim();
    if (!tagName) return null;

    return {
      tagName,
      name: String(release.name || tagName).trim(),
      htmlUrl: this.normalizeHomepageUrl(release.html_url || ''),
      publishedAt: release.published_at || '',
      createdAt: release.created_at || '',
      prerelease: Boolean(release.prerelease),
      draft: Boolean(release.draft),
    };
  }

  getReleaseSignal(repo, activity = {}) {
    const latestRelease = activity.latestRelease || null;
    const releaseChecked = activity.releaseChecked === true;
    const hasRelease = Boolean(latestRelease?.tagName);
    const commitsSinceRelease = this.toFiniteMetric(activity.commitsSinceRelease);
    const commits30d = this.toFiniteMetric(activity.commits30d);
    const pushedAgeDays = this.getRepoAgeDays(repo?.pushed_at || repo?.updated_at);
    const updatedAgeDays = this.getRepoAgeDays(repo?.updated_at || repo?.pushed_at);
    const activeAgeDays = Math.min(pushedAgeDays, updatedAgeDays);
    const releaseDate = latestRelease?.publishedAt || latestRelease?.createdAt || '';
    const releaseAgeDays = this.getRepoAgeDays(releaseDate);

    let key = 'open';
    let label = 'Open repo';
    let meta = 'No GitHub release yet';

    if (!releaseChecked) {
      if (activeAgeDays <= 14) key = 'active';
      else if (activeAgeDays <= 45) key = 'fresh';
      else if (activeAgeDays > 120) key = 'attention';
      label = 'Checking release';
      meta = 'Syncing latest GitHub release';
    } else if (!hasRelease) {
      if (activeAgeDays <= 14) {
        key = 'active';
        label = 'Active';
      } else if (activeAgeDays > 120) {
        key = 'attention';
        label = 'Stale';
      }
    } else if (commitsSinceRelease !== null && commitsSinceRelease >= 25) {
      key = 'attention';
      label = 'Stale';
      meta = `${this.formatCompactNumber(commitsSinceRelease)} commits since ${latestRelease.tagName}`;
    } else if (releaseAgeDays > 180) {
      key = 'attention';
      label = 'Stale';
      meta = `Released ${this.formatRelativeDateCompact(releaseDate)}`;
    } else if (commitsSinceRelease !== null && commitsSinceRelease >= 10) {
      key = 'busy';
      label = 'Busy';
      meta = `${this.formatCompactNumber(commitsSinceRelease)} commits since ${latestRelease.tagName}`;
    } else if (releaseAgeDays <= 45) {
      key = 'fresh';
      label = 'Fresh';
      meta = `Released ${this.formatRelativeDateCompact(releaseDate)}`;
    } else {
      key = 'released';
      label = 'Released';
      meta = `Released ${this.formatRelativeDateCompact(releaseDate)}`;
    }

    const filters = new Set(['all', key]);
    if (hasRelease) filters.add('released');
    if (commits30d !== null && commits30d >= 10) filters.add('busy');
    if (activeAgeDays <= 14) filters.add('active');
    if (activeAgeDays <= 45 || (hasRelease && releaseAgeDays <= 45)) filters.add('fresh');
    if (
      key === 'attention' ||
      (releaseChecked && !hasRelease && activeAgeDays > 120) ||
      (hasRelease && commitsSinceRelease !== null && commitsSinceRelease >= 25)
    ) {
      filters.add('attention');
    }

    return {
      key,
      label,
      meta,
      filters,
      hasRelease,
      releaseChecked,
      latestRelease,
      tagName: latestRelease?.tagName || '',
      releaseDate,
      releaseDateLabel: releaseDate ? this.formatAbsoluteDate(releaseDate) : '',
      releaseRelative: releaseDate ? this.formatRelativeDateCompact(releaseDate) : '',
      releaseAgeDays,
      commitsSinceRelease,
    };
  }

  isRepositoryShowcaseReady(repo) {
    if (!repo) return false;

    const name = String(repo.name || '')
      .trim()
      .toLowerCase();
    if (!name || this.showcaseExcludes.has(name)) return false;

    // Force featured projects to be showcase ready, bypassing all checks
    const isFeatured = this.featuredProjectOrder.some(
      featuredName => featuredName.trim().toLowerCase() === name
    );
    if (isFeatured) {
      return true;
    }

    if (repo.fork || repo.archived) return false;

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
      const isLocal =
        typeof window !== 'undefined' &&
        ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(window.location.hostname);

      if (isLocal) {
        return `/api/github/proxy?path=${encodeURIComponent(pathWithQuery)}`;
      }

      // GitHub Pages: skip Vercel proxy (CORS / 402). Use edge proxy or direct API.
      if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
        const base =
          globalThis.APP_CONFIG?.apiBaseUrl ||
          globalThis.buildConfig?.apiBaseUrl ||
          'https://assistme-chat.mangeshraut712.workers.dev';
        if (base && !/mangeshraut\.pro|vercel\.app/i.test(base)) {
          return `${base.replace(/\/$/, '')}/api/github/proxy?path=${encodeURIComponent(pathWithQuery)}`;
        }
        return '';
      }
      const base =
        globalThis.APP_CONFIG?.apiBaseUrl ||
        (typeof globalThis.buildConfig !== 'undefined' && globalThis.buildConfig.apiBaseUrl) ||
        '';
      const apiBaseNormalized = base ? base.replace(/\/$/, '') : '';
      return apiBaseNormalized
        ? `${apiBaseNormalized}/api/github/proxy?path=${encodeURIComponent(pathWithQuery)}`
        : `/api/github/proxy?path=${encodeURIComponent(pathWithQuery)}`;
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
        if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
          return null;
        }
      } catch {
        if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
          return null;
        }
        // Fall through to direct GitHub call on non-Pages hosts.
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
        // Never fall through to api.github.com from github.io — unauthenticated
        // direct calls 403 and poison PageSpeed Best Practices (console network errors).
        if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
          return proxied;
        }
        if (proxied.ok || proxied.status === 404) {
          return proxied;
        }
      } catch {
        if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
          return { ok: false, status: 0, link: '', data: null };
        }
        // Fall through to direct GitHub call on non-Pages hosts.
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

    const candidates = linkHeader.split(',').flatMap(part => {
      const trimmed = part.trim();
      return trimmed ? [trimmed] : [];
    });

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
        commitsSinceRelease: null,
        latestRelease: null,
        releaseChecked: false,
        latestCommitAt: repo?.pushed_at || repo?.updated_at || '',
        unavailable: true,
      };
    }

    const cached = this.readRepoActivityCache(identity.fullName);
    if (cached) return cached;

    const headers = { Accept: 'application/vnd.github+json' };
    const baseUrl = `https://api.github.com/repos/${identity.owner}/${identity.name}`;
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const shouldFetchRelease = repo?.has_releases !== false;

    const [commitsMeta, contributorsMeta, releaseMeta] = await Promise.all([
      this.fetchJsonWithMeta(
        `${baseUrl}/commits?per_page=1&since=${encodeURIComponent(since30d)}`,
        headers
      ),
      this.fetchJsonWithMeta(`${baseUrl}/contributors?per_page=1&anon=1`, headers),
      shouldFetchRelease
        ? this.fetchJsonWithMeta(`${baseUrl}/releases?per_page=1`, headers)
        : Promise.resolve({ ok: false, status: 204, link: '', data: null }),
    ]);

    const commitsPayload = Array.isArray(commitsMeta.data) ? commitsMeta.data : null;
    const contributorsPayload = Array.isArray(contributorsMeta.data) ? contributorsMeta.data : null;
    const latestReleasePayload = Array.isArray(releaseMeta.data)
      ? releaseMeta.data[0]
      : releaseMeta.data;
    const latestRelease = releaseMeta.ok
      ? this.normalizeReleasePayload(latestReleasePayload)
      : null;
    const releaseChecked = !shouldFetchRelease || releaseMeta.ok || releaseMeta.status === 404;

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

    let commitsSinceRelease = null;
    const releaseDate = latestRelease?.publishedAt || latestRelease?.createdAt || '';
    if (releaseDate) {
      const releaseCommitsMeta = await this.fetchJsonWithMeta(
        `${baseUrl}/commits?per_page=1&since=${encodeURIComponent(releaseDate)}`,
        headers
      );
      const releaseCommitsPayload = Array.isArray(releaseCommitsMeta.data)
        ? releaseCommitsMeta.data
        : null;

      if (releaseCommitsMeta.ok && releaseCommitsPayload) {
        if (releaseCommitsPayload.length === 0) {
          commitsSinceRelease = 0;
        } else {
          const pageCount = this.getLastPageFromLink(releaseCommitsMeta.link);
          commitsSinceRelease = pageCount || releaseCommitsPayload.length;
        }
      }
    }

    const unavailable = commits30d === null && contributorCount === null && !releaseChecked;

    const activity = {
      commits30d,
      commitSample: Number.isFinite(commits30d) ? commits30d : 0,
      contributors: contributorCount,
      commitsSinceRelease,
      latestRelease,
      releaseChecked,
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

  buildProjectEvidenceRow(repo) {
    return renderRepoEvidenceRow(repo);
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
    const releaseSignal = this.getReleaseSignal(repo, activity);
    const releaseKey = ['attention', 'active', 'busy', 'fresh', 'released', 'open'].includes(
      releaseSignal.key
    )
      ? releaseSignal.key
      : 'open';

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
    const safeReleaseKey = this.escapeHtml(releaseKey);
    const safeReleaseLabel = this.escapeHtml(releaseSignal.label);
    const safeReleaseMeta = this.escapeHtml(releaseSignal.meta);
    const safeReleaseTag = this.escapeHtml(releaseSignal.tagName || 'No release');
    const safeReleaseDate = this.escapeHtml(releaseSignal.releaseDate || '');
    const safeReleaseDateLabel = this.escapeHtml(
      releaseSignal.releaseDateLabel || 'No release date'
    );
    const safeReleaseUrl = this.escapeHtml(releaseSignal.latestRelease?.htmlUrl || '');
    const safeReleaseCommits = this.escapeHtml(
      releaseSignal.commitsSinceRelease === null ? '' : releaseSignal.commitsSinceRelease
    );

    const topics = this.getTopics(repo);
    const topicsJson = this.escapeHtml(JSON.stringify(topics));

    const updatedAt = this.escapeHtml(repo.updated_at || '');
    const createdAt = this.escapeHtml(repo.created_at || '');
    const pushedAt = this.escapeHtml(repo.pushed_at || '');
    const lastCommitAtSafe = this.escapeHtml(latestCommitAt);

    const commitsText = commits30d === null ? '--' : this.formatCompactNumber(commits30d);
    const contributorsText = contributors === null ? '--' : this.formatCompactNumber(contributors);
    const releaseCommitsText =
      releaseSignal.commitsSinceRelease === null
        ? 'n/a'
        : this.formatCompactNumber(releaseSignal.commitsSinceRelease);

    return `
      <article class="showcase-project-card apple-3d-project group lg-interactive" data-lg-interactive data-release-status="${safeReleaseKey}" aria-label="${safeName} project card">
        <div class="project-header">
          <div class="project-head-top">
            <div class="project-title-wrap">
              <h3 class="project-title">
                <span class="project-title-text">${safeName}</span>
              </h3>
              <a class="project-repo-link" href="${safeRepoUrl}" target="_blank" rel="noopener noreferrer">
                ${safeRepoPath}
              </a>
            </div>
            <span class="project-repo-updated" title="Updated ${safeUpdatedAbsolute}">
              <i class="fas fa-clock"></i>
              ${safeUpdatedBadgeText}
            </span>
          </div>

          <p class="project-description">${safeDescription || 'No description available'}</p>

          <div class="project-release-strip" data-release-status="${safeReleaseKey}">
            <div class="project-release-copy">
              <span class="project-release-status project-release-${safeReleaseKey}">${safeReleaseLabel}</span>
              <strong>${safeReleaseTag}</strong>
            </div>
            <div class="project-release-meta">
              <span title="${safeReleaseDateLabel}">
                <i class="fas fa-tag"></i>
                ${safeReleaseMeta}
              </span>
              <span title="Commits since latest release">
                <i class="fas fa-code-branch"></i>
                ${releaseCommitsText}
              </span>
            </div>
          </div>

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

        ${this.buildProjectEvidenceRow(repo)}

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
            data-project-release-status="${safeReleaseKey}"
            data-project-release-status-label="${safeReleaseLabel}"
            data-project-release-tag="${safeReleaseTag}"
            data-project-release-url="${safeReleaseUrl}"
            data-project-release-published-at="${safeReleaseDate}"
            data-project-release-commits-since="${safeReleaseCommits}"
            data-project-release-checked="${releaseSignal.releaseChecked ? 'true' : 'false'}"
            data-project-commits-30d="${commits30d === null ? '' : commits30d}"
            data-project-contributors="${contributors === null ? '' : contributors}"
            data-project-score="${safeScore}"
            data-project-language="${safeLanguage}"
            data-project-topics="${topicsJson}"
            data-project-ai-insight="${safeInsight}"
            aria-label="${safeName}: Spatial View"
          >
            <i class="fas fa-cube"></i>
            <span>Spatial View</span>
          </button>

          ${
            hasDemo
              ? `<a href="${safeHomepage}" target="_blank" rel="noopener noreferrer" class="project-action-btn btn-demo" aria-label="${safeName}: Demo Website">
                <i class="fas fa-arrow-up-right-from-square"></i>
                <span>Demo Website</span>
              </a>`
              : `<button type="button" class="project-action-btn btn-demo is-disabled" disabled aria-disabled="true" aria-label="Demo unavailable">
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

    // Keep existing shell if present (avoids flash of empty + double spinner)
    if (
      !container.querySelector(
        '.project-loading-state, .projects-loading-container, .apple-3d-project, .showcase-project-card'
      )
    ) {
      container.innerHTML = `
      <div class="projects-grid-full project-loading-state" role="status" aria-live="polite">
        <div class="project-loading-inner">
          <div class="loading-spinner" aria-hidden="true"></div>
          <p class="text-secondary loading-message">Loading projects from GitHub…</p>
        </div>
      </div>
    `;
    }

    try {
      const repos = await this.fetchRepositories();
      const showcaseRepos = this.getShowcaseRepos(repos, limit);

      if (showcaseRepos.length === 0) {
        container.innerHTML = `
          <div class="projects-grid-full project-empty-state">
            <i class="fas fa-folder-open project-state-icon" aria-hidden="true"></i>
            <p class="text-secondary">No showcase-ready repositories found</p>
            <p class="text-secondary"><a href="https://github.com/mangeshraut712" target="_blank" rel="noopener noreferrer">View GitHub profile</a></p>
          </div>
        `;
        return;
      }

      await this.hydrateReposWithActivity(showcaseRepos);

      const projectsHTML = showcaseRepos
        .map((repo, index) => this.createProjectCard(repo, index))
        .join('');

      container.innerHTML = projectsHTML;

      window.dispatchEvent(new CustomEvent('projects:rendered'));
      window.dispatchEvent(new CustomEvent('liquid-glass:sync-chrome'));

      if (window.PremiumEnhancements && window.PremiumEnhancements.applyTiltToElement) {
        const newCards = container.querySelectorAll('.apple-3d-project');
        newCards.forEach(card => window.PremiumEnhancements.applyTiltToElement(card));
      }
    } catch (error) {
      console.warn('[GitHubProjects] Failed to render projects:', error);
      container.innerHTML = `
        <div class="projects-grid-full project-empty-state">
          <i class="fas fa-exclamation-triangle project-state-icon project-state-icon-danger" aria-hidden="true"></i>
          <p class="text-secondary">Could not load live GitHub projects right now.</p>
          <p class="text-secondary"><a href="https://github.com/mangeshraut712?tab=repositories" target="_blank" rel="noopener noreferrer">Browse repositories on GitHub</a></p>
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
      mostStarred: repos.reduce((max, repo) =>
        Number(repo.stargazers_count || 0) > Number(max.stargazers_count || 0) ? repo : max
      ),
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
