/**
 * Curated Shelves Module
 * Renders real cover/poster artwork for books, series, and movies.
 */
(function() {
  'use strict';

  const BOOKS_DATA = [
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      imageUrl: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg?default=false',
      url: 'https://books.apple.com/us/book/atomic-habits/id1384286945',
      actionText: 'Read',
      actionClass: 'provider-link--apple',
      actionIcon: 'fa-solid fa-book-open',
      fallbackGradient: 'linear-gradient(160deg, #f97316 0%, #7c2d12 100%)',
    },
    {
      title: 'Steve Jobs',
      author: 'Walter Isaacson',
      imageUrl: 'https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg?default=false',
      url: 'https://books.apple.com/us/book/steve-jobs/id431617578',
      actionText: 'Read',
      actionClass: 'provider-link--apple',
      actionIcon: 'fa-solid fa-book-open',
      fallbackGradient: 'linear-gradient(160deg, #475569 0%, #1e293b 100%)',
    },
    {
      title: 'The Bhagavad Gita',
      author: 'Eknath Easwaran',
      imageUrl: 'https://covers.openlibrary.org/b/isbn/9781586380199-L.jpg?default=false',
      url: 'https://books.apple.com/us/book/the-bhagavad-gita/id457383796',
      actionText: 'Read',
      actionClass: 'provider-link--apple',
      actionIcon: 'fa-solid fa-book-open',
      fallbackGradient: 'linear-gradient(160deg, #d97706 0%, #78350f 100%)',
    },
    {
      title: 'Harry Potter and the Deathly Hallows',
      author: 'J.K. Rowling',
      imageUrl: 'https://covers.openlibrary.org/b/isbn/9780545010221-L.jpg?default=false',
      url: 'https://books.apple.com/us/book/harry-potter-and-the-deathly-hallows/id416550722',
      actionText: 'Read',
      actionClass: 'provider-link--apple',
      actionIcon: 'fa-solid fa-book-open',
      fallbackGradient: 'linear-gradient(160deg, #1e3a8a 0%, #1e1b4b 100%)',
    },
    {
      title: 'The Bible',
      author: 'Various',
      imageUrl: 'https://covers.openlibrary.org/b/isbn/9780195289602-L.jpg?default=false',
      url: 'https://books.apple.com/us/book/the-holy-bible-king-james-version/id360172600',
      actionText: 'Read',
      actionClass: 'provider-link--apple',
      actionIcon: 'fa-solid fa-book-open',
      fallbackGradient: 'linear-gradient(160deg, #71717a 0%, #18181b 100%)',
    },
  ];

  const SERIES_DATA = [
    {
      title: 'From',
      imageUrl: 'https://static.tvmaze.com/uploads/images/medium_portrait/618/1547007.jpg',
      fallbackGradient: 'linear-gradient(160deg, #2563eb 0%, #0891b2 100%)',
    },
    {
      title: 'Narcos',
      imageUrl: 'https://static.tvmaze.com/uploads/images/medium_portrait/498/1246087.jpg',
      fallbackGradient: 'linear-gradient(160deg, #dc2626 0%, #7f1d1d 100%)',
    },
    {
      title: 'Crash Landing on You',
      imageUrl: 'https://static.tvmaze.com/uploads/images/medium_portrait/235/588087.jpg',
      fallbackGradient: 'linear-gradient(160deg, #3b82f6 0%, #1e3a8a 100%)',
    },
    {
      title: 'Money Heist',
      imageUrl: 'https://static.tvmaze.com/uploads/images/medium_portrait/430/1076004.jpg',
      fallbackGradient: 'linear-gradient(160deg, #ef4444 0%, #7f1d1d 100%)',
    },
    {
      title: 'Scam 1992',
      imageUrl: 'https://static.tvmaze.com/uploads/images/medium_portrait/521/1304758.jpg',
      fallbackGradient: 'linear-gradient(160deg, #b45309 0%, #451a03 100%)',
    },
    {
      title: 'Stranger Things',
      imageUrl: '',
      fallbackGradient: 'linear-gradient(160deg, #7c3aed 0%, #4c1d95 100%)',
    },
    {
      title: 'Queen of Tears',
      imageUrl: '',
      fallbackGradient: 'linear-gradient(160deg, #db2777 0%, #831843 100%)',
    },
    {
      title: 'Taarak Mehta Ka Ooltah Chashmah',
      imageUrl: '',
      fallbackGradient: 'linear-gradient(160deg, #f59e0b 0%, #92400e 100%)',
    },
    {
      title: 'CID',
      imageUrl: '',
      fallbackGradient: 'linear-gradient(160deg, #475569 0%, #111827 100%)',
    },
    {
      title: 'Mahabharat',
      imageUrl: '',
      fallbackGradient: 'linear-gradient(160deg, #d97706 0%, #7c2d12 100%)',
    },
  ].map(item => ({
    ...item,
    actionText: 'Watch',
    actionClass: 'provider-link--watch',
    actionIcon: 'fa-solid fa-play',
    url: `https://www.justwatch.com/us/search?q=${encodeURIComponent(item.title)}`,
  }));

  const MOVIES_DATA = [
    {
      title: 'F1',
      imageUrl: '',
    },
    {
      title: 'KGF',
      imageUrl: '',
    },
    {
      title: 'Vikram',
      imageUrl: '',
    },
    {
      title: '777 Charlie',
      imageUrl: '',
    },
    {
      title: 'The Blind Side',
      imageUrl: '',
    },
    {
      title: 'The Social Network',
      imageUrl: '',
    },
    {
      title: 'Dhurandhar',
      imageUrl: '',
    },
  ].map(item => ({
    ...item,
    actionText: 'Watch',
    actionClass: 'provider-link--watch',
    actionIcon: 'fa-solid fa-play',
    url: `https://www.justwatch.com/us/search?q=${encodeURIComponent(item.title)}`,
    fallbackGradient: 'linear-gradient(160deg, #334155 0%, #0f172a 100%)',
  }));

  const SPORTS_DATA = [
    { 
      name: 'IPL 2026', 
      emoji: '🏏', 
      subtitle: 'Live: KKR vs SRH @ 7:30 PM', 
      url: 'https://www.iplt20.com/' 
    },
    { 
      name: 'Formula 1', 
      emoji: '🏎️', 
      subtitle: 'Next: Japanese GP (Suzuka)', 
      url: 'https://www.formula1.com/en/racing/2026' 
    },
    { 
      name: 'Volleyball', 
      emoji: '🏐', 
      subtitle: 'Pro League Live', 
      url: 'https://tv.volleyballworld.com/' 
    },
    { 
      name: 'Basketball', 
      emoji: '🏀', 
      subtitle: 'NBA Playoffs 2026', 
      url: 'https://www.nba.com/games' 
    },
  ];


  function createArtworkShell(type, item) {
    const shell = document.createElement('div');
    shell.className = `shelf-cover ${type === 'book' ? 'shelf-cover--book' : 'shelf-cover--media'}`;
    shell.style.setProperty('--cover-gradient', item.fallbackGradient);

    const image = document.createElement('img');
    image.className = 'shelf-artwork';
    image.alt = `${item.title} cover`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';

    image.addEventListener('load', () => {
      shell.classList.add('has-image');
    });

    image.addEventListener('error', () => {
      shell.classList.remove('has-image');
      image.removeAttribute('src');
    });

    if (item.imageUrl) {
      image.src = item.imageUrl;

      if (image.complete && image.naturalWidth > 0) {
        shell.classList.add('has-image');
      }
    }

    const fallback = document.createElement('div');
    fallback.className = 'shelf-fallback';
    fallback.innerHTML = `<span class="shelf-fallback-title">${item.title}</span>${item.author ? `<span class="shelf-fallback-subtitle">${item.author}</span>` : ''}`;

    shell.appendChild(image);
    shell.appendChild(fallback);
    return shell;
  }

  function createActionLink(item) {
    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = `provider-link ${item.actionClass}`;
    link.innerHTML = `<i class="${item.actionIcon}"></i><span>${item.actionText}</span>`;
    return link;
  }

  function createShelfItem(type, item) {
    const node = document.createElement('article');
    node.className = type === 'book' ? 'book-item' : 'media-item';
    node.appendChild(createArtworkShell(type, item));

    const meta = document.createElement('div');
    meta.className = 'shelf-meta';
    meta.innerHTML = `
      <p class="shelf-title">${item.title}</p>
      ${item.author ? `<p class="shelf-subtitle">${item.author}</p>` : ''}
    `;
    node.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'shelf-actions';
    actions.appendChild(createActionLink(item));
    node.appendChild(actions);

    return node;
  }

  function renderShelf(containerId, type, items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      fragment.appendChild(createShelfItem(type, item));
    });

    container.innerHTML = '';
    container.appendChild(fragment);
  }

  function renderSports() {
    const container = document.getElementById('sports-shelf');
    if (!container) return;

    const fragment = document.createDocumentFragment();

    SPORTS_DATA.forEach(sport => {
      const item = document.createElement('div');
      item.className = 'sport-item';
      item.innerHTML = `
        <span class="sport-emoji">${sport.emoji}</span>
        <div class="sport-info">
          <p class="sport-name">${sport.name}</p>
          ${sport.subtitle ? `<p class="sport-subtitle">${sport.subtitle}</p>` : ''}
        </div>
        <div class="sport-actions">
          <a href="${sport.url}" target="_blank" rel="noopener noreferrer" class="provider-link provider-link--live">
            <i class="fa-solid fa-tower-broadcast"></i>
            <span>Live</span>
          </a>
        </div>
      `;
      fragment.appendChild(item);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    renderShelf('books-shelf', 'book', BOOKS_DATA);
    renderShelf('series-shelf', 'series', SERIES_DATA);
    renderSports();
    renderShelf('movies-shelf', 'movie', MOVIES_DATA);
  });
})();
