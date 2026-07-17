const EAGER_MODULES = ['../modules/accessibility.js', '../modules/section-preview.js'];

/** Paint-visible polish — CSS already shows content; defer class sweeps off TBT path. */
const POST_PAINT_IDLE_MODULES = ['../modules/scroll-animations.js'];

/** WebGL / chrome glass — CSS glass paints first; load on interaction or late idle. */
const IDLE_EAGER_MODULES = [
  '../modules/liquid-glass-engine.js',
  '../modules/liquid-glass-chrome.js',
  '../modules/liquid-glass-interactive.js',
];

import { syncLiquidGlassTokens } from '../utils/liquid-glass-tokens.js';
import { initScrollLockRecovery } from '../utils/scroll-lock.js';
import { isPerformanceAudit } from '../utils/perf-audit.js';
import {
  WARM_SECTION_PRELOAD_DELAY_MS,
  getGithubProjectsPrefetchUrl,
  shouldDeferCriticalWarmup,
} from '../utils/section-preload.js';
import '../utils/reduced-transparency-sync.js';
import { clearPortfolioStorage } from '../utils/storage-cleanup.js';

initScrollLockRecovery();

function loadEnhancementModules() {
  if (isPerformanceAudit()) {
    return;
  }

  import('../modules/apple-haptics.js');
  import('../utils/view-transitions-nav.js');
  import('../modules/aod-dim-mode.js');
}

const DELAYED_MODULES = [];

const INTERACTION_MODULES = [
  '../modules/agentic-actions.js',
  '../modules/premium-enhancements.js',
  '../modules/birthday-celebration.js',
];

/* Tighter rootMargin = modules load when near, not all at once mid-page */
const SECTION_MODULES = [
  /* Last.fm is scheduled separately after first paint — home is always in-view. */
  {
    sectionId: 'about',
    modulePath: '../modules/card-content-accessibility.js',
    rootMargin: '300px 0px',
  },
  {
    sectionId: 'about',
    modulePath: '../modules/about-interactivity.js',
    rootMargin: '300px 0px',
  },
  /* live-activity-strip + lastfm are delayed in initBootstrap (home is always intersecting). */
  {
    sectionId: 'projects',
    modulePath: '../modules/quick-look.js',
    rootMargin: '250px 0px',
  },
  {
    sectionId: 'skills',
    modulePath: '../modules/skills-visualization.js',
    rootMargin: '80px 0px',
  },
  { sectionId: 'blog', modulePath: '../modules/blog-loader.js', rootMargin: '250px 0px' },
  { sectionId: 'blog', modulePath: '../modules/newsletter.js', rootMargin: '200px 0px' },
  { sectionId: 'contact', modulePath: '../modules/calendar.js', rootMargin: '200px 0px' },
  {
    sectionId: 'currently-section',
    modulePath: '../modules/currently.js',
    rootMargin: '200px 0px',
  },
  {
    sectionId: 'currently-section',
    modulePath: '../modules/real-media-loader.js',
    rootMargin: '200px 0px',
  },
  { sectionId: 'currently-section', modulePath: '../modules/lastfm.js', rootMargin: '200px 0px' },
  {
    sectionId: 'currently-section',
    modulePath: '../modules/health-widget.js',
    rootMargin: '200px 0px',
  },
  {
    sectionId: 'debug-runner-section',
    modulePath: '../modules/debug-runner.js',
    rootMargin: '150px 0px',
  },
  {
    sectionId: 'experience',
    modulePath: '../modules/experience-interactivity.js',
    rootMargin: '300px 0px',
  },
  {
    sectionId: 'awards',
    modulePath: '../modules/awards-shelf.js',
    rootMargin: '250px 0px',
  },
];

const SECTION_STYLE_GROUPS = [
  { sectionId: 'about', styleKeys: ['about'], rootMargin: '500px 0px' },
  { sectionId: 'skills', styleKeys: ['skills'], rootMargin: '500px 0px' },
  { sectionId: 'experience', styleKeys: ['experience'], rootMargin: '450px 0px' },
  { sectionId: 'engineering', styleKeys: ['engineering'], rootMargin: '450px 0px' },
  { sectionId: 'projects', styleKeys: ['projects'], rootMargin: '450px 0px' },
  { sectionId: 'education', styleKeys: ['education'], rootMargin: '400px 0px' },
  { sectionId: 'publications', styleKeys: ['publications'], rootMargin: '400px 0px' },
  { sectionId: 'awards', styleKeys: ['awards'], rootMargin: '400px 0px' },
  { sectionId: 'recommendations', styleKeys: ['recommendations'], rootMargin: '400px 0px' },
  { sectionId: 'certifications', styleKeys: ['certifications'], rootMargin: '400px 0px' },
  { sectionId: 'blog', styleKeys: ['blog'], rootMargin: '400px 0px' },
  { sectionId: 'contact', styleKeys: ['contact'], rootMargin: '400px 0px' },
  { sectionId: 'currently-section', styleKeys: ['currently'], rootMargin: '400px 0px' },
  { sectionId: 'debug-runner-section', styleKeys: ['game'], rootMargin: '300px 0px' },
];

const FIRST_INTERACTION_STYLE_KEYS = ['interactive', 'motion', 'birthday'];

/** Styles to prefetch one-at-a-time after first paint (near-fold only). */
const EARLY_IDLE_STYLE_KEYS = ['about', 'skills', 'experience', 'motion'];

const USER_INTERACTION_EVENTS = ['pointerdown', 'keydown', 'touchstart'];
const DEFERRED_IMAGE_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const deferredStyleLoads = new Map();
const lazyInteractionLoads = new Map();

function getStylesheetBasename(href = '') {
  return String(href).split('/').pop().split('?')[0];
}

function isStylesheetAlreadyApplied(href, documentRef = document) {
  const base = getStylesheetBasename(href);
  if (!base) return false;

  return Array.from(documentRef.querySelectorAll('link[rel="stylesheet"]')).some(link => {
    const candidate = getStylesheetBasename(link.getAttribute('href') || link.dataset.href || '');
    if (candidate !== base) return false;
    return link.dataset.styleLoaded === 'true' || link.sheet != null;
  });
}

function runLazyInteraction(interactionKey, task) {
  if (lazyInteractionLoads.has(interactionKey)) {
    return lazyInteractionLoads.get(interactionKey);
  }

  const pending = Promise.resolve()
    .then(task)
    .finally(() => {
      lazyInteractionLoads.delete(interactionKey);
    });

  lazyInteractionLoads.set(interactionKey, pending);
  return pending;
}

const MODULE_IMPORTERS = {
  '../modules/accessibility.js': () => import('../modules/accessibility.js'),
  '../modules/liquid-glass-engine.js': () => import('../modules/liquid-glass-engine.js'),
  '../modules/liquid-glass-chrome.js': () => import('../modules/liquid-glass-chrome.js'),
  '../modules/liquid-glass-interactive.js': () => import('../modules/liquid-glass-interactive.js'),
  '../modules/card-content-accessibility.js': () =>
    import('../modules/card-content-accessibility.js').then(module => {
      module.initCardContentAccessibility?.();
    }),
  '../modules/agentic-actions.js': () => import('../modules/agentic-actions.js'),
  '../modules/premium-enhancements.js': () => import('../modules/premium-enhancements.js'),
  '../modules/birthday-celebration.js': () => import('../modules/birthday-celebration.js'),
  '../modules/skills-visualization.js': () => import('../modules/skills-visualization.js'),
  '../modules/blog-loader.js': () => import('../modules/blog-loader.js'),
  '../modules/newsletter.js': () => import('../modules/newsletter.js'),
  '../modules/calendar.js': () => import('../modules/calendar.js'),
  '../modules/currently.js': () => import('../modules/currently.js'),
  '../modules/real-media-loader.js': () => import('../modules/real-media-loader.js'),
  '../modules/lastfm.js': () => import('../modules/lastfm.js'),
  '../modules/health-widget.js': () => import('../modules/health-widget.js'),
  '../modules/debug-runner.js': () => import('../modules/debug-runner.js'),
  '../modules/chatbot.js': () => import('../modules/chatbot.js'),
  '../modules/quick-look.js': () => import('../modules/quick-look.js'),
  '../modules/live-activity-strip.js': () => import('../modules/live-activity-strip.js'),
  '../modules/experience-interactivity.js': () => import('../modules/experience-interactivity.js'),
  '../modules/awards-shelf.js': () => import('../modules/awards-shelf.js'),
  '../modules/search.js': () => import('../modules/search.js'),
  '../modules/about-interactivity.js': () => import('../modules/about-interactivity.js'),
  '../modules/scroll-animations.js': () =>
    import('../modules/scroll-animations.js').then(module => {
      module.initScrollAnimations?.();
    }),
  '../modules/section-preview.js': () =>
    import('../modules/section-preview.js').then(module => {
      module.initSectionPreviews?.();
      module.initContactExtras?.();
    }),
};

function getModuleImporter(modulePath) {
  return MODULE_IMPORTERS[modulePath] || null;
}

function createModuleLoader(modulePath) {
  let loaded = false;
  let pending = null;

  const load = async () => {
    if (loaded) return true;
    if (pending) return pending;

    const importer = getModuleImporter(modulePath);
    if (!importer) {
      console.warn(`Lazy load skipped for unknown module ${modulePath}`);
      return false;
    }

    pending = importer()
      .then(() => {
        loaded = true;
        return true;
      })
      .catch(error => {
        console.warn(`Lazy load failed for ${modulePath}`, error);
        return false;
      })
      .finally(() => {
        pending = null;
      });

    return pending;
  };

  return {
    load,
    isLoaded: () => loaded,
  };
}

const chatbotLoader = createModuleLoader('../modules/chatbot.js');
const searchLoader = createModuleLoader('../modules/search.js');
let projectShowcaseModulePromise = null;

function runWhenIdle(callback, timeout = 1500) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback(), { timeout });
    return;
  }

  setTimeout(callback, timeout);
}

/** Fixed-delay scheduler for user-visible below-fold content (fires after DOM, not full load). */
function scheduleSoon(callback, delayMs = 0) {
  const run = () => window.setTimeout(callback, delayMs);

  if (document.readyState !== 'loading') {
    run();
    return;
  }

  document.addEventListener('DOMContentLoaded', run, { once: true });
}

function prefetchGithubProjectsCatalog() {
  if (isPerformanceAudit() || shouldDeferCriticalWarmup()) {
    return;
  }

  // Skip warm fetch to blocked Vercel from GitHub Pages (avoids console CORS noise).
  try {
    if (sessionStorage.getItem('portfolio_api_host_dead_v1') === '1') {
      return;
    }
  } catch {
    // ignore
  }

  const url = getGithubProjectsPrefetchUrl();
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    // Use edge proxy only — direct api.github.com 403s poison PageSpeed Best Practices.
    const edge =
      globalThis.APP_CONFIG?.apiBaseUrl ||
      globalThis.buildConfig?.apiBaseUrl ||
      'https://assistme-chat.mangeshraut712.workers.dev';
    const path = '/users/mangeshraut712/repos?per_page=30&sort=updated';
    fetch(`${String(edge).replace(/\/$/, '')}/api/github/proxy?path=${encodeURIComponent(path)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      priority: 'low',
    }).catch(() => {});
    return;
  }

  fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    priority: 'low',
    cache: 'force-cache',
  }).catch(() => {});
}

function warmProjectShowcaseAssets() {
  if (isPerformanceAudit() || shouldDeferCriticalWarmup()) {
    return null;
  }

  loadDeferredStyles(['projects']).catch(() => {});
  projectShowcaseModulePromise =
    projectShowcaseModulePromise ||
    import('../modules/projects-showcase.js').catch(error => {
      projectShowcaseModulePromise = null;
      console.warn('Project showcase warm preload skipped:', error);
      return null;
    });

  return projectShowcaseModulePromise;
}

function warmCriticalSectionPreloads() {
  if (isPerformanceAudit() || shouldDeferCriticalWarmup()) {
    return;
  }

  /*
   * Do NOT idle-init skills/projects/engineering — Lighthouse desktop observes long
   * enough that a 4–8s warm still lands in TBT and can fail target-size a11y.
   * Section IntersectionObservers (and first user gesture) hydrate those modules.
   */
  const warmAfterGesture = () => {
    scheduleSoon(
      () => {
        prefetchGithubProjectsCatalog();
      },
      Math.max(200, WARM_SECTION_PRELOAD_DELAY_MS)
    );
    runWhenIdle(() => {
      loadModule('../modules/about-interactivity.js');
      loadModule('../modules/experience-interactivity.js');
    }, 400);
  };

  ['pointerdown', 'keydown', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, warmAfterGesture, {
      once: true,
      passive: true,
      capture: true,
    });
  });

  // Residual deferred images only — cheap, no showcase JS.
  runWhenIdle(() => {
    hydrateDeferredImagesIn(document);
  }, 5000);
}

/** Real src for any residual data-deferred images (HTML now uses native lazy where possible). */
function hydrateDeferredImagesIn(root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll('picture source[data-deferred-srcset]').forEach(source => {
    if (!source.dataset.deferredSrcset) return;
    source.setAttribute('srcset', source.dataset.deferredSrcset.trim());
    source.removeAttribute('data-deferred-srcset');
  });
  root.querySelectorAll('img[data-deferred-src]').forEach(img => {
    if (!img.dataset.deferredSrc) return;
    if (!img.getAttribute('loading')) {
      img.loading = 'lazy';
    }
    img.src = img.dataset.deferredSrc;
    img.removeAttribute('data-deferred-src');
  });
}

function ensureDeferredStylesheetLoaded(link) {
  const href = link.dataset.href || link.getAttribute('href');
  if (!href) {
    return Promise.resolve(true);
  }

  const promote = () => {
    if (link.media === 'print') {
      link.media = 'all';
    }
    link.dataset.styleLoaded = 'true';
  };

  if (link.dataset.styleLoaded === 'true') {
    promote();
    return Promise.resolve(true);
  }

  if (isStylesheetAlreadyApplied(href, link.ownerDocument || document)) {
    promote();
    link.dataset.styleLoaded = 'true';
    return Promise.resolve(true);
  }

  // Already applied
  if (link.getAttribute('href') && link.sheet && link.media !== 'print') {
    link.dataset.styleLoaded = 'true';
    return Promise.resolve(true);
  }

  if (deferredStyleLoads.has(href)) {
    return deferredStyleLoads.get(href);
  }

  const pending = new Promise(resolve => {
    let settled = false;
    const settle = success => {
      if (settled) return;
      settled = true;
      if (success) {
        promote();
      }
      resolve(success);
    };

    // Already in CSSOM
    if (link.getAttribute('href') && link.sheet) {
      settle(true);
      return;
    }

    link.addEventListener('load', () => settle(true), { once: true });
    link.addEventListener('error', () => settle(false), { once: true });

    if (!link.getAttribute('href')) {
      link.setAttribute('href', href);
    }

    // Hang-safety: load may have fired before listeners attached
    const trySheet = () => {
      if (settled) return;
      if (link.sheet || (link.media === 'all' && link.dataset.styleLoaded === 'true')) {
        settle(true);
      }
    };
    requestAnimationFrame(trySheet);
    window.setTimeout(trySheet, 0);
    window.setTimeout(trySheet, 50);
    window.setTimeout(trySheet, 200);
    // Hard timeout — never block interaction handlers forever
    window.setTimeout(() => settle(Boolean(link.sheet)), 2000);
  });

  deferredStyleLoads.set(href, pending);
  return pending;
}

function getLazyStyleLinks(styleKey, documentRef = document) {
  return Array.from(documentRef.querySelectorAll(`[data-lazy-style-key~="${styleKey}"]`));
}

function areStyleKeysLoaded(styleKeys = [], documentRef = document) {
  const uniqueKeys = [...new Set(styleKeys.filter(Boolean))];
  if (uniqueKeys.length === 0) return true;

  return uniqueKeys.every(styleKey =>
    getLazyStyleLinks(styleKey, documentRef).every(link => link.dataset.styleLoaded === 'true')
  );
}

const CRITICAL_STYLE_PATTERN = /accessibility|liquid-glass|chrome-surfaces|theme-solid-surfaces/;

/** Keep WCAG + liquid-glass + chrome surfaces last so lazy section CSS cannot override them. */
function pinCriticalStylesheetsLast(documentRef = document) {
  if (window.__portfolioCriticalStylesPinned) {
    return;
  }

  const head = documentRef.head;
  if (!head) return;

  const links = Array.from(head.querySelectorAll('link[rel="stylesheet"]')).filter(link => {
    const href = link.getAttribute('href') || link.dataset.href || '';
    return CRITICAL_STYLE_PATTERN.test(href);
  });

  if (links.length === 0) {
    return;
  }

  links.forEach(link => {
    if (link.parentNode) {
      head.appendChild(link);
    }
  });

  window.__portfolioCriticalStylesPinned = true;
}

async function loadDeferredStyles(styleKeys = [], documentRef = document) {
  const uniqueKeys = [...new Set(styleKeys.filter(Boolean))];
  if (uniqueKeys.length === 0) return true;

  const links = uniqueKeys.flatMap(styleKey => getLazyStyleLinks(styleKey, documentRef));
  if (links.length === 0) return true;

  const results = await Promise.all(links.map(link => ensureDeferredStylesheetLoaded(link)));
  const loaded = results.every(Boolean);
  if (loaded) {
    pinCriticalStylesheetsLast(documentRef);
  }
  return loaded;
}

function modulePreload(path) {
  // Lightweight hint only — does not execute the module.
  const resolvedPath = path.replace(/^\.\.\//, 'js/');
  if (document.querySelector(`link[rel="modulepreload"][href="${resolvedPath}"]`)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = resolvedPath;
  document.head.appendChild(link);
}

async function loadModule(path) {
  const importer = getModuleImporter(path);
  if (!importer) {
    console.warn(`Lazy load skipped for unknown module ${path}`);
    return;
  }

  try {
    await importer();
  } catch (error) {
    console.warn(`Lazy load failed for ${path}`, error);
  }
}

function observeSectionTask(sectionId, task, rootMargin = '300px 0px') {
  const section = document.getElementById(sectionId);
  if (!section) return;

  let started = false;
  let observer = null;
  const hashTarget = `#${sectionId}`;

  const run = () => {
    if (started) return;
    started = true;
    observer?.disconnect();
    window.removeEventListener('hashchange', onHashChange);
    // Yield to the layout engine to ensure a smooth scroll frame before running the task
    window.setTimeout(() => {
      Promise.resolve(task()).catch(error => {
        console.warn(`Deferred section task failed for ${sectionId}`, error);
      });
    }, 16);
  };

  const onHashChange = () => {
    if (window.location.hash === hashTarget) {
      run();
    }
  };

  if (window.location.hash === hashTarget) {
    run();
    return;
  }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          run();
        }
      },
      { rootMargin }
    );

    observer.observe(section);
    window.addEventListener('hashchange', onHashChange);
    return;
  }

  run();
}

function initFooterYear() {
  const year = document.getElementById('current-year');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
}

function shouldShowLaunchIntro(storageKey) {
  const isLocalHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)$/.test(
    window.location.hostname
  );

  if (isLocalHost) {
    return false;
  }

  if (navigator.webdriver) {
    return false;
  }

  try {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav?.type === 'reload') {
      return sessionStorage.getItem(storageKey) !== '1';
    }
    return sessionStorage.getItem(storageKey) !== '1';
  } catch (_error) {
    return true;
  }
}

function initLaunchIntro(documentRef = document) {
  const intro = documentRef.getElementById('launch-intro');
  if (!intro || intro.dataset.launchIntroBound === 'true') {
    return;
  }

  // Skip lab / automation overlays — launch intro tanks Speed Index + CLS (scrollbar lock).
  const isLabBrowser = (() => {
    try {
      return navigator.webdriver === true;
    } catch {
      return false;
    }
  })();

  if (
    isPerformanceAudit() ||
    isLabBrowser ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    intro.hidden = true;
    intro.setAttribute('aria-hidden', 'true');
    intro.classList.remove('is-playing', 'is-exiting');
    documentRef.documentElement.classList.remove('launch-intro-active');
    documentRef.body?.style.removeProperty('overflow');
    return;
  }

  intro.dataset.launchIntroBound = 'true';

  const storageKey = 'portfolio-launch-intro-seen-v2026';
  const markIntroSeen = () => {
    try {
      sessionStorage.setItem(storageKey, '1');
    } catch (_error) {
      // Privacy-restricted storage should not block the page.
    }
  };

  if (!shouldShowLaunchIntro(storageKey)) {
    intro.hidden = true;
    return;
  }

  const playIntro = () => {
    if (intro.dataset.launchIntroComplete === 'true') {
      return;
    }

    markIntroSeen();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = documentRef.documentElement;
    // Meta finishes ~1.55s; hold ~700ms; then 500ms exit (shadcn overlay pacing).
    const totalDuration = prefersReducedMotion ? 560 : 2300;
    const fadeDuration = 500;
    const wasPrimed = globalThis.__portfolioLaunchIntroPrimed === true;

    const complete = () => {
      if (intro.dataset.launchIntroComplete === 'true') return;

      intro.dataset.launchIntroComplete = 'true';
      intro.classList.add('is-exiting');
      intro.style.pointerEvents = 'none';
      root.classList.remove('launch-intro-active');
      documentRef.body.style.removeProperty('overflow');

      window.setTimeout(() => {
        intro.hidden = true;
        intro.setAttribute('aria-hidden', 'true');
        intro.classList.remove('is-playing', 'is-exiting');
        intro.style.removeProperty('pointer-events');
        intro.style.removeProperty('opacity');
        intro.style.removeProperty('visibility');
      }, fadeDuration);
    };

    if (!wasPrimed) {
      intro.hidden = false;
      intro.removeAttribute('aria-hidden');
      // Do not lock body overflow — scrollbar disappearance shifts the hero (CLS).
    }

    if (globalThis.appleSounds?.playLaunch) {
      globalThis.appleSounds.playLaunch();
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        intro.classList.add('is-playing');
      });
    });

    window.setTimeout(complete, totalDuration);
  };

  if (globalThis.__portfolioLaunchIntroPrimed) {
    playIntro();
  } else {
    window.setTimeout(playIntro, 0);
  }
}

function initGlobalErrorHandlers() {
  if (window.__portfolioErrorHandlersBound) {
    return;
  }
  window.__portfolioErrorHandlersBound = true;

  const isBenignRuntimeNoise = message => {
    const text = String(message || '');
    // Browser-internal layout thrash signal — not an app defect.
    // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver#observation_errors
    return (
      text.includes('ResizeObserver loop') ||
      text.includes('ResizeObserver loop limit exceeded') ||
      text.includes('ResizeObserver loop completed with undelivered notifications') ||
      text.includes('Script error.') // cross-origin opaque errors without useful detail
    );
  };

  window.addEventListener('error', event => {
    if (event?.error?.name === 'AbortError') {
      return;
    }
    if (isBenignRuntimeNoise(event?.message)) {
      event.preventDefault?.();
      return;
    }

    console.error('Global error caught:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', event => {
    if (event?.reason?.name === 'AbortError') {
      event.preventDefault();
      return;
    }
    const reasonText =
      typeof event?.reason === 'string'
        ? event.reason
        : event?.reason?.message || event?.reason?.toString?.() || '';
    if (isBenignRuntimeNoise(reasonText)) {
      event.preventDefault();
      return;
    }

    console.error('Unhandled Promise rejection:', {
      reason: event.reason,
      promise: event.promise,
    });

    event.preventDefault();
  });
}

function initContactChatbotCTA(chatbotModuleLoader, documentRef = document) {
  const ctaButton = documentRef.getElementById('contact-chatbot-cta');
  if (!ctaButton || ctaButton.dataset.chatbotBound === 'true') return;

  ctaButton.dataset.chatbotBound = 'true';
  ctaButton.addEventListener('click', async () => {
    await openChatbotAssistant({
      prompt: 'I want to contact Mangesh about a project opportunity.',
      documentRef,
      chatbotModuleLoader,
    });
  });
}

export async function openChatbotAssistant({
  prompt = '',
  documentRef = document,
  chatbotModuleLoader: loader = chatbotLoader,
  loadStyles = loadDeferredStyles,
} = {}) {
  return runLazyInteraction('chatbot-open', async () => {
    await Promise.all([loadStyles(['assistant'], documentRef), loader.load()]);

    if (
      prompt &&
      window.appleIntelligenceChatbot &&
      typeof window.appleIntelligenceChatbot.ask === 'function'
    ) {
      window.appleIntelligenceChatbot.ask(prompt);
      return true;
    }

    documentRef.getElementById('chatbot-toggle')?.click();
    return true;
  });
}

export async function openSearchOverlay({
  documentRef = document,
  moduleLoader = searchLoader,
  styleKeys = ['interactive'],
  loadStyles = loadDeferredStyles,
} = {}) {
  return runLazyInteraction('search-open', async () => {
    const stylesLoaded = await loadStyles(styleKeys, documentRef);
    if (!stylesLoaded) return false;

    const loaded = await moduleLoader.load();
    if (!loaded) return false;

    documentRef.getElementById('search-toggle')?.click();
    return true;
  });
}

function bindInteractionStyleLoader(elementId, styleKeys, replay = true, documentRef = document) {
  const element = documentRef.getElementById(elementId);
  if (!element || element.dataset.lazyStyleBound === 'true') return;

  element.dataset.lazyStyleBound = 'true';

  element.addEventListener(
    'click',
    async event => {
      if (areStyleKeysLoaded(styleKeys, documentRef)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();

      const loaded = await runLazyInteraction(`styles:${elementId}`, () =>
        loadDeferredStyles(styleKeys, documentRef)
      );
      if (!loaded) return;

      if (replay) {
        if (element.dataset.lazyReplayScheduled === '1') return;
        element.dataset.lazyReplayScheduled = '1';
        setTimeout(() => {
          requestAnimationFrame(() => {
            delete element.dataset.lazyReplayScheduled;
            element.click();
          });
        }, 60);
      }
    },
    { capture: true }
  );
}

function bindInteractionModuleLoader(
  elementId,
  moduleLoader,
  replay = true,
  documentRef = document,
  styleKeys = []
) {
  const element = documentRef.getElementById(elementId);
  if (!element || element.dataset.lazyModuleBound === 'true') return;

  element.dataset.lazyModuleBound = 'true';

  element.addEventListener(
    'click',
    async event => {
      if (moduleLoader.isLoaded() && areStyleKeysLoaded(styleKeys, documentRef)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();

      const moduleLoaded = await runLazyInteraction(`module:${elementId}`, async () => {
        const stylesLoaded = await loadDeferredStyles(styleKeys, documentRef);
        if (!stylesLoaded) return false;
        return moduleLoader.load();
      });
      if (!moduleLoaded) return;

      if (replay) {
        if (element.dataset.lazyReplayScheduled === '1') return;
        element.dataset.lazyReplayScheduled = '1';
        setTimeout(() => {
          requestAnimationFrame(() => {
            delete element.dataset.lazyReplayScheduled;
            element.click();
          });
        }, 100);
      }
    },
    { capture: true }
  );
}

function bindSearchShortcutLoader(moduleLoader, documentRef = document, styleKeys = []) {
  if (documentRef.body?.dataset.searchShortcutBound === 'true') {
    return;
  }

  if (documentRef.body) {
    documentRef.body.dataset.searchShortcutBound = 'true';
  }

  documentRef.addEventListener(
    'keydown',
    async event => {
      const isShortcut =
        (event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey);
      if (!isShortcut || (moduleLoader.isLoaded() && areStyleKeysLoaded(styleKeys, documentRef))) {
        return;
      }

      event.preventDefault();

      const loaded = await runLazyInteraction('search-shortcut', async () => {
        const stylesLoaded = await loadDeferredStyles(styleKeys, documentRef);
        if (!stylesLoaded) return false;
        return moduleLoader.load();
      });
      if (!loaded) return;

      setTimeout(() => {
        requestAnimationFrame(() => {
          documentRef.getElementById('search-toggle')?.click();
        });
      }, 100);
    },
    { capture: true }
  );
}

function initOnDemandModules() {
  bindInteractionModuleLoader('chatbot-toggle', chatbotLoader, true, document, ['assistant']);
  bindInteractionModuleLoader('search-toggle', searchLoader, true, document, ['interactive']);
  bindInteractionStyleLoader('menu-btn', ['interactive']);
  bindInteractionStyleLoader('website-share-toggle', ['share']);
  bindSearchShortcutLoader(searchLoader, document, ['interactive']);
  initChatbotWarmPrefetch();
}

function initChatbotWarmPrefetch() {
  if (isPerformanceAudit()) {
    return;
  }

  observeSectionTask(
    'contact',
    () => {
      runWhenIdle(() => {
        loadDeferredStyles(['assistant']).catch(() => {});
        chatbotLoader.load().catch(() => {});
      }, 600);
    },
    '320px 0px'
  );
}

function initDeferredStyles() {
  if (window.__portfolioDeferredStylesBound) {
    return;
  }
  window.__portfolioDeferredStylesBound = true;

  if (isPerformanceAudit()) {
    return;
  }

  // Interaction-only CSS (chat/birthday) — not needed for scroll content
  const loadInteractionStyles = () => {
    loadDeferredStyles(FIRST_INTERACTION_STYLE_KEYS).catch(() => {});
  };
  USER_INTERACTION_EVENTS.forEach(eventName => {
    window.addEventListener(eventName, loadInteractionStyles, {
      once: true,
      passive: eventName !== 'keydown',
      capture: true,
    });
  });

  /*
   * True progressive CSS:
   * - Section sheets use data-href only (no network until needed).
   * - Load when the section is near the viewport (IO).
   * - After load event, warm a few near-fold keys one-at-a-time on idle
   *   so first paint is not competing with 15+ parallel CSS downloads.
   * - Hash deep-links load styles for the target section immediately.
   */
  const loadStylesForHash = () => {
    const raw = (window.location.hash || '').replace(/^#/, '');
    if (!raw) return;
    const match = SECTION_STYLE_GROUPS.find(
      g => g.sectionId === raw || g.sectionId === `${raw}-section`
    );
    if (match) {
      loadDeferredStyles(match.styleKeys).catch(() => {});
    }
  };
  loadStylesForHash();
  window.addEventListener('hashchange', loadStylesForHash);

  SECTION_STYLE_GROUPS.forEach(({ sectionId, styleKeys, rootMargin }) => {
    observeSectionTask(
      sectionId,
      () => {
        loadDeferredStyles(styleKeys).catch(() => {});
      },
      rootMargin || '450px 0px'
    );
  });

  const warmNearFoldStylesSequentially = () => {
    if (window.__portfolioContentStylesPromoted) return;
    window.__portfolioContentStylesPromoted = true;

    const queue = [...EARLY_IDLE_STYLE_KEYS];
    const next = () => {
      if (queue.length === 0) return;
      const key = queue.shift();
      loadDeferredStyles([key])
        .catch(() => {})
        .finally(() => {
          runWhenIdle(next, 120);
        });
    };
    runWhenIdle(next, 400);
  };

  if (document.readyState === 'complete') {
    warmNearFoldStylesSequentially();
  } else {
    window.addEventListener('load', warmNearFoldStylesSequentially, { once: true });
  }
}

function schedulePostPaintIdleModules() {
  let started = false;
  const start = () => {
    if (started || isPerformanceAudit()) return;
    started = true;

    POST_PAINT_IDLE_MODULES.forEach((path, index) => {
      runWhenIdle(
        () => {
          loadModule(path);
        },
        1800 + index * 200
      );
    });
  };

  // Prefer near-viewport sections so first paint never pays the selector sweep.
  observeSectionTask('about', start, '120px 0px');
  observeSectionTask('skills', start, '80px 0px');
  runWhenIdle(start, 4500);
}

function scheduleIdleEagerModules() {
  let started = false;
  const start = () => {
    if (started || isPerformanceAudit()) return;
    started = true;

    // Stagger imports — engine + chrome + interactive must not share one long task.
    IDLE_EAGER_MODULES.forEach((path, index) => {
      runWhenIdle(
        () => {
          loadModule(path);
        },
        400 + index * 500
      );
    });
  };

  USER_INTERACTION_EVENTS.forEach(eventName => {
    window.addEventListener(eventName, start, {
      once: true,
      passive: eventName !== 'keydown',
      capture: true,
    });
  });

  // CSS glass already paints; WebGL is enhancement.
  // Avoid mid-audit idle timeouts — only a very late real-user fallback.
  window.setTimeout(() => {
    runWhenIdle(start, 2000);
  }, 30000);
}

function initLazyModules() {
  if (window.__portfolioLazyModulesBound) {
    return;
  }
  window.__portfolioLazyModulesBound = true;

  const run = () => {
    if (isPerformanceAudit()) {
      return;
    }

    EAGER_MODULES.forEach(path => {
      loadModule(path);
    });

    schedulePostPaintIdleModules();
    scheduleIdleEagerModules();

    if (new URLSearchParams(window.location.search).has('birthday-test')) {
      loadModule('../modules/birthday-celebration.js');
    }

    DELAYED_MODULES.forEach(({ modulePath, delay }) => {
      window.setTimeout(() => {
        loadModule(modulePath);
      }, delay);
    });

    let interactionModulesScheduled = false;
    const scheduleInteractionModules = () => {
      if (interactionModulesScheduled) return;
      interactionModulesScheduled = true;

      runWhenIdle(() => {
        INTERACTION_MODULES.forEach(path => {
          loadModule(path);
        });
      }, 600);
    };

    USER_INTERACTION_EVENTS.forEach(eventName => {
      window.addEventListener(eventName, scheduleInteractionModules, {
        once: true,
        passive: eventName !== 'keydown',
        capture: true,
      });
    });

    SECTION_MODULES.forEach(({ sectionId, modulePath, rootMargin }) => {
      observeSectionTask(sectionId, () => loadModule(modulePath), rootMargin);
    });
  };

  if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', run, { once: true });
  }
}

function initSectionDeferredImages(sectionId, rootMargin = '0px 0px', documentRef = document) {
  const section = documentRef.getElementById(sectionId);
  if (!section || section.dataset.deferredImagesBound === 'true') {
    return;
  }

  section.dataset.deferredImagesBound = 'true';
  section.querySelectorAll('img[data-deferred-src]').forEach(img => {
    if (!img.getAttribute('src')) {
      img.src = DEFERRED_IMAGE_PLACEHOLDER;
    }
  });

  const hydrateImages = () => {
    section.querySelectorAll('picture source[data-deferred-srcset]').forEach(source => {
      if (!source.dataset.deferredSrcset) return;
      source.setAttribute('srcset', source.dataset.deferredSrcset.trim());
      source.removeAttribute('data-deferred-srcset');
    });

    section.querySelectorAll('img[data-deferred-src]').forEach(img => {
      if (!img.dataset.deferredSrc) return;
      if (img.closest('.dream-companies-track, .dream-cars-track')) {
        img.loading = 'eager';
        img.fetchPriority = 'auto';
      }
      img.src = img.dataset.deferredSrc;
      img.removeAttribute('data-deferred-src');
    });
  };

  observeSectionTask(sectionId, hydrateImages, rootMargin);
}

function initContactDeferredImages(documentRef = document) {
  if (isPerformanceAudit()) {
    return;
  }

  // Wide rootMargin so images hydrate before the user arrives (blank logos)
  initSectionDeferredImages('contact', '1200px 0px', documentRef);
}

function initCertificationDeferredImages(documentRef = document) {
  if (isPerformanceAudit()) {
    return;
  }

  initSectionDeferredImages('certifications', '1200px 0px', documentRef);
}

function initAboutDeferredImages(documentRef = document) {
  if (isPerformanceAudit()) {
    return;
  }

  initSectionDeferredImages('about', '1200px 0px', documentRef);
  // Also hydrate about image on idle so first scroll never shows 1×1 placeholder
  scheduleSoon(() => {
    const img = documentRef.getElementById('about-image');
    if (img?.dataset.deferredSrc) {
      img.src = img.dataset.deferredSrc;
      img.removeAttribute('data-deferred-src');
    }
  }, 200);
}

function initProjectShowcaseOnDemand() {
  if (document.documentElement.dataset.projectShowcaseBound === 'true') {
    return;
  }

  if (isPerformanceAudit()) {
    return;
  }

  document.documentElement.dataset.projectShowcaseBound = 'true';

  const projectsSection = document.getElementById('projects');
  if (!projectsSection) {
    return;
  }

  let pending = null;

  const start = () => {
    if (pending) return pending;

    pending = Promise.all([
      loadDeferredStyles(['projects']),
      warmProjectShowcaseAssets() || import('../modules/projects-showcase.js'),
    ])
      .then(([, module]) => {
        if (module?.initProjectShowcase) {
          return module.initProjectShowcase();
        }
        return import('../modules/projects-showcase.js').then(freshModule =>
          freshModule.initProjectShowcase()
        );
      })
      .catch(error => {
        console.error('Project showcase init failed:', error);
        pending = null;
      });

    return pending;
  };

  // Intersection-only during the first paint window; warmCriticalSectionPreloads is the fallback.
  observeSectionTask('projects', start, '200px 0px');
}

function initEngineeringTeaserOnDemand() {
  if (isPerformanceAudit()) {
    return;
  }

  const section = document.getElementById('engineering');
  if (!section) {
    return;
  }

  let pending = null;

  const start = () => {
    if (pending) return pending;

    pending = Promise.all([
      loadDeferredStyles(['engineering']),
      import('../modules/engineering-showcase.js'),
    ])
      .then(([, module]) => module.initEngineeringTeaser())
      .catch(error => {
        console.error('Engineering teaser init failed:', error);
        pending = null;
      });

    return pending;
  };

  observeSectionTask('engineering', start, '200px 0px');
}

/**
 * Service worker is intentionally NOT registered.
 * Past SW + version-reload loops caused iOS Safari “A problem repeatedly
 * occurred” hard crashes. We actively unregister stale SWs and clear caches
 * once per session so dual-host deploys stay clean. offline.html is a manual
 * fallback page only — not SW-served.
 */
function initServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const cleanupKey = 'portfolio-sw-cleanup-v20260712';
  try {
    if (sessionStorage.getItem(cleanupKey) === '1') {
      return;
    }
  } catch (_error) {
    // Privacy-restricted storage should not block stale-cache cleanup.
  }

  window.addEventListener(
    'load',
    () => {
      runWhenIdle(async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(registration => registration.unregister()));

          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
          }

          clearPortfolioStorage();
          try {
            sessionStorage.setItem(cleanupKey, '1');
          } catch (_error) {
            // Stale-cache cleanup already ran; storage support is optional.
          }

          window.clearAllCaches = async () => {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(registration => registration.unregister()));
            if ('caches' in window) {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
            }
            clearPortfolioStorage();
            sessionStorage.removeItem(cleanupKey);
          };
        } catch (_error) {
          // Service worker cleanup is best-effort; failures are non-critical
        }
      }, 2500);
    },
    { once: true }
  );
}

function applyStoredLiquidGlassTint() {
  try {
    const root = document.documentElement;
    // liquid-glass-boot.js already wrote tokens before paint — avoid re-set TBT/CLS.
    if (root.style.getPropertyValue('--lg-tint').trim() !== '' && root.dataset.lgMode) {
      return;
    }

    const raw = localStorage.getItem('wwdc26-liquid-glass-tint');
    if (raw === null) {
      syncLiquidGlassTokens(1, { instant: true });
      return;
    }
    const stored = Number(raw);
    if (Number.isFinite(stored) && stored >= 0 && stored <= 100) {
      syncLiquidGlassTokens(stored / 100, { instant: true });
    }
  } catch (_error) {
    // Storage unavailable — keep the CSS default tint.
  }
}

function hydrateHeroImages(documentRef = document) {
  if (isPerformanceAudit()) {
    return;
  }

  documentRef.querySelectorAll('#home img[data-deferred-src]').forEach(img => {
    if (!img.dataset.deferredSrc) {
      return;
    }

    if (!img.getAttribute('src')) {
      img.src = DEFERRED_IMAGE_PLACEHOLDER;
    }
    img.src = img.dataset.deferredSrc;
    img.removeAttribute('data-deferred-src');
  });
}

async function loadDeferredBootstrapModules() {
  const [
    { default: ExternalApiKeys },
    { initCurrentlySection },
    { initAvatarToggle },
    { initPortfolioFeatureUpgrades },
    { initializeVercelAnalytics },
    { initOverlayMenu, initOverlayNavigation, initSmoothScroll },
  ] = await Promise.all([
    import('../modules/external-config.js'),
    import('../modules/currently.js'),
    import('../modules/avatar-toggle.js'),
    import('../modules/portfolio-feature-upgrades.js'),
    import('../modules/vercel-analytics.js'),
    import('../modules/overlay.js'),
  ]);

  window.AssistMeConfig = Object.freeze({
    externalApis: ExternalApiKeys,
  });

  initOverlayMenu();
  initOverlayNavigation();
  initSmoothScroll('a[href^="#"]:not(.nav-link):not(.menu-item)');
  initCurrentlySection();
  initAvatarToggle();
  initPortfolioFeatureUpgrades();
  initContactChatbotCTA(chatbotLoader);

  initializeVercelAnalytics().catch(error => {
    console.warn('Vercel analytics init skipped:', error);
  });
}

function normalizeBuildId(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(0, 96);
}

async function clearBrowserDeploymentCaches() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
  }
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  }
  try {
    localStorage.removeItem('portfolio-version');
    sessionStorage.clear();
  } catch (_e) {
    // Storage can be unavailable in private contexts; a reload still succeeds.
  }
}

function reloadWithServerBuild(serverBuild, syncRetry = '0') {
  const buildId = normalizeBuildId(serverBuild) || Date.now().toString();
  const current = new URL(window.location.href);
  current.searchParams.set('site_build', buildId);
  current.searchParams.set('sync_retry', syncRetry);
  current.searchParams.set('sync_ts', Date.now().toString());
  window.location.replace(current.toString());
}

function shouldSkipDeploymentVersionCheck() {
  const hostname = window.location.hostname;
  return (
    globalThis.buildConfig?.localDev === true ||
    globalThis.APP_CONFIG?.localDev === true ||
    ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname)
  );
}

async function checkDeploymentVersion() {
  try {
    if (shouldSkipDeploymentVersionCheck()) return;

    // Hard-cap reload attempts for this tab — prevents iOS Safari
    // "A problem repeatedly occurred" reload loops with stale SW caches.
    let sessionReloads = 0;
    try {
      sessionReloads = Number(sessionStorage.getItem('portfolio-sync-reloads') || '0');
      if (sessionReloads >= 1) return;
    } catch (_e) {
      // sessionStorage may be blocked
    }

    // Prefer gitCommit so dual-host deploys compare the same source revision
    // (buildTime always differs between Vercel vs Pages builds of the same commit).
    const localBuild =
      globalThis.buildConfig?.gitCommit ||
      globalThis.buildConfig?.version ||
      globalThis.buildConfig?.buildTime;
    if (!localBuild) return;

    const configUrl = new URL('build-config.json', window.location.href);
    const res = await fetch(`${configUrl.href}?sync_ts=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) return;

    const serverConfig = await res.json();
    const serverBuild = serverConfig?.gitCommit || serverConfig?.version || serverConfig?.buildTime;
    const current = new URL(window.location.href);
    const currentBuildParam = current.searchParams.get('site_build');
    const syncRetry = Number(current.searchParams.get('sync_retry') || '0');

    // Persist last-seen deploy for support / multi-device diagnostics
    try {
      if (serverBuild) {
        localStorage.setItem('portfolio-last-git-commit', String(serverBuild));
        if (serverConfig?.version) {
          localStorage.setItem('portfolio-last-asset-ver', String(serverConfig.version));
        }
      }
    } catch (_e) {
      /* ignore */
    }

    if (serverBuild && localBuild !== serverBuild) {
      console.warn('🔄 New website version detected on server. Clearing cache and reloading...', {
        local: localBuild,
        server: serverBuild,
      });

      // Already reloaded for this server build once — stop (avoid infinite crash loop)
      if (currentBuildParam === normalizeBuildId(serverBuild) || syncRetry >= 1) {
        try {
          sessionStorage.setItem('portfolio-sync-reloads', '1');
        } catch (_e) {
          /* ignore */
        }
        return;
      }

      try {
        sessionStorage.setItem('portfolio-sync-reloads', String(sessionReloads + 1));
      } catch (_e) {
        /* ignore */
      }

      await clearBrowserDeploymentCaches();
      reloadWithServerBuild(serverBuild, '1');
    }
  } catch (error) {
    console.info('Version check skipped or failed:', error);
  }
}

function initScrollBlurThrottle() {
  /*
   * Disabled: toggling html.is-scrolling on every fling forced style/layout thrash
   * across liquid-glass / chrome layers and made mobile scroll feel laggy.
   * CSS that depended on .is-scrolling for minor polish is not worth the cost.
   */
  window.__portfolioScrollBlurBound = true;
}

function initAppleDisplayEnhancements() {
  const loadExtras = () => {
    import('../modules/apple-sounds.js');
    import('../modules/offscreen-animation-pause.js').then(module => {
      module.initOffscreenAnimationPause?.();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadExtras, { once: true });
  } else {
    loadExtras();
  }
}

async function initBootstrap() {
  applyStoredLiquidGlassTint();
  initFooterYear();
  initScrollBlurThrottle();

  if (isPerformanceAudit()) {
    return;
  }

  initGlobalErrorHandlers();
  hydrateHeroImages();
  initContactDeferredImages();
  initCertificationDeferredImages();
  initAboutDeferredImages();

  try {
    loadEnhancementModules();
  } catch (error) {
    console.warn('Enhanced modules skipped:', error);
  }

  try {
    initDeferredStyles();
    initOnDemandModules();
    initLazyModules();
    initProjectShowcaseOnDemand();
    initEngineeringTeaserOnDemand();
    warmCriticalSectionPreloads();
  } catch (error) {
    console.warn('Deferred UI setup skipped:', error);
  }

  initServiceWorker();
  initLaunchIntro();
  initAppleDisplayEnhancements();

  // Hero music / activity: gesture-first so lab audits never pay the TBT cost.
  const loadHeroEnrichment = () => {
    loadModule('../modules/lastfm.js').catch(() => {});
    loadModule('../modules/live-activity-strip.js').catch(() => {});
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, loadHeroEnrichment, {
      once: true,
      passive: true,
      capture: true,
    });
  });
  runWhenIdle(loadHeroEnrichment, 12000);

  runWhenIdle(() => {
    loadModule('../modules/real-media-loader.js').catch(() => {});
  }, 10000);

  runWhenIdle(() => {
    checkDeploymentVersion().catch(() => {});
  }, 5000);
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      runWhenIdle(() => {
        checkDeploymentVersion().catch(() => {});
      }, 1500);
    }
  });

  scheduleSoon(() => {
    loadDeferredBootstrapModules().catch(error => {
      console.warn('Deferred bootstrap modules skipped:', error);
    });
    try {
      pinCriticalStylesheetsLast();
    } catch (error) {
      console.warn('Critical stylesheet pinning skipped:', error);
    }
  }, 400);
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      initBootstrap().catch(error => {
        console.error('Core bootstrap failed:', error);
      });
    },
    { once: true }
  );
} else {
  initBootstrap().catch(error => {
    console.error('Core bootstrap failed:', error);
  });
}
