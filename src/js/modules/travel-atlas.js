/**
 * Travel Atlas — Apple Maps-inspired visited-place atlas.
 * The map shows red visited pins only; the sidebar carries place intelligence.
 */

import { createTravelNarrative } from '../data/travel-engine.js';
import { travelData as rawTravelData } from '../data/travel-locations.js';

const travelData = createTravelNarrative(rawTravelData);
const VISITED_PIN_COLOR = '#ff3b30';
const MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
const MAPLIBRE_JS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
const mapWarningMessages = new Set();
const htmlEntities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const state = {
  map: null,
  ready: false,
  activeIndex: null,
  activeCountry: null,
  searchTerm: '',
  featuredOnly: false,
  visibleIndexes: [],
  tourTimer: null,
  themeObserver: null,
  activeCategories: new Set(),
  advancedSearchExpanded: false,
};

function waypointColor() {
  return VISITED_PIN_COLOR;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => htmlEntities[char]);
}

function safeExternalUrl(value) {
  const url = String(value || '').trim();
  if (!/^https?:\/\//i.test(url)) return '';
  return escapeHtml(url);
}

function hasMatchingCategories(waypoint) {
  if (state.activeCategories.size === 0) return true;

  const waypointCategories = new Set();

  // Add categories from bestFor
  waypoint.editorial.bestFor.forEach(category => {
    const normalized = normalize(category);
    if (normalized.includes('food') || normalized.includes('restaurant') || normalized.includes('cuisine')) {
      waypointCategories.add('food');
    }
    if (normalized.includes('culture') || normalized.includes('art') || normalized.includes('museum') || normalized.includes('music')) {
      waypointCategories.add('culture');
    }
    if (normalized.includes('nature') || normalized.includes('park') || normalized.includes('beach') || normalized.includes('mountain')) {
      waypointCategories.add('nature');
    }
    if (normalized.includes('urban') || normalized.includes('city') || normalized.includes('architecture')) {
      waypointCategories.add('urban');
    }
    if (normalized.includes('history') || normalized.includes('heritage') || normalized.includes('monument')) {
      waypointCategories.add('history');
    }
  });

  // Add categories from thingsToDo
  waypoint.editorial.thingsToDo.forEach(item => {
    const category = normalize(item.category);
    if (category.includes('food') || category.includes('restaurant') || category.includes('cafe')) {
      waypointCategories.add('food');
    }
    if (category.includes('culture') || category.includes('museum') || category.includes('art') || category.includes('theater')) {
      waypointCategories.add('culture');
    }
    if (category.includes('nature') || category.includes('park') || category.includes('hike') || category.includes('beach')) {
      waypointCategories.add('nature');
    }
    if (category.includes('urban') || category.includes('city') || category.includes('architecture')) {
      waypointCategories.add('urban');
    }
    if (category.includes('history') || category.includes('fort') || category.includes('palace') || category.includes('temple')) {
      waypointCategories.add('history');
    }
  });

  // Check if any active category matches
  for (const activeCategory of state.activeCategories) {
    if (waypointCategories.has(activeCategory)) {
      return true;
    }
  }

  return false;
}

function getFilteredWaypoints() {
  const term = normalize(state.searchTerm);

  return travelData.waypoints
    .map((waypoint, index) => ({ waypoint, index }))
    .filter(({ waypoint }) => {
      const matchesCountry = !state.activeCountry || waypoint.locality.country === state.activeCountry;
      const matchesFeatured = !state.featuredOnly || waypoint.editorial.featured;
      const matchesCategories = state.activeCategories.size === 0 || hasMatchingCategories(waypoint);

      const haystack = [
        waypoint.title,
        waypoint.locality.placeName,
        waypoint.locality.originalName,
        waypoint.locality.placeKind,
        waypoint.locality.region,
        waypoint.locality.country,
        waypoint.editorial.experience,
        waypoint.editorial.culturalSignificance,
        waypoint.editorial.guideSummary,
        ...waypoint.editorial.bestFor,
        ...waypoint.editorial.neighborhoods,
        ...waypoint.editorial.mustSee,
        ...waypoint.editorial.thingsToDo.map(item => `${item.title} ${item.category} ${item.summary}`),
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !term || haystack.includes(term);

      return matchesCountry && matchesFeatured && matchesSearch && matchesCategories;
    })
    .sort((a, b) => {
      // Prioritize search scores
      const scoreDiff = getSearchScore(b.waypoint, term) - getSearchScore(a.waypoint, term);
      if (scoreDiff !== 0) return scoreDiff;

      // Organize country wise
      const countryA = a.waypoint.locality.country;
      const countryB = b.waypoint.locality.country;
      if (countryA < countryB) return -1;
      if (countryA > countryB) return 1;

      // Keep chronological within the same country
      return a.index - b.index;
    });
}

function getSearchScore(waypoint, term) {
  if (!term) return 0;

  const title = normalize(waypoint.title);
  const placeName = normalize(waypoint.locality.placeName);
  const originalName = normalize(waypoint.locality.originalName);
  const placeKind = normalize(waypoint.locality.placeKind);

  if (title === term || placeName === term || originalName === term) return 100;
  if (title.startsWith(term) || placeName.startsWith(term) || originalName.startsWith(term)) return 80;
  if (placeName.includes(term) || originalName.includes(term)) return 65;
  if (placeKind.includes(term)) return 45;
  if (waypoint.editorial.mustSee.some(item => normalize(item).includes(term))) return 30;
  if (waypoint.editorial.thingsToDo.some(item => normalize(item.title).includes(term))) return 20;
  return 0;
}

function populateStats() {
  const { summary } = travelData;
  document.getElementById('stat-countries').textContent = summary.countries;
  document.getElementById('stat-cities').textContent = summary.cities;
  document.getElementById('stat-places').textContent = summary.waypointCount;
  document.getElementById('stat-regions').textContent = summary.regions;
}

function hasActiveFilters() {
  return (
    Boolean(state.searchTerm) ||
    Boolean(state.activeCountry) ||
    state.featuredOnly ||
    state.activeCategories.size > 0
  );
}

function updateResultsSummary(filtered) {
  const el = document.getElementById('travel-results-summary');
  if (!el) return;

  const total = travelData.waypoints.length;
  const count = filtered.length;
  const parts = [];

  if (state.activeCountry) parts.push(state.activeCountry);
  if (state.searchTerm) parts.push(`"${state.searchTerm.trim()}"`);
  if (state.featuredOnly) parts.push('featured');
  if (state.activeCategories.size > 0) parts.push([...state.activeCategories].join(', '));

  el.textContent = hasActiveFilters()
    ? `${count} of ${total} places shown · ${parts.join(' · ')}`
    : `${total} places across ${travelData.summary.countries} countries · city guides, landmarks, and local highlights`;
}

function applyFilterChange({ focusSearch = false } = {}) {
  stopTour();
  syncFilterControls();
  renderCountryChapters();
  renderTimeline();
  fitMapToVisiblePlaces();

  if (focusSearch) {
    document.getElementById('place-search')?.focus();
  }
}

function syncFilterControls() {
  const search = document.getElementById('place-search');
  const clear = document.getElementById('clear-place-search');
  const featured = document.getElementById('featured-toggle');
  const advancedToggle = document.getElementById('toggle-advanced-search');
  const advancedContent = document.getElementById('advanced-search-content');

  if (search) search.value = state.searchTerm;
  clear?.classList.toggle('visible', Boolean(state.searchTerm));
  featured?.classList.toggle('active', state.featuredOnly);
  featured?.setAttribute('aria-pressed', String(state.featuredOnly));
  advancedToggle?.setAttribute('aria-expanded', String(state.advancedSearchExpanded));
  advancedContent?.classList.toggle('expanded', state.advancedSearchExpanded);

  document.querySelectorAll('.country-pill').forEach(item => {
    const isActive = item.dataset.country === state.activeCountry;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-pressed', String(isActive));
  });

  document.querySelectorAll('.travel-filter-chip').forEach(chip => {
    const isActive = state.activeCategories.has(chip.dataset.category);
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-pressed', String(isActive));
  });
}

function resetFilters({ focusSearch = false } = {}) {
  state.activeCountry = null;
  state.searchTerm = '';
  state.featuredOnly = false;
  state.activeCategories.clear();
  state.advancedSearchExpanded = false;
  applyFilterChange({ focusSearch });
}

function renderCountryPills() {
  const el = document.getElementById('country-pills');
  el.innerHTML = travelData.countryChapters
    .map(
      country => `
        <button class="country-pill" data-country="${escapeHtml(country.name)}" title="${escapeHtml(country.mood)}" aria-pressed="false">
          <span>${escapeHtml(country.emoji)} ${escapeHtml(country.name)}</span>
          <strong>${country.cityCount}</strong>
        </button>`
    )
    .join('');

  el.addEventListener('click', event => {
    const pill = event.target.closest('.country-pill');
    if (!pill) return;

    state.activeCountry = state.activeCountry === pill.dataset.country ? null : pill.dataset.country;
    applyFilterChange();
  });
}

function renderCountryChapters() {
  const el = document.getElementById('country-chapters');
  if (!el) return;

  const hasActiveResultFilter =
    Boolean(state.searchTerm) || state.featuredOnly || state.activeCategories.size > 0;
  const visibleCountries = hasActiveResultFilter
    ? new Set(getFilteredWaypoints().map(({ waypoint }) => waypoint.locality.country))
    : null;

  const chapters = state.activeCountry
    ? travelData.countryChapters.filter(country => country.name === state.activeCountry)
    : travelData.countryChapters.filter(country => !visibleCountries || visibleCountries.has(country.name));

  el.innerHTML = chapters
    .map(
      chapter => `
        <article class="country-chapter">
          <div class="country-chapter__mark">${escapeHtml(chapter.emoji)}</div>
          <div>
            <h3>${escapeHtml(chapter.name)}</h3>
            <p>${escapeHtml(chapter.mood)}</p>
            <span>${chapter.cityCount} cities · ${chapter.placeCount} places · ${chapter.regionCount} regions</span>
          </div>
        </article>`
    )
    .join('');
}

function renderTimeline() {
  const el = document.getElementById('travel-timeline');
  const filtered = getFilteredWaypoints();
  state.visibleIndexes = filtered.map(item => item.index);
  updateResultsSummary(filtered);

  if (!state.visibleIndexes.includes(state.activeIndex)) {
    state.activeIndex = null;
    clearActiveMarker();
  }

  if (!filtered.length) {
    el.innerHTML = `
      <div class="travel-empty-state">
        <i class="fas fa-location-dot" aria-hidden="true"></i>
        <strong>No places match</strong>
        <span>Try another country or search term.</span>
        <button class="travel-empty-state__reset" type="button" data-reset-travel>Reset filters</button>
      </div>`;
    updateMapPointVisibility();
    return;
  }

  let currentGroupCountry = null;
  el.innerHTML = filtered
    .map(({ waypoint, index }) => {
      const countryGroupHeader = waypoint.locality.country !== currentGroupCountry
        ? `<div class="travel-timeline__country-header"><h3>${escapeHtml(waypoint.locality.emoji)} ${escapeHtml(waypoint.locality.country)}</h3></div>`
        : '';
      currentGroupCountry = waypoint.locality.country;
      return renderStopCard(waypoint, index, countryGroupHeader);
    })
    .join('');

  if (el.dataset.bound !== 'true') {
    el.dataset.bound = 'true';
    el.addEventListener('click', event => {
      const reset = event.target.closest('[data-reset-travel]');
      if (reset) {
        resetFilters({ focusSearch: true });
        return;
      }

      const stop = event.target.closest('.travel-stop');
      if (!stop) return;
      stopTour();
      setActive(Number(stop.dataset.index));
    });

    el.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const stop = event.target.closest('.travel-stop');
      if (!stop) return;
      event.preventDefault();
      stopTour();
      setActive(Number(stop.dataset.index));
    });
  }

  updateStopA11y();
  updateMapPointVisibility();
}

function renderStopCard(waypoint, index, countryGroupHeader) {
  const activeClass = index === state.activeIndex ? ' active' : '';
  const homeBadge = waypoint.editorial.homeBase
    ? '<span class="travel-stop__home-badge"><i class="fas fa-house" aria-hidden="true"></i> Home Base</span>'
    : '';
  const placeContext = waypoint.locality.placeName
    ? `<div class="travel-stop__place-name">${escapeHtml(waypoint.locality.placeKind || 'Place')} · ${escapeHtml(waypoint.locality.placeName)}</div>`
    : '';
  const wikiImage = waypoint.editorial.wikiImage
    ? `<img class="travel-stop__image loaded" src="${safeExternalUrl(waypoint.editorial.wikiImage)}" alt="${escapeHtml(waypoint.title)}" loading="lazy" referrerpolicy="no-referrer" />`
    : '';
  const wikiSummary = waypoint.editorial.wikiSummary || 'Select this place to load concise local context.';

  return `
    ${countryGroupHeader}
    <article class="travel-stop${activeClass}" role="button" tabindex="0" aria-expanded="${index === state.activeIndex}" data-index="${index}" data-city="${escapeHtml(waypoint.locality.city)}" data-country="${escapeHtml(waypoint.locality.country)}" style="--stop-color: ${waypointColor()}">
      <div class="travel-stop__dot"></div>
      <div class="travel-stop__order">${escapeHtml(waypoint.locality.region)}, ${escapeHtml(waypoint.locality.country)} ${homeBadge}</div>
      <h3 class="travel-stop__name">${escapeHtml(waypoint.title)}</h3>
      ${placeContext}
      <div class="travel-stop__tagline">${escapeHtml(waypoint.editorial.experience)}</div>
      <div class="travel-stop__details">
        ${wikiImage}
        <p class="travel-stop__story">${escapeHtml(wikiSummary)}</p>
        <div class="travel-stop__detail-section">
          <div class="travel-stop__detail-label">Why Visit</div>
          <div class="travel-stop__detail-text">${escapeHtml(waypoint.editorial.whyVisit)}</div>
        </div>
        <div class="travel-stop__detail-section">
          <div class="travel-stop__detail-label">Must See</div>
          <div class="travel-stop__detail-text">${escapeHtml(waypoint.editorial.mustSee.join(', '))}</div>
        </div>
        ${renderPlaceGuide(waypoint)}
      </div>
    </article>`;
}

function renderPlaceGuide(waypoint) {
  const { editorial } = waypoint;
  if (!editorial.thingsToDo.length) return '';

  const chips = [...editorial.bestFor, ...editorial.neighborhoods]
    .slice(0, 10)
    .map(item => `<span>${escapeHtml(item)}</span>`)
    .join('');

  const cards = editorial.thingsToDo
    .map(item => {
      const image = safeExternalUrl(item.image);
      const sourceUrl = safeExternalUrl(item.sourceUrl);

      return `
        <article class="place-guide-card${image ? '' : ' place-guide-card--image-missing'}">
          ${image ? `<img src="${image}" alt="${escapeHtml(item.title)} in ${escapeHtml(waypoint.title)}" loading="lazy" referrerpolicy="no-referrer" />` : ''}
          <div class="place-guide-card__body">
            <div class="place-guide-card__meta">${escapeHtml(item.category)}</div>
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.summary)}</p>
            ${sourceUrl ? `<a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.source)}</a>` : ''}
          </div>
        </article>`;
    })
    .join('');

  return `
    <section class="place-guide" aria-label="${waypoint.title} destination guide">
      <div class="place-guide__header">
        <div>
          <div class="travel-stop__detail-label">City Guide</div>
          <p>${escapeHtml(editorial.guideSummary)}</p>
        </div>
      </div>
      <div class="place-guide__chips">${chips}</div>
      <div class="place-guide__cards">${cards}</div>
    </section>`;
}

function bindFilters() {
  const search = document.getElementById('place-search');
  const clear = document.getElementById('clear-place-search');
  const featured = document.getElementById('featured-toggle');
  const tour = document.getElementById('spotlight-tour');
  const reset = document.getElementById('reset-travel-filters');
  const advancedToggle = document.getElementById('toggle-advanced-search');
  const advancedContent = document.getElementById('advanced-search-content');
  const categoryChips = document.querySelectorAll('.travel-filter-chip');

  search?.addEventListener('input', event => {
    state.searchTerm = event.target.value;
    applyFilterChange();
  });

  clear?.addEventListener('click', () => {
    state.searchTerm = '';
    search.value = '';
    applyFilterChange({ focusSearch: true });
  });

  featured?.addEventListener('click', () => {
    state.featuredOnly = !state.featuredOnly;
    applyFilterChange();
  });

  tour?.addEventListener('click', () => {
    if (state.tourTimer) {
      stopTour();
      return;
    }
    startTour();
  });

  reset?.addEventListener('click', () => {
    resetFilters({ focusSearch: true });
  });

  // Advanced search toggle
  advancedToggle?.addEventListener('click', () => {
    state.advancedSearchExpanded = !state.advancedSearchExpanded;
    advancedToggle.setAttribute('aria-expanded', String(state.advancedSearchExpanded));
    advancedContent?.classList.toggle('expanded', state.advancedSearchExpanded);
  });

  // Category filter chips
  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const category = chip.dataset.category;
      if (state.activeCategories.has(category)) {
        state.activeCategories.delete(category);
      } else {
        state.activeCategories.add(category);
      }
      applyFilterChange();
    });
  });
}

// Wiki data cache for performance
const wikiCache = new Map();

async function fetchWikiData(waypoint, stopElement) {
  // If we already have the data in the waypoint, just apply it
  if (waypoint.editorial.wikiLoaded) {
    applyWikiData({
      page: {
        thumbnail: waypoint.editorial.wikiImage ? { source: waypoint.editorial.wikiImage } : null,
        extract: waypoint.editorial.wikiSummary
      }
    }, stopElement, waypoint);
    return;
  }

  if (stopElement.dataset.wikiLoaded === 'true') return;
  stopElement.dataset.wikiLoaded = 'true';

  const cacheKey = `${waypoint.title}-${waypoint.locality.country}`;
  if (wikiCache.has(cacheKey)) {
    const cachedData = wikiCache.get(cacheKey);
    applyWikiData(cachedData, stopElement);
    return;
  }

  // Add loading state
  const story = stopElement.querySelector('.travel-stop__story');
  if (story) {
    story.innerHTML = '<span class="loading-dots">Loading insights</span>';
  }

  try {
    const queries = [
      `${waypoint.title} ${waypoint.locality.country} ${waypoint.editorial.highlight || ''}`.trim(),
      `${waypoint.title} ${waypoint.locality.country} landmark`,
      `${waypoint.title} ${waypoint.locality.country}`
    ];

    const queryPromises = queries.map(async q => {
      const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=1&prop=pageimages|extracts&exintro=1&explaintext=1&pithumbsize=800`;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.query && data.query.pages) {
          const pageId = Object.keys(data.query.pages)[0];
          return data.query.pages[pageId];
        }
      } catch (_e) {
        return null;
      }
      return null;
    });

    const results = await Promise.all(queryPromises);
    const bestPage = results.find(p => p && p.thumbnail && p.thumbnail.source) || results.find(p => p);

    const wikiData = { page: bestPage };
    wikiCache.set(cacheKey, wikiData);
    applyWikiData(wikiData, stopElement, waypoint);
  } catch (_e) {
    console.error('Failed to fetch wiki for', waypoint.title);
    // Reset loading state on error
    if (story) {
      story.textContent = 'Loading local insights...';
    }
  }
}

function applyWikiData(wikiData, stopElement, waypoint) {
  const { page } = wikiData;

  if (page) {
    if (page.thumbnail && page.thumbnail.source) {
      waypoint.editorial.wikiImage = page.thumbnail.source;
      const img = stopElement.querySelector('.travel-stop__image');
      if (img) {
        img.src = page.thumbnail.source;
        img.style.display = 'block';
        img.classList.add('loaded');
        img.style.cursor = 'pointer';
        // Check if listener already exists or re-bind
        img.onclick = () => openPhotoGallery(stopElement, 0);
      }
    }

    if (page.extract) {
      let shortText = page.extract;
      const sentences = shortText.split('. ');
      if (sentences.length > 2) {
        shortText = sentences.slice(0, 2).join('. ') + '.';
      }
      waypoint.editorial.wikiSummary = shortText;
      const story = stopElement.querySelector('.travel-stop__story');
      if (story) {
        story.textContent = shortText;
      }
    }
    waypoint.editorial.wikiLoaded = true;
  } else {
    waypoint.editorial.wikiSummary = 'Local insights not available';
    waypoint.editorial.wikiLoaded = true;
    const story = stopElement.querySelector('.travel-stop__story');
    if (story) {
      story.textContent = 'Local insights not available';
    }
  }
}

function getPhotoGallery(waypoint) {
  const photos = [];

  // Add main Wikipedia image if available
  const mainImg = document.querySelector(`[data-index="${travelData.waypoints.indexOf(waypoint)}"] .travel-stop__image`);
  if (mainImg && mainImg.src && mainImg.style.display !== 'none') {
    photos.push({
      src: mainImg.src,
      alt: `${waypoint.title} - Main view`,
      caption: `${waypoint.title}, ${waypoint.locality.country}`
    });
  }

  // Add photos from things-to-do
  waypoint.editorial.thingsToDo.forEach(item => {
    if (item.image) {
      photos.push({
        src: item.image,
        alt: `${item.title} in ${waypoint.title}`,
        caption: `${item.title} - ${item.category}`
      });
    }
  });

  return photos;
}

function openPhotoGallery(stopElement, startIndex = 0) {
  const index = Number(stopElement.dataset.index);
  const waypoint = travelData.waypoints[index];
  const photos = getPhotoGallery(waypoint);

  if (!photos.length) return;

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'photo-gallery-modal';
  modal.innerHTML = `
    <div class="photo-gallery-overlay" id="gallery-overlay"></div>
    <div class="photo-gallery-container">
      <button class="photo-gallery-close" id="gallery-close" aria-label="Close gallery">
        <i class="fas fa-xmark" aria-hidden="true"></i>
      </button>
      <div class="photo-gallery-content">
        <img class="photo-gallery-image" id="gallery-image" alt="" />
        <div class="photo-gallery-caption" id="gallery-caption"></div>
      </div>
      <button class="photo-gallery-nav photo-gallery-prev" id="gallery-prev" aria-label="Previous photo">
        <i class="fas fa-chevron-left" aria-hidden="true"></i>
      </button>
      <button class="photo-gallery-nav photo-gallery-next" id="gallery-next" aria-label="Next photo">
        <i class="fas fa-chevron-right" aria-hidden="true"></i>
      </button>
      <div class="photo-gallery-indicators" id="gallery-indicators"></div>
    </div>
  `;

  document.body.appendChild(modal);

  let currentIndex = startIndex;
  const imageEl = modal.querySelector('#gallery-image');
  const captionEl = modal.querySelector('#gallery-caption');
  const indicatorsEl = modal.querySelector('#gallery-indicators');

  function updateGallery() {
    const photo = photos[currentIndex];
    imageEl.src = photo.src;
    imageEl.alt = photo.alt;
    captionEl.textContent = photo.caption;

    // Update indicators
    indicatorsEl.innerHTML = photos.map((_, i) =>
      `<span class="photo-gallery-indicator ${i === currentIndex ? 'active' : ''}" data-index="${i}"></span>`
    ).join('');

    // Update nav buttons
    modal.querySelector('#gallery-prev').style.opacity = currentIndex > 0 ? '1' : '0.3';
    modal.querySelector('#gallery-next').style.opacity = currentIndex < photos.length - 1 ? '1' : '0.3';
  }

  function handleGalleryKeydown(e) {
    if (e.key === 'Escape') {
      closeGallery();
    } else if (e.key === 'ArrowRight') {
      nextPhoto();
    } else if (e.key === 'ArrowLeft') {
      prevPhoto();
    }
  }

  function closeGallery() {
    document.removeEventListener('keydown', handleGalleryKeydown);
    modal.remove();
  }

  function nextPhoto() {
    if (currentIndex < photos.length - 1) {
      currentIndex++;
      updateGallery();
    }
  }

  function prevPhoto() {
    if (currentIndex > 0) {
      currentIndex--;
      updateGallery();
    }
  }

  // Event listeners
  modal.querySelector('#gallery-close').addEventListener('click', closeGallery);
  modal.querySelector('#gallery-overlay').addEventListener('click', closeGallery);
  modal.querySelector('#gallery-next').addEventListener('click', nextPhoto);
  modal.querySelector('#gallery-prev').addEventListener('click', prevPhoto);

  // Keyboard navigation
  document.addEventListener('keydown', handleGalleryKeydown);

  // Indicator clicks
  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('photo-gallery-indicator')) {
      currentIndex = Number(e.target.dataset.index);
      updateGallery();
    }
  });

  updateGallery();
}

function setActive(index) {
  const { waypoints } = travelData;
  if (!Number.isInteger(index) || index < 0 || index >= waypoints.length) return;

  cancelAnimationFrame(state.spinFrame);
  state.activeIndex = index;
  const waypoint = waypoints[index];

  document.querySelectorAll('.travel-stop').forEach(el => {
    const isActive = Number(el.dataset.index) === index;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-expanded', String(isActive));
    if (isActive) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      fetchWikiData(waypoint, el);
      attachGalleryHandlers(el);
    }
  });

  if (!state.ready) return;
  updateActiveMarker(waypoint);

  const isMobile = window.innerWidth <= 768;
  state.map.flyTo({
    center: waypoint.locality.coordinates,
    zoom: 11.2,
    pitch: 48,
    bearing: -18,
    padding: isMobile
      ? { top: 60, bottom: window.innerHeight * 0.48 + 20, left: 20, right: 20 }
      : { top: 84, bottom: 84, left: 460, right: 90 },
    duration: 1400,
    essential: true,
  });
}

function updateStopA11y() {
  document.querySelectorAll('.travel-stop').forEach(el => {
    el.setAttribute('aria-expanded', String(Number(el.dataset.index) === state.activeIndex));
  });
}

function attachGalleryHandlers(stopElement) {
  // Attach handler to main image
  const mainImg = stopElement.querySelector('.travel-stop__image');
  if (mainImg) {
    mainImg.addEventListener('error', () => {
      mainImg.style.display = 'none';
    }, { once: true });
    mainImg.style.cursor = 'pointer';
    mainImg.onclick = () => openPhotoGallery(stopElement, 0);
  }

  // Attach handlers to place guide images
  const guideImages = stopElement.querySelectorAll('.place-guide-card img');
  guideImages.forEach((img, index) => {
    img.addEventListener('error', () => {
      img.closest('.place-guide-card')?.classList.add('place-guide-card--image-missing');
    }, { once: true });
    img.style.cursor = 'pointer';
    img.onclick = () => openPhotoGallery(stopElement, index + 1);
  });
}

function startTour() {
  if (!state.visibleIndexes.length) return;
  const tour = document.getElementById('spotlight-tour');
  tour?.classList.add('active');
  tour?.setAttribute('aria-pressed', 'true');

  let cursor = 0;
  setActive(state.visibleIndexes[cursor]);
  state.tourTimer = window.setInterval(() => {
    if (!state.visibleIndexes.length) {
      stopTour();
      return;
    }

    cursor = (cursor + 1) % state.visibleIndexes.length;
    setActive(state.visibleIndexes[cursor]);
  }, 2600);
}

function stopTour() {
  if (!state.tourTimer) return;
  window.clearInterval(state.tourTimer);
  state.tourTimer = null;
  const tour = document.getElementById('spotlight-tour');
  tour?.classList.remove('active');
  tour?.setAttribute('aria-pressed', 'false');
}

function loadMapLibre() {
  if (window.maplibregl) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = MAPLIBRE_CSS;
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = MAPLIBRE_JS;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function getMapStyle() {
  return document.documentElement.classList.contains('dark')
    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
}

function handleMapError(event) {
  const message = event?.error?.message;
  if (!message) return;

  if (message === 'Failed to fetch') {
    return;
  }

  if (mapWarningMessages.has(message)) {
    return;
  }

  mapWarningMessages.add(message);
  console.warn(`Map resource unavailable: ${message}`);
}

async function initMap() {
  await loadMapLibre();

  state.map = new window.maplibregl.Map({
    container: 'map-container',
    style: getMapStyle(),
    center: [10, 25],
    zoom: 2,
    pitch: 20,
    bearing: 0,
    antialias: true,
    attributionControl: true,
  });

  state.map.addControl(new window.maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
  state.map.on('error', handleMapError);

  state.map.on('load', () => {
    state.ready = true;
    addMapSources();
    addMapLayers();
    fitMapToVisiblePlaces();
    startSpin();
    bindThemeSync();
  });
}

function addMapSources() {
  state.map.addSource('all-stops', {
    type: 'geojson',
    data: buildVisitedPlacesFeatureCollection(),
  });

  state.map.addSource('active-marker', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
}

function buildVisitedPlacesFeatureCollection() {
  return {
    type: 'FeatureCollection',
    features: travelData.waypoints.map((waypoint, index) => ({
      type: 'Feature',
      properties: {
        index,
        name: waypoint.title,
        country: waypoint.locality.country,
        visible: state.visibleIndexes.includes(index),
      },
      geometry: { type: 'Point', coordinates: waypoint.locality.coordinates },
    })),
  };
}

function addMapLayers() {
  state.map.addLayer({
    id: 'all-stops-halo',
    type: 'circle',
    source: 'all-stops',
    paint: {
      'circle-color': VISITED_PIN_COLOR,
      'circle-radius': ['case', ['get', 'visible'], 13, 0],
      'circle-opacity': ['case', ['get', 'visible'], 0.12, 0],
    },
  });

  state.map.addLayer({
    id: 'all-stops-circles',
    type: 'circle',
    source: 'all-stops',
    paint: {
      'circle-color': VISITED_PIN_COLOR,
      'circle-radius': ['case', ['get', 'visible'], 6.5, 0],
      'circle-stroke-width': ['case', ['get', 'visible'], 2, 0],
      'circle-stroke-color': '#ffffff',
      'circle-opacity': ['case', ['get', 'visible'], 0.9, 0],
    },
  });

  state.map.addLayer({
    id: 'active-marker-circle',
    type: 'circle',
    source: 'active-marker',
    paint: {
      'circle-color': VISITED_PIN_COLOR,
      'circle-radius': 11,
      'circle-stroke-width': 3,
      'circle-stroke-color': '#ffffff',
    },
  });

  state.map.addLayer({
    id: 'active-marker-label',
    type: 'symbol',
    source: 'active-marker',
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 14,
      'text-offset': [0, -1.8],
      'text-anchor': 'bottom',
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(0,0,0,0.7)',
      'text-halo-width': 1.5,
    },
  });

  state.map.on('click', 'all-stops-circles', event => {
    const index = Number(event.features[0].properties.index);
    if (state.visibleIndexes.includes(index)) {
      stopTour();
      setActive(index);
    }
  });
  state.map.on('mouseenter', 'all-stops-circles', () => {
    state.map.getCanvas().style.cursor = 'pointer';
  });
  state.map.on('mouseleave', 'all-stops-circles', () => {
    state.map.getCanvas().style.cursor = '';
  });
}

function updateMapPointVisibility() {
  if (!state.ready) return;
  state.map.getSource('all-stops')?.setData(buildVisitedPlacesFeatureCollection());
}

function clearActiveMarker() {
  if (!state.ready) return;
  state.map.getSource('active-marker')?.setData({ type: 'FeatureCollection', features: [] });
}

function updateActiveMarker(waypoint) {
  state.map.getSource('active-marker')?.setData({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: waypoint.title },
        geometry: { type: 'Point', coordinates: waypoint.locality.coordinates },
      },
    ],
  });
}

function fitMapToVisiblePlaces() {
  if (!state.ready || !state.visibleIndexes.length) return;

  const bounds = new window.maplibregl.LngLatBounds();
  state.visibleIndexes.forEach(index => {
    bounds.extend(travelData.waypoints[index].locality.coordinates);
  });

  state.map.fitBounds(bounds, {
    padding: window.innerWidth <= 768
      ? { top: 80, bottom: window.innerHeight * 0.48 + 20, left: 20, right: 20 }
      : { top: 84, bottom: 84, left: 460, right: 90 },
    duration: 1200,
    maxZoom: 8,
  });
}

function startSpin() {
  let bearing = 0;
  function tick() {
    if (state.activeIndex !== null || state.tourTimer) return;
    bearing -= 0.06;
    if (bearing < -180) bearing += 360;
    state.map.setBearing(bearing);
    state.spinFrame = requestAnimationFrame(tick);
  }
  state.spinFrame = requestAnimationFrame(tick);
}

function bindThemeSync() {
  if (state.themeObserver) return;
  state.themeObserver = new MutationObserver(() => {
    state.map?.setStyle(getMapStyle());
    state.map?.once('styledata', () => {
      if (!state.map.getSource('all-stops')) {
        addMapSources();
        addMapLayers();
        updateMapPointVisibility();
      }
    });
  });
  state.themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

function bindThemeToggle() {
  const toggle = document.getElementById('travel-theme-toggle');
  if (!toggle) return;

  const syncIcon = () => {
    const icon = toggle.querySelector('i');
    const isDark = document.documentElement.classList.contains('dark');
    icon.className = `fas ${isDark ? 'fa-sun' : 'fa-moon'}`;
  };

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    document.documentElement.classList.toggle('light', savedTheme === 'light');
  } else {
    // Default to system preference if no saved theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
    document.documentElement.classList.toggle('light', !prefersDark);
  }

  syncIcon();
  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    syncIcon();
  });
}

function init() {
  bindThemeToggle();
  populateStats();
  renderCountryPills();
  renderCountryChapters();
  bindFilters();
  renderTimeline();
  initMap();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
