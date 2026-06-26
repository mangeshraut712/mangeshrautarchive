/**
 * Hero flyout placement — desktop: hug badges in free side space;
 * mobile: dock in the music-card slot with matching width.
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
   * @param {'left' | 'right'} options.side
   */
  function positionHeroFlyout({ flyout, anchor, side }) {
    if (!flyout || !anchor) return;

    flyout.classList.remove('hero-flyout--music-slot');

    if (!isDesktop()) {
      const slot = getMusicSlotRect();
      const margin = 12;

      flyout.style.position = 'fixed';
      flyout.classList.add('hero-flyout--music-slot');

      if (slot) {
        const width = Math.round(slot.width);
        const left = Math.round(clamp(slot.left, margin, window.innerWidth - width - margin));
        const top = Math.round(slot.top);

        flyout.style.width = `${width}px`;
        flyout.style.maxWidth = `${width}px`;
        flyout.style.left = `${left}px`;
        flyout.style.top = `${top}px`;
        setMusicSlotHidden(true);
        return;
      }

      flyout.style.width = '';
      flyout.style.maxWidth = '';

      const badgeRect = anchor.getBoundingClientRect();
      const panelWidth = flyout.offsetWidth || Math.min(360, window.innerWidth - margin * 2);
      const panelHeight = flyout.offsetHeight || 120;
      const gap = 10;

      let top = badgeRect.bottom + gap;
      let left = badgeRect.left + badgeRect.width / 2 - panelWidth / 2;

      left = clamp(left, margin, window.innerWidth - panelWidth - margin);

      if (top + panelHeight > window.innerHeight - margin) {
        top = Math.max(margin, badgeRect.top - panelHeight - gap);
      }

      flyout.style.top = `${Math.round(top)}px`;
      flyout.style.left = `${Math.round(left)}px`;
      setMusicSlotHidden(false);
      return;
    }

    setMusicSlotHidden(false);

    const badgeRect = anchor.getBoundingClientRect();
    const margin = 14;
    const gap = 10;
    const musicRect = getMusicSlotRect();

    flyout.style.position = 'fixed';

    let width;
    let left;

    if (side === 'left') {
      const available = badgeRect.left - margin - gap;
      width = clamp(Math.floor(available), 260, 400);
      left = badgeRect.left - gap - width;
      left = Math.max(margin, left);
      width = badgeRect.left - gap - left;

      if (musicRect) {
        const maxRight = musicRect.left - gap;
        if (left + width > maxRight) {
          width = Math.max(240, maxRight - left);
        }
      }
    } else {
      left = badgeRect.right + gap;

      if (musicRect && musicRect.top < badgeRect.bottom + 220) {
        left = Math.max(left, musicRect.right + gap);
      }

      const available = window.innerWidth - margin - left;
      width = clamp(Math.floor(available), 220, 360);
    }

    flyout.style.width = `${width}px`;
    flyout.style.maxWidth = `${width}px`;

    const panelHeight = flyout.offsetHeight || 120;
    let top = badgeRect.top;

    const viewportBottom = window.innerHeight - margin;

    if (top + panelHeight > viewportBottom) {
      top = Math.max(margin, viewportBottom - panelHeight);
    }

    flyout.style.top = `${Math.round(top)}px`;
    flyout.style.left = `${Math.round(left)}px`;

    const maxHeight = Math.max(120, viewportBottom - top);
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
    flyout.style.position = '';
    flyout.classList.remove('hero-flyout--music-slot');
    setMusicSlotHidden(false);
  }

  globalThis.positionHeroFlyout = positionHeroFlyout;
  globalThis.clearHeroFlyoutLayout = clearFlyoutLayout;
})();
