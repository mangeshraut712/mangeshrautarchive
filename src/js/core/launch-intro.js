/** The greeting covers loading only; it never waits for the main application bundle. */
(function () {
  const intro = document.getElementById('launch-intro');
  if (!intro || intro.dataset.launchIntroBound === 'true') return;
  intro.dataset.launchIntroBound = 'true';

  const storageKey = 'portfolio-launch-intro-seen-v2026';
  if (
    window.__PERF_AUDIT__ ||
    (window.location.hash && window.location.hash !== '#home') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }
  try {
    if (sessionStorage.getItem(storageKey) === '1') return;
    sessionStorage.setItem(storageKey, '1');
  } catch {
    // A blocked preference store must not prevent the page from opening.
  }

  intro.hidden = false;
  intro.removeAttribute('aria-hidden');
  intro.classList.add('is-playing');

  let finished = false;
  let loadingTimer;
  const inputEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  const hide = () => {
    intro.hidden = true;
    intro.setAttribute('aria-hidden', 'true');
    intro.classList.remove('is-playing', 'is-exiting');
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(loadingTimer);
    intro.dataset.launchIntroComplete = 'true';
    intro.classList.add('is-exiting');
    document.removeEventListener('readystatechange', releaseReadyPage);
    inputEvents.forEach(name => window.removeEventListener(name, finish, true));
    // Retain the existing half-second fade, with no extra hold on ready content.
    window.setTimeout(hide, 500);
  };
  const releaseReadyPage = () => {
    if (document.readyState === 'loading') return;
    const portrait = document.getElementById('profile-image');
    if (!portrait || portrait.complete) {
      finish();
      return;
    }
    portrait.addEventListener('load', finish, { once: true });
    portrait.addEventListener('error', finish, { once: true });
  };

  // The original loading duration is a ceiling, including failed image downloads.
  loadingTimer = window.setTimeout(finish, 1800);
  inputEvents.forEach(name =>
    window.addEventListener(name, finish, { once: true, passive: true, capture: true })
  );
  document.addEventListener('readystatechange', releaseReadyPage);
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      finish();
      hide();
    }
  });
  releaseReadyPage();
})();
