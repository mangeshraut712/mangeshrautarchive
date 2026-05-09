import ExternalApiKeys from '../modules/external-config.js';
import { initCurrentlySection } from '../modules/currently.js';
import { initAvatarToggle } from '../modules/avatar-toggle.js';
import { initOverlayMenu, initOverlayNavigation, initSmoothScroll } from '../modules/overlay.js';
import { initPortfolioFeatureUpgrades } from '../modules/portfolio-feature-upgrades.js';
import { initializeVercelAnalytics } from '../modules/vercel-analytics.js';

const IDLE_MODULES = ['../modules/accessibility.js'];

const DELAYED_MODULES = [];

const INTERACTION_MODULES = [
  '../modules/agentic-actions.js',
  '../modules/premium-enhancements.js',
  '../modules/birthday-celebration.js',
];

const SECTION_MODULES = [
  {
    sectionId: 'skills',
    modulePath: '../modules/skills-visualization.js',
    rootMargin: '900px 0px',
  },
  { sectionId: 'blog', modulePath: '../modules/blog-loader.js', rootMargin: '900px 0px' },
  { sectionId: 'contact', modulePath: '../modules/calendar.js', rootMargin: '1200px 0px' },
  {
    sectionId: 'currently-section',
    modulePath: '../modules/real-media-loader.js',
    rootMargin: '1200px 0px',
  },
  { sectionId: 'currently-section', modulePath: '../modules/lastfm.js', rootMargin: '1200px 0px' },
  {
    sectionId: 'debug-runner-section',
    modulePath: '../modules/debug-runner.js',
    rootMargin: '1200px 0px',
  },
];

const SECTION_STYLE_GROUPS = [
  { sectionId: 'about', styleKeys: ['about'], rootMargin: '900px 0px' },
  { sectionId: 'skills', styleKeys: ['skills'], rootMargin: '900px 0px' },
  { sectionId: 'experience', styleKeys: ['experience'], rootMargin: '900px 0px' },
  { sectionId: 'projects', styleKeys: ['projects'], rootMargin: '900px 0px' },
  { sectionId: 'education', styleKeys: ['education'], rootMargin: '900px 0px' },
  { sectionId: 'publications', styleKeys: ['publications'], rootMargin: '900px 0px' },
  { sectionId: 'awards', styleKeys: ['awards'], rootMargin: '900px 0px' },
  { sectionId: 'recommendations', styleKeys: ['recommendations'], rootMargin: '900px 0px' },
  { sectionId: 'certifications', styleKeys: ['certifications'], rootMargin: '900px 0px' },
  { sectionId: 'blog', styleKeys: ['blog'], rootMargin: '900px 0px' },
  { sectionId: 'contact', styleKeys: ['contact'], rootMargin: '1200px 0px' },
  { sectionId: 'debug-runner-section', styleKeys: ['game'], rootMargin: '1200px 0px' },
];

const FIRST_INTERACTION_STYLE_KEYS = ['interactive', 'motion', 'birthday'];

const deferredStyleLoads = new Map();

function createModuleLoader(modulePath) {
  let loaded = false;
  let pending = null;

  const load = async () => {
    if (loaded) return true;
    if (pending) return pending;

    pending = import(modulePath)
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

async function loadDeferredStyles(styleKeys = [], documentRef = document) {
  const uniqueKeys = [...new Set(styleKeys.filter(Boolean))];
  if (uniqueKeys.length === 0) return true;

  const links = uniqueKeys.flatMap(styleKey => getLazyStyleLinks(styleKey, documentRef));
  if (links.length === 0) return true;

  const results = await Promise.all(links.map(link => ensureDeferredStylesheetLoaded(link)));
  return results.every(Boolean);
}

async function loadModule(path) {
  try {
    await import(path);
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

function initLaunchIntro(documentRef = document) {
  const intro = documentRef.getElementById('launch-intro');
  if (!intro || intro.dataset.launchIntroBound === 'true') {
    return;
  }

  intro.dataset.launchIntroBound = 'true';

  const storageKey = 'portfolio-launch-intro-seen-v2026';
  const hasSeenIntro = () => {
    try {
      return sessionStorage.getItem(storageKey) === '1';
    } catch (_error) {
      return false;
    }
  };
  const markIntroSeen = () => {
    try {
      sessionStorage.setItem(storageKey, '1');
    } catch (_error) {
      // Privacy-restricted storage should not block the page.
    }
  };

  if (hasSeenIntro()) {
    intro.hidden = true;
    return;
  }

  markIntroSeen();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = documentRef.documentElement;
  const totalDuration = prefersReducedMotion ? 700 : 2600;
  const fadeDuration = 520;

  const complete = () => {
    if (intro.dataset.launchIntroComplete === 'true') return;

    intro.dataset.launchIntroComplete = 'true';
    intro.classList.add('is-exiting');
    root.classList.remove('launch-intro-active');

    window.setTimeout(() => {
      intro.hidden = true;
    }, fadeDuration);
  };

  root.classList.add('launch-intro-active');

  requestAnimationFrame(() => {
    intro.classList.add('is-playing');
  });

  window.setTimeout(complete, totalDuration);
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

      const [stylesLoaded, moduleLoaded] = await Promise.all([
        loadDeferredStyles(styleKeys, documentRef),
        moduleLoader.load(),
      ]);
      if (!stylesLoaded || !moduleLoaded) return;

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

      const [stylesLoaded, loaded] = await Promise.all([
        loadDeferredStyles(styleKeys, documentRef),
        moduleLoader.load(),
      ]);
      if (!loaded || !stylesLoaded) {
        return;
      }

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

  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(eventName => {
    window.addEventListener(eventName, loadInteractionStyles, {
      once: true,
      passive: eventName !== 'keydown',
      capture: true,
    });
  });

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

      ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(eventName => {
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

function initProjectShowcaseOnDemand() {
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

  observeSectionTask('projects', start, '500px 0px');
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

async function initBootstrap() {
  initLaunchIntro();
  initFooterYear();
  initGlobalErrorHandlers();

  initOverlayMenu();
  initOverlayNavigation();
  initSmoothScroll('a[href^="#"]:not(.nav-link):not(.menu-item)');
  initCurrentlySection();
  initAvatarToggle();
  initPortfolioFeatureUpgrades();
  initDeferredStyles();
  initOnDemandModules();
  initContactChatbotCTA(chatbotLoader);

  window.AssistMeConfig = Object.freeze({
    externalApis: ExternalApiKeys,
  });

  window.addEventListener(
    'load',
    () => {
      runWhenIdle(() => {
        initializeVercelAnalytics().catch(error => {
          console.warn('Vercel analytics init skipped:', error);
        });
      }, 2500);
    },
    { once: true }
  );

  initLazyModules();
  initServiceWorker();
  initProjectShowcaseOnDemand();
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
