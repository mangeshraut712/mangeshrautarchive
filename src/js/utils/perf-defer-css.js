(function () {
  if (document.documentElement.dataset.perfAudit === '1') {
    document.querySelectorAll('link[data-perf-defer]').forEach(link => {
      link.remove();
    });
    return;
  }

  document.querySelectorAll('link[data-perf-defer]:not([media])').forEach(link => {
    link.media = 'all';
  });
})();
