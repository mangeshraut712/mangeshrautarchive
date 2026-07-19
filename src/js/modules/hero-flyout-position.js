/**
 * Hero flyout placement — centered under badge cluster, occupying the music
 * card slot so nothing overlaps awkwardly on either side.
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
   * Place flyout centered under badges (or exactly over the music card).
   * Hides the music card while open so there is no side bleed / overlap.
   *
   * @param {object} options
   * @param {HTMLElement} options.flyout
   * @param {HTMLElement} options.anchor
   * @param {'left' | 'right' | 'center'} [options.side]
   */
  function positionHeroFlyout({ flyout, anchor, side: _side = 'center' }) {
    if (!flyout || !anchor) return;

    flyout.style.position = 'fixed';
    flyout.style.right = '';
    flyout.style.bottom = '';

    const badgeRect = anchor.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const slot = getMusicSlotRect();
    const isReach = flyout.id === 'reach-flyout';

    // Prefer music-card geometry: same width + horizontal alignment as the card.
    // Fall back to badge-centered placement when the music card is not laid out.
    let left;
    let top;
    let width;

    if (slot && slot.width > 160 && slot.height > 40) {
      flyout.classList.add('hero-flyout--music-slot');
      setMusicSlotHidden(true);

      // Match music card width + left exactly so there is no side gap or bleed.
      width = Math.round(slot.width);
      left = Math.round(slot.left);
      top = Math.round(slot.top);
    } else {
      // No music card — center under badges.
      flyout.classList.remove('hero-flyout--music-slot');
      setMusicSlotHidden(false);

      width = isReach
        ? clamp(Math.min(360, viewportW - MARGIN * 2), 280, 380)
        : clamp(Math.min(Math.max(badgeRect.width + 80, 300), viewportW - MARGIN * 2), 260, 420);

      left = Math.round(badgeRect.left + badgeRect.width / 2 - width / 2);
      left = clamp(left, MARGIN, viewportW - width - MARGIN);
      top = Math.round(badgeRect.bottom + GAP);
    }

    // Keep fully on-screen horizontally
    left = clamp(left, MARGIN, Math.max(MARGIN, viewportW - width - MARGIN));

    flyout.style.width = `${width}px`;
    flyout.style.maxWidth = `${Math.min(width, viewportW - MARGIN * 2)}px`;
    flyout.style.left = `${left}px`;
    flyout.style.top = `${top}px`;

    // Tall reach panel: stay in the music slot and scroll inside — never jump above.
    // Short vibe marquee: only flip above if it would clip the bottom edge.
    const maxHeight = Math.max(140, viewportH - MARGIN - top);
    if (isReach) {
      flyout.style.maxHeight = `${Math.round(maxHeight)}px`;
      flyout.style.overflow = 'auto';
      // Always open on Active Users (top), never a mid-panel scroll restore.
      flyout.scrollTop = 0;
      const reachPanel = flyout.querySelector('.portfolio-reach-panel');
      if (reachPanel) reachPanel.scrollTop = 0;
      // Keep music covered for the full open duration
      if (slot) {
        flyout.classList.add('hero-flyout--music-slot');
        setMusicSlotHidden(true);
      }
    } else {
      const panelHeight = flyout.offsetHeight || 80;
      if (top + panelHeight > viewportH - MARGIN) {
        const above = Math.round(badgeRect.top - panelHeight - GAP);
        if (above >= MARGIN) {
          top = above;
          flyout.style.top = `${top}px`;
          setMusicSlotHidden(false);
          flyout.classList.remove('hero-flyout--music-slot');
        }
      }
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
    // Only unhide music if no other hero flyout is open
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
