/**
 * Compact music card.
 * Uses /api/profile/spotify, which may be backed by Spotify directly or Last.fm fallback.
 * The frontend keeps Spotify branding in the UI and hides backend/provider details.
 */
(function () {
  'use strict';

  const MUSIC_ENDPOINT = '/api/profile/spotify';
  const POLL_INTERVAL_MS = 15000;

  const card = document.getElementById('spotify-now-playing');
  if (!card) return;

  const elements = {
    sourceIcon: document.getElementById('spotify-source-icon'),
    sourceName: document.getElementById('spotify-source-name'),
    statusDot: document.getElementById('spotify-status-dot'),
    statusText: document.getElementById('spotify-status-pill'),
    albumArt: document.getElementById('spotify-album-art'),
    song: document.getElementById('spotify-song'),
    artist: document.getElementById('spotify-artist'),
    link: document.getElementById('spotify-link'),
    equalizerBars: Array.from(card.querySelectorAll('.eq-bar')),
  };

  let pollTimer = null;

  function setEqualizer(active) {
    elements.equalizerBars.forEach(bar => {
      bar.classList.toggle('eq-bar--spotify', active);
      bar.classList.toggle('eq-bar--idle', !active);
    });
  }

  function setStatusDot(active) {
    if (!elements.statusDot) return;
    const isDark = document.documentElement.classList.contains('dark');
    elements.statusDot.style.backgroundColor = active ? (isDark ? '#fff' : '#000') : '#86868b';
    elements.statusDot.style.boxShadow = active
      ? isDark
        ? '0 0 8px rgba(255, 255, 255, 0.4)'
        : '0 0 8px rgba(0, 0, 0, 0.2)'
      : 'none';
  }

  function setSourcePresentation() {
    if (elements.sourceName) {
      elements.sourceName.textContent = 'Spotify';
    }

    if (elements.sourceIcon) {
      elements.sourceIcon.className = 'fab fa-spotify';
      const isDark = document.documentElement.classList.contains('dark');
      elements.sourceIcon.style.color = isDark ? '#fff' : '#000';
    }
  }

  function renderState({
    title = 'Nothing playing',
    artist = '',
    status = 'Idle',
    albumArt = 'assets/images/profile-icon.png',
    trackUrl = 'https://open.spotify.com/',
    active = false,
  }) {
    card.classList.toggle('is-playing', active);
    card.classList.toggle('not-playing', !active);

    setSourcePresentation();
    setEqualizer(active);
    setStatusDot(active);

    if (elements.song) {
      elements.song.textContent = title;
    }

    if (elements.artist) {
      elements.artist.textContent = artist;
    }

    if (elements.statusText) {
      elements.statusText.textContent = status;
    }

    if (elements.albumArt) {
      elements.albumArt.src = albumArt;
      elements.albumArt.alt = title ? `${title} album art` : 'Album art';
    }

    if (elements.link) {
      elements.link.href = trackUrl;
      elements.link.title = 'Open track';
    }
  }

  function normalizePayload(payload) {
    if (!payload || payload.available !== true) {
      return {
        title: 'Nothing playing',
        artist: '',
        status: 'Connect a music source',
        albumArt: 'assets/images/profile-icon.png',
        trackUrl: 'https://open.spotify.com/',
        active: false,
      };
    }

    return {
      title: payload.song || payload.title || 'Unknown track',
      artist: payload.artist || '',
      status: payload.statusLabel || (payload.isPlaying ? 'Now playing' : 'Recently played'),
      albumArt: payload.albumArt || payload.albumArtUrl || 'assets/images/profile-icon.png',
      trackUrl: payload.trackUrl || 'https://open.spotify.com/',
      active: Boolean(payload.isPlaying),
    };
  }

  async function fetchMusicState() {
    try {
      const response = await fetch(MUSIC_ENDPOINT, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        renderState(normalizePayload(null));
        return;
      }

      const payload = await response.json();
      renderState(normalizePayload(payload));
    } catch {
      renderState(normalizePayload(null));
    }
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = window.setInterval(() => {
      if (!document.hidden) {
        fetchMusicState();
      }
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (!pollTimer) return;
    window.clearInterval(pollTimer);
    pollTimer = null;
  }

  fetchMusicState();
  startPolling();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopPolling();
      return;
    }

    fetchMusicState();
    startPolling();
  });
})();
