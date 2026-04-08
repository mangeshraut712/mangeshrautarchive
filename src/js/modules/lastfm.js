/**
 * Last.fm Integration Module
 * Powers the hero music card and the Currently music shelf.
 */

import { analytics } from '../services/AnalyticsService.js';

class LastFmService {
  constructor() {
    this.API_KEY = 'bef46b0d7702dac5b071906cd186bd28';
    this.USERNAME = 'mbr63';
    // Use configured API base URL from build config
    this.API_BASE_URL = (typeof buildConfig !== 'undefined' && buildConfig.apiBaseUrl) || '';
    // In development, use relative URL; in production, use configured base URL
    this.API_URL = this.API_BASE_URL
      ? `${this.API_BASE_URL}/api/music/recent`
      : '/api/music/recent';
    this.PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f';
    this.UPDATE_INTERVAL_MS = 30000;
    this.errorCount = 0;
    this.MAX_ERRORS = 3;
    this.heroComponent = null;
    this.currentlyComponent = null;
    this.intervalId = null;
    this.started = false;
    this.cachedTracks = null;
    this.cacheExpiry = 0;
    this.CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    this.artworkCache = new Map();
    this.followStates = new Map(); // Track follow states for tracks/artists
    this.retryTimeout = null;
  }

  escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getArtworkPlaceholder(trackName = 'Now Playing', artistName = 'Spotify') {
    const safeTrack = this.escapeHtml(String(trackName || 'Now Playing').slice(0, 28));
    const safeArtist = this.escapeHtml(String(artistName || 'Spotify').slice(0, 26));
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop stop-color="#1db954"/>
            <stop offset="1" stop-color="#191414"/>
          </linearGradient>
        </defs>
        <rect width="240" height="240" rx="28" fill="url(#g)"/>
        <circle cx="120" cy="94" r="46" fill="rgba(255,255,255,0.12)"/>
        <path fill="white" opacity="0.94" d="M154 61a61 61 0 0 0-67 8 6 6 0 1 0 7 10 49 49 0 0 1 54-6 6 6 0 1 0 6-12Zm-8 27a38 38 0 0 0-40 5 6 6 0 1 0 8 9 26 26 0 0 1 28-3 6 6 0 1 0 4-11Zm-8 25a17 17 0 0 0-16 2 6 6 0 1 0 7 9 5 5 0 0 1 6-1 6 6 0 1 0 3-10Z"/>
        <rect x="24" y="154" width="192" height="56" rx="18" fill="rgba(255,255,255,0.12)"/>
        <text x="120" y="178" text-anchor="middle" fill="white" font-size="16" font-weight="700" font-family="system-ui, -apple-system, sans-serif">${safeTrack}</text>
        <text x="120" y="198" text-anchor="middle" fill="rgba(255,255,255,0.82)" font-size="11" font-weight="500" font-family="system-ui, -apple-system, sans-serif">${safeArtist}</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  getArtistName(track) {
    return track?.artist?.['#text'] || track?.artist?.name || 'Unknown Artist';
  }

  buildSpotifySearchUrl(trackName = '', artistName = '') {
    const query = `${trackName} ${artistName}`.trim();
    if (!query) return 'https://open.spotify.com';
    return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
  }

  buildLastFmArtistUrl(artistName = '') {
    if (!artistName) return 'https://www.last.fm';
    return `https://www.last.fm/music/${encodeURIComponent(artistName)}`;
  }

  buildLastFmTrackUrl(trackName = '', artistName = '') {
    if (!trackName || !artistName) return 'https://www.last.fm';
    return `https://www.last.fm/music/${encodeURIComponent(artistName)}/_/${encodeURIComponent(trackName)}`;
  }

  normalizeArtworkUrl(url = '', preferredSize = '300x300') {
    if (!url) return '';

    return url
      .replace('/34s/', `/${preferredSize}/`)
      .replace('/64s/', `/${preferredSize}/`)
      .replace('/174s/', `/${preferredSize}/`);
  }

  isUsableArtworkUrl(url = '') {
    return Boolean(url) && !url.includes(this.PLACEHOLDER_HASH);
  }

  applyImageFallback(imageNode, trackName, artistName) {
    if (!imageNode) return;
    const fallbackSrc = this.getArtworkPlaceholder(trackName, artistName);

    if (!imageNode.getAttribute('src')) {
      imageNode.setAttribute('src', fallbackSrc);
    }

    imageNode.onerror = () => {
      imageNode.src = fallbackSrc;
      imageNode.onerror = null;
    };
  }

  initHeroComponent(elements) {
    this.heroComponent = elements;
  }

  initCurrentlyComponent(elements) {
    this.currentlyComponent = elements;
  }

  setCardVisibility(element, visible, display = 'flex') {
    if (!element) return;
    element.hidden = !visible;
    element.style.display = visible ? display : 'none';
  }

  getBestImage(track, preferredSizes = ['extralarge', 'large', 'medium', 'small']) {
    const fallback = this.getArtworkPlaceholder(track?.name || 'Music', this.getArtistName(track));
    if (!track?.image || !Array.isArray(track.image)) {
      return fallback;
    }

    for (const size of preferredSizes) {
      const image = track.image.find(item => item.size === size);
      const normalized = this.normalizeArtworkUrl(image?.['#text'] || '', '300x300');
      if (this.isUsableArtworkUrl(normalized)) {
        return normalized;
      }
    }

    return fallback;
  }

  getTrackLink(track) {
    const trackName = track?.name || '';
    const artistName = this.getArtistName(track);
    return (
      this.buildSpotifySearchUrl(trackName, artistName) || track?.url || 'https://open.spotify.com'
    );
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
        return artwork ? artwork.replace(/\/100x100bb\./, '/600x600bb.') : null;
      })
      .catch(error => {
        console.warn('Apple Music artwork lookup failed:', error);
        return null;
      });

    this.artworkCache.set(cacheKey, pending);
    return pending;
  }

  hydrateMissingArtwork(imageNode, track) {
    if (!imageNode || !track) return;
    if (!String(imageNode.getAttribute('src') || '').startsWith('data:image/')) return;

    const trackName = track.name || 'Unknown Track';
    const artistName = this.getArtistName(track);

    this.fetchAppleMusicArtwork(trackName, artistName).then(artworkUrl => {
      if (artworkUrl) {
        imageNode.src = artworkUrl;
      }
    });
  }

  async fetchRecent() {
    // Check cache first
    if (this.cachedTracks && Date.now() < this.cacheExpiry && this.errorCount === 0) {
      console.log('🎵 Last.fm: Using cached data');
      this.updateHero(this.cachedTracks[0]);
      this.updateCurrently(this.cachedTracks);
      return;
    }

    if (this.errorCount >= this.MAX_ERRORS) {
      // If we have cached data, show it even when offline
      if (this.cachedTracks) {
        console.log('🎵 Last.fm: Showing cached data (offline mode)');
        this.updateHero(this.cachedTracks[0]);
        this.updateCurrently(this.cachedTracks);
        return;
      }
      this.showOfflineStates();
      return;
    }

    try {
      // Show loading state
      this.showLoadingState();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 seconds for production

      const fetchUrl = `${this.API_URL}?user=${this.USERNAME}&limit=10`;
      console.log(`🎵 Last.fm: Fetching from ${fetchUrl}`);

      const response = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
        // Add timeout for fetch itself
        method: 'GET',
      });

      console.log(`🎵 Last.fm: Response status ${response.status}`);

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `API error (${response.status})`;
        let errorDetails = '';

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details || '';
        } catch (e) {
          // If response isn't JSON, use status-based messages
          if (response.status === 403) {
            errorMessage = 'API access restricted';
            errorDetails = 'Last.fm API access is temporarily limited';
          } else if (response.status === 404) {
            errorMessage = 'Music profile not found';
            errorDetails = 'Unable to find Last.fm user profile';
          } else if (response.status === 500) {
            errorMessage = 'Last.fm service error';
            errorDetails = 'Last.fm servers are experiencing issues';
          } else if (response.status === 502) {
            errorMessage = 'Invalid API response';
            errorDetails = 'Last.fm returned unexpected data';
          } else if (response.status === 503) {
            errorMessage = 'Service temporarily unavailable';
            errorDetails = 'Last.fm API is temporarily down';
          } else if (response.status === 504) {
            errorMessage = 'Request timeout';
            errorDetails = 'Last.fm took too long to respond';
          }
        }

        console.warn('Last.fm API error:', response.status, errorMessage, errorDetails);
        this.errorCount += 1;
        this.showErrorState(errorMessage, errorDetails);
        return;
      }

      const data = await response.json();
      const tracks = data.recenttracks?.track;

      if (!tracks || (Array.isArray(tracks) && tracks.length === 0)) {
        this.showErrorState('No recent tracks found');
        return;
      }

      this.errorCount = 0;
      const trackList = Array.isArray(tracks) ? tracks : [tracks];

      // Cache the successful response
      this.cachedTracks = trackList;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION_MS;

      this.updateHero(trackList[0]);
      this.updateCurrently(trackList);

      // Track successful load
      if (typeof analytics !== 'undefined') {
        analytics.track('music_loaded', {
          track_count: trackList.length,
          has_now_playing: trackList.some(t => t?.['@attr']?.nowplaying === 'true'),
        });
      }
    } catch (error) {
      console.error('🎵 Last.fm fetch error:', error);
      this.errorCount += 1;

      let errorMessage = 'Network error';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out - please check your connection';
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to music service';
      } else if (error.message) {
        errorMessage = `Connection error: ${error.message}`;
      }

      this.showErrorState(errorMessage);
    }
  }

  hideLoadingStates() {
    if (this.currentlyComponent?.loadingEl) {
      this.setCardVisibility(this.currentlyComponent.loadingEl, false);
    }
  }

  updateHero(track) {
    if (!this.heroComponent) return;

    const isNowPlaying = track?.['@attr']?.nowplaying === 'true';
    const trackName = track?.name || 'Unknown Track';
    const artistName = this.getArtistName(track);
    const albumArtUrl = this.getBestImage(track);

    const els = this.heroComponent;
    els.trackName.textContent = trackName;
    els.artistName.textContent = artistName;
    this.applyImageFallback(els.albumArt, trackName, artistName);
    els.albumArt.src = albumArtUrl;
    els.albumArt.alt = `${trackName} by ${artistName}`;
    this.hydrateMissingArtwork(els.albumArt, track);

    if (isNowPlaying) {
      els.statusText.textContent = 'Now playing';
      els.playingIndicator.classList.add('active');
      els.musicCard.classList.add('is-playing');
    } else {
      els.statusText.textContent = 'Recently played';
      els.playingIndicator.classList.remove('active');
      els.musicCard.classList.remove('is-playing');
    }

    if (els.lastfmLink) {
      els.lastfmLink.href = this.getTrackLink(track);
    }

    // Restore premium styles for Home card
    if (els.albumArt) {
      els.albumArt.style.borderRadius = isNowPlaying ? '50%' : '12px';
    }
  }

  populateFeaturedTrack(track, isNowPlaying) {
    if (!this.currentlyComponent || !track) return;

    const els = this.currentlyComponent;
    const trackName = track.name || 'Unknown Track';
    const artistName = this.getArtistName(track);
    const artworkUrl = this.getBestImage(track);

    // Add smooth transition
    if (els.nowPlayingCard) {
      els.nowPlayingCard.style.opacity = '0';
      setTimeout(() => {
        els.nowPlayingCard.style.transition = 'opacity 0.3s ease-in-out';
        els.nowPlayingCard.style.opacity = '1';
      }, 50);
    }

    this.setCardVisibility(els.nowPlayingCard, true);
    this.setCardVisibility(els.emptyEl, false);
    els.nowPlayingTrack.textContent = trackName;
    els.nowPlayingArtist.textContent = artistName;
    els.nowPlayingDescription.textContent = '';
    els.nowPlayingBadge.textContent = isNowPlaying ? 'Now Playing' : 'Recently Played';
    els.nowPlayingImg.alt = `${trackName} by ${artistName}`;
    els.nowPlayingLink.href = this.getTrackLink(track);
    els.nowPlayingLink.setAttribute('aria-label', `Open ${trackName} by ${artistName} in Spotify`);
    els.playingIndicator.style.display = isNowPlaying ? 'flex' : 'none';

    // Description is optional
    if (els.nowPlayingDescription) {
      els.nowPlayingDescription.textContent = '';
    }

    // Add follow button to featured track
    const followContainer =
      els.nowPlayingCard.querySelector('.follow-container') || document.createElement('div');
    followContainer.className = 'follow-container';
    followContainer.innerHTML = '';
    this.addFollowButton(track, 'track', followContainer);

    const infoSection = els.nowPlayingCard.querySelector('.media-info');
    if (infoSection && !infoSection.contains(followContainer)) {
      infoSection.appendChild(followContainer);
    }

    this.applyImageFallback(els.nowPlayingImg, trackName, artistName);
    els.nowPlayingImg.src = artworkUrl;
    this.hydrateMissingArtwork(els.nowPlayingImg, track);
  }

  renderRecentTracks(tracks = []) {
    if (!this.currentlyComponent?.recentContainer) return;

    const els = this.currentlyComponent;
    els.recentContainer.innerHTML = tracks
      .map(track => {
        const trackName = track.name || 'Unknown Track';
        const artistName = this.getArtistName(track);
        const artworkUrl = this.getBestImage(track);
        const fallback = this.getArtworkPlaceholder(trackName, artistName);
        const link = this.getTrackLink(track);

        return `
          <div class="recent-track-item" data-track-id="${this.escapeHtml(trackName)}-${this.escapeHtml(artistName)}">
            <a href="${link}" target="_blank" rel="noopener" class="recent-track-link" aria-label="Open ${this.escapeHtml(trackName)} by ${this.escapeHtml(artistName)} in Spotify">
              <img src="${artworkUrl}" alt="${this.escapeHtml(trackName)}" class="recent-track-img" loading="lazy" decoding="async" onerror="this.src='${fallback}'; this.onerror=null;">
              <div class="recent-track-info">
                <h5 class="recent-track-name">${this.escapeHtml(trackName)}</h5>
                <p class="recent-track-artist">${this.escapeHtml(artistName)}</p>
              </div>
            </a>
            <div class="recent-track-actions">
              <button class="follow-btn-small" onclick="lastFmService.toggleFollow('${this.escapeHtml(trackName)}-${this.escapeHtml(artistName)}'.toLowerCase().replace(/\\s+/g, '-'), 'track')">
                <i class="far fa-heart"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    tracks.forEach((track, index) => {
      const imageNode = els.recentContainer.querySelectorAll('.recent-track-img')[index];
      this.hydrateMissingArtwork(imageNode, track);
    });
  }

  updateCurrently(tracks) {
    if (!this.currentlyComponent) return;

    const els = this.currentlyComponent;
    const nowPlaying = tracks.find(track => track?.['@attr']?.nowplaying === 'true') || null;
    const recentTracks = tracks.filter(track => !track?.['@attr']?.nowplaying);
    const featuredTrack = nowPlaying || recentTracks[0] || null;
    const shelfTracks = nowPlaying ? recentTracks.slice(0, 5) : recentTracks.slice(1, 6);

    this.setCardVisibility(els.loadingEl, false);

    if (featuredTrack) {
      this.populateFeaturedTrack(featuredTrack, Boolean(nowPlaying));
    } else {
      this.setCardVisibility(els.nowPlayingCard, false);
      this.setCardVisibility(els.emptyEl, true);
    }

    this.renderRecentTracks(shelfTracks);
  }

  showOfflineStates() {
    if (this.heroComponent) {
      const els = this.heroComponent;
      if (this.cachedTracks && this.cachedTracks[0]) {
        // Show cached data
        this.updateHero(this.cachedTracks[0]);
      } else {
        els.statusText.textContent = 'Offline';
        els.trackName.textContent = 'Service';
        els.artistName.textContent = 'Unavailable';
        this.applyImageFallback(els.albumArt, 'Service Offline', 'Spotify');
        els.albumArt.src = this.getArtworkPlaceholder('Service Offline', 'Spotify');
        els.playingIndicator.classList.remove('active');
        els.musicCard.classList.remove('is-playing');
      }
    }

    if (this.currentlyComponent) {
      const els = this.currentlyComponent;
      this.setCardVisibility(els.loadingEl, false);

      if (this.cachedTracks) {
        // Show cached data
        this.updateCurrently(this.cachedTracks);
        // Add a note that it's cached
        const cachedNotice = document.createElement('div');
        cachedNotice.style.cssText =
          'font-size: 0.8em; color: var(--text-secondary); margin-top: 0.5rem; text-align: center;';
        cachedNotice.textContent = 'Showing cached music data';
        els.nowPlayingCard.appendChild(cachedNotice);
      } else {
        this.setCardVisibility(els.emptyEl, true);
        els.emptyEl.querySelector('h4').textContent = 'Music shelf offline';
        els.emptyEl.querySelector('p').textContent =
          'Music service is temporarily unavailable. Open Spotify and try again shortly.';
        this.setCardVisibility(els.nowPlayingCard, false);
        els.recentContainer.innerHTML = '';
      }
    }
  }

  toggleFollow(trackId, type = 'track') {
    const currentState = this.followStates.get(trackId) || false;
    this.followStates.set(trackId, !currentState);

    // Update UI
    const followBtn = document.querySelector(`[data-follow-id="${trackId}"]`);
    if (followBtn) {
      followBtn.classList.toggle('followed', !currentState);
      followBtn.innerHTML = !currentState
        ? '<i class="fas fa-heart"></i> Following'
        : '<i class="far fa-heart"></i> Follow';
    }

    // Analytics
    if (typeof analytics !== 'undefined') {
      analytics.track('music_follow', {
        track_id: trackId,
        type: type,
        action: !currentState ? 'follow' : 'unfollow',
      });
    }

    return !currentState;
  }

  addFollowButton(track, type = 'track', container) {
    if (!container) return;

    const trackId =
      type === 'track'
        ? `${track.name}-${track.artist['#text']}`.toLowerCase().replace(/\s+/g, '-')
        : track.artist['#text'].toLowerCase().replace(/\s+/g, '-');

    const followBtn = document.createElement('button');
    followBtn.className = 'follow-btn';
    followBtn.setAttribute('data-follow-id', trackId);
    followBtn.innerHTML = '<i class="far fa-heart"></i> Follow';

    const isFollowed = this.followStates.get(trackId) || false;
    if (isFollowed) {
      followBtn.classList.add('followed');
      followBtn.innerHTML = '<i class="fas fa-heart"></i> Following';
    }

    followBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleFollow(trackId, type);
    });

    container.appendChild(followBtn);
  }

  showLoadingState() {
    if (this.currentlyComponent) {
      const els = this.currentlyComponent;
      this.setCardVisibility(els.loadingEl, true);
      this.setCardVisibility(els.emptyEl, false);
      this.setCardVisibility(els.nowPlayingCard, false);

      // Add loading animation
      if (els.loadingEl) {
        els.loadingEl.innerHTML = `
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading your music...</p>
          </div>
        `;
      }
    }
  }

  showErrorState(errorMessage = 'Unable to load music data', errorDetails = '') {
    if (this.currentlyComponent) {
      const els = this.currentlyComponent;
      this.setCardVisibility(els.loadingEl, false);
      this.setCardVisibility(els.nowPlayingCard, false);
      this.setCardVisibility(els.emptyEl, true);

      if (els.emptyEl) {
        const detailsHtml = errorDetails
          ? `<small style="color: var(--text-secondary); font-size: 0.8em; display: block; margin: 0.5em 0;">${errorDetails}</small>`
          : '';

        // Show a more user-friendly message
        const friendlyMessage =
          errorMessage.includes('timeout') || errorMessage.includes('Request timed out')
            ? 'Music service is taking longer than usual to respond'
            : errorMessage.includes('connect')
              ? 'Unable to connect to music service right now'
              : 'Music data is temporarily unavailable';

        els.emptyEl.innerHTML = `
          <div class="error-state">
            <i class="fas fa-music"></i>
            <h4>Music Service</h4>
            <p>${friendlyMessage}</p>
            ${detailsHtml}
            <div style="margin-top: 1rem; font-size: 0.9em; color: var(--text-secondary);">
              <p style="margin: 0.5rem 0;">Try opening Spotify or Last.fm in another tab to refresh your music data.</p>
            </div>
            <button class="retry-btn" onclick="lastFmService.retryLoad()">
              <i class="fas fa-redo"></i> Try Again
            </button>
          </div>
        `;
      }
    }
  }

  retryLoad() {
    this.errorCount = 0;
    this.showLoadingState();
    this.fetchRecent();
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.showLoadingState();
    this.fetchRecent();
    this.intervalId = window.setInterval(() => this.fetchRecent(), this.UPDATE_INTERVAL_MS);
  }
}

const lastFmService = new LastFmService();
window.lastFmService = lastFmService;

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

  if (heroElements.trackName) {
    lastFmService.initHeroComponent(heroElements);
    lastFmService.applyImageFallback(heroElements.albumArt, 'Now Playing', 'Last.fm');
  }

  const currentlyElements = {
    loadingEl: document.getElementById('music-loading'),
    emptyEl: document.getElementById('music-empty'),
    nowPlayingCard: document.getElementById('now-playing-card'),
    nowPlayingTrack: document.getElementById('now-playing-track'),
    nowPlayingArtist: document.getElementById('now-playing-artist'),
    nowPlayingDescription: document.getElementById('now-playing-description'),
    nowPlayingImg: document.getElementById('now-playing-img'),
    nowPlayingLink: document.getElementById('now-playing-link'),
    nowPlayingBadge: document.getElementById('now-playing-badge'),
    playingIndicator: document.getElementById('currently-playing-indicator'),
    recentContainer: document.getElementById('recent-tracks-container'),
  };

  if (currentlyElements.loadingEl) {
    lastFmService.initCurrentlyComponent(currentlyElements);
    lastFmService.applyImageFallback(currentlyElements.nowPlayingImg, 'Now Playing', 'Spotify');
  }

  lastFmService.start();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLastFmService, { once: true });
  } else {
    initLastFmService();
  }
}

export default lastFmService;
