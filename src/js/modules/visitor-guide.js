/**
 * First-visit quick paths and welcome-back messaging.
 */

const FIRST_VISIT_KEY = 'portfolio-first-visit-done-v2026';
const WELCOME_BACK_KEY = 'portfolio-welcome-back-shown-v2026';

const JUNE_BLOG_IDS = [
  'wwdc-2026-apple-intelligence-siri-ai',
  'notebooklm-2026-ai-research-agent',
];

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
  const blog = document.getElementById('blog');
  if (!blog) return;
  blog.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openBlogPost(postId) {
  if (!postId) return;
  scrollToBlog();
  window.location.hash = `blog-read-${postId}`;
  window.__pendingBlogOpen = postId;
  window.dispatchEvent(new CustomEvent('portfolio:open-blog', { detail: { id: postId } }));
}

function bindBlogQuickLinks(root) {
  root.querySelectorAll('[data-visitor-blog]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      markFirstVisitDone();
      openBlogPost(link.getAttribute('data-visitor-blog'));
    });
  });
}

function markFirstVisitDone() {
  writeStorage(FIRST_VISIT_KEY, '1');
  const panel = document.getElementById('visitor-start-panel');
  if (panel) {
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
  }
}

function dismissWelcomeBack() {
  writeStorage(WELCOME_BACK_KEY, '1', sessionStorage);
  const banner = document.getElementById('visitor-welcome-back');
  if (banner) {
    banner.hidden = true;
    banner.setAttribute('aria-hidden', 'true');
  }
}

function showFirstVisitPanel() {
  const panel = document.getElementById('visitor-start-panel');
  if (!panel) return;

  panel.hidden = false;
  panel.removeAttribute('aria-hidden');
  bindBlogQuickLinks(panel);

  panel.querySelector('.visitor-start-dismiss')?.addEventListener('click', () => {
    markFirstVisitDone();
  });

  panel.querySelectorAll('a[href^="#"]:not([data-visitor-blog])').forEach(link => {
    link.addEventListener('click', () => {
      markFirstVisitDone();
    });
  });
}

function showWelcomeBackBanner() {
  if (readStorage(WELCOME_BACK_KEY, sessionStorage) === '1') return;

  const banner = document.getElementById('visitor-welcome-back');
  if (!banner) return;

  banner.hidden = false;
  banner.removeAttribute('aria-hidden');

  banner.querySelector('.visitor-welcome-dismiss')?.addEventListener('click', dismissWelcomeBack);
  banner.querySelector('[data-visitor-blog]')?.addEventListener('click', event => {
    event.preventDefault();
    dismissWelcomeBack();
    openBlogPost(event.currentTarget.getAttribute('data-visitor-blog'));
  });

  window.setTimeout(dismissWelcomeBack, 12000);
}

export function initVisitorGuide() {
  if (window.__visitorGuideBound) return;
  window.__visitorGuideBound = true;

  const isFirstVisit = readStorage(FIRST_VISIT_KEY) !== '1';

  if (isFirstVisit) {
    showFirstVisitPanel();
  } else {
    showWelcomeBackBanner();
  }

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
