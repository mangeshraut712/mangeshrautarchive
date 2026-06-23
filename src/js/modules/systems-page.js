import {
  buildingItems,
  engineeringPrinciples,
  engineeringTimeline,
  evidenceCards,
  heroStats,
  learnedHighlights,
  nowBuilding,
  systemDesignTopics,
} from './engineering-showcase-data.js';
import { caseStudies } from './case-studies-data.js';
import { mountArchitectureDiagrams, remountArchPanel } from './systems-arch-diagrams.js';
import { observeScrollAnimations } from './scroll-animations.js';
import {
  renderBenchmarkBarsHtml,
  renderOpenSourcePanel,
  renderProductionMetricsGrid,
  renderTelemetryBento,
  updateLiveBenchmarkValues,
} from './systems-viz.js';

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
    '.eng-showcase-card, .systems-bento-tile, .systems-bench-row, .systems-arch-tab, .systems-metric-panel, .systems-now-card, .systems-case-flow, .systems-principle-card';
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
      if (active) {
        link.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
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
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      setActive(visible.target.id);
    },
    { rootMargin: '-22% 0px -58% 0px', threshold: [0, 0.15, 0.35, 0.55, 0.75] }
  );

  sections.forEach(section => observer.observe(section));

  const initialActive = rail.querySelector('a.is-active');
  if (initialActive) {
    requestAnimationFrame(() => {
      initialActive.scrollIntoView({ inline: 'center', block: 'nearest' });
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

function renderEvidence() {
  const root = document.getElementById('systems-evidence-grid');
  if (!root) return;

  root.innerHTML = evidenceCards
    .map((card, index) => {
      const links = card.links || (card.link ? [card.link] : []);
      const linksHtml = links.length
        ? `<div class="eng-card-links">${links
            .map(
              l =>
                `<a href="${escapeHtml(l.href)}"${l.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(l.label)}</a>`
            )
            .join('')}</div>`
        : '';

      let body = '';
      if (card.lead) {
        body += `<p class="eng-card-lead">${escapeHtml(card.lead)}</p>`;
      }
      if (card.bullets?.length) {
        body += `<ul class="eng-card-bullets">${card.bullets
          .map(b => `<li>${escapeHtml(b)}</li>`)
          .join('')}</ul>`;
      }
      if (card.checklist?.length) {
        body += `<ul class="systems-proof-checklist">${card.checklist
          .map(
            item =>
              `<li><a href="${escapeHtml(item.href)}"${item.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(item.label)}</a></li>`
          )
          .join('')}</ul>`;
      }
      if (!body && card.answer) {
        body = `<p class="eng-card-a">${escapeHtml(card.answer)}</p>`;
      }

      const featured = index === 0 ? ' systems-evidence-card--featured' : '';
      const proof = card.id === 'proof' ? ' systems-evidence-card--proof' : '';
      const span = card.id === 'what' || card.id === 'why' ? ' systems-evidence-card--half' : '';
      return `<article class="eng-showcase-card systems-evidence-card lg-glass-card systems-evidence-card--${escapeHtml(card.id)}${featured}${proof}${span}" id="${escapeHtml(card.anchor)}">
        <h2 class="eng-card-q">${escapeHtml(card.question)}</h2>
        ${body}
        ${linksHtml}
      </article>`;
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
  root.innerHTML = engineeringPrinciples
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

function renderNowBuilding() {
  const root = document.getElementById('systems-now-grid');
  if (!root) return;
  root.innerHTML = nowBuilding
    .map(item => {
      const meta = item.progress
        ? `<div class="systems-now-meta"><span>Progress</span><strong>${item.progress}%</strong></div>
           <div class="systems-now-progress" aria-hidden="true"><span style="width:${item.progress}%"></span></div>
           <div class="systems-now-meta"><span>Updated</span><strong>${escapeHtml(item.updated)}</strong></div>`
        : item.milestone
          ? `<div class="systems-now-meta"><span>Next milestone</span><strong>${escapeHtml(item.milestone)}</strong></div>`
          : `<div class="systems-now-meta"><span>Users</span><strong>${escapeHtml(item.users)}</strong></div>`;
      return `<a class="systems-now-card lg-glass-card" href="${escapeHtml(item.href)}">
        <div class="systems-now-head">
          <span class="eng-building-status">${escapeHtml(item.status)}</span>
          <span class="systems-now-label">Now</span>
        </div>
        <h3 class="eng-building-title">${escapeHtml(item.title)}</h3>
        ${meta}
      </a>`;
    })
    .join('');
}

function renderBuilding() {
  const root = document.getElementById('systems-building-grid');
  if (!root) return;
  root.innerHTML = buildingItems
    .map(
      item => `<a class="eng-showcase-card eng-building-card lg-glass-card" href="${escapeHtml(item.href)}">
        <div class="eng-building-head">
          <span class="eng-building-status">${escapeHtml(item.status)}</span>
          <span class="eng-building-signal">${escapeHtml(item.signal)}</span>
        </div>
        <h3 class="eng-building-title">${escapeHtml(item.title)}</h3>
        <p class="eng-building-summary">${escapeHtml(item.summary)}</p>
        <div class="eng-building-stack">${item.stack.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div>
      </a>`
    )
    .join('');
}

function renderLearned() {
  const root = document.getElementById('systems-learned-grid');
  if (!root) return;
  root.innerHTML = learnedHighlights
    .map(
      item => `<div class="eng-showcase-card eng-learned-card lg-glass-card">
        <span class="eng-learned-tag">${escapeHtml(item.tag)}</span>
        <p class="eng-learned-lesson">${escapeHtml(item.lesson)}</p>
      </div>`
    )
    .join('');
}

function renderBenchmarks() {
  const root = document.getElementById('systems-benchmarks-viz');
  if (!root) return;
  root.innerHTML = renderBenchmarkBarsHtml();
}

function renderSystemDesign() {
  const root = document.getElementById('systems-design-grid');
  if (!root) return;
  root.innerHTML = systemDesignTopics
    .map(
      t => `<a class="eng-showcase-card eng-design-card lg-glass-card" href="${escapeHtml(t.href)}">
        <h3 class="eng-design-title">${escapeHtml(t.title)}</h3>
        <p class="eng-design-problem">${escapeHtml(t.problem)}</p>
        <div class="eng-design-components">${t.components.map(c => `<span>${escapeHtml(c)}</span>`).join('')}</div>
      </a>`
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

function renderHeroStats() {
  const root = document.getElementById('systems-hero-stats');
  if (!root) return;
  root.innerHTML = heroStats
    .map(
      stat => `<a class="systems-hero-stat lg-glass-card" href="${escapeHtml(stat.href)}">
        <span class="systems-hero-stat-value">${escapeHtml(stat.value)}${stat.unit ? `<small>${escapeHtml(stat.unit)}</small>` : ''}</span>
        <span class="systems-hero-stat-label">${escapeHtml(stat.label)}</span>
      </a>`
    )
    .join('');
}

function renderCaseStudyFlows() {
  const root = document.getElementById('systems-case-flows');
  if (!root) return;

  const steps = [
    { key: 'problem', label: 'Problem' },
    { key: 'whyExistingFail', label: 'Constraints' },
    { key: 'approach', label: 'Architecture' },
    { key: 'tradeoffs', label: 'Tradeoffs' },
    { key: 'metrics', label: 'Benchmarks' },
    { key: 'improvements', label: 'Failures & gaps' },
    { key: 'results', label: 'Lessons' },
    { key: 'resultSummary', label: 'Result' },
  ];

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
  renderHeroStats();
  renderEvidence();
  renderProductionMetrics();
  renderOpenSource();
  renderPrinciples();
  renderTimeline();
  renderNowBuilding();
  renderBuilding();
  renderLearned();
  renderBenchmarks();
  renderSystemDesign();
  renderCaseStudyFlows();
  mountArchitectureDiagrams();
  initArchitectureTabs();
  initSectionRail();
  initCaseStudyRails();
  bindCardPress();
  hydrateTelemetry({ initial: true });

  observeScrollAnimations([
    '.systems-keynote-section',
    '.systems-hero-stat',
    '.systems-evidence-card',
    '.systems-bento-tile',
    '.systems-metric-panel',
    '.systems-case-flow',
    '.systems-now-card',
    '.systems-principle-card',
    '.systems-timeline-block',
  ]);
}

if (document.body.classList.contains('systems-page')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSystemsPage, { once: true });
  } else {
    initSystemsPage();
  }
}
