/**
 * Hero flyout placement — restored card widths, centered under badges.
 * Vertically docks to the music-card row when present; never inherits its
 * compact pill width.
 */
(function () {
  const MUSIC_SLOT_SELECTOR = '#music-card';
  const FLYOUT_IDS = ['vibe-stack-flyout', 'reach-flyout'];
  const GAP = 10;
  const MARGIN = 14;

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
   * @param {'left' | 'right' | 'center'} [options.side]
   */
  function positionHeroFlyout({ flyout, anchor, side = 'center' }) {
    if (!flyout || !anchor) return;

    flyout.style.position = 'fixed';
    flyout.style.right = '';
    flyout.style.bottom = '';

    const badgeRect = anchor.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const slot = getMusicSlotRect();
    const isReach = flyout.id === 'reach-flyout';
    const hasMusicSlot = Boolean(slot && slot.width > 40 && slot.height > 24);

    // Restored card widths (do not match the compact ~200px music pill).
    const width = isReach
      ? clamp(Math.min(360, viewportW - MARGIN * 2), 300, 380)
      : clamp(Math.min(Math.max(badgeRect.width + 100, 340), viewportW - MARGIN * 2), 300, 440);

    flyout.style.width = `${width}px`;
    flyout.style.maxWidth = `${Math.min(width, viewportW - MARGIN * 2)}px`;

    const panelWidth = flyout.offsetWidth || width;
    const panelHeight = flyout.offsetHeight || (isReach ? 360 : 90);
    const centerX = badgeRect.left + badgeRect.width / 2;

    let left;
    if (side === 'left') {
      left = centerX - panelWidth + badgeRect.width * 0.2;
    } else if (side === 'right') {
      left = centerX - badgeRect.width * 0.2;
    } else {
      left = centerX - panelWidth / 2;
    }
    left = clamp(Math.round(left), MARGIN, Math.max(MARGIN, viewportW - panelWidth - MARGIN));

    // Prefer the music-card vertical row so placement matches the hero band.
    let top;
    if (hasMusicSlot) {
      top = Math.round(slot.top);
      flyout.classList.add('hero-flyout--music-slot');
      setMusicSlotHidden(true);
    } else {
      top = Math.round(badgeRect.bottom + GAP);
      flyout.classList.remove('hero-flyout--music-slot');
      setMusicSlotHidden(false);
    }

    // Keep on-screen; flip vibe above only when music slot is unavailable.
    if (!hasMusicSlot && top + Math.min(panelHeight, isReach ? 280 : 100) > viewportH - MARGIN) {
      const above = Math.round(badgeRect.top - Math.min(panelHeight, isReach ? 280 : 100) - GAP);
      if (above >= MARGIN) {
        top = above;
      }
    }

    top = clamp(top, MARGIN, Math.max(MARGIN, viewportH - 120));

    flyout.style.left = `${left}px`;
    flyout.style.top = `${top}px`;

    const maxHeight = Math.max(140, viewportH - MARGIN - top);
    if (isReach) {
      flyout.style.maxHeight = `${Math.round(maxHeight)}px`;
      flyout.style.overflow = 'auto';
      flyout.scrollTop = 0;
      const reachPanel = flyout.querySelector('.portfolio-reach-panel');
      if (reachPanel) reachPanel.scrollTop = 0;
    } else {
      flyout.style.maxHeight = '';
      flyout.style.overflow = 'visible';
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
    const otherOpen = FLYOUT_IDS.some(id => {
      if (flyout.id && id === flyout.id) return false;
      const el = document.getElementById(id);
      return el?.classList.contains('is-open');
    });
    if (!otherOpen) {
      setMusicSlotHidden(false);
    }
  }

  globalThis.positionHeroFlyout = positionHeroFlyout;
  globalThis.clearHeroFlyoutLayout = clearFlyoutLayout;
})();
