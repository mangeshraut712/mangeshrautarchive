/**
 * Website Share Widget
 * Provides a QR card, copy link, native share, and social share options.
 */

const SHARE_MIRRORS = [
  { name: 'Primary (Pro)', url: 'https://mangeshraut.pro' },
  { name: 'Vercel (App)', url: 'https://mraut.vercel.app' },
  { name: 'GitHub (Pages)', url: 'https://mangeshraut712.github.io/mangeshrautarchive/' }
];

let activeMirrorUrl = SHARE_MIRRORS[0].url;
const SHARE_TITLE = 'Mangesh Raut Archive';
const SHARE_TEXT =
  "Explore Mangesh Raut's software engineering portfolio, projects, writing, and systems work.";

const SHARE_OPTIONS = [
  {
    label: 'X',
    icon: 'fa-brands fa-x-twitter',
    href: (url) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(url)}`,
  },
  {
    label: 'LinkedIn',
    icon: 'fa-brands fa-linkedin-in',
    href: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    label: 'Email',
    icon: 'fa-solid fa-envelope',
    href: (url) =>
      `mailto:?subject=${encodeURIComponent(SHARE_TITLE)}&body=${encodeURIComponent(`${SHARE_TEXT}\n\n${url}`)}`,
  },
];

const createShareMarkup = () => `
  <div id="website-share-dialog" class="website-share-dialog hidden" role="dialog" aria-modal="true" aria-labelledby="website-share-title" aria-hidden="true">
    <div class="website-share-backdrop" data-share-close></div>
    <section class="website-share-card" aria-describedby="website-share-description">
      <button class="website-share-close" type="button" aria-label="Close share options" data-share-close>
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>

      <header class="website-share-header">
        <img class="website-share-logo" src="assets/images/profile-icon.webp" alt="Mangesh Raut" width="44" height="44" loading="lazy" decoding="async">
        <div class="website-share-header-text">
          <h2 id="website-share-title">Mangesh Raut Archive</h2>
          <p id="website-share-description">${activeMirrorUrl}</p>
        </div>
      </header>

      <div class="website-share-mirrors" role="tablist" aria-label="Select website mirror">
        ${SHARE_MIRRORS.map((mirror, idx) => `
          <button class="share-mirror-tab ${idx === 0 ? 'active' : ''}" type="button" role="tab" aria-selected="${idx === 0 ? 'true' : 'false'}" data-mirror-idx="${idx}">
            ${mirror.name.split(' ')[0]}
          </button>
        `).join('')}
      </div>

      <div class="website-share-qr-section">
        <div class="website-share-qr-shell" aria-label="QR code for webpage">
          <img class="website-share-qr" src="assets/images/share-website-qr.svg" alt="QR code" width="160" height="160" loading="lazy" decoding="async">
          <span class="website-share-qr-logo" aria-hidden="true">
            <img src="assets/images/profile-icon.webp" alt="" width="36" height="36" loading="lazy" decoding="async">
          </span>
        </div>
      </div>

      <div class="website-share-link-row">
        <label class="sr-only" for="website-share-url">Portfolio link</label>
        <input id="website-share-url" class="website-share-url" type="text" value="${activeMirrorUrl}" readonly>
        <button id="website-share-copy" class="website-share-copy" type="button">
          <i class="fa-regular fa-copy" aria-hidden="true"></i>
          <span>Copy</span>
        </button>
      </div>

      <div class="website-share-actions" aria-label="Share options">
        <button id="website-native-share" class="website-share-action-item" type="button">
          <span class="website-share-icon-circle">
            <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>
          </span>
          <span class="website-share-action-label">Share</span>
        </button>
        
        <a class="website-share-action-item" data-social="X" href="${SHARE_OPTIONS[0].href(activeMirrorUrl)}" target="_blank" rel="noopener noreferrer">
          <span class="website-share-icon-circle">
            <i class="fa-brands fa-x-twitter" aria-hidden="true"></i>
          </span>
          <span class="website-share-action-label">X</span>
        </a>
        
        <a class="website-share-action-item" data-social="LinkedIn" href="${SHARE_OPTIONS[1].href(activeMirrorUrl)}" target="_blank" rel="noopener noreferrer">
          <span class="website-share-icon-circle">
            <i class="fa-brands fa-linkedin-in" aria-hidden="true"></i>
          </span>
          <span class="website-share-action-label">LinkedIn</span>
        </a>
        
        <a class="website-share-action-item" data-social="Email" href="${SHARE_OPTIONS[2].href(activeMirrorUrl)}" target="_blank" rel="noopener noreferrer">
          <span class="website-share-icon-circle">
            <i class="fa-solid fa-envelope" aria-hidden="true"></i>
          </span>
          <span class="website-share-action-label">Email</span>
        </a>
      </div>

      <p id="website-share-status" class="website-share-status" role="status" aria-live="polite"></p>
    </section>
  </div>
`;

function setDialogState(dialog, trigger, isOpen) {
  dialog.classList.toggle('hidden', !isOpen);
  dialog.classList.toggle('active', isOpen);
  dialog.setAttribute('aria-hidden', String(!isOpen));
  if (trigger) {
    trigger.setAttribute('aria-expanded', String(isOpen));
  }
  document.body.classList.toggle('share-dialog-open', isOpen);
}

async function copyShareUrl(status, urlInput) {
  try {
    await navigator.clipboard.writeText(activeMirrorUrl);
    status.textContent = 'Portfolio link copied.';
    return true;
  } catch (_error) {
    urlInput.select();
    const copied = document.execCommand?.('copy') || false;
    status.textContent = copied
      ? 'Portfolio link copied.'
      : 'Link selected. Press Command+C if your browser asks.';
    return copied;
  }
}

function initShareWidget() {
  if (document.getElementById('website-share-dialog')) return;

  document.body.insertAdjacentHTML('beforeend', createShareMarkup());

  const dialog = document.getElementById('website-share-dialog');
  const card = dialog.querySelector('.website-share-card');
  const copyButton = document.getElementById('website-share-copy');
  const nativeShareButton = document.getElementById('website-native-share');
  const status = document.getElementById('website-share-status');
  const urlInput = document.getElementById('website-share-url');

  const closeDialog = () => {
    const trigger = document.getElementById('website-share-toggle');
    setDialogState(dialog, trigger, false);
    if (trigger) {
      trigger.focus({ preventScroll: true });
    }
  };

  const openDialog = () => {
    const trigger = document.getElementById('website-share-toggle');
    status.textContent = '';
    setDialogState(dialog, trigger, true);
    copyButton.focus({ preventScroll: true });
  };

  // Delegated click handler for the share toggle button (to prevent race conditions)
  document.addEventListener('click', event => {
    const trigger = event.target.closest('#website-share-toggle');
    if (trigger) {
      const isOpen = dialog.classList.contains('active');
      if (isOpen) {
        closeDialog();
      } else {
        openDialog();
      }
    }
  });

  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-share-close]')) {
      closeDialog();
    }
  });

  card.addEventListener('click', event => {
    // If the click is on the close button, let it bubble to the dialog listener
    if (event.target.closest('[data-share-close]')) {
      return;
    }
    event.stopPropagation();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog.classList.contains('active')) {
      closeDialog();
    }
  });

  // Mirror tabs switcher implementation
  const tabs = dialog.querySelectorAll('.share-mirror-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const idx = parseInt(tab.dataset.mirrorIdx, 10);
      const mirror = SHARE_MIRRORS[idx];
      activeMirrorUrl = mirror.url;
      urlInput.value = mirror.url;

      // Update URL display under title
      const descEl = dialog.querySelector('#website-share-description');
      if (descEl) {
        descEl.textContent = mirror.url;
      }

      // Update QR Code image source dynamically
      const qrImg = dialog.querySelector('.website-share-qr');
      if (qrImg) {
        if (idx === 0) {
          qrImg.src = 'assets/images/share-website-qr.svg';
        } else {
          qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=264x264&data=${encodeURIComponent(mirror.url)}`;
        }
      }

      // Update social links href values dynamically
      const updateSocialLink = (socialName, hrefGen) => {
        const link = dialog.querySelector(`.website-share-action-item[data-social="${socialName}"]`);
        if (link) {
          link.href = hrefGen(mirror.url);
        }
      };

      updateSocialLink('X', SHARE_OPTIONS[0].href);
      updateSocialLink('LinkedIn', SHARE_OPTIONS[1].href);
      updateSocialLink('Email', SHARE_OPTIONS[2].href);
    });
  });

  copyButton.addEventListener('click', async () => {
    const copied = await copyShareUrl(status, urlInput);
    if (copied) {
      urlInput.setSelectionRange(0, 0);
      copyButton.focus({ preventScroll: true });
    }
  });

  if (!navigator.share) {
    nativeShareButton.hidden = true;
  } else {
    nativeShareButton.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: activeMirrorUrl,
        });
        status.textContent = 'Share sheet opened.';
      } catch (error) {
        if (error?.name !== 'AbortError') {
          status.textContent = 'Share sheet is unavailable. Copy the link instead.';
        }
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShareWidget, { once: true });
} else {
  initShareWidget();
}
