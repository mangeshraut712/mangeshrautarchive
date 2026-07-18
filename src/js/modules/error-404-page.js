/**
 * Interactive Apple-style 404 page behaviors.
 * Pointer spotlight, digit parallax, destination filter, keyboard shortcuts.
 */

const TIPS = [
  'Try Systems for architecture proof, or Monitor for live health.',
  'Press ⌘K / Ctrl+K on most pages for global search.',
  'Travel Atlas is a full-screen map journal — fun when you need a detour.',
  'Uses lists the hardware and AI stack behind this portfolio.',
  'Home has projects, case studies, and a way to get in touch.',
];

const DESTINATIONS = [
  {
    id: 'home',
    href: 'index.html#home',
    title: 'Home',
    desc: 'Portfolio & hero',
    icon: 'fa-house',
    key: '1',
    keywords: 'home portfolio about resume',
  },
  {
    id: 'systems',
    href: 'systems.html',
    title: 'Systems',
    desc: 'Engineering notebook',
    icon: 'fa-diagram-project',
    key: '2',
    keywords: 'systems engineering architecture proof',
  },
  {
    id: 'monitor',
    href: 'monitor.html',
    title: 'Monitor',
    desc: 'Live ops status',
    icon: 'fa-heart-pulse',
    key: '3',
    keywords: 'monitor health api status',
  },
  {
    id: 'travel',
    href: 'travel.html',
    title: 'Travel',
    desc: 'Map-led atlas',
    icon: 'fa-earth-americas',
    key: '4',
    keywords: 'travel map atlas countries',
  },
  {
    id: 'uses',
    href: 'uses.html',
    title: 'Uses',
    desc: 'Tools & stack',
    icon: 'fa-laptop-code',
    key: '5',
    keywords: 'uses tools stack hardware software',
  },
  {
    id: 'contact',
    href: 'index.html#contact',
    title: 'Contact',
    desc: 'Say hello',
    icon: 'fa-paper-plane',
    key: '6',
    keywords: 'contact email hire connect',
  },
];

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function haptic(kind = 'light') {
  try {
    if (window.AppleHaptics?.impact) {
      window.AppleHaptics.impact(kind);
      return;
    }
  } catch {
    /* ignore */
  }
  if (navigator.vibrate) navigator.vibrate(8);
}

function resolveAttemptedPath() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('from') || params.get('path') || params.get('url');
  if (fromQuery) return fromQuery;

  const path = window.location.pathname || '';
  const isDirect404 =
    /\/404(?:\.html)?\/?$/i.test(path) || path.endsWith('/404') || path.endsWith('404.html');
  if (isDirect404) return '';

  // When hosts rewrite unknown routes to 404.html, pathname is often still the missing URL.
  if (path && path !== '/' && !path.endsWith('/index.html')) {
    return path + (window.location.search || '') + (window.location.hash || '');
  }
  return '';
}

function renderDestinations(listEl) {
  if (!listEl) return;
  listEl.innerHTML = DESTINATIONS.map(
    dest => `
    <li>
      <a
        class="error-dest-card"
        href="${dest.href}"
        data-dest-id="${dest.id}"
        data-key="${dest.key}"
        data-keywords="${dest.keywords} ${dest.title} ${dest.desc}"
      >
        <span class="error-dest-card__key" aria-hidden="true">${dest.key}</span>
        <span class="error-dest-card__icon" aria-hidden="true"><i class="fas ${dest.icon}"></i></span>
        <p class="error-dest-card__title">${dest.title}</p>
        <p class="error-dest-card__desc">${dest.desc}</p>
      </a>
    </li>
  `
  ).join('');
}

function initPointerEffects(root) {
  if (prefersReducedMotion()) return () => {};

  const panel = root.querySelector('.error-panel');
  const spotlight = root.querySelector('.error-spotlight');
  const digits = [...root.querySelectorAll('.error-digit')];
  let raf = 0;
  let mx = window.innerWidth / 2;
  let my = window.innerHeight * 0.35;

  const apply = () => {
    raf = 0;
    if (spotlight) {
      spotlight.style.left = `${mx}px`;
      spotlight.style.top = `${my}px`;
    }
    if (panel) {
      const r = panel.getBoundingClientRect();
      const px = ((mx - r.left) / Math.max(1, r.width)) * 100;
      const py = ((my - r.top) / Math.max(1, r.height)) * 100;
      panel.style.setProperty('--mx', `${clamp(px, 0, 100)}%`);
      panel.style.setProperty('--my', `${clamp(py, 0, 100)}%`);
    }
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    digits.forEach((digit, i) => {
      const strength = 10 + i * 4;
      const dx = ((mx - cx) / cx) * strength;
      const dy = ((my - cy) / cy) * strength * 0.7;
      const ry = ((mx - cx) / cx) * 6;
      const rx = ((cy - my) / cy) * 5;
      digit.style.setProperty('--dx', `${dx.toFixed(2)}px`);
      digit.style.setProperty('--dy', `${dy.toFixed(2)}px`);
      digit.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      digit.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    });
  };

  const onMove = event => {
    mx = event.clientX;
    my = event.clientY;
    if (!raf) raf = requestAnimationFrame(apply);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  apply();

  return () => {
    window.removeEventListener('pointermove', onMove);
    if (raf) cancelAnimationFrame(raf);
  };
}

function initMagneticCards(root) {
  if (prefersReducedMotion()) return;
  const cards = [...root.querySelectorAll('.error-dest-card')];

  cards.forEach(card => {
    const onMove = event => {
      const r = card.getBoundingClientRect();
      const x = event.clientX - r.left;
      const y = event.clientY - r.top;
      const px = x / r.width - 0.5;
      const py = y / r.height - 0.5;
      card.style.setProperty('--tilt-y', `${(px * 8).toFixed(2)}deg`);
      card.style.setProperty('--tilt-x', `${(-py * 8).toFixed(2)}deg`);
      card.style.setProperty('--lx', `${(x / r.width) * 100}%`);
      card.style.setProperty('--ly', `${(y / r.height) * 100}%`);
    };
    const onLeave = () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    };
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    card.addEventListener('focus', () => haptic('light'));
    card.addEventListener('click', () => haptic('medium'));
  });
}

function initSearch(root) {
  const input = root.querySelector('#error-search-input');
  const empty = root.querySelector('#error-empty');
  const cards = () => [...root.querySelectorAll('.error-dest-card')];
  if (!input) return;

  const filter = () => {
    const q = input.value.trim().toLowerCase();
    let visible = 0;
    cards().forEach(card => {
      const hay = (card.dataset.keywords || card.textContent || '').toLowerCase();
      const show = !q || hay.includes(q);
      card.classList.toggle('is-filtered-out', !show);
      if (show) visible += 1;
    });
    empty?.classList.toggle('is-visible', visible === 0);
  };

  input.addEventListener('input', filter);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      input.value = '';
      filter();
      input.blur();
    }
  });
}

function initDigits(root) {
  const digits = [...root.querySelectorAll('.error-digit')];
  digits.forEach(digit => {
    digit.addEventListener('click', () => {
      if (prefersReducedMotion()) return;
      digit.classList.remove('is-bounce');
      // reflow
      void digit.offsetWidth;
      digit.classList.add('is-bounce');
      haptic('light');
    });
  });
}

function initKeyboard(root) {
  const byKey = new Map(
    DESTINATIONS.map(d => [d.key, root.querySelector(`.error-dest-card[data-key="${d.key}"]`)])
  );

  window.addEventListener('keydown', event => {
    const tag = (event.target && event.target.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable;
    if (typing && event.key !== 'Escape') return;

    if (event.key === '/' && !typing) {
      event.preventDefault();
      root.querySelector('#error-search-input')?.focus();
      return;
    }

    if ((event.key === 'h' || event.key === 'H') && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      window.location.href = 'index.html#home';
      return;
    }

    if (event.key === 'b' || event.key === 'B') {
      if (window.history.length > 1) {
        event.preventDefault();
        window.history.back();
      }
      return;
    }

    const card = byKey.get(event.key);
    if (card && !card.classList.contains('is-filtered-out')) {
      event.preventDefault();
      haptic('medium');
      card.click();
    }
  });
}

function initPath(root) {
  const el = root.querySelector('#error-path');
  if (!el) return;
  const attempted = resolveAttemptedPath();
  if (!attempted) return;
  el.innerHTML = `Tried <strong>${escapeHtml(attempted)}</strong>`;
  el.classList.add('is-visible');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initBackButton(root) {
  const btn = root.querySelector('#error-go-back');
  if (!btn) return;
  if (window.history.length <= 1) {
    btn.hidden = true;
    return;
  }
  btn.addEventListener('click', () => {
    haptic('light');
    window.history.back();
  });
}

function initTips(root) {
  const text = root.querySelector('#error-tip-text');
  if (!text) return;
  let i = Math.floor(Math.random() * TIPS.length);
  text.textContent = TIPS[i];
  if (prefersReducedMotion()) return;
  window.setInterval(() => {
    i = (i + 1) % TIPS.length;
    text.classList.add('is-fading');
    window.setTimeout(() => {
      text.textContent = TIPS[i];
      text.classList.remove('is-fading');
    }, 180);
  }, 7000);
}

function initThemeToggle(root) {
  const btn = root.querySelector('#theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    // theme.js owns the real toggle; this is a fallback if it is not yet bound
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

  const list = page.querySelector('#error-dest-grid');
  renderDestinations(list);
  initPath(page);
  initBackButton(page);
  initSearch(page);
  initDigits(page);
  initMagneticCards(page);
  initKeyboard(page);
  initTips(page);
  initThemeToggle(page);
  initPointerEffects(page);

  page.dataset.error404Ready = 'true';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initError404Page(), { once: true });
} else {
  initError404Page();
}

export default initError404Page;
