(function () {
  if (window.__PERF_AUDIT__) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-HVKF4N150Y');

  let loaded = false;
  const loadGtag = () => {
    if (loaded) return;
    loaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-HVKF4N150Y';
    document.head.appendChild(script);
  };

  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, loadGtag, {
      once: true,
      passive: true,
      capture: true,
    });
  });
})();
