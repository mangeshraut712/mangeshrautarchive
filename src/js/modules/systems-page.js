import {
  architectureDecisions,
  builderProfile,
  buildCapabilities,
  caseStudyFlowSteps,
  currentWork,
  engineeringDecisions,
  engineeringTimeline,
  evidenceFooterLinks,
  failedExperiments,
  heroLead,
  heroStats,
  hiringEvidence,
  lessonsLearned,
  publicEvidenceStatement,
  writingTopics,
} from './engineering-showcase-data.js';
import { caseStudies, renderCaseStudyEvidenceRow } from './case-studies-data.js';
import { mountArchitectureDiagrams, remountArchPanel } from './systems-arch-diagrams.js';
import { observeScrollAnimations } from './scroll-animations.js';
import {
  renderBenchmarkBarsHtml,
  renderOpenSourcePanel,
  renderProductionMetricsGrid,
  renderProductionSnapshot,
  renderTelemetryBento,
  updateLiveBenchmarkValues,
} from './systems-viz.js';
import { isPerformanceAudit } from '../utils/perf-audit.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

  links.forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActive(href.slice(1));
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

function initArchitectureTabs() {
  const root = document.getElementById('systems-arch-stage');
  const tabs = document.querySelectorAll('[data-arch-tab]');
  const panels = document.querySelectorAll('[data-arch-panel]');
  if (!root || !tabs.length) return;

  const activate = id => {
    tabs.forEach(tab => {
      const active = tab.dataset.archTab === id;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach(panel => {
      const active = panel.dataset.archPanel === id;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
      if (active) remountArchPanel(id);
    });
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activate(tab.dataset.archTab));
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

function renderHiringEvidence() {
  const root = document.getElementById('systems-hiring-grid');
  if (!root) return;

  root.innerHTML = hiringEvidence
    .map(
      card => `<article class="eng-showcase-card systems-evidence-card lg-glass-card systems-hiring-card" id="${escapeHtml(card.anchor)}">
        <h2 class="eng-card-q">${escapeHtml(card.question)}</h2>
        <p class="eng-card-a">${escapeHtml(card.answer)}</p>
        <a class="systems-tile-link" href="${escapeHtml(card.href)}">See proof →</a>
      </article>`
    )
    .join('');
}

function renderDecisionGrid(rootId, decisions) {
  const root = document.getElementById(rootId);
  if (!root) return;
  root.innerHTML = decisions
    .map(
      item => `<div class="systems-decision-row lg-glass-card">
        <span class="systems-decision-label">${escapeHtml(item.decision)}</span>
        <span class="systems-decision-divider" aria-hidden="true">—</span>
        <span class="systems-decision-why">${escapeHtml(item.why)}</span>
      </div>`
    )
    .join('');
}

function renderFailures() {
  const root = document.getElementById('systems-failure-grid');
  if (!root) return;
  root.innerHTML = failedExperiments
    .map(
      item => `<div class="systems-failure-row lg-glass-card">
        <div class="systems-failure-head">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="systems-failure-status">${escapeHtml(item.status)}</span>
        </div>
        <p class="systems-failure-reason">${escapeHtml(item.reason)}</p>
      </div>`
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
  root.innerHTML = writingTopics
    .map(
      topic => `<a class="systems-writing-chip lg-glass-card" href="${escapeHtml(topic.href)}">${escapeHtml(topic.label)}</a>`
    )
    .join('');
}

function renderFooter() {
  const root = document.getElementById('systems-footer-links');
  if (!root) return;
  root.innerHTML = evidenceFooterLinks
    .map(link => {
      const external = Boolean(link.external);
      return `<a href="${escapeHtml(link.href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(link.label)}</a>`;
    })
    .join('');
}

function renderProductionSnapshotPanel() {
  const root = document.getElementById('systems-production-snapshot');
  if (!root) return;
  root.innerHTML = renderProductionSnapshot();
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
  root.innerHTML = engineeringTimeline
    .map(
      block => `<div class="systems-timeline-block">
        <span class="systems-timeline-year">${escapeHtml(block.year)}</span>
        <ul class="systems-timeline-items">${block.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </div>`
    )
    .join('');
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

function getApiBase() {
  const isGitHubPages = window.location.hostname.endsWith('github.io');
  if (isGitHubPages) return 'https://mangeshraut.pro';
  return window.APP_CONFIG?.apiBaseUrl || window.location.origin;
}

async function fetchEngineeringSnapshot() {
  if (isPerformanceAudit()) {
    return null;
  }

  const base = getApiBase();
  const origins = [base, 'https://mangeshraut.pro', 'https://mraut.vercel.app'].filter(
    (v, i, a) => a.indexOf(v) === i
  );

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

function renderTelemetry(snapshot) {
  const root = document.getElementById('systems-telemetry-bento');
  if (!root) return;
  root.innerHTML = renderTelemetryBento(snapshot || {});
  root.dataset.state = snapshot ? 'live' : 'static';
}

let telemetryTimer = null;

async function hydrateTelemetry({ initial = false } = {}) {
  const snapshot = await fetchEngineeringSnapshot();
  renderTelemetry(snapshot);
  updateLiveBenchmarkValues(snapshot || {});
  bindCardPress();

  const note = document.getElementById('telemetry-refreshed');
  const tileNote = document.getElementById('telemetry-tile-synced');
  const syncText = snapshot?.generated_at
    ? `Synced ${new Date(snapshot.generated_at).toLocaleTimeString()}`
    : '';
  if (note && syncText) note.textContent = syncText;
  if (tileNote && syncText) tileNote.textContent = syncText;

  const ossNote = document.getElementById('oss-live-note');
  if (ossNote) {
    ossNote.textContent = snapshot
      ? 'Public GitHub activity — live sync enabled'
      : 'Public GitHub metrics — static snapshot';
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
  renderProductionSnapshotPanel();
  renderProductionMetrics();
  renderHiringEvidence();
  renderDecisionGrid('systems-arch-decisions', architectureDecisions);
  renderDecisionGrid('systems-eng-decisions', engineeringDecisions);
  renderFailures();
  renderCurrentWork();
  renderPrinciples();
  renderWriting();
  renderOpenSource();
  renderTimeline();
  renderFooter();
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
    ]);
  }
}

if (document.body.classList.contains('systems-page')) {
  const boot = () => {
    if (isPerformanceAudit()) return;
    initSystemsPage();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}
