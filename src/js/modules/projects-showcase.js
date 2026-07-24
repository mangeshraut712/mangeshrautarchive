import GitHubProjects from './github-projects.js';
import { observeScrollAnimations } from './scroll-animations.js';
import './project-xr.js';
import './github-contributions-graph.js';

const DEFAULT_USERNAME = 'mangeshraut712';
const PROJECT_ROWS_LIMIT = 2;
const DEFAULT_PROJECT_LENS = 'all';
const LENS_KEYS = ['all', 'stars', 'forks', 'active'];
const LENS_LABELS = {
  all: 'All',
  stars: 'Stars',
  forks: 'Forks',
  active: 'Active',
};
const LENS_HINTS = {
  all: 'Every showcase repository',
  stars: 'Repositories with GitHub stars',
  forks: 'Repositories that have been forked',
  active: 'Pushed or updated within the last 14 days',
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
  const columns = getProjectGridColumns(container);
  // Phones (1-col): show 4 cards so the section feels full; tablet 2-col keeps 2 rows.
  const rows = columns <= 1 ? 4 : PROJECT_ROWS_LIMIT;
  return columns * rows;
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

function runWhenIdle(callback, timeout = 700) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback(), { timeout });
    return;
  }

  window.setTimeout(callback, timeout);
}

function waitForIdle(timeout = 350) {
  return new Promise(resolve => {
    runWhenIdle(resolve, timeout);
  });
}

function applyTiltEffects(container) {
  if (!window.PremiumEnhancements || !window.PremiumEnhancements.applyTiltToElement) {
    return;
  }

  container.querySelectorAll('.apple-3d-project').forEach(card => {
    window.PremiumEnhancements.applyTiltToElement(card);
  });
}

function bindProjectCardPressFeedback(container) {
  if (!container) {
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  container.querySelectorAll('.showcase-project-card').forEach(card => {
    if (card.dataset.pressBound === 'true') {
      return;
    }

    card.dataset.pressBound = 'true';
    const pressOn = () => {
      if (!reducedMotion) {
        card.classList.add('is-pressed');
      }
    };
    const pressOff = () => card.classList.remove('is-pressed');

    card.addEventListener('pointerdown', pressOn);
    card.addEventListener('pointerup', pressOff);
    card.addEventListener('pointerleave', pressOff);
    card.addEventListener('pointercancel', pressOff);
  });
}

function revealRenderedProjectCards(container) {
  if (!container) return;

  observeScrollAnimations(['.showcase-project-card']);
  bindProjectCardPressFeedback(container);

  const cards = container.querySelectorAll('.showcase-project-card');
  if (!cards.length) return;

  const projectsSection = document.getElementById('projects');
  const inView = projectsSection
    ? (() => {
        const rect = projectsSection.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      })()
    : true;

  if (!inView) return;

  cards.forEach(card => {
    card.classList.add('animate-in');
    card.classList.remove('animate-on-scroll');
    card.style.opacity = '1';
    card.style.transform = 'none';
  });
}

function formatActivityCaption(totals) {
  const repoCount = Number(totals.publicRepos || 0);
  if (repoCount > 0) {
    return `Live public catalog from github.com/mangeshraut712 — ${repoCount} repositories with release and activity signals.`;
  }

  if (totals.activityRepos > 0) {
    return `${totals.activityRepos} repositories with live commit activity in the last sync.`;
  }

  return 'Syncing repository stars, forks, commits, and contributor activity...';
}

function setStatItem(id, value, { hideWhenEmpty = true } = {}) {
  const item = document.getElementById(id)?.closest('.activity-stat-item');
  const displayValue =
    value === null || value === undefined || value === '' || value === '--' ? '--' : value;

  setTextById(id, displayValue);

  if (!item) return;

  const numeric = Number(String(displayValue).replace(/[^\d.]/g, ''));
  const shouldHide = hideWhenEmpty && (displayValue === '--' || numeric === 0);
  item.hidden = shouldHide;
  item.classList.toggle('activity-stat-empty', shouldHide);
}

function renderNoResults(container, query = '', lensLabel = '') {
  const parts = [];
  if (query) parts.push(`“${query}”`);
  if (lensLabel && lensLabel.toLowerCase() !== 'all') parts.push(lensLabel);
  const suffix = parts.length ? ` for ${parts.join(' · ')}` : '';
  const canClear = Boolean(query) || (lensLabel && lensLabel.toLowerCase() !== 'all');
  container.innerHTML = `
    <div class="projects-empty-state" role="status">
      <i class="fas fa-folder-open" aria-hidden="true"></i>
      <h4>No matching repositories${suffix}</h4>
      <p>Try another name, language, or tag — or clear filters to see everything.</p>
      ${
        canClear
          ? `<button type="button" class="projects-clear-filters-btn" data-projects-clear-filters>
               Clear filters
             </button>`
          : ''
      }
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
      const contributorLogins = Array.isArray(activity?.contributorLogins)
        ? activity.contributorLogins
        : [];
      const contributors = toFiniteMetric(activity?.contributors);
      const hasLiveActivity =
        activity && activity.unavailable !== true && (commits30d !== null || contributors !== null);

      if (hasLiveActivity) {
        acc.activityRepos += 1;
        acc.totalCommits30d += commits30d ?? 0;
      }

      contributorLogins.forEach(login => {
        const key = String(login || '')
          .trim()
          .toLowerCase();
        if (key) acc.contributorIds.add(key);
      });

      const releaseSignal =
        githubProjects && typeof githubProjects.getReleaseSignal === 'function'
          ? githubProjects.getReleaseSignal(repo, activity || {})
          : null;
      if (releaseSignal?.releaseChecked) {
        acc.releaseCheckedRepos += 1;
      }

      const pushedAgeDays = githubProjects?.getRepoAgeDays?.(repo?.pushed_at || repo?.updated_at);
      if (Number.isFinite(pushedAgeDays) && pushedAgeDays <= 14) {
        acc.activeRepos += 1;
      }

      const updatedTime = new Date(repo.updated_at || 0).getTime();
      if (Number.isFinite(updatedTime) && updatedTime > acc.latestUpdate) {
        acc.latestUpdate = updatedTime;
      }

      return acc;
    },
    {
      publicRepos: source.length,
      totalStars: 0,
      totalForks: 0,
      totalCommits30d: 0,
      contributorIds: new Set(),
      activityRepos: 0,
      releaseCheckedRepos: 0,
      activeRepos: 0,
      languages: new Set(),
      latestUpdate: 0,
    }
  );

  const uniqueContributors = totals.contributorIds.size;

  setStatItem('stat-repos', source.length, { hideWhenEmpty: false });
  setStatItem('stat-stars', formatCompactNumber(totals.totalStars), { hideWhenEmpty: false });
  setStatItem('stat-forks', formatCompactNumber(totals.totalForks), { hideWhenEmpty: false });
  setStatItem(
    'stat-commits',
    totals.activityRepos ? formatCompactNumber(totals.totalCommits30d) : '--'
  );
  setStatItem(
    'stat-contributors',
    uniqueContributors > 0 ? formatCompactNumber(uniqueContributors) : '--'
  );
  setStatItem(
    'stat-active-repos',
    totals.activeRepos > 0 ? formatCompactNumber(totals.activeRepos) : '--'
  );
  setStatItem('stat-languages', totals.languages.size, { hideWhenEmpty: false });

  const captionEl = document.getElementById('projects-activity-caption');
  if (!captionEl) return;

  if (source.length > 0) {
    captionEl.textContent = formatActivityCaption(totals);
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
      const pushedDiff =
        new Date(b.pushed_at || b.updated_at || 0) - new Date(a.pushed_at || a.updated_at || 0);
      if (pushedDiff !== 0) return pushedDiff;
      return a.originalIndex - b.originalIndex;
    }

    if (sortBy === 'stars') {
      const starDiff = Number(b.stargazers_count || 0) - Number(a.stargazers_count || 0);
      if (starDiff !== 0) return starDiff;
      const forkDiff = Number(b.forks_count || 0) - Number(a.forks_count || 0);
      if (forkDiff !== 0) return forkDiff;
      return a.originalIndex - b.originalIndex;
    }

    if (sortBy === 'name') {
      const nameSort = String(a.name || '').localeCompare(String(b.name || ''), undefined, {
        sensitivity: 'base',
      });
      return nameSort || a.originalIndex - b.originalIndex;
    }

    if (sortBy === 'language') {
      const langA = String(a.language || 'zz');
      const langB = String(b.language || 'zz');
      const languageSort = langA.localeCompare(langB, undefined, { sensitivity: 'base' });
      if (languageSort !== 0) return languageSort;
      const nameSort = String(a.name || '').localeCompare(String(b.name || ''), undefined, {
        sensitivity: 'base',
      });
      return nameSort || a.originalIndex - b.originalIndex;
    }

    const scoreA = githubProjects.getPopularityScore(a);
    const scoreB = githubProjects.getPopularityScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const starDiff = Number(b.stargazers_count || 0) - Number(a.stargazers_count || 0);
    if (starDiff !== 0) return starDiff;

    return (
      new Date(b.pushed_at || b.updated_at || 0) - new Date(a.pushed_at || a.updated_at || 0) ||
      a.originalIndex - b.originalIndex
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
  return LENS_KEYS.includes(lens) ? lens : DEFAULT_PROJECT_LENS;
}

function getLensLabel(lens) {
  const labels = {
    stars: 'starred projects',
    forks: 'forked projects',
    active: 'active projects',
  };
  return labels[lens] || '';
}

function isActiveRepo(repo, githubProjects) {
  const age = githubProjects?.getRepoAgeDays?.(repo?.pushed_at || repo?.updated_at);
  return Number.isFinite(age) && age <= 14;
}

function createLensMatcher(lens, githubProjects) {
  const normalizedLens = normalizeLens(lens);
  if (normalizedLens === DEFAULT_PROJECT_LENS) return () => true;

  return repo => {
    if (normalizedLens === 'stars') {
      return Number(repo?.stargazers_count || 0) > 0;
    }
    if (normalizedLens === 'forks') {
      return Number(repo?.forks_count || 0) > 0;
    }
    if (normalizedLens === 'active') {
      return isActiveRepo(repo, githubProjects);
    }
    return true;
  };
}

function countLensDistribution(repos, githubProjects) {
  const counts = {
    all: repos.length,
    stars: 0,
    forks: 0,
    active: 0,
  };

  repos.forEach(repo => {
    if (Number(repo?.stargazers_count || 0) > 0) counts.stars += 1;
    if (Number(repo?.forks_count || 0) > 0) counts.forks += 1;
    if (isActiveRepo(repo, githubProjects)) counts.active += 1;
  });

  return counts;
}

function updateLensChipCounts(repos, githubProjects, activeLens = DEFAULT_PROJECT_LENS) {
  const counts = countLensDistribution(repos, githubProjects);
  let nextActiveLens = activeLens;

  LENS_KEYS.forEach(key => {
    const chip = document.querySelector(`[data-project-lens="${key}"]`);
    if (!chip) return;

    const countEl = chip.querySelector('[data-lens-count]');
    const value = counts[key] ?? 0;
    if (countEl) {
      countEl.textContent = String(value);
    }

    const shouldDisable = key !== 'all' && value === 0;
    chip.hidden = false;
    chip.disabled = shouldDisable;
    chip.classList.toggle('is-empty', shouldDisable);

    if (shouldDisable && nextActiveLens === key) {
      nextActiveLens = DEFAULT_PROJECT_LENS;
    }

    const label = LENS_LABELS[key] || key;
    const hint = LENS_HINTS[key] || '';
    chip.title = hint ? `${label}: ${value} repos — ${hint}` : `${label}: ${value} repos`;
    chip.setAttribute('aria-label', `${label}, ${value} repositories`);
  });

  return nextActiveLens;
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
    let allRepos = [];
    let allShowcaseRepos = [];

    const repoKey = repo =>
      String(repo.full_name || `${repo.owner?.login || ''}/${repo.name || ''}`);

    const setRepoCatalog = repos => {
      allRepos = repos.map((repo, index) => ({
        ...githubProjects.normalizeRepoShape(repo),
        originalCatalogIndex: index,
        __activityLoaded: false,
      }));

      const allReposByFullName = new Map(allRepos.map(repo => [repoKey(repo), repo]));
      allShowcaseRepos = githubProjects.getShowcaseRepos(allRepos, 100).map((repo, index) => {
        const baseRepo = allReposByFullName.get(repoKey(repo)) || repo;
        baseRepo.__showcase = repo.__showcase || baseRepo.__showcase;
        baseRepo.originalIndex = index;
        return baseRepo;
      });
    };

    setRepoCatalog(githubProjects.fallbackRepos);

    if (allShowcaseRepos.length === 0) {
      renderNoResults(container);
      return;
    }

    const searchInput = document.getElementById('project-search-input');
    const sortSelect = document.getElementById('project-sort-select');
    const lensButtons = Array.from(document.querySelectorAll('[data-project-lens]'));
    const expandWrap = document.getElementById('projects-expand-wrap');
    const expandBtn = document.getElementById('projects-expand-btn');
    let activeLens = DEFAULT_PROJECT_LENS;
    let showAllProjects = true;
    let didInitialRealign = false;

    const getCurrentQuery = () => String(searchInput?.value || '').trim();
    const getCurrentSort = () =>
      String(sortSelect?.value || 'popularity')
        .trim()
        .toLowerCase();
    const getCurrentLens = () => activeLens;

    const announceResults = (count, query, lens) => {
      const live = document.getElementById('projects-results-status');
      if (!live) return;
      const lensLabel = getLensLabel(lens);
      if (count === 0) {
        const bits = [];
        if (query) bits.push(`“${query}”`);
        if (lens !== DEFAULT_PROJECT_LENS) bits.push(lensLabel || LENS_LABELS[lens]);
        live.textContent = bits.length
          ? `No projects match ${bits.join(' · ')}.`
          : 'No projects to show.';
        return;
      }
      const filterHint = query ? ` matching “${query}”` : '';
      if (lens !== DEFAULT_PROJECT_LENS && lensLabel) {
        live.textContent = `${count} ${lensLabel}${filterHint}.`;
        return;
      }
      live.textContent = `${count} project${count === 1 ? '' : 's'}${filterHint}.`;
    };

    const clearFilters = () => {
      if (searchInput) searchInput.value = '';
      activeLens = DEFAULT_PROJECT_LENS;
      updateLensButtons(lensButtons, activeLens);
      renderProjects().catch(error => {
        console.error('Project showcase clear-filters render failed:', error);
      });
    };

    const getFilteredSortedRepos = () => {
      const query = getCurrentQuery();
      const matcher = createSearchMatcher(query);
      const lensMatcher = createLensMatcher(getCurrentLens(), githubProjects);
      const filtered = allShowcaseRepos.filter(repo => matcher(repo) && lensMatcher(repo));
      return [...filtered].toSorted(createSortComparator(getCurrentSort(), githubProjects));
    };

    const getDisplayRepos = () => {
      const sorted = getFilteredSortedRepos();
      if (showAllProjects) return sorted;
      return sorted.slice(0, getTwoRowLimit(container));
    };

    const syncExpandControl = totalFiltered => {
      if (!expandWrap || !expandBtn) return;

      const previewLimit = getTwoRowLimit(container);
      const needsExpand = totalFiltered > previewLimit;

      if (!needsExpand) {
        showAllProjects = false;
        expandWrap.hidden = true;
        expandBtn.setAttribute('aria-expanded', 'false');
        return;
      }

      expandWrap.hidden = false;
      expandBtn.setAttribute('aria-expanded', showAllProjects ? 'true' : 'false');
      expandBtn.textContent = showAllProjects
        ? 'Show fewer projects'
        : `Show all ${totalFiltered} projects`;
    };

    const hydrationQueue = new Set();
    let hydrationRunning = false;
    let hydrationRenderTimer = 0;

    const scheduleHydrationRender = () => {
      if (hydrationRenderTimer) {
        window.clearTimeout(hydrationRenderTimer);
      }

      hydrationRenderTimer = window.setTimeout(() => {
        hydrationRenderTimer = 0;
        renderProjects({ queueHydration: false }).catch(error => {
          console.error('Project showcase activity render failed:', error);
        });
      }, 220);
    };

    const runActivityHydration = async () => {
      if (hydrationRunning) return;
      hydrationRunning = true;

      try {
        while (hydrationQueue.size > 0) {
          const iterator = hydrationQueue.values().next();
          const repo = iterator.value;
          hydrationQueue.delete(repo);
          if (!repo || repo.__activityLoaded) continue;

          repo.__activityQueued = false;
          repo.__activityLoading = true;
          try {
            await waitForIdle();
            await githubProjects.hydrateReposWithActivity([repo]);
          } catch (error) {
            repo.__activityLoaded = true;
            console.warn(`Project activity unavailable for ${repo.full_name || repo.name}:`, error);
          } finally {
            repo.__activityLoading = false;
          }

          const visibleKeys = new Set(
            getDisplayRepos().map(displayRepo =>
              String(
                displayRepo.full_name ||
                  `${displayRepo.owner?.login || ''}/${displayRepo.name || ''}`
              )
            )
          );
          const repoKey = String(repo.full_name || `${repo.owner?.login || ''}/${repo.name || ''}`);
          if (visibleKeys.has(repoKey)) {
            scheduleHydrationRender();
          } else {
            updateActivityStats(allRepos, getDisplayRepos(), githubProjects);
          }
        }
      } finally {
        hydrationRunning = false;
      }
    };

    const queueActivityHydration = reposToHydrate => {
      let queued = false;
      reposToHydrate.forEach(repo => {
        if (!repo || repo.__activityLoaded || repo.__activityLoading || repo.__activityQueued) {
          return;
        }

        repo.__activityQueued = true;
        hydrationQueue.add(repo);
        queued = true;
      });

      if (queued) {
        runWhenIdle(runActivityHydration, 600);
      }
    };

    const queueTopActivityHydration = () => {
      // Hydrate the full public catalog so Operating View commits/contributors stay accurate.
      queueActivityHydration(allShowcaseRepos);
    };

    const realignProjectsSection = () => {
      if (window.location.hash !== '#projects') return;

      const section = document.getElementById('projects');
      if (!section) return;

      const nav = document.getElementById('global-nav') || document.querySelector('.global-nav');
      const expectedTop = (nav?.offsetHeight || 60) + 12;
      const delta = section.getBoundingClientRect().top - expectedTop;
      if (Math.abs(delta) <= 18) return;

      const root = document.documentElement;
      const body = document.body;
      const previousRootBehavior = root.style.scrollBehavior;
      const previousBodyBehavior = body?.style.scrollBehavior || '';

      root.classList.add('native-scroll-jump');
      root.style.scrollBehavior = 'auto';
      if (body) body.style.scrollBehavior = 'auto';
      window.scrollTo(0, Math.max(0, window.scrollY + delta));

      window.setTimeout(() => {
        root.classList.remove('native-scroll-jump');
        root.style.scrollBehavior = previousRootBehavior;
        if (body) body.style.scrollBehavior = previousBodyBehavior;
      }, 160);
    };

    const scheduleProjectsRealignment = () => {
      if (didInitialRealign || window.location.hash !== '#projects') return;
      didInitialRealign = true;
      requestAnimationFrame(() => realignProjectsSection());
      window.setTimeout(() => realignProjectsSection(), 280);
    };

    const renderProjects = async ({ queueHydration = true } = {}) => {
      const query = getCurrentQuery();
      let lens = getCurrentLens();
      let filteredSorted = getFilteredSortedRepos();
      let displayRepos = showAllProjects
        ? filteredSorted
        : filteredSorted.slice(0, getTwoRowLimit(container));

      syncExpandControl(filteredSorted.length);

      if (displayRepos.length === 0) {
        const previousLens = lens;
        activeLens = updateLensChipCounts(allShowcaseRepos, githubProjects, activeLens);
        updateLensButtons(lensButtons, activeLens);
        lens = activeLens;

        // Empty lens (e.g. Active=0 after live fetch) → fall back to All and re-render once.
        if (previousLens !== lens) {
          filteredSorted = getFilteredSortedRepos();
          displayRepos = showAllProjects
            ? filteredSorted
            : filteredSorted.slice(0, getTwoRowLimit(container));
          syncExpandControl(filteredSorted.length);
        }

        if (displayRepos.length === 0) {
          renderNoResults(container, query, getLensLabel(lens));
          updateActivityStats(allRepos, [], githubProjects);
          announceResults(0, query, lens);
          return;
        }
      }

      container.innerHTML = displayRepos
        .map((repo, index) => githubProjects.createProjectCard(repo, index))
        .join('');

      applyTiltEffects(container);
      revealRenderedProjectCards(container);
      updateActivityStats(allRepos, displayRepos, githubProjects);
      activeLens = updateLensChipCounts(allShowcaseRepos, githubProjects, activeLens);
      updateLensButtons(lensButtons, activeLens);
      announceResults(filteredSorted.length, query, activeLens);

      if (queueHydration) {
        queueActivityHydration(displayRepos);
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
      searchInput.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !searchInput.value) return;
        event.preventDefault();
        searchInput.value = '';
        renderProjects().catch(error => {
          console.error('Project showcase Escape-clear render failed:', error);
        });
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        renderProjects().catch(error => {
          console.error('Project showcase sort render failed:', error);
        });
      });
    }

    container.addEventListener('click', event => {
      if (!event.target.closest('[data-projects-clear-filters]')) return;
      clearFilters();
    });

    lensButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled || button.hidden) return;
        activeLens = normalizeLens(button.dataset.projectLens);
        updateLensButtons(lensButtons, activeLens);
        renderProjects().catch(error => {
          console.error('Project showcase lens render failed:', error);
        });
      });
    });

    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        showAllProjects = !showAllProjects;
        renderProjects().catch(error => {
          console.error('Project showcase expand render failed:', error);
        });
      });
    }

    activeLens = updateLensChipCounts(allShowcaseRepos, githubProjects, activeLens);
    updateLensButtons(lensButtons, activeLens);

    window.addEventListener(
      'resize',
      debounce(() => {
        renderProjects().catch(error => {
          console.error('Project showcase resize render failed:', error);
        });
      }, 180)
    );

    await renderProjects();
    scheduleProjectsRealignment();
    queueTopActivityHydration();

    githubProjects
      .fetchRepositories()
      .then(repos => {
        if (!Array.isArray(repos) || repos.length === 0) return;
        hydrationQueue.clear();
        setRepoCatalog(repos);
        return renderProjects();
      })
      .then(() => {
        queueTopActivityHydration();
      })
      .catch(error => {
        console.warn('Live GitHub catalog refresh failed; using bundled project catalog.', error);
      });
  } catch (error) {
    console.error('Failed to initialize project showcase:', error);
    renderNoResults(container);
  }
}

export default initProjectShowcase;
