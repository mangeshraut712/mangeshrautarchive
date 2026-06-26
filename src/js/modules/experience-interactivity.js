/** Expand/collapse experience timeline cards — Apple-style disclosure. */

function initExperienceInteractivity() {
  const section = document.getElementById('experience');
  if (!section) return;

  section.querySelectorAll('.experience-item').forEach((item, index) => {
    const content = item.querySelector('.experience-content');
    if (!content) return;

    const header =
      item.querySelector('.experience-header') || content.querySelector('h3')?.parentElement;
    if (!header) return;

    const detailsId = `experience-details-${index}`;
    content.id = content.id || detailsId;
    content.hidden = index > 0;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'experience-disclosure';
    toggle.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
    toggle.setAttribute('aria-controls', content.id);
    toggle.innerHTML =
      '<span class="experience-disclosure__label">Details</span><i class="fas fa-chevron-down" aria-hidden="true"></i>';

    header.appendChild(toggle);

    const setOpen = open => {
      content.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      item.classList.toggle('is-expanded', open);
    };

    toggle.addEventListener('click', () => setOpen(content.hidden));
    setOpen(index === 0);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExperienceInteractivity, { once: true });
} else {
  initExperienceInteractivity();
}

export default initExperienceInteractivity;
