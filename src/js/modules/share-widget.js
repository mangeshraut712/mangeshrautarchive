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
    label: 'X (Twitter)',
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

      <div class="website-share-actions-list">
        <button id="website-share-copy" class="share-action-row" type="button">
          <span>Copy Link</span>
          <i class="fa-regular fa-copy" aria-hidden="true"></i>
        </button>
        
        <button id="website-native-share" class="share-action-row" type="button">
          <span>System Share...</span>
          <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>
        </button>

        <a class="share-action-row" data-social="X" href="${SHARE_OPTIONS[0].href(activeMirrorUrl)}" target="_blank" rel="noopener noreferrer">
          <span>Share on X (Twitter)</span>
          <i class="fa-brands fa-x-twitter" aria-hidden="true"></i>
        </a>

        <a class="share-action-row" data-social="LinkedIn" href="${SHARE_OPTIONS[1].href(activeMirrorUrl)}" target="_blank" rel="noopener noreferrer">
          <span>Share on LinkedIn</span>
          <i class="fa-brands fa-linkedin-in" aria-hidden="true"></i>
        </a>

        <a class="share-action-row" data-social="Email" href="${SHARE_OPTIONS[2].href(activeMirrorUrl)}" target="_blank" rel="noopener noreferrer">
          <span>Send via Email</span>
          <i class="fa-solid fa-envelope" aria-hidden="true"></i>
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

async function copyShareUrl(status) {
  try {
    await navigator.clipboard.writeText(activeMirrorUrl);
    status.textContent = 'Portfolio link copied.';
    return true;
  } catch (_error) {
    const tempInput = document.createElement('input');
    tempInput.value = activeMirrorUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    const copied = document.execCommand?.('copy') || false;
    document.body.removeChild(tempInput);
    status.textContent = copied
      ? 'Portfolio link copied.'
      : 'Failed to copy link automatically.';
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
        const link = dialog.querySelector(`.share-action-row[data-social="${socialName}"]`);
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
    await copyShareUrl(status);
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
