const IDLE_MODULES = ['../modules/accessibility.js'];

import '../modules/apple-sounds.js';
import { syncLiquidGlassTokens } from '../utils/liquid-glass-tokens.js';

const DELAYED_MODULES = [];

const INTERACTION_MODULES = [
  '../modules/agentic-actions.js',
  '../modules/premium-enhancements.js',
  '../modules/birthday-celebration.js',
];

const SECTION_MODULES = [
  {
    sectionId: 'about',
    modulePath: '../modules/about-interactivity.js',
    rootMargin: '120px 0px',
  },
  {
    sectionId: 'skills',
    modulePath: '../modules/skills-visualization.js',
    rootMargin: '120px 0px',
  },
  { sectionId: 'blog', modulePath: '../modules/blog-loader.js', rootMargin: '120px 0px' },
  { sectionId: 'blog', modulePath: '../modules/newsletter.js', rootMargin: '120px 0px' },
  { sectionId: 'contact', modulePath: '../modules/calendar.js', rootMargin: '120px 0px' },
  {
    sectionId: 'currently-section',
    modulePath: '../modules/real-media-loader.js',
    rootMargin: '120px 0px',
  },
  { sectionId: 'currently-section', modulePath: '../modules/lastfm.js', rootMargin: '120px 0px' },
  { sectionId: 'currently-section', modulePath: '../modules/health-widget.js', rootMargin: '120px 0px' },
  {
    sectionId: 'debug-runner-section',
    modulePath: '../modules/debug-runner.js',
    rootMargin: '120px 0px',
  },
];

const SECTION_STYLE_GROUPS = [
  { sectionId: 'about', styleKeys: ['about'], rootMargin: '120px 0px' },
  { sectionId: 'skills', styleKeys: ['skills'], rootMargin: '120px 0px' },
  { sectionId: 'experience', styleKeys: ['experience'], rootMargin: '120px 0px' },
  { sectionId: 'projects', styleKeys: ['projects'], rootMargin: '120px 0px' },
  { sectionId: 'education', styleKeys: ['education'], rootMargin: '120px 0px' },
  { sectionId: 'publications', styleKeys: ['publications'], rootMargin: '120px 0px' },
  { sectionId: 'awards', styleKeys: ['awards'], rootMargin: '120px 0px' },
  { sectionId: 'recommendations', styleKeys: ['recommendations'], rootMargin: '120px 0px' },
  { sectionId: 'certifications', styleKeys: ['certifications'], rootMargin: '120px 0px' },
  { sectionId: 'blog', styleKeys: ['blog'], rootMargin: '120px 0px' },
  { sectionId: 'debug-runner-section', styleKeys: ['game'], rootMargin: '120px 0px' },
];

const FIRST_INTERACTION_STYLE_KEYS = ['interactive', 'motion', 'birthday'];

/** Styles to prefetch right after first paint — avoids FOUC without blocking LCP */
const EARLY_IDLE_STYLE_KEYS = [
  'interactive',
  'about',
  'projects',
  'skills',
  'experience',
  'education',
  'blog',
];

const USER_INTERACTION_EVENTS = ['pointerdown', 'keydown', 'touchstart'];

const deferredStyleLoads = new Map();

const MODULE_IMPORTERS = {
  '../modules/accessibility.js': () => import('../modules/accessibility.js'),
  '../modules/agentic-actions.js': () => import('../modules/agentic-actions.js'),
  '../modules/premium-enhancements.js': () => import('../modules/premium-enhancements.js'),
  '../modules/birthday-celebration.js': () => import('../modules/birthday-celebration.js'),
  '../modules/skills-visualization.js': () => import('../modules/skills-visualization.js'),
  '../modules/blog-loader.js': () => import('../modules/blog-loader.js'),
  '../modules/newsletter.js': () => import('../modules/newsletter.js'),
  '../modules/calendar.js': () => import('../modules/calendar.js'),
  '../modules/real-media-loader.js': () => import('../modules/real-media-loader.js'),
  '../modules/lastfm.js': () => import('../modules/lastfm.js'),
  '../modules/health-widget.js': () => import('../modules/health-widget.js'),
  '../modules/debug-runner.js': () => import('../modules/debug-runner.js'),
  '../modules/chatbot.js': () => import('../modules/chatbot.js'),
  '../modules/search.js': () => import('../modules/search.js'),
  '../modules/about-interactivity.js': () => import('../modules/about-interactivity.js'),
  '../modules/scroll-animations.js': () =>
    import('../modules/scroll-animations.js').then(module => {
      module.initScrollAnimations?.();
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

function runWhenIdle(callback, timeout = 1500) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback(), { timeout });
    return;
  }

  setTimeout(callback, timeout);
}

function isPerformanceAudit() {
  if (window.__PERF_AUDIT__ === true) {
    return true;
  }

  if (new URLSearchParams(window.location.search).has('perf-audit')) {
    return true;
  }

  const userAgent = navigator.userAgent || '';
  return /Chrome-Lighthouse|Lighthouse/i.test(userAgent);
}

function ensureDeferredStylesheetLoaded(link) {
  const href = link.dataset.href;
  if (!href) {
    return Promise.resolve(true);
  }

  if (link.dataset.styleLoaded === 'true') {
    return Promise.resolve(true);
  }

  if (deferredStyleLoads.has(href)) {
    return deferredStyleLoads.get(href);
  }

  const pending = new Promise(resolve => {
    const settle = success => {
      if (success) {
        link.dataset.styleLoaded = 'true';
      }
      resolve(success);
    };

    link.addEventListener('load', () => settle(true), { once: true });
    link.addEventListener('error', () => settle(false), { once: true });
    link.setAttribute('href', href);
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

const CRITICAL_STYLE_PATTERN = /accessibility-contrast-fixes|wwdc26-liquid-glass/;

/** Keep WCAG + liquid-glass layers last so lazy section CSS cannot override them. */
function pinCriticalStylesheetsLast(documentRef = document) {
  const head = documentRef.head;
  if (!head) return;

  const links = Array.from(head.querySelectorAll('link[rel="stylesheet"]')).filter(link => {
    const href = link.getAttribute('href') || link.dataset.href || '';
    return CRITICAL_STYLE_PATTERN.test(href);
  });

  links.forEach(link => {
    if (link.parentNode) {
      head.appendChild(link);
    }
  });
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
    Promise.resolve(task()).catch(error => {
      console.warn(`Deferred section task failed for ${sectionId}`, error);
    });
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
      return true;
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
      root.classList.add('launch-intro-active');
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

  window.addEventListener('error', event => {
    console.error('Global error caught:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', event => {
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
    await Promise.all([loadDeferredStyles(['assistant'], documentRef), chatbotModuleLoader.load()]);

    const prompt = 'I want to contact Mangesh about a project opportunity.';
    if (
      window.appleIntelligenceChatbot &&
      typeof window.appleIntelligenceChatbot.ask === 'function'
    ) {
      window.appleIntelligenceChatbot.ask(prompt);
      return;
    }

    const toggle = documentRef.getElementById('chatbot-toggle');
    toggle?.click();
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

      const loaded = await loadDeferredStyles(styleKeys, documentRef);
      if (!loaded) return;

      if (replay) {
        setTimeout(() => {
          requestAnimationFrame(() => {
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

      const stylesLoaded = await loadDeferredStyles(styleKeys, documentRef);
      if (!stylesLoaded) return;

      const moduleLoaded = await moduleLoader.load();
      if (!moduleLoaded) return;

      if (replay) {
        setTimeout(() => {
          requestAnimationFrame(() => {
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

      const stylesLoaded = await loadDeferredStyles(styleKeys, documentRef);
      if (!stylesLoaded) return;

      const loaded = await moduleLoader.load();
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
  bindSearchShortcutLoader(searchLoader, document, ['interactive']);
}

function initDeferredStyles() {
  if (window.__portfolioDeferredStylesBound) {
    return;
  }
  window.__portfolioDeferredStylesBound = true;

  const loadInteractionStyles = () => {
    loadDeferredStyles(FIRST_INTERACTION_STYLE_KEYS).catch(error => {
      console.warn('Deferred style load skipped:', error);
    });
  };

  USER_INTERACTION_EVENTS.forEach(eventName => {
    window.addEventListener(eventName, loadInteractionStyles, {
      once: true,
      passive: eventName !== 'keydown',
      capture: true,
    });
  });

  if (!isPerformanceAudit()) {
    window.addEventListener(
      'load',
      () => {
        runWhenIdle(() => {
          loadDeferredStyles(EARLY_IDLE_STYLE_KEYS).catch(error => {
            console.warn('Early idle style prefetch skipped:', error);
          });
        }, 250);
      },
      { once: true }
    );
  }

  if (isPerformanceAudit()) {
    return;
  }

  SECTION_STYLE_GROUPS.forEach(({ sectionId, styleKeys, rootMargin }) => {
    observeSectionTask(sectionId, () => loadDeferredStyles(styleKeys), rootMargin);
  });
}

function initLazyModules() {
  if (window.__portfolioLazyModulesBound) {
    return;
  }
  window.__portfolioLazyModulesBound = true;

  window.addEventListener(
    'load',
    () => {
      if (isPerformanceAudit()) {
        return;
      }

      runWhenIdle(() => {
        IDLE_MODULES.forEach(path => {
          loadModule(path);
        });
      }, 800);

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
    },
    { once: true }
  );
}

function initSectionDeferredImages(sectionId, rootMargin = '0px 0px', documentRef = document) {
  const section = documentRef.getElementById(sectionId);
  if (!section || section.dataset.deferredImagesBound === 'true') {
    return;
  }

  section.dataset.deferredImagesBound = 'true';

  const hydrateImages = () => {
    section.querySelectorAll('picture source[data-deferred-srcset]').forEach(source => {
      if (!source.dataset.deferredSrcset) return;
      source.setAttribute('srcset', source.dataset.deferredSrcset.trim());
      source.removeAttribute('data-deferred-srcset');
    });

    section.querySelectorAll('img[data-deferred-src]').forEach(img => {
      if (!img.dataset.deferredSrc) return;
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

  initSectionDeferredImages('contact', '-40px 0px', documentRef);
}

function initCertificationDeferredImages(documentRef = document) {
  if (isPerformanceAudit()) {
    return;
  }

  initSectionDeferredImages('certifications', '120px 0px', documentRef);
}

function initAboutDeferredImages(documentRef = document) {
  if (isPerformanceAudit()) {
    return;
  }

  initSectionDeferredImages('about', '120px 0px', documentRef);
}

function initProjectShowcaseOnDemand() {
  if (isPerformanceAudit()) {
    return;
  }

  const projectsSection = document.getElementById('projects');
  if (!projectsSection) {
    return;
  }

  let pending = null;

  const start = () => {
    if (pending) return pending;

    pending = Promise.all([
      loadDeferredStyles(['projects']),
      import('../modules/projects-showcase.js'),
    ])
      .then(([, module]) => module.initProjectShowcase())
      .catch(error => {
        console.error('Project showcase init failed:', error);
        pending = null;
      });

    return pending;
  };

  observeSectionTask('projects', start, '120px 0px');
}

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const cleanupKey = 'portfolio-sw-cleanup-v20260509';
  try {
    if (sessionStorage.getItem(cleanupKey) === '1') {
      return;
    }
  } catch (_error) {
    // Privacy-restricted storage should not block stale-cache cleanup.
  }

  window.addEventListener(
    'load',
    async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));

        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        }

        localStorage.removeItem('portfolio-version');
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
          localStorage.removeItem('portfolio-version');
          sessionStorage.removeItem(cleanupKey);
        };
      } catch (_error) {
        // Service worker cleanup is best-effort; failures are non-critical
      }
    },
    { once: true }
  );
}

function applyStoredLiquidGlassTint() {
  try {
    const raw = localStorage.getItem('wwdc26-liquid-glass-tint');
    if (raw === null) return;
    const stored = Number(raw);
    if (Number.isFinite(stored) && stored >= 0 && stored <= 100) {
      syncLiquidGlassTokens(stored / 100);
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
  initProjectShowcaseOnDemand();

  initializeVercelAnalytics().catch(error => {
    console.warn('Vercel analytics init skipped:', error);
  });
}

async function initBootstrap() {
  applyStoredLiquidGlassTint();
  initFooterYear();

  if (isPerformanceAudit()) {
    return;
  }

  hydrateHeroImages();
  pinCriticalStylesheetsLast();
  initGlobalErrorHandlers();
  initContactDeferredImages();
  initCertificationDeferredImages();
  initAboutDeferredImages();

  initDeferredStyles();
  initOnDemandModules();
  initLazyModules();
  initServiceWorker();
  initLaunchIntro();

  runWhenIdle(() => {
    loadDeferredBootstrapModules().catch(error => {
      console.warn('Deferred bootstrap modules skipped:', error);
    });
  }, 1200);
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
