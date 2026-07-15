/**
 * Live Activity strip — disabled (hero chip cluttered layout / CSS).
 * Kept as a no-op module so bootstrap imports remain stable.
 */

function initLiveActivityStrip() {
  document.getElementById('live-activity-strip')?.remove();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLiveActivityStrip, { once: true });
} else {
  initLiveActivityStrip();
}

export default initLiveActivityStrip;
