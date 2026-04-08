/**
 * PORTFOLIO REACH ANALYTICS v4.0
 * ================================
 * Tracks portfolio viewership with accurate metrics for:
 * - Unique Visitors (30-minute session timeout)
 * - Total Page Views (every page load)
 * - Time-based breakdowns (Today, This Week, This Month)
 *
 * Data Storage: localStorage (persistent) + sessionStorage (session)
 * Privacy: No PII collected, anonymous counting only
 */
(function() {
  const reachCountEls = document.querySelectorAll('.reach-count');

  // Configuration constants
  const CONFIG = {
    // Session timeout in milliseconds (30 minutes)
    SESSION_TIMEOUT: 30 * 60 * 1000,
    // Storage keys for data organization
    KEYS: {
      TOTAL_VIEWS: 'portfolio_total_views_v4',
      UNIQUE_VISITORS: 'portfolio_unique_visitors_v4',
      LAST_VISIT: 'portfolio_last_visit_v4',
      SESSION_ID: 'portfolio_session_id_v4',
      DAILY_VIEWS: 'portfolio_daily_views_v4',
      WEEKLY_VIEWS: 'portfolio_weekly_views_v4',
      MONTHLY_VIEWS: 'portfolio_monthly_views_v4',
      FIRST_VISIT_DATE: 'portfolio_first_visit_v4'
    }
  };

  /**
   * Format number for display with smart rounding
   * - Shows exact number under 1,000
   * - Shows "1.2K" for thousands (1 decimal when needed)
   * - Shows "1.5M" for millions (1 decimal when needed)
   * - Shows "2B" for billions (no decimals for cleaner display)
   *
   * @param {number} num - The number to format
   * @returns {string} Formatted number string
   */
  function formatNumber(num) {
    // Validate input - treat null/undefined as 0, not "--"
    if (num === null || num === undefined) return '0';
    if (typeof num !== 'number') {
      num = parseFloat(num);
    }
    if (isNaN(num)) return '0';

    const absNum = Math.abs(num);

    // Billions (no decimals for cleaner billion display)
    if (absNum >= 1_000_000_000) {
      const billions = absNum / 1_000_000_000;
      // Show decimal only if significant (e.g., 1.5B but not 1.0B)
      return (billions % 1 >= 0.1 ? billions.toFixed(1) : Math.round(billions)) + 'B';
    }

    // Millions (show 1 decimal only if needed)
    if (absNum >= 1_000_000) {
      const millions = absNum / 1_000_000;
      // Check if decimal part is significant
      const rounded = Math.round(millions * 10) / 10;
      return (rounded % 1 !== 0 ? rounded.toFixed(1) : Math.round(millions)) + 'M';
    }

    // Thousands (show 1 decimal only if needed)
    if (absNum >= 1_000) {
      const thousands = absNum / 1_000;
      const rounded = Math.round(thousands * 10) / 10;
      return (rounded % 1 !== 0 ? rounded.toFixed(1) : Math.round(thousands)) + 'K';
    }

    // Under 1000: return exact number
    return Math.round(num).toString();
  }

  /**
   * Get current date in YYYY-MM-DD format for consistent storage
   */
  function getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get week identifier (YYYY-W##) for weekly tracking
   */
  function getWeekKey() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 604800000; // milliseconds in week
    const weekNum = Math.floor(diff / oneWeek) + 1;
    return `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
  }

  /**
   * Get month identifier (YYYY-MM) for monthly tracking
   */
  function getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  /**
   * Check if this is a new unique session (30-minute timeout)
   * Returns true if:
   * - No previous visit recorded
   * - Last visit was more than 30 minutes ago
   * - Session ID has changed
   *
   * @returns {boolean} true if this is a unique visitor session
   */
  function isNewUniqueSession() {
    try {
      const lastVisit = localStorage.getItem(CONFIG.KEYS.LAST_VISIT);
      const currentSessionId = sessionStorage.getItem(CONFIG.KEYS.SESSION_ID);

      // No previous visit = new unique visitor
      if (!lastVisit) return true;

      // Check time since last visit
      const lastVisitTime = parseInt(lastVisit, 10);
      const now = Date.now();
      const timeDiff = now - lastVisitTime;

      // Session expired (30+ minutes) = new unique visitor
      if (timeDiff > CONFIG.SESSION_TIMEOUT) return true;

      // No current session = new unique visitor
      if (!currentSessionId) return true;

      return false;
    } catch (e) {
      // Fallback: assume new session if storage fails
      return true;
    }
  }

  /**
   * Get or initialize counter from storage
   */
  function getCounter(key, defaultValue = 0) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * Get or initialize time-based counter from storage
   * Automatically resets if period (day/week/month) has changed
   */
  function getTimeBasedCounter(storageKey, periodKey) {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return { period: periodKey, count: 0 };

      const data = JSON.parse(stored);
      // If period changed, reset counter
      if (data.period !== periodKey) {
        return { period: periodKey, count: 0 };
      }
      return data;
    } catch (e) {
      return { period: periodKey, count: 0 };
    }
  }

  /**
   * Main analytics calculation - updates all metrics
   * Returns complete analytics data object
   */
  function calculateMetrics() {
    const now = Date.now();
    const todayKey = getTodayKey();
    const weekKey = getWeekKey();
    const monthKey = getMonthKey();

    // Check if this is a new unique visitor session
    const isUnique = isNewUniqueSession();

    // Get current counters
    const totalViews = getCounter(CONFIG.KEYS.TOTAL_VIEWS, 0) + 1;
    const uniqueVisitors = isUnique
      ? getCounter(CONFIG.KEYS.UNIQUE_VISITORS, 0) + 1
      : getCounter(CONFIG.KEYS.UNIQUE_VISITORS, 0);

    // Time-based counters
    const dailyData = getTimeBasedCounter(CONFIG.KEYS.DAILY_VIEWS, todayKey);
    const weeklyData = getTimeBasedCounter(CONFIG.KEYS.WEEKLY_VIEWS, weekKey);
    const monthlyData = getTimeBasedCounter(CONFIG.KEYS.MONTHLY_VIEWS, monthKey);

    // Update time-based counters
    dailyData.count += 1;
    weeklyData.count += 1;
    monthlyData.count += 1;

    // Track first visit for portfolio age calculation
    const firstVisit = localStorage.getItem(CONFIG.KEYS.FIRST_VISIT_DATE);
    if (!firstVisit) {
      localStorage.setItem(CONFIG.KEYS.FIRST_VISIT_DATE, now.toString());
    }

    // Generate new session ID if needed
    const sessionId = isUnique ? `session_${now}_${Math.random().toString(36).substr(2, 9)}` : sessionStorage.getItem(CONFIG.KEYS.SESSION_ID);

    // Persist all data
    try {
      localStorage.setItem(CONFIG.KEYS.TOTAL_VIEWS, totalViews.toString());
      localStorage.setItem(CONFIG.KEYS.UNIQUE_VISITORS, uniqueVisitors.toString());
      localStorage.setItem(CONFIG.KEYS.LAST_VISIT, now.toString());
      localStorage.setItem(CONFIG.KEYS.DAILY_VIEWS, JSON.stringify({ period: todayKey, count: dailyData.count }));
      localStorage.setItem(CONFIG.KEYS.WEEKLY_VIEWS, JSON.stringify({ period: weekKey, count: weeklyData.count }));
      localStorage.setItem(CONFIG.KEYS.MONTHLY_VIEWS, JSON.stringify({ period: monthKey, count: monthlyData.count }));
      sessionStorage.setItem(CONFIG.KEYS.SESSION_ID, sessionId);
    } catch (e) {
      console.debug('[Portfolio Reach] Storage failed (private browsing):', e.message);
    }

    // Calculate derived metrics
    const firstVisitTime = firstVisit ? parseInt(firstVisit, 10) : now;
    const portfolioAgeDays = Math.max(1, Math.floor((now - firstVisitTime) / (24 * 60 * 60 * 1000)));
    const avgViewsPerDay = (totalViews / portfolioAgeDays).toFixed(1);

    return {
      // Core metrics
      totalViews,
      uniqueVisitors,
      isNewSession: isUnique,
      sessionId,

      // Time-based metrics
      today: dailyData.count,
      thisWeek: weeklyData.count,
      thisMonth: monthlyData.count,

      // Derived metrics
      portfolioAgeDays,
      avgViewsPerDay,

      // Metadata
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Fallback metrics for private browsing mode
   */
  function getFallbackMetrics() {
    const sessionCount = parseInt(sessionStorage.getItem('portfolio_fallback_count') || '0', 10) + 1;
    sessionStorage.setItem('portfolio_fallback_count', sessionCount.toString());

    return {
      totalViews: sessionCount,
      uniqueVisitors: 1, // Can't track across sessions
      isNewSession: true,
      today: sessionCount,
      thisWeek: sessionCount,
      thisMonth: sessionCount,
      portfolioAgeDays: 1,
      avgViewsPerDay: sessionCount.toFixed(1),
      lastUpdated: new Date().toISOString(),
      isFallback: true
    };
  }

  /**
   * Get all metrics with graceful fallback
   */
  function getMetrics() {
    try {
      // Test storage availability
      localStorage.setItem('test', '1');
      localStorage.removeItem('test');
      return calculateMetrics();
    } catch (e) {
      // Storage not available (private browsing)
      return getFallbackMetrics();
    }
  }

  /**
   * Update the UI display with formatted metrics
   */
  function updateDisplay() {
    if (!reachCountEls || reachCountEls.length === 0) return;

    const metrics = getMetrics();

    // Format the primary display number
    // Strategy: Show unique visitors (more meaningful than raw views)
    const displayValue = metrics.uniqueVisitors;
    const formatted = formatNumber(displayValue);

    // Enhanced tooltip with full breakdown
    const tooltipLines = [
      `Total Views: ${formatNumber(metrics.totalViews)}`,
      `Unique Visitors: ${formatNumber(metrics.uniqueVisitors)}`,
      ``,
      `Today: ${formatNumber(metrics.today)}`,
      `This Week: ${formatNumber(metrics.thisWeek)}`,
      `This Month: ${formatNumber(metrics.thisMonth)}`,
      ``,
      `Avg ${metrics.avgViewsPerDay}/day`,
      `Age: ${metrics.portfolioAgeDays} day${metrics.portfolioAgeDays !== 1 ? 's' : ''}`
    ];
    const tooltipText = tooltipLines.join('\n');

    reachCountEls.forEach(el => {
      el.textContent = formatted;
      // If the parent is the badge container, update its title too
      if (el.parentElement && el.parentElement.classList.contains('portfolio-reach-badge')) {
        el.parentElement.setAttribute('title', tooltipText);
      } else {
        el.setAttribute('title', tooltipText);
      }
    });

    // Log metrics for debugging (development only)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[Portfolio Reach] Metrics:', metrics);
    }
  }

  // Initialize on page load
  if (reachCountEls && reachCountEls.length > 0) {
    // Small delay to ensure DOM is ready
    setTimeout(updateDisplay, 50);

    // Also update on visibility change (returning to tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        updateDisplay();
      }
    });
  }
})();
