const STORAGE_KEY = 'hero-avatar-mode';

function applyAvatarMode(mode) {
  const image = document.getElementById('profile-image');
  const toggle = document.getElementById('avatar-toggle');

  if (!image || !toggle) return;

  const isAvatar = mode === 'avatar';
  const photoSrc = image.dataset.photoSrc || image.getAttribute('src') || '';
  const avatarSrc = image.dataset.avatarSrc || '';

  if (isAvatar) {
    image.src = avatarSrc || photoSrc;
    image.alt = 'Mangesh Raut avatar';
    toggle.dataset.mode = 'avatar';
    toggle.setAttribute('aria-pressed', 'true');
  } else {
    image.src = photoSrc;
    image.alt = 'Mangesh Raut photo';
    toggle.dataset.mode = 'photo';
    toggle.setAttribute('aria-pressed', 'false');
  }

  document.documentElement.dataset.avatarMode = mode;
}

export function initAvatarToggle() {
  const toggle = document.getElementById('avatar-toggle');
  const image = document.getElementById('profile-image');
  if (!toggle || toggle.dataset.bound === 'true') return;

  toggle.dataset.bound = 'true';
  let lastToggleAt = 0;

  const savedMode = localStorage.getItem(STORAGE_KEY) === 'avatar' ? 'avatar' : 'photo';
  applyAvatarMode(savedMode);

  const switchAvatar = () => {
    const now = Date.now();
    if (now - lastToggleAt < 250) return;
    lastToggleAt = now;
    const nextMode = toggle.dataset.mode === 'avatar' ? 'photo' : 'avatar';
    localStorage.setItem(STORAGE_KEY, nextMode);
    applyAvatarMode(nextMode);
  };

  window.__toggleHeroAvatar = event => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    switchAvatar();
  };

  const bindToggleEvent = (target, type, prevent = false) => {
    target?.addEventListener(type, event => {
      if (prevent) {
        event.preventDefault();
      }
      event.stopPropagation();
      switchAvatar();
    });
  };

  bindToggleEvent(toggle, 'click');
  bindToggleEvent(toggle, 'pointerup', true);
  bindToggleEvent(image, 'click', true);
  bindToggleEvent(image, 'pointerup', true);
  bindToggleEvent(image, 'touchend', true);

  toggle.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    switchAvatar();
  });
}
