import {
  initCardContentAccessibility,
  rescanCardContentAccessibility,
} from './card-content-accessibility.js';

function initBlogFilters() {
  const container = document.getElementById('blog-posts-container');
  const chips = Array.from(document.querySelectorAll('.blog-filter-chip'));
  const status = document.getElementById('blog-filter-status');
  if (!container || !chips.length) return;

  const applyFilter = tag => {
    const cards = Array.from(container.querySelectorAll('.blog-card'));
    let visible = 0;

    cards.forEach(card => {
      const tags = String(card.dataset.tags || '')
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);
      const show = tag === 'all' || tags.includes(tag);
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (status) {
      status.textContent =
        tag === 'all' ? `${visible} articles` : `${visible} articles tagged “${tag}”`;
    }
  };

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = String(chip.dataset.tag || 'all').toLowerCase();
      chips.forEach(item => {
        const active = item === chip;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      applyFilter(tag);
    });
  });

  applyFilter('all');
}

function initReadingProgress() {
  const bar = document.getElementById('blog-reading-progress');
  const article = document.querySelector('.blog-article-main');
  if (!bar || !article) return;

  let offsetTop = article.offsetTop;
  let scrollHeight = article.scrollHeight;

  const updateOffsets = () => {
    offsetTop = article.offsetTop;
    scrollHeight = article.scrollHeight;
  };

  const update = () => {
    const total = Math.max(scrollHeight - window.innerHeight, 1);
    const scrolled = Math.min(Math.max(window.scrollY - offsetTop, 0), total);
    bar.style.width = `${Math.round((scrolled / total) * 100)}%`;
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', updateOffsets, { passive: true });
  update();
}

function initBlogPage() {
  initCardContentAccessibility();
  rescanCardContentAccessibility(document);
  initBlogFilters();
  initReadingProgress();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlogPage, { once: true });
} else {
  initBlogPage();
}
