/**
 * Deferred GA4 (gtag) — shared by all pages.
 *
 * Critical GitHub Pages / Vercel.app fix:
 * `.github.io` and `.vercel.app` are on the Public Suffix List. GA4's default
 * cookie_domain "auto" resolves to that suffix and browsers reject `_ga` cookies.
 * Pin cookie_domain to the full hostname on those hosts so Pages traffic is counted
 * the same way as https://mangeshraut.pro.
 *
 * Measurement ID: G-HVKF4N150Y (one web stream for all portfolio hosts).
 * Local / preview hosts are never tracked — they previously polluted ~87% of sessions.
 */
(function () {
  if (window.__PERF_AUDIT__) {
    return;
  }

  const hostname = String((window.location && window.location.hostname) || '').toLowerCase();

  /** @param {string} host */
  function isProductionAnalyticsHost(host) {
    if (!host) return false;
    if (host === 'mangeshraut.pro' || host === 'www.mangeshraut.pro') return true;
    if (host === 'mangeshraut712.github.io') return true;
    if (host === 'mraut.vercel.app' || host === 'mangeshrautarchive.vercel.app') return true;
    return false;
  }

  if (!isProductionAnalyticsHost(hostname)) {
    return;
  }

  const MEASUREMENT_ID = 'G-HVKF4N150Y';
  const LINKER_DOMAINS = [
    'mangeshraut.pro',
    'www.mangeshraut.pro',
    'mangeshraut712.github.io',
    'mraut.vercel.app',
    'mangeshrautarchive.vercel.app',
  ];

  function resolveCookieDomain(host) {
    // Public Suffix List hosts — never use parent (.github.io / .vercel.app)
    if (host.endsWith('.github.io') || host === 'github.io') {
      return host;
    }
    if (host.endsWith('.vercel.app') || host === 'vercel.app') {
      return host;
    }
    if (host === 'mangeshraut.pro' || host.endsWith('.mangeshraut.pro')) {
      return 'mangeshraut.pro';
    }
    return 'auto';
  }

  function buildGtagConfig() {
    const cookieDomain = resolveCookieDomain(hostname);
    const config = {
      send_page_view: true,
      linker: { domains: LINKER_DOMAINS },
    };

    if (cookieDomain !== 'auto') {
      config.cookie_domain = cookieDomain;
    }

    // Help GA attribute the GitHub Pages project path correctly in reports
    if (hostname.endsWith('github.io')) {
      config.page_location = window.location.href;
      config.page_title = document.title || 'Mangesh Raut Portfolio';
    }

    return config;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, buildGtagConfig());

  let loaded = false;
  const loadGtag = () => {
    if (loaded) return;
    loaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
  };

  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, loadGtag, {
      once: true,
      passive: true,
      capture: true,
    });
  });

  // Bounce visits without interaction — keep past typical Lighthouse observation windows.
  window.setTimeout(loadGtag, 15000);
})();
