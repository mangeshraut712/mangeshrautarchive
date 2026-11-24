/** Pause controls for continuous discovery rails, including touch screens. */
export function initMarqueeControls(root = document) {
  root
    .querySelectorAll('.skill-scroll-container, .dream-companies-marquee, .dream-cars-marquee')
    .forEach(rail => {
      if (rail.dataset.motionReady) return;
      rail.dataset.motionReady = 'true';
      const track = rail.firstElementChild;
      const control = document.createElement('button');
      control.type = 'button';
      control.className = 'marquee-pause';
      control.textContent = 'Pause scrolling';
      control.setAttribute('aria-pressed', 'false');
      control.addEventListener('click', () => {
        const paused = control.getAttribute('aria-pressed') !== 'true';
        control.setAttribute('aria-pressed', String(paused));
        control.textContent = paused ? 'Resume scrolling' : 'Pause scrolling';
        track.classList.toggle('is-user-paused', paused);
      });
      rail.after(control);
      if (!rail.classList.contains('skill-scroll-container')) {
        const items = [...track.children];
        items.slice(items.length / 2).forEach(item => item.setAttribute('aria-hidden', 'true'));
      }
    });
}
