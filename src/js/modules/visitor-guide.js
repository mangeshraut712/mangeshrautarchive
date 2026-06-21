/**
 * Ephemeral first-visit / welcome-back hints — small fixed toasts, ~3s, then gone.
 */

const FIRST_VISIT_KEY = 'portfolio-first-visit-done-v2026';
const WELCOME_BACK_KEY = 'portfolio-welcome-back-shown-v2026';
const TOAST_VISIBLE_MS = 2800;
const TOAST_FADE_MS = 320;
const TOAST_SHOW_DELAY_MS = 450;

const JUNE_BLOG_IDS = [
  'wwdc-2026-apple-intelligence-siri-ai',
  'notebooklm-2026-ai-research-agent',
];

let activeToast = null;
let dismissTimer = null;
let fadeTimer = null;

function readStorage(key, storage = localStorage) {
  try {
    return storage.getItem(key);
  } catch (_error) {
    return null;
  }
}

function writeStorage(key, value, storage = localStorage) {
  try {
    storage.setItem(key, value);
  } catch (_error) {
    // Private mode should not block the page.
  }
}

function scrollToBlog() {
  document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openBlogPost(postId) {
  if (!postId) return;
  scrollToBlog();
  window.location.hash = `blog-read-${postId}`;
  window.__pendingBlogOpen = postId;
  window.dispatchEvent(new CustomEvent('portfolio:open-blog', { detail: { id: postId } }));
}

function ensureToastHost() {
  let host = document.getElementById('visitor-toast-host');
  if (host) return host;

  host = document.createElement('div');
  host.id = 'visitor-toast-host';
  host.className = 'visitor-toast-host';
  host.setAttribute('aria-live', 'polite');
  document.body.appendChild(host);
  return host;
}

function clearToastTimers() {
  if (dismissTimer) {
    window.clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  if (fadeTimer) {
    window.clearTimeout(fadeTimer);
    fadeTimer = null;
  }
}

function dismissToast({ markComplete } = {}) {
  clearToastTimers();

  if (!activeToast) return;

  const toast = activeToast;
  activeToast = null;

  if (markComplete?.firstVisit) {
    writeStorage(FIRST_VISIT_KEY, '1');
  }
  if (markComplete?.welcomeBack) {
    writeStorage(WELCOME_BACK_KEY, '1', sessionStorage);
  }

  toast.classList.add('is-leaving');
  fadeTimer = window.setTimeout(() => {
    toast.remove();
    fadeTimer = null;
  }, TOAST_FADE_MS);
}

function bindToastActions(toast, { onNavigate } = {}) {
  toast.querySelector('.visitor-toast-dismiss')?.addEventListener('click', () => {
    dismissToast({ markComplete: onNavigate });
  });

  toast.querySelectorAll('[data-visitor-blog]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      dismissToast({ markComplete: onNavigate });
      openBlogPost(link.getAttribute('data-visitor-blog'));
    });
  });

  toast.querySelectorAll('a[href^="#"]:not([data-visitor-blog])').forEach(link => {
    link.addEventListener('click', () => {
      dismissToast({ markComplete: onNavigate });
    });
  });
}

function showToast(html, options = {}) {
  if (activeToast) {
    dismissToast();
  }

  const host = ensureToastHost();
  const toast = document.createElement('div');
  toast.className = `visitor-toast lg-glass-card visitor-toast--${options.variant || 'hint'}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = html;
  host.appendChild(toast);
  activeToast = toast;

  bindToastActions(toast, { onNavigate: options.markComplete });

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  dismissTimer = window.setTimeout(() => {
    dismissToast({ markComplete: options.markComplete });
  }, TOAST_VISIBLE_MS);
}

function showFirstVisitToast() {
  showToast(
    `
      <div class="visitor-toast-inner">
        <p class="visitor-toast-kicker">New here?</p>
        <p class="visitor-toast-text">
          Peek at
          <a href="#blog" data-visitor-blog="${JUNE_BLOG_IDS[0]}">June field notes</a>,
          <a href="#about">About</a>, or
          <a href="#projects">Projects</a>.
        </p>
        <button type="button" class="visitor-toast-dismiss" aria-label="Dismiss">×</button>
      </div>
    `,
    { variant: 'new', markComplete: { firstVisit: true } }
  );
}

function showWelcomeBackToast() {
  if (readStorage(WELCOME_BACK_KEY, sessionStorage) === '1') return;

  showToast(
    `
      <div class="visitor-toast-inner">
        <p class="visitor-toast-text">
          <strong>Welcome back.</strong>
          Two June essays in
          <a href="#blog" data-visitor-blog="${JUNE_BLOG_IDS[0]}">Blog</a>.
        </p>
        <button type="button" class="visitor-toast-dismiss" aria-label="Dismiss">×</button>
      </div>
    `,
    { variant: 'return', markComplete: { welcomeBack: true } }
  );
}

export function initVisitorGuide() {
  if (window.__visitorGuideBound) return;
  window.__visitorGuideBound = true;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const showDelay = prefersReducedMotion ? 120 : TOAST_SHOW_DELAY_MS;

  window.setTimeout(() => {
    const isFirstVisit = readStorage(FIRST_VISIT_KEY) !== '1';
    if (isFirstVisit) {
      showFirstVisitToast();
    } else {
      showWelcomeBackToast();
    }
  }, showDelay);

  window.addEventListener('portfolio:open-blog', event => {
    const postId = event.detail?.id;
    if (postId) {
      window.location.hash = `blog-read-${postId}`;
    }
  });
}

export { JUNE_BLOG_IDS, openBlogPost };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVisitorGuide, { once: true });
} else {
  initVisitorGuide();
}
