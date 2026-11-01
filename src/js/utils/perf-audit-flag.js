(function () {
  if (!/[?&]perf-audit=1(?:&|$)/.test(location.search)) {
    return;
  }
  document.documentElement.dataset.perfAudit = '1';
  window.__PERF_AUDIT__ = true;
})();
