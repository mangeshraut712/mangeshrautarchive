/**
 * Blessing Media Modal Module
 * Interactive player for Ganapati Aarti and Hanuman Chalisa on deity avatar clicks.
 */

const BLESSING_CONFIG = {
  ganesh: {
    title: '🕉️ Shree Ganapati Aarti',
    subtitle: 'Shendur Lal Chhadhayo / Sukhkarta Dukhharta • Divine Chanting',
    embedUrl: 'https://www.youtube-nocookie.com/embed/w0W8Wh-8UCg?autoplay=1&rel=0&enablejsapi=1',
    watchUrl: 'https://www.youtube.com/watch?v=w0W8Wh-8UCg',
    badge: 'Ganapati Bappa Morya',
    image: 'assets/images/ganesh.png',
  },
  hanuman: {
    title: '🙏 Shree Hanuman Chalisa',
    subtitle: 'Jai Shri Ram • Hariharan • T-Series Devotional',
    embedUrl: 'https://www.youtube-nocookie.com/embed/AETFvQonfV8?autoplay=1&rel=0&enablejsapi=1',
    watchUrl: 'https://www.youtube.com/watch?v=AETFvQonfV8',
    badge: 'Jai Bajrangbali',
    image: 'assets/images/hanuman.png',
  },
};

let activeModalEl = null;

export function initBlessingMediaModal() {
  if (typeof document === 'undefined' || document._blessingMediaModalInitialized) return;
  document._blessingMediaModalInitialized = true;

  document.addEventListener('click', e => {
    const trigger = e.target.closest('.blessing-avatar-trigger');
    if (!trigger) return;

    const key = trigger.dataset.blessing;
    if (key && BLESSING_CONFIG[key]) {
      e.preventDefault();
      openBlessingModal(key);
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const trigger = e.target.closest('.blessing-avatar-trigger');
    if (!trigger) return;

    const key = trigger.dataset.blessing;
    if (key && BLESSING_CONFIG[key]) {
      e.preventDefault();
      openBlessingModal(key);
    }
  });
}

export function openBlessingModal(key) {
  const config = BLESSING_CONFIG[key];
  if (!config) return;

  closeBlessingModal();

  const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
  const finalEmbedUrl = `${config.embedUrl}&origin=${origin}`;

  const overlay = document.createElement('div');
  overlay.className = 'blessing-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', config.title);

  overlay.innerHTML = `
    <div class="blessing-modal-card">
      <div class="blessing-modal-header">
        <div class="blessing-modal-title-wrap">
          <span class="blessing-badge">${config.badge}</span>
          <h3 class="blessing-modal-title">${config.title}</h3>
          <p class="blessing-modal-subtitle">${config.subtitle}</p>
        </div>
        <button type="button" class="blessing-modal-close" aria-label="Close modal">&times;</button>
      </div>

      <div class="blessing-modal-player-container">
        <!-- Embedded YouTube Frame -->
        <div class="blessing-modal-video-wrap">
          <iframe
            src="${finalEmbedUrl}"
            title="${config.title}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen>
          </iframe>
        </div>

        <!-- Premium Divine Fallback Card (shows if third-party embed restricted) -->
        <div class="blessing-modal-fallback-card" style="display: none;">
          <img src="${config.image}" alt="${config.title}" class="blessing-fallback-img">
          <div class="blessing-fallback-info">
            <h4 class="blessing-fallback-title">${config.title}</h4>
            <p class="blessing-fallback-text">Playback restricted on external domain by YouTube content rights. Click below to stream in Full HD on YouTube!</p>
            <a href="${config.watchUrl}" target="_blank" rel="noopener noreferrer" class="blessing-fallback-play-btn">
              <i class="fab fa-youtube"></i> Play Full Video on YouTube
            </a>
          </div>
        </div>
      </div>

      <div class="blessing-modal-footer">
        <a href="${config.watchUrl}" target="_blank" rel="noopener noreferrer" class="blessing-modal-yt-btn">
          <i class="fab fa-youtube"></i> Watch on YouTube (Official HD)
        </a>
        <button type="button" class="blessing-modal-done-btn">Done</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  activeModalEl = overlay;
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    overlay.classList.add('is-visible');
  });

  // Handle iframe load / fallback detection
  const fallbackCard = overlay.querySelector('.blessing-modal-fallback-card');

  // Listen for message from YouTube player or fallback timeout
  const fallbackTimer = setTimeout(() => {
    // If user is on local domain, YouTube music video embeddings display restriction notice;
    // ensure fallback CTA is visible alongside player
    if (fallbackCard) {
      fallbackCard.style.display = 'flex';
    }
  }, 3500);

  const closeBtn = overlay.querySelector('.blessing-modal-close');
  const doneBtn = overlay.querySelector('.blessing-modal-done-btn');

  const handleClose = () => {
    clearTimeout(fallbackTimer);
    closeBlessingModal();
  };

  closeBtn?.addEventListener('click', handleClose);
  doneBtn?.addEventListener('click', handleClose);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) handleClose();
  });

  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      handleClose();
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
}

export function closeBlessingModal() {
  if (!activeModalEl) return;

  activeModalEl.classList.remove('is-visible');
  const current = activeModalEl;
  activeModalEl = null;

  const iframe = current.querySelector('iframe');
  if (iframe) {
    iframe.src = 'about:blank';
  }

  setTimeout(() => {
    current.remove();
    document.body.style.overflow = '';
  }, 250);
}

if (typeof window !== 'undefined') {
  window.openBlessingModal = openBlessingModal;
  window.closeBlessingModal = closeBlessingModal;
}

initBlessingMediaModal();
