const PROFILE_VIEWS_STORAGE_KEY = 'profile-views-recorded-v1';
const VIEWS_ENDPOINT = '/api/profile/views';
const SPOTIFY_ENDPOINT = '/api/profile/spotify';
const SPOTIFY_REFRESH_INTERVAL_MS = 30000;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '--';
  return new Intl.NumberFormat('en-US').format(number);
}

function createMarkup() {
  return `
    <div class="about-live-grid" aria-label="Live profile signals">
      <article class="about-live-card about-live-card-views" id="profile-views-card">
        <div class="about-live-topline">
          <span class="about-live-eyebrow">Views</span>
          <span class="about-live-pill">
            <span class="about-live-dot"></span>
            Live
          </span>
        </div>
        <div class="about-live-views-row">
          <span class="about-live-eye" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </span>
          <p class="about-live-count" id="profile-view-count">--</p>
        </div>
        <p class="about-live-caption" id="profile-view-label">Portfolio reach</p>
      </article>

      <a class="about-live-card about-live-card-spotify is-loading"
         id="spotify-now-playing-card"
         href="https://open.spotify.com/"
         target="_blank"
         rel="noopener noreferrer"
         aria-label="Open listening status">
        <div class="about-live-topline">
          <span class="about-live-eyebrow">Listening</span>
          <span class="about-live-pill about-live-pill-spotify" id="spotify-status-label">
            <span class="about-live-dot spotify-dot"></span>
            Checking
          </span>
        </div>
        <div class="about-live-spotify-row">
          <div class="about-live-artwork-shell">
            <img id="spotify-artwork"
                 class="about-live-artwork"
                 src="assets/images/profile-icon.png"
                 alt="Album artwork"
                 width="56"
                 height="56"
                 loading="lazy"
                 decoding="async" />
          </div>
          <div class="about-live-copy">
            <p class="about-live-track" id="spotify-track-title">Syncing real-time listening</p>
            <p class="about-live-artist" id="spotify-track-artist">Connect a provider to show current music.</p>
          </div>
          <span class="about-live-brand" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.26 10.26 0 0 0 12 1.75Zm4.7 14.78a.75.75 0 0 1-1.03.25 8.66 8.66 0 0 0-8.75-.46.75.75 0 1 1-.69-1.33 10.16 10.16 0 0 1 10.29.55.75.75 0 0 1 .18.99Zm1.46-2.97a.94.94 0 0 1-1.29.31 10.92 10.92 0 0 0-11.15-.58.94.94 0 0 1-.87-1.67 12.8 12.8 0 0 1 13.06.68.94.94 0 0 1 .25 1.26Zm.13-3.11A13.03 13.03 0 0 0 5.3 9.73a1.13 1.13 0 1 1-1.06-2 15.29 15.29 0 0 1 15.23.78 1.13 1.13 0 1 1-1.18 1.94Z"></path>
            </svg>
          </span>
        </div>
      </a>
    </div>
  `;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json();
}

function updateViewsCard(payload) {
  const countEl = document.getElementById('profile-view-count');
  const labelEl = document.getElementById('profile-view-label');

  if (!countEl || !labelEl) return;

  countEl.textContent = formatCount(payload.count);
  labelEl.textContent = payload.success ? 'Portfolio reach' : 'Views unavailable';
}

function updateSpotifyCard(payload) {
  const card = document.getElementById('spotify-now-playing-card');
  const titleEl = document.getElementById('spotify-track-title');
  const artistEl = document.getElementById('spotify-track-artist');
  const artworkEl = document.getElementById('spotify-artwork');
  const statusEl = document.getElementById('spotify-status-label');

  if (!card || !titleEl || !artistEl || !artworkEl || !statusEl) return;

  card.classList.remove('is-loading');
  card.classList.toggle('is-offline', !payload.available);
  card.href = payload.trackUrl || 'https://open.spotify.com/';
  card.setAttribute('aria-disabled', payload.available ? 'false' : 'true');

  titleEl.textContent = payload.title || 'Listening unavailable';
  artistEl.textContent = payload.artist || 'Unable to fetch listening state';
  artistEl.title = payload.album ? `${payload.artist} • ${payload.album}` : payload.artist || '';
  statusEl.innerHTML = `<span class="about-live-dot spotify-dot"></span>${escapeHtml(payload.statusLabel || 'Unavailable')}`;

  artworkEl.src = payload.albumArtUrl || 'assets/images/profile-icon.png';
  artworkEl.alt = payload.title ? `${payload.title} album artwork` : 'Album artwork';
}

async function hydrateViews() {
  const hasRecordedView = sessionStorage.getItem(PROFILE_VIEWS_STORAGE_KEY) === '1';
  const url = `${VIEWS_ENDPOINT}?mode=${hasRecordedView ? 'get' : 'increment'}`;
  const payload = await fetchJson(url);

  if (!hasRecordedView && payload.success) {
    sessionStorage.setItem(PROFILE_VIEWS_STORAGE_KEY, '1');
  }

  updateViewsCard(payload);
}

async function hydrateSpotify() {
  const payload = await fetchJson(SPOTIFY_ENDPOINT);
  updateSpotifyCard(payload);
}

function initProfileInsights() {
  if (window.__profileInsightsInitialized) return;

  const mount = document.querySelector('.about-highlights');
  if (!mount) return;

  window.__profileInsightsInitialized = true;
  mount.innerHTML = createMarkup();

  hydrateViews().catch(() => {
    updateViewsCard({ success: false, count: 0 });
  });

  hydrateSpotify().catch(() => {
    updateSpotifyCard({
      available: false,
      title: 'Listening unavailable',
      artist: 'Connect Spotify or switch to another provider later.',
      statusLabel: 'Unavailable',
      trackUrl: 'https://open.spotify.com/',
      albumArtUrl: '',
      album: '',
    });
  });

  window.setInterval(() => {
    hydrateSpotify().catch(() => {});
  }, SPOTIFY_REFRESH_INTERVAL_MS);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProfileInsights, { once: true });
} else {
  initProfileInsights();
}

export { initProfileInsights };
