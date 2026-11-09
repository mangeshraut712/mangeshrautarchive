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

  /** Global portfolio event tracking helper */
  window.trackPortfolioEvent = function (eventName, params = {}) {
    try {
      gtag('event', eventName, {
        host: hostname,
        ...params,
      });
    } catch {
      // Safe fallback if GA4 fails
    }
  };

  let loaded = false;
  const loadGtag = () => {
    if (loaded) return;
    loaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
  };

  // Load on visitor input. Scripted carousels also emit scroll events, so listen
  // for wheel input instead; touch, keyboard, and scrollbar drags are covered below.
  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'mousemove'].forEach(eventName => {
    window.addEventListener(eventName, loadGtag, {
      once: true,
      passive: true,
      capture: true,
    });
  });

  // Load when tab visibility changes or user leaves
  ['visibilitychange', 'pagehide'].forEach(eventName => {
    window.addEventListener(eventName, loadGtag, {
      once: true,
      passive: true,
    });
  });

  // Idle background loader after paint (does not block LCP/FCP)
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(
      () => {
        window.setTimeout(loadGtag, 3500);
      },
      { timeout: 6000 }
    );
  } else {
    window.setTimeout(loadGtag, 4000);
  }

  // Automatic high-intent event tracking delegation
  document.addEventListener(
    'click',
    event => {
      const target =
        event.target && event.target.closest ? event.target.closest('a, button') : null;
      if (!target) return;

      // Resume downloads
      const href = target.getAttribute('href') || '';
      if (
        href.includes('resume') ||
        href.includes('Mangesh_Raut_Resume') ||
        target.classList.contains('btn-resume') ||
        target.classList.contains('recruiter-resume-btn')
      ) {
        const format = href.includes('USA') ? 'usa' : href.includes('Pune') ? 'india' : 'general';
        const placement = target.closest('.recruiter-quick-strip')
          ? 'hero_recruiter_strip'
          : target.closest('#home')
            ? 'hero_dropdown'
            : 'site_surface';
        window.trackPortfolioEvent('resume_download', {
          link_url: href,
          format,
          placement,
          button_text: (target.textContent || '').trim().slice(0, 50),
        });
      }

      // Consultation / Calendly clicks
      if (
        target.id === 'contact-book-meeting-btn' ||
        target.classList.contains('calendly-panel-button') ||
        target.hasAttribute('data-open-calendly') ||
        target.classList.contains('recruiter-book-btn')
      ) {
        const placement = target.closest('.recruiter-quick-strip')
          ? 'hero_recruiter_strip'
          : target.closest('#contact')
            ? 'contact_section'
            : 'site_header';
        window.trackPortfolioEvent('book_consultation_click', {
          placement,
        });
      }

      // Classify destinations by parsed HTTPS host, never by substrings in the URL.
      let destination;
      try {
        destination = new URL(href, window.location.href);
      } catch {
        destination = null;
      }
      const destinationHost =
        destination?.protocol === 'https:' && !destination.username && !destination.password
          ? destination.hostname
          : '';

      // Stripe Checkout
      if (destinationHost === 'buy.stripe.com') {
        window.trackPortfolioEvent('checkout_initiated', {
          provider: 'stripe',
          product: target.dataset.product || 'direct_support',
          amount: target.dataset.amount || 'custom',
          currency: 'usd',
          destination: href,
        });
      }

      // PayPal Checkout
      if (
        ['paypal.com', 'www.paypal.com', 'paypal.me', 'www.paypal.me'].includes(destinationHost)
      ) {
        window.trackPortfolioEvent('checkout_initiated', {
          provider: 'paypal',
          product: target.dataset.product || 'tip_or_support',
          destination: href,
        });
      }

      // Buy Me A Coffee
      if (['buymeacoffee.com', 'www.buymeacoffee.com'].includes(destinationHost)) {
        window.trackPortfolioEvent('checkout_initiated', {
          provider: 'buymeacoffee',
          product: target.dataset.product || 'coffee_support',
          destination: href,
        });
      }

      // GitHub Sponsors
      if (destinationHost === 'github.com' && destination.pathname.startsWith('/sponsors/')) {
        window.trackPortfolioEvent('checkout_initiated', {
          provider: 'github_sponsors',
          tier: target.dataset.tier || 'monthly_sponsor',
          destination: href,
        });
      }

      // Reverse Technical Interview Evaluation Prompts
      if (target.hasAttribute('data-reverse-interview-prompt')) {
        window.trackPortfolioEvent('reverse_interview_click', {
          prompt_id: target.getAttribute('data-reverse-interview-prompt') || 'custom',
          prompt_text: (target.getAttribute('data-prompt') || target.textContent || '')
            .trim()
            .slice(0, 80),
        });
      }

      // Outbound social profiles
      if (
        (destinationHost === 'github.com' && /^\/mangeshraut712\/?$/.test(destination.pathname)) ||
        (['linkedin.com', 'www.linkedin.com'].includes(destinationHost) &&
          /^\/in\/mangeshraut712(?:98)?\/?$/.test(destination.pathname)) ||
        (destinationHost === 'x.com' && /^\/mangeshraut712\/?$/i.test(destination.pathname))
      ) {
        window.trackPortfolioEvent('social_profile_click', {
          destination: href,
        });
      }
    },
    { passive: true }
  );
})();
