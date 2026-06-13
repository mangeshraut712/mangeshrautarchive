/**
 * Website Share Widget
 * Provides a QR card, copy link, native share, and social share options.
 */

const SHARE_URL = 'https://mangeshraut.pro/';
const SHARE_TITLE = 'Mangesh Raut Archive';
const SHARE_TEXT =
  "Explore Mangesh Raut's software engineering portfolio, projects, writing, and systems work.";

const SHARE_OPTIONS = [
  {
    label: 'X',
    icon: 'fa-brands fa-x-twitter',
    href: () =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`,
  },
  {
    label: 'LinkedIn',
    icon: 'fa-brands fa-linkedin-in',
    href: () =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`,
  },
  {
    label: 'Email',
    icon: 'fa-solid fa-envelope',
    href: () =>
      `mailto:?subject=${encodeURIComponent(SHARE_TITLE)}&body=${encodeURIComponent(`${SHARE_TEXT}\n\n${SHARE_URL}`)}`,
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
        <img class="website-share-logo" src="assets/icons/icon.svg" alt="" width="56" height="56" loading="lazy" decoding="async">
        <div>
          <p class="website-share-kicker">Share portfolio</p>
          <h2 id="website-share-title">Scan or share my website</h2>
          <p id="website-share-description">Send the portfolio link quickly with QR, copy, native share, X, LinkedIn, or email.</p>
        </div>
      </header>

      <div class="website-share-qr-shell" aria-label="QR code for ${SHARE_URL}">
        <img class="website-share-qr" src="assets/images/share-website-qr.svg" alt="QR code linking to mangeshraut.pro" width="264" height="264" loading="lazy" decoding="async">
        <span class="website-share-qr-logo" aria-hidden="true">
          <img src="assets/icons/icon.svg" alt="" width="72" height="72" loading="lazy" decoding="async">
        </span>
      </div>

      <div class="website-share-link-row">
        <label class="sr-only" for="website-share-url">Portfolio link</label>
        <input id="website-share-url" class="website-share-url" type="text" value="${SHARE_URL}" readonly>
        <button id="website-share-copy" class="website-share-copy" type="button">
          <i class="fa-regular fa-copy" aria-hidden="true"></i>
          <span>Copy</span>
        </button>
      </div>

      <div class="website-share-actions" aria-label="Share options">
        <button id="website-native-share" class="website-share-action" type="button">
          <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>
          <span>Share</span>
        </button>
        ${SHARE_OPTIONS.map(
          option => `
            <a class="website-share-action" href="${option.href()}" target="_blank" rel="noopener noreferrer">
              <i class="${option.icon}" aria-hidden="true"></i>
              <span>${option.label}</span>
            </a>
          `
        ).join('')}
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
    await navigator.clipboard.writeText(SHARE_URL);
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
          url: SHARE_URL,
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
