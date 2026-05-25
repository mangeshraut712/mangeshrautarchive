/**
 * Performance utilities for lazy loading, debouncing, and optimization
 * @module utils/performance
 */

/**
 * IntersectionObserver configuration for lazy loading
 * @const {IntersectionObserverInit}
 */
const LAZY_LOAD_CONFIG = {
  root: null,
  rootMargin: '50px 0px',
  threshold: 0.01
};

/**
 * Creates an IntersectionObserver for lazy loading elements
 * @param {string} selector - CSS selector for elements to observe
 * @param {Function} callback - Callback when element enters viewport
 * @param {Object} [options] - Observer options
 * @returns {IntersectionObserver|null} Observer instance or null if not supported
 * @example
 * const observer = createLazyObserver('.lazy-image', (el) => {
 *   el.src = el.dataset.src;
 *   el.classList.add('loaded');
 * });
 */
export function createLazyObserver(selector, callback, options = {}) {
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all elements immediately
    document.querySelectorAll(selector).forEach(callback);
    return null;
  }

  const config = { ...LAZY_LOAD_CONFIG, ...options };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, config);

  document.querySelectorAll(selector).forEach(el => observer.observe(el));
  return observer;
}

/**
 * Debounces a function to limit execution rate
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 * @example
 * const debouncedSearch = debounce((query) => searchAPI(query), 300);
 * searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttles a function to execute at most once per period
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 * @example
 * const throttledScroll = throttle(handleScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(fn, limit = 100) {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Prefetches a resource for faster subsequent navigation
 * @param {string} url - URL to prefetch
 * @param {string} [as='document'] - Resource type (document, style, script, image, etc.)
 * @returns {HTMLLinkElement|null} Link element or null
 */
export function prefetch(url, as = 'document') {
  if (!url || typeof document === 'undefined') return null;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = as;
  
  // Only add if not already present
  const existing = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
  if (!existing) {
    document.head.appendChild(link);
  }
  
  return link;
}

/**
 * Preconnects to a domain for faster resource loading
 * @param {string} domain - Domain to preconnect (e.g., 'https://api.example.com')
 * @returns {HTMLLinkElement|null} Link element or null
 */
export function preconnect(domain) {
  if (!domain || typeof document === 'undefined') return null;
  
  const existing = document.querySelector(`link[rel="preconnect"][href="${domain}"]`);
  if (existing) return existing;
  
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  link.crossOrigin = 'anonymous';
  
  document.head.appendChild(link);
  return link;
}

/**
 * Measures web vitals using the Performance API
 * @param {Function} callback - Callback with vital metrics
 * @returns {Function} Cleanup function
 * @example
 * const cleanup = measureWebVitals((metric) => {
 *   console.log(`${metric.name}: ${metric.value}`);
 * });
 */
export function measureWebVitals(callback) {
  if (!('performance' in window)) {
    return () => {};
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      callback({
        name: entry.name,
        value: entry.value || entry.startTime,
        rating: entry.rating || 'good',
        delta: entry.delta
      });
    }
  });

  try {
    observer.observe({ entryTypes: ['web-vitals'] });
  } catch (e) {
    // Fallback for browsers that don't support web-vitals entry type
    observer.observe({ entryTypes: ['measure', 'navigation'] });
  }

  return () => observer.disconnect();
}

/**
 * Loads a script asynchronously with Promise support
 * @param {string} src - Script URL
 * @param {Object} [options] - Loading options
 * @returns {Promise<HTMLScriptElement>} Promise resolving to script element
 * @example
 * await loadScript('https://cdn.example.com/lib.js', { async: true });
 */
export function loadScript(src, options = {}) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Script src is required'));
      return;
    }

    // Check if already loaded
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve(existing);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    
    if (options.async) script.async = true;
    if (options.defer) script.defer = true;
    if (options.module) script.type = 'module';
    if (options.crossOrigin) script.crossOrigin = options.crossOrigin;
    if (options.integrity) script.integrity = options.integrity;

    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}

/**
 * Batch processes an array of items with concurrency control
 * @param {Array} items - Items to process
 * @param {Function} processor - Async function to process each item
 * @param {number} [concurrency=3] - Maximum concurrent operations
 * @returns {Promise<Array>} Array of results
 * @example
 * const results = await batchProcess(urls, fetchImage, 5);
 */
export async function batchProcess(items, processor, concurrency = 3) {
  const results = [];
  const executing = [];

  for (const [index, item] of items.entries()) {
    const promise = processor(item, index).then(result => {
      results[index] = result;
      return result;
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }

    // Clean up completed promises
    executing.splice(0, executing.findIndex(p => p === promise), 1);
  }

  await Promise.all(executing);
  return results;
}

/**
 * Memoizes a function to cache results
 * @param {Function} fn - Function to memoize
 * @param {Function} [keyGenerator] - Function to generate cache key from arguments
 * @returns {Function} Memoized function
 * @example
 * const memoizedFetch = memoize(fetchUser, (id) => `user-${id}`);
 */
export function memoize(fn, keyGenerator = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  
  return function(...args) {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
}

/**
 * Schedules a callback during browser idle time
 * @param {Function} callback - Function to execute
 * @param {Object} [options] - Idle callback options
 * @returns {number|null} Request ID or null
 */
export function requestIdleCallback(callback, options = {}) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Fallback using setTimeout
  return setTimeout(callback, 1);
}

/**
 * Cancels an idle callback
 * @param {number} id - Request ID from requestIdleCallback
 */
export function cancelIdleCallback(id) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

export default {
  createLazyObserver,
  debounce,
  throttle,
  prefetch,
  preconnect,
  measureWebVitals,
  loadScript,
  batchProcess,
  memoize,
  requestIdleCallback,
  cancelIdleCallback
};
