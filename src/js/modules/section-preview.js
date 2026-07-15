/**
 * Apple-style progressive disclosure for dense portfolio sections.
 *
 * Markup:
 *   <div
 *     data-section-preview
 *     data-preview-limit="3"
 *     data-preview-item=".certification-card"
 *     data-preview-more="View more"
 *     data-preview-less="Show less"
 *     data-preview-label="certifications"
 *   >…items…</div>
 *
 * CSS partner: [data-section-preview]:not(.is-expanded) .is-preview-hidden { display: none }
 * Prefer class-based hide (not opacity) so layout stays tight without blank gaps.
 */

const BOUND = 'previewBound';

function parseLimit(value, fallback = 3) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function getItems(container) {
  const selector = container.getAttribute('data-preview-item')?.trim();
  if (selector) {
    return Array.from(container.querySelectorAll(selector)).filter(
      el => el.parentElement === container || container.contains(el)
    );
  }
  return Array.from(container.children).filter(
    el =>
      el.nodeType === 1 &&
      !el.classList.contains('section-preview-actions') &&
      !el.matches?.('.timeline-section-header')
  );
}

/**
 * When timeline headers sit above groups of items, hide a header if every
 * following item until the next header is preview-hidden.
 */
function syncTimelineHeaders(container, items, expanded) {
  const headers = Array.from(container.querySelectorAll('.timeline-section-header'));
  if (!headers.length) return;

  headers.forEach(header => {
    let sibling = header.nextElementSibling;
    let visibleCount = 0;
    let totalItems = 0;
    while (sibling && !sibling.classList.contains('timeline-section-header')) {
      if (items.includes(sibling) || sibling.matches?.('.experience-item, .education-item')) {
        totalItems += 1;
        if (expanded || !sibling.classList.contains('is-preview-hidden')) {
          visibleCount += 1;
        }
      }
      sibling = sibling.nextElementSibling;
    }
    const hideHeader = !expanded && totalItems > 0 && visibleCount === 0;
    header.classList.toggle('is-preview-hidden', hideHeader);
    header.hidden = hideHeader;
  });
}

function ensureActions(container) {
  let actions = container.parentElement?.querySelector(
    `:scope > .section-preview-actions[data-preview-for="${container.id || ''}"]`
  );
  if (!actions) {
    actions = container.nextElementSibling;
    if (!actions?.classList?.contains('section-preview-actions')) {
      actions = document.createElement('div');
      actions.className = 'section-preview-actions';
      container.insertAdjacentElement('afterend', actions);
    }
  }
  if (container.id) {
    actions.dataset.previewFor = container.id;
  }

  let button = actions.querySelector('.section-preview-btn');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'section-preview-btn';
    actions.appendChild(button);
  }
  return { actions, button };
}

function applyPreview(container) {
  const limit = parseLimit(container.getAttribute('data-preview-limit'), 3);
  const items = getItems(container);
  const excess = Math.max(0, items.length - limit);
  const expanded = container.classList.contains('is-expanded');
  const moreLabel = container.getAttribute('data-preview-more') || 'View more';
  const lessLabel = container.getAttribute('data-preview-less') || 'Show less';
  const noun = container.getAttribute('data-preview-label') || 'items';

  items.forEach((item, index) => {
    const hide = !expanded && index >= limit;
    item.classList.toggle('is-preview-hidden', hide);
    if (hide) {
      item.setAttribute('aria-hidden', 'true');
    } else {
      item.removeAttribute('aria-hidden');
    }
  });

  syncTimelineHeaders(container, items, expanded);

  const { actions, button } = ensureActions(container);

  // Empty (e.g. blog still loading) or fully within limit — no chrome
  if (items.length === 0 || excess === 0) {
    actions.hidden = true;
    return;
  }

  actions.hidden = false;
  const remaining = excess;
  button.textContent = expanded ? lessLabel : `${moreLabel} (${remaining})`;
  button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  button.setAttribute(
    'aria-label',
    expanded ? `${lessLabel}, ${noun}` : `View ${remaining} more ${noun}`
  );

  if (button.dataset.previewWired !== 'true') {
    button.dataset.previewWired = 'true';
    button.addEventListener('click', () => {
      const next = !container.classList.contains('is-expanded');
      container.classList.toggle('is-expanded', next);
      applyPreview(container);
      if (!next) {
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
}

/**
 * Initialize all preview regions under root.
 * @param {ParentNode} [root=document]
 */
export function initSectionPreviews(root = document) {
  const regions = root.querySelectorAll ? root.querySelectorAll('[data-section-preview]') : [];
  regions.forEach(container => {
    if (!(container instanceof HTMLElement)) return;
    if (container.dataset[BOUND] === 'true') {
      applyPreview(container);
      return;
    }
    container.dataset[BOUND] = 'true';
    // Start collapsed unless author forced expanded
    if (!container.classList.contains('is-expanded') && container.classList.contains('expanded')) {
      container.classList.remove('expanded');
    }
    applyPreview(container);
  });
}

/**
 * Re-apply after dynamic content inject (blog, projects, awards).
 * @param {HTMLElement|string|null} target
 */
export function refreshSectionPreview(target) {
  const container =
    typeof target === 'string'
      ? document.querySelector(target)
      : target instanceof HTMLElement
        ? target
        : null;
  if (!container?.hasAttribute('data-section-preview')) {
    initSectionPreviews(document);
    return;
  }
  container.dataset[BOUND] = 'true';
  applyPreview(container);
}

/**
 * Contact extras (support, socials, dream marquees) stay fully visible —
 * no progressive disclosure / Show less control.
 */
export function initContactExtras(root = document) {
  const contact = root.getElementById?.('contact') || root.querySelector?.('#contact');
  if (!contact || contact.dataset.contactExtrasBound === 'true') return;

  contact.dataset.contactExtrasBound = 'true';
  contact.classList.add('is-contact-expanded');

  const extras = Array.from(contact.querySelectorAll('[data-contact-extra]'));
  extras.forEach(el => {
    el.classList.remove('is-preview-hidden');
    el.hidden = false;
    el.setAttribute('aria-hidden', 'false');
  });

  contact.querySelectorAll('.contact-extras-actions').forEach(actions => {
    actions.hidden = true;
    actions.remove();
  });
}

function boot() {
  initSectionPreviews(document);
  initContactExtras(document);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

export default { initSectionPreviews, refreshSectionPreview, initContactExtras };
