import {
  evidenceCards,
  heroLead,
  heroStats,
  publicEvidenceStatement,
} from './engineering-showcase-data.js';
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
    .map(stat => {
      const external = /^https?:\/\//i.test(stat.href);
      const href = stat.href.startsWith('#') ? `systems.html${stat.href}` : stat.href;
      return `<a class="engineering-metric-item" href="${escapeHtml(href)}"${
        external ? ' target="_blank" rel="noopener noreferrer"' : ''
      }">
        <span class="engineering-metric-value">${escapeHtml(stat.value)}${stat.unit ? `<small>${escapeHtml(stat.unit)}</small>` : ''}</span>
        <span class="engineering-metric-label">${escapeHtml(stat.label)}</span>
      </a>`;
    })
    .join('');
}

function renderEvidenceCards() {
  return evidenceCards
    .map(card => {
      const href = card.href || `systems.html#${card.anchor || card.id}`;
      const body = card.answer
        ? `<p class="eng-card-a">${escapeHtml(card.answer)}</p>`
        : card.lead
          ? `<p class="eng-card-a">${escapeHtml(card.lead)}</p>`
          : '';
      return `<a class="engineering-evidence-card" href="${escapeHtml(href)}">
        <p class="eng-card-q">${escapeHtml(card.question)}</p>
        ${body}
      </a>`;
    })
    .join('');
}

export function renderEngineeringTeaser(root = document.getElementById('engineering-teaser-root')) {
  if (!root || root.dataset.rendered === 'true') return;
  root.dataset.rendered = 'true';
  root.setAttribute('aria-busy', 'false');

  root.innerHTML = `
    <div class="engineering-showcase-shell">
      <p class="engineering-public-statement">${escapeHtml(publicEvidenceStatement)}</p>
      <div class="engineering-quality-overview" aria-label="Engineering evidence highlights">
        <div class="engineering-overview-head">
          <div class="engineering-overview-title-wrap">
            <p class="engineering-eyebrow">Engineering Evidence</p>
            <p class="engineering-overview-lead">${escapeHtml(heroLead)}</p>
          </div>
        </div>
        <div class="engineering-metrics-inner" aria-label="Headline engineering metrics">
          ${renderHeroStatsTeaser()}
        </div>
      </div>

      <div class="engineering-evidence-grid" aria-label="Engineering evidence questions">
        ${renderEvidenceCards()}
      </div>

      <div class="engineering-cta-wrap">
        <a class="engineering-open-btn" href="systems.html">
          Open engineering notebook
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  `;

  observeScrollAnimations([
    '.engineering-quality-overview',
    '.engineering-evidence-card',
    '.engineering-metric-item',
    '.engineering-open-btn',
  ]);
}

export async function initEngineeringTeaser() {
  const root = document.getElementById('engineering-teaser-root');
  if (!root) return;
  renderEngineeringTeaser(root);
}
