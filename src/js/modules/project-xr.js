class ProjectXR {
  constructor(e = document) {
    ((this.documentRef = e),
      (this.arSupported = !1),
      (this.activeSession = null),
      (this.activeFallback = null),
      (this.repoSpatialCache = new Map()),
      (this.previousBodyOverflow = ''),
      (this.apiCooldownUntil = 0),
      (this.apiCooldownMs = 3e5),
      (this.bound = !1));
  }
  async init() {
    ((this.arSupported = await this.detectArSupport()), this.bindEvents());
  }
  async detectArSupport() {
    if (!navigator.xr || 'function' != typeof navigator.xr.isSessionSupported) return !1;
    try {
      return await navigator.xr.isSessionSupported('immersive-ar');
    } catch (e) {
      return (console.warn('WebXR capability check failed:', e), !1);
    }
  }
  bindEvents() {
    this.bound ||
      ((this.bound = !0),
      this.documentRef.addEventListener(
        'click',
        async e => {
          const t = e.target.closest('.btn-ar');
          if (!t) return;
          e.preventDefault();
          const a = this.extractProjectContext(t);
          try {
            await this.openSpatialExperience(a);
          } catch (e) {
            (console.warn('Spatial experience failed, opening fallback preview:', e),
              this.openFallbackModal(a));
          }
        },
        { capture: !0 }
      ));
  }
  extractProjectContext(e) {
    const t = e.closest('.showcase-project-card, .project-card'),
      a = e => t?.querySelector(e)?.textContent?.trim() || '',
      r = e => {
        const t = Number.parseInt(e, 10);
        return Number.isFinite(t) ? t : null;
      },
      n = r(e.dataset.projectStars),
      s = r(e.dataset.projectForks),
      i = r(e.dataset.projectOpenIssues),
      o = r(e.dataset.projectWatchers),
      c = r(e.dataset.projectSizeKb),
      l = r(e.dataset.projectCommits30d),
      d = r(e.dataset.projectContributors),
      p = [];
    (null !== n && p.push({ label: 'Stars', value: String(n), key: 'stars' }),
      null !== s && p.push({ label: 'Forks', value: String(s), key: 'forks' }),
      null !== l && p.push({ label: 'Commits (30d)', value: String(l), key: 'commits' }),
      null !== d && p.push({ label: 'Contributors', value: String(d), key: 'contributors' }),
      null !== i && p.push({ label: 'Open Issues', value: String(i), key: 'issues' }),
      null !== o && p.push({ label: 'Watchers', value: String(o), key: 'watchers' }));
    const u = t?.querySelector('.btn-demo:not(.is-disabled)')?.getAttribute('href') || '',
      h = e.dataset.projectDemoUrl || u || '',
      m = e.dataset.projectUrl || h || '',
      f = e.dataset.projectRepoUrl || m || '',
      b = Array.from(
        new Set(
          ((g = '.project-tag'),
          t
            ? Array.from(t.querySelectorAll(g))
                .map(e => e.textContent?.trim())
                .filter(Boolean)
            : [])
        )
      );
    var g;
    const v = (e => {
      if (!e) return [];
      try {
        const t = JSON.parse(e);
        return Array.isArray(t) ? t.map(e => String(e || '').trim()).filter(Boolean) : [];
      } catch {
        return [];
      }
    })(e.dataset.projectTopics);
    return {
      projectName: e.dataset.projectName || a('.project-title') || 'Portfolio Project',
      fullName: e.dataset.projectFullName || '',
      projectDescription: a('.project-description'),
      language: e.dataset.projectLanguage || a('.project-language'),
      tags: v.length ? v : b,
      stats: p,
      stars: n,
      forks: s,
      openIssues: i,
      watchers: o,
      sizeKb: c,
      commits30d: l,
      contributors: d,
      license: e.dataset.projectLicense || '',
      defaultBranch: e.dataset.projectDefaultBranch || '',
      pushedAt: e.dataset.projectPushedAt || '',
      score: r(e.dataset.projectScore),
      aiInsight: e.dataset.projectAiInsight || '',
      demoUrl: h,
      repoUrl: f,
      projectUrl: m,
      updatedAt: e.dataset.projectUpdatedAt || '',
      createdAt: e.dataset.projectCreatedAt || '',
      primaryUrl: h || m,
    };
  }
  async openSpatialExperience(e) {
    const { projectName: t, primaryUrl: a } = e;
    if (this.arSupported) {
      if (await this.launchWebXrSession(t, a)) return;
    }
    this.openFallbackModal(e);
  }
  async launchWebXrSession(e, t) {
    if (!navigator.xr || this.activeSession) return !1;
    const a = this.createXrOverlay(e, t);
    let r;
    this.documentRef.body.appendChild(a.root);
    try {
      r = await navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ['local-floor', 'dom-overlay'],
        domOverlay: { root: a.root },
      });
    } catch (e) {
      return (
        a.root.remove(),
        console.warn('Unable to start WebXR AR session, using fallback:', e),
        !1
      );
    }
    this.activeSession = r;
    const n = () => {
      ((this.activeSession = null), a.root.remove());
    };
    (r.addEventListener('end', n, { once: !0 }),
      a.close.addEventListener('click', async () => {
        try {
          await r.end();
        } catch (e) {
          (console.warn('Failed to close WebXR session gracefully:', e), n());
        }
      }));
    try {
      const t = this.documentRef.createElement('canvas');
      ((t.className = 'project-xr-canvas'), a.viewport.appendChild(t));
      const n = t.getContext('webgl', { alpha: !0, antialias: !0, xrCompatible: !0 });
      if (!n || 'function' != typeof n.makeXRCompatible)
        throw new Error('WebGL XR context is unavailable.');
      if ('function' != typeof window.XRWebGLLayer) throw new Error('XRWebGLLayer is unavailable.');
      (await n.makeXRCompatible(),
        r.updateRenderState({ baseLayer: new window.XRWebGLLayer(r, n) }));
      const s = await r.requestReferenceSpace('local');
      a.status.textContent = `Immersive AR running for ${e}`;
      const i = (e, t) => {
        this.activeSession &&
          (r.requestAnimationFrame(i),
          t.getViewerPose(s),
          n.bindFramebuffer(n.FRAMEBUFFER, r.renderState.baseLayer.framebuffer),
          n.clearColor(0.03, 0.07, 0.12, 1),
          n.clear(n.COLOR_BUFFER_BIT | n.DEPTH_BUFFER_BIT));
      };
      r.requestAnimationFrame(i);
    } catch (e) {
      console.warn('WebXR render bootstrap failed, using fallback:', e);
      try {
        await r.end();
      } catch {
        n();
      }
      return !1;
    }
    return !0;
  }
  createXrOverlay(e, t) {
    const a = this.documentRef.createElement('div');
    a.className = 'project-xr-overlay';
    const r = this.documentRef.createElement('div');
    r.className = 'project-xr-overlay-panel';
    const n = this.documentRef.createElement('strong');
    n.textContent = `${e} Spatial View`;
    const s = this.documentRef.createElement('span');
    ((s.className = 'project-xr-status'), (s.textContent = 'Starting immersive AR session...'));
    const i = this.documentRef.createElement('div');
    i.className = 'project-xr-overlay-actions';
    const o = this.documentRef.createElement('button');
    if (
      ((o.type = 'button'),
      (o.className = 'project-xr-close-btn'),
      (o.textContent = 'Close AR'),
      i.appendChild(o),
      this.isSafeHttpUrl(t))
    ) {
      const e = this.documentRef.createElement('a');
      ((e.className = 'project-xr-repo-link'),
        (e.href = t),
        (e.target = '_blank'),
        (e.rel = 'noopener noreferrer'),
        (e.textContent = 'Open Demo'),
        i.appendChild(e));
    }
    (r.appendChild(n), r.appendChild(s), r.appendChild(i));
    const c = this.documentRef.createElement('div');
    return (
      (c.className = 'project-xr-viewport'),
      a.appendChild(r),
      a.appendChild(c),
      { root: a, panel: r, status: s, close: o, viewport: c }
    );
  }
  formatDateLabel(e) {
    if (!e) return 'Unknown';
    const t = new Date(e);
    return Number.isNaN(t.getTime())
      ? 'Unknown'
      : new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(t);
  }
  formatRelativeTime(e) {
    if (!e) return 'Unknown';
    const t = new Date(e);
    if (Number.isNaN(t.getTime())) return 'Unknown';
    const a = Math.max(0, Date.now() - t.getTime()),
      r = 36e5,
      n = 864e5,
      s = 7 * n,
      i = 30 * n,
      o = 365 * n;
    return a < r
      ? 'now'
      : a < n
        ? `${Math.floor(a / r)}h ago`
        : a < s
          ? `${Math.floor(a / n)}d ago`
          : a < i
            ? `${Math.floor(a / s)}w ago`
            : a < o
              ? `${Math.floor(a / i)}mo ago`
              : `${Math.floor(a / o)}y ago`;
  }
  parseRepoLink(e) {
    if (!e || !e.includes('/')) return null;
    const [t, a] = e.split('/');
    return t && a ? { owner: t, repo: a } : null;
  }
  async fetchJson(e, t) {
    try {
      const t = new URL(e);
      if ('https://api.github.com' === t.origin) {
        const e = `${t.pathname}${t.search || ''}`,
          a = `/api/github/proxy?path=${encodeURIComponent(e)}`,
          r = await fetch(a, { headers: { Accept: 'application/json' } });
        if (r.ok) return await r.json();
      }
    } catch {}
    if (this.apiCooldownUntil > Date.now()) return null;
    try {
      const a = await fetch(e, { headers: t });
      return (
        (403 !== a.status && 429 !== a.status) ||
          (this.apiCooldownUntil = Date.now() + this.apiCooldownMs),
        a.ok ? await a.json() : null
      );
    } catch {
      return null;
    }
  }
  extractCommitDate(e) {
    return e?.commit?.author?.date || e?.commit?.committer?.date || '';
  }
  buildActivityOverview(e = [], t = []) {
    const a = new Map();
    e.forEach(e => {
      const t = this.extractCommitDate(e);
      if (!t) return;
      const r = new Date(t);
      if (Number.isNaN(r.getTime())) return;
      const n = r.toISOString().slice(0, 10);
      a.set(n, (a.get(n) || 0) + 1);
    });
    const r = [],
      n = new Date();
    n.setUTCHours(0, 0, 0, 0);
    for (let e = 27; e >= 0; e -= 1) {
      const t = new Date(n);
      t.setUTCDate(n.getUTCDate() - e);
      const s = t.toISOString().slice(0, 10),
        i = a.get(s) || 0;
      r.push({
        key: s,
        count: i,
        label: t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    const s = r.slice(-7).reduce((e, t) => e + t.count, 0),
      i = r.reduce((e, t) => e + t.count, 0),
      o = Math.max(...r.map(e => e.count), 0);
    return {
      last7: s,
      last30: i,
      activeDays: r.filter(e => e.count > 0).length,
      maxDaily: o,
      contributorsCount: Array.isArray(t) ? t.length : 0,
      topContributor: t?.[0]?.login || e?.[0]?.author?.login || '--',
      days: r,
    };
  }
  buildFallbackActivity(e) {
    const t = Number(e.commits30d),
      a = Number(e.contributors);
    return {
      last7: null,
      last30: Number.isFinite(t) ? Math.max(0, t) : null,
      activeDays: null,
      maxDaily: null,
      contributorsCount: Number.isFinite(a) ? Math.max(0, a) : null,
      topContributor: '--',
      days: [],
    };
  }
  buildFallbackSpatialDataset(e) {
    const t = this.buildFallbackActivity(e);
    return {
      details: {
        openIssues: e.openIssues ?? null,
        watchers: e.watchers ?? null,
        defaultBranch: e.defaultBranch || '',
        sizeKb: e.sizeKb ?? null,
        license: e.license || '',
        pushedAt: e.pushedAt || '',
        latestCommitDate: e.pushedAt || e.updatedAt || '',
        commits30d: t.last30,
        contributors: t.contributorsCount,
      },
      activity: t,
      graph: {
        repoLabel: e.fullName || e.projectName || 'repository',
        totalFiles: 0,
        totalDirs: 0,
        dirNodes: [],
        fileNodes: [],
      },
      languages: {},
      contributors: [],
    };
  }
  buildGraphModel(e = [], t = '') {
    const a = e.filter(e => 'blob' === e.type && e.path),
      r = e.filter(e => 'tree' === e.type && e.path),
      n = new Map(),
      s = new Set();
    (a.forEach(e => {
      const [t] = e.path.split('/');
      t && (n.set(t, (n.get(t) || 0) + 1), e.path.includes('/') && s.add(t));
    }),
      r.forEach(e => {
        const [t] = e.path.split('/');
        t && s.add(t);
      }));
    const i = Array.from(n.entries())
        .filter(([e]) => s.has(e))
        .sort((e, t) => t[1] - e[1])
        .slice(0, 8)
        .map(([e, t], a) => ({ id: `dir-${a}`, label: e, path: `${e}/`, count: t })),
      o = [];
    i.forEach(e => {
      a.filter(t => t.path.startsWith(`${e.label}/`))
        .sort((e, t) => (t.size || 0) - (e.size || 0))
        .slice(0, 2)
        .forEach(t => {
          const a = t.path.split('/'),
            r = a[a.length - 1];
          o.push({
            id: `file-${o.length}`,
            label: r,
            path: t.path,
            size: t.size || 0,
            dirId: e.id,
          });
        });
    });
    return (
      a
        .filter(e => !e.path.includes('/'))
        .sort((e, t) => (t.size || 0) - (e.size || 0))
        .slice(0, 4)
        .forEach(e => {
          o.push({
            id: `file-${o.length}`,
            label: e.path,
            path: e.path,
            size: e.size || 0,
            dirId: 'repo-root',
          });
        }),
      {
        repoLabel: t || 'repository',
        totalFiles: a.length,
        totalDirs: r.length,
        dirNodes: i,
        fileNodes: o.slice(0, 18),
      }
    );
  }
  async loadSpatialDataset(e) {
    const t = this.parseRepoLink(e.fullName);
    if (!t) return this.buildFallbackSpatialDataset(e);
    if (this.repoSpatialCache.has(e.fullName)) return this.repoSpatialCache.get(e.fullName);
    const a = { Accept: 'application/vnd.github+json' },
      r = `https://api.github.com/repos/${t.owner}/${t.repo}`,
      n = await this.fetchJson(r, a);
    if (!n) {
      const t = this.buildFallbackSpatialDataset(e);
      return (this.repoSpatialCache.set(e.fullName, t), t);
    }
    const s = n.default_branch || 'main',
      i = new Date(Date.now() - 2592e6).toISOString(),
      [o, c, l, d] = await Promise.all([
        this.fetchJson(`${r}/commits?per_page=100&since=${encodeURIComponent(i)}`, a),
        this.fetchJson(`${r}/contributors?per_page=100&anon=1`, a),
        this.fetchJson(`${r}/languages`, a),
        this.fetchJson(`${r}/git/trees/${encodeURIComponent(s)}?recursive=1`, a),
      ]),
      p = Array.isArray(o) ? o : [],
      u = Array.isArray(c) ? c : [],
      h = l && 'object' == typeof l ? l : {},
      m = Array.isArray(d?.tree) ? d.tree.slice(0, 800) : [],
      f = this.extractCommitDate(p[0]) || '',
      b = this.buildActivityOverview(p, u),
      g = {
        details: {
          openIssues: n.open_issues_count ?? null,
          watchers: n.watchers_count ?? null,
          defaultBranch: n.default_branch || '',
          sizeKb: n.size ?? null,
          license: n.license?.spdx_id || '',
          pushedAt: n.pushed_at || '',
          latestCommitDate: f,
          commits30d: b.last30,
          contributors: b.contributorsCount,
        },
        activity: b,
        graph: this.buildGraphModel(m, n.full_name),
        languages: h,
        contributors: u,
      };
    return (this.repoSpatialCache.set(e.fullName, g), g);
  }
  buildRealitySummary(e, t = null) {
    const a = this.mergeRepoDetails(e, t),
      r = this.formatRelativeTime(a.updatedAt || e.updatedAt),
      n = this.computeHealthScore(a),
      s = [];
    return (
      s.push(`updated ${r}`),
      a.language && s.push(`built in ${a.language}`),
      a.defaultBranch && s.push(`branch ${a.defaultBranch}`),
      s.push(`health ${n}/100`),
      s.join(' · ')
    );
  }
  mergeRepoDetails(e, t = null) {
    return {
      stars: e.stars ?? null,
      forks: e.forks ?? null,
      openIssues: t?.openIssues ?? e.openIssues ?? null,
      watchers: t?.watchers ?? e.watchers ?? null,
      commits30d: t?.commits30d ?? e.commits30d ?? null,
      contributors: t?.contributors ?? e.contributors ?? null,
      defaultBranch: t?.defaultBranch || e.defaultBranch || '',
      sizeKb: t?.sizeKb ?? e.sizeKb ?? null,
      license: t?.license || e.license || '',
      latestCommitDate: t?.latestCommitDate || '',
      pushedAt: t?.pushedAt || e.pushedAt || '',
      updatedAt: e.updatedAt || '',
      createdAt: e.createdAt || '',
      language: e.language || '',
    };
  }
  computeHealthScore(e) {
    const t = Number(e.stars || 0),
      a = Number(e.forks || 0),
      r = Number(e.openIssues || 0),
      n = Number(e.commits30d || 0),
      s = Number(e.contributors || 0),
      i = e.license ? 1 : 0,
      o = e.defaultBranch ? 1 : 0,
      c = this.getDayDiff(e.updatedAt || e.pushedAt),
      l = Math.max(0, 45 - 0.2 * Math.min(c, 180)),
      d = Math.min(30, 2 * t + 3 * a + n + 2 * s),
      p = Math.max(0, 15 - 0.35 * Math.min(r, 40)),
      u = 5 * i + 5 * o;
    return Math.round(l + d + p + u);
  }
  getDayDiff(e) {
    if (!e) return Number.POSITIVE_INFINITY;
    const t = new Date(e).getTime();
    return Number.isNaN(t)
      ? Number.POSITIVE_INFINITY
      : Math.max(0, Math.floor((Date.now() - t) / 864e5));
  }
  formatSize(e) {
    const t = Number(e);
    return !Number.isFinite(t) || t < 0
      ? '--'
      : t < 1024
        ? `${t} KB`
        : `${(t / 1024).toFixed(1).replace('.0', '')} MB`;
  }
  toFiniteMetric(e) {
    if (null == e || '' === e) return null;
    const t = Number(e);
    return Number.isFinite(t) ? t : null;
  }
  createFactCard(e, t, a = '') {
    const r = this.documentRef.createElement('div');
    ((r.className = 'project-xr-fact-card'), a && (r.dataset.signalKey = a));
    const n = this.documentRef.createElement('strong');
    ((n.textContent = t), (n.className = 'project-xr-fact-value'));
    const s = this.documentRef.createElement('span');
    return (
      (s.textContent = e),
      (s.className = 'project-xr-fact-label'),
      r.appendChild(n),
      r.appendChild(s),
      r
    );
  }
  createLoadingSection(e, t) {
    const a = this.documentRef.createElement('div');
    a.className = 'project-xr-data-section';
    const r = this.documentRef.createElement('div');
    r.className = 'project-xr-section-head';
    const n = this.documentRef.createElement('h4');
    n.textContent = e;
    const s = this.documentRef.createElement('span');
    ((s.className = 'project-xr-section-meta'),
      (s.textContent = 'Live GitHub data'),
      r.appendChild(n),
      r.appendChild(s));
    const i = this.documentRef.createElement('p');
    return (
      (i.className = 'project-xr-loading-text'),
      (i.textContent = t),
      a.appendChild(r),
      a.appendChild(i),
      a
    );
  }
  normalizeInsightsGrid(e) {
    if (!e || !e.isConnected) return;
    const t = e.children.length;
    0 !== t ? e.classList.toggle('project-xr-insights-grid-single', 1 === t) : e.remove();
  }
  openFallbackModal(e) {
    this.closeFallbackModal();
    const {
        projectName: t,
        fullName: a,
        projectDescription: r,
        demoUrl: n,
        repoUrl: s,
        updatedAt: i,
        primaryUrl: o,
      } = e,
      c = this.mergeRepoDetails(e),
      l = this.formatRelativeTime(i),
      d = this.formatDateLabel(i),
      p = this.computeHealthScore(c),
      u =
        'Unknown' === l && 'Unknown' === d
          ? 'Unknown'
          : [l, d].filter(e => 'Unknown' !== e).join(' · '),
      h = this.documentRef.createElement('div');
    ((h.className = 'project-xr-modal'),
      h.setAttribute('role', 'dialog'),
      h.setAttribute('aria-modal', 'true'),
      h.setAttribute('aria-label', `${t} spatial view`));
    const m = this.documentRef.createElement('div');
    m.className = 'project-xr-dialog';
    const f = this.documentRef.createElement('div');
    f.className = 'project-xr-head';
    const b = this.documentRef.createElement('div');
    b.className = 'project-xr-heading-wrap';
    const g = this.documentRef.createElement('h3');
    g.textContent = t;
    const v = this.documentRef.createElement('p');
    ((v.className = 'project-xr-repo-label'),
      (v.textContent = a || ''),
      b.appendChild(g),
      a && b.appendChild(v));
    const y = this.documentRef.createElement('span');
    ((y.className = 'project-xr-updated-chip'), (y.textContent = u));
    const x = this.documentRef.createElement('button');
    ((x.type = 'button'),
      (x.className = 'project-xr-top-close'),
      x.setAttribute('aria-label', 'Close spatial detail card'),
      (x.innerHTML = '<i class="fas fa-arrow-left"></i>'));
    const j = this.documentRef.createElement('div');
    ((j.className = 'project-xr-head-actions'),
      j.appendChild(y),
      j.appendChild(x),
      f.appendChild(b),
      f.appendChild(j));
    const C = this.documentRef.createElement('p');
    ((C.className = 'project-xr-modal-description'),
      (C.textContent = r || 'No description available.'));
    const w = this.documentRef.createElement('div');
    w.className = 'project-xr-spatial-brief';
    const S = this.documentRef.createElement('h4');
    S.textContent = 'Repository Insight';
    const R = this.documentRef.createElement('p');
    ((R.className = 'project-xr-spatial-copy'),
      (R.textContent = this.buildRealitySummary(e, null)),
      w.appendChild(S),
      w.appendChild(R));
    const N = this.documentRef.createElement('div');
    ((N.className = 'project-xr-facts'),
      N.appendChild(this.createFactCard('Repository Size', this.formatSize(c.sizeKb), 'size')),
      N.appendChild(this.createFactCard('Default Branch', c.defaultBranch || '--', 'branch')),
      N.appendChild(this.createFactCard('License', c.license || '--', 'license')),
      N.appendChild(this.createFactCard('Health Score', `${p}/100`, 'health')));
    const k = this.createLoadingSection('Languages', 'Analyzing language distribution...'),
      A = this.createLoadingSection('Repository Structure', 'Mapping directories and key files...'),
      D = this.createLoadingSection('Activity', 'Compiling 30-day commit pulse...'),
      E = this.documentRef.createElement('div');
    ((E.className = 'project-xr-insights-grid'),
      E.appendChild(D),
      E.appendChild(k),
      this.normalizeInsightsGrid(E));
    const F = this.documentRef.createElement('div');
    F.className = 'project-xr-actions';
    const $ = s || o;
    if (this.isSafeHttpUrl($)) {
      const e = this.documentRef.createElement('a');
      ((e.className = 'project-xr-action-primary project-xr-btn-github'),
        (e.href = $),
        (e.target = '_blank'),
        (e.rel = 'noopener noreferrer'),
        (e.innerHTML = '<i class="fab fa-github"></i> View on GitHub'),
        F.appendChild(e));
    }
    const M = n || (o !== $ ? o : '');
    if (this.isSafeHttpUrl(M)) {
      const e = this.documentRef.createElement('a');
      ((e.className = 'project-xr-action-primary project-xr-btn-demo'),
        (e.href = M),
        (e.target = '_blank'),
        (e.rel = 'noopener noreferrer'),
        (e.innerHTML = '<i class="fas fa-arrow-up-right-from-square"></i> Demo Website'),
        F.appendChild(e));
    }
    (m.appendChild(f),
      m.appendChild(C),
      m.appendChild(w),
      m.appendChild(N),
      m.appendChild(E),
      m.appendChild(A),
      m.appendChild(F),
      m.addEventListener('click', e => e.stopPropagation()),
      h.appendChild(m),
      this.documentRef.body.appendChild(h),
      (this.previousBodyOverflow = this.documentRef.body.style.overflow),
      (this.documentRef.body.style.overflow = 'hidden'),
      x.focus());
    const L = e => {
      'Escape' === e.key && this.closeFallbackModal();
    };
    (h.addEventListener('click', e => {
      e.target === h && this.closeFallbackModal();
    }),
      x.addEventListener('click', () => this.closeFallbackModal()),
      this.documentRef.addEventListener('keydown', L),
      (this.activeFallback = {
        root: h,
        cleanup: () => {
          (this.documentRef.removeEventListener('keydown', L),
            (this.documentRef.body.style.overflow = this.previousBodyOverflow));
        },
      }),
      this.loadSpatialDataset(e).then(t => {
        if (!this.activeFallback || this.activeFallback.root !== h) return;
        if (!t)
          return (
            (k.querySelector('.project-xr-loading-text').textContent = 'Unavailable'),
            (A.querySelector('.project-xr-loading-text').textContent = 'Unavailable'),
            void (D.querySelector('.project-xr-loading-text').textContent = 'Unavailable')
          );
        const { activity: a, languages: r, details: n, graph: s } = t,
          i = this.mergeRepoDetails(e, n),
          o = N.querySelector('[data-signal-key="size"] .project-xr-fact-value');
        o && (o.textContent = this.formatSize(i.sizeKb));
        const c = N.querySelector('[data-signal-key="branch"] .project-xr-fact-value');
        c && (c.textContent = i.defaultBranch || '--');
        const l = N.querySelector('[data-signal-key="license"] .project-xr-fact-value');
        l && (l.textContent = i.license || '--');
        const d = N.querySelector('[data-signal-key="health"] .project-xr-fact-value');
        d && (d.textContent = `${this.computeHealthScore(i)}/100`);
        const p = w.querySelector('.project-xr-spatial-copy');
        (p && (p.textContent = this.buildRealitySummary(e, n)),
          this.renderLanguageBar(k, r),
          this.renderRepoTree(A, s),
          this.renderActivityHeatmap(D, a, r),
          this.normalizeInsightsGrid(E));
      }));
  }
  renderLanguageBar(e, t) {
    if (!e) return;
    const a = Object.entries(t || {}).sort((e, t) => t[1] - e[1]),
      r = a.reduce((e, [, t]) => e + t, 0);
    if (!a.length || 0 === r) return void e.remove();
    const n = {
        JavaScript: '#f1e05a',
        TypeScript: '#3178c6',
        Python: '#3572A5',
        Java: '#b07219',
        HTML: '#e34c26',
        CSS: '#563d7c',
        Shell: '#89e051',
        'C++': '#f34b7d',
        Go: '#00ADD8',
        Rust: '#dea584',
        Dart: '#00B4AB',
        Kotlin: '#A97BFF',
        Swift: '#ffac45',
        Ruby: '#701516',
        PHP: '#4F5D95',
        'Jupyter Notebook': '#DA5B0B',
        C: '#555555',
        SCSS: '#c6538c',
      },
      s = '#6e7681',
      i = a
        .slice(0, 6)
        .map(([e, t]) => {
          const a = ((t / r) * 100).toFixed(1);
          return `<div class="project-xr-lang-segment" style="width:${a}%;background:${n[e] || s}" title="${e}: ${a}%"></div>`;
        })
        .join(''),
      o = a
        .slice(0, 6)
        .map(([e, t]) => {
          const a = ((t / r) * 100).toFixed(1);
          return `<div class="project-xr-lang-item">\n                <div class="project-xr-lang-dot" style="background:${n[e] || s}"></div>\n                <span>${e}</span>\n                <span class="project-xr-lang-pct">${a}%</span>\n            </div>`;
        })
        .join('');
    e.innerHTML = `\n            <div class="project-xr-section-head">\n                <h4><i class="fas fa-code"></i> Languages</h4>\n                <span class="project-xr-section-meta">${a.length} detected</span>\n            </div>\n            <div class="project-xr-lang-bar-wrap">\n                <div class="project-xr-lang-bar">${i}</div>\n                <div class="project-xr-lang-legend">${o}</div>\n            </div>\n        `;
  }
  renderRepoTree(e, t) {
    if (!e) return;
    if (!t || (!t.dirNodes.length && !t.fileNodes.length)) return void e.remove();
    const a = (t.dirNodes || []).slice(0, 6),
      r = (t.fileNodes || []).filter(e => 'repo-root' === e.dirId).slice(0, 4),
      n = e =>
        ({
          js: 'fab fa-js',
          ts: 'fab fa-js',
          py: 'fab fa-python',
          html: 'fab fa-html5',
          css: 'fab fa-css3-alt',
          json: 'fas fa-cog',
          md: 'fas fa-file-alt',
          yml: 'fas fa-cog',
          yaml: 'fas fa-cog',
          sh: 'fas fa-terminal',
          dockerfile: 'fab fa-docker',
          gitignore: 'fab fa-git-alt',
          lock: 'fas fa-lock',
        })[e.split('.').pop()?.toLowerCase() || ''] || 'fas fa-file-code';
    let s = '<div class="project-xr-tree-list">';
    (r.forEach(e => {
      s += `<div class="project-xr-tree-item">\n                <i class="${n(e.label)}"></i>\n                <span>${e.label}</span>\n            </div>`;
    }),
      a.forEach(e => {
        const a = (t.fileNodes || []).filter(t => t.dirId === e.id).slice(0, 3);
        ((s += `<div class="project-xr-tree-item project-xr-tree-dir">\n                <i class="fas fa-folder"></i>\n                <span>${e.label}/</span>\n            </div>`),
          a.forEach(e => {
            s += `<div class="project-xr-tree-item project-xr-tree-file">\n                    <i class="${n(e.label)}"></i>\n                    <span>${e.label}</span>\n                </div>`;
          }));
      }),
      (s += '</div>'),
      (e.innerHTML = `\n            <div class="project-xr-section-head">\n                <h4><i class="fas fa-sitemap"></i> Repository Structure</h4>\n                <span class="project-xr-section-meta">${t.totalDirs} dirs · ${t.totalFiles} files</span>\n            </div>\n            ${s}\n        `));
  }
  renderActivityHeatmap(e, t, a) {
    if (!e || !t) {
      if (e) {
        const t = e.querySelector('.project-xr-loading-text');
        t && (t.textContent = 'Unavailable');
      }
      return;
    }
    const r = Object.entries(a || {})
        .sort((e, t) => t[1] - e[1])
        .slice(0, 3)
        .map(([e]) => e),
      n = Array.isArray(t.days) && t.days.length > 0,
      s = {
        last7: this.toFiniteMetric(t.last7),
        last30: this.toFiniteMetric(t.last30),
        activeDays: this.toFiniteMetric(t.activeDays),
        maxDaily: this.toFiniteMetric(t.maxDaily),
      },
      i = Object.values(s).some(e => null !== e);
    if (!n && !i) return void e.remove();
    let o = '';
    n
      ? ((o = '<div class="project-xr-heatmap">'),
        t.days.forEach(e => {
          const a = Number(t.maxDaily) > 0 ? Math.min(4, Math.ceil((e.count / t.maxDaily) * 4)) : 0;
          o += `<div class="project-xr-heatmap-cell level-${a}" title="${e.label}: ${e.count} commits"></div>`;
        }),
        (o += '</div>'))
      : (o = '<p class="project-xr-loading-text">Activity timeline unavailable from live API.</p>');
    const c = e => {
        const t = this.toFiniteMetric(e);
        return null === t ? '--' : String(t);
      },
      l = `\n            <div class="project-xr-activity-stats">\n                <div class="project-xr-activity-stat">\n                    <strong>${c(t.last7)}</strong>\n                    <span>Commits / 7d</span>\n                </div>\n                <div class="project-xr-activity-stat">\n                    <strong>${c(t.last30)}</strong>\n                    <span>Commits / 30d</span>\n                </div>\n                <div class="project-xr-activity-stat">\n                    <strong>${c(t.activeDays)}</strong>\n                    <span>Active Days</span>\n                </div>\n                <div class="project-xr-activity-stat">\n                    <strong>${c(t.maxDaily)}</strong>\n                    <span>Peak Daily</span>\n                </div>\n            </div>\n        `;
    e.innerHTML = `\n            <div class="project-xr-section-head">\n                <h4><i class="fas fa-chart-line"></i> Activity</h4>\n                <span class="project-xr-section-meta">${r.join(', ') || 'All languages'}</span>\n            </div>\n            ${o}\n            ${l}\n            ${n && t.topContributor && '--' !== t.topContributor ? `<p class="project-xr-activity-note">Top contributor: <strong>${t.topContributor}</strong></p>` : ''}\n        `;
  }
  closeFallbackModal() {
    this.activeFallback &&
      (this.activeFallback.cleanup(),
      this.activeFallback.root.remove(),
      (this.activeFallback = null));
  }
  isSafeHttpUrl(e) {
    try {
      const t = new URL(e, window.location.origin);
      return 'http:' === t.protocol || 'https:' === t.protocol;
    } catch {
      return !1;
    }
  }
}
if ('undefined' != typeof window) {
  const e = () => {
    const e = new ProjectXR();
    (e.init(), (window.projectXR = e));
  };
  'loading' === document.readyState ? window.addEventListener('DOMContentLoaded', e) : e();
}
export default ProjectXR;
