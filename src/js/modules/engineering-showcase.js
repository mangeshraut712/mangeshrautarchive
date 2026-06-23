import { heroStats } from './engineering-showcase-data.js';
import { observeScrollAnimations } from './scroll-animations.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHeroStatsTeaser() {
  return heroStats
    .map(
      stat => `<a class="engineering-metric-item" href="systems.html${escapeHtml(stat.href)}">
        <span class="engineering-metric-value">${escapeHtml(stat.value)}${stat.unit ? `<small>${escapeHtml(stat.unit)}</small>` : ''}</span>
        <span class="engineering-metric-label">${escapeHtml(stat.label)}</span>
      </a>`
    )
    .join('');
}

export function renderEngineeringTeaser(root = document.getElementById('engineering-teaser-root')) {
  if (!root || root.dataset.rendered === 'true') return;
  root.dataset.rendered = 'true';

  root.innerHTML = `
    <div class="engineering-showcase-shell">
      <div class="engineering-quality-overview" aria-label="Engineering highlights">
        <div class="engineering-overview-head">
          <div class="engineering-overview-title-wrap">
            <p class="engineering-eyebrow">Engineering Evidence</p>
            <h3 class="engineering-overview-title">Verifiable metrics, architecture, and case studies</h3>
          </div>
          <p class="engineering-overview-caption">
            Open the full engineering dashboard for live telemetry, diagrams, benchmarks, and case-study depth.
          </p>
        </div>
        <div class="engineering-metrics-inner" aria-label="Headline engineering metrics">
          ${renderHeroStatsTeaser()}
        </div>
      </div>

      <div class="engineering-cta-wrap">
        <a class="engineering-open-btn" href="systems.html">
          Open engineering dashboard
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  `;

  observeScrollAnimations([
    '.engineering-quality-overview',
    '.engineering-metric-item',
    '.engineering-open-btn',
  ]);
}

export async function initEngineeringTeaser() {
  const root = document.getElementById('engineering-teaser-root');
  if (!root) return;
  renderEngineeringTeaser(root);
}
