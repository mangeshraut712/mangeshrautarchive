/**
 * Blessing Media Modal Module
 * Interactive player for Ganapati Aarti and Hanuman Chalisa on deity avatar clicks.
 */

const BLESSING_CONFIG = {
  ganesh: {
    title: '🕉️ Shree Ganapati Aarti',
    subtitle: 'Sukhkarta Dukhharta • Divine Chanting & Blessings',
    embedUrl: 'https://www.youtube-nocookie.com/embed/v3xL9x9VlHk?autoplay=1&rel=0',
    watchUrl: 'https://www.youtube.com/watch?v=v3xL9x9VlHk',
    badge: 'Ganapati Bappa Morya',
  },
  hanuman: {
    title: '🙏 Shree Hanuman Chalisa',
    subtitle: 'Jai Shri Ram • Hariharan • T-Series Devotional',
    embedUrl: 'https://www.youtube-nocookie.com/embed/AETFvQonfV8?autoplay=1&rel=0',
    watchUrl: 'https://www.youtube.com/watch?v=AETFvQonfV8',
    badge: 'Jai Bajrangbali',
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
          <h3 class="blessing-modal-title">${config.title}</h3>
          <p class="blessing-modal-subtitle">${config.subtitle}</p>
        </div>
        <button type="button" class="blessing-modal-close" aria-label="Close modal">&times;</button>
      </div>
      <div class="blessing-modal-video-wrap">
        <iframe
          src="${config.embedUrl}"
          title="${config.title}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      </div>
      <div class="blessing-modal-footer">
        <a href="${config.watchUrl}" target="_blank" rel="noopener noreferrer" class="blessing-modal-yt-btn">
          <i class="fab fa-youtube"></i> Watch on YouTube
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

  const handleClose = () => closeBlessingModal();

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
