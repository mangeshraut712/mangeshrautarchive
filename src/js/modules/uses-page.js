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

export function initUsesPage() {
  const root = document.getElementById('uses-grid');
  if (!root) return;

  root.innerHTML = Object.entries(usesStack)
    .map(
      ([key, items]) => `<section class="uses-section lg-glass-card">
        <h2>${escapeHtml(labels[key] || key)}</h2>
        <ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>`
    )
    .join('');
}

if (document.body.classList.contains('systems-page') && document.getElementById('uses-grid')) {
  initUsesPage();
}
