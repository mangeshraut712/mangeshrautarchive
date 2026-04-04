const GITHUB_USERNAME = 'mangeshraut712';
const REFRESH_INTERVAL_MS = 2 * 60 * 1000;
const STALE_AFTER_MS = 45 * 1000;

let refreshTimerId = null;
let lastRefreshAt = 0;
let inFlightRequest = null;

function formatCompactNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '--';
  if (number < 1000) return String(number);
  if (number < 1000000) return `${(number / 1000).toFixed(1).replace('.0', '')}k`;
  return `${(number / 1000000).toFixed(1).replace('.0', '')}m`;
}

function formatRelativeTime(value) {
  if (!value) return 'just now';

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'just now';

  const diff = Math.max(0, Date.now() - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(timestamp)
  );
}

function formatTopicLabel(topic) {
  return String(topic || 'shipping')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function setStatValue(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = String(value);
  }
}

function updateOverviewStats(summary) {
  setStatValue('stat-repos', formatCompactNumber(summary.total_public_repos));
  setStatValue('stat-stars', formatCompactNumber(summary.total_stars));
  setStatValue('stat-forks', formatCompactNumber(summary.total_forks));
  setStatValue('stat-languages', formatCompactNumber(summary.language_count));
}

function renderHighlights(summary) {
  const focusRepo = summary.current_focus_repo || summary.recent_projects?.[0]?.name || 'Portfolio';
  const topTopic = summary.top_topics?.[0]?.topic || 'shipping';
  const recentStats = summary.recent_activity_stats || {};

  return [
    {
      label: 'Followers',
      value: formatCompactNumber(summary.followers),
      detail: 'Public profile reach',
    },
    {
      label: 'Recent Pushes',
      value: formatCompactNumber(recentStats.pushes || 0),
      detail: 'Latest public GitHub events',
    },
    {
      label: 'Repos Touched',
      value: formatCompactNumber(recentStats.repos_touched || 0),
      detail: 'Active repositories in view',
    },
    {
      label: 'Focus Repo',
      value: focusRepo,
      detail: `Current momentum around ${formatTopicLabel(topTopic)}`,
    },
  ]
    .map(
      item => `
        <article class="activity-highlight-card">
          <span class="activity-highlight-label">${item.label}</span>
          <strong class="activity-highlight-value">${item.value}</strong>
          <span class="activity-highlight-detail">${item.detail}</span>
        </article>
      `
    )
    .join('');
}

function renderEventFeed(summary) {
  const events = Array.isArray(summary.recent_events) ? summary.recent_events.slice(0, 4) : [];
  const feedMeta = [
    `Updated ${formatRelativeTime(summary.latest_activity_at || summary.latest_profile_update)}`,
    summary.latest_push_branch ? `branch ${summary.latest_push_branch}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  if (events.length === 0) {
    return `
      <div class="activity-feed-empty">
        <span class="activity-feed-eyebrow">Live Activity</span>
        <p>No recent GitHub events available right now.</p>
      </div>
    `;
  }

  return `
    <div class="activity-feed-head">
      <span class="activity-feed-eyebrow">Live Activity</span>
      <span class="activity-feed-meta">${feedMeta}</span>
    </div>
    <div class="activity-feed-list">
      ${events
        .map(event => {
          const eventMeta = [event.repo, event.branch ? `branch ${event.branch}` : null]
            .filter(Boolean)
            .join(' • ');
          const href = event.url || `https://github.com/${GITHUB_USERNAME}`;

          return `
            <a class="activity-feed-item" href="${href}" target="_blank" rel="noopener noreferrer">
              <span class="activity-feed-icon" aria-hidden="true">
                <i class="fa-solid fa-${event.icon || 'activity'}"></i>
              </span>
              <div class="activity-feed-copy">
                <p class="activity-feed-action">${event.action}</p>
                <p class="activity-feed-repo">${eventMeta}</p>
              </div>
              <span class="activity-feed-time">${formatRelativeTime(event.created_at)}</span>
            </a>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderError(feedMount, highlightsMount) {
  if (highlightsMount) {
    highlightsMount.innerHTML = '';
  }

  if (feedMount) {
    feedMount.innerHTML = `
      <div class="activity-feed-empty">
        <span class="activity-feed-eyebrow">Live Activity</span>
        <p>GitHub activity is temporarily unavailable.</p>
      </div>
    `;
  }
}

function isAbortLikeError(error) {
  return error?.name === 'AbortError' || String(error?.message || '').includes('aborted');
}

async function fetchGithubActivity() {
  const response = await fetch(`/api/github/profile?username=${GITHUB_USERNAME}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`GitHub profile request failed with ${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.data) {
    throw new Error('GitHub profile payload missing data');
  }

  return payload.data;
}

async function refreshGithubActivity(force = false) {
  const highlightsMount = document.getElementById('projects-activity-highlights');
  const feedMount = document.getElementById('github-activity-feed');
  if (!highlightsMount || !feedMount) return null;

  if (inFlightRequest) {
    return inFlightRequest;
  }

  if (!force && lastRefreshAt && Date.now() - lastRefreshAt < 15 * 1000) {
    return null;
  }

  inFlightRequest = fetchGithubActivity()
    .then(summary => {
      updateOverviewStats(summary);
      highlightsMount.innerHTML = renderHighlights(summary);
      feedMount.innerHTML = renderEventFeed(summary);
      lastRefreshAt = Date.now();
      return summary;
    })
    .catch(error => {
      if (isAbortLikeError(error)) {
        return null;
      }

      console.warn('GitHub activity overview enhancement failed:', error);
      renderError(feedMount, highlightsMount);
      return null;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}

function bindLifecycleRefresh() {
  if (document.body?.dataset.githubActivityBound === 'true') return;

  if (document.body) {
    document.body.dataset.githubActivityBound = 'true';
  }

  const refreshIfStale = () => {
    if (Date.now() - lastRefreshAt > STALE_AFTER_MS) {
      refreshGithubActivity(true).catch(() => {});
    }
  };

  window.addEventListener('focus', refreshIfStale);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshIfStale();
    }
  });
}

async function initGithubActivity() {
  const highlightsMount = document.getElementById('projects-activity-highlights');
  const feedMount = document.getElementById('github-activity-feed');
  if (!highlightsMount || !feedMount) return;

  await refreshGithubActivity(true);
  bindLifecycleRefresh();

  if (!refreshTimerId) {
    refreshTimerId = window.setInterval(() => {
      refreshGithubActivity(true).catch(() => {});
    }, REFRESH_INTERVAL_MS);
  }
}

export { initGithubActivity };
