import {
  initCardContentAccessibility,
  rescanCardContentAccessibility,
} from './card-content-accessibility.js';
import { initArticleReactions } from './blog-reactions.js';
import { initNewsletterForms } from './newsletter.js';

function initBlogFilters() {
  const container = document.getElementById('blog-posts-container');
  const search = document.getElementById('blog-search');
  const sort = document.getElementById('blog-sort');
  if (!container || !search || !sort) return;
  const chips = Array.from(document.querySelectorAll('.blog-filter-chip'));
  const cards = Array.from(container.querySelectorAll('.blog-card'));
  const status = document.getElementById('blog-filter-status');
  const empty = document.getElementById('blog-empty-state');
  let selectedTag = 'all';

  const apply = () => {
    const terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    cards.forEach(card => {
      const tags = (card.dataset.tags || '').split(',').map(tag => tag.toLocaleLowerCase());
      const text = (card.dataset.search || '').toLocaleLowerCase();
      const show =
        (selectedTag === 'all' || tags.includes(selectedTag)) &&
        terms.every(term => text.includes(term));
      card.hidden = !show;
      card.classList.toggle('is-filter-hidden', !show);
      if (show) visible += 1;
    });
    chips.forEach(chip => {
      const active = chip.dataset.tag.toLocaleLowerCase() === selectedTag;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    status.textContent = `${visible} of ${cards.length} articles`;
    status.hidden = false;
    empty.hidden = visible !== 0;
  };
  chips.forEach(chip =>
    chip.addEventListener('click', () => {
      selectedTag = chip.dataset.tag.toLocaleLowerCase();
      apply();
    })
  );
  search.addEventListener('input', apply);
  document
    .getElementById('blog-search-form')
    .addEventListener('submit', event => event.preventDefault());
  sort.addEventListener('change', () => {
    const sorted = [...cards].sort((a, b) => {
      if (sort.value === 'title')
        return a
          .querySelector('.blog-title')
          .textContent.trim()
          .localeCompare(b.querySelector('.blog-title').textContent.trim());
      const order = a.dataset.date.localeCompare(b.dataset.date);
      return sort.value === 'oldest' ? order : -order;
    });
    container.append(...sorted);
  });
  document.getElementById('blog-reset').addEventListener('click', () => {
    search.value = '';
    selectedTag = 'all';
    apply();
    search.focus();
  });
  apply();
}

function initReadingProgress() {
  const bar = document.getElementById('blog-reading-progress');
  const article = document.getElementById('article-content');
  if (!bar || !article) return;
  let ticking = false;
  const update = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      const rect = article.getBoundingClientRect();
      const total = Math.max(rect.height - window.innerHeight, 1);
      const progress = Math.min(Math.max(-rect.top / total, 0), 1);
      bar.style.transform = `scaleX(${progress})`;
      ticking = false;
    });
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  new ResizeObserver(update).observe(article);
  update();
}

function initArticleLinkCopy() {
  const button = document.querySelector('[data-copy-article]');
  const status = document.getElementById('article-copy-status');
  if (!button || !status) return;
  button.addEventListener('click', async () => {
    try {
      const url = document.querySelector('link[rel="canonical"]')?.href || location.href;
      await navigator.clipboard.writeText(url);
      status.textContent = 'Article link copied.';
    } catch {
      status.textContent = 'Copy the address from your browser to share this article.';
    }
  });
}

function initTocSpy() {
  const toc = document.getElementById('blog-article-toc');
  const body = document.querySelector('.article-body');
  if (!toc || !body) return;

  const details = toc.querySelector('.article-toc__details');
  const smallScreen = window.matchMedia('(max-width: 959px)');
  if (details && smallScreen.matches) details.open = false;
  smallScreen.addEventListener('change', event => {
    if (details) details.open = !event.matches;
  });

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

function initCodeCopy() {
  document.addEventListener('click', event => {
    const copyBtn = event.target.closest('[data-copy-code]');
    if (!copyBtn) return;
    const wrap = copyBtn.closest('.article-code-wrap');
    const codeEl = wrap?.querySelector('code');
    if (!codeEl) return;
    const originalHtml = copyBtn.innerHTML;
    navigator.clipboard
      .writeText(codeEl.innerText)
      .then(() => {
        copyBtn.classList.add('is-copied');
        copyBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> <span>Copied!</span>';
        setTimeout(() => {
          copyBtn.classList.remove('is-copied');
          copyBtn.innerHTML = originalHtml;
        }, 2000);
      })
      .catch(() => {});
  });
}

function initBlogPage() {
  initCardContentAccessibility();
  rescanCardContentAccessibility(document);
  initBlogFilters();
  initReadingProgress();
  initArticleLinkCopy();
  initTocSpy();
  initArticleReactions();
  initNewsletterForms();
  initCodeCopy();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlogPage, { once: true });
} else {
  initBlogPage();
}
