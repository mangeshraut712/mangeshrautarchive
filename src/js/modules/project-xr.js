/**
 * Project Spatial Interactions
 * - Tries immersive WebXR AR on supported devices/browsers.
 * - Falls back to a 3D spatial preview modal everywhere else.
 */

class ProjectXR {
  constructor(documentRef = document) {
    this.documentRef = documentRef;
    this.arSupported = false;
    this.activeSession = null;
    this.activeFallback = null;
    this.repoSpatialCache = new Map();
    this.previousBodyOverflow = '';
    this.apiCooldownUntil = 0;
    this.apiCooldownMs = 5 * 60 * 1000;
    this.bound = false;
  }

  async init() {
    this.arSupported = await this.detectArSupport();
    this.bindEvents();
  }

  async detectArSupport() {
    if (!navigator.xr || typeof navigator.xr.isSessionSupported !== 'function') {
      return false;
    }
    try {
      return await navigator.xr.isSessionSupported('immersive-ar');
    } catch (error) {
      console.warn('WebXR capability check failed:', error);
      return false;
    }
  }

  bindEvents() {
    if (this.bound) return;
    this.bound = true;

    this.documentRef.addEventListener(
      'click',
      async event => {
        const trigger = event.target.closest('.btn-ar');
        if (!trigger) return;

        event.preventDefault();
        const projectContext = this.extractProjectContext(trigger);
        try {
          await this.openSpatialExperience(projectContext);
        } catch (error) {
          console.warn('Spatial experience failed, opening fallback preview:', error);
          this.openFallbackModal(projectContext);
        }
      },
      { capture: true }
    );
  }

  extractProjectContext(trigger) {
    const card = trigger.closest('.showcase-project-card, .project-card');
    const readText = selector => card?.querySelector(selector)?.textContent?.trim() || '';
    const readList = selector => {
      if (!card) return [];
      return Array.from(card.querySelectorAll(selector))
        .map(el => el.textContent?.trim())
        .filter(Boolean);
    };
    const parseNumber = value => {
      const num = Number.parseInt(value, 10);
      return Number.isFinite(num) ? num : null;
    };
    const parseTopics = value => {
      if (!value) return [];
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(item => String(item || '').trim()).filter(Boolean);
      } catch {
        return [];
      }
    };

    const stars = parseNumber(trigger.dataset.projectStars);
    const forks = parseNumber(trigger.dataset.projectForks);
    const openIssues = parseNumber(trigger.dataset.projectOpenIssues);
    const watchers = parseNumber(trigger.dataset.projectWatchers);
    const sizeKb = parseNumber(trigger.dataset.projectSizeKb);
    const commits30d = parseNumber(trigger.dataset.projectCommits30d);
    const contributors = parseNumber(trigger.dataset.projectContributors);
    const stats = [];
    if (stars !== null) {
      stats.push({ label: 'Stars', value: String(stars), key: 'stars' });
    }
    if (forks !== null) {
      stats.push({ label: 'Forks', value: String(forks), key: 'forks' });
    }
    if (commits30d !== null) {
      stats.push({
        label: 'Commits (30d)',
        value: String(commits30d),
        key: 'commits',
      });
    }
    if (contributors !== null) {
      stats.push({
        label: 'Contributors',
        value: String(contributors),
        key: 'contributors',
      });
    }
    if (openIssues !== null) {
      stats.push({
        label: 'Open Issues',
        value: String(openIssues),
        key: 'issues',
      });
    }
    if (watchers !== null) {
      stats.push({
        label: 'Watchers',
        value: String(watchers),
        key: 'watchers',
      });
    }

    const demoUrlFromCard =
      card?.querySelector('.btn-demo:not(.is-disabled)')?.getAttribute('href') || '';
    const demoUrl = trigger.dataset.projectDemoUrl || demoUrlFromCard || '';
    const projectUrl = trigger.dataset.projectUrl || demoUrl || '';
    const repoUrl = trigger.dataset.projectRepoUrl || projectUrl || '';
    const fallbackTopics = Array.from(new Set(readList('.project-tag')));
    const topicsFromData = parseTopics(trigger.dataset.projectTopics);

    return {
      projectName: trigger.dataset.projectName || readText('.project-title') || 'Portfolio Project',
      fullName: trigger.dataset.projectFullName || '',
      projectDescription: readText('.project-description'),
      language: trigger.dataset.projectLanguage || readText('.project-language'),
      tags: topicsFromData.length ? topicsFromData : fallbackTopics,
      stats,
      stars,
      forks,
      openIssues,
      watchers,
      sizeKb,
      commits30d,
      contributors,
      license: trigger.dataset.projectLicense || '',
      defaultBranch: trigger.dataset.projectDefaultBranch || '',
      pushedAt: trigger.dataset.projectPushedAt || '',
      score: parseNumber(trigger.dataset.projectScore),
      aiInsight: trigger.dataset.projectAiInsight || '',
      demoUrl,
      repoUrl,
      projectUrl,
      updatedAt: trigger.dataset.projectUpdatedAt || '',
      createdAt: trigger.dataset.projectCreatedAt || '',
      primaryUrl: demoUrl || projectUrl,
    };
  }

  async openSpatialExperience(projectContext) {
    const { projectName, primaryUrl } = projectContext;
    if (this.arSupported) {
      const launched = await this.launchWebXrSession(projectName, primaryUrl);
      if (launched) return;
    }
    this.openFallbackModal(projectContext);
  }

  async launchWebXrSession(projectName, projectUrl) {
    if (!navigator.xr || this.activeSession) return false;

    const overlay = this.createXrOverlay(projectName, projectUrl);
    this.documentRef.body.appendChild(overlay.root);

    let session;
    try {
      session = await navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ['local-floor', 'dom-overlay'],
        domOverlay: { root: overlay.root },
      });
    } catch (error) {
      overlay.root.remove();
      console.warn('Unable to start WebXR AR session, using fallback:', error);
      return false;
    }

    this.activeSession = session;

    const cleanup = () => {
      this.activeSession = null;
      overlay.root.remove();
    };

    session.addEventListener('end', cleanup, { once: true });
    overlay.close.addEventListener('click', async () => {
      try {
        await session.end();
      } catch (error) {
        console.warn('Failed to close WebXR session gracefully:', error);
        cleanup();
      }
    });

    try {
      const canvas = this.documentRef.createElement('canvas');
      canvas.className = 'project-xr-canvas';
      overlay.viewport.appendChild(canvas);

      const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        xrCompatible: true,
      });
      if (!gl || typeof gl.makeXRCompatible !== 'function') {
        throw new Error('WebGL XR context is unavailable.');
      }
      if (typeof window.XRWebGLLayer !== 'function') {
        throw new Error('XRWebGLLayer is unavailable.');
      }

      await gl.makeXRCompatible();
      session.updateRenderState({
        baseLayer: new window.XRWebGLLayer(session, gl),
      });

      const referenceSpace = await session.requestReferenceSpace('local');
      overlay.status.textContent = `Immersive AR running for ${projectName}`;

      const onXrFrame = (_time, frame) => {
        if (!this.activeSession) return;

        session.requestAnimationFrame(onXrFrame);
        frame.getViewerPose(referenceSpace);

        gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer);
        gl.clearColor(0.03, 0.07, 0.12, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      };
      session.requestAnimationFrame(onXrFrame);
    } catch (error) {
      console.warn('WebXR render bootstrap failed, using fallback:', error);
      try {
        await session.end();
      } catch {
        cleanup();
      }
      return false;
    }

    return true;
  }

  createXrOverlay(projectName, projectUrl) {
    const root = this.documentRef.createElement('div');
    root.className = 'project-xr-overlay';

    const panel = this.documentRef.createElement('div');
    panel.className = 'project-xr-overlay-panel';

    const title = this.documentRef.createElement('strong');
    title.textContent = `${projectName} Spatial View`;

    const status = this.documentRef.createElement('span');
    status.className = 'project-xr-status';
    status.textContent = 'Starting immersive AR session...';

    const actions = this.documentRef.createElement('div');
    actions.className = 'project-xr-overlay-actions';

    const close = this.documentRef.createElement('button');
    close.type = 'button';
    close.className = 'project-xr-close-btn';
    close.textContent = 'Close AR';

    actions.appendChild(close);

    if (this.isSafeHttpUrl(projectUrl)) {
      const demoLink = this.documentRef.createElement('a');
      demoLink.className = 'project-xr-repo-link';
      demoLink.href = projectUrl;
      demoLink.target = '_blank';
      demoLink.rel = 'noopener noreferrer';
      demoLink.textContent = 'Open Demo';
      actions.appendChild(demoLink);
    }

    panel.appendChild(title);
    panel.appendChild(status);
    panel.appendChild(actions);

    const viewport = this.documentRef.createElement('div');
    viewport.className = 'project-xr-viewport';

    root.appendChild(panel);
    root.appendChild(viewport);

    return { root, panel, status, close, viewport };
  }

  formatDateLabel(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  formatRelativeTime(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    const diffMs = Math.max(0, Date.now() - date.getTime());
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

  parseRepoLink(fullName) {
    if (!fullName || !fullName.includes('/')) return null;
    const [owner, repo] = fullName.split('/');
    if (!owner || !repo) return null;
    return { owner, repo };
  }

  async fetchJson(url, headers) {
    try {
      const parsed = new URL(url);
      if (parsed.origin === 'https://api.github.com') {
        const pathWithQuery = `${parsed.pathname}${parsed.search || ''}`;
        const proxiedUrl = `/api/github/proxy?path=${encodeURIComponent(pathWithQuery)}`;
        const proxiedResponse = await fetch(proxiedUrl, {
          headers: { Accept: 'application/json' },
        });
        if (proxiedResponse.ok) {
          return await proxiedResponse.json();
        }
      }
    } catch {
      // Fall back to direct request below.
    }

    if (this.apiCooldownUntil > Date.now()) {
      return null;
    }

    try {
      const response = await fetch(url, { headers });
      if (response.status === 403 || response.status === 429) {
        this.apiCooldownUntil = Date.now() + this.apiCooldownMs;
      }
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  extractCommitDate(commit) {
    return commit?.commit?.author?.date || commit?.commit?.committer?.date || '';
  }

  buildActivityOverview(commits = [], contributors = []) {
    const commitMap = new Map();
    commits.forEach(commit => {
      const raw = this.extractCommitDate(commit);
      if (!raw) return;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      commitMap.set(key, (commitMap.get(key) || 0) + 1);
    });

    const days = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = 27; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setUTCDate(today.getUTCDate() - i);
      const key = day.toISOString().slice(0, 10);
      const count = commitMap.get(key) || 0;
      days.push({
        key,
        count,
        label: day.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      });
    }

    const last7 = days.slice(-7).reduce((sum, day) => sum + day.count, 0);
    const last30 = days.reduce((sum, day) => sum + day.count, 0);
    const maxDaily = Math.max(...days.map(day => day.count), 0);
    const activeDays = days.filter(day => day.count > 0).length;

    return {
      last7,
      last30,
      activeDays,
      maxDaily,
      contributorsCount: Array.isArray(contributors) ? contributors.length : 0,
      topContributor: contributors?.[0]?.login || commits?.[0]?.author?.login || '--',
      days,
    };
  }

  buildFallbackActivity(projectContext) {
    const rawCommits30d = Number(projectContext.commits30d);
    const rawContributors = Number(projectContext.contributors);
    const last30 = Number.isFinite(rawCommits30d) ? Math.max(0, rawCommits30d) : null;
    const contributorsCount = Number.isFinite(rawContributors)
      ? Math.max(0, rawContributors)
      : null;

    return {
      last7: null,
      last30,
      activeDays: null,
      maxDaily: null,
      contributorsCount,
      topContributor: '--',
      days: [],
    };
  }

  buildFallbackSpatialDataset(projectContext) {
    const activity = this.buildFallbackActivity(projectContext);

    const details = {
      openIssues: projectContext.openIssues ?? null,
      watchers: projectContext.watchers ?? null,
      defaultBranch: projectContext.defaultBranch || '',
      sizeKb: projectContext.sizeKb ?? null,
      license: projectContext.license || '',
      pushedAt: projectContext.pushedAt || '',
      latestCommitDate: projectContext.pushedAt || projectContext.updatedAt || '',
      commits30d: activity.last30,
      contributors: activity.contributorsCount,
    };

    return {
      details,
      activity,
      graph: {
        repoLabel: projectContext.fullName || projectContext.projectName || 'repository',
        totalFiles: 0,
        totalDirs: 0,
        dirNodes: [],
        fileNodes: [],
      },
      languages: {},
      contributors: [],
    };
  }

  buildGraphModel(treeEntries = [], fullName = '') {
    const files = treeEntries.filter(entry => entry.type === 'blob' && entry.path);
    const dirs = treeEntries.filter(entry => entry.type === 'tree' && entry.path);

    const topLevelCount = new Map();
    const topLevelDirs = new Set();
    files.forEach(file => {
      const [head] = file.path.split('/');
      if (!head) return;
      topLevelCount.set(head, (topLevelCount.get(head) || 0) + 1);
      if (file.path.includes('/')) topLevelDirs.add(head);
    });

    dirs.forEach(dir => {
      const [head] = dir.path.split('/');
      if (head) topLevelDirs.add(head);
    });

    const rankedTopLevel = Array.from(topLevelCount.entries())
      .filter(([name]) => topLevelDirs.has(name))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const dirNodes = rankedTopLevel.map(([name, count], index) => ({
      id: `dir-${index}`,
      label: name,
      path: `${name}/`,
      count,
    }));

    const fileNodes = [];
    dirNodes.forEach(dirNode => {
      const candidates = files
        .filter(file => file.path.startsWith(`${dirNode.label}/`))
        .sort((a, b) => (b.size || 0) - (a.size || 0))
        .slice(0, 2);

      candidates.forEach(file => {
        const parts = file.path.split('/');
        const label = parts[parts.length - 1];
        fileNodes.push({
          id: `file-${fileNodes.length}`,
          label,
          path: file.path,
          size: file.size || 0,
          dirId: dirNode.id,
        });
      });
    });

    const rootFiles = files
      .filter(file => !file.path.includes('/'))
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, 4);
    rootFiles.forEach(file => {
      fileNodes.push({
        id: `file-${fileNodes.length}`,
        label: file.path,
        path: file.path,
        size: file.size || 0,
        dirId: 'repo-root',
      });
    });

    return {
      repoLabel: fullName || 'repository',
      totalFiles: files.length,
      totalDirs: dirs.length,
      dirNodes,
      fileNodes: fileNodes.slice(0, 18),
    };
  }

  async loadSpatialDataset(projectContext) {
    const repoLink = this.parseRepoLink(projectContext.fullName);
    if (!repoLink) {
      return this.buildFallbackSpatialDataset(projectContext);
    }
    if (this.repoSpatialCache.has(projectContext.fullName)) {
      return this.repoSpatialCache.get(projectContext.fullName);
    }

    const headers = { Accept: 'application/vnd.github+json' };
    const baseUrl = `https://api.github.com/repos/${repoLink.owner}/${repoLink.repo}`;
    const repoData = await this.fetchJson(baseUrl, headers);
    if (!repoData) {
      const fallbackDataset = this.buildFallbackSpatialDataset(projectContext);
      this.repoSpatialCache.set(projectContext.fullName, fallbackDataset);
      return fallbackDataset;
    }

    const defaultBranch = repoData.default_branch || 'main';
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [commitsData, contributorsData, languagesData, treeData] = await Promise.all([
      this.fetchJson(
        `${baseUrl}/commits?per_page=100&since=${encodeURIComponent(since30d)}`,
        headers
      ),
      this.fetchJson(`${baseUrl}/contributors?per_page=100&anon=1`, headers),
      this.fetchJson(`${baseUrl}/languages`, headers),
      this.fetchJson(
        `${baseUrl}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
        headers
      ),
    ]);

    const commits = Array.isArray(commitsData) ? commitsData : [];
    const contributors = Array.isArray(contributorsData) ? contributorsData : [];
    const languages = languagesData && typeof languagesData === 'object' ? languagesData : {};
    const treeEntries = Array.isArray(treeData?.tree) ? treeData.tree.slice(0, 800) : [];
    const latestCommitDate = this.extractCommitDate(commits[0]) || '';
    const activity = this.buildActivityOverview(commits, contributors);

    const details = {
      openIssues: repoData.open_issues_count ?? null,
      watchers: repoData.watchers_count ?? null,
      defaultBranch: repoData.default_branch || '',
      sizeKb: repoData.size ?? null,
      license: repoData.license?.spdx_id || '',
      pushedAt: repoData.pushed_at || '',
      latestCommitDate,
      commits30d: activity.last30,
      contributors: activity.contributorsCount,
    };

    const dataset = {
      details,
      activity,
      graph: this.buildGraphModel(treeEntries, repoData.full_name),
      languages,
      contributors,
    };

    this.repoSpatialCache.set(projectContext.fullName, dataset);
    return dataset;
  }

  buildRealitySummary(projectContext, repoDetails = null) {
    const merged = this.mergeRepoDetails(projectContext, repoDetails);
    const updated = this.formatRelativeTime(merged.updatedAt || projectContext.updatedAt);
    const health = this.computeHealthScore(merged);

    const descriptors = [];
    descriptors.push(`updated ${updated}`);
    if (merged.language) descriptors.push(`built in ${merged.language}`);
    if (merged.defaultBranch) descriptors.push(`branch ${merged.defaultBranch}`);
    descriptors.push(`health ${health}/100`);
    return descriptors.join(' · ');
  }

  mergeRepoDetails(projectContext, repoDetails = null) {
    return {
      stars: projectContext.stars ?? null,
      forks: projectContext.forks ?? null,
      openIssues: repoDetails?.openIssues ?? projectContext.openIssues ?? null,
      watchers: repoDetails?.watchers ?? projectContext.watchers ?? null,
      commits30d: repoDetails?.commits30d ?? projectContext.commits30d ?? null,
      contributors: repoDetails?.contributors ?? projectContext.contributors ?? null,
      defaultBranch: repoDetails?.defaultBranch || projectContext.defaultBranch || '',
      sizeKb: repoDetails?.sizeKb ?? projectContext.sizeKb ?? null,
      license: repoDetails?.license || projectContext.license || '',
      latestCommitDate: repoDetails?.latestCommitDate || '',
      pushedAt: repoDetails?.pushedAt || projectContext.pushedAt || '',
      updatedAt: projectContext.updatedAt || '',
      createdAt: projectContext.createdAt || '',
      language: projectContext.language || '',
    };
  }

  computeHealthScore(details) {
    const stars = Number(details.stars || 0);
    const forks = Number(details.forks || 0);
    const openIssues = Number(details.openIssues || 0);
    const commits30d = Number(details.commits30d || 0);
    const contributors = Number(details.contributors || 0);
    const hasLicense = details.license ? 1 : 0;
    const hasBranch = details.defaultBranch ? 1 : 0;
    const freshnessDays = this.getDayDiff(details.updatedAt || details.pushedAt);

    const freshness = Math.max(0, 45 - Math.min(freshnessDays, 180) * 0.2);
    const engagement = Math.min(30, stars * 2 + forks * 3 + commits30d + contributors * 2);
    const maintenance = Math.max(0, 15 - Math.min(openIssues, 40) * 0.35);
    const structure = hasLicense * 5 + hasBranch * 5;

    return Math.round(freshness + engagement + maintenance + structure);
  }

  getDayDiff(dateString) {
    if (!dateString) return Number.POSITIVE_INFINITY;
    const ts = new Date(dateString).getTime();
    if (Number.isNaN(ts)) return Number.POSITIVE_INFINITY;
    return Math.max(0, Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24)));
  }

  formatSize(sizeKb) {
    const number = Number(sizeKb);
    if (!Number.isFinite(number) || number < 0) return '--';
    if (number < 1024) return `${number} KB`;
    return `${(number / 1024).toFixed(1).replace('.0', '')} MB`;
  }

  toFiniteMetric(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  createFactCard(label, value, key = '') {
    const card = this.documentRef.createElement('div');
    card.className = 'project-xr-fact-card';
    if (key) card.dataset.signalKey = key;

    const valueEl = this.documentRef.createElement('strong');
    valueEl.textContent = value;
    valueEl.className = 'project-xr-fact-value';

    const labelEl = this.documentRef.createElement('span');
    labelEl.textContent = label;
    labelEl.className = 'project-xr-fact-label';

    card.appendChild(valueEl);
    card.appendChild(labelEl);
    return card;
  }

  createLoadingSection(title, description) {
    const section = this.documentRef.createElement('div');
    section.className = 'project-xr-data-section';

    const sectionHead = this.documentRef.createElement('div');
    sectionHead.className = 'project-xr-section-head';
    const heading = this.documentRef.createElement('h4');
    heading.textContent = title;
    const meta = this.documentRef.createElement('span');
    meta.className = 'project-xr-section-meta';
    meta.textContent = 'Live GitHub data';
    sectionHead.appendChild(heading);
    sectionHead.appendChild(meta);

    const loading = this.documentRef.createElement('p');
    loading.className = 'project-xr-loading-text';
    loading.textContent = description;

    section.appendChild(sectionHead);
    section.appendChild(loading);
    return section;
  }

  normalizeInsightsGrid(grid) {
    if (!grid || !grid.isConnected) return;
    const childCount = grid.children.length;
    if (childCount === 0) {
      grid.remove();
      return;
    }
    grid.classList.toggle('project-xr-insights-grid-single', childCount === 1);
  }

  openFallbackModal(projectContext) {
    this.closeFallbackModal();
    const { projectName, fullName, projectDescription, demoUrl, repoUrl, updatedAt, primaryUrl } =
      projectContext;
    const initialDetails = this.mergeRepoDetails(projectContext);
    const updatedRelative = this.formatRelativeTime(updatedAt);
    const updatedAbsolute = this.formatDateLabel(updatedAt);
    const initialHealth = this.computeHealthScore(initialDetails);
    const updatedChipValue =
      updatedRelative === 'Unknown' && updatedAbsolute === 'Unknown'
        ? 'Unknown'
        : [updatedRelative, updatedAbsolute].filter(value => value !== 'Unknown').join(' · ');

    // ── Root + Dialog container ──────────────────────────────────────
    const root = this.documentRef.createElement('div');
    root.className = 'project-xr-modal';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', `${projectName} spatial view`);

    const dialog = this.documentRef.createElement('div');
    dialog.className = 'project-xr-dialog';

    // ── Header ──────────────────────────────────────────────────────
    const head = this.documentRef.createElement('div');
    head.className = 'project-xr-head';

    const headingWrap = this.documentRef.createElement('div');
    headingWrap.className = 'project-xr-heading-wrap';
    const heading = this.documentRef.createElement('h3');
    heading.textContent = projectName;
    const repoSub = this.documentRef.createElement('p');
    repoSub.className = 'project-xr-repo-label';
    repoSub.textContent = fullName || '';
    headingWrap.appendChild(heading);
    if (fullName) headingWrap.appendChild(repoSub);

    const updatedChip = this.documentRef.createElement('span');
    updatedChip.className = 'project-xr-updated-chip';
    updatedChip.textContent = updatedChipValue;
    const topClose = this.documentRef.createElement('button');
    topClose.type = 'button';
    topClose.className = 'project-xr-top-close';
    topClose.setAttribute('aria-label', 'Close spatial detail card');
    topClose.innerHTML = '<i class="fas fa-arrow-left"></i>';
    const headActions = this.documentRef.createElement('div');
    headActions.className = 'project-xr-head-actions';
    headActions.appendChild(updatedChip);
    headActions.appendChild(topClose);
    head.appendChild(headingWrap);
    head.appendChild(headActions);

    // ── Description ─────────────────────────────────────────────────
    const descEl = this.documentRef.createElement('p');
    descEl.className = 'project-xr-modal-description';
    descEl.textContent = projectDescription || 'No description available.';

    // ── Spatial brief (non-duplicate summary) ───────────────────────
    const spatialBrief = this.documentRef.createElement('div');
    spatialBrief.className = 'project-xr-spatial-brief';
    const spatialHeading = this.documentRef.createElement('h4');
    spatialHeading.textContent = 'Repository Insight';
    const spatialCopy = this.documentRef.createElement('p');
    spatialCopy.className = 'project-xr-spatial-copy';
    spatialCopy.textContent = this.buildRealitySummary(projectContext, null);
    spatialBrief.appendChild(spatialHeading);
    spatialBrief.appendChild(spatialCopy);

    // ── Unique stats row (avoid duplicating card metrics) ───────────
    const factsWrap = this.documentRef.createElement('div');
    factsWrap.className = 'project-xr-facts';
    factsWrap.appendChild(
      this.createFactCard('Repository Size', this.formatSize(initialDetails.sizeKb), 'size')
    );
    factsWrap.appendChild(
      this.createFactCard('Default Branch', initialDetails.defaultBranch || '--', 'branch')
    );
    factsWrap.appendChild(
      this.createFactCard('License', initialDetails.license || '--', 'license')
    );
    factsWrap.appendChild(this.createFactCard('Health Score', `${initialHealth}/100`, 'health'));

    // ── Live data sections ──────────────────────────────────────────
    const langSection = this.createLoadingSection(
      'Languages',
      'Analyzing language distribution...'
    );
    const repoSection = this.createLoadingSection(
      'Repository Structure',
      'Mapping directories and key files...'
    );
    const activitySection = this.createLoadingSection(
      'Activity',
      'Compiling 30-day commit pulse...'
    );
    const insightsGrid = this.documentRef.createElement('div');
    insightsGrid.className = 'project-xr-insights-grid';
    insightsGrid.appendChild(activitySection);
    insightsGrid.appendChild(langSection);
    this.normalizeInsightsGrid(insightsGrid);

    // ── Action Buttons ──────────────────────────────────────────────
    const actions = this.documentRef.createElement('div');
    actions.className = 'project-xr-actions';

    const effectiveRepoUrl = repoUrl || primaryUrl;
    if (this.isSafeHttpUrl(effectiveRepoUrl)) {
      const ghBtn = this.documentRef.createElement('a');
      ghBtn.className = 'project-xr-action-primary project-xr-btn-github';
      ghBtn.href = effectiveRepoUrl;
      ghBtn.target = '_blank';
      ghBtn.rel = 'noopener noreferrer';
      ghBtn.innerHTML = '<i class="fab fa-github"></i> View on GitHub';
      actions.appendChild(ghBtn);
    }

    const effectiveDemoUrl = demoUrl || (primaryUrl !== effectiveRepoUrl ? primaryUrl : '');
    if (this.isSafeHttpUrl(effectiveDemoUrl)) {
      const demoBtn = this.documentRef.createElement('a');
      demoBtn.className = 'project-xr-action-primary project-xr-btn-demo';
      demoBtn.href = effectiveDemoUrl;
      demoBtn.target = '_blank';
      demoBtn.rel = 'noopener noreferrer';
      demoBtn.innerHTML = '<i class="fas fa-arrow-up-right-from-square"></i> Demo Website';
      actions.appendChild(demoBtn);
    }

    // ── Assemble ────────────────────────────────────────────────────
    dialog.appendChild(head);
    dialog.appendChild(descEl);
    dialog.appendChild(spatialBrief);
    dialog.appendChild(factsWrap);
    dialog.appendChild(insightsGrid);
    dialog.appendChild(repoSection);
    dialog.appendChild(actions);
    dialog.addEventListener('click', event => event.stopPropagation());
    root.appendChild(dialog);
    this.documentRef.body.appendChild(root);
    this.previousBodyOverflow = this.documentRef.body.style.overflow;
    this.documentRef.body.style.overflow = 'hidden';
    topClose.focus();

    const onEsc = event => {
      if (event.key === 'Escape') this.closeFallbackModal();
    };
    root.addEventListener('click', event => {
      if (event.target === root) this.closeFallbackModal();
    });
    topClose.addEventListener('click', () => this.closeFallbackModal());
    this.documentRef.addEventListener('keydown', onEsc);

    this.activeFallback = {
      root,
      cleanup: () => {
        this.documentRef.removeEventListener('keydown', onEsc);
        this.documentRef.body.style.overflow = this.previousBodyOverflow;
      },
    };

    // ── Async: load all live data ────────────────────────────────────
    this.loadSpatialDataset(projectContext).then(dataset => {
      if (!this.activeFallback || this.activeFallback.root !== root) return;

      if (!dataset) {
        langSection.querySelector('.project-xr-loading-text').textContent = 'Unavailable';
        repoSection.querySelector('.project-xr-loading-text').textContent = 'Unavailable';
        activitySection.querySelector('.project-xr-loading-text').textContent = 'Unavailable';
        return;
      }

      const { activity, languages, details, graph } = dataset;
      const mergedDetails = this.mergeRepoDetails(projectContext, details);

      // Update stats cards with live data
      const sizeCard = factsWrap.querySelector('[data-signal-key="size"] .project-xr-fact-value');
      if (sizeCard) sizeCard.textContent = this.formatSize(mergedDetails.sizeKb);
      const branchCard = factsWrap.querySelector(
        '[data-signal-key="branch"] .project-xr-fact-value'
      );
      if (branchCard) branchCard.textContent = mergedDetails.defaultBranch || '--';
      const licenseCard = factsWrap.querySelector(
        '[data-signal-key="license"] .project-xr-fact-value'
      );
      if (licenseCard) licenseCard.textContent = mergedDetails.license || '--';
      const healthCard = factsWrap.querySelector(
        '[data-signal-key="health"] .project-xr-fact-value'
      );
      if (healthCard) healthCard.textContent = `${this.computeHealthScore(mergedDetails)}/100`;

      const summaryText = spatialBrief.querySelector('.project-xr-spatial-copy');
      if (summaryText) {
        summaryText.textContent = this.buildRealitySummary(projectContext, details);
      }

      // ── Render Language Bar ──────────────────────────────────────
      this.renderLanguageBar(langSection, languages);

      // ── Render Repo Structure ────────────────────────────────────
      this.renderRepoTree(repoSection, graph);

      // ── Render Activity Heatmap ──────────────────────────────────
      this.renderActivityHeatmap(activitySection, activity, languages);
      this.normalizeInsightsGrid(insightsGrid);
    });
  }

  renderLanguageBar(container, languages) {
    if (!container) return;
    const entries = Object.entries(languages || {}).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

    if (!entries.length || total === 0) {
      container.remove();
      return;
    }

    const colors = {
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
    };
    const fallbackColor = '#6e7681';

    const barSegments = entries
      .slice(0, 6)
      .map(([lang, bytes]) => {
        const pct = ((bytes / total) * 100).toFixed(1);
        const color = colors[lang] || fallbackColor;
        return `<div class="project-xr-lang-segment" style="width:${pct}%;background:${color}" title="${lang}: ${pct}%"></div>`;
      })
      .join('');

    const legend = entries
      .slice(0, 6)
      .map(([lang, bytes]) => {
        const pct = ((bytes / total) * 100).toFixed(1);
        const color = colors[lang] || fallbackColor;
        return `<div class="project-xr-lang-item">
                <div class="project-xr-lang-dot" style="background:${color}"></div>
                <span>${lang}</span>
                <span class="project-xr-lang-pct">${pct}%</span>
            </div>`;
      })
      .join('');

    container.innerHTML = `
            <div class="project-xr-section-head">
                <h4><i class="fas fa-code"></i> Languages</h4>
                <span class="project-xr-section-meta">${entries.length} detected</span>
            </div>
            <div class="project-xr-lang-bar-wrap">
                <div class="project-xr-lang-bar">${barSegments}</div>
                <div class="project-xr-lang-legend">${legend}</div>
            </div>
        `;
  }

  renderRepoTree(container, graph) {
    if (!container) return;
    if (!graph || (!graph.dirNodes.length && !graph.fileNodes.length)) {
      container.remove();
      return;
    }

    const dirs = (graph.dirNodes || []).slice(0, 6);
    const rootFiles = (graph.fileNodes || []).filter(f => f.dirId === 'repo-root').slice(0, 4);

    const fileIcon = name => {
      const ext = name.split('.').pop()?.toLowerCase() || '';
      const map = {
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
      };
      return map[ext] || 'fas fa-file-code';
    };

    let treeHtml = '<div class="project-xr-tree-list">';

    // Root files first
    rootFiles.forEach(file => {
      treeHtml += `<div class="project-xr-tree-item">
                <i class="${fileIcon(file.label)}"></i>
                <span>${file.label}</span>
            </div>`;
    });

    // Directories with children
    dirs.forEach(dir => {
      const children = (graph.fileNodes || []).filter(f => f.dirId === dir.id).slice(0, 3);
      treeHtml += `<div class="project-xr-tree-item project-xr-tree-dir">
                <i class="fas fa-folder"></i>
                <span>${dir.label}/</span>
            </div>`;
      children.forEach(child => {
        treeHtml += `<div class="project-xr-tree-item project-xr-tree-file">
                    <i class="${fileIcon(child.label)}"></i>
                    <span>${child.label}</span>
                </div>`;
      });
    });

    treeHtml += '</div>';

    container.innerHTML = `
            <div class="project-xr-section-head">
                <h4><i class="fas fa-sitemap"></i> Repository Structure</h4>
                <span class="project-xr-section-meta">${graph.totalDirs} dirs · ${graph.totalFiles} files</span>
            </div>
            ${treeHtml}
        `;
  }

  renderActivityHeatmap(container, activity, languages) {
    if (!container || !activity) {
      if (container) {
        const loadingText = container.querySelector('.project-xr-loading-text');
        if (loadingText) loadingText.textContent = 'Unavailable';
      }
      return;
    }

    const languageEntries = Object.entries(languages || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([n]) => n);

    const hasHeatmapData = Array.isArray(activity.days) && activity.days.length > 0;
    const metrics = {
      last7: this.toFiniteMetric(activity.last7),
      last30: this.toFiniteMetric(activity.last30),
      activeDays: this.toFiniteMetric(activity.activeDays),
      maxDaily: this.toFiniteMetric(activity.maxDaily),
    };
    const hasAnyMetric = Object.values(metrics).some(value => value !== null);

    if (!hasHeatmapData && !hasAnyMetric) {
      container.remove();
      return;
    }

    let heatmapHtml = '';

    if (hasHeatmapData) {
      heatmapHtml = '<div class="project-xr-heatmap">';
      activity.days.forEach(day => {
        const level =
          Number(activity.maxDaily) > 0
            ? Math.min(4, Math.ceil((day.count / activity.maxDaily) * 4))
            : 0;
        heatmapHtml += `<div class="project-xr-heatmap-cell level-${level}" title="${day.label}: ${day.count} commits"></div>`;
      });
      heatmapHtml += '</div>';
    } else {
      heatmapHtml =
        '<p class="project-xr-loading-text">Activity timeline unavailable from live API.</p>';
    }

    const formatMetric = value => {
      const metric = this.toFiniteMetric(value);
      return metric === null ? '--' : String(metric);
    };

    const statsHtml = `
            <div class="project-xr-activity-stats">
                <div class="project-xr-activity-stat">
                    <strong>${formatMetric(activity.last7)}</strong>
                    <span>Commits / 7d</span>
                </div>
                <div class="project-xr-activity-stat">
                    <strong>${formatMetric(activity.last30)}</strong>
                    <span>Commits / 30d</span>
                </div>
                <div class="project-xr-activity-stat">
                    <strong>${formatMetric(activity.activeDays)}</strong>
                    <span>Active Days</span>
                </div>
                <div class="project-xr-activity-stat">
                    <strong>${formatMetric(activity.maxDaily)}</strong>
                    <span>Peak Daily</span>
                </div>
            </div>
        `;

    container.innerHTML = `
            <div class="project-xr-section-head">
                <h4><i class="fas fa-chart-line"></i> Activity</h4>
                <span class="project-xr-section-meta">${languageEntries.join(', ') || 'All languages'}</span>
            </div>
            ${heatmapHtml}
            ${statsHtml}
            ${
              hasHeatmapData && activity.topContributor && activity.topContributor !== '--'
                ? `<p class="project-xr-activity-note">Top contributor: <strong>${activity.topContributor}</strong></p>`
                : ''
            }
        `;
  }

  closeFallbackModal() {
    if (!this.activeFallback) return;
    this.activeFallback.cleanup();
    this.activeFallback.root.remove();
    this.activeFallback = null;
  }

  isSafeHttpUrl(value) {
    try {
      const parsed = new URL(value, window.location.origin);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

if (typeof window !== 'undefined') {
  const initProjectXR = () => {
    const projectXR = new ProjectXR();
    projectXR.init();
    window.projectXR = projectXR;
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initProjectXR);
  } else {
    initProjectXR();
  }
}

export default ProjectXR;
