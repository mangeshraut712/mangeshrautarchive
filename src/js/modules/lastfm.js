import { analytics } from '../services/AnalyticsService.js';
import { isPerformanceAudit } from '../utils/perf-audit.js';
import { escapeHtml as escapeHtmlShared } from '../utils/escape-html.js';

const LASTFM_CDN_ORIGIN = 'https://lastfm.freetls.fastly.net';

function ensureLastFmPreconnect() {
  if (document.querySelector('link[data-lastfm-preconnect]')) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = LASTFM_CDN_ORIGIN;
  link.crossOrigin = 'anonymous';
  link.dataset.lastfmPreconnect = '1';
  document.head.appendChild(link);
}

const LASTFM_JSONP_TIMEOUT_MS = 4500;
const LASTFM_PROXY_TIMEOUT_MS = 3500;

class LastFmService {
  constructor() {
    this.USERNAME = 'mbr63';
    this.PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f';
    this.UPDATE_INTERVAL_MS = 20000; // 20s — beats 25s backend cache TTL
    this.ARTWORK_CACHE_TTL_MS = 10 * 60 * 1000; // 10 min artwork cache
    this.LOCAL_CACHE_KEY = 'assistme:lastfm:recent';
    this.LOCAL_STALE_TTL_MS = 24 * 60 * 60 * 1000;
    this.artworkCache = new Map(); // key => { url, ts }
    this.cachedTracks = null;
    this.started = false;
    this.intervalId = null;
    this._currentTrackId = null; // track identity for change detection

    const apiBaseUrl = this.resolveMusicApiBase();
    const apiBaseNormalized = apiBaseUrl ? apiBaseUrl.replace(/\/$/, '') : '';
    this.apiUrl = apiBaseNormalized ? `${apiBaseNormalized}/api/music/recent` : '/api/music/recent';
    this.artworkApiUrl = apiBaseNormalized
      ? `${apiBaseNormalized}/api/music/artwork`
      : '/api/music/artwork';
    this.publicApiKey =
      globalThis.APP_CONFIG?.lastfmApiKey ||
      (typeof globalThis.buildConfig !== 'undefined' && globalThis.buildConfig.lastfmApiKey) ||
      '';

    this.hero = null;
    this.currently = null;
  }

  initHero(elements) {
    this.hero = elements;
  }

  initCurrently(elements) {
    this.currently = elements;
  }

  resolveMusicApiBase() {
    if (typeof window === 'undefined') {
      return globalThis.APP_CONFIG?.apiBaseUrl || globalThis.buildConfig?.apiBaseUrl || '';
    }

    const host = window.location.hostname;
    const loopback = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(host);
    if (loopback) {
      return window.location.origin;
    }

    // Prefer CHAT_API_BASE / APP_CONFIG (Cloudflare Worker) over blocked Vercel
    const EDGE = 'https://assistme-chat.mangeshraut712.workers.dev';
    const configured =
      globalThis.APP_CONFIG?.apiBaseUrl || globalThis.buildConfig?.apiBaseUrl || '';
    if (configured && !/mangeshraut\.pro|vercel\.app/i.test(configured)) {
      return configured.replace(/\/$/, '');
    }

    if (host.endsWith('github.io')) {
      // Edge worker hosts /api/music/recent — never hit blocked Vercel
      if (configured && !/mangeshraut\.pro|vercel\.app/i.test(configured)) {
        return configured.replace(/\/$/, '');
      }
      return EDGE;
    }

    return configured || window.location.origin;
  }

  isLoopbackHost() {
    if (typeof window === 'undefined') {
      return false;
    }

    return ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(window.location.hostname);
  }

  escapeHtml(value = '') {
    return escapeHtmlShared(value);
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
    if (isPerformanceAudit()) {
      return null;
    }

    const cacheKey = `${trackName}::${artistName}`.trim().toLowerCase();
    if (!cacheKey) return null;

    // Check cache with TTL
    const cached = this.artworkCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.ARTWORK_CACHE_TTL_MS) {
      return cached.promise;
    }

    const pending = fetch(
      `${this.artworkApiUrl}?${new URLSearchParams({
        track: trackName,
        artist: artistName,
      })}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout?.(3500),
      }
    )
      .then(response => (response.ok ? response.json() : null))
      .then(data => data?.artwork_url || null)
      .catch(() => null);

    this.artworkCache.set(cacheKey, { promise: pending, ts: Date.now() });
    return pending;
  }

  hydrateFallbackArtwork(imageNode, track, { fallbackUrl = '' } = {}) {
    if (!imageNode || !track) return;
    this.fetchAppleMusicArtwork(track.name || '', this.getArtistName(track)).then(artworkUrl => {
      const nextUrl = artworkUrl || fallbackUrl;
      if (nextUrl && imageNode.src !== nextUrl) {
        imageNode.src = nextUrl;
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
      if (!tracks?.length || age > this.LOCAL_STALE_TTL_MS) {
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

  getTracksFromPayload(payload) {
    return Array.isArray(payload?.recenttracks?.track) ? payload.recenttracks.track : [];
  }

  applyRecentPayload(payload, source) {
    const tracks = this.getTracksFromPayload(payload);
    if (!tracks.length) {
      return false;
    }

    this.cachedTracks = tracks;
    this.persistLocalCache(tracks);
    this.updateHero(tracks[0]);
    this.updateCurrently(tracks);
    analytics?.track?.('music_loaded', {
      source,
      track_count: tracks.length,
      has_now_playing: tracks.some(track => track?.['@attr']?.nowplaying === 'true'),
    });
    return true;
  }

  async fetchRecentFromProxy(limit = 10) {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), LASTFM_PROXY_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${this.apiUrl}?user=${encodeURIComponent(this.USERNAME)}&limit=${encodeURIComponent(limit)}`,
        {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  fetchRecentViaJsonp(limit = 10) {
    if (!this.publicApiKey || !globalThis.document) {
      return Promise.reject(new Error('Last.fm direct fallback is not available'));
    }

    return new Promise((resolve, reject) => {
      const callbackName = `__assistMeLastfm${Date.now()}${Math.random().toString(36).slice(2)}`;
      const script = globalThis.document.createElement('script');
      const cleanup = () => {
        globalThis.clearTimeout(timeoutId);
        delete globalThis[callbackName];
        script.remove();
      };
      const params = new URLSearchParams({
        method: 'user.getrecenttracks',
        user: this.USERNAME,
        api_key: this.publicApiKey,
        format: 'json',
        limit: String(limit),
        callback: callbackName,
      });
      const timeoutId = globalThis.setTimeout(() => {
        cleanup();
        reject(new Error('Last.fm direct fallback timed out'));
      }, LASTFM_JSONP_TIMEOUT_MS);

      globalThis[callbackName] = payload => {
        cleanup();
        resolve(payload);
      };

      script.async = true;
      script.src = `https://ws.audioscrobbler.com/2.0/?${params.toString()}`;
      script.onerror = () => {
        cleanup();
        reject(new Error('Last.fm direct fallback failed'));
      };

      globalThis.document.head.appendChild(script);
    });
  }

  async fetchRecent() {
    // Hydrate from local cache first so GitHub Pages paints music without waiting on a dead API.
    this.hydrateFromLocalCache();

    const apiDead = (() => {
      try {
        return sessionStorage.getItem('portfolio_api_host_dead_v1') === '1';
      } catch {
        return false;
      }
    })();

    const onGithubPages =
      typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');

    if (!apiDead && !onGithubPages) {
      try {
        const payload = await this.fetchRecentFromProxy(10);
        if (this.applyRecentPayload(payload, 'proxy')) {
          return;
        }
      } catch {
        // Quiet fail — try JSONP / cache
      }
    } else if (!apiDead && onGithubPages) {
      // One quiet attempt; mark host dead on 402 so analytics/github stop hammering Vercel
      try {
        const payload = await this.fetchRecentFromProxy(10);
        if (this.applyRecentPayload(payload, 'proxy')) {
          return;
        }
      } catch {
        try {
          sessionStorage.setItem('portfolio_api_host_dead_v1', '1');
        } catch {
          // ignore
        }
      }
    }

    if (!this.publicApiKey) {
      if (this.cachedTracks?.length) {
        this.updateHero(this.cachedTracks[0]);
        this.updateCurrently(this.cachedTracks);
        return;
      }

      this.showEmptyState();
      return;
    }

    try {
      const payload = await this.fetchRecentViaJsonp(10);
      if (this.applyRecentPayload(payload, 'direct-jsonp')) {
        return;
      }
    } catch {
      // Quiet fail
    }

    if (this.cachedTracks?.length) {
      this.updateHero(this.cachedTracks[0]);
      this.updateCurrently(this.cachedTracks);
      return;
    }

    this.showEmptyState();
  }

  updateHero(track) {
    if (!this.hero) return;

    const trackName = track?.name || 'Unknown Track';
    const artistName = this.getArtistName(track);
    const isNowPlaying = track?.['@attr']?.nowplaying === 'true';
    const trackId = `${trackName}::${artistName}`;

    // Detect track change — reset artwork src to placeholder immediately
    if (this._currentTrackId !== trackId) {
      this._currentTrackId = trackId;
      // Show placeholder while real artwork loads
      this.hero.albumArt.src = this.getArtworkPlaceholder(trackName, artistName);
    }

    const artwork = this.getBestImage(track, ['extralarge', 'large', 'medium']);

    this.hero.trackName.textContent = trackName;
    this.hero.artistName.textContent = artistName;
    this.hero.statusText.textContent = isNowPlaying ? 'Now playing' : 'Recently played';
    this.hero.albumArt.alt = `${trackName} by ${artistName}`;
    this.hero.lastfmLink.href = this.buildSpotifySearchUrl(trackName, artistName);
    this.hero.playingIndicator.classList.toggle('active', isNowPlaying);
    this.hero.musicCard.classList.toggle('is-playing', isNowPlaying);
    this.hydrateFallbackArtwork(this.hero.albumArt, track, {
      fallbackUrl: this.isUsableArtwork(artwork) ? artwork : '',
    });
  }

  populateFeaturedTrack(_track, _isNowPlaying) {
    // Featured card no longer renders differently from the shelf cards.
    if (this.currently?.nowPlayingCard) {
      this.setCardVisibility(this.currently.nowPlayingCard, false);
    }
  }

  isSafeHttpsUrl(value) {
    try {
      const parsed = new URL(String(value || ''), 'https://example.invalid');
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  renderMusicShelf(tracks = []) {
    if (!this.currently?.recentContainer) return;

    const fragment = document.createDocumentFragment();

    tracks.forEach(item => {
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

      const card = document.createElement('div');
      card.className = `media-card currently-music-card recent-track-card ${
        isNowPlaying ? 'is-now-playing' : 'is-recent'
      }`;

      const poster = document.createElement('div');
      poster.className = 'media-poster';

      const img = document.createElement('img');
      img.alt = trackName;
      img.className = 'recent-track-img';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = this.isSafeHttpsUrl(artwork) ? artwork : fallback;
      img.addEventListener(
        'error',
        () => {
          if (img.src !== fallback) img.src = fallback;
        },
        { once: true }
      );

      const badge = document.createElement('span');
      badge.className = 'media-badge playing';
      badge.textContent = badgeText;

      poster.append(img, badge);

      const info = document.createElement('div');
      info.className = 'media-info';

      const title = document.createElement('h4');
      title.textContent = trackName;
      const artist = document.createElement('p');
      artist.textContent = artistName;

      const action = document.createElement('a');
      action.href = link;
      action.target = '_blank';
      action.rel = 'noopener';
      action.className = 'watch-btn';
      action.setAttribute('aria-label', `Open ${trackName} by ${artistName} in Spotify`);
      action.innerHTML = `<i class="fas ${actionIcon}" aria-hidden="true"></i><span></span>`;
      const actionLabel = action.querySelector('span');
      if (actionLabel) actionLabel.textContent = actionText;

      info.append(title, artist, action);
      card.append(poster, info);
      fragment.append(card);
    });

    this.currently.recentContainer.replaceChildren(fragment);
  }

  updateCurrently(tracks) {
    if (!this.currently) return;

    let nowPlaying = null;
    const recentTracks = [];
    for (const track of tracks) {
      if (!nowPlaying && track?.['@attr']?.nowplaying === 'true') {
        nowPlaying = track;
      } else {
        recentTracks.push(track);
      }
    }
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

  showHeroLoadingState() {
    if (!this.hero) return;
    this.hero.statusText.textContent = 'Syncing…';
    this.hero.trackName.textContent = 'Fetching recent plays';
    this.hero.artistName.textContent = '';
    this.hero.playingIndicator?.classList.remove('active');
    this.hero.musicCard?.classList.remove('is-playing');
  }

  showHeroEmptyState() {
    if (!this.hero) return;
    this.hero.statusText.textContent = 'Not playing';
    this.hero.trackName.textContent = 'No recent plays';
    this.hero.artistName.textContent = 'Open Spotify to scrobble';
    this.hero.playingIndicator?.classList.remove('active');
    this.hero.musicCard?.classList.remove('is-playing');
  }

  showLoadingState() {
    this.showHeroLoadingState();
    if (!this.currently) return;
    this.setCardVisibility(this.currently.loadingEl, true);
    this.setCardVisibility(this.currently.emptyEl, false);
    this.setCardVisibility(this.currently.nowPlayingCard, false);
    this.currently.recentContainer.innerHTML = '';
  }

  showEmptyState() {
    this.showHeroEmptyState();
    if (!this.currently) return;
    this.setCardVisibility(this.currently.loadingEl, false);
    this.setCardVisibility(this.currently.nowPlayingCard, false);
    this.setCardVisibility(this.currently.emptyEl, true);
    this.currently.recentContainer.innerHTML = '';
  }

  start() {
    if (this.started) return;
    this.started = true;
    ensureLastFmPreconnect();
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
  if (isPerformanceAudit()) {
    return;
  }

  const heroElements = {
    trackName: document.getElementById('track-name'),
    artistName: document.getElementById('artist-name'),
    albumArt: document.getElementById('album-art'),
    statusText: document.getElementById('status-text'),
    playingIndicator: document.getElementById('playing-indicator'),
    musicCard: document.getElementById('music-card'),
    lastfmLink: document.querySelector('#home .music-card-spotify-link'),
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
