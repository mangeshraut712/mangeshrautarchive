/**
 * Vercel Web Analytics Module
 *
 * This module initializes and injects Vercel Web Analytics on the client side.
 * It imports the inject() function from @vercel/analytics and calls it
 * to enable analytics tracking for the application.
 *
 * Reference: https://vercel.com/docs/analytics
 */

const VERCEL_ANALYTICS_SCRIPT = '/_vercel/insights/script.js';

function isLocalHost(hostname = '') {
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
}

function shouldEnableVercelAnalytics(hostname = '') {
  if (!hostname || isLocalHost(hostname)) {
    return false;
  }

  return !hostname.endsWith('.github.io');
}

/**
 * Initialize Vercel Web Analytics
 *
 * This function loads the analytics library from CDN and initializes it.
 * It must run on the client side.
 *
 * @returns {Promise<void>}
 */
export async function initializeVercelAnalytics() {
  const hostname = window.location.hostname || '';

  if (!shouldEnableVercelAnalytics(hostname)) {
    console.log('ℹ️ Vercel Analytics skipped on this host');
    return;
  }

  try {
    if (window.__vercelAnalyticsReady) {
      console.log('✓ Vercel Web Analytics already loaded');
      return;
    }

    window.va =
      window.va ||
      function () {
        (window.vaq = window.vaq || []).push(arguments);
      };

    await loadScript(VERCEL_ANALYTICS_SCRIPT);

    if (window.va) {
      window.__vercelAnalyticsReady = true;
      window.dispatchEvent(new CustomEvent('vercel-analytics-ready'));
      console.log('✓ Vercel Web Analytics initialized');
    }
  } catch (error) {
    console.warn('⚠ Vercel Web Analytics initialization failed:', error.message);
  }
}

/**
 * Load a script dynamically
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Track an event (noop if analytics not available)
 */
export function track(event, properties) {
  if (window.va) {
    window.va('event', { name: event, ...properties });
  }
}
