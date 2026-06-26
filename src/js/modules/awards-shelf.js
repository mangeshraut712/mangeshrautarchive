/** Horizontal award shelf — Apple TV-style carousel for honors cards. */

function initAwardsShelf() {
  const section = document.getElementById('awards');
  if (!section || section.dataset.shelfInit === 'true') return;

  const grid = section.querySelector('.grid, .awards-grid, .container > div');
  const cards = section.querySelectorAll('.award-card');
  if (!cards.length || !grid) return;

  section.dataset.shelfInit = 'true';
  grid.classList.add('awards-shelf');

  const track = document.createElement('div');
  track.className = 'awards-shelf__track';
  track.setAttribute('role', 'list');

  cards.forEach(card => {
    card.classList.add('awards-shelf__card');
    card.setAttribute('role', 'listitem');
    track.appendChild(card);
  });

  grid.replaceChildren(track);

  let scrollTimer = 0;
  track.addEventListener(
    'scroll',
    () => {
      track.classList.add('is-scrolling');
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => track.classList.remove('is-scrolling'), 600);
    },
    { passive: true }
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAwardsShelf, { once: true });
} else {
  initAwardsShelf();
}

export default initAwardsShelf;
