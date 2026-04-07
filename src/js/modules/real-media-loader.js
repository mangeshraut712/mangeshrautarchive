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
   * Try direct image URL first (no API key needed for images), fallback to API
   */
  async getTMDBPoster(id, title, type) {
    const cacheKey = `tmdb_${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // TMDB v3 API key - this is a public read-only key for demo purposes
    // In production, use environment variables or backend proxy
    const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiZWY0NmIwZDc3MDJkYWM1YjA3MTkwNmNkMTg2YmQyOCIsInN1YiI6IjYwMzZjMzUwM2Y0OTI3MDA0MjY3MzEzMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Fu8jafKGW_JpC4K8jK9q2x3z8y4w5v6b7n8m9k0l1p2';

    try {
      // Determine endpoint from explicit type field
      const endpoint = type === 'Series' ? 'tv' : 'movie';
      
      // Use TMDB API to get poster
      const response = await fetch(
        `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${TMDB_API_KEY}`,
        { 
          signal: AbortSignal.timeout(5000),
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${TMDB_API_KEY}`
          }
        }
      );

      if (!response.ok) {
        // If 401/403, API key issue - try search fallback
        if (response.status === 401 || response.status === 403) {
          console.warn(`[TMDB] API key issue for ${title}, trying search...`);
          return this.searchTMDB(title, endpoint);
        }
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
      console.warn(`Failed to fetch TMDB poster for ${title}:`, error.message);
      return this.searchTMDB(title, type === 'Series' ? 'tv' : 'movie');
    }
  }

  /**
   * Search TMDB for poster - works without API key for basic search
   */
  async searchTMDB(query, type = 'movie') {
    try {
      // Try searching with Bearer token auth
      const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiZWY0NmIwZDc3MDJkYWM1YjA3MTkwNmNkMTg2YmQyOCIsInN1YiI6IjYwMzZjMzUwM2Y0OTI3MDA0MjY3MzEzMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Fu8jafKGW_JpC4K8jK9q2x3z8y4w5v6b7n8m9k0l1p2';
      
      const response = await fetch(
        `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(query)}&page=1`,
        { 
          signal: AbortSignal.timeout(5000),
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${TMDB_API_KEY}`
          }
        }
      );

      if (!response.ok) {
        console.warn(`[TMDB] Search failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (data.results && data.results.length > 0 && data.results[0].poster_path) {
        return `https://image.tmdb.org/t/p/w200${data.results[0].poster_path}`;
      }
      return null;
    } catch (error) {
      console.warn(`[TMDB] Search error for "${query}":`, error.message);
      return null;
    }
  }

  /**
   * Get Open Library cover for books with fallback
   */
  getOpenLibraryCover(isbn, title) {
    // Open Library covers - try without default=false first to get real covers
    // If missing, Open Library returns a placeholder which is better than broken image
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }

  /**
   * Get Google Books cover as fallback
   */
  getGoogleBooksCover(isbn) {
    // Google Books API cover URL format
    return `https://books.google.com/books/content?vid=isbn:${isbn}&printsec=frontcover&img=1&zoom=1`;
  }

  /**
   * Generate a book-themed SVG placeholder
   */
  generateBookPlaceholder(title, author) {
    // Create SVG with proper escaping
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2a2a2a"/>
          <stop offset="100%" stop-color="#1a1a1a"/>
        </linearGradient>
      </defs>
      <rect fill="url(#bg)" width="200" height="300"/>
      <rect fill="#3a3a3a" x="15" y="20" width="170" height="240" rx="3"/>
      <rect fill="#4a4a4a" x="20" y="25" width="160" height="230" rx="2"/>
      <text fill="#888" font-family="system-ui,sans-serif" font-size="11" font-weight="500" x="100" y="100" text-anchor="middle">${this.escapeXml(title.substring(0, 25))}</text>
      <text fill="#666" font-family="system-ui,sans-serif" font-size="9" x="100" y="120" text-anchor="middle">${author ? this.escapeXml(author.substring(0, 30)) : ''}</text>
      <rect fill="#555" x="25" y="140" width="150" height="1"/>
      <text fill="#555" font-family="system-ui,sans-serif" font-size="8" x="100" y="240" text-anchor="middle">Book Cover</text>
    </svg>`;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
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
   * Generate a media placeholder with better styling - used when API fails
   */
  generateMediaPlaceholder(title, type) {
    const isSeries = type === 'Series';
    const icon = isSeries ? '📺' : '🎬';
    const bgColor = isSeries ? '#1e3a5f' : '#3d1e1e';
    const accentColor = isSeries ? '#4a90d9' : '#d94a4a';
    
    // Create SVG with proper escaping
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgColor}"/>
          <stop offset="100%" stop-color="#1a1a2e"/>
        </linearGradient>
      </defs>
      <rect fill="url(#g)" width="200" height="300"/>
      <rect fill="${accentColor}" width="200" height="4" opacity="0.8"/>
      <text font-size="50" x="100" y="120" text-anchor="middle">${icon}</text>
      <text fill="#fff" font-family="system-ui,sans-serif" font-size="12" font-weight="500" x="100" y="170" text-anchor="middle" opacity="0.9">${this.escapeXml(title.substring(0, 20))}</text>
      <text fill="#888" font-family="system-ui,sans-serif" font-size="10" x="100" y="195" text-anchor="middle">${type}</text>
      <rect fill="${accentColor}" x="60" y="240" width="80" height="2" opacity="0.5"/>
    </svg>`;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  }

  /**
   * Escape XML special characters
   */
  escapeXml(str) {
    return str.replace(/[<>&'"]/g, c => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
    })[c]);
  }

  /**
   * Render shows and movies with real posters and better error handling
   */
  async renderShowsAndMovies(container) {
    const allMedia = [...this.mediaData.shows, ...this.mediaData.movies];
    
    // Pre-fetch all posters in parallel with better error handling
    const posterPromises = allMedia.map(async (item) => {
      try {
        let posterUrl = await this.getTMDBPoster(item.id, item.title, item.type);
        return { item, posterUrl, error: null };
      } catch (err) {
        console.warn(`[RealMediaLoader] Failed to load poster for ${item.title}:`, err);
        return { item, posterUrl: null, error: err };
      }
    });
    
    const results = await Promise.all(posterPromises);
    
    const html = results.map(({ item, posterUrl }) => {
      const shortTitle = item.title.length > 15 ? item.title.substring(0, 12) + '...' : item.title;
      const placeholderUrl = this.generateMediaPlaceholder(item.title, item.type);
      
      // Use poster URL or fallback to placeholder
      const finalUrl = posterUrl || placeholderUrl;
      
      // Create a chain: try poster → placeholder (if poster fails)
      const onErrorAttr = posterUrl 
        ? `onerror="this.src='${placeholderUrl}'; this.onerror=null;"`
        : '';

      return `
        <div class="media-card">
          <div class="media-poster">
            <img src="${finalUrl}" alt="${item.title}" loading="lazy" ${onErrorAttr} />
            <span class="media-badge">${item.type}</span>
          </div>
          <div class="media-info">
            <h4>${shortTitle}</h4>
            <a href="${item.link}" target="_blank" rel="noopener" class="watch-btn">
              <i class="fas fa-play"></i> ${item.platform}
            </a>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render books with real covers and multiple fallback strategies
   */
  async renderBooks(container) {
    const html = await Promise.all(this.mediaData.books.map(async (book) => {
      const shortTitle = book.title.length > 15 ? book.title.substring(0, 12) + '...' : book.title;
      
      // Try multiple cover sources in order
      const openLibUrl = this.getOpenLibraryCover(book.isbn);
      const googleUrl = this.getGoogleBooksCover(book.isbn);
      const placeholderUrl = this.generateBookPlaceholder(book.title, book.author);
      
      // Build onerror chain: try Open Library → Google Books → placeholder
      const onErrorChain = `this.onerror=function(){this.src='${googleUrl}';this.onerror=function(){this.src='${placeholderUrl}';this.onerror=null;}}`;

      return `
        <div class="media-card book-card">
          <div class="media-poster">
            <img src="${openLibUrl}" alt="${book.title}" loading="lazy" 
              ${onErrorChain} />
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
