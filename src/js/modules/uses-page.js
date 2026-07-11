import { usesStack } from './engineering-showcase-data.js';
import './control-center.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const labels = {
  hardware: 'Hardware',
  software: 'Software',
  aiStack: 'AI stack',
  engineering: 'Engineering',
  fonts: 'Fonts',
  theme: 'Theme',
  productivity: 'Productivity',
  reading: 'Reading',
};

const icons = {
  hardware: 'fa-laptop',
  software: 'fa-layer-group',
  aiStack: 'fa-robot',
  engineering: 'fa-gears',
  fonts: 'fa-font',
  theme: 'fa-palette',
  productivity: 'fa-bolt',
  reading: 'fa-book-open',
};

export function initUsesPage() {
  const root = document.getElementById('uses-grid');
  if (!root) return;

  root.innerHTML = Object.entries(usesStack)
    .map(([key, items]) => {
      const label = escapeHtml(labels[key] || key);
      const icon = icons[key] || 'fa-circle';
      return `<section class="uses-section lg-glass-card">
        <h2><span class="uses-section-icon" aria-hidden="true"><i class="fas ${icon}"></i></span>${label}</h2>
        <ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>`;
    })
    .join('');
}

if (document.body.classList.contains('systems-page') && document.getElementById('uses-grid')) {
  initUsesPage();
}
