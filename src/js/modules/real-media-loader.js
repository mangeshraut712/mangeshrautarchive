import { BOOKS, SHOWS_AND_MOVIES } from '../data/media-data.js';
import { analytics } from '../services/AnalyticsService.js';
import { isPerformanceAudit } from '../utils/perf-audit.js';
import { escapeHtml, escapeAttr } from '../utils/escape-html.js';

class RealMediaLoader {
  escapeAttribute(value) {
    return escapeAttr(value);
  }

  escapeText(value) {
    return escapeHtml(value);
  }
  getMediaPlaceholder(title, type, _meta = '') {
    const palette =
      type === 'Series'
        ? ['%230071e3', '%235ac8fa']
        : type === 'Movie'
          ? ['%23ff9500', '%23ff3b30']
          : ['%232f2f33', '%236e6e73'];

    // Abstract center icon drawing based on media type for an elegant modern look
    const centerIcon =
      type === 'Book'
        ? `%3Cpath d='M140 100v100c-15-10-30-10-40 0V100c10-10 25-10 40 0z' fill='white' opacity='0.3'/%3E%3Cpath d='M60 100v100c15-10 30-10 40 0V100c-10-10-25-10-40 0z' fill='white' opacity='0.8'/%3E`
        : `%3Cpath d='M85 110l50 40-50 40V110z' fill='white' opacity='0.7'/%3E`;

    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='${palette[0]}'/%3E%3Cstop offset='1' stop-color='${palette[1]}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='200' height='300' rx='20'/%3E%3Crect fill='rgba(255,255,255,0.1)' x='16' y='16' width='168' height='268' rx='16'/%3E${centerIcon}%3C/svg%3E`;
  }

  getArtworkPlaceholder(_trackName = 'Now Playing', _artistName = 'Last.fm') {
    // High-reliability Base64 encoded Spotify-inspired placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNDAgMjQwJz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9J2cnIHgxPScwJyB5MT0nMCcgeDI9JzEnIHkyPScxJz48c3RvcCBzdG9wLWNvbG9yPScjMWRiOTU0Jy8+PHN0b3Agb2Zmc2V0PScxJyBzdG9wLWNvbG9yPScjMTkxNDE0Jy8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3QgZmlsbD0ndXJsKCNnKScgd2lkdGg9JzI0MCcgaGVpZ2h0PScyNDAnIHJ4PScyOCcvPjxjaXJjbGUgY3g9JzEyMCcgY3k9JzEyMCcgcj0nNTAnIGZpbGw9J3JnYmEoMjU1LDI1NSwyNTUsMC4xKScvPjxwYXRoIGZpbGw9J3doaXRlJyBkPSdNMTU3IDgzYTY3IDY3IDAgMCAwLTc0IDkgNiA2IDAgMSAwIDcgMTAgNTUgNTUgMCAwIDEgNjAtNyA2IDYgMCAxIDAgNy0xMlptLTggMjhhNDMgNDMgMCAwIDAtNDYgNiA2IDYgMCAwIDAgOCA5IDMxIDMxIDAgMCAxIDMzLTQgNiA2IDAgMCAwIDUtMTBabS05IDI1YTE5IDE5IDAgMCAwLTE5IDIgNiA2IDAgMSAwIDcgOSA3IDcgMCAwIDEgOC0xIDYgNiAwIDEgMCA0LTEwWicgb3BhY2l0eT0nMC45Jy8+PC9zdmc+';
  }

  getShortTitle(title) {
    return title || '';
  }

  getUniqueItems(items = [], keySelector = item => item.title) {
    const seen = new Set();
    return items.filter(item => {
      const key = String(keySelector(item) || '')
        .trim()
        .toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  trackMediaClick(event) {
    const link = event.currentTarget;

    try {
      analytics.track('media_click', {
        title: link.dataset.mediaTitle || '',
        type: link.dataset.mediaType || '',
      });
    } catch (error) {
      console.debug('[RealMediaLoader] media analytics unavailable:', error);
    }
  }

  bindMediaTracking(container) {
    container.querySelectorAll('[data-media-track]').forEach(link => {
      link.addEventListener('click', event => this.trackMediaClick(event));
    });
  }

  renderShowsAndMovies(container) {
    const mediaItems = this.getUniqueItems(SHOWS_AND_MOVIES, item => `${item.type}:${item.title}`);

    container.innerHTML = mediaItems
      .map(item => {
        const fallbackSvg = this.getMediaPlaceholder(item.title, item.type, item.platform);
        const posterSrc = item.poster || fallbackSvg;
        const mediaTitle = this.escapeAttribute(item.title);
        const mediaType = this.escapeAttribute(item.type);

        const safePoster = this.escapeAttribute(posterSrc);
        const safeFallback = this.escapeAttribute(fallbackSvg);
        const safeLink = this.escapeAttribute(item.link || '#');
        const safeType = this.escapeText(item.type || '');
        const safePlatform = this.escapeText(item.platform || '');
        const safeTitle = this.escapeText(this.getShortTitle(item.title));
        return `
        <div class="media-card">
          <div class="media-poster">
              <img
                src="${safePoster}"
                alt="${mediaTitle}"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                onload="this.classList.add('loaded'); this.parentElement.classList.add('loaded');"
                onerror="this.src='${safeFallback}'; this.classList.add('loaded'); this.parentElement.classList.add('loaded'); this.onerror=null;"
              />
            <span class="media-badge">${safeType}</span>
          </div>
          <div class="media-info">
            <h4>${safeTitle}</h4>
            <a href="${safeLink}" target="_blank" rel="noopener" class="watch-btn" data-media-track data-media-title="${mediaTitle}" data-media-type="${mediaType}">
              <i class="fas fa-play" aria-hidden="true"></i><span>${safePlatform}</span>
            </a>
          </div>
        </div>
      `;
      })
      .join('');

    this.bindMediaTracking(container);
  }

  async fetchBookCover(book) {
    const query = encodeURIComponent(`intitle:${book.title} inauthor:${book.author}`);
    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=1`);
      if (!response.ok) return null;
      const data = await response.json();
      const coverI = data.docs?.[0]?.cover_i;
      if (coverI) {
        return `https://covers.openlibrary.org/b/id/${coverI}-L.jpg`;
      }
    } catch (e) {
      console.warn('Failed to fetch cover for', book.title, e);
    }
    return null;
  }

  renderBooks(container) {
    const books = this.getUniqueItems(BOOKS, book => `${book.type}:${book.title}`);

    container.innerHTML = books
      .map(book => {
        const fallbackSvg = this.getMediaPlaceholder(book.title, 'Book', book.author);
        const coverSrc = book.cover || fallbackSvg;
        const mediaTitle = this.escapeAttribute(book.title);
        const mediaType = this.escapeAttribute(book.type);

        const safeCover = this.escapeAttribute(coverSrc);
        const safeFallback = this.escapeAttribute(fallbackSvg);
        const safeLink = this.escapeAttribute(book.link || '#');
        const safeType = this.escapeText(book.type || '');
        const safeTitle = this.escapeText(this.getShortTitle(book.title));
        const safeAuthor = this.escapeText(book.author || '');
        return `
        <div class="media-card book-card" data-title="${mediaTitle}" data-author="${this.escapeAttribute(book.author)}">
          <div class="media-poster">
              <img
                src="${safeCover}"
                alt="${mediaTitle}"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                class="book-cover-img"
                onload="this.classList.add('loaded'); this.parentElement.classList.add('loaded');"
                onerror="this.src='${safeFallback}'; this.classList.add('loaded'); this.parentElement.classList.add('loaded'); this.onerror=null;"
              />
            <span class="media-badge">${safeType}</span>
          </div>
          <div class="media-info">
            <h4>${safeTitle}</h4>
            <p class="book-author-text">${safeAuthor}</p>
            <a href="${safeLink}" target="_blank" rel="noopener" class="watch-btn book-btn" data-media-track data-media-title="${mediaTitle}" data-media-type="${mediaType}">
              <i class="fas fa-book-open" aria-hidden="true"></i><span>Read</span>
            </a>
          </div>
        </div>
      `;
      })
      .join('');

    this.bindMediaTracking(container);

    // Hydrate covers
    container.querySelectorAll('.book-card').forEach(card => {
      const title = card.dataset.title;
      const author = card.dataset.author;
      const img = card.querySelector('.book-cover-img');

      // If using original placeholder or fallback, try fetching
      if (!img.src || img.src.includes('data:image/svg+xml')) {
        this.fetchBookCover({ title, author }).then(url => {
          if (url) img.src = url;
        });
      }
    });
  }
  initMusicFallbacks() {
    // Placeholder for music fallback initialization if needed
  }

  init() {
    const showsContainer = document.getElementById('shows-content')?.querySelector('.media-grid');
    const booksContainer = document.getElementById('books-content')?.querySelector('.media-grid');

    if (showsContainer) {
      this.renderShowsAndMovies(showsContainer);
    }

    if (booksContainer) {
      this.renderBooks(booksContainer);
    }

    this.initMusicFallbacks();
  }
}

function initRealMediaLoader() {
  if (isPerformanceAudit()) {
    return;
  }

  const loader = new RealMediaLoader();
  loader.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRealMediaLoader, { once: true });
} else {
  initRealMediaLoader();
}

export default RealMediaLoader;
