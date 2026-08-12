/**
 * Apple-style resume dropdown
 * - Single-init guard (safe with bootstrap + module side-effect)
 * - Fixed menu positioning so hero overflow does not clip options
 * - Forced PDF download via fetch + blob (works when servers send Content-Disposition: inline)
 * - Dual-host path prefix via getSiteBase / sitePath
 */

import { sitePath } from '../utils/site-base.js';

const RESUME_FILES = {
  usa: {
    path: '/assets/files/001_Mangesh_Resume_USA.pdf',
    filename: 'Mangesh_Raut_Resume_USA.pdf',
  },
  india: {
    path: '/assets/files/001_Mangesh_Resume_Pune.pdf',
    filename: 'Mangesh_Raut_Resume_Pune.pdf',
  },
  primary: {
    path: '/assets/files/Mangesh_Raut_Resume.pdf',
    filename: 'Mangesh_Raut_Resume.pdf',
  },
};

let initialized = false;

/**
 * Force a same-origin PDF download. Falls back to opening the file if fetch fails.
 * @param {string} url
 * @param {string} filename
 * @returns {Promise<boolean>}
 */
export async function forceDownloadFile(url, filename) {
  const safeName = String(filename || 'Mangesh_Raut_Resume.pdf').replace(/[^\w.\-()+ ]+/g, '_');
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-cache',
      headers: { Accept: 'application/pdf' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const pdfBlob =
      blob.type && blob.type.includes('pdf') ? blob : new Blob([blob], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(pdfBlob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = safeName;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    return true;
  } catch {
    // Fallback: open in a new tab so the user still gets the PDF
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.download = safeName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Resolve a resume href to a dual-host-safe absolute path.
 * @param {string} href
 * @returns {string}
 */
function resolveResumeUrl(href) {
  const raw = String(href || '').trim();
  if (!raw) return sitePath(RESUME_FILES.primary.path);

  if (/^https?:\/\//i.test(raw)) return raw;

  // Already root-absolute site path
  if (raw.startsWith('/')) {
    // Avoid double-prefixing when already under /mangeshrautarchive
    if (raw.startsWith('/mangeshrautarchive/')) return raw;
    return sitePath(raw);
  }

  // Relative assets/files/... → absolute
  const cleaned = raw.replace(/^\.\//, '');
  return sitePath(`/${cleaned}`);
}

function detectResumeKey(href, downloadName) {
  const haystack = `${href} ${downloadName}`.toLowerCase();
  if (haystack.includes('pune') || haystack.includes('india')) return 'india';
  if (haystack.includes('usa') || haystack.includes('global')) return 'usa';
  return 'primary';
}

export function initResumeDropdown() {
  if (initialized || typeof document === 'undefined') return;
  const wrapper = document.querySelector('.resume-dropdown-wrapper');
  const toggle = document.getElementById('resume-dropdown-toggle');
  const menu = document.getElementById('resume-dropdown-menu');
  if (!wrapper || !toggle || !menu) return;

  initialized = true;

  const items = Array.from(menu.querySelectorAll('.resume-dropdown-item'));
  const menuHomeParent = menu.parentElement;
  let activeIndex = -1;
  let positionFrame = 0;
  let portaled = false;
  let openScrollY = 0;

  // Normalize hrefs for dual-host deploys and attach download metadata
  items.forEach(item => {
    const key = detectResumeKey(
      item.getAttribute('href') || '',
      item.getAttribute('download') || ''
    );
    const meta = RESUME_FILES[key] || RESUME_FILES.primary;
    const resolved = resolveResumeUrl(item.getAttribute('href') || meta.path);
    item.setAttribute('href', resolved);
    item.setAttribute('download', meta.filename);
    item.dataset.resumeKey = key;
    item.dataset.resumeUrl = resolved;
    item.dataset.resumeFilename = meta.filename;
  });

  function setItemTabIndexes(enabled) {
    items.forEach((item, index) => {
      item.setAttribute('tabindex', enabled ? (index === activeIndex ? '0' : '-1') : '-1');
    });
  }

  function portalMenuToBody() {
    if (portaled || !document.body) return;
    document.body.appendChild(menu);
    portaled = true;
  }

  function restoreMenuHome() {
    if (!portaled || !menuHomeParent) return;
    menuHomeParent.appendChild(menu);
    portaled = false;
  }

  function positionMenu() {
    if (!wrapper.classList.contains('is-open')) return;

    let toggleRect = toggle.getBoundingClientRect();
    const menuWidth = Math.min(
      Math.max(toggleRect.width, 280),
      Math.max(260, window.innerWidth - 24)
    );
    const gap = 8.5;
    const viewportPad = 12;
    const menuHeight = Math.ceil(menu.getBoundingClientRect().height || menu.scrollHeight);
    const overflowBelow = toggleRect.bottom + gap + menuHeight + viewportPad - window.innerHeight;

    if (overflowBelow > 0) {
      window.scrollBy({ top: Math.ceil(overflowBelow), behavior: 'instant' });
      toggleRect = toggle.getBoundingClientRect();
    }

    let left = toggleRect.left + toggleRect.width / 2 - menuWidth / 2;
    left = Math.max(viewportPad, Math.min(left, window.innerWidth - menuWidth - viewportPad));

    menu.style.position = 'fixed';
    menu.style.left = `${Math.round(left)}px`;
    menu.style.width = `${Math.round(menuWidth)}px`;
    menu.style.right = 'auto';
    menu.style.zIndex = '12050';
    menu.style.margin = '0';
    menu.style.bottom = 'auto';
    menu.style.top = `${Math.round(toggleRect.bottom + gap)}px`;
    menu.style.overflowY = 'visible';
    menu.dataset.placement = 'bottom';
  }

  function schedulePosition() {
    if (positionFrame) cancelAnimationFrame(positionFrame);
    positionFrame = requestAnimationFrame(() => {
      positionFrame = 0;
      positionMenu();
    });
  }

  function openMenu() {
    wrapper.classList.add('is-open');
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    menu.removeAttribute('inert');
    portalMenuToBody();
    activeIndex = 0;
    setItemTabIndexes(true);
    schedulePosition();
    // Focus first item after paint so screen readers announce the menu
    requestAnimationFrame(() => {
      positionMenu();
      openScrollY = window.scrollY;
      items[0]?.focus({ preventScroll: true });
    });
  }

  function closeMenu({ restoreFocus = false } = {}) {
    if (!wrapper.classList.contains('is-open')) return;
    wrapper.classList.remove('is-open');
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    menu.setAttribute('inert', '');
    activeIndex = -1;
    setItemTabIndexes(false);
    menu.style.top = '';
    menu.style.bottom = '';
    menu.style.left = '';
    menu.style.right = '';
    menu.style.width = '';
    menu.style.position = '';
    menu.style.zIndex = '';
    menu.style.margin = '';
    menu.style.overflowY = '';
    menu.removeAttribute('data-placement');
    restoreMenuHome();
    if (restoreFocus) {
      toggle.focus({ preventScroll: true });
    }
  }

  function toggleMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    if (wrapper.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function focusItem(index) {
    if (!items.length) return;
    activeIndex = (index + items.length) % items.length;
    setItemTabIndexes(true);
    items[activeIndex].focus({ preventScroll: true });
  }

  async function handleItemActivate(event, item) {
    event.preventDefault();
    event.stopPropagation();

    if (item.dataset.downloading === 'true') return;

    const url = item.dataset.resumeUrl || resolveResumeUrl(item.getAttribute('href'));
    const filename =
      item.dataset.resumeFilename || item.getAttribute('download') || 'Mangesh_Raut_Resume.pdf';

    item.dataset.downloading = 'true';
    item.classList.add('is-downloading');
    item.setAttribute('aria-busy', 'true');

    const ok = await forceDownloadFile(url, filename);

    item.dataset.downloading = 'false';
    item.classList.remove('is-downloading');
    item.removeAttribute('aria-busy');

    closeMenu({ restoreFocus: true });

    if (!ok) {
      // Last resort: navigate so the PDF still opens
      window.location.assign(url);
    }
  }

  // Initial closed a11y state
  menu.setAttribute('aria-hidden', 'true');
  menu.setAttribute('inert', '');
  setItemTabIndexes(false);

  toggle.addEventListener('click', toggleMenu);

  items.forEach(item => {
    item.addEventListener('click', event => {
      handleItemActivate(event, item);
    });
  });

  document.addEventListener('click', event => {
    if (!wrapper.contains(event.target) && !menu.contains(event.target)) {
      closeMenu();
    }
  });

  window.addEventListener(
    'scroll',
    () => {
      if (wrapper.classList.contains('is-open') && Math.abs(window.scrollY - openScrollY) > 20) {
        closeMenu();
      }
    },
    { passive: true }
  );

  document.addEventListener('keydown', event => {
    const isOpen = wrapper.classList.contains('is-open');

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
      return;
    }

    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(activeIndex < 0 ? 0 : activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(activeIndex < 0 ? items.length - 1 : activeIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(items.length - 1);
    } else if (event.key === 'Tab') {
      // Keep focus inside menu while open; close on leave
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (wrapper.classList.contains('is-open')) schedulePosition();
  });

  window.addEventListener(
    'scroll',
    () => {
      if (wrapper.classList.contains('is-open')) schedulePosition();
    },
    { passive: true, capture: true }
  );
}

// Auto-initialize when imported as an ES module (bootstrap also calls init — guarded).
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResumeDropdown, { once: true });
  } else {
    initResumeDropdown();
  }
}
