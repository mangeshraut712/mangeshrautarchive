import { evidenceCards, staticBenchmarks } from './engineering-showcase-data.js';
import { observeScrollAnimations } from './scroll-animations.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bindEngCardPress(container) {
  if (!container || container.dataset.pressBound === 'true') return;
  container.dataset.pressBound = 'true';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  container.querySelectorAll('.eng-showcase-card').forEach(card => {
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

function cardTeaserText(card) {
  if (card.lead) return card.lead;
  if (card.bullets?.length) return card.bullets[0];
  return card.answer || '';
}

function renderEvidenceTeaserCards() {
  return evidenceCards
    .map(
      card => `<a class="eng-showcase-card eng-teaser-card lg-glass-card" href="systems.html#${escapeHtml(card.anchor)}">
        <p class="eng-card-q">${escapeHtml(card.question)}</p>
        <p class="eng-card-a">${escapeHtml(cardTeaserText(card))}</p>
      </a>`
    )
    .join('');
}

function renderMetricsTeaser() {
  const picks = staticBenchmarks.filter(b => !b.liveKey).slice(0, 3);
  return picks
    .map(
      b => `<div class="eng-metric-tile lg-glass-card">
        <span class="eng-metric-value">${escapeHtml(b.value)}<small>${escapeHtml(b.unit)}</small></span>
        <span class="eng-metric-label">${escapeHtml(b.label)}</span>
      </div>`
    )
    .join('');
}

export function renderEngineeringTeaser(root = document.getElementById('engineering-teaser-root')) {
  if (!root || root.dataset.rendered === 'true') return;
  root.dataset.rendered = 'true';

  root.innerHTML = `
    <div class="eng-teaser-hero-band lg-glass-card">
      <p class="eng-teaser-kicker">Verifiable engineering</p>
      <p class="eng-teaser-lead">Live metrics, architecture diagrams, case studies, and open telemetry — one evidence dashboard.</p>
      <div class="eng-teaser-metrics" aria-label="Engineering benchmarks preview">
        ${renderMetricsTeaser()}
      </div>
    </div>
    <div class="eng-teaser-evidence" aria-label="Portfolio evidence at a glance">
      ${renderEvidenceTeaserCards()}
    </div>
    <div class="eng-teaser-cta-wrap">
      <a class="eng-teaser-cta btn hero-cta" href="systems.html">
        Open engineering evidence
        <span aria-hidden="true">→</span>
      </a>
    </div>
  `;

  bindEngCardPress(root);
  observeScrollAnimations(['.eng-showcase-card', '.eng-metric-tile', '.eng-teaser-hero-band']);
}

export async function initEngineeringTeaser() {
  const root = document.getElementById('engineering-teaser-root');
  if (!root) return;
  renderEngineeringTeaser(root);
}
