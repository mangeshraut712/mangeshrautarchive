/**
 * Changelog page — github.blog/changelog feed pattern.
 * Solid Apple light/dark backgrounds.
 */

import {
  CHANGELOG_TAGS,
  CHANGELOG_TYPES,
  changelogEntries,
  getChangelogUpdatedAt,
  getCommitUrl,
} from '../data/changelog-entries.js';
import { escapeHtml } from '../utils/escape-html.js';
import './control-center.js';

const state = {
  type: 'all',
  tag: 'all',
  filtersOpen: false,
  collapsed: new Set(),
};

const TYPE_LABELS = {
  release: 'Release',
  improvement: 'Improvement',
  retired: 'Retired',
};

const TYPE_ICONS = {
  all: 'fa-border-all',
  release: 'fa-plus',
  improvement: 'fa-file-lines',
  retired: 'fa-triangle-exclamation',
};

function parseDate(iso) {
  const [y, m, d] = String(iso || '')
    .split('-')
    .map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDay(iso) {
  const date = parseDate(iso);
  if (!date) return iso;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** GitHub style: JUL.23 */
function formatEyebrowDay(iso) {
  const date = parseDate(iso);
  if (!date) return iso;
  const mon = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${mon}.${day}`;
}

function monthKey(iso) {
  const date = parseDate(iso);
  if (!date) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function monthSlug(label) {
  return `month-${String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

function tagLabel(id) {
  return CHANGELOG_TAGS.find(t => t.id === id)?.label || id;
}

function primaryArea(entry) {
  const first = (entry.tags || [])[0];
  return first ? tagLabel(first) : '';
}

function getVisibleEntries() {
  const visible = [];
  for (const entry of changelogEntries) {
    if (state.type !== 'all' && entry.type !== state.type) continue;
    if (state.tag !== 'all') {
      const tagSet = new Set(entry.tags || []);
      if (!tagSet.has(state.tag)) continue;
    }
    visible.push(entry);
  }
  return visible.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function groupByMonth(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const key = monthKey(entry.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return [...groups.entries()];
}

function syncFiltersPanel() {
  const panel = document.getElementById('changelog-filter-panel');
  const toggle = document.getElementById('changelog-filters-toggle');
  if (!panel || !toggle) return;
  panel.classList.toggle('is-open', state.filtersOpen);
  toggle.setAttribute('aria-expanded', state.filtersOpen ? 'true' : 'false');
  const count = state.tag === 'all' ? 0 : 1;
  toggle.innerHTML = `<i class="fas fa-filter" aria-hidden="true"></i><span>Filters${count ? ` (${count})` : ''}</span>`;
}

function renderMeta() {
  const updated = document.getElementById('changelog-updated');
  const count = document.getElementById('changelog-count');
  const iso = getChangelogUpdatedAt();
  if (updated && iso) {
    updated.textContent = `Updated ${formatDay(iso)}`;
    updated.setAttribute('datetime', iso);
  }
  if (count) {
    count.textContent = `${changelogEntries.length} updates`;
  }
}

function renderTypeFilters() {
  const el = document.getElementById('changelog-type-filters');
  if (!el) return;
  el.innerHTML = CHANGELOG_TYPES.map(type => {
    const active = state.type === type.id ? ' is-active' : '';
    const icon = TYPE_ICONS[type.id] || 'fa-circle';
    const label =
      type.id === 'release'
        ? 'New Releases'
        : type.id === 'improvement'
          ? 'Improvements'
          : type.label;
    return `
      <button
        type="button"
        class="changelog-chip changelog-chip--type changelog-chip--${escapeHtml(type.id)}${active}"
        data-type="${escapeHtml(type.id)}"
        aria-pressed="${state.type === type.id ? 'true' : 'false'}"
      >
        <i class="fas ${escapeHtml(icon)}" aria-hidden="true"></i>
        <span>${escapeHtml(label)}</span>
      </button>`;
  }).join('');
}

function renderTagFilters() {
  const el = document.getElementById('changelog-tag-filters');
  if (!el) return;
  const chips = [{ id: 'all', label: 'All areas' }, ...CHANGELOG_TAGS];
  el.innerHTML = chips
    .map(tag => {
      const active = state.tag === tag.id ? ' is-active' : '';
      return `
        <button
          type="button"
          class="changelog-chip changelog-chip--tag${active}"
          data-tag="${escapeHtml(tag.id)}"
          aria-pressed="${state.tag === tag.id ? 'true' : 'false'}"
        >
          ${escapeHtml(tag.label)}
        </button>`;
    })
    .join('');
}

function renderEntry(entry) {
  const area = primaryArea(entry);
  const commitUrl = getCommitUrl(entry.sha);
  const titleInner = commitUrl
    ? `<a class="changelog-entry__title-link" href="${escapeHtml(commitUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.title)}</a>`
    : escapeHtml(entry.title);
  const typeLabel = (TYPE_LABELS[entry.type] || entry.type).toUpperCase();

  return `
    <article class="changelog-entry" data-type="${escapeHtml(entry.type)}" data-id="${escapeHtml(entry.id)}">
      <div class="changelog-entry__meta">
        <time datetime="${escapeHtml(entry.date)}">${escapeHtml(formatEyebrowDay(entry.date))}</time>
        <span class="changelog-entry__badge">${escapeHtml(typeLabel)}</span>
      </div>
      <div class="changelog-entry__main">
        <h3 class="changelog-entry__title">${titleInner}</h3>
        ${area ? `<p class="changelog-entry__area">${escapeHtml(area)}</p>` : ''}
      </div>
    </article>`;
}

function renderTimeline() {
  const root = document.getElementById('changelog-timeline');
  const label = document.getElementById('changelog-results-label');
  if (!root) return;

  const entries = getVisibleEntries();
  if (label) {
    label.textContent =
      entries.length === 0
        ? 'No updates match these filters'
        : `Showing ${entries.length} update${entries.length === 1 ? '' : 's'}`;
  }

  if (entries.length === 0) {
    root.innerHTML = `
      <div class="changelog-empty" role="status">
        <p>Nothing matches right now.</p>
        <button type="button" class="changelog-chip is-active" data-reset-filters>Clear filters</button>
      </div>`;
    return;
  }

  root.innerHTML = groupByMonth(entries)
    .map(([month, monthEntries]) => {
      const id = monthSlug(month);
      const collapsed = state.collapsed.has(id) ? ' is-collapsed' : '';
      const expanded = state.collapsed.has(id) ? 'false' : 'true';
      return `
      <section class="changelog-month${collapsed}" id="${escapeHtml(id)}" aria-label="${escapeHtml(month)}">
        <button
          type="button"
          class="changelog-month__title"
          data-month-toggle="${escapeHtml(id)}"
          aria-expanded="${expanded}"
        >
          <span>${escapeHtml(month)}</span>
          <i class="fas fa-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="changelog-month__list">
          ${monthEntries.map(renderEntry).join('')}
        </div>
      </section>`;
    })
    .join('');
}

function bindEvents() {
  document.getElementById('changelog-type-filters')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-type]');
    if (!btn) return;
    state.type = btn.getAttribute('data-type') || 'all';
    renderTypeFilters();
    renderTimeline();
  });

  document.getElementById('changelog-tag-filters')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-tag]');
    if (!btn) return;
    state.tag = btn.getAttribute('data-tag') || 'all';
    renderTagFilters();
    syncFiltersPanel();
    renderTimeline();
  });

  document.getElementById('changelog-filters-toggle')?.addEventListener('click', () => {
    state.filtersOpen = !state.filtersOpen;
    syncFiltersPanel();
  });

  document.getElementById('changelog-timeline')?.addEventListener('click', event => {
    const reset = event.target.closest('[data-reset-filters]');
    if (reset) {
      state.type = 'all';
      state.tag = 'all';
      state.filtersOpen = false;
      renderTypeFilters();
      renderTagFilters();
      syncFiltersPanel();
      renderTimeline();
      return;
    }

    const toggle = event.target.closest('[data-month-toggle]');
    if (!toggle) return;
    const id = toggle.getAttribute('data-month-toggle');
    if (!id) return;
    if (state.collapsed.has(id)) state.collapsed.delete(id);
    else state.collapsed.add(id);
    const section = document.getElementById(id);
    if (section) {
      const collapsed = state.collapsed.has(id);
      section.classList.toggle('is-collapsed', collapsed);
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }
  });
}

export function initChangelogPage() {
  renderMeta();
  renderTypeFilters();
  renderTagFilters();
  syncFiltersPanel();
  renderTimeline();
  bindEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChangelogPage, { once: true });
} else {
  initChangelogPage();
}
