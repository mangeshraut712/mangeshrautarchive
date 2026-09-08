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
      <article class="uses-featured-card" data-category="${escapeHtml(item.categoryId)}" tabindex="0" role="button">
        <div class="uses-featured-card__meta">
          <span class="uses-pill uses-pill--accent">${escapeHtml(item.tag || 'Featured')}</span>
          <span class="uses-featured-card__cat">${escapeHtml(item.category)}</span>
        </div>
        <h4 class="uses-featured-card__name">${escapeHtml(item.name)}</h4>
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
  const isDailyTag =
    String(item.tag || '')
      .trim()
      .toLowerCase() === 'daily';
  const featured = item.featured ? '<span class="uses-pill uses-pill--soft">Daily</span>' : '';
  const tag =
    item.tag && !(item.featured && isDailyTag)
      ? `<span class="uses-pill">${escapeHtml(item.tag)}</span>`
      : '';

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
                <h3>${escapeHtml(category.label)}</h3>
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

  const featuredEl = document.getElementById('uses-featured');
  const handleFeaturedActivation = event => {
    const card = event.target.closest('[data-category]');
    if (!card) return;
    state.filter = card.dataset.category || 'all';
    paint();
    document.getElementById(`uses-${state.filter}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };
  featuredEl?.addEventListener('click', handleFeaturedActivation);
  featuredEl?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFeaturedActivation(event);
    }
  });
}

function initKeynoteDeck() {
  const stage = document.getElementById('keynote-stage');
  const pillsContainer = document.getElementById('keynote-chapter-pills');
  if (!stage || !pillsContainer) return;
  if (stage.dataset.keynoteReady) return;
  stage.dataset.keynoteReady = 'true';

  const slides = Array.from(stage.querySelectorAll('.keynote-slide'));
  const pills = Array.from(pillsContainer.querySelectorAll('.keynote-chapter-pill'));
  const prevBtn = document.getElementById('keynote-prev-btn');
  const nextBtn = document.getElementById('keynote-next-btn');
  const counter = document.getElementById('keynote-slide-counter');

  if (!slides.length) return;

  let currentSlide = 0;

  function updateSlide(index, isInitial = false) {
    if (index < 0 || index >= slides.length) return;
    currentSlide = index;

    slides.forEach((slide, i) => {
      const isActive = i === currentSlide;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    pills.forEach((pill, i) => {
      const isActive = i === currentSlide;
      pill.classList.toggle('is-active', isActive);
      pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
      pill.setAttribute('tabindex', isActive ? '0' : '-1');
      if (isActive && !isInitial) {
        pillsContainer.scrollTo({
          left: pill.offsetLeft - pillsContainer.offsetWidth / 2 + pill.offsetWidth / 2,
          behavior: 'smooth',
        });
      }
    });

    if (counter) {
      const currentNum = String(currentSlide + 1).padStart(2, '0');
      const totalNum = String(slides.length).padStart(2, '0');
      counter.textContent = `Slide ${currentNum} of ${totalNum}`;
    }

    if (prevBtn) {
      prevBtn.disabled = currentSlide === 0;
      prevBtn.setAttribute('aria-disabled', currentSlide === 0 ? 'true' : 'false');
    }
    if (nextBtn) {
      nextBtn.disabled = currentSlide === slides.length - 1;
      nextBtn.setAttribute('aria-disabled', currentSlide === slides.length - 1 ? 'true' : 'false');
    }
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const idx = parseInt(pill.dataset.slideIndex, 10);
      if (!Number.isNaN(idx)) {
        updateSlide(idx);
      }
    });
  });

  prevBtn?.addEventListener('click', () => {
    if (currentSlide > 0) {
      updateSlide(currentSlide - 1);
    }
  });

  nextBtn?.addEventListener('click', () => {
    if (currentSlide < slides.length - 1) {
      updateSlide(currentSlide + 1);
    }
  });

  window.addEventListener('keydown', event => {
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') return;
    if (document.activeElement?.closest('.keynote-code-snippet, .uses-filters, [role="textbox"]'))
      return;

    if (event.key === 'ArrowRight') {
      if (currentSlide < slides.length - 1) {
        updateSlide(currentSlide + 1);
      }
    } else if (event.key === 'ArrowLeft') {
      if (currentSlide > 0) {
        updateSlide(currentSlide - 1);
      }
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  stage.addEventListener(
    'touchstart',
    e => {
      if (e.target.closest('.keynote-code-snippet')) return;
      touchStartTime = Date.now();
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true }
  );

  stage.addEventListener(
    'touchend',
    e => {
      if (Date.now() - touchStartTime > 800) return;
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0 && currentSlide < slides.length - 1) {
          updateSlide(currentSlide + 1);
        } else if (deltaX > 0 && currentSlide > 0) {
          updateSlide(currentSlide - 1);
        }
      }
    },
    { passive: true }
  );

  updateSlide(0, true);
}

export function initUsesPage() {
  if (!document.getElementById('uses-grid')) return;
  initKeynoteDeck();
  renderStats();
  renderFeatured();
  bindChrome();
  paint();
}

if (document.body.classList.contains('uses-page') || document.getElementById('uses-grid')) {
  initUsesPage();
}
