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
  { sectionId: 'debug-runner-section', modulePath: '../modules/debug-runner.js' },
];

function createModuleLoader(modulePath) {
  let loaded = false;
  let pendingPromise = null;

  return {
    async load() {
      if (loaded) return true;

      if (!pendingPromise) {
        pendingPromise = import(modulePath)
          .then(() => {
            loaded = true;
            return true;
          })
          .catch(error => {
            console.warn(`Lazy load failed for ${modulePath}`, error);
            return false;
          })
          .finally(() => {
            pendingPromise = null;
          });
      }

      return pendingPromise;
    },
    isLoaded() {
      return loaded;
    },
  };
}

const chatbotLoader = createModuleLoader('../modules/chatbot.js');
const searchLoader = createModuleLoader('../modules/search.js');

function initFooterYear() {
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
}

function initGlobalErrorHandlers() {
  if (window.__portfolioErrorHandlersBound) return;

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

function initContactChatbotCTA(loader, root = document) {
  // Handle both old CTA button and new chat bubble buttons
  const buttons = [
    root.getElementById('contact-chatbot-cta'),
    root.getElementById('contact-chat-btn'),
    root.getElementById('footer-chat-btn')
  ].filter(Boolean);

  buttons.forEach(button => {
    if (button.dataset.chatbotBound === 'true') return;
    button.dataset.chatbotBound = 'true';

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      await loader.load();

      if (window.appleIntelligenceChatbot && typeof window.appleIntelligenceChatbot.ask === 'function') {
        window.appleIntelligenceChatbot.ask('I want to contact Mangesh about a project opportunity.');
        return;
      }

      // Toggle chatbot widget
      const chatbotWidget = root.getElementById('chatbot-widget');
      const chatbotToggle = root.getElementById('chatbot-toggle');
      
      if (chatbotWidget) {
        chatbotWidget.classList.remove('hidden');
        chatbotWidget.classList.add('flex');
        // Focus on chat input if available
        setTimeout(() => {
          const chatInput = chatbotWidget.querySelector('input[type="text"], textarea');
          if (chatInput) chatInput.focus();
        }, 100);
      } else if (chatbotToggle) {
        chatbotToggle.click();
      }
    });
  });
}

function bindInteractionModuleLoader(elementId, loader, replayClick = true, root = document) {
  const element = root.getElementById(elementId);
  if (!element || element.dataset.lazyModuleBound === 'true') return;

  element.dataset.lazyModuleBound = 'true';
  element.addEventListener(
    'click',
    async event => {
      if (loader.isLoaded()) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();

      const didLoad = await loader.load();
      if (didLoad && replayClick) {
        requestAnimationFrame(() => {
          element.click();
        });
      }
    },
    { capture: true }
  );
}

function bindSearchShortcutLoader(loader, root = document) {
  if (root.body?.dataset.searchShortcutBound === 'true') return;

  if (root.body) {
    root.body.dataset.searchShortcutBound = 'true';
  }

  root.addEventListener(
    'keydown',
    async event => {
      const shortcutPressed = (event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey);
      if (!shortcutPressed || loader.isLoaded()) return;

      event.preventDefault();
      const didLoad = await loader.load();
      if (didLoad) {
        requestAnimationFrame(() => {
          root.getElementById('search-toggle')?.click();
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

function initHashNavigationStabilizer(root = document) {
  if (root.body?.dataset.hashNavStabilizerBound === 'true') return;
  if (root.body) {
    root.body.dataset.hashNavStabilizerBound = 'true';
  }

  let pendingTimers = [];
  let pendingInterval = null;
  let interactionAbortController = null;
  let pendingResizeObserver = null;

  const clearPendingWork = () => {
    pendingTimers.forEach(timerId => {
      window.clearTimeout(timerId);
    });
    pendingTimers = [];

    if (pendingInterval) {
      window.clearInterval(pendingInterval);
      pendingInterval = null;
    }

    interactionAbortController?.abort();
    interactionAbortController = null;

    pendingResizeObserver?.disconnect();
    pendingResizeObserver = null;
  };

  const alignToHash = hashValue => {
    const sectionId = String(hashValue || '').replace('#', '').trim();
    if (!sectionId) return;

    const section = root.getElementById(sectionId);
    const nav = root.querySelector('.global-nav');
    if (!section || !nav) return;

    const navOffset = (nav.offsetHeight || 60) + 12;
    const targetTop = Math.max(0, section.getBoundingClientRect().top + window.scrollY - navOffset);

    if (Math.abs(window.scrollY - targetTop) > 18) {
      const html = root.documentElement;
      const previousInlineBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo({ top: targetTop, behavior: 'auto' });
      requestAnimationFrame(() => {
        html.style.scrollBehavior = previousInlineBehavior;
      });
    }
  };

  const bindInteractionCancel = () => {
    interactionAbortController?.abort();
    interactionAbortController = new AbortController();

    ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(eventName => {
      window.addEventListener(eventName, clearPendingWork, {
        once: true,
        passive: eventName !== 'keydown',
        capture: true,
        signal: interactionAbortController.signal,
      });
    });
  };

  const scheduleAlignment = hashValue => {
    clearPendingWork();

    alignToHash(hashValue);
    bindInteractionCancel();

    if ('ResizeObserver' in window) {
      pendingResizeObserver = new ResizeObserver(() => {
        alignToHash(hashValue);
      });

      pendingResizeObserver.observe(root.documentElement);
      if (root.body) {
        pendingResizeObserver.observe(root.body);
      }
    }

    pendingInterval = window.setInterval(() => {
      alignToHash(hashValue);
    }, 160);

    [700, 1400, 2200, 3000].forEach(delay => {
      const timerId = window.setTimeout(() => {
        alignToHash(hashValue);
      }, delay);

      pendingTimers.push(timerId);
    });

    pendingTimers.push(
      window.setTimeout(() => {
        clearPendingWork();
      }, 3200)
    );
  };

  window.addEventListener('hashchange', () => {
    scheduleAlignment(window.location.hash);
  });

  window.addEventListener('portfolio:sectionchange', event => {
    scheduleAlignment(`#${event.detail?.sectionId || ''}`);
  });

  if (window.location.hash) {
    scheduleAlignment(window.location.hash);
  }
}

function runWhenIdle(callback, timeout = 1500) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback(), { timeout });
    return;
  }

  window.setTimeout(callback, timeout);
}

async function loadModule(modulePath) {
  try {
    await import(modulePath);
  } catch (error) {
    console.warn(`Lazy load failed for ${modulePath}`, error);
  }
}

function lazyLoadSectionModule(sectionId, modulePath, rootMargin = '300px 0px') {
  const section = document.getElementById(sectionId);
  if (!section) return;

  let loaded = false;
  let observer = null;
  const hashTarget = `#${sectionId}`;

  const cleanup = () => {
    observer?.disconnect();
    observer = null;
    window.removeEventListener('hashchange', onHashChange);
  };

  const load = () => {
    if (loaded) return;
    loaded = true;
    cleanup();
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
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        load();
      }
    }, { rootMargin });

    observer.observe(section);
    window.addEventListener('hashchange', onHashChange);
    return;
  }

  load();
}

function initLazyModules() {
  if (window.__portfolioLazyModulesBound) return;

  window.__portfolioLazyModulesBound = true;

  window.addEventListener(
    'load',
    () => {
      const loadRuntimeModules = () => {
        RUNTIME_MODULES.forEach(modulePath => {
          loadModule(modulePath);
        });

        if (window.innerWidth > 1024 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          loadModule('../modules/3d-background.js');
        }
      };

      let runtimeTriggered = false;
      const triggerRuntimeModules = () => {
        if (runtimeTriggered) return;
        runtimeTriggered = true;
        runWhenIdle(loadRuntimeModules, 600);
      };

      ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(eventName => {
        window.addEventListener(eventName, triggerRuntimeModules, {
          once: true,
          passive: eventName !== 'keydown',
          capture: true,
        });
      });

      window.setTimeout(triggerRuntimeModules, 12000);

      SECTION_MODULES.forEach(({ sectionId, modulePath }) => {
        lazyLoadSectionModule(sectionId, modulePath);
      });
    },
    { once: true }
  );
}

function initProjectShowcaseOnDemand() {
  const projectsSection = document.getElementById('projects');
  let initialized = false;

  const loadProjects = () => {
    if (initialized) return;
    initialized = true;

    initProjectShowcase().catch(error => {
      console.error('Project showcase init failed:', error);
    });
  };

  if (!projectsSection) {
    runWhenIdle(loadProjects, 2000);
    return;
  }

  if (window.location.hash === '#projects') {
    loadProjects();
    return;
  }

  if ('IntersectionObserver' in window) {
    let observer = null;
    const onHashChange = () => {
      if (window.location.hash === '#projects') {
        loadProjects();
        observer?.disconnect();
        window.removeEventListener('hashchange', onHashChange);
      }
    };

    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        loadProjects();
        observer?.disconnect();
        window.removeEventListener('hashchange', onHashChange);
      }
    }, { rootMargin: '350px 0px' });

    observer.observe(projectsSection);
    window.addEventListener('hashchange', onHashChange);
    return;
  }

  runWhenIdle(loadProjects, 2000);
}

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const hostname = window.location.hostname;
  const disableServiceWorker = /no-sw=1/.test(window.location.search);

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (sessionStorage.getItem('local-sw-cleanup-done') === '1') return;

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

  if (disableServiceWorker) return;

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
  initHashNavigationStabilizer();
  initOverlayMenu();
  initOverlayNavigation();
  initSmoothScroll('a[href^="#"]:not(.nav-link):not(.menu-item)');
  initOnDemandModules();
  initContactChatbotCTA(chatbotLoader);

  window.AssistMeConfig = Object.freeze({ externalApis: ExternalApiKeys });

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
