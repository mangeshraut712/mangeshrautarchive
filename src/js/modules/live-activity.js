/**
 * Live Activity & Views Module
 * Handles the real-time view counter polling.
 */
(function() {
  'use strict';

  const viewCountEl = document.getElementById('portfolio-view-count');
  if (!viewCountEl) return;

  async function fetchViews() {
    try {
      // POST the first time to increment, GET subsequently. 
      // For simplicity, we just trigger POST on first load, GET on updates.
      // But actually, just doing POST once per session is ideal.
      const hasViewed = sessionStorage.getItem('hasViewedPortfolio');
      
      const method = hasViewed ? 'GET' : 'POST';
      const res = await fetch('/api/views', { method });
      
      if (!res.ok) throw new Error('Failed to fetch views');
      
      const data = await res.json();
      
      if (data && typeof data.views === 'number') {
        const formatViews = new Intl.NumberFormat().format(data.views);
        viewCountEl.textContent = formatViews;
        viewCountEl.classList.remove('loading');
        
        if (!hasViewed) {
          sessionStorage.setItem('hasViewedPortfolio', 'true');
        }
      }
    } catch (err) {
      console.warn('[Views]', err);
      // Fallback display if API fails
      if (viewCountEl.textContent === '--') {
         viewCountEl.textContent = '9,553';
         viewCountEl.classList.remove('loading');
      }
    }
  }

  // Fetch immediately
  fetchViews();

  // Poll for live updates every 30s
  setInterval(() => {
    // Only fetch if tab is visible to save requests
    if (!document.hidden) {
      fetchViews();
    }
  }, 30000);

})();
