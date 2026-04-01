/**
 * Curated Shelves Module
 * Dynamically injects the content for Reading, Watching (Series/Movies), and Following (Sports).
 * Maintains a clean HTML structure and uses the centralized Apple-inspired CSS classes.
 */
(function() {
  'use strict';

  // --- DATA SOURCES ---

  const BOOKS_DATA = [
    {
      title: "Atomic Habits",
      author: "James Clear",
      kicker: "READ",
      gradient: "linear-gradient(160deg, #f97316 0%, #7c2d12 100%)",
      provider: "apple",
      url: "https://books.apple.com/us/book/atomic-habits/id1398502251",
      actionText: "Read"
    },
    {
      title: "Steve Jobs",
      author: "Walter Isaacson",
      kicker: "READ",
      gradient: "linear-gradient(160deg, #475569 0%, #1e293b 100%)",
      provider: "apple",
      url: "https://books.apple.com/us/book/steve-jobs/id431617578",
      actionText: "Read"
    },
    {
      title: "The Bhagavad Gita",
      author: "Eknath Easwaran",
      kicker: "READ",
      gradient: "linear-gradient(160deg, #d97706 0%, #78350f 100%)",
      provider: "apple",
      url: "https://books.apple.com/us/book/the-bhagavad-gita/id1524317926",
      actionText: "Read"
    }
  ];

  const SERIES_DATA = [
    { title: "From", kicker: "SERIES", gradient: "linear-gradient(160deg, #2563eb 0%, #0891b2 100%)" },
    { title: "Narcos", kicker: "SERIES", gradient: "linear-gradient(160deg, #dc2626 0%, #7f1d1d 100%)" },
    { title: "Crash Landing on You", kicker: "SERIES", gradient: "linear-gradient(160deg, #3b82f6 0%, #1e3a8a 100%)" },
    { title: "Money Heist", kicker: "SERIES", gradient: "linear-gradient(160deg, #ef4444 0%, #7f1d1d 100%)" },
    { title: "Scam 1992", kicker: "SERIES", gradient: "linear-gradient(160deg, #b45309 0%, #451a03 100%)" },
    { title: "Stranger Things", kicker: "SERIES", gradient: "linear-gradient(160deg, #7c3aed 0%, #4c1d95 100%)" },
    { title: "Queen of Tears", kicker: "SERIES", gradient: "linear-gradient(160deg, #db2777 0%, #831843 100%)" }
  ];

  const MOVIES_DATA = [
    { title: "F1", kicker: "MOVIE", gradient: "linear-gradient(160deg, #2563eb 0%, #1e3a8a 100%)" },
    { title: "KGF", kicker: "MOVIE", gradient: "linear-gradient(160deg, #d97706 0%, #78350f 100%)" },
    { title: "Vikram", kicker: "MOVIE", gradient: "linear-gradient(160deg, #059669 0%, #064e3b 100%)" },
    { title: "777 Charlie", kicker: "MOVIE", gradient: "linear-gradient(160deg, #4d7c0f 0%, #14532d 100%)" },
    { title: "The Blind Side", kicker: "MOVIE", gradient: "linear-gradient(160deg, #3b82f6 0%, #172554 100%)" },
    { title: "The Social Network", kicker: "MOVIE", gradient: "linear-gradient(160deg, #0284c7 0%, #082f49 100%)" }
  ];

  const SPORTS_DATA = [
    { name: "Cricket", emoji: "🏏", detail: "Scores and fixtures." },
    { name: "Formula 1", emoji: "🏎️", detail: "Schedule and latest." },
    { name: "Volleyball", emoji: "🏐", detail: "VNL and live access." },
    { name: "Basketball", emoji: "🏀", detail: "NBA and highlights." }
  ];

  // --- RENDER FUNCTIONS ---

  function createShelfItemBase(data, type) {
    const item = document.createElement('div');
    item.className = type === 'book' ? 'book-item' : 'media-item';

    const typeClass = type === 'book' ? 'shelf-cover--book' : 'shelf-cover--media';
    const gradientStyle = data.gradient ? `style="--cover-gradient: ${data.gradient};"` : '';

    const kickerHtml = data.kicker ? `<span class="shelf-kicker">${data.kicker}</span>` : '';
    const subtitleHtml = data.author ? `<p class="shelf-cover-subtitle">${data.author}</p>` : '';

    // Icon handling
    let actionIcon = '';
    let actionExtraClass = '';
    
    if (type === 'book') {
      actionIcon = '<i class="fa-brands fa-apple"></i>';
      actionExtraClass = 'provider-link--apple';
    } else if (type === 'movie') {
      actionIcon = '<i class="fa-solid fa-play" style="font-size: 8px;"></i>';
      actionExtraClass = 'provider-link--watch';
    } else if (type === 'series') {
      actionIcon = '<i class="fa-solid fa-play" style="font-size: 8px;"></i>';
      actionExtraClass = ''; // default blue
    }

    const captionHtml = (data.caption || data.author) ? `<p class="shelf-caption">${data.caption || data.author}</p>` : '';
    const actionText = data.actionText || 'See partners';
    const linkHref = data.url || '#';
    const target = data.url ? 'target="_blank" rel="noopener"' : '';

    item.innerHTML = `
      <div class="shelf-cover ${typeClass}" ${gradientStyle}>
        ${kickerHtml}
        <h4 class="shelf-cover-title">${data.title}</h4>
        ${subtitleHtml}
      </div>
      ${captionHtml}
      <div class="shelf-actions">
        <a href="${linkHref}" ${target} class="provider-link ${actionExtraClass}">
          ${actionIcon} ${actionText}
        </a>
      </div>
    `;
    return item;
  }

  function renderBooks() {
    const container = document.getElementById('books-shelf');
    if (!container) return;
    
    const frag = document.createDocumentFragment();
    BOOKS_DATA.forEach(book => {
      frag.appendChild(createShelfItemBase(book, 'book'));
    });
    container.appendChild(frag);
  }

  function renderSeries() {
    const container = document.getElementById('series-shelf');
    if (!container) return;

    const frag = document.createDocumentFragment();
    SERIES_DATA.forEach(series => {
      frag.appendChild(createShelfItemBase(series, 'series'));
    });
    container.appendChild(frag);
  }

  function renderMovies() {
    const container = document.getElementById('movies-shelf');
    if (!container) return;

    const frag = document.createDocumentFragment();
    MOVIES_DATA.forEach(movie => {
      frag.appendChild(createShelfItemBase(movie, 'movie'));
    });
    container.appendChild(frag);
  }

  function renderSports() {
    const container = document.getElementById('sports-shelf');
    if (!container) return;

    const frag = document.createDocumentFragment();
    SPORTS_DATA.forEach(sport => {
      const item = document.createElement('div');
      item.className = 'sport-item';
      
      item.innerHTML = `
        <span class="sport-emoji">${sport.emoji}</span>
        <div class="sport-info">
          <p class="sport-name">${sport.name}</p>
          <p class="sport-detail">${sport.detail}</p>
        </div>
        <div class="sport-actions">
          <a href="#" class="provider-link provider-link--live">Open</a>
        </div>
      `;
      frag.appendChild(item);
    });
    container.appendChild(frag);
  }

  // --- INITIALIZATION ---

  document.addEventListener('DOMContentLoaded', () => {
    // Wrap in RAF to ensure smooth painting and minimal block time
    requestAnimationFrame(() => {
      renderBooks();
      renderSeries();
      renderMovies();
      renderSports();
    });
  });

})();
