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
        this.errorCount++;
        if (this.errorCount >= this.MAX_ERRORS) this.showOfflineStates();
        return;
      }

      const data = await response.json();
      const tracks = data.recenttracks?.track;

      if (!tracks || (Array.isArray(tracks) && tracks.length === 0)) {
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
      if (this.errorCount >= this.MAX_ERRORS) this.showOfflineStates();
    }
  }

  getBestImage(track, preferredSizes = ['extralarge', 'large', 'medium', 'small']) {
    let imgUrl = 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';
    if (track.image && Array.isArray(track.image)) {
      for (const size of preferredSizes) {
        const img = track.image.find(i => i.size === size);
        if (img && img['#text']) {
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
    els.albumArt.src = albumArtUrl;
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
      els.recentContainer.innerHTML += `
        <a href="${track.url}" target="_blank" rel="noopener" class="recent-track-item">
          <img src="${imgUrl}" alt="${track.name}" class="recent-track-img" loading="lazy">
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
    if (heroElements.trackName) lastFmService.initHeroComponent(heroElements);
    
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
    if (currentlyElements.loadingEl) lastFmService.initCurrentlyComponent(currentlyElements);
    
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
        if (heroElements.trackName) lastFmService.initHeroComponent(heroElements);
        
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
        if (currentlyElements.loadingEl) lastFmService.initCurrentlyComponent(currentlyElements);
        
        lastFmService.start();
    }, 0);
  }
}

export default lastFmService;
