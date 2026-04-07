/**
 * Vercel Web Analytics Module
 *
 * This module initializes and injects Vercel Web Analytics on the client side.
 * It imports the inject() function from @vercel/analytics and calls it
 * to enable analytics tracking for the application.
 *
 * Reference: https://vercel.com/docs/analytics
 */

// Use global script loading instead of module imports for browser compatibility
const VERCEL_ANALYTICS_SCRIPT = 'https://cdn.jsdelivr.net/npm/@vercel/analytics@1.1.1/dist/index.global.js';

/**
 * Initialize Vercel Web Analytics
 *
 * This function loads the analytics library from CDN and initializes it.
 * It must run on the client side.
 *
 * @returns {Promise<void>}
 */
export async function initializeVercelAnalytics() {
  // Skip in development/local environments
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('ℹ️ Vercel Analytics skipped in development');
    return;
  }

  try {
    // Check if already loaded
    if (window.va) {
      console.log('✓ Vercel Web Analytics already loaded');
      return;
    }

    // Load script dynamically
    await loadScript(VERCEL_ANALYTICS_SCRIPT);

    // Initialize if available
    if (window.va) {
      window.va('event', { name: 'page_view' });
      console.log('✓ Vercel Web Analytics initialized');
    }
  } catch (error) {
    // Silently fail - analytics is not critical to app functionality
    console.warn('⚠ Vercel Web Analytics initialization failed:', error.message);
  }
}

/**
 * Load a script dynamically
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
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
