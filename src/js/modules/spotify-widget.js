/**
 * Spotify Now Playing Widget (Live Activity integration)
 * Polls /api/spotify for real-time track data.
 */
(function () {
  'use strict';

  const POLL_INTERVAL = 15000; // poll every 15s
  const card = document.getElementById('spotify-now-playing');
  if (!card) return;
  const SPOTIFY_ENDPOINT = '/api/profile/spotify';

  const songEl = document.getElementById('spotify-song');
  const artistEl = document.getElementById('spotify-artist');
  const albumEl = document.getElementById('spotify-album-art');
  const statusEl = document.getElementById('spotify-status-pill');
  const statusDotEl = document.getElementById('spotify-status-dot');
  const spotifyLinkEl = document.getElementById('spotify-link');
  const equalizerBars = card.querySelectorAll('.eq-bar');

  let pollTimer = null;

  function setIdleEq() {
    equalizerBars.forEach(bar => {
      bar.classList.add('eq-bar--idle');
      bar.classList.remove('eq-bar--spotify');
    });
  }

  function setActiveEq() {
    equalizerBars.forEach(bar => {
      bar.classList.remove('eq-bar--idle');
      bar.classList.add('eq-bar--spotify');
    });
  }

  function setStatusLabel(label) {
    if (statusEl) {
      statusEl.textContent = label;
    }
  }

  function toggleFallbackLinks(showLinks) {
    if (!providerLinksEl) return;
    providerLinksEl.hidden = !showLinks;
  }

  function setSource(source) {
    if (!sourceNameEl || !sourceIconEl) return;

    if (source === 'lastfm') {
      sourceNameEl.textContent = 'Music';
      sourceIconEl.className = 'fas fa-music'; // Generic musical look
      sourceIconEl.style.color = '#ff2d55';
      card.setAttribute('aria-label', 'Music Now Playing');
      return;
    }

    sourceNameEl.textContent = 'Spotify';
    sourceIconEl.className = 'fab fa-spotify';
    sourceIconEl.style.color = '#1DB954';
    card.setAttribute('aria-label', 'Spotify Now Playing');
  }

  function updateProviderTargets(track = null) {
    if (!providerLinks || !providerLinks.spotify) return;

    const spotifyUrl = track?.songUrl || track?.trackUrl || 'https://open.spotify.com/';
    providerLinks.spotify.href = spotifyUrl;
  }


  let lastPlayedData = null;

  function setStatusColor(isActive) {
    if (!statusDotEl) return;
    if (isActive) {
      statusDotEl.style.backgroundColor = '#1DB954'; // Spotify Green
      statusDotEl.style.boxShadow = '0 0 8px rgba(29, 185, 84, 0.4)';
    } else {
      statusDotEl.style.backgroundColor = '#86868b'; // Apple Gray
      statusDotEl.style.boxShadow = 'none';
    }
  }

  function setNotPlaying() {
    card.classList.remove('is-playing');
    card.classList.add('not-playing');
    setIdleEq();
    setStatusColor(false);
    
    // If we have previous data, stay in "Recently Played" state instead of "Nothing Playing"
    if (lastPlayedData) {
      setRecent(lastPlayedData);
      return;
    }

    if (songEl) songEl.textContent = 'Recently played';
    if (artistEl) artistEl.textContent = 'Spotify';
    if (albumEl) {
      albumEl.src = 'assets/images/profile-icon.png';
      albumEl.alt = 'Spotify';
    }
    if (spotifyLinkEl) spotifyLinkEl.href = 'https://open.spotify.com/';
    setStatusLabel('Paused');
  }

  function setPlaying(data) {
    card.classList.add('is-playing');
    card.classList.remove('not-playing');
    setActiveEq();
    setStatusColor(true);
    lastPlayedData = data; // Cache for later

    if (songEl) songEl.textContent = data.song || 'Unknown Track';
    if (artistEl) artistEl.textContent = data.artist || 'Unknown Artist';
    if (albumEl && data.albumArt) {
      albumEl.src = data.albumArt;
      albumEl.alt = `${data.song} album art`;
    }
    if (spotifyLinkEl) spotifyLinkEl.href = data.trackUrl || 'https://open.spotify.com/';
    setStatusLabel(data.statusLabel || 'Now playing');
  }

  function setRecent(data) {
    card.classList.remove('is-playing');
    card.classList.add('not-playing');
    setIdleEq();
    setStatusColor(false);

    if (songEl) songEl.textContent = data.song || data.title || 'Recently played';
    if (artistEl) artistEl.textContent = data.artist || '';
    if (albumEl) {
      albumEl.src = data.albumArt || data.albumArtUrl || 'assets/images/profile-icon.png';
      albumEl.alt = (data.song || data.title) ? `${data.song || data.title} album art` : '';
    }
    if (spotifyLinkEl) spotifyLinkEl.href = data.trackUrl || 'https://open.spotify.com/';
    setStatusLabel(data.statusLabel || 'Recently played');
  }

  async function fetchNowPlaying() {
    try {
      const res = await fetch(SPOTIFY_ENDPOINT, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) { setNotPlaying(); return; }
      const data = await res.json();
      
      if (data?.available && data?.isPlaying) {
        const playingData = {
          song: data.title,
          artist: data.artist,
          albumArt: data.albumArtUrl,
          progress: null,
          duration: null,
          source: (data.statusLabel || '').toLowerCase().includes('last.fm') ? 'lastfm' : 'spotify',
          trackUrl: data.trackUrl,
        };
        setPlaying(playingData);
      } else if (data?.available && data?.title) {
        setRecent({
          ...data,
          source: (data.statusLabel || '').toLowerCase().includes('last.fm') ? 'lastfm' : 'spotify',
        });
      } else {
        setNotPlaying();
      }
    } catch {
      setNotPlaying();
    }
  }

  // Prime immediately so the card is populated on first load.
  fetchNowPlaying();

  // Start polling when widget enters viewport
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        fetchNowPlaying();
        pollTimer = setInterval(fetchNowPlaying, POLL_INTERVAL);
      } else {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      }
    });
  }, { threshold: 0.1 });

  io.observe(card);

  // Cleanup on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    } else {
      fetchNowPlaying();
      pollTimer = setInterval(fetchNowPlaying, POLL_INTERVAL);
    }
  });
})();
