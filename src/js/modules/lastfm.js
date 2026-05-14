import { analytics } from '../services/AnalyticsService.js';

class LastFmService {
  constructor() {
    this.USERNAME = 'mbr63';
    this.PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f';
    this.UPDATE_INTERVAL_MS = 30000;
    this.LOCAL_CACHE_KEY = 'assistme:lastfm:recent';
    this.LOCAL_CACHE_TTL_MS = 10 * 60 * 1000;
    this.artworkCache = new Map();
    this.cachedTracks = null;
    this.started = false;
    this.intervalId = null;

    const apiBaseUrl =
      globalThis.APP_CONFIG?.apiBaseUrl ||
      (typeof globalThis.buildConfig !== 'undefined' && globalThis.buildConfig.apiBaseUrl) ||
      '';
    this.apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/music/recent` : '/api/music/recent';

    this.hero = null;
    this.currently = null;
  }

  initHero(elements) {
    this.hero = elements;
  }

  initCurrently(elements) {
    this.currently = elements;
  }

  escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getArtistName(track) {
    return track?.artist?.['#text'] || track?.artist?.name || 'Unknown Artist';
  }

  buildSpotifySearchUrl(trackName = '', artistName = '') {
    const query = `${trackName} ${artistName}`.trim();
    return query
      ? `https://open.spotify.com/search/${encodeURIComponent(query)}`
      : 'https://open.spotify.com';
  }

  getArtworkPlaceholder(trackName = 'Now Playing', artistName = 'Spotify') {
    const safeTrack = this.escapeHtml(String(trackName).slice(0, 28));
    const safeArtist = this.escapeHtml(String(artistName).slice(0, 26));
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop stop-color="#f3f4f6"/>
            <stop offset="1" stop-color="#e5e7eb"/>
          </linearGradient>
        </defs>
        <rect width="240" height="240" rx="28" fill="url(#g)"/>
        <path fill="rgba(255,255,255,0.92)" d="M120 44l23.5 47.6 52.5 7.7-38 37 9 52.2L120 164l-47 24.5 9-52.2-38-37 52.5-7.7L120 44Z"/>
        <text x="120" y="192" text-anchor="middle" fill="#6b7280" font-size="15" font-weight="700" font-family="system-ui,-apple-system,sans-serif">${safeTrack}</text>
        <text x="120" y="212" text-anchor="middle" fill="#9ca3af" font-size="11" font-weight="500" font-family="system-ui,-apple-system,sans-serif">${safeArtist}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  normalizeArtworkUrl(url = '', preferredSize = '300x300') {
    if (!url) return '';
    return url
      .replace('/34s/', `/${preferredSize}/`)
      .replace('/64s/', `/${preferredSize}/`)
      .replace('/174s/', `/${preferredSize}/`);
  }

  isUsableArtwork(url = '') {
    return Boolean(url) && !url.includes(this.PLACEHOLDER_HASH);
  }

  getBestImage(track, preferredSizes = ['extralarge', 'large', 'medium', 'small']) {
    if (!Array.isArray(track?.image)) {
      return this.getArtworkPlaceholder(track?.name || 'Unknown Track', this.getArtistName(track));
    }

    // Build index map for O(1) lookups
    const imageMap = new Map(track.image.map(img => [img.size, img]));

    for (const size of preferredSizes) {
      const image = imageMap.get(size);
      const normalized = this.normalizeArtworkUrl(image?.['#text'] || '', '300x300');
      if (this.isUsableArtwork(normalized)) {
        return normalized;
      }
    }

    return this.getArtworkPlaceholder(track?.name || 'Unknown Track', this.getArtistName(track));
  }

  async fetchAppleMusicArtwork(trackName = '', artistName = '') {
    const cacheKey = `${trackName}::${artistName}`.trim().toLowerCase();
    if (!cacheKey) return null;
    if (this.artworkCache.has(cacheKey)) {
      return this.artworkCache.get(cacheKey);
    }

    const pending = fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(`${trackName} ${artistName}`)}&media=music&entity=song&limit=1`
    )
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        const artwork = data?.results?.[0]?.artworkUrl100 || '';
        return artwork ? artwork.replace('/100x100bb.', '/600x600bb.') : null;
      })
      .catch(() => null);

    this.artworkCache.set(cacheKey, pending);
    return pending;
  }

  hydrateFallbackArtwork(imageNode, track) {
    if (!imageNode || !track) return;
    const currentSrc = String(imageNode.getAttribute('src') || '');
    if (!currentSrc.startsWith('data:image/')) return;

    this.fetchAppleMusicArtwork(track.name || '', this.getArtistName(track)).then(artworkUrl => {
      if (artworkUrl) {
        imageNode.src = artworkUrl;
      }
    });
  }

  setCardVisibility(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.style.display = visible ? '' : 'none';
  }

  hydrateFromLocalCache() {
    try {
      const raw = globalThis.localStorage?.getItem(this.LOCAL_CACHE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const tracks = Array.isArray(parsed?.tracks) ? parsed.tracks : null;
      const age = Date.now() - Number(parsed?.ts || 0);
      if (!tracks?.length || age > this.LOCAL_CACHE_TTL_MS) {
        return false;
      }

      this.cachedTracks = tracks;
      this.updateHero(tracks[0]);
      this.updateCurrently(tracks);
      return true;
    } catch {
      return false;
    }
  }

  persistLocalCache(tracks) {
    try {
      globalThis.localStorage?.setItem(
        this.LOCAL_CACHE_KEY,
        JSON.stringify({ ts: Date.now(), tracks })
      );
    } catch {
      // ignore localStorage failures
    }
  }

  async fetchRecent() {
    try {
      const controller = new AbortController();
      const timeoutId = globalThis.setTimeout(() => controller.abort(), 15000);
      const response = await fetch(
        `${this.apiUrl}?user=${encodeURIComponent(this.USERNAME)}&limit=10`,
        {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const tracks = Array.isArray(payload?.recenttracks?.track) ? payload.recenttracks.track : [];

      if (!tracks.length) {
        this.showEmptyState();
        return;
      }

      this.cachedTracks = tracks;
      this.persistLocalCache(tracks);
      this.updateHero(tracks[0]);
      this.updateCurrently(tracks);
      analytics?.track?.('music_loaded', {
        track_count: tracks.length,
        has_now_playing: tracks.some(track => track?.['@attr']?.nowplaying === 'true'),
      });
    } catch (error) {
      console.warn('Last.fm music fetch failed:', error);
      if (this.cachedTracks?.length) {
        this.updateHero(this.cachedTracks[0]);
        this.updateCurrently(this.cachedTracks);
        return;
      }
      this.showEmptyState();
    }
  }

  updateHero(track) {
    if (!this.hero) return;

    const trackName = track?.name || 'Unknown Track';
    const artistName = this.getArtistName(track);
    const isNowPlaying = track?.['@attr']?.nowplaying === 'true';
    const artwork = this.getBestImage(track, ['extralarge', 'large', 'medium']);

    this.hero.trackName.textContent = trackName;
    this.hero.artistName.textContent = artistName;
    this.hero.statusText.textContent = isNowPlaying ? 'Now playing' : 'Recently played';
    this.hero.albumArt.alt = `${trackName} by ${artistName}`;
    this.hero.albumArt.src = artwork;
    this.hero.lastfmLink.href = this.buildSpotifySearchUrl(trackName, artistName);
    this.hero.playingIndicator.classList.toggle('active', isNowPlaying);
    this.hero.musicCard.classList.toggle('is-playing', isNowPlaying);
    this.hydrateFallbackArtwork(this.hero.albumArt, track);
  }

  populateFeaturedTrack(_track, _isNowPlaying) {
    // Featured card no longer renders differently from the shelf cards.
    if (this.currently?.nowPlayingCard) {
      this.setCardVisibility(this.currently.nowPlayingCard, false);
    }
  }

  renderMusicShelf(tracks = []) {
    if (!this.currently?.recentContainer) return;

    this.currently.recentContainer.innerHTML = tracks
      .map(item => {
        const track = item.track || item;
        const trackName = track?.name || 'Unknown Track';
        const artistName = this.getArtistName(track);
        const artwork = this.getBestImage(track);
        const fallback = this.getArtworkPlaceholder(trackName, artistName);
        const link = this.buildSpotifySearchUrl(trackName, artistName);
        const isNowPlaying = item.state === 'now-playing';
        const badgeText = isNowPlaying ? 'Now Playing' : 'Recent';
        const actionText = isNowPlaying ? 'Listen' : 'View';
        const actionIcon = isNowPlaying ? 'fa-play' : 'fa-arrow-up-right-from-square';

        return `
          <div class="media-card currently-music-card recent-track-card ${isNowPlaying ? 'is-now-playing' : 'is-recent'}">
            <div class="media-poster">
              <img
                src="${artwork}"
                alt="${this.escapeHtml(trackName)}"
                class="recent-track-img"
                loading="lazy"
                decoding="async"
                onerror="this.src='${fallback}'; this.onerror=null;"
              />
              <span class="media-badge playing">${badgeText}</span>
            </div>
            <div class="media-info">
              <h4>${this.escapeHtml(trackName)}</h4>
              <p>${this.escapeHtml(artistName)}</p>
              <a
                href="${link}"
                target="_blank"
                rel="noopener"
                class="watch-btn"
                aria-label="Open ${this.escapeHtml(trackName)} by ${this.escapeHtml(artistName)} in Spotify"
              >
                <i class="fas ${actionIcon}"></i> ${actionText}
              </a>
            </div>
          </div>
        `;
      })
      .join('');

    tracks.forEach((item, index) => {
      const track = item.track || item;
      const imageNode = this.currently.recentContainer.querySelectorAll('.recent-track-img')[index];
      this.hydrateFallbackArtwork(imageNode, track);
    });
  }

  updateCurrently(tracks) {
    if (!this.currently) return;

    const nowPlaying = tracks.find(track => track?.['@attr']?.nowplaying === 'true') || null;
    const recentTracks = tracks.filter(track => !track?.['@attr']?.nowplaying);
    const shelfTracks = nowPlaying
      ? [
          { track: nowPlaying, state: 'now-playing' },
          ...recentTracks.slice(0, 5).map(track => ({ track, state: 'recent' })),
        ]
      : recentTracks.slice(0, 6).map(track => ({ track, state: 'recent' }));

    this.setCardVisibility(this.currently.loadingEl, false);
    this.setCardVisibility(this.currently.emptyEl, false);

    if (shelfTracks.length > 0) {
      this.populateFeaturedTrack(nowPlaying || recentTracks[0] || null, Boolean(nowPlaying));
      this.renderMusicShelf(shelfTracks);
    } else {
      this.showEmptyState();
    }
  }

  showLoadingState() {
    if (!this.currently) return;
    this.setCardVisibility(this.currently.loadingEl, true);
    this.setCardVisibility(this.currently.emptyEl, false);
    this.setCardVisibility(this.currently.nowPlayingCard, false);
    this.currently.recentContainer.innerHTML = '';
  }

  showEmptyState() {
    if (!this.currently) return;
    this.setCardVisibility(this.currently.loadingEl, false);
    this.setCardVisibility(this.currently.nowPlayingCard, false);
    this.setCardVisibility(this.currently.emptyEl, true);
    this.currently.recentContainer.innerHTML = '';
  }

  start() {
    if (this.started) return;
    this.started = true;
    const restored = this.hydrateFromLocalCache();
    if (!restored) {
      this.showLoadingState();
    }
    this.fetchRecent();
    this.intervalId = globalThis.setInterval(() => this.fetchRecent(), this.UPDATE_INTERVAL_MS);
  }
}

const lastFmService = new LastFmService();
globalThis.lastFmService = lastFmService;

function initLastFmService() {
  const heroElements = {
    trackName: document.getElementById('track-name'),
    artistName: document.getElementById('artist-name'),
    albumArt: document.getElementById('album-art'),
    statusText: document.getElementById('status-text'),
    playingIndicator: document.getElementById('playing-indicator'),
    musicCard: document.getElementById('music-card'),
    lastfmLink: document.querySelector('#home .lastfm-link'),
  };

  if (heroElements.trackName && heroElements.albumArt) {
    lastFmService.initHero(heroElements);
  }

  const currentlyElements = {
    loadingEl: document.getElementById('music-loading'),
    emptyEl: document.getElementById('music-empty'),
    nowPlayingCard: document.getElementById('now-playing-card'),
    nowPlayingTrack: document.getElementById('now-playing-track'),
    nowPlayingArtist: document.getElementById('now-playing-artist'),
    nowPlayingImg: document.getElementById('now-playing-img'),
    nowPlayingLink: document.getElementById('now-playing-link'),
    nowPlayingBadge: document.getElementById('now-playing-badge'),
    recentContainer: document.getElementById('recent-tracks-container'),
  };

  if (currentlyElements.loadingEl) {
    lastFmService.initCurrently(currentlyElements);
  }

  lastFmService.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLastFmService, { once: true });
} else {
  initLastFmService();
}

export default lastFmService;
