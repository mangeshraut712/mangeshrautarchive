import {
  initCardContentAccessibility,
  rescanCardContentAccessibility,
} from './card-content-accessibility.js';
import { initArticleReactions } from './blog-reactions.js';

function initBlogFilters() {
  const container = document.getElementById('blog-posts-container');
  const chips = Array.from(document.querySelectorAll('.blog-filter-chip'));
  const status = document.getElementById('blog-filter-status');
  if (!container || !chips.length) return;

  const applyFilter = tag => {
    const cards = Array.from(container.querySelectorAll('.blog-card'));
    let visible = 0;
    const needle = String(tag || 'all')
      .trim()
      .toLowerCase();

    cards.forEach(card => {
      const tags = String(card.dataset.tags || '')
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);
      const show = needle === 'all' || tags.includes(needle);
      // Class + hidden: author `display:flex` on .blog-card beats the [hidden] UA rule.
      card.hidden = !show;
      card.classList.toggle('is-filter-hidden', !show);
      card.setAttribute('aria-hidden', show ? 'false' : 'true');
      if (show) visible += 1;
    });

    if (status) {
      // Avoid duplicating the hero “N articles” count when viewing all topics.
      status.textContent =
        needle === 'all' ? '' : `${visible} article${visible === 1 ? '' : 's'} in “${tag}”`;
      status.hidden = needle === 'all';
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

function initTocSpy() {
  const toc = document.getElementById('blog-article-toc');
  const body = document.querySelector('.article-body');
  if (!toc || !body) return;

  const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  if (!links.length) return;

  const idToLink = new Map();
  links.forEach(link => {
    const id = decodeURIComponent(String(link.getAttribute('href') || '').slice(1));
    if (id) idToLink.set(id, link);
  });

  const headings = Array.from(body.querySelectorAll('h2[id], h3[id]')).filter(h =>
    idToLink.has(h.id)
  );
  if (!headings.length) return;

  const setActive = id => {
    links.forEach(link => {
      const active = idToLink.get(id) === link;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver(
    entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]?.target?.id) {
        setActive(visible[0].target.id);
      }
    },
    {
      rootMargin: '-20% 0px -65% 0px',
      threshold: [0, 1],
    }
  );

  headings.forEach(heading => observer.observe(heading));
}

function initBlogPage() {
  initCardContentAccessibility();
  rescanCardContentAccessibility(document);
  initBlogFilters();
  initReadingProgress();
  initTocSpy();
  initArticleReactions();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlogPage, { once: true });
} else {
  initBlogPage();
}
