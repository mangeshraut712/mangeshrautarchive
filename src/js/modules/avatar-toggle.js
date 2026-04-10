const STORAGE_KEY = 'hero-avatar-mode';

function applyAvatarMode(mode) {
  const source = document.getElementById('profile-image-source');
  const image = document.getElementById('profile-image');
  const toggle = document.getElementById('avatar-toggle');

  if (!image || !toggle) return;

  const isAvatar = mode === 'avatar';
  const photoSrc = image.dataset.photoSrc || image.getAttribute('src') || '';
  const photoSrcset = image.dataset.photoSrcset || '';
  const avatarSrc = image.dataset.avatarSrc || '';

  if (isAvatar) {
    if (source) {
      source.removeAttribute('srcset');
    }
    image.src = avatarSrc || photoSrc;
    image.alt = 'Mangesh Raut avatar';
    toggle.dataset.mode = 'avatar';
    toggle.setAttribute('aria-pressed', 'true');
  } else {
    if (source && photoSrcset) {
      source.setAttribute('srcset', photoSrcset);
    }
    image.src = photoSrc;
    image.alt = 'Mangesh Raut photo';
    toggle.dataset.mode = 'photo';
    toggle.setAttribute('aria-pressed', 'false');
  }

  document.documentElement.dataset.avatarMode = mode;
}

export function initAvatarToggle() {
  const toggle = document.getElementById('avatar-toggle');
  if (!toggle || toggle.dataset.bound === 'true') return;

  toggle.dataset.bound = 'true';

  const savedMode = localStorage.getItem(STORAGE_KEY) === 'avatar' ? 'avatar' : 'photo';
  applyAvatarMode(savedMode);

  const switchAvatar = () => {
    const nextMode = toggle.dataset.mode === 'avatar' ? 'photo' : 'avatar';
    localStorage.setItem(STORAGE_KEY, nextMode);
    applyAvatarMode(nextMode);
  };

  toggle.addEventListener('click', switchAvatar);
  toggle.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    switchAvatar();
  });
}
