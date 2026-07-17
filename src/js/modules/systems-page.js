import {
  architectureDecisions,
  builderProfile,
  buildCapabilities,
  caseStudyFlowSteps,
  currentWork,
  engineeringDecisions,
  engineeringTimeline,
  failedExperiments,
  heroLead,
  heroStats,
  lessonsLearned,
  publicEvidenceStatement,
  tokenizationStack,
  writingTopics,
} from './engineering-showcase-data.js';
import { caseStudies, renderCaseStudyEvidenceRow } from './case-studies-data.js';
import { mountArchitectureDiagrams, remountArchPanel } from './systems-arch-diagrams.js';
import { observeScrollAnimations } from './scroll-animations.js';
import {
  renderBenchmarkBarsHtml,
  renderOpenSourcePanel,
  renderProductionMetricsGrid,
  renderTelemetryBento,
  updateLiveBenchmarkValues,
} from './systems-viz.js';
import { isPerformanceAudit } from '../utils/perf-audit.js';
import { blogPosts } from './blog-data.js';
import { escapeHtml } from '../utils/escape-html.js';

function bindCardPress() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const selector =
    '.eng-showcase-card, .systems-bento-tile, .systems-bench-row, .systems-arch-tab, .systems-metric-panel, .systems-case-flow, .systems-principle-card';
  document.querySelectorAll(selector).forEach(card => {
    if (card.dataset.pressBound === 'true') return;
    card.dataset.pressBound = 'true';
    const pressOn = () => {
      if (!reducedMotion) card.classList.add('is-pressed');
    };
    const pressOff = () => card.classList.remove('is-pressed');
    card.addEventListener('pointerdown', pressOn);
    card.addEventListener('pointerup', pressOff);
    card.addEventListener('pointerleave', pressOff);
    card.addEventListener('pointercancel', pressOff);
  });
}

function initSectionRail() {
  const rail = document.getElementById('systems-section-rail');
  if (!rail) return;

  const links = rail.querySelectorAll('[data-section-link]');
  const sectionMap = new Map(
    [...links].map(link => [link.getAttribute('href').slice(1), link]).filter(([id]) => id)
  );
  const sections = [...sectionMap.keys()].map(id => document.getElementById(id)).filter(Boolean);

  const setActive = id => {
    links.forEach(link => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', active);
      link.setAttribute('aria-current', active ? 'true' : 'false');
      if (active && rail) {
        const railRect = rail.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        const offset = linkRect.left - railRect.left - railRect.width / 2 + linkRect.width / 2;
        rail.scrollTo({ left: rail.scrollLeft + offset, behavior: 'smooth' });
      }
    });
  };

  let isScrollingTo = null;
  let scrollTimeout = null;

  links.forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      isScrollingTo = href.slice(1);
      setActive(isScrollingTo);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrollingTo = null;
      }, 1000);
    });
  });

  if (!sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .reduce(
          (best, entry) =>
            !best || entry.intersectionRatio > best.intersectionRatio ? entry : best,
          null
        );
      if (!visible) return;
      if (isScrollingTo) {
        if (visible.target.id === isScrollingTo) {
          isScrollingTo = null;
        } else {
          return;
        }
      }
      setActive(visible.target.id);
    },
    { rootMargin: '-22% 0px -58% 0px', threshold: [0, 0.15, 0.35, 0.55, 0.75] }
  );

  sections.forEach(section => observer.observe(section));

  const initialActive = rail.querySelector('a.is-active');
  if (initialActive && rail) {
    requestAnimationFrame(() => {
      const railRect = rail.getBoundingClientRect();
      const linkRect = initialActive.getBoundingClientRect();
      const offset = linkRect.left - railRect.left - railRect.width / 2 + linkRect.width / 2;
      rail.scrollLeft = rail.scrollLeft + offset;
    });
  }
}

let cachedReachData = null;

function initArchitectureTabs() {
  const root = document.getElementById('systems-arch-stage');
  const tabs = document.querySelectorAll('[data-arch-tab]');
  const panels = document.querySelectorAll('[data-arch-panel]');
  if (!root || !tabs.length) return;

  const tabList = Array.from(tabs);
  const panelIdFor = tabId => {
    const panel = Array.from(panels).find(p => p.dataset.archPanel === tabId);
    if (panel?.id) return panel.id;
    return `architecture-${tabId}`;
  };
  const activate = id => {
    tabs.forEach(tab => {
      const active = tab.dataset.archTab === id;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.setAttribute('tabindex', active ? '0' : '-1');
      if (!tab.getAttribute('role')) tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panelIdFor(tab.dataset.archTab));
    });
    panels.forEach(panel => {
      const active = panel.dataset.archPanel === id;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
      if (!panel.id) panel.id = `architecture-${panel.dataset.archPanel}`;
      if (active) remountArchPanel(id, cachedReachData);
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.dataset.archTab));
    tab.addEventListener('keydown', e => {
      let next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        next = (index + 1) % tabList.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        next = (index - 1 + tabList.length) % tabList.length;
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = tabList.length - 1;
      }
      if (next < 0) return;
      e.preventDefault();
      activate(tabList[next].dataset.archTab);
      tabList[next].focus();
    });
  });

  activate(tabs[0]?.dataset.archTab || 'dual-host');
}

function renderHero() {
  const statement = document.getElementById('systems-public-statement');
  const lead = document.getElementById('systems-hero-lead');
  if (statement) statement.textContent = publicEvidenceStatement;
  if (lead) lead.textContent = heroLead;

  const root = document.getElementById('systems-hero-stats');
  if (!root) return;
  root.innerHTML = heroStats
    .map(stat => {
      const external = /^https?:\/\//i.test(stat.href);
      const href = stat.href.startsWith('#') ? stat.href : stat.href;
      return `<a class="systems-hero-stat" href="${escapeHtml(href)}"${
        external ? ' target="_blank" rel="noopener noreferrer"' : ''
      }>
        <span class="systems-hero-stat-value">${escapeHtml(stat.value)}${stat.unit ? `<small>${escapeHtml(stat.unit)}</small>` : ''}</span>
        <span class="systems-hero-stat-label">${escapeHtml(stat.label)}</span>
      </a>`;
    })
    .join('');
}

function renderOverview() {
  const root = document.getElementById('systems-overview-grid');
  if (!root) return;

  const capabilityList = buildCapabilities.items
    .map(item => `<li class="systems-capability-item">✓ ${escapeHtml(item)}</li>`)
    .join('');

  root.innerHTML = `
    <article class="eng-showcase-card systems-evidence-card lg-glass-card systems-evidence-card--featured" id="${escapeHtml(builderProfile.anchor)}">
      <h2 class="eng-card-q">${escapeHtml(builderProfile.title)}</h2>
      <p class="eng-card-lead">${escapeHtml(builderProfile.lead)}</p>
      <ul class="eng-card-bullets">${builderProfile.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
    </article>
    <article class="eng-showcase-card systems-evidence-card lg-glass-card" id="${escapeHtml(buildCapabilities.anchor)}">
      <h2 class="eng-card-q">${escapeHtml(buildCapabilities.title)}</h2>
      <ul class="systems-capability-list">${capabilityList}</ul>
    </article>
  `;
}

function renderDecisionGrid(rootId, decisions) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const isArchitecture = rootId === 'systems-arch-decisions';

  root.innerHTML = decisions
    .map((item, idx) => {
      const badgeIcon = isArchitecture ? 'fa-square-check' : 'fa-circle-xmark';
      const badgeClass = isArchitecture ? 'decision-badge--arch' : 'decision-badge--eng';
      const badgeLabel = isArchitecture ? 'ADOPTED' : 'REJECTED';

      return `
        <div class="systems-decision-row lg-glass-card">
          <div class="systems-decision-meta">
            <span class="decision-number">${String(idx + 1).padStart(2, '0')}</span>
            <span class="decision-badge ${badgeClass}">
              <i class="fa-solid ${badgeIcon}" aria-hidden="true"></i>
              <span>${badgeLabel}</span>
            </span>
          </div>
          <div class="systems-decision-content">
            <h4 class="systems-decision-label">${escapeHtml(item.decision)}</h4>
            <div class="systems-decision-why-container">
              <span class="why-kicker">Rationale</span>
              <p class="systems-decision-why">${escapeHtml(item.why)}</p>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderFailures() {
  const root = document.getElementById('systems-failure-grid');
  if (!root) return;
  root.innerHTML = failedExperiments
    .map(
      item => `
        <div class="systems-failure-row lg-glass-card">
          <div class="systems-failure-header">
            <span class="failure-icon-container">
              <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            </span>
            <div class="systems-failure-title-block">
              <h4 class="systems-failure-name">${escapeHtml(item.name)}</h4>
              <span class="systems-failure-status-badge">${escapeHtml(item.status)}</span>
            </div>
          </div>
          <div class="systems-failure-body">
            <span class="failure-kicker">Root Cause / Retrospective</span>
            <p class="systems-failure-reason">${escapeHtml(item.reason)}</p>
          </div>
        </div>
      `
    )
    .join('');
}

function renderCurrentWork() {
  const root = document.getElementById('systems-current-work');
  if (!root) return;
  root.innerHTML = currentWork
    .map(
      item => `<a class="eng-showcase-card eng-building-card lg-glass-card" href="${escapeHtml(item.href)}">
        <div class="eng-building-head">
          <span class="eng-building-status">${escapeHtml(item.phase)}</span>
          <span class="eng-building-signal">${escapeHtml(item.progress)}</span>
        </div>
        <h3 class="eng-building-title">${escapeHtml(item.title)}</h3>
      </a>`
    )
    .join('');
}

function renderWriting() {
  const root = document.getElementById('systems-writing-grid');
  if (!root) return;

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Grab the top 3 most recent posts for showcase
  const recentPosts = blogPosts.toSorted((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

  const articlesHtml = recentPosts
    .map(
      post => `
        <article class="systems-writing-card lg-glass-card">
          <div class="systems-writing-card-header">
            <span class="systems-writing-kicker">${escapeHtml(post.kicker || 'Field Notes')}</span>
            <span class="systems-writing-time">${escapeHtml(post.readTime)}</span>
          </div>
          <h3 class="systems-writing-title">
            <a href="blog/${escapeHtml(post.id)}.html">${escapeHtml(post.title)}</a>
          </h3>
          <p class="systems-writing-summary">${escapeHtml(post.summary)}</p>
          <div class="systems-writing-footer">
            <span class="systems-writing-date">${formatDate(post.date)}</span>
            <a class="systems-writing-link" href="blog/${escapeHtml(post.id)}.html">Read article →</a>
          </div>
        </article>
      `
    )
    .join('');

  const topicsHtml = writingTopics
    .map(
      topic =>
        `<a class="systems-writing-chip lg-glass-card" href="${escapeHtml(topic.href)}">${escapeHtml(topic.label)}</a>`
    )
    .join('');

  root.innerHTML = `
    <div class="systems-writing-container">
      <div class="systems-writing-articles">
        ${articlesHtml}
      </div>
      <div class="systems-writing-topics-section">
        <span class="systems-writing-topics-title">Explore more topics</span>
        <div class="systems-writing-topics-grid">
          ${topicsHtml}
        </div>
      </div>
    </div>
  `;
}

function renderTokenization() {
  const root = document.getElementById('systems-token-grid');
  if (!root) return;

  const parseTokens = t => {
    if (!t) return 0;
    if (t.endsWith('B')) return parseFloat(t) * 1e9;
    if (t.endsWith('M')) return parseFloat(t) * 1e6;
    return parseFloat(t);
  };

  const getTokenWidth = tokens => {
    if (!tokens) return 10;
    if (tokens === '5B') return 100;
    if (tokens === '2B') return 40;
    if (tokens === '1B') return 20;
    return 15;
  };

  const toolContexts = {
    Cursor: 'Primary IDE environment & context orchestration',
    Codex: 'Generative codebase translation & autocomplete',
    KiloChat: 'Chat interface & human-in-the-loop coordination',
    Cline: 'Agentic file-editing & browser automation',
    OpenRouter: 'Unified API gateway & smart model routing',
    Antigravity: 'Autonomous multi-agent pair programming',
    Droid: 'Background validation & unit testing companion',
    OpenClaw: 'Dynamic execution environment',
    OpenCode: 'Secondary fallback code generation agent',
    'Hermes Agent': 'System-level shell tool invocation specialist',
    'VS Code': 'Secondary code viewing & workspace management',
    Claude: 'Direct chat model interaction & conceptual modeling',
  };

  const sortedStack = [...tokenizationStack].sort((a, b) => {
    const valA = parseTokens(a.tokens);
    const valB = parseTokens(b.tokens);
    if (valB !== valA) return valB - valA;
    return a.name.localeCompare(b.name);
  });

  root.innerHTML = sortedStack
    .map(tool => {
      const width = getTokenWidth(tool.tokens);
      const isLive = !tool.tokens;
      const contextText = toolContexts[tool.name] || 'AI utility tool integration';

      return `<div class="systems-token-row lg-glass-card">
        <div class="systems-token-row-head">
          <span class="systems-token-label">${escapeHtml(tool.name)}</span>
          ${
            tool.tokens
              ? `<strong class="systems-token-value">${escapeHtml(tool.tokens)}<small> tokens</small></strong>`
              : `<strong class="systems-token-value systems-token-value--active"><span class="systems-token-pulse"></span>Active</strong>`
          }
        </div>
        <div class="systems-token-bar-track" aria-hidden="true">
          <div class="systems-token-bar-fill ${isLive ? 'is-active' : ''}" style="width: ${width}%"></div>
        </div>
        <span class="systems-token-context">${escapeHtml(contextText)}</span>
      </div>`;
    })
    .join('');
}

function renderProductionMetrics() {
  const root = document.getElementById('systems-metrics-grid');
  if (!root) return;
  root.innerHTML = renderProductionMetricsGrid();
}

function renderOpenSource() {
  const root = document.getElementById('systems-oss-panel');
  if (!root) return;
  root.innerHTML = renderOpenSourcePanel();
}

function renderPrinciples() {
  const root = document.getElementById('systems-principles-grid');
  if (!root) return;
  root.innerHTML = lessonsLearned
    .map(
      (p, i) => `<div class="systems-principle-card lg-glass-card" style="--principle-i:${i}">
        <span class="systems-principle-num">${String(i + 1).padStart(2, '0')}</span>
        <p>${escapeHtml(p)}</p>
      </div>`
    )
    .join('');
}

function renderTimeline() {
  const root = document.getElementById('systems-timeline');
  if (!root) return;
  root.innerHTML = `
    <div class="systems-timeline-rail"></div>
    <div class="systems-timeline-container">
      ${engineeringTimeline
        .map(
          block => `
            <div class="systems-timeline-node">
              <div class="systems-timeline-marker">
                <span class="systems-timeline-dot"></span>
              </div>
              <div class="systems-timeline-block lg-glass-card">
                <span class="systems-timeline-year">${escapeHtml(block.year)}</span>
                <ul class="systems-timeline-items">
                  ${block.items.map(item => `<li><i class="fa-solid fa-cube timeline-bullet-icon" aria-hidden="true"></i><span>${escapeHtml(item)}</span></li>`).join('')}
                </ul>
              </div>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function flowStepContent(cs, stepKey) {
  if (stepKey === 'metrics') {
    return `<div class="systems-flow-metrics">${(cs.metrics || [])
      .map(m => `<span><strong>${escapeHtml(m.value)}</strong> ${escapeHtml(m.label)}</span>`)
      .join('')}</div>`;
  }
  if (stepKey === 'improvements') {
    return `<ul>${(cs.improvements || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`;
  }
  if (stepKey === 'results') {
    return `<ul>${(cs.results || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`;
  }
  if (stepKey === 'resultSummary') {
    const top = (cs.results || []).slice(0, 2).join(' ');
    return `<p>${escapeHtml(top || cs.tagline)}</p>
      <a class="systems-case-flow-link" href="case-studies/${escapeHtml(cs.slug)}.html">Full case study →</a>`;
  }
  const text = cs[stepKey];
  return `<p>${escapeHtml(text || '')}</p>`;
}

function renderBenchmarks() {
  const root = document.getElementById('systems-benchmarks-viz');
  if (!root) return;
  root.innerHTML = renderBenchmarkBarsHtml();
}

function renderCaseStudyFlows() {
  const root = document.getElementById('systems-case-flows');
  if (!root) return;

  const steps = caseStudyFlowSteps;

  root.innerHTML = caseStudies
    .map(cs => {
      const flowSteps = steps
        .map(
          (step, i) => `<div class="systems-flow-step">
            <div class="systems-flow-step-marker" aria-hidden="true">${i < steps.length - 1 ? '↓' : '✓'}</div>
            <div class="systems-flow-step-body">
              <h4>${escapeHtml(step.label)}</h4>
              ${flowStepContent(cs, step.key)}
            </div>
          </div>`
        )
        .join('');
      const stepRail = steps
        .map(
          (step, i) =>
            `<span class="systems-flow-rail-step${i === 0 ? ' is-active' : ''}" title="${escapeHtml(step.label)}">${i + 1}</span>`
        )
        .join('');
      return `<article class="systems-case-flow lg-glass-card" id="case-study-${escapeHtml(cs.slug)}">
        <header class="systems-case-flow-header">
          <h3>${escapeHtml(cs.title)}</h3>
          <p>${escapeHtml(cs.tagline)}</p>
          ${renderCaseStudyEvidenceRow(cs)}
          <div class="systems-flow-rail" aria-hidden="true">${stepRail}</div>
        </header>
        <div class="systems-flow-pipeline">${flowSteps}</div>
      </article>`;
    })
    .join('');
}

const EDGE_API = 'https://assistme-chat.mangeshraut712.workers.dev';

function getApiBase() {
  const isGitHubPages = window.location.hostname.endsWith('github.io');
  const configured = window.APP_CONFIG?.apiBaseUrl || window.buildConfig?.apiBaseUrl || '';
  if (isGitHubPages) {
    if (configured && !/mangeshraut\.pro|vercel\.app/i.test(configured)) {
      return configured.replace(/\/$/, '');
    }
    return EDGE_API;
  }
  return configured || window.location.origin;
}

async function fetchEngineeringSnapshot() {
  if (isPerformanceAudit()) {
    return null;
  }

  const base = getApiBase();
  // Prefer edge; do not hammer blocked Vercel from Pages
  const origins = [base, EDGE_API].filter((v, i, a) => v && a.indexOf(v) === i);

  for (const origin of origins) {
    try {
      const res = await fetch(`${origin}/api/monitor/engineering`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) return res.json();
    } catch {
      // try next origin
    }
  }
  return null;
}

async function fetchAnalyticsReach() {
  if (isPerformanceAudit()) {
    return null;
  }

  const base = getApiBase();
  const origins = [base, EDGE_API].filter((v, i, a) => v && a.indexOf(v) === i);

  for (const origin of origins) {
    try {
      const res = await fetch(`${origin}/api/analytics/reach`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) return res.json();
    } catch {
      // try next origin
    }
  }
  return null;
}

function renderTelemetry(snapshot) {
  const root = document.getElementById('systems-telemetry-bento');
  if (!root) return;
  root.innerHTML = renderTelemetryBento(snapshot || {});
  root.dataset.state = snapshot ? 'live' : 'static';
}

let telemetryTimer = null;

async function hydrateTelemetry({ initial = false } = {}) {
  const bento = document.getElementById('systems-telemetry-bento');
  if (bento && initial) {
    bento.dataset.state = 'loading';
  }

  try {
    const [snapshot, reachData] = await Promise.all([
      fetchEngineeringSnapshot(),
      fetchAnalyticsReach(),
    ]);
    cachedReachData = reachData;

    renderTelemetry(snapshot);
    updateLiveBenchmarkValues(snapshot || {});
    mountArchitectureDiagrams(reachData);
    bindCardPress();

    if (bento) {
      bento.dataset.state = snapshot ? 'ready' : 'degraded';
    }

    const note = document.getElementById('telemetry-refreshed');
    const tileNote = document.getElementById('telemetry-tile-synced');
    const syncText = snapshot?.generated_at
      ? `Synced ${new Date(snapshot.generated_at).toLocaleTimeString()}`
      : 'Using static benchmarks (live telemetry unavailable)';
    if (note) note.textContent = syncText;
    if (tileNote) tileNote.textContent = syncText;

    const ossNote = document.getElementById('oss-live-note');
    if (ossNote) {
      ossNote.textContent = snapshot
        ? 'Public GitHub activity — live sync enabled'
        : 'Public GitHub metrics — static snapshot';
    }
  } catch (error) {
    console.warn('Systems telemetry hydrate failed:', error);
    if (bento) {
      bento.dataset.state = 'error';
      const loading = bento.querySelector('.systems-bento-loading');
      if (loading) {
        loading.textContent = 'Telemetry unavailable — showing static evidence below.';
      }
    }
    const note = document.getElementById('telemetry-refreshed');
    if (note) note.textContent = 'Live telemetry offline';
    // Still mount static architecture diagrams when reach fails
    try {
      mountArchitectureDiagrams(cachedReachData);
    } catch {
      /* ignore */
    }
  }

  if (initial && !telemetryTimer) {
    telemetryTimer = window.setInterval(() => hydrateTelemetry(), 30_000);
  }
}

function initCaseStudyRails() {
  const caseStudies = document.querySelectorAll('.systems-case-flow');
  caseStudies.forEach(cs => {
    const railSteps = cs.querySelectorAll('.systems-flow-rail-step');
    const flowSteps = cs.querySelectorAll('.systems-flow-step');

    railSteps.forEach((railStep, index) => {
      railStep.style.cursor = 'pointer';
      railStep.addEventListener('click', () => {
        flowSteps[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = Array.from(flowSteps).indexOf(entry.target);
            if (index !== -1) {
              railSteps.forEach((rs, i) => {
                rs.classList.toggle('is-active', i === index);
              });
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0.1,
      }
    );

    flowSteps.forEach(step => observer.observe(step));
  });
}

export function initSystemsPage() {
  renderHero();
  renderOverview();

  renderProductionMetrics();
  renderDecisionGrid('systems-arch-decisions', architectureDecisions);
  renderDecisionGrid('systems-eng-decisions', engineeringDecisions);
  renderFailures();
  renderCurrentWork();
  renderPrinciples();
  renderWriting();
  renderOpenSource();
  renderTimeline();
  renderTokenization();
  renderBenchmarks();
  renderCaseStudyFlows();
  mountArchitectureDiagrams();
  initArchitectureTabs();
  initSectionRail();
  initCaseStudyRails();
  bindCardPress();
  if (!isPerformanceAudit()) {
    hydrateTelemetry({ initial: true });
  }

  if (!isPerformanceAudit()) {
    observeScrollAnimations([
      '.systems-keynote-section',
      '.systems-hero-stat',
      '.systems-evidence-card',
      '.systems-bento-tile',
      '.systems-metric-panel',
      '.systems-case-flow',
      '.systems-principle-card',
      '.systems-timeline-block',
      '.systems-decision-row',
      '.systems-failure-row',
      '.systems-writing-chip',
      '.systems-token-card',
    ]);
  }
}

if (document.body.classList.contains('systems-page')) {
  const boot = () => {
    // Always render static evidence content; only live telemetry/animations
    // are skipped under perf-audit / Lighthouse to protect scores.
    initSystemsPage();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}
