/**
 * Vercel Web Analytics Module
 *
 * This module initializes and injects Vercel Web Analytics on the client side.
 * It imports the inject() function from @vercel/analytics and calls it
 * to enable analytics tracking for the application.
 *
 * Reference: https://vercel.com/docs/analytics
 */

import { track } from '@vercel/analytics';

/**
 * Initialize Vercel Web Analytics
 *
 * This function imports the analytics library and calls inject()
 * to set up tracking. It must run on the client side.
 * Also exposes track function globally for AnalyticsService.
 *
 * @returns {Promise<void>}
 */
export async function initializeVercelAnalytics() {
  try {
    // Dynamically import the Vercel Analytics package
    const { inject } = await import('@vercel/analytics');

    // Call inject() to initialize analytics tracking
    inject();

    // Expose track function globally so AnalyticsService can use it
    if (typeof window !== 'undefined') {
      window.__vercel_insights_track = track;
      window.va = (event, properties) => track(event, properties);
    }

    console.log('✓ Vercel Web Analytics initialized successfully');
  } catch (error) {
    // Silently fail - analytics is not critical to app functionality
    if (window.location.hostname !== 'localhost') {
      console.warn('⚠ Vercel Web Analytics initialization failed:', error.message);
    }
  }
}
