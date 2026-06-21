import GitHubProjects from './github-projects.js';
import './project-xr.js';

const DEFAULT_USERNAME = 'mangeshraut712';
const PROJECT_ROWS_LIMIT = 2;
const DEFAULT_PROJECT_LENS = 'all';
const LENS_KEYS = ['all', 'attention', 'hot', 'busy', 'fresh', 'released'];
const LENS_LABELS = {
  all: 'All',
  attention: 'Need attention',
  hot: 'Hot',
  busy: 'Busy',
  fresh: 'Fresh',
  released: 'Released',
};
const LENS_HINTS = {
  all: 'Every showcase repository',
  attention: 'Stale releases or heavy commit drift since last tag',
  hot: 'Active in the last 14 days',
  busy: '10+ commits since the latest release',
  fresh: 'Released within the last 45 days',
  released: 'Has at least one GitHub release',
};

function getProjectGridColumns(container) {
  if (
    !container ||
    typeof window === 'undefined' ||
    typeof window.getComputedStyle !== 'function'
  ) {
    return 3;
  }

  const template = window.getComputedStyle(container).gridTemplateColumns || '';
  if (!template) return 3;

  const columns = template.split(' ').filter(Boolean).length;
  return Math.max(1, columns || 3);
}

function getTwoRowLimit(container) {
  return getProjectGridColumns(container) * PROJECT_ROWS_LIMIT;
}

function setTextById(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = String(value);
  }
}

function formatCompactNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '--';
  if (number < 1000) return String(number);
  if (number < 1000000) return `${(number / 1000).toFixed(1).replace('.0', '')}k`;
  return `${(number / 1000000).toFixed(1).replace('.0', '')}m`;
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '');
}

function withinEditDistance(left, right, maxDistance = 2) {
  if (!left || !right) return false;
  if (left === right) return true;

  const lengthDiff = Math.abs(left.length - right.length);
  if (lengthDiff > maxDistance) return false;

  const previous = new Array(right.length + 1);
  const current = new Array(right.length + 1);

  for (let j = 0; j <= right.length; j += 1) previous[j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];

    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }

    if (rowMin > maxDistance) return false;
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }

  return previous[right.length] <= maxDistance;
}

function toFiniteMetric(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function debounce(callback, delay = 150) {
  let timer = null;
  return (...args) => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => callback(...args), delay);
  };
}

function applyTiltEffects(container) {
  if (!window.PremiumEnhancements || !window.PremiumEnhancements.applyTiltToElement) {
    return;
  }

  container.querySelectorAll('.apple-3d-project').forEach(card => {
    window.PremiumEnhancements.applyTiltToElement(card);
  });
}

function renderNoResults(container, query = '', lensLabel = '') {
  const parts = [];
  if (query) parts.push(`"${query}"`);
  if (lensLabel) parts.push(lensLabel);
  const suffix = parts.length ? ` for ${parts.join(' and ')}` : '';
  container.innerHTML = `
    <div class="col-span-full projects-empty-state">
      <i class="fas fa-folder-open"></i>
      <h4>No matching repositories${suffix}</h4>
      <p>Try another project name, language, or tag.</p>
    </div>
  `;
}

function updateActivityStats(allRepos, visibleRepos = [], githubProjects = null) {
  const source = Array.isArray(allRepos) ? allRepos : [];

  // Remove skeleton classes from stat items
  document.querySelectorAll('.activity-stat-item.skeleton').forEach(item => {
    item.classList.add('loaded');
    // Remove skeleton class after animation completes
    setTimeout(() => {
      item.classList.remove('skeleton');
      item.classList.remove('loaded');
    }, 300);
  });

  const totals = source.reduce(
    (acc, repo) => {
      acc.totalStars += Number(repo.stargazers_count || 0);
      acc.totalForks += Number(repo.forks_count || 0);

      if (repo.language) {
        acc.languages.add(repo.language);
      }

      const activity = repo.__activity;
      const commits30d = toFiniteMetric(activity?.commits30d);
      const contributors = toFiniteMetric(activity?.contributors);
      const hasLiveActivity =
        activity && activity.unavailable !== true && (commits30d !== null || contributors !== null);

      if (hasLiveActivity) {
        acc.activityRepos += 1;
        acc.totalCommits30d += commits30d ?? 0;
        acc.totalContributors += contributors ?? 0;
      }

      const releaseSignal =
        githubProjects && typeof githubProjects.getReleaseSignal === 'function'
          ? githubProjects.getReleaseSignal(repo, activity || {})
          : null;
      if (releaseSignal?.releaseChecked) {
        acc.releaseCheckedRepos += 1;
        if (releaseSignal.hasRelease) acc.releasedRepos += 1;
        if (releaseSignal.filters?.has('attention')) acc.attentionRepos += 1;
        if (releaseSignal.filters?.has('hot')) acc.hotRepos += 1;
        if (releaseSignal.filters?.has('busy')) acc.busyRepos += 1;
        if (releaseSignal.filters?.has('fresh')) acc.freshRepos += 1;
        if (releaseSignal.commitsSinceRelease !== null) {
          acc.totalCommitsSinceRelease += releaseSignal.commitsSinceRelease;
        }
      }

      const updatedTime = new Date(repo.updated_at || 0).getTime();
      if (Number.isFinite(updatedTime) && updatedTime > acc.latestUpdate) {
        acc.latestUpdate = updatedTime;
      }

      return acc;
    },
    {
      totalStars: 0,
      totalForks: 0,
      totalCommits30d: 0,
      totalContributors: 0,
      totalCommitsSinceRelease: 0,
      activityRepos: 0,
      releaseCheckedRepos: 0,
      releasedRepos: 0,
      attentionRepos: 0,
      hotRepos: 0,
      busyRepos: 0,
      freshRepos: 0,
      languages: new Set(),
      latestUpdate: 0,
    }
  );

  setTextById('stat-repos', source.length);
  setTextById(
    'stat-released',
    totals.releaseCheckedRepos ? formatCompactNumber(totals.releasedRepos) : '--'
  );
  setTextById('stat-stars', formatCompactNumber(totals.totalStars));
  setTextById('stat-forks', formatCompactNumber(totals.totalForks));
  setTextById(
    'stat-commits',
    totals.activityRepos ? formatCompactNumber(totals.totalCommits30d) : '--'
  );
  setTextById(
    'stat-release-commits',
    totals.releaseCheckedRepos ? formatCompactNumber(totals.totalCommitsSinceRelease) : '--'
  );
  setTextById(
    'stat-attention',
    totals.releaseCheckedRepos ? formatCompactNumber(totals.attentionRepos) : '--'
  );
  setTextById('stat-languages', totals.languages.size);

  const captionEl = document.getElementById('projects-activity-caption');
  if (!captionEl) return;

  if (totals.releaseCheckedRepos > 0) {
    captionEl.textContent = `${totals.hotRepos} hot · ${totals.freshRepos} fresh · ${totals.busyRepos} busy · ${totals.attentionRepos} need attention · ${totals.releasedRepos} released.`;
    return;
  }

  if (totals.activityRepos > 0) {
    captionEl.textContent = `${totals.activityRepos} repositories with live commit history and contributor activity in the last sync.`;
    return;
  }

  if (Array.isArray(visibleRepos) && visibleRepos.length > 0) {
    captionEl.textContent = 'Loading live commit and contributor activity from GitHub...';
    return;
  }

  captionEl.textContent =
    'GitHub activity unavailable right now. Showing repository metadata only.';
}

function createSortComparator(sortBy, githubProjects) {
  return (a, b) => {
    if (sortBy === 'date') {
      return (
        new Date(b.updated_at || 0) - new Date(a.updated_at || 0) ||
        a.originalIndex - b.originalIndex
      );
    }

    if (sortBy === 'name') {
      const nameSort = String(a.name || '').localeCompare(String(b.name || ''));
      return nameSort || a.originalIndex - b.originalIndex;
    }

    if (sortBy === 'language') {
      const langA = String(a.language || '');
      const langB = String(b.language || '');
      const languageSort = langA.localeCompare(langB);
      if (languageSort !== 0) return languageSort;
      const nameSort = String(a.name || '').localeCompare(String(b.name || ''));
      return nameSort || a.originalIndex - b.originalIndex;
    }

    const scoreA = githubProjects.getPopularityScore(a);
    const scoreB = githubProjects.getPopularityScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;

    return (
      new Date(b.updated_at || 0) - new Date(a.updated_at || 0) || a.originalIndex - b.originalIndex
    );
  };
}

function createSearchMatcher(query) {
  const normalized = String(query || '')
    .trim()
    .toLowerCase();
  const normalizedQueryToken = normalizeSearchText(normalized);

  if (!normalized) {
    return () => true;
  }

  return repo => {
    const nameRaw = String(repo.name || '');
    const fullNameRaw = String(repo.full_name || '');
    const name = nameRaw.toLowerCase();
    const fullName = fullNameRaw.toLowerCase();
    const language = String(repo.language || '').toLowerCase();
    const description = String(repo.description || '').toLowerCase();
    const topics = Array.isArray(repo.topics)
      ? repo.topics.map(topic => String(topic || '').toLowerCase())
      : [];

    const directMatch =
      name.includes(normalized) ||
      fullName.includes(normalized) ||
      language.includes(normalized) ||
      description.includes(normalized) ||
      topics.some(topic => topic.includes(normalized));

    if (directMatch) return true;
    if (!normalizedQueryToken || normalizedQueryToken.length < 6) return false;

    const repoToken = normalizeSearchText(nameRaw);
    const fullNameToken = normalizeSearchText(fullNameRaw);
    const fullNameParts = fullNameRaw.split('/');
    const repoPartToken = normalizeSearchText(fullNameParts[1] || nameRaw);
    const distance = normalizedQueryToken.length >= 12 ? 3 : 2;

    return (
      withinEditDistance(normalizedQueryToken, repoToken, distance) ||
      withinEditDistance(normalizedQueryToken, repoPartToken, distance) ||
      withinEditDistance(normalizedQueryToken, fullNameToken, distance)
    );
  };
}

function normalizeLens(value) {
  const lens = String(value || DEFAULT_PROJECT_LENS)
    .trim()
    .toLowerCase();
  return ['all', 'attention', 'hot', 'busy', 'fresh', 'released'].includes(lens)
    ? lens
    : DEFAULT_PROJECT_LENS;
}

function getLensLabel(lens) {
  const labels = {
    attention: 'need attention',
    hot: 'hot projects',
    busy: 'busy projects',
    fresh: 'fresh projects',
    released: 'released projects',
  };
  return labels[lens] || '';
}

function createLensMatcher(lens, githubProjects) {
  const normalizedLens = normalizeLens(lens);
  if (normalizedLens === DEFAULT_PROJECT_LENS) return () => true;

  return repo => {
    if (!githubProjects || typeof githubProjects.getReleaseSignal !== 'function') {
      return true;
    }

    const signal = githubProjects.getReleaseSignal(repo, repo.__activity || {});
    return signal.filters.has(normalizedLens);
  };
}

function countLensDistribution(repos, githubProjects) {
  const counts = {
    all: repos.length,
    attention: 0,
    hot: 0,
    busy: 0,
    fresh: 0,
    released: 0,
  };

  repos.forEach(repo => {
    if (!githubProjects || typeof githubProjects.getReleaseSignal !== 'function') return;
    const signal = githubProjects.getReleaseSignal(repo, repo.__activity || {});
    ['attention', 'hot', 'busy', 'fresh', 'released'].forEach(key => {
      if (signal.filters?.has(key)) counts[key] += 1;
    });
  });

  return counts;
}

function updateLensChipCounts(repos, githubProjects) {
  const counts = countLensDistribution(repos, githubProjects);

  LENS_KEYS.forEach(key => {
    const chip = document.querySelector(`[data-project-lens="${key}"]`);
    if (!chip) return;

    const countEl = chip.querySelector('[data-lens-count]');
    const value = counts[key] ?? 0;
    if (countEl) {
      countEl.textContent = String(value);
    }

    const label = LENS_LABELS[key] || key;
    const hint = LENS_HINTS[key] || '';
    chip.title = hint ? `${label}: ${value} repos — ${hint}` : `${label}: ${value} repos`;
    chip.setAttribute('aria-label', `${label}, ${value} repositories`);
  });
}

function updateLensButtons(buttons, activeLens) {
  buttons.forEach(button => {
    const isActive = normalizeLens(button.dataset.projectLens) === activeLens;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

export async function initProjectShowcase({ username = DEFAULT_USERNAME } = {}) {
  if (
    window.__PERF_AUDIT__ === true ||
    new URLSearchParams(window.location.search).has('perf-audit')
  ) {
    return;
  }

  const container = document.getElementById('github-projects-container');
  if (!container) return;

  // Ensure container has correct grid class
  container.classList.add('projects-grid-shell');

  if (container.dataset.projectsShowcaseInit === 'true') return;
  container.dataset.projectsShowcaseInit = 'true';

  try {
    const githubProjects = new GitHubProjects(username);
    const repos = await githubProjects.fetchRepositories();
    const allRepos = repos.map((repo, index) => ({
      ...repo,
      originalCatalogIndex: index,
      __activityLoaded: false,
    }));

    const allReposByFullName = new Map(
      allRepos.map(repo => [
        String(repo.full_name || `${repo.owner?.login || ''}/${repo.name || ''}`),
        repo,
      ])
    );

    const allShowcaseRepos = githubProjects.getShowcaseRepos(allRepos, 60).map((repo, index) => {
      const key = String(repo.full_name || `${repo.owner?.login || ''}/${repo.name || ''}`);
      const baseRepo = allReposByFullName.get(key) || repo;
      baseRepo.__showcase = repo.__showcase || baseRepo.__showcase;
      baseRepo.originalIndex = index;
      return baseRepo;
    });

    if (allShowcaseRepos.length === 0) {
      renderNoResults(container);
      return;
    }

    const searchInput = document.getElementById('project-search-input');
    const sortSelect = document.getElementById('project-sort-select');
    const lensButtons = Array.from(document.querySelectorAll('[data-project-lens]'));
    let activeLens = DEFAULT_PROJECT_LENS;

    const getCurrentQuery = () => String(searchInput?.value || '').trim();
    const getCurrentSort = () =>
      String(sortSelect?.value || 'popularity')
        .trim()
        .toLowerCase();
    const getCurrentLens = () => activeLens;

    const getDisplayRepos = () => {
      const query = getCurrentQuery();
      const matcher = createSearchMatcher(query);
      const lensMatcher = createLensMatcher(getCurrentLens(), githubProjects);
      const filtered = allShowcaseRepos.filter(repo => matcher(repo) && lensMatcher(repo));
      const sorted = [...filtered].toSorted(createSortComparator(getCurrentSort(), githubProjects));
      const maxItems = getTwoRowLimit(container);
      return sorted.slice(0, maxItems);
    };

    let renderToken = 0;

    const renderProjects = async () => {
      const currentToken = ++renderToken;
      const query = getCurrentQuery();
      const lens = getCurrentLens();
      const displayRepos = getDisplayRepos();

      if (displayRepos.length === 0) {
        renderNoResults(container, query, getLensLabel(lens));
        updateActivityStats(allRepos, [], githubProjects);
        return;
      }

      container.innerHTML = displayRepos
        .map((repo, index) => githubProjects.createProjectCard(repo, index))
        .join('');

      applyTiltEffects(container);
      updateActivityStats(allRepos, displayRepos, githubProjects);
      updateLensChipCounts(allShowcaseRepos, githubProjects);

      const reposToHydrate = displayRepos.filter(repo => !repo.__activityLoaded);
      if (reposToHydrate.length === 0) return;

      if (currentToken !== renderToken) {
        return;
      }

      await githubProjects.hydrateReposWithActivity(reposToHydrate);

      if (currentToken === renderToken) {
        const rerenderRepos = getDisplayRepos();
        container.innerHTML = rerenderRepos
          .map((repo, index) => githubProjects.createProjectCard(repo, index))
          .join('');

        applyTiltEffects(container);
        updateActivityStats(allRepos, rerenderRepos, githubProjects);
        updateLensChipCounts(allShowcaseRepos, githubProjects);
      }
    };

    const debouncedRender = debounce(() => {
      renderProjects().catch(error => {
        console.error('Project showcase render failed:', error);
      });
    }, 140);

    if (searchInput) {
      searchInput.addEventListener('input', debouncedRender);
      searchInput.addEventListener('search', debouncedRender);
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        renderProjects().catch(error => {
          console.error('Project showcase sort render failed:', error);
        });
      });
    }

    lensButtons.forEach(button => {
      button.addEventListener('click', () => {
        activeLens = normalizeLens(button.dataset.projectLens);
        updateLensButtons(lensButtons, activeLens);
        renderProjects().catch(error => {
          console.error('Project showcase lens render failed:', error);
        });
      });
    });
    updateLensButtons(lensButtons, activeLens);
    updateLensChipCounts(allShowcaseRepos, githubProjects);

    document.addEventListener('input', event => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.id !== 'project-search-input') return;
      debouncedRender();
    });

    document.addEventListener('change', event => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      if (target.id !== 'project-sort-select') return;
      renderProjects().catch(error => {
        console.error('Project showcase delegated sort render failed:', error);
      });
    });

    window.addEventListener(
      'resize',
      debounce(() => {
        renderProjects().catch(error => {
          console.error('Project showcase resize render failed:', error);
        });
      }, 180)
    );

    await renderProjects();

    const topReposForActivity = allShowcaseRepos
      .toSorted(createSortComparator('popularity', githubProjects))
      .slice(0, 8);

    githubProjects
      .hydrateReposWithActivity(topReposForActivity)
      .then(() => {
        if (renderToken === 0) return;
        updateActivityStats(allRepos, getDisplayRepos(), githubProjects);
        updateLensChipCounts(allShowcaseRepos, githubProjects);
      })
      .catch(() => {
        // Non-blocking enhancement; UI already rendered with fallback stats.
      });
  } catch (error) {
    console.error('Failed to initialize project showcase:', error);
    renderNoResults(container);
  }
}

export default initProjectShowcase;
