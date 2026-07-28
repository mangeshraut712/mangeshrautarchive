/**
 * Blessing Media Modal Module
 * Interactive player for Ganapati Aarti and Hanuman Chalisa on deity avatar clicks.
 * Theme-aware Apple HIG & shadcn UI design system.
 */

const BLESSING_CONFIG = {
  ganesh: {
    title: '🕉️ Shree Ganapati Aarti',
    subtitle: 'Shendur Lal Chhadhayo / Sukhkarta Dukhharta • T-Series Devotional',
    watchUrl: 'https://www.youtube.com/watch?v=w0W8Wh-8UCg&list=RDw0W8Wh-8UCg&start_radio=1',
    embedUrl: 'https://www.youtube-nocookie.com/embed/w0W8Wh-8UCg?autoplay=1&rel=0&enablejsapi=1',
    badge: 'Ganapati Bappa Morya',
    image: 'assets/images/ganesh.png',
  },
  hanuman: {
    title: '🙏 Shree Hanuman Chalisa',
    subtitle: 'Gulshan Kumar • Hariharan • Official T-Series Video',
    watchUrl: 'https://www.youtube.com/watch?v=AETFvQonfV8&list=RDAETFvQonfV8&start_radio=1',
    embedUrl: 'https://www.youtube-nocookie.com/embed/AETFvQonfV8?autoplay=1&rel=0&enablejsapi=1',
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
          <div class="blessing-modal-title">${config.title}</div>
          <p class="blessing-modal-subtitle">${config.subtitle}</p>
        </div>
        <button type="button" class="blessing-modal-close" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="blessing-modal-player-container">
        <!-- Devotional Media Preview Card -->
        <div class="blessing-player-visualizer">
          <img src="${config.image}" alt="${config.title}" class="blessing-player-avatar">
          <div class="blessing-player-info">
            <div class="blessing-player-tag"><i class="fas fa-volume-up"></i> Official Devotional Music Stream</div>
            <h4 class="blessing-player-track-title">${config.title}</h4>
            <p class="blessing-player-track-sub">${config.subtitle}</p>
            <div class="blessing-equalizer" aria-hidden="true">
              <span class="eq-bar eq-1"></span>
              <span class="eq-bar eq-2"></span>
              <span class="eq-bar eq-3"></span>
              <span class="eq-bar eq-4"></span>
              <span class="eq-bar eq-5"></span>
            </div>
          </div>
        </div>

        <!-- Embedded Frame Container -->
        <div class="blessing-modal-video-wrap">
          <iframe
            src="${config.embedUrl}"
            title="${config.title}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        </div>
      </div>

      <div class="blessing-modal-footer">
        <a href="${config.watchUrl}" target="_blank" rel="noopener noreferrer" class="blessing-modal-yt-btn">
          <i class="fab fa-youtube"></i> Watch / Stream Full Video on YouTube
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

  const closeBtn = overlay.querySelector('.blessing-modal-close');
  const doneBtn = overlay.querySelector('.blessing-modal-done-btn');

  const handleClose = () => {
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
