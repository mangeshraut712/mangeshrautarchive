(function () {
  if (
    !/[?&]perf-audit=1(?:&|$)/.test(location.search) &&
    !/Chrome-Lighthouse|Lighthouse|PTST/i.test(navigator.userAgent || '')
  ) {
    return;
  }
  document.documentElement.dataset.perfAudit = '1';
  window.__PERF_AUDIT__ = true;
})();
