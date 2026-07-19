/**
 * Publications paper preview — modal pattern mirrored from blog preview.
 * "Open preview" opens an in-page reader; "Read paper" stays a direct PDF link.
 */

const PDF_HREF = 'assets/files/RTFERS paper.pdf';

function ensureModal() {
  let modal = document.getElementById('publication-modal');
  if (modal) return modal;

  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div id="publication-modal" class="publication-modal hidden" role="dialog" aria-modal="true" aria-labelledby="publication-modal-title" aria-hidden="true">
      <div class="publication-modal-overlay" data-pub-close></div>
      <div class="publication-modal-container" tabindex="-1">
        <button class="publication-modal-close" type="button" aria-label="Close paper preview" data-pub-close></button>
        <header class="publication-modal-header">
          <p class="publication-modal-kicker">Research paper</p>
          <h2 id="publication-modal-title">Real-Time Face Emotion Recognition System</h2>
          <p class="publication-modal-meta">IJFGCN 2020 · Vol. 13, No. 3 · pp. 3306–3313</p>
          <a class="publication-modal-open-pdf btn-primary" href="${PDF_HREF}" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-file-pdf" aria-hidden="true"></i>
            <span>Open PDF</span>
          </a>
        </header>
        <div class="publication-modal-frame-wrap">
          <iframe
            id="publication-modal-frame"
            class="publication-modal-frame"
            title="Research paper PDF preview"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>
  `
  );

  modal = document.getElementById('publication-modal');
  modal.addEventListener('click', e => {
    if (e.target.closest('[data-pub-close]')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
  return modal;
}

function openModal() {
  const modal = ensureModal();
  const frame = document.getElementById('publication-modal-frame');
  if (frame && !frame.getAttribute('src')) {
    frame.src = `${PDF_HREF}#view=FitH`;
  }
  modal.classList.remove('hidden');
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('publication-modal-open');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.publication-modal-close')?.focus();
}

function closeModal() {
  const modal = document.getElementById('publication-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('publication-modal-open');
  document.body.style.overflow = '';
}

export function initPublicationsPreview() {
  const section = document.getElementById('publications');
  if (!section) return;

  const previewLink = section.querySelector('.publication-preview-link');
  if (!previewLink || previewLink.dataset.pubPreviewBound === '1') return;
  previewLink.dataset.pubPreviewBound = '1';

  previewLink.setAttribute('role', 'button');
  previewLink.setAttribute('href', '#');
  previewLink.addEventListener('click', e => {
    e.preventDefault();
    openModal();
  });
  previewLink.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPublicationsPreview, { once: true });
} else {
  initPublicationsPreview();
}
