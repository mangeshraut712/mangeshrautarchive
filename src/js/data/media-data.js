/**
 * Currently Card - Real Media Data Module
 * Poster URLs are fetched at runtime via /api/posters/movie (TMDB) and
 * /api/posters/book (Google Books / Open Library).
 * Static `poster` fields are left empty so the loader shows its branded
 * SVG placeholder first, then swaps in the real image once the API responds.
 * Book covers use verified Open Library cover IDs that resolve correctly.
 * Last updated: April 2026
 */

// Shows & Movies — poster URLs fetched at runtime via /api/posters/movie
export const SHOWS_AND_MOVIES = [
  // Indian TV Shows
  {
    title: 'Taarak Mehta Ka Ooltah Chashmah',
    type: 'Series',
    poster: '',
    link: 'https://www.sonyliv.com/shows/taarak-mehta-ka-ooltah-chashmah',
    platform: 'SonyLIV',
  },
  {
    title: 'CID',
    type: 'Series',
    poster: '',
    link: 'https://www.sonyliv.com/shows/cid',
    platform: 'SonyLIV',
  },
  {
    title: 'Mahabharat',
    type: 'Series',
    poster: '',
    link: 'https://www.hotstar.com/in/tv/mahabharat/435',
    platform: 'Hotstar',
  },
  {
    title: 'Scam 1992',
    type: 'Series',
    poster: '',
    link: 'https://www.sonyliv.com/shows/scam-1992',
    platform: 'SonyLIV',
  },
  {
    title: 'Mirzapur',
    type: 'Series',
    poster: '',
    link: 'https://www.primevideo.com/detail/Mirzapur',
    platform: 'Prime',
  },
  {
    title: 'The Family Man',
    type: 'Series',
    poster: '',
    link: 'https://www.primevideo.com/detail/The-Family-Man',
    platform: 'Prime',
  },

  // International Series
  {
    title: 'Breaking Bad',
    type: 'Series',
    poster: '',
    link: 'https://www.netflix.com/title/70143836',
    platform: 'Netflix',
  },
  {
    title: 'Money Heist',
    type: 'Series',
    poster: '',
    link: 'https://www.netflix.com/title/80192098',
    platform: 'Netflix',
  },
  {
    title: 'Narcos',
    type: 'Series',
    poster: '',
    link: 'https://www.netflix.com/title/80025172',
    platform: 'Netflix',
  },
  {
    title: 'Squid Game',
    type: 'Series',
    poster: '',
    link: 'https://www.netflix.com/title/81040344',
    platform: 'Netflix',
  },
  {
    title: 'Stranger Things',
    type: 'Series',
    poster: '',
    link: 'https://www.netflix.com/title/80057281',
    platform: 'Netflix',
  },
  {
    title: 'Formula 1: Drive to Survive',
    type: 'Series',
    poster: '',
    link: 'https://www.netflix.com/title/80204890',
    platform: 'Netflix',
  },

  // Indian Movies
  {
    title: 'KGF Chapter 1',
    type: 'Movie',
    poster: '',
    link: 'https://www.primevideo.com/detail/KGF',
    platform: 'Prime',
  },
  {
    title: 'RRR',
    type: 'Movie',
    poster: '',
    link: 'https://www.netflix.com/title/81295574',
    platform: 'Netflix',
  },
  {
    title: 'Dangal',
    type: 'Movie',
    poster: '',
    link: 'https://www.netflix.com/title/80166185',
    platform: 'Netflix',
  },
  {
    title: 'Bajrangi Bhaijaan',
    type: 'Movie',
    poster: '',
    link: 'https://www.primevideo.com/detail/Bajrangi-Bhaijaan',
    platform: 'Prime',
  },
  {
    title: 'PK',
    type: 'Movie',
    poster: '',
    link: 'https://www.netflix.com/title/80057473',
    platform: 'Netflix',
  },
  {
    title: 'Vikram',
    type: 'Movie',
    poster: '',
    link: 'https://www.primevideo.com/detail/Vikram',
    platform: 'Prime',
  },
  {
    title: 'Jailer',
    type: 'Movie',
    poster: '',
    link: 'https://www.primevideo.com/detail/Jailer',
    platform: 'Prime',
  },
  {
    title: 'Kantara',
    type: 'Movie',
    poster: '',
    link: 'https://www.netflix.com/title/81663360',
    platform: 'Netflix',
  },
  {
    title: 'Baahubali 2',
    type: 'Movie',
    poster: '',
    link: 'https://www.netflix.com/title/80218621',
    platform: 'Netflix',
  },
  {
    title: 'Pushpa',
    type: 'Movie',
    poster: '',
    link: 'https://www.primevideo.com/detail/Pushpa',
    platform: 'Prime',
  },

  // Hollywood Movies
  {
    title: 'Avengers: Endgame',
    type: 'Movie',
    poster: '',
    link: 'https://www.disneyplus.com/movies/avengers-endgame',
    platform: 'Disney+',
  },
  {
    title: 'The Social Network',
    type: 'Movie',
    poster: '',
    link: 'https://www.netflix.com/title/70132721',
    platform: 'Netflix',
  },
  {
    title: 'The Blind Side',
    type: 'Movie',
    poster: '',
    link: 'https://www.netflix.com/title/70102660',
    platform: 'Netflix',
  },
  {
    title: '777 Charlie',
    type: 'Movie',
    poster: '',
    link: 'https://www.primevideo.com/detail/777-Charlie',
    platform: 'Prime',
  },
  {
    title: 'Fast Five',
    type: 'Movie',
    poster: '',
    link: 'https://www.netflix.com/title/70157102',
    platform: 'Netflix',
  },
];

// Books — verified Open Library cover IDs (queried April 2026)
export const BOOKS = [
  {
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    type: 'Biography',
    cover: 'https://covers.openlibrary.org/b/id/12374726-M.jpg',
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    type: 'Self-Help',
    cover: 'https://covers.openlibrary.org/b/id/12539702-M.jpg',
  },
  {
    title: 'The Ramayana',
    author: 'Valmiki',
    type: 'Epic',
    cover: 'https://covers.openlibrary.org/b/id/656347-M.jpg',
  },
  {
    title: 'Bhagavad Gita',
    author: 'Vyasa',
    type: 'Scripture',
    cover: 'https://covers.openlibrary.org/b/id/11157767-M.jpg',
  },
  {
    title: 'The Holy Bible',
    author: 'Various',
    type: 'Scripture',
    cover: 'https://covers.openlibrary.org/b/id/8238736-M.jpg',
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    type: 'Sci-Fi',
    cover: 'https://covers.openlibrary.org/b/id/11481354-M.jpg',
  },
  {
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    type: 'Fantasy',
    cover: 'https://covers.openlibrary.org/b/id/14625765-M.jpg',
  },
  {
    title: 'Mrityunjay',
    author: 'Shivaji Sawant',
    type: 'Marathi',
    cover: 'https://covers.openlibrary.org/b/id/7360775-M.jpg',
  },
  {
    title: 'Shyamchi Aai',
    author: 'Sane Guruji',
    type: 'Marathi',
    cover: 'https://covers.openlibrary.org/b/id/13563584-M.jpg',
  },
];

// Fallback placeholder (used when both API and static poster fail)
export const FALLBACKS = {
  movie: '',
  book: 'https://covers.openlibrary.org/b/id/12374726-M.jpg',
};
