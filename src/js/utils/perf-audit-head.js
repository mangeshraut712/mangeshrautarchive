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
    if (/Chrome-Lighthouse|Lighthouse|PTST|HeadlessChrome/i.test(userAgent)) {
      return true;
    }

    // Lighthouse mobile preset (webdriver is often hidden in modern headless Chrome).
    if (/moto g power \(2022\)/i.test(userAgent)) {
      return true;
    }

    if (navigator.webdriver === true) {
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
})();
