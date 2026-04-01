/**
 * Spotify Now Playing Widget (Live Activity integration)
 * Polls /api/spotify for real-time track data.
 */
(function () {
  'use strict';

  const POLL_INTERVAL = 30000; // poll every 30s
  const card = document.getElementById('spotify-now-playing');
  if (!card) return;

  const songEl = document.getElementById('spotify-song');
  const artistEl = document.getElementById('spotify-artist');
  const albumEl = document.getElementById('spotify-album-art');
  const fillEl = document.getElementById('spotify-progress-fill');
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

  function setNotPlaying() {
    card.classList.add('not-playing');
    setIdleEq();
    
    if (songEl) songEl.textContent = 'Nothing playing';
    if (artistEl) artistEl.textContent = 'Spotify';
    if (albumEl) { albumEl.src = ''; albumEl.alt = ''; }
    if (fillEl) fillEl.style.width = '0%';
  }

  function setPlaying(data) {
    card.classList.remove('not-playing');
    setActiveEq();

    if (songEl) songEl.textContent = data.song || 'Unknown Track';
    if (artistEl) artistEl.textContent = data.artist || 'Unknown Artist';
    if (albumEl && data.albumArt) {
      albumEl.src = data.albumArt;
      albumEl.alt = `${data.song} album art`;
    }
    // Progress bar
    if (fillEl && data.progress != null && data.duration != null && data.duration > 0) {
      const pct = Math.min(100, (data.progress / data.duration) * 100);
      fillEl.style.width = pct + '%';
    } else if (fillEl) {
       fillEl.style.width = '0%';
    }
  }

  async function fetchNowPlaying() {
    try {
      const res = await fetch('/api/spotify', { signal: AbortSignal.timeout(6000) });
      if (!res.ok) { setNotPlaying(); return; }
      const data = await res.json();
      
      if (data && data.isPlaying) {
        setPlaying(data);
      } else {
        // Show last played song if available
        if (data && data.song) {
          card.classList.add('not-playing');
          setIdleEq();
          
          if (songEl) songEl.textContent = data.song;
          if (artistEl) artistEl.textContent = data.artist || '';
          if (albumEl && data.albumArt) { albumEl.src = data.albumArt; albumEl.alt = data.song; }
          if (fillEl) fillEl.style.width = '0%';
        } else {
          setNotPlaying();
        }
      }
    } catch {
      setNotPlaying();
    }
  }

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
