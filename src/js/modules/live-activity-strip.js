/** Live Activity strip — compact status chip below hero (Apple Live Activity style). */

const MESSAGES = [
  { label: 'Building', detail: 'Portfolio · WWDC26 liquid glass', icon: 'fa-hammer' },
  { label: 'Open to roles', detail: 'Software Engineer · AI/Full-stack', icon: 'fa-briefcase' },
  { label: 'Writing', detail: 'Technical articles on AI & systems', icon: 'fa-pen' },
];

function initLiveActivityStrip() {
  const home = document.getElementById('home');
  if (!home || document.getElementById('live-activity-strip')) return;

  const strip = document.createElement('div');
  strip.id = 'live-activity-strip';
  strip.className = 'live-activity-strip lg-glass-card';
  strip.setAttribute('role', 'status');
  strip.setAttribute('aria-live', 'polite');

  let index = 0;
  const render = () => {
    const item = MESSAGES[index % MESSAGES.length];
    strip.innerHTML = `
      <span class="live-activity-strip__pulse" aria-hidden="true"></span>
      <i class="fas ${item.icon} live-activity-strip__icon" aria-hidden="true"></i>
      <span class="live-activity-strip__label">${item.label}</span>
      <span class="live-activity-strip__detail">${item.detail}</span>`;
    index += 1;
  };

  render();
  const anchor = home.querySelector('.hero-actions') || home.querySelector('.hero-footer');
  anchor?.insertAdjacentElement('afterend', strip);
  window.setInterval(render, 12000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLiveActivityStrip, { once: true });
} else {
  initLiveActivityStrip();
}

export default initLiveActivityStrip;
