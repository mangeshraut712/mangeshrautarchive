import { blogPosts } from './blog-data.js';

const ROLE_WORDS = [
  'AI Systems Builder',
  'Cloud-Native Problem Solver',
  'Research-Driven Builder',
  'Product-Minded Technologist',
];
const IST_TIME_ZONE = 'Asia/Kolkata';
const EASTERN_TIME_ZONE = 'America/New_York';

// Hoisted Intl formatters for performance
const istTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: IST_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const easternTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: EASTERN_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function initHeroRoleFlip() {
  const roleWord = document.getElementById('hero-role-word');
  if (!roleWord) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;

  const setRole = () => {
    roleWord.textContent = ROLE_WORDS[index];
    index = (index + 1) % ROLE_WORDS.length;
  };

  setRole();
  if (!prefersReducedMotion) {
    window.setInterval(setRole, 2400);
  }
}

function initHeroLocalTimes() {
  const istTime = document.getElementById('hero-ist-time');
  const easternTime = document.getElementById('hero-est-time');
  if (!istTime && !easternTime) return;

  const update = () => {
    const now = new Date();
    if (istTime) {
      istTime.textContent = `IST ${istTimeFormatter.format(now)}`;
    }
    if (easternTime) {
      easternTime.textContent = `EST/EDT ${easternTimeFormatter.format(now)}`;
    }
  };

  update();
  window.setInterval(update, 30000);
}

function initBlogPostCount() {
  const count = document.getElementById('blog-post-count');
  if (!count) return;

  count.textContent = `(${blogPosts.length})`;
}

export function initPortfolioFeatureUpgrades() {
  initHeroRoleFlip();
  initHeroLocalTimes();
  initBlogPostCount();
}
