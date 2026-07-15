/**
 * Awards layout helper.
 * Previously rewrote the awards grid into an Apple TV-style horizontal shelf,
 * but no companion CSS shipped — cards stacked incorrectly on desktop.
 * Keep a no-op init so bootstrap imports stay valid; layout is pure CSS grid
 * in awards.css (2 columns ≥768px, 1 column on small screens).
 */

function initAwardsShelf() {
  const section = document.getElementById('awards');
  if (!section || section.dataset.shelfInit === 'true') return;

  const grid = section.querySelector('.awards-grid');
  if (!grid) return;

  section.dataset.shelfInit = 'true';
  // Ensure grid is not stuck with shelf track leftovers from older builds
  grid.classList.remove('awards-shelf');
  const track = grid.querySelector('.awards-shelf__track');
  if (track) {
    const cards = [...track.querySelectorAll('.award-card')];
    track.remove();
    cards.forEach(card => {
      card.classList.remove('awards-shelf__card');
      card.removeAttribute('role');
      grid.appendChild(card);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAwardsShelf, { once: true });
} else {
  initAwardsShelf();
}

export default initAwardsShelf;
