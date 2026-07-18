/**
 * Simple Apple-style 404 page.
 * Path display, go-back, theme fallback, light keyboard shortcuts.
 */

const DESTINATIONS = [
  { href: 'index.html#home', title: 'Home', key: '1' },
  { href: 'systems.html', title: 'Systems', key: '2' },
  { href: 'monitor.html', title: 'Monitor', key: '3' },
  { href: 'travel.html', title: 'Travel', key: '4' },
  { href: 'uses.html', title: 'Uses', key: '5' },
  { href: 'index.html#contact', title: 'Contact', key: '6' },
];

function resolveAttemptedPath() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('from') || params.get('path') || params.get('url');
  if (fromQuery) return fromQuery;

  const path = window.location.pathname || '';
  const isDirect404 =
    /\/404(?:\.html)?\/?$/i.test(path) || path.endsWith('/404') || path.endsWith('404.html');
  if (isDirect404) return '';

  if (path && path !== '/' && !path.endsWith('/index.html')) {
    return path + (window.location.search || '') + (window.location.hash || '');
  }
  return '';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDestinations(listEl) {
  if (!listEl) return;
  listEl.innerHTML = DESTINATIONS.map(
    dest => `
    <li>
      <a class="error-dest-card" href="${dest.href}" data-key="${dest.key}">
        <span class="error-dest-card__title">${escapeHtml(dest.title)}</span>
      </a>
    </li>
  `
  ).join('');
}

function initPath(root) {
  const el = root.querySelector('#error-path');
  if (!el) return;
  const attempted = resolveAttemptedPath();
  if (!attempted) return;
  el.innerHTML = `Tried <strong>${escapeHtml(attempted)}</strong>`;
  el.classList.add('is-visible');
}

function initBackButton(root) {
  const btn = root.querySelector('#error-go-back');
  if (!btn) return;
  if (window.history.length <= 1) {
    btn.hidden = true;
    return;
  }
  btn.addEventListener('click', () => {
    window.history.back();
  });
}

function initKeyboard(root) {
  const byKey = new Map(
    DESTINATIONS.map(d => [d.key, root.querySelector(`.error-dest-card[data-key="${d.key}"]`)])
  );

  window.addEventListener('keydown', event => {
    const tag = (event.target && event.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;

    if ((event.key === 'h' || event.key === 'H') && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      window.location.href = 'index.html#home';
      return;
    }

    if ((event.key === 'b' || event.key === 'B') && window.history.length > 1) {
      event.preventDefault();
      window.history.back();
      return;
    }

    const card = byKey.get(event.key);
    if (card) {
      event.preventDefault();
      card.click();
    }
  });
}

function initThemeToggle(root) {
  const btn = root.querySelector('#theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (typeof window.toggleTheme === 'function') {
      window.toggleTheme();
      return;
    }
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  });
}

export function initError404Page(root = document) {
  const page = root.querySelector?.('body.error-page') || document.body;
  if (!page?.classList?.contains('error-page')) return;

  renderDestinations(page.querySelector('#error-dest-grid'));
  initPath(page);
  initBackButton(page);
  initKeyboard(page);
  initThemeToggle(page);
  page.dataset.error404Ready = 'true';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initError404Page(), { once: true });
} else {
  initError404Page();
}

export default initError404Page;
