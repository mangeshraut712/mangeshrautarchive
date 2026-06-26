/** Quick Look modal for project cards — Apple Quick Look pattern. */

function buildQuickLook() {
  let dialog = document.getElementById('quick-look-dialog');
  if (dialog) return dialog;

  dialog = document.createElement('dialog');
  dialog.id = 'quick-look-dialog';
  dialog.className = 'quick-look-dialog';
  dialog.innerHTML = `
    <div class="quick-look-dialog__sheet lg-glass-card">
      <button type="button" class="quick-look-dialog__close" aria-label="Close preview"><i class="fas fa-xmark"></i></button>
      <div class="quick-look-dialog__body"></div>
      <div class="quick-look-dialog__actions"></div>
    </div>`;
  document.body.appendChild(dialog);

  dialog
    .querySelector('.quick-look-dialog__close')
    ?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  return dialog;
}

function openQuickLook(card) {
  const dialog = buildQuickLook();
  const title =
    card.querySelector('h3, .project-title, .showcase-project-title')?.textContent?.trim() ||
    'Project';
  const description =
    card.querySelector('p, .project-description')?.textContent?.trim() ||
    'Open the full project for details.';
  const links = Array.from(card.querySelectorAll('a[href]')).slice(0, 3);

  dialog.querySelector('.quick-look-dialog__body').innerHTML = `
    <p class="quick-look-dialog__eyebrow">Quick Look</p>
    <h2 class="quick-look-dialog__title">${title}</h2>
    <p class="quick-look-dialog__description">${description}</p>`;

  const actions = dialog.querySelector('.quick-look-dialog__actions');
  actions.innerHTML = links
    .map(
      link =>
        `<a class="quick-look-dialog__action" href="${link.href}" target="_blank" rel="noopener noreferrer">${link.textContent.trim()}</a>`
    )
    .join('');

  dialog.showModal();
}

function initQuickLook() {
  const container =
    document.getElementById('github-projects-container') || document.getElementById('projects');
  if (!container || container.dataset.quickLookInit === 'true') return;
  container.dataset.quickLookInit = 'true';

  container.addEventListener('click', event => {
    const card = event.target.closest?.('.showcase-project-card, .project-card');
    if (!card || event.target.closest('a, button')) return;
    event.preventDefault();
    openQuickLook(card);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuickLook, { once: true });
} else {
  initQuickLook();
}

export default initQuickLook;
