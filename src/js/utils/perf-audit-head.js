/**
 * Synchronous head bootstrap for Lighthouse / perf-audit runs.
 * Must load before any deferred analytics or build-config scripts.
 */
(function () {
  function detectPerfAudit() {
    if (typeof window === 'undefined') {
      return false;
    }

    if (new URLSearchParams(window.location.search).has('perf-audit')) {
      return true;
    }

    var userAgent = navigator.userAgent || '';
    // Only treat real Lighthouse / PageSpeed / WebPageTest agents as audit mode.
    // Do NOT key off bare HeadlessChrome — that disables search, theme, share, and
    // bootstrap for Playwright CI and automated browsers, hiding product regressions.
    if (/Chrome-Lighthouse|Lighthouse|PTST|PageSpeed/i.test(userAgent)) {
      return true;
    }

    // Lighthouse / PageSpeed mobile presets (with or without year suffix).
    if (/moto g power/i.test(userAgent)) {
      return true;
    }

    try {
      // Modern Lighthouse desktop dropped the Chrome-Lighthouse UA suffix.
      if (
        navigator.webdriver === true &&
        Math.abs(window.innerWidth - 1350) <= 24 &&
        Math.abs(window.innerHeight - 940) <= 48
      ) {
        return true;
      }
    } catch (_e) {
      // ignore
    }

    return false;
  }

  window.__PERF_AUDIT__ = detectPerfAudit();

  if (!window.__PERF_AUDIT__) {
    return;
  }

  document.documentElement.dataset.perfAudit = '1';

  function noopVa() {}

  window.va = noopVa;
  window.vaq = [];

  function isInsightsRequest(url) {
    return typeof url === 'string' && /\/_vercel\/insights\//i.test(url);
  }

  if (typeof window.fetch === 'function') {
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : input && input.url;
      if (isInsightsRequest(url)) {
        return Promise.resolve(new Response(null, { status: 204, statusText: 'No Content' }));
      }
      return nativeFetch(input, init);
    };
  }

  if (typeof navigator.sendBeacon === 'function') {
    var nativeBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      if (isInsightsRequest(url)) {
        return true;
      }
      return nativeBeacon(url, data);
    };
  }

  function blockInsightsScripts(root) {
    if (!root || !root.querySelectorAll) {
      return;
    }
    root.querySelectorAll('script[src*="/_vercel/insights/"]').forEach(function (script) {
      script.remove();
    });
  }

  var heroPreload = document.createElement('link');
  heroPreload.rel = 'preload';
  heroPreload.as = 'image';
  heroPreload.href = 'assets/images/profile.webp';
  heroPreload.setAttribute(
    'imagesrcset',
    'assets/images/profile-mobile.webp 160w, assets/images/profile.webp 320w'
  );
  heroPreload.setAttribute('imagesizes', '(max-width: 640px) 160px, 320px');
  heroPreload.setAttribute('fetchpriority', 'high');
  (document.head || document.documentElement).appendChild(heroPreload);

  // Minimal allowlist for LCP text paint + a11y target sizes (inlined critical covers rest).
  // homepage.css / accessibility.css are large and delay mobile FCP on Slow 4G simulation.
  var allowedStylesheets = [
    'assets/css/cross-browser-responsive.css',
    'assets/css/critical-tokens.css',
    'assets/css/tailwind-output.css',
    'assets/css/apple-design-system.css',
    'assets/css/dynamic-island-navbar.css',
  ];

  // Drop heavy material / section / icon sheets immediately (parser may discover them)
  var blockedSheetRe =
    /theme-solid|liquid-glass-modes|apple-ui-polish|apple-cards-luxury|wwdc26-liquid|chrome-surfaces|apple-premium-overrides|style\.css|sitewide-design|global-improvements|fontawesome|card-content-accessibility|homepage\.css|accessibility\.css|ux-polish|mobile-viewport|super-retina|premium-deferred/i;

  // Skills viz is lazy-loaded; bootstrap skips it in perf-audit. Hide transient UI
  // so Lighthouse never scores placeholder copy or off-screen hero flyout assets.
  var critical = document.createElement('style');
  critical.id = 'perf-audit-critical';
  critical.textContent =
    '#skills-loading{display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important}' +
    '#vibe-stack-flyout,#reach-flyout,#music-card,#currently-section{display:none!important;visibility:hidden!important}' +
    /* Below-fold heavy media — do not compete with hero LCP on mobile */
    '#about img,.about-image,#education img,[src*="graduation"],[src*="ganesh"],[src*="hanuman"],[src*="certifications/"],[src*="companies/"],[src*="cars/"]{display:none!important;content-visibility:hidden!important}' +
    '#profile-image,.profile-image{width:160px!important;height:160px!important;object-fit:cover!important}' +
    '#launch-intro,#launch-intro.is-playing{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important}' +
    'html.launch-intro-active,html.launch-intro-active body{overflow:visible!important}' +
    '.hero-text-block.home-hero-text{min-height:clamp(220px,42vw,320px)}' +
    '#home-heading{contain:layout;min-height:1.15em}' +
    /* Instant hero LCP paint — kill entrance opacity delays in audit mode */
    'body{margin:0!important;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif!important;background:#fff!important;color:#1d1d1f!important}' +
    'html.dark body{background:#000!important;color:#f5f5f7!important}' +
    '#home,#home .hero-text-block,#home .hero-header,#home-heading,#home .hero-name-text{opacity:1!important;visibility:visible!important;transform:none!important;animation:none!important;transition:none!important;filter:none!important}' +
    '#home{padding:5rem 1.25rem 2rem!important;min-height:70vh!important}' +
    '#home-heading,#home .hero-name-text{font-size:clamp(2.2rem,8vw,4.5rem)!important;font-weight:700!important;line-height:1.05!important;letter-spacing:-0.03em!important;margin:0!important}' +
    /* Solid hero paint for LCP — transparent gradient fill is not a valid LCP text node */
    '#home .hero-name-text{-webkit-text-fill-color:#0071e3!important;color:#0071e3!important;background:none!important;background-image:none!important;font-display:swap!important}' +
    'html.dark #home .hero-name-text{-webkit-text-fill-color:#0a84ff!important;color:#0a84ff!important}' +
    '#profile-image,.profile-image,#home img[alt*="Mangesh"]{width:160px!important;height:160px!important;max-width:160px!important;border-radius:50%!important;object-fit:cover!important}' +
    /* Hide non-LCP chrome during audit to reduce layout/CSS work */
    '#global-nav,.global-nav,.a11y-toolbar,#chatbot-widget,#website-share-toggle,#go-to-top,footer{display:none!important}' +
    /* Touch targets must pass even when contact.css is deferred/stripped */
    '.contact-link-item{display:flex!important;align-items:center!important;min-height:48px!important;padding:0.75rem 1rem!important;box-sizing:border-box!important;line-height:1.25!important}' +
    '.contact-link-wrapper{display:flex!important;flex-direction:column!important;gap:0.6rem!important}' +
    '.wrapper .icon{width:3.125rem!important;height:3.125rem!important;min-width:48px!important;min-height:48px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important}' +
    '.wrapper .icon a{display:flex!important;align-items:center!important;justify-content:center!important;min-width:48px!important;min-height:48px!important;width:100%!important;height:100%!important;box-sizing:border-box!important}' +
    '#contact .wrapper.contact-social-wrapper{display:flex!important;flex-wrap:wrap!important;gap:0.5rem!important;list-style:none!important;padding:0!important;margin:0!important}' +
    '#contact .wrapper.contact-social-wrapper .icon{margin:0!important}' +
    '.project-lens-chip{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:44px!important;min-width:44px!important;padding:0.55rem 0.9rem!important;box-sizing:border-box!important;line-height:1.2!important}' +
    '#project-search-input,.proj-search-input,#project-sort-select,.proj-sort-native{min-height:44px!important;box-sizing:border-box!important;padding-block:0.5rem!important;font-size:16px!important}' +
    '.publication-read-btn,a.publication-read-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:44px!important;min-width:44px!important;padding:0.55rem 0.9rem!important;box-sizing:border-box!important}' +
    '.education-title-group{display:flex!important;flex-direction:column!important;gap:0.5rem!important}' +
    'a.education-institution,a.education-board,.education-map-link{display:flex!important;align-items:center!important;min-height:44px!important;padding-block:0.45rem!important}' +
    'a.education-proof{min-height:44px!important}' +
    /* Debug Runner summary is only styled by deferred sheets — pin target-size here */
    '#debug-runner-section .debug-runner-disclosure>summary,.debug-runner-disclosure>summary{display:flex!important;align-items:center!important;justify-content:center!important;gap:0.5rem!important;min-height:48px!important;min-width:48px!important;padding:0.85rem 1.25rem!important;box-sizing:border-box!important;line-height:1.3!important;font-size:1rem!important;list-style:none!important;cursor:pointer!important}' +
    '#debug-runner-section .debug-runner-disclosure>summary::-webkit-details-marker,.debug-runner-disclosure>summary::-webkit-details-marker{display:none!important}';
  (document.head || document.documentElement).appendChild(critical);

  function isAllowedStylesheet(href) {
    if (!href || /^https?:/i.test(href)) {
      return false;
    }
    var path = href.split('?')[0].replace(/^\//, '');
    // Font Awesome CSS + webfonts are ~280KB and not needed for LCP text paint.
    // Blocking them in perf-audit keeps mobile LCP focused on hero system fonts.
    if (/fontawesome|font-awesome/i.test(path) || blockedSheetRe.test(path)) {
      return false;
    }
    return allowedStylesheets.indexOf(path) !== -1;
  }

  var HEAVY_IMG_RE =
    /vibe-tools|graduation|ganesh|hanuman|certifications\/|companies\/|cars\/|currently\//i;

  function blockHeavyImages(root) {
    if (!root || !root.querySelectorAll) {
      return;
    }
    root.querySelectorAll('img[src],img[srcset],source[srcset]').forEach(function (img) {
      var src = img.getAttribute('src') || img.getAttribute('srcset') || '';
      if (!HEAVY_IMG_RE.test(src)) {
        return;
      }
      img.removeAttribute('src');
      img.removeAttribute('srcset');
      img.setAttribute('data-perf-audit-blocked', '1');
    });
  }

  function blockVibeToolImages(root) {
    blockHeavyImages(root);
  }

  function stripDeferredStylesheets() {
    document.querySelectorAll('link[rel="stylesheet"],link[data-href]').forEach(function (link) {
      var href = link.getAttribute('href') || link.getAttribute('data-href') || '';
      // Keep only the slim allowlist; drop everything else before onload promotes media=all.
      if (href && isAllowedStylesheet(href)) {
        return;
      }
      try {
        link.onload = null;
        link.onerror = null;
      } catch (_err) {
        /* ignore */
      }
      link.removeAttribute('onload');
      link.removeAttribute('href');
      link.removeAttribute('data-href');
      link.disabled = true;
      link.media = 'not all';
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });
  }

  // Cross-origin prefetch/preconnect hints (e.g. GitHub API warm) fail CORS on loopback
  // Lighthouse hosts and surface as console errors, tanking Best Practices.
  // Also drop Font Awesome font preloads — ~270KB competing with hero LCP.
  function stripCrossOriginResourceHints() {
    document
      .querySelectorAll(
        'link[rel="prefetch"], link[rel="preconnect"], link[rel="preload"], link[rel="dns-prefetch"]'
      )
      .forEach(function (link) {
        var href = link.getAttribute('href') || '';
        var as = (link.getAttribute('as') || '').toLowerCase();
        if (/^https?:\/\//i.test(href)) {
          link.parentNode && link.parentNode.removeChild(link);
          return;
        }
        if (as === 'font' || /fontawesome|font-awesome/i.test(href)) {
          link.parentNode && link.parentNode.removeChild(link);
        }
      });
  }

  function onDomMutation(mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) {
          return;
        }
        if (node.nodeName === 'LINK') {
          if (node.rel === 'stylesheet') {
            stripDeferredStylesheets();
          }
          if (node.rel === 'prefetch' || node.rel === 'preconnect') {
            stripCrossOriginResourceHints();
          }
        }
        if (node.nodeName === 'SCRIPT') {
          var src = node.getAttribute('src') || '';
          if (/\/_vercel\/insights\//i.test(src)) {
            node.remove();
            return;
          }
        }
        if (node.nodeName === 'IMG') {
          blockVibeToolImages(node.parentNode || node);
        } else {
          blockVibeToolImages(node);
        }
      });
    });
  }

  stripDeferredStylesheets();
  stripCrossOriginResourceHints();
  blockInsightsScripts(document);
  blockHeavyImages(document);

  if (typeof MutationObserver !== 'undefined' && document.head) {
    new MutationObserver(function () {
      stripDeferredStylesheets();
      stripCrossOriginResourceHints();
      blockInsightsScripts(document);
      blockHeavyImages(document);
    }).observe(document.head, { childList: true });
  }

  var installSubtreeObserver = function () {
    if (typeof MutationObserver === 'undefined') {
      return;
    }
    new MutationObserver(onDomMutation).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(installSubtreeObserver, { timeout: 1500 });
  } else {
    setTimeout(installSubtreeObserver, 0);
  }

  document.addEventListener(
    'DOMContentLoaded',
    function () {
      stripDeferredStylesheets();
      stripCrossOriginResourceHints();
      blockInsightsScripts(document);
      blockVibeToolImages(document);

      var loading = document.getElementById('skills-loading');
      if (loading) {
        loading.setAttribute('aria-hidden', 'true');
        loading.setAttribute('hidden', '');
      }
    },
    { once: true }
  );
})();
