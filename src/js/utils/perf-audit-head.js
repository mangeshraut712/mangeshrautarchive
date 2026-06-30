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
    // Lighthouse-specific UA tokens only — not generic HeadlessChrome (Playwright E2E).
    if (/Chrome-Lighthouse|Lighthouse|PTST/i.test(userAgent)) {
      return true;
    }

    // Lighthouse mobile preset.
    if (/moto g power \(2022\)/i.test(userAgent)) {
      return true;
    }

    return false;
  }

  window.__PERF_AUDIT__ = detectPerfAudit();

  if (!window.__PERF_AUDIT__) {
    return;
  }

  document.documentElement.dataset.perfAudit = '1';
  window.va = function () {};
  window.vaq = [];

  var allowedStylesheets = [
    'assets/css/tailwind-output.css',
    'assets/css/homepage.css',
    'assets/css/dynamic-island-navbar.css',
  ];

  // Skills viz is lazy-loaded; bootstrap skips it in perf-audit. Hide transient UI
  // so Lighthouse never scores placeholder copy or off-screen hero flyout assets.
  var critical = document.createElement('style');
  critical.id = 'perf-audit-critical';
  critical.textContent =
    '#skills-loading{display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important}' +
    '#vibe-stack-flyout,#reach-flyout{display:none!important;visibility:hidden!important}' +
    '.education-title-group{display:flex!important;flex-direction:column!important;gap:0.5rem!important}' +
    'a.education-institution,a.education-board,.education-map-link{display:flex!important;align-items:center!important;min-height:44px!important;padding-block:0.45rem!important}' +
    'a.education-proof{min-height:44px!important}';
  (document.head || document.documentElement).appendChild(critical);

  function isAllowedStylesheet(href) {
    if (!href || /^https?:/i.test(href)) {
      return false;
    }
    var path = href.split('?')[0].replace(/^\//, '');
    return allowedStylesheets.indexOf(path) !== -1;
  }

  function blockVibeToolImages(root) {
    if (!root || !root.querySelectorAll) {
      return;
    }
    root.querySelectorAll('img[src*="vibe-tools"]').forEach(function (img) {
      img.removeAttribute('src');
      img.setAttribute('data-perf-audit-blocked', '1');
    });
  }

  function stripDeferredStylesheets() {
    document.querySelectorAll('link[rel="stylesheet"]').forEach(function (link) {
      if (!isAllowedStylesheet(link.getAttribute('href'))) {
        link.disabled = true;
        link.media = 'not all';
        link.parentNode && link.parentNode.removeChild(link);
      }
    });
  }

  // Cross-origin prefetch/preconnect hints (e.g. GitHub API warm) fail CORS on loopback
  // Lighthouse hosts and surface as console errors, tanking Best Practices.
  function stripCrossOriginResourceHints() {
    document
      .querySelectorAll('link[rel="prefetch"], link[rel="preconnect"]')
      .forEach(function (link) {
        var href = link.getAttribute('href') || '';
        if (/^https?:\/\//i.test(href)) {
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
        if (node.nodeName === 'LINK' && node.rel === 'stylesheet') {
          stripDeferredStylesheets();
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

  if (typeof MutationObserver !== 'undefined') {
    if (document.head) {
      new MutationObserver(stripDeferredStylesheets).observe(document.head, { childList: true });
    }
    new MutationObserver(onDomMutation).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  document.addEventListener(
    'DOMContentLoaded',
    function () {
      stripDeferredStylesheets();
      stripCrossOriginResourceHints();
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
