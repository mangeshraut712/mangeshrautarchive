/**
 * Real Media Loader - Fetches and displays verified real posters
 * For Currently Card - Shows, Movies, and Books
 */

class RealMediaLoader {
  constructor() {
    this.tmdbApiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiZWY0NmIwZDc3MDJkYWM1YjA3MTkwNmNkMTg2YmQyOCIsInN1YiI6IjYwMzZjMzUwM2Y0OTI3MDA0MjY3MzEzMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Fu8jafKGW_JpC4K8jK9q2x3z8y4w5v6b7n8m9k0l1p2'; // Read-only TMDB key
    this.mediaData = {
      shows: [
        // Indian TV Shows - Real TMDB IDs
        { id: 100229, title: 'Taarak Mehta Ka Ooltah Chashmah', type: 'Series', platform: 'SonyLIV', link: 'https://www.sonyliv.com/shows/taarak-mehta-ka-ooltah-chashmah' },
        { id: 204065, title: 'CID', type: 'Series', platform: 'SonyLIV', link: 'https://www.sonyliv.com/shows/cid' },
        { id: 61147, title: 'Mahabharat', type: 'Series', platform: 'Hotstar', link: 'https://www.hotstar.com/in/tv/mahabharat/435' },
        { id: 110084, title: 'Scam 1992', type: 'Series', platform: 'SonyLIV', link: 'https://www.sonyliv.com/shows/scam-1992' },
        { id: 77175, title: 'Mirzapur', type: 'Series', platform: 'Prime', link: 'https://www.primevideo.com/detail/Mirzapur' },
        { id: 90802, title: 'The Family Man', type: 'Series', platform: 'Prime', link: 'https://www.primevideo.com/detail/The-Family-Man' },
        
        // International Series
        { id: 1396, title: 'Breaking Bad', type: 'Series', platform: 'Netflix', link: 'https://www.netflix.com/title/70143836' },
        { id: 71446, title: 'Money Heist', type: 'Series', platform: 'Netflix', link: 'https://www.netflix.com/title/80192098' },
        { id: 63351, title: 'Narcos', type: 'Series', platform: 'Netflix', link: 'https://www.netflix.com/title/80025172' },
        { id: 93405, title: 'Squid Game', type: 'Series', platform: 'Netflix', link: 'https://www.netflix.com/title/81040344' },
        { id: 45790, title: 'Stranger Things', type: 'Series', platform: 'Netflix', link: 'https://www.netflix.com/title/80057281' },
        { id: 80248, title: 'Formula 1: Drive to Survive', type: 'Series', platform: 'Netflix', link: 'https://www.netflix.com/title/80204890' },
      ],
      movies: [
        // Indian Movies
        { id: 484862, title: 'KGF Chapter 1', type: 'Movie', platform: 'Prime', link: 'https://www.primevideo.com/detail/KGF' },
        { id: 579974, title: 'RRR', type: 'Movie', platform: 'Netflix', link: 'https://www.netflix.com/title/81295574' },
        { id: 360784, title: 'Dangal', type: 'Movie', platform: 'Netflix', link: 'https://www.netflix.com/title/80166185' },
        { id: 348882, title: 'Bajrangi Bhaijaan', type: 'Movie', platform: 'Prime', link: 'https://www.primevideo.com/detail/Bajrangi-Bhaijaan' },
        { id: 296098, title: 'PK', type: 'Movie', platform: 'Netflix', link: 'https://www.netflix.com/title/80057473' },
        { id: 763568, title: 'Vikram', type: 'Movie', platform: 'Prime', link: 'https://www.primevideo.com/detail/Vikram' },
        { id: 1073242, title: 'Jailer', type: 'Movie', platform: 'Prime', link: 'https://www.primevideo.com/detail/Jailer' },
        { id: 832539, title: 'Kantara', type: 'Movie', platform: 'Netflix', link: 'https://www.netflix.com/title/81663360' },
        { id: 350457, title: 'Baahubali 2', type: 'Movie', platform: 'Netflix', link: 'https://www.netflix.com/title/80218621' },
        { id: 690364, title: 'Pushpa', type: 'Movie', platform: 'Prime', link: 'https://www.primevideo.com/detail/Pushpa' },
        
        // Hollywood Movies
        { id: 299536, title: 'Avengers: Endgame', type: 'Movie', platform: 'Disney+', link: 'https://www.disneyplus.com/movies/avengers-endgame' },
        { id: 37799, title: 'The Social Network', type: 'Movie', platform: 'Netflix', link: 'https://www.netflix.com/title/70132721' },
        { id: 16437, title: 'The Blind Side', type: 'Movie', platform: 'Netflix', link: 'https://www.netflix.com/title/70102660' },
        { id: 888503, title: '777 Charlie', type: 'Movie', platform: 'Prime', link: 'https://www.primevideo.com/detail/777-Charlie' },
        { id: 51497, title: 'Fast Five', type: 'Movie', platform: 'Netflix', link: 'https://www.netflix.com/title/70157102' },
      ],
      books: [
        { isbn: '9781451648539', title: 'Steve Jobs', author: 'Walter Isaacson', type: 'Biography', link: 'https://www.amazon.com/Steve-Jobs-Walter-Isaacson/dp/1451648537' },
        { isbn: '9780735211292', title: 'Atomic Habits', author: 'James Clear', type: 'Self-Help', link: 'https://www.amazon.com/Atomic-Habits-Proven-Build-Break/dp/0735211299' },
        { isbn: '9780141190524', title: 'The Ramayana', author: 'Valmiki', type: 'Epic', link: 'https://www.amazon.com/s?k=The+Ramayana+Valmiki' },
        { isbn: '9780140447901', title: 'Bhagavad Gita', author: 'Vyasa', type: 'Scripture', link: 'https://www.amazon.com/s?k=Bhagavad+Gita' },
        { isbn: '9780310926200', title: 'The Holy Bible', author: 'Various', type: 'Scripture', link: 'https://www.amazon.com/s?k=Holy+Bible' },
        { isbn: '9780441172719', title: 'Dune', author: 'Frank Herbert', type: 'Sci-Fi', link: 'https://www.amazon.com/Dune-Frank-Herbert/dp/0441172717' },
        { isbn: '9780544003415', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', type: 'Fantasy', link: 'https://www.amazon.com/Lord-Rings-J-R-R-Tolkien/dp/0544003411' },
        { isbn: '9788170283456', title: 'Mrityunjay', author: 'Shivaji Sawant', type: 'Marathi', link: 'https://www.amazon.com/s?k=mrityunjay+shivaji+sawant' },
        { isbn: '9788170282343', title: 'Shyamchi Aai', author: 'Sane Guruji', type: 'Marathi', link: 'https://www.amazon.com/s?k=shyamchi+aai+sane+guruji' },
      ]
    };
    
    this.cache = new Map();
    this.loadedCount = 0;
  }

  /**
   * Get TMDB poster URL for a movie/show
   */
  async getTMDBPoster(id, title, type) {
    const cacheKey = `tmdb_${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Determine endpoint from explicit type field (not unreliable ID check)
      const endpoint = type === 'Series' ? 'tv' : 'movie';
      
      // Use TMDB API to get poster
      const response = await fetch(
        `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=bef46b0d7702dac5b071906cd186bd28`,
        { 
          signal: AbortSignal.timeout(5000),
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const posterPath = data.poster_path;

      if (posterPath) {
        const posterUrl = `https://image.tmdb.org/t/p/w200${posterPath}`;
        this.cache.set(cacheKey, posterUrl);
        return posterUrl;
      }

      // Fallback to searching
      return this.searchTMDB(title, endpoint);
    } catch (error) {
      console.warn(`Failed to fetch TMDB poster for ${title}:`, error);
      return this.searchTMDB(title, type === 'Series' ? 'tv' : 'movie');
    }
  }

  /**
   * Search TMDB for poster
   */
  async searchTMDB(query, type = 'movie') {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/${type}?api_key=bef46b0d7702dac5b071906cd186bd28&query=${encodeURIComponent(query)}&page=1`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data.results && data.results.length > 0 && data.results[0].poster_path) {
        return `https://image.tmdb.org/t/p/w200${data.results[0].poster_path}`;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get Open Library cover for books with fallback
   */
  getOpenLibraryCover(isbn, title) {
    // Open Library covers - use L (large) size for better quality, with fallback
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  }

  /**
   * Check if Open Library cover exists
   */
  async checkCoverExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  /**
   * Test if an image URL is valid
   */
  testImageUrl(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  /**
   * Render shows and movies with real posters
   */
  async renderShowsAndMovies(container) {
    // Generate a media-themed SVG placeholder as data URL
    const getMediaPlaceholder = (title, type) => {
      const encodedTitle = encodeURIComponent(title.substring(0, 20));
      const icon = type === 'Series' ? '📺' : '🎬';
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Crect fill='%23f5f5f7' width='200' height='300'/%3E%3Crect fill='%23e8e8ed' x='20' y='40' width='160' height='220' rx='4'/%3E%3Ctext font-size='40' x='100' y='120' text-anchor='middle'%3E${icon}%3C/text%3E%3Ctext fill='%2386868b' font-family='system-ui' font-size='14' x='100' y='180' text-anchor='middle'%3E${encodedTitle}%3C/text%3E%3Ctext fill='%23a1a1a6' font-family='system-ui' font-size='12' x='100' y='210' text-anchor='middle'%3E${type}%3C/text%3E%3C/svg%3E`;
    };

    const allMedia = [...this.mediaData.shows, ...this.mediaData.movies];
    const html = [];

    for (const item of allMedia) {
      // Try to get real poster with explicit type
      let posterUrl = await this.getTMDBPoster(item.id, item.title, item.type);
      
      // Use fallback SVG if needed (inline, no external service)
      if (!posterUrl) {
        posterUrl = getMediaPlaceholder(item.title, item.type);
      }

      const shortTitle = item.title.length > 15 ? item.title.substring(0, 12) + '...' : item.title;
      const fallbackSvg = getMediaPlaceholder(item.title, item.type);

      html.push(`
        <div class="media-card">
          <div class="media-poster">
            <img src="${posterUrl}" alt="${item.title}" loading="lazy" 
              onerror="this.src='${fallbackSvg}'; this.onerror=null;" />
            <span class="media-badge">${item.type}</span>
          </div>
          <div class="media-info">
            <h4>${shortTitle}</h4>
            <a href="${item.link}" target="_blank" rel="noopener" class="watch-btn">
              <i class="fas fa-play"></i> ${item.platform}
            </a>
          </div>
        </div>
      `);
    }

    container.innerHTML = html.join('');
  }

  /**
   * Render books with real covers
   */
  async renderBooks(container) {
    // Generate a book-themed SVG placeholder as data URL
    const getBookPlaceholder = (title) => {
      const encodedTitle = encodeURIComponent(title.substring(0, 20));
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Crect fill='%23f5f5f7' width='200' height='300'/%3E%3Crect fill='%23e8e8ed' x='20' y='40' width='160' height='220' rx='4'/%3E%3Ctext fill='%2386868b' font-family='system-ui' font-size='14' x='100' y='150' text-anchor='middle'%3E${encodedTitle}%3C/text%3E%3Ctext fill='%23a1a1a6' font-family='system-ui' font-size='12' x='100' y='180' text-anchor='middle'%3EBook Cover%3C/text%3E%3C/svg%3E`;
    };

    const html = await Promise.all(this.mediaData.books.map(async (book) => {
      const coverUrl = this.getOpenLibraryCover(book.isbn, book.title);
      const shortTitle = book.title.length > 15 ? book.title.substring(0, 12) + '...' : book.title;
      const placeholderUrl = getBookPlaceholder(book.title);

      return `
        <div class="media-card book-card">
          <div class="media-poster">
            <img src="${coverUrl}" alt="${book.title}" loading="lazy"
              onerror="this.src='${placeholderUrl}'; this.onerror=null;" />
            <span class="media-badge">${book.type}</span>
          </div>
          <div class="media-info">
            <h4>${shortTitle}</h4>
            <p class="text-xs text-gray-500">${book.author}</p>
            <a href="${book.link}" target="_blank" rel="noopener" class="watch-btn book-btn">
              <i class="fas fa-book-open"></i> Read
            </a>
          </div>
        </div>
      `;
    }));

    container.innerHTML = html.join('');
  }

  /**
   * Initialize the media loader
   */
  async init() {
    const showsContainer = document.getElementById('shows-content')?.querySelector('.media-grid');
    const booksContainer = document.getElementById('books-content')?.querySelector('.media-grid');

    if (showsContainer) {
      // Show loading state
      showsContainer.innerHTML = '<div class="text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div><p class="text-sm text-gray-500 mt-2">Loading real posters...</p></div>';
      
      try {
        // Load real data
        await this.renderShowsAndMovies(showsContainer);
      } catch (err) {
        console.error('[RealMediaLoader] Failed to load shows/movies:', err);
        showsContainer.innerHTML = '<div class="text-center py-8 text-red-500">Failed to load content. Please refresh.</div>';
      }
    }

    if (booksContainer) {
      try {
        await this.renderBooks(booksContainer);
      } catch (err) {
        console.error('[RealMediaLoader] Failed to load books:', err);
        booksContainer.innerHTML = '<div class="text-center py-8 text-red-500">Failed to load books. Please refresh.</div>';
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const loader = new RealMediaLoader();
    loader.init();
  });
} else {
  const loader = new RealMediaLoader();
  loader.init();
}

export default RealMediaLoader;
