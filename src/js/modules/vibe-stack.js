/**
 * Vibe stack flyout — opens on Vibe Coder badge click.
 * Music-card style marquee; does not shift hero layout (fixed overlay).
 */
(function () {
  const vibeBadge = document.getElementById('vibe-coder-badge');
  const vibeFlyout = document.getElementById('vibe-stack-flyout');
  const badgeCluster = document.querySelector('.hero-badge-cluster');
  const vibeMarquee = vibeFlyout?.querySelector('.vibe-stack-marquee-track');

  if (!vibeBadge || !vibeFlyout) return;

  function syncMarqueeDuration() {
    if (!vibeMarquee) return;
    const distance = vibeMarquee.scrollWidth / 2;
    if (!distance) return;
    const duration = Math.max(24, distance / 22);
    vibeMarquee.style.setProperty('--vibe-marquee-distance', `-${distance}px`);
    vibeMarquee.style.setProperty('--vibe-marquee-duration', `${duration.toFixed(2)}s`);
  }

  function positionVibeFlyout() {
    globalThis.positionHeroFlyout?.({
      flyout: vibeFlyout,
      anchor: badgeCluster || vibeBadge,
      side: 'left',
    });
  }

  function setVibeStackOpen(isOpen) {
    vibeBadge.setAttribute('aria-expanded', String(isOpen));
    vibeBadge.classList.toggle('is-active', isOpen);
    vibeFlyout.hidden = !isOpen;
    vibeFlyout.classList.toggle('is-open', isOpen);

    if (isOpen) {
      requestAnimationFrame(() => {
        syncMarqueeDuration();
        positionVibeFlyout();
      });
      window.dispatchEvent(new CustomEvent('hero-flyout-open', { detail: { id: 'vibe' } }));
    } else {
      vibeFlyout.style.width = '';
      vibeFlyout.style.maxWidth = '';
      globalThis.clearHeroFlyoutLayout?.(vibeFlyout);
    }
  }

  vibeBadge.addEventListener('click', event => {
    event.stopPropagation();
    setVibeStackOpen(!vibeFlyout.classList.contains('is-open'));
  });

  vibeBadge.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setVibeStackOpen(false);
      vibeBadge.focus();
    }
  });

  document.addEventListener('click', event => {
    if (!vibeFlyout.classList.contains('is-open')) return;
    if (vibeFlyout.contains(event.target) || vibeBadge.contains(event.target)) return;
    setVibeStackOpen(false);
  });

  window.addEventListener('hero-flyout-open', event => {
    if (event.detail?.id !== 'vibe') {
      setVibeStackOpen(false);
    }
  });

  window.addEventListener('resize', () => {
    if (vibeFlyout.classList.contains('is-open')) {
      syncMarqueeDuration();
      positionVibeFlyout();
    }
  });

  let scrollTicking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (vibeFlyout.classList.contains('is-open')) {
        if (!scrollTicking) {
          scrollTicking = true;
          requestAnimationFrame(() => {
            positionVibeFlyout();
            scrollTicking = false;
          });
        }
      }
    },
    { passive: true }
  );

  window.addEventListener('vibe-stack-close', () => setVibeStackOpen(false));

  globalThis.vibeStack = { close: () => setVibeStackOpen(false) };
})();
