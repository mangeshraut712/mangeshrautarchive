/**
 * Experience timeline — Apple-style disclosure for long bullet lists only.
 *
 * IMPORTANT: Never hide entire .experience-content cards.
 * Hiding whole cards on lazy module load caused blank sections when scrolling
 * (layout collapse 4kpx → 1.7kpx as cards vanished).
 *
 * Pattern: always show role / company / dates; optional "Show details" for long lists.
 */

function initExperienceInteractivity() {
  const section = document.getElementById('experience');
  if (!section || section.dataset.experienceInteractive === 'true') {
    return;
  }
  section.dataset.experienceInteractive = 'true';

  section.querySelectorAll('.experience-item').forEach((item, index) => {
    const content = item.querySelector('.experience-content');
    if (!content) return;

    // Always visible card chrome
    content.hidden = false;
    content.removeAttribute('hidden');
    item.classList.add('is-expanded');

    const list = content.querySelector('ul');
    if (!list) return;

    const items = list.querySelectorAll(':scope > li');
    // Only disclose when there are many bullets (avoid noise on short roles)
    if (items.length <= 3) return;

    const detailsId = `experience-details-${index}`;
    list.id = list.id || detailsId;

    // Default open for first role, open for others too (content-first — never blank).
    // Users can collapse long lists after reading.
    const header =
      item.querySelector('.experience-header') || content.querySelector('h3')?.parentElement;
    if (!header || header.querySelector('.experience-disclosure')) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'experience-disclosure';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-controls', list.id);
    const roleLabel =
      content.querySelector('h3')?.textContent?.trim() ||
      item.querySelector('h3')?.textContent?.trim() ||
      `role ${index + 1}`;

    toggle.innerHTML =
      '<span class="experience-disclosure__label">Hide details</span>' +
      '<i class="fas fa-chevron-up" aria-hidden="true"></i>';
    toggle.setAttribute('aria-label', `Hide details, ${roleLabel}`);

    header.appendChild(toggle);

    const setOpen = open => {
      list.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      item.classList.toggle('is-expanded', open);
      const label = toggle.querySelector('.experience-disclosure__label');
      const icon = toggle.querySelector('i');
      if (label) {
        label.textContent = open ? 'Hide details' : 'Show details';
      }
      if (icon) {
        icon.className = open ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
      }
      toggle.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} details, ${roleLabel}`);
    };

    toggle.addEventListener('click', event => {
      event.preventDefault();
      setOpen(list.hidden);
    });

    setOpen(true);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExperienceInteractivity, { once: true });
} else {
  initExperienceInteractivity();
}

export default initExperienceInteractivity;
