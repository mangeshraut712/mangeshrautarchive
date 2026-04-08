import { BOOKS, FALLBACKS, SHOWS_AND_MOVIES } from '../data/media-data.js';

class RealMediaLoader {
  constructor() {
    this.imageLoadTimeoutMs = 4000;
  }

  getMediaPlaceholder(title, type, meta = '') {
    const label = type === 'Series' ? 'TV SERIES' : type === 'Movie' ? 'MOVIE' : 'BOOK';
    const palette =
      type === 'Series'
        ? ['%230071e3', '%235ac8fa']
        : type === 'Movie'
          ? ['%23ff9500', '%23ff3b30']
          : ['%232f2f33', '%236e6e73'];
    const encodedTitle = encodeURIComponent(String(title || '').slice(0, 20));
    const encodedMeta = encodeURIComponent(String(meta || '').slice(0, 18));

    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='${palette[0]}'/%3E%3Cstop offset='1' stop-color='${palette[1]}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='200' height='300' rx='20'/%3E%3Crect fill='rgba(255,255,255,0.14)' x='18' y='18' width='164' height='264' rx='14'/%3E%3Ctext fill='white' font-family='system-ui,sans-serif' font-size='12' font-weight='700' x='100' y='58' text-anchor='middle'%3E${label}%3C/text%3E%3Ctext fill='white' font-family='system-ui,sans-serif' font-size='18' font-weight='700' x='100' y='146' text-anchor='middle'%3E${encodedTitle}%3C/text%3E%3Ctext fill='rgba(255,255,255,0.82)' font-family='system-ui,sans-serif' font-size='11' x='100' y='176' text-anchor='middle'%3E${encodedMeta}%3C/text%3E%3C/svg%3E`;
  }

  getTrackPlaceholder(trackName = 'Now Playing', artistName = 'Music') {
    const encodedTrack = encodeURIComponent(String(trackName).slice(0, 18));
    const encodedArtist = encodeURIComponent(String(artistName).slice(0, 18));
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%231db954'/%3E%3Cstop offset='1' stop-color='%23191414'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='240' height='240' rx='28'/%3E%3Ccircle cx='120' cy='120' r='54' fill='rgba(255,255,255,0.16)'/%3E%3Cpath fill='white' d='M157 83a67 67 0 0 0-74 9 6 6 0 1 0 7 10 55 55 0 0 1 60-7 6 6 0 1 0 7-12Zm-8 28a43 43 0 0 0-46 6 6 6 0 0 0 8 9 31 31 0 0 1 33-4 6 6 0 0 0 5-10Zm-9 25a19 19 0 0 0-19 2 6 6 0 1 0 7 9 7 7 0 0 1 8-1 6 6 0 1 0 4-10Z'/%3E%3Ctext fill='white' font-family='system-ui,sans-serif' font-size='14' font-weight='700' x='120' y='198' text-anchor='middle'%3E${encodedTrack}%3C/text%3E%3Ctext fill='rgba(255,255,255,0.78)' font-family='system-ui,sans-serif' font-size='11' x='120' y='216' text-anchor='middle'%3E${encodedArtist}%3C/text%3E%3C/svg%3E`;
  }

  getShortTitle(title, maxLength = 15) {
    if (!title || title.length <= maxLength) return title || '';
    return `${title.slice(0, maxLength - 3)}...`;
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

  preloadRemoteImage(url) {
    return new Promise(resolve => {
      if (!url) {
        resolve(false);
        return;
      }

      const img = new Image();
      const cleanup = result => {
        window.clearTimeout(timeoutId);
        img.onload = null;
        img.onerror = null;
        resolve(result);
      };

      const timeoutId = window.setTimeout(() => cleanup(false), this.imageLoadTimeoutMs);
      img.onload = () => cleanup(true);
      img.onerror = () => cleanup(false);
      img.src = url;
    });
  }

  hydrateCardImages(container) {
    const imageNodes = Array.from(container.querySelectorAll('img[data-remote-src]'));
    imageNodes.forEach(async imageNode => {
      const remoteSrc = imageNode.dataset.remoteSrc;
      const loaded = await this.preloadRemoteImage(remoteSrc);
      if (!loaded || !remoteSrc) {
        imageNode.classList.add('loaded');
        imageNode.parentElement?.classList.add('loaded');
        return;
      }

      imageNode.src = remoteSrc;
    });
  }

  async fetchPosterFromAPI(item) {
    try {
      const mediaType = item.type.toLowerCase() === 'series' ? 'tv' : 'movie';
      const response = await fetch(
        `/api/posters/movie?title=${encodeURIComponent(item.title)}&media_type=${mediaType}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.poster_url || '';
      }
    } catch (error) {
      console.warn('Failed to fetch poster for', item.title, error);
    }
    return item.poster || ''; // Fallback to static
  }

  renderShowsAndMovies(container) {
    const mediaItems = this.getUniqueItems(SHOWS_AND_MOVIES, item => `${item.type}:${item.title}`);

    container.innerHTML = mediaItems
      .map(item => {
        const fallbackSvg = this.getMediaPlaceholder(item.title, item.type, item.platform);

        return `
        <div class="media-card">
          <div class="media-poster">
              <img
                src="${fallbackSvg}"
                data-remote-src="${item.poster || ''}"
                alt="${item.title}"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                onload="this.classList.add('loaded'); this.parentElement.classList.add('loaded');"
                onerror="this.src='${fallbackSvg}'; this.classList.add('loaded'); this.parentElement.classList.add('loaded'); this.onerror=null;"
              />
            <span class="media-badge">${item.type}</span>
          </div>
          <div class="media-info">
            <h4>${this.getShortTitle(item.title)}</h4>
            <a href="${item.link}" target="_blank" rel="noopener" class="watch-btn">
              <i class="fas fa-play"></i> ${item.platform}
            </a>
          </div>
        </div>
      `;
      })
      .join('');

    this.hydrateCardImages(container);

    // Fetch and update posters asynchronously
    mediaItems.forEach(async (item, index) => {
      const poster = await this.fetchPosterFromAPI(item);
      if (poster && poster !== item.poster) {
        const img = container.querySelectorAll('.media-card img')[index];
        if (img) {
          img.setAttribute('data-remote-src', poster);
          this.preloadRemoteImage(poster).then(loaded => {
            if (loaded) {
              img.src = poster;
            }
          });
        }
      }
    });
  }

  async fetchBookCoverFromAPI(book) {
    try {
      const response = await fetch(`/api/posters/book?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author || '')}`);
      if (response.ok) {
        const data = await response.json();
        return data.cover_url || '';
      }
    } catch (error) {
      console.warn('Failed to fetch cover for', book.title, error);
    }
    return book.cover || ''; // Fallback to static
  }

  renderBooks(container) {
    const books = this.getUniqueItems(BOOKS, book => `${book.type}:${book.title}`);

    container.innerHTML = books.map(book => {
      const fallbackSvg = this.getMediaPlaceholder(book.title, 'Book', book.author);

      return `
        <div class="media-card book-card">
          <div class="media-poster">
              <img
                src="${fallbackSvg}"
                data-remote-src="${book.cover || ''}"
                alt="${book.title}"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                onload="this.classList.add('loaded'); this.parentElement.classList.add('loaded');"
                onerror="this.src='${fallbackSvg}'; this.classList.add('loaded'); this.parentElement.classList.add('loaded'); this.onerror=null;"
              />
            <span class="media-badge">${book.type}</span>
          </div>
          <div class="media-info">
            <h4>${this.getShortTitle(book.title)}</h4>
            <p class="text-xs text-gray-500">${book.author}</p>
            <a href="${book.link}" target="_blank" rel="noopener" class="watch-btn book-btn">
              <i class="fas fa-book-open"></i> Read
            </a>
          </div>
        </div>
      `;
    }).join('');

    this.hydrateCardImages(container);

    // Fetch and update covers asynchronously
    books.forEach(async (book, index) => {
      const cover = await this.fetchBookCoverFromAPI(book);
      if (cover && cover !== book.cover) {
        const img = container.querySelectorAll('.media-card.book-card img')[index];
        if (img) {
          img.setAttribute('data-remote-src', cover);
          this.preloadRemoteImage(cover).then(loaded => {
            if (loaded) {
              img.src = cover;
            }
          });
        }
      }
    });
  }

  initMusicFallbacks() {
    const musicImages = [
      document.getElementById('now-playing-img'),
      ...Array.from(document.querySelectorAll('#recent-tracks-container img')),
    ].filter(Boolean);

    musicImages.forEach(imageNode => {
      const fallback = this.getTrackPlaceholder(imageNode.alt || 'Music', 'Last.fm');
      if (!imageNode.getAttribute('src')) {
        imageNode.setAttribute('src', fallback);
      }
      imageNode.addEventListener(
        'error',
        () => {
          imageNode.setAttribute('src', fallback);
        },
        { once: true }
      );
    });
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
  const loader = new RealMediaLoader();
  loader.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRealMediaLoader, { once: true });
} else {
  initRealMediaLoader();
}

export default RealMediaLoader;
