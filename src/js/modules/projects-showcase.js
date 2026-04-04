import GitHubProjects from './github-projects.js';
import './project-xr.js';
const DEFAULT_USERNAME = 'mangeshraut712',
  PROJECT_ROWS_LIMIT = 2;
function getProjectGridColumns(t) {
  if (!t || 'undefined' == typeof window || 'function' != typeof window.getComputedStyle) return 3;
  const e = window.getComputedStyle(t).gridTemplateColumns || '';
  if (!e) return 3;
  const n = e.split(' ').filter(Boolean).length;
  return Math.max(1, n || 3);
}
function getTwoRowLimit(t) {
  return 2 * getProjectGridColumns(t);
}
function setTextById(t, e) {
  const n = document.getElementById(t);
  n && (n.textContent = String(e));
}
function formatCompactNumber(t) {
  const e = Number(t);
  return Number.isFinite(e)
    ? e < 1e3
      ? String(e)
      : e < 1e6
        ? `${(e / 1e3).toFixed(1).replace('.0', '')}k`
        : `${(e / 1e6).toFixed(1).replace('.0', '')}m`
    : '--';
}
function normalizeSearchText(t) {
  return String(t || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '');
}
function withinEditDistance(t, e, n = 2) {
  if (!t || !e) return !1;
  if (t === e) return !0;
  if (Math.abs(t.length - e.length) > n) return !1;
  const r = new Array(e.length + 1),
    o = new Array(e.length + 1);
  for (let t = 0; t <= e.length; t += 1) r[t] = t;
  for (let a = 1; a <= t.length; a += 1) {
    o[0] = a;
    let i = o[0];
    for (let n = 1; n <= e.length; n += 1) {
      const s = t[a - 1] === e[n - 1] ? 0 : 1;
      ((o[n] = Math.min(r[n] + 1, o[n - 1] + 1, r[n - 1] + s)), (i = Math.min(i, o[n])));
    }
    if (i > n) return !1;
    for (let t = 0; t <= e.length; t += 1) r[t] = o[t];
  }
  return r[e.length] <= n;
}
function toFiniteMetric(t) {
  if (null == t || '' === t) return null;
  const e = Number(t);
  return Number.isFinite(e) ? e : null;
}
function debounce(t, e = 150) {
  let n = null;
  return (...r) => {
    (n && window.clearTimeout(n), (n = window.setTimeout(() => t(...r), e)));
  };
}
function applyTiltEffects(t) {
  window.PremiumEnhancements &&
    window.PremiumEnhancements.applyTiltToElement &&
    t.querySelectorAll('.apple-3d-project').forEach(t => {
      window.PremiumEnhancements.applyTiltToElement(t);
    });
}
function renderNoResults(t, e = '') {
  const n = e ? ` for "${e}"` : '';
  t.innerHTML = `\n    <div class="col-span-full projects-empty-state">\n      <i class="fas fa-folder-open"></i>\n      <h4>No matching repositories${n}</h4>\n      <p>Try another project name, language, or tag.</p>\n    </div>\n  `;
}
function updateActivityStats(t, e = []) {
  const n = Array.isArray(t) ? t : [],
    r = n.reduce(
      (t, e) => {
        ((t.totalStars += Number(e.stargazers_count || 0)),
          (t.totalForks += Number(e.forks_count || 0)),
          e.language && t.languages.add(e.language));
        const n = e.__activity,
          r = toFiniteMetric(n?.commits30d),
          o = toFiniteMetric(n?.contributors);
        n &&
          !0 !== n.unavailable &&
          (null !== r || null !== o) &&
          ((t.activityRepos += 1), (t.totalCommits30d += r ?? 0), (t.totalContributors += o ?? 0));
        const a = new Date(e.updated_at || 0).getTime();
        return (Number.isFinite(a) && a > t.latestUpdate && (t.latestUpdate = a), t);
      },
      {
        totalStars: 0,
        totalForks: 0,
        totalCommits30d: 0,
        totalContributors: 0,
        activityRepos: 0,
        languages: new Set(),
        latestUpdate: 0,
      }
    );
  (setTextById('stat-repos', n.length),
    setTextById('stat-stars', formatCompactNumber(r.totalStars)),
    setTextById('stat-forks', formatCompactNumber(r.totalForks)),
    setTextById('stat-commits', r.activityRepos ? formatCompactNumber(r.totalCommits30d) : '--'),
    setTextById(
      'stat-contributors',
      r.activityRepos ? formatCompactNumber(r.totalContributors) : '--'
    ),
    setTextById('stat-languages', r.languages.size));
  const o = document.getElementById('projects-activity-caption');
  o &&
    (r.activityRepos > 0
      ? (o.textContent = `${r.activityRepos} repositories with live commit history and contributor activity in the last sync.`)
      : Array.isArray(e) && e.length > 0
        ? (o.textContent = 'Loading live commit and contributor activity from GitHub...')
        : (o.textContent =
            'GitHub activity unavailable right now. Showing repository metadata only.'));
}
function createSortComparator(t, e) {
  return (n, r) => {
    if ('date' === t)
      return (
        new Date(r.updated_at || 0) - new Date(n.updated_at || 0) ||
        n.originalIndex - r.originalIndex
      );
    if ('name' === t) {
      return (
        String(n.name || '').localeCompare(String(r.name || '')) ||
        n.originalIndex - r.originalIndex
      );
    }
    if ('language' === t) {
      const t = String(n.language || ''),
        e = String(r.language || ''),
        o = t.localeCompare(e);
      if (0 !== o) return o;
      return (
        String(n.name || '').localeCompare(String(r.name || '')) ||
        n.originalIndex - r.originalIndex
      );
    }
    const o = e.getPopularityScore(n),
      a = e.getPopularityScore(r);
    return a !== o
      ? a - o
      : new Date(r.updated_at || 0) - new Date(n.updated_at || 0) ||
          n.originalIndex - r.originalIndex;
  };
}
function createSearchMatcher(t) {
  const e = String(t || '')
      .trim()
      .toLowerCase(),
    n = normalizeSearchText(e);
  return e
    ? t => {
        const r = String(t.name || ''),
          o = String(t.full_name || ''),
          a = r.toLowerCase(),
          i = o.toLowerCase(),
          s = String(t.language || '').toLowerCase(),
          c = String(t.description || '').toLowerCase(),
          l = Array.isArray(t.topics) ? t.topics.map(t => String(t || '').toLowerCase()) : [];
        if (
          a.includes(e) ||
          i.includes(e) ||
          s.includes(e) ||
          c.includes(e) ||
          l.some(t => t.includes(e))
        )
          return !0;
        if (!n || n.length < 6) return !1;
        const u = normalizeSearchText(r),
          d = normalizeSearchText(o),
          m = normalizeSearchText(o.split('/')[1] || r),
          p = n.length >= 12 ? 3 : 2;
        return (
          withinEditDistance(n, u, p) || withinEditDistance(n, m, p) || withinEditDistance(n, d, p)
        );
      }
    : () => !0;
}
export async function initProjectShowcase({ username: t = 'mangeshraut712' } = {}) {
  const e = document.getElementById('github-projects-container');
  if (e && (e.classList.add('projects-grid-shell'), 'true' !== e.dataset.projectsShowcaseInit)) {
    e.dataset.projectsShowcaseInit = 'true';
    try {
      const n = new GitHubProjects(t),
        r = (await n.fetchRepositories()).map((t, e) => ({
          ...t,
          originalCatalogIndex: e,
          __activityLoaded: !1,
        })),
        o = new Map(
          r.map(t => [String(t.full_name || `${t.owner?.login || ''}/${t.name || ''}`), t])
        ),
        a = n.getShowcaseRepos(r, 60).map((t, e) => {
          const n = String(t.full_name || `${t.owner?.login || ''}/${t.name || ''}`),
            r = o.get(n) || t;
          return ((r.__showcase = t.__showcase || r.__showcase), (r.originalIndex = e), r);
        });
      if (0 === a.length) return void renderNoResults(e);
      const i = document.getElementById('project-search-input'),
        s = document.getElementById('project-sort-select'),
        c = () => String(i?.value || '').trim(),
        l = () =>
          String(s?.value || 'popularity')
            .trim()
            .toLowerCase(),
        u = () => {
          const t = createSearchMatcher(c()),
            r = [...a.filter(t)].sort(createSortComparator(l(), n)),
            o = getTwoRowLimit(e);
          return r.slice(0, o);
        };
      let d = 0;
      const m = async () => {
          const t = ++d,
            o = c(),
            a = u();
          if (0 === a.length) return (renderNoResults(e, o), void updateActivityStats(r, []));
          ((e.innerHTML = a.map((t, e) => n.createProjectCard(t, e)).join('')),
            applyTiltEffects(e),
            updateActivityStats(r, a));
          const i = a.filter(t => !t.__activityLoaded);
          if (0 === i.length) return;
          if ((await n.hydrateReposWithActivity(i), t !== d)) return;
          const s = u();
          ((e.innerHTML = s.map((t, e) => n.createProjectCard(t, e)).join('')),
            applyTiltEffects(e),
            updateActivityStats(r, s));
        },
        p = debounce(() => {
          m().catch(t => {
            console.error('Project showcase render failed:', t);
          });
        }, 140);
      (i && (i.addEventListener('input', p), i.addEventListener('search', p)),
        s &&
          s.addEventListener('change', () => {
            m().catch(t => {
              console.error('Project showcase sort render failed:', t);
            });
          }),
        document.addEventListener('input', t => {
          const e = t.target;
          e instanceof HTMLInputElement && 'project-search-input' === e.id && p();
        }),
        document.addEventListener('change', t => {
          const e = t.target;
          e instanceof HTMLSelectElement &&
            'project-sort-select' === e.id &&
            m().catch(t => {
              console.error('Project showcase delegated sort render failed:', t);
            });
        }),
        window.addEventListener(
          'resize',
          debounce(() => {
            m().catch(t => {
              console.error('Project showcase resize render failed:', t);
            });
          }, 180)
        ),
        await m());
      const g = [...a].sort(createSortComparator('popularity', n)).slice(0, 8);
      n.hydrateReposWithActivity(g)
        .then(() => {
          0 !== d && updateActivityStats(r, u());
        })
        .catch(() => {});
    } catch (t) {
      (console.error('Failed to initialize project showcase:', t), renderNoResults(e));
    }
  }
}
export default initProjectShowcase;
