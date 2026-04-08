/**
 * Last.fm Integration Module
 * Centralizes API calls and handles multiple UI components
 */

class LastFmService {
  constructor() {
    this.API_KEY = 'bef46b0d7702dac5b071906cd186bd28';
    this.USERNAME = 'mbr63';
    this.API_URL = 'https://ws.audioscrobbler.com/2.0/';
    this.errorCount = 0;
    this.MAX_ERRORS = 3;
    
    // Components tracking
    this.heroComponent = null;
    this.currentlyComponent = null;
  }

  getArtworkPlaceholder(trackName = 'Now Playing', artistName = 'Last.fm') {
    const encodedTrack = encodeURIComponent(String(trackName).slice(0, 18));
    const encodedArtist = encodeURIComponent(String(artistName).slice(0, 18));

    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%231db954'/%3E%3Cstop offset='1' stop-color='%23191414'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='240' height='240' rx='28'/%3E%3Ccircle cx='120' cy='120' r='54' fill='rgba(255,255,255,0.16)'/%3E%3Cpath fill='white' d='M157 83a67 67 0 0 0-74 9 6 6 0 1 0 7 10 55 55 0 0 1 60-7 6 6 0 1 0 7-12Zm-8 28a43 43 0 0 0-46 6 6 6 0 0 0 8 9 31 31 0 0 1 33-4 6 6 0 0 0 5-10Zm-9 25a19 19 0 0 0-19 2 6 6 0 1 0 7 9 7 7 0 0 1 8-1 6 6 0 1 0 4-10Z'/%3E%3Ctext fill='white' font-family='system-ui,sans-serif' font-size='14' font-weight='700' x='120' y='198' text-anchor='middle'%3E${encodedTrack}%3C/text%3E%3Ctext fill='rgba(255,255,255,0.78)' font-family='system-ui,sans-serif' font-size='11' x='120' y='216' text-anchor='middle'%3E${encodedArtist}%3C/text%3E%3C/svg%3E`;
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

  async fetchRecent() {
    if (this.errorCount >= this.MAX_ERRORS) {
      this.showOfflineStates();
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `${this.API_URL}?method=user.getrecenttracks&user=${this.USERNAME}&api_key=${this.API_KEY}&format=json&limit=10`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('Last.fm API returned error:', response.status);
        this.errorCount++;
        this.hideLoadingStates();
        if (this.errorCount >= this.MAX_ERRORS) this.showOfflineStates();
        return;
      }

      const data = await response.json();
      const tracks = data.recenttracks?.track;

      if (!tracks || (Array.isArray(tracks) && tracks.length === 0)) {
        this.hideLoadingStates();
        this.showOfflineStates();
        return;
      }

      this.errorCount = 0;
      const trackList = Array.isArray(tracks) ? tracks : [tracks];
      
      this.updateHero(trackList[0]);
      this.updateCurrently(trackList);
      
    } catch (error) {
      console.warn('Last.fm fetch error:', error);
      this.errorCount++;
      this.hideLoadingStates();
      if (this.errorCount >= this.MAX_ERRORS) this.showOfflineStates();
    }
  }

  hideLoadingStates() {
    if (this.currentlyComponent && this.currentlyComponent.loadingEl) {
      this.currentlyComponent.loadingEl.style.display = 'none';
    }
  }

  getBestImage(track, preferredSizes = ['extralarge', 'large', 'medium', 'small']) {
    // Default placeholder with music icon
    let imgUrl = this.getArtworkPlaceholder(track.name || 'Music', track.artist?.name || 'Unknown');

    if (track.image && Array.isArray(track.image)) {
      for (const size of preferredSizes) {
        const img = track.image.find(i => i.size === size);
        if (img && img['#text'] && !img['#text'].includes('2a96cbd8b46e442fc41c2b86b821562f')) {
          imgUrl = img['#text'];
          break;
        }
      }
    }
    return imgUrl;
  }

  updateHero(track) {
    if (!this.heroComponent) return;
    
    const isNowPlaying = track['@attr']?.nowplaying === 'true';
    const trackName = track.name || 'Unknown Track';
    const artistName = track.artist?.['#text'] || track.artist?.name || 'Unknown Artist';
    const albumArtUrl = this.getBestImage(track);

    const els = this.heroComponent;
    els.trackName.textContent = trackName;
    els.artistName.textContent = artistName;
    this.applyImageFallback(els.albumArt, trackName, artistName);
    els.albumArt.src = albumArtUrl || this.getArtworkPlaceholder(trackName, artistName);
    els.albumArt.alt = `${trackName} by ${artistName}`;
    
    if (isNowPlaying) {
      els.statusText.textContent = 'Now playing';
      els.playingIndicator.classList.add('active');
      els.musicCard.classList.add('is-playing');
    } else {
      els.statusText.textContent = 'Recently played';
      els.playingIndicator.classList.remove('active');
      els.musicCard.classList.remove('is-playing');
    }
  }

  updateCurrently(tracks) {
    if (!this.currentlyComponent) return;
    
    const els = this.currentlyComponent;
    const nowPlaying = tracks.find(t => t['@attr']?.nowplaying === 'true');
    const recentTracks = tracks.filter(t => !t['@attr']?.nowplaying).slice(0, 5);

    els.loadingEl.style.display = 'none';

    if (nowPlaying) {
      els.nowPlayingCard.style.display = 'flex';
      els.emptyEl.style.display = 'none';
      els.nowPlayingTrack.textContent = nowPlaying.name;
      els.nowPlayingArtist.textContent = nowPlaying.artist?.['#text'] || nowPlaying.artist?.name;
      this.applyImageFallback(
        els.nowPlayingImg,
        nowPlaying.name,
        nowPlaying.artist?.['#text'] || nowPlaying.artist?.name
      );
      els.nowPlayingImg.src = this.getBestImage(nowPlaying, ['extralarge', 'large', 'medium']);
      els.nowPlayingImg.alt = `${nowPlaying.name} by ${nowPlaying.artist?.['#text'] || nowPlaying.artist?.name}`;
      els.nowPlayingLink.href = nowPlaying.url;
    } else {
      els.nowPlayingCard.style.display = 'none';
      els.emptyEl.style.display = 'flex';
    }

    els.recentContainer.innerHTML = '';
    recentTracks.forEach(track => {
      const imgUrl = this.getBestImage(track, ['medium', 'small']);
      const fallback = this.getArtworkPlaceholder(
        track.name,
        track.artist?.['#text'] || track.artist?.name
      );
      els.recentContainer.innerHTML += `
        <a href="${track.url}" target="_blank" rel="noopener" class="recent-track-item">
          <img src="${imgUrl || fallback}" alt="${track.name}" class="recent-track-img" loading="lazy" onerror="this.src='${fallback}'; this.onerror=null;">
          <div class="recent-track-info">
            <h5 class="recent-track-name">${track.name}</h5>
            <p class="recent-track-artist">${track.artist?.['#text'] || track.artist?.name}</p>
          </div>
        </a>
      `;
    });
  }

  showOfflineStates() {
    if (this.heroComponent) {
      const els = this.heroComponent;
      els.statusText.textContent = 'Offline';
      els.trackName.textContent = 'Service';
      els.artistName.textContent = 'Unavailable';
      this.applyImageFallback(els.albumArt, 'Service Offline', 'Last.fm');
      els.albumArt.src = this.getArtworkPlaceholder('Service Offline', 'Last.fm');
      els.playingIndicator.classList.remove('active');
      els.musicCard.classList.remove('is-playing');
    }
    
    if (this.currentlyComponent) {
      const els = this.currentlyComponent;
      els.loadingEl.style.display = 'none';
      els.emptyEl.style.display = 'flex';
      els.emptyEl.querySelector('h4').textContent = 'Service Unavailable';
      els.emptyEl.querySelector('p').textContent = 'Last.fm temporarily unavailable';
      els.nowPlayingCard.style.display = 'none';
    }
  }

  start() {
    this.fetchRecent();
    setInterval(() => this.fetchRecent(), 60000);
  }
}

const lastFmService = new LastFmService();

// Initialize UI endpoints immediately if available
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Hero UI
    const heroElements = {
      trackName: document.getElementById('track-name'),
      artistName: document.getElementById('artist-name'),
      albumArt: document.getElementById('album-art'),
      statusText: document.getElementById('status-text'),
      playingIndicator: document.getElementById('playing-indicator'),
      musicCard: document.getElementById('music-card')
    };
    if (heroElements.trackName) {
      lastFmService.initHeroComponent(heroElements);
      lastFmService.applyImageFallback(heroElements.albumArt, 'Now Playing', 'Last.fm');
    }
    
    // Currently Section UI
    const currentlyElements = {
      loadingEl: document.getElementById('music-loading'),
      emptyEl: document.getElementById('music-empty'),
      nowPlayingCard: document.getElementById('now-playing-card'),
      nowPlayingTrack: document.getElementById('now-playing-track'),
      nowPlayingArtist: document.getElementById('now-playing-artist'),
      nowPlayingImg: document.getElementById('now-playing-img'),
      nowPlayingLink: document.getElementById('now-playing-link'),
      recentContainer: document.getElementById('recent-tracks-container')
    };
    if (currentlyElements.loadingEl) {
      lastFmService.initCurrentlyComponent(currentlyElements);
      lastFmService.applyImageFallback(currentlyElements.nowPlayingImg, 'Now Playing', 'Last.fm');
    }
    
    lastFmService.start();
  });
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // If DOM is already loaded
    setTimeout(() => {
        const heroElements = {
          trackName: document.getElementById('track-name'),
          artistName: document.getElementById('artist-name'),
          albumArt: document.getElementById('album-art'),
          statusText: document.getElementById('status-text'),
          playingIndicator: document.getElementById('playing-indicator'),
          musicCard: document.getElementById('music-card')
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
          nowPlayingImg: document.getElementById('now-playing-img'),
          nowPlayingLink: document.getElementById('now-playing-link'),
          recentContainer: document.getElementById('recent-tracks-container')
        };
        if (currentlyElements.loadingEl) {
          lastFmService.initCurrentlyComponent(currentlyElements);
          lastFmService.applyImageFallback(currentlyElements.nowPlayingImg, 'Now Playing', 'Last.fm');
        }
        
        lastFmService.start();
    }, 0);
  }
}

export default lastFmService;
