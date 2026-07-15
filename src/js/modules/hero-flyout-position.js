/**
 * Hero flyout placement — anchor under badge cluster (stable), never jump
 * to music-card edge or off-screen "somewhere else".
 */
(function () {
  const DESKTOP_MQ = '(min-width: 901px)';
  const MUSIC_SLOT_SELECTOR = '#music-card';
  const FLYOUT_IDS = ['vibe-stack-flyout', 'reach-flyout'];

  function portalFlyoutsToBody() {
    FLYOUT_IDS.forEach(id => {
      const flyout = document.getElementById(id);
      if (flyout && flyout.parentElement !== document.body) {
        document.body.appendChild(flyout);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', portalFlyoutsToBody, { once: true });
  } else {
    portalFlyoutsToBody();
  }

  function isDesktop() {
    return window.matchMedia(DESKTOP_MQ).matches;
  }

  function getMusicSlotRect() {
    return document.querySelector(MUSIC_SLOT_SELECTOR)?.getBoundingClientRect() || null;
  }

  function setMusicSlotHidden(hidden) {
    document.querySelector(MUSIC_SLOT_SELECTOR)?.classList.toggle('is-flyout-covered', hidden);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  /**
   * @param {object} options
   * @param {HTMLElement} options.flyout
   * @param {HTMLElement} options.anchor
   * @param {'left' | 'right'} options.side  preferred horizontal bias
   */
  function positionHeroFlyout({ flyout, anchor, side }) {
    if (!flyout || !anchor) return;

    flyout.classList.remove('hero-flyout--music-slot');
    flyout.style.position = 'fixed';
    flyout.style.right = '';
    flyout.style.bottom = '';

    const margin = 14;
    const gap = 10;
    const badgeRect = anchor.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Preferred width by flyout type
    const preferredWidth =
      flyout.id === 'reach-flyout'
        ? clamp(Math.min(360, viewportW - margin * 2), 280, 380)
        : clamp(Math.min(320, viewportW - margin * 2), 260, 340);

    flyout.style.width = `${preferredWidth}px`;
    flyout.style.maxWidth = `${Math.min(preferredWidth, viewportW - margin * 2)}px`;

    // Measure after width applied
    const panelWidth = flyout.offsetWidth || preferredWidth;
    const panelHeight = flyout.offsetHeight || (flyout.id === 'reach-flyout' ? 420 : 90);

    let left;
    let top;

    if (!isDesktop()) {
      // Mobile: dock under badges, full-ish width, or music slot if available
      const slot = getMusicSlotRect();
      flyout.classList.add('hero-flyout--music-slot');

      if (slot && slot.width > 180) {
        const width = Math.round(slot.width);
        left = Math.round(clamp(slot.left, margin, viewportW - width - margin));
        top = Math.round(slot.top);
        flyout.style.width = `${width}px`;
        flyout.style.maxWidth = `${width}px`;
        setMusicSlotHidden(true);
      } else {
        setMusicSlotHidden(false);
        left = Math.round(badgeRect.left + badgeRect.width / 2 - panelWidth / 2);
        left = clamp(left, margin, viewportW - panelWidth - margin);
        top = Math.round(badgeRect.bottom + gap);
        if (top + panelHeight > viewportH - margin) {
          top = Math.max(margin, Math.round(badgeRect.top - panelHeight - gap));
        }
      }

      flyout.style.left = `${left}px`;
      flyout.style.top = `${top}px`;
      flyout.style.maxHeight = `${Math.max(120, viewportH - top - margin)}px`;
      flyout.style.overflow = flyout.id === 'vibe-stack-flyout' ? 'visible' : 'auto';
      return;
    }

    setMusicSlotHidden(false);

    // Desktop: always hug the badge cluster — open just under it.
    // Horizontal bias only; never teleport to music-card edge.
    const centerX = badgeRect.left + badgeRect.width / 2;
    if (side === 'left') {
      left = centerX - panelWidth + badgeRect.width * 0.15;
    } else {
      left = centerX - badgeRect.width * 0.15;
    }

    top = badgeRect.bottom + gap;

    // If not enough space below, flip above the badges
    if (top + Math.min(panelHeight, 280) > viewportH - margin) {
      top = Math.max(margin, badgeRect.top - Math.min(panelHeight, 280) - gap);
    }

    // Clamp horizontally into viewport only
    left = clamp(left, margin, viewportW - panelWidth - margin);

    flyout.style.left = `${Math.round(left)}px`;
    flyout.style.top = `${Math.round(top)}px`;

    const maxHeight = Math.max(120, viewportH - margin - top);
    if (flyout.id === 'vibe-stack-flyout') {
      flyout.style.maxHeight = '';
      flyout.style.overflow = 'visible';
    } else {
      flyout.style.maxHeight = `${Math.round(maxHeight)}px`;
      flyout.style.overflow = 'auto';
    }
  }

  function clearFlyoutLayout(flyout) {
    if (!flyout) return;
    flyout.style.width = '';
    flyout.style.maxWidth = '';
    flyout.style.maxHeight = '';
    flyout.style.overflow = '';
    flyout.style.left = '';
    flyout.style.top = '';
    flyout.style.right = '';
    flyout.style.bottom = '';
    flyout.style.position = '';
    flyout.classList.remove('hero-flyout--music-slot');
    setMusicSlotHidden(false);
  }

  globalThis.positionHeroFlyout = positionHeroFlyout;
  globalThis.clearHeroFlyoutLayout = clearFlyoutLayout;
})();
