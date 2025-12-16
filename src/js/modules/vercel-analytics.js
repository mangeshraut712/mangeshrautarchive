/**
 * Vercel Web Analytics Module
 * 
 * This module initializes and injects Vercel Web Analytics on the client side.
 * It imports the inject() function from @vercel/analytics and calls it
 * to enable analytics tracking for the application.
 * 
 * Reference: https://vercel.com/docs/analytics
 */

/**
 * Initialize Vercel Web Analytics
 * 
 * This function imports the analytics library and calls inject()
 * to set up tracking. It must run on the client side.
 * 
 * @returns {Promise<void>}
 */
export async function initializeVercelAnalytics() {
    try {
        // Dynamically import the Vercel Analytics package
        const { inject } = await import('@vercel/analytics');
        
        // Call inject() to initialize analytics tracking
        inject();
        
        console.log('✓ Vercel Web Analytics initialized successfully');
    } catch (error) {
        // Silently fail - analytics is not critical to app functionality
        console.warn('⚠ Vercel Web Analytics initialization failed:', error.message);
    }
}

/**
 * Fallback: Use the Vercel CDN script
 * 
 * If dynamic import fails, the CDN script tag in HTML serves as a fallback.
 * The CDN script automatically initializes analytics if available.
 */
