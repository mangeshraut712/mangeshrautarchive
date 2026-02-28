import { initProjectShowcase } from '../modules/projects-showcase.js';
import ExternalApiKeys from '../modules/external-config.js';
import { initOverlayMenu, initOverlayNavigation, initSmoothScroll } from '../modules/overlay.js';
import { initializeVercelAnalytics } from '../modules/vercel-analytics.js';

const RUNTIME_MODULES = [
  '../modules/agentic-actions.js',
  '../modules/accessibility.js',
  '../modules/premium-enhancements.js',
  '../modules/birthday-celebration.js',
];

const SECTION_MODULES = [
  { sectionId: 'skills', modulePath: '../modules/skills-visualization.js' },
  { sectionId: 'blog', modulePath: '../modules/blog-loader.js' },
  { sectionId: 'contact', modulePath: '../modules/calendar.js' },
  {
    sectionId: 'debug-runner-section',
    modulePath: '../modules/debug-runner.js',
  },
];

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

function initFooterYear() {
  const year = document.getElementById('current-year');
  if (year) {
    year.textContent = String(new Date().getFullYear());
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
    await chatbotModuleLoader.load();
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

function bindInteractionModuleLoader(
  elementId,
  moduleLoader,
  replay = true,
  documentRef = document
) {
  const element = documentRef.getElementById(elementId);
  if (!element || element.dataset.lazyModuleBound === 'true') return;

  element.dataset.lazyModuleBound = 'true';

  element.addEventListener(
    'click',
    async event => {
      if (moduleLoader.isLoaded()) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();

      const loaded = await moduleLoader.load();
      if (!loaded) return;

      if (replay) {
        requestAnimationFrame(() => {
          element.click();
        });
      }
    },
    { capture: true }
  );
}

function initOnDemandModules() {
  bindInteractionModuleLoader('chatbot-toggle', chatbotLoader, true);
  bindInteractionModuleLoader('search-toggle', searchLoader, true);
  bindSearchShortcutLoader(searchLoader);
}

function runWhenIdle(callback, timeout = 1500) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback(), { timeout });
    return;
  }

  setTimeout(callback, timeout);
}

function bindSearchShortcutLoader(moduleLoader, documentRef = document) {
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
      if (!isShortcut || moduleLoader.isLoaded()) {
        return;
      }

      event.preventDefault();

      const loaded = await moduleLoader.load();
      if (!loaded) {
        return;
      }

      requestAnimationFrame(() => {
        documentRef.getElementById('search-toggle')?.click();
      });
    },
    { capture: true }
  );
}

async function loadModule(path) {
  try {
    await import(path);
  } catch (error) {
    console.warn(`Lazy load failed for ${path}`, error);
  }
}

function lazyLoadSectionModule(sectionId, modulePath, rootMargin = '300px 0px') {
  const section = document.getElementById(sectionId);
  if (!section) return;

  let loaded = false;
  let observer = null;
  const hashTarget = `#${sectionId}`;

  const load = () => {
    if (loaded) return;
    loaded = true;
    if (observer) observer.disconnect();
    window.removeEventListener('hashchange', onHashChange);
    loadModule(modulePath);
  };

  const onHashChange = () => {
    if (window.location.hash === hashTarget) {
      load();
    }
  };

  if (window.location.hash === hashTarget) {
    load();
    return;
  }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          load();
        }
      },
      { rootMargin }
    );

    observer.observe(section);
    window.addEventListener('hashchange', onHashChange);
    return;
  }

  load();
}

function initLazyModules() {
  if (window.__portfolioLazyModulesBound) {
    return;
  }
  window.__portfolioLazyModulesBound = true;

  window.addEventListener(
    'load',
    () => {
      const loadRuntimeModules = () => {
        RUNTIME_MODULES.forEach(path => {
          loadModule(path);
        });

        if (
          window.innerWidth > 1024 &&
          !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          loadModule('../modules/3d-background.js');
        }
      };

      let runtimeModulesScheduled = false;
      const scheduleRuntimeModules = () => {
        if (runtimeModulesScheduled) return;
        runtimeModulesScheduled = true;
        runWhenIdle(loadRuntimeModules, 600);
      };

      ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(eventName => {
        window.addEventListener(eventName, scheduleRuntimeModules, {
          once: true,
          passive: eventName !== 'keydown',
          capture: true,
        });
      });

      // Fallback for passive sessions where no interaction occurs.
      setTimeout(scheduleRuntimeModules, 12000);

      SECTION_MODULES.forEach(({ sectionId, modulePath }) => {
        lazyLoadSectionModule(sectionId, modulePath);
      });
    },
    { once: true }
  );
}

function initProjectShowcaseOnDemand() {
  const projectsSection = document.getElementById('projects');
  let started = false;

  const start = () => {
    if (started) return;
    started = true;

    initProjectShowcase().catch(error => {
      console.error('Project showcase init failed:', error);
    });
  };

  if (!projectsSection) {
    runWhenIdle(start, 2000);
    return;
  }

  if (window.location.hash === '#projects') {
    start();
    return;
  }

  if ('IntersectionObserver' in window) {
    let observer = null;
    const onHashChange = () => {
      if (window.location.hash === '#projects') {
        start();
        observer?.disconnect();
        window.removeEventListener('hashchange', onHashChange);
      }
    };

    observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          start();
          observer?.disconnect();
          window.removeEventListener('hashchange', onHashChange);
        }
      },
      { rootMargin: '350px 0px' }
    );

    observer.observe(projectsSection);
    window.addEventListener('hashchange', onHashChange);
    return;
  }

  runWhenIdle(start, 2000);
}

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const host = window.location.hostname;
  const disableSW = /no-sw=1/.test(window.location.search);
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  if (isLocal) {
    const alreadyCleaned = sessionStorage.getItem('local-sw-cleanup-done') === '1';
    if (alreadyCleaned) {
      return;
    }

    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('ServiceWorker unregistered for local development');
      });
    });

    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    sessionStorage.setItem('local-sw-cleanup-done', '1');
    return;
  }

  if (disableSW) {
    return;
  }

  window.addEventListener(
    'load',
    () => {
      navigator.serviceWorker
        .register('service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope:', registration.scope);
          registration.update().catch(() => {});
        })
        .catch(error => {
          console.log('ServiceWorker registration failed:', error);
        });
    },
    { once: true }
  );
}

async function initBootstrap() {
  initFooterYear();
  initGlobalErrorHandlers();

  initOverlayMenu();
  initOverlayNavigation();
  initSmoothScroll('a[href^="#"]:not(.nav-link):not(.menu-item)');
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
