const DEFAULT_NAV_OFFSET_SELECTOR = 'nav';
export function initOverlayMenu(e = {}) {
  const {
      menuButtonId: t = 'menu-btn',
      closeButtonId: n = 'close-menu-btn',
      menuId: o = 'overlay-menu',
      documentRef: i = document,
    } = e,
    r = i.getElementById(t),
    a = i.getElementById(n),
    s = i.getElementById(o),
    l = i.body;
  if (!(r && a && s && l))
    return void console.error('❌ Mobile menu initialization failed - missing elements');
  if ('true' === r.dataset.overlayBound) return;
  r.dataset.overlayBound = 'true';
  const u = () => {
    l.classList.contains('menu-open') &&
      (l.classList.remove('menu-open'),
      s.setAttribute('aria-hidden', 'true'),
      s.setAttribute('inert', ''),
      r.setAttribute('aria-expanded', 'false'),
      'function' == typeof r.focus && r.focus());
  };
  (r.addEventListener('click', () => {
    l.classList.contains('menu-open')
      ? u()
      : l.classList.contains('menu-open') ||
        (l.classList.add('menu-open'),
        s.setAttribute('aria-hidden', 'false'),
        s.removeAttribute('inert'),
        r.setAttribute('aria-expanded', 'true'));
  }),
    a.addEventListener('click', () => {
      u();
    }),
    s.addEventListener('click', e => {
      e.target === s && u();
    }),
    document.addEventListener('keydown', e => {
      'Escape' === e.key && u();
    }));
}
export function initOverlayNavigation(e = {}) {
  if (window.__smartNavbarHandlesDynamicIsland) return;
  const {
      linkSelector: t = '.menu-item',
      offsetSelector: n = DEFAULT_NAV_OFFSET_SELECTOR,
      closeClass: o = 'menu-open',
      documentRef: i = document,
    } = e,
    r = Array.from(i.querySelectorAll(t));
  if (!r.length) return;
  const a = i.body;
  r.forEach(e => {
    'true' !== e.dataset.overlayNavBound &&
      ((e.dataset.overlayNavBound = 'true'),
      e.addEventListener('click', t => {
        const r = e.getAttribute('href');
        if (!r || !r.startsWith('#')) return;
        t.preventDefault();
        const s = i.querySelector(r);
        if (!s) return;
        a && o && a.classList.remove(o);
        const l = i.getElementById('overlay-menu');
        l && (l.setAttribute('aria-hidden', 'true'), l.setAttribute('inert', ''));
        const u = i.getElementById('menu-btn');
        (u && (u.setAttribute('aria-expanded', 'false'), u.focus()),
          setTimeout(() => {
            const e = i.querySelector(n)?.offsetHeight || 0,
              t = s.getBoundingClientRect().top + window.pageYOffset - e - 10;
            window.scrollTo({ top: t, behavior: 'smooth' });
          }, 120));
      }));
  });
}
export function initSmoothScroll(e = 'a[href^="#"]', t = {}) {
  const { documentRef: n = document, behavior: o = 'smooth', block: i = 'start' } = t,
    r = Array.from(n.querySelectorAll(e));
  r.length &&
    r.forEach(e => {
      'true' !== e.dataset.smoothScrollBound &&
        ((e.dataset.smoothScrollBound = 'true'),
        e.addEventListener('click', t => {
          const r = e.getAttribute('href');
          if (!r || '#' === r) return;
          const a = r.startsWith('#') ? r.slice(1) : r,
            s = n.getElementById(a);
          s && (t.preventDefault(), s.scrollIntoView({ behavior: o, block: i }));
        }));
    });
}
export default {
  initOverlayMenu: initOverlayMenu,
  initOverlayNavigation: initOverlayNavigation,
  initSmoothScroll: initSmoothScroll,
};
'undefined' != typeof window &&
  'undefined' != typeof document &&
  document.addEventListener('DOMContentLoaded', () => {
    (initOverlayMenu(), initOverlayNavigation({ offsetSelector: '.global-nav' }));
  });
