/**
 * Uses / Stack page — filterable Apple-style toolkit catalog.
 * Data: usesCatalog from portfolio-public-data.js
 */

import { usesCatalog, getUsesStats } from '../data/portfolio-public-data.js';
import './control-center.js';
import { escapeHtml } from '../utils/escape-html.js';

const state = {
  filter: 'all',
  query: '',
};

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function matchesQuery(item, category, query) {
  if (!query) return true;
  /* Match item fields only — category blurb would false-positive every item. */
  const hay = normalize([item.name, item.note, item.tag, category.label].filter(Boolean).join(' '));
  return hay.includes(query);
}

function getVisibleCatalog() {
  const query = normalize(state.query);
  return usesCatalog
    .filter(category => {
      /* Text scans every category; chip filter applies only when query is empty. */
      if (query) return true;
      return state.filter === 'all' || category.id === state.filter;
    })
    .map(category => ({
      ...category,
      items: category.items.filter(item => matchesQuery(item, category, query)),
    }))
    .filter(category => category.items.length > 0);
}

function renderStats() {
  const el = document.getElementById('uses-stats');
  if (!el) return;
  const stats = getUsesStats();
  el.innerHTML = [
    { label: 'Categories', value: stats.categories },
    { label: 'Tools', value: stats.tools },
    { label: 'Daily drivers', value: stats.featured },
    { label: 'Hosts', value: stats.platforms },
  ]
    .map(
      stat => `
      <div class="uses-stat">
        <span class="uses-stat__value">${escapeHtml(String(stat.value))}</span>
        <span class="uses-stat__label">${escapeHtml(stat.label)}</span>
      </div>`
    )
    .join('');
}

function renderFeatured() {
  const el = document.getElementById('uses-featured');
  if (!el) return;

  const featured = usesCatalog.flatMap(category =>
    category.items
      .filter(item => item.featured)
      .map(item => ({ ...item, category: category.label, categoryId: category.id }))
  );

  el.innerHTML = featured
    .map(
      item => `
      <article class="uses-featured-card" data-category="${escapeHtml(item.categoryId)}">
        <div class="uses-featured-card__meta">
          <span class="uses-pill uses-pill--accent">${escapeHtml(item.tag || 'Featured')}</span>
          <span class="uses-featured-card__cat">${escapeHtml(item.category)}</span>
        </div>
        <h3 class="uses-featured-card__name">${escapeHtml(item.name)}</h3>
        <p class="uses-featured-card__note">${escapeHtml(item.note || '')}</p>
      </article>`
    )
    .join('');
}

function renderFilters() {
  const el = document.getElementById('uses-filters');
  if (!el) return;

  const chips = [
    { id: 'all', label: 'All', icon: 'fa-border-all' },
    ...usesCatalog.map(category => ({
      id: category.id,
      label: category.label,
      icon: category.icon,
    })),
  ];

  el.innerHTML = chips
    .map(chip => {
      const active = state.filter === chip.id ? ' is-active' : '';
      return `
        <button
          type="button"
          class="uses-filter-chip${active}"
          data-filter="${escapeHtml(chip.id)}"
          aria-pressed="${state.filter === chip.id ? 'true' : 'false'}"
        >
          <i class="fas ${escapeHtml(chip.icon)}" aria-hidden="true"></i>
          <span>${escapeHtml(chip.label)}</span>
        </button>`;
    })
    .join('');
}

function renderItem(item) {
  const featured = item.featured ? '<span class="uses-pill uses-pill--soft">Daily</span>' : '';
  const tag = item.tag ? `<span class="uses-pill">${escapeHtml(item.tag)}</span>` : '';

  return `
    <li class="uses-item">
      <div class="uses-item__top">
        <h3 class="uses-item__name">${escapeHtml(item.name)}</h3>
        <div class="uses-item__tags">${featured}${tag}</div>
      </div>
      ${item.note ? `<p class="uses-item__note">${escapeHtml(item.note)}</p>` : ''}
    </li>`;
}

function renderGrid() {
  const root = document.getElementById('uses-grid');
  if (!root) return;

  const visible = getVisibleCatalog();
  if (!visible.length) {
    root.innerHTML = `
      <div class="uses-empty" role="status">
        <i class="fas fa-magnifying-glass" aria-hidden="true"></i>
        <strong>No tools match</strong>
        <p>Try another category or clear the search.</p>
        <button type="button" class="uses-empty__reset" data-uses-reset>Reset filters</button>
      </div>`;
    return;
  }

  root.innerHTML = visible
    .map(category => {
      return `
        <section class="uses-section" id="uses-${escapeHtml(category.id)}" data-category="${escapeHtml(category.id)}">
          <header class="uses-section__header">
            <div class="uses-section__title-row">
              <span class="uses-section-icon" aria-hidden="true"><i class="fas ${escapeHtml(category.icon)}"></i></span>
              <div>
                <h2>${escapeHtml(category.label)}</h2>
                <p class="uses-section__blurb">${escapeHtml(category.blurb || '')}</p>
              </div>
            </div>
            <span class="uses-section__count">${category.items.length}</span>
          </header>
          <ul class="uses-item-list">
            ${category.items.map(renderItem).join('')}
          </ul>
        </section>`;
    })
    .join('');
}

function updateResultsLabel() {
  const el = document.getElementById('uses-results-label');
  if (!el) return;
  const visible = getVisibleCatalog();
  const count = visible.reduce((sum, cat) => sum + cat.items.length, 0);
  const catLabel =
    state.filter === 'all'
      ? 'all categories'
      : usesCatalog.find(c => c.id === state.filter)?.label || state.filter;
  el.textContent = state.query
    ? `${count} tool${count === 1 ? '' : 's'} matching “${state.query}”`
    : `${count} tool${count === 1 ? '' : 's'} · ${catLabel}`;
}

function paint() {
  renderFilters();
  renderGrid();
  updateResultsLabel();
}

function bindChrome() {
  const search = document.getElementById('uses-search');
  const clear = document.getElementById('uses-search-clear');
  const filters = document.getElementById('uses-filters');
  const grid = document.getElementById('uses-grid');

  search?.addEventListener('input', event => {
    state.query = event.target.value || '';
    clear?.classList.toggle('is-visible', Boolean(state.query));
    paint();
  });

  clear?.addEventListener('click', () => {
    state.query = '';
    if (search) search.value = '';
    clear.classList.remove('is-visible');
    paint();
    search?.focus();
  });

  filters?.addEventListener('click', event => {
    const chip = event.target.closest('[data-filter]');
    if (!chip) return;
    state.filter = chip.dataset.filter || 'all';
    paint();
  });

  grid?.addEventListener('click', event => {
    if (event.target.closest('[data-uses-reset]')) {
      state.filter = 'all';
      state.query = '';
      if (search) search.value = '';
      clear?.classList.remove('is-visible');
      paint();
    }
  });

  document.getElementById('uses-featured')?.addEventListener('click', event => {
    const card = event.target.closest('[data-category]');
    if (!card) return;
    state.filter = card.dataset.category || 'all';
    paint();
    document.getElementById(`uses-${state.filter}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  });
}

export function initUsesPage() {
  if (!document.getElementById('uses-grid')) return;
  renderStats();
  renderFeatured();
  bindChrome();
  paint();
}

if (document.body.classList.contains('uses-page') || document.getElementById('uses-grid')) {
  initUsesPage();
}
