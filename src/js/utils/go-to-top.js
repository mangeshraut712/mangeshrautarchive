!(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    const o = document.getElementById('go-to-top');
    function t() {
      (window.pageYOffset || document.documentElement.scrollTop) > 300
        ? o.classList.add('visible')
        : o.classList.remove('visible');
    }
    o
      ? (window.addEventListener('scroll', t, { passive: !0 }),
        o.addEventListener('click', function (o) {
          o.preventDefault();
          const t = { top: 0, behavior: 'smooth' };
          (window.scrollTo(t),
            document.documentElement.scrollTo(t),
            document.body.scrollTo(t),
            document.body.focus());
        }),
        t(),
        console.log('✅ Go to Top button initialized'))
      : console.warn('Go to Top button not found');
  });
})();
