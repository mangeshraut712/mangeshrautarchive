/**
 * Health Widget Module
 * Manages Whoop and Withings metrics, localStorage persistence, 
 * UI updates, count-up/highlight animations, and synchronization triggers.
 */

const DEFAULT_METRICS = {
  sleep: 81,      // %
  recovery: 47,   // %
  strain: 5.2,    // 0-21 scale
  weight: 103.4,  // kg
  muscle: 68.4,   // %
  fat: 28.1,      // %
  lastSynced: null
};

class HealthWidget {
  constructor() {
    this.storageKey = 'mangesh_health_metrics';
    this.metrics = this.loadMetrics();
    this.init();
  }

  loadMetrics() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure all required fields exist
        return { ...DEFAULT_METRICS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to read health metrics from localStorage:', e);
    }
    
    // Default fallback
    const metrics = { ...DEFAULT_METRICS };
    metrics.lastSynced = Date.now() - 3.5 * 60 * 60 * 1000; // ~3.5 hours ago
    return metrics;
  }

  saveMetrics() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.metrics));
    } catch (e) {
      console.error('Failed to save health metrics to localStorage:', e);
    }
  }

  init() {
    // Only bind if the container exists
    const container = document.getElementById('health-content');
    if (!container) return;

    this.updateUI();
    this.startRelativeTimeUpdater();
  }

  updateUI() {
    // Whoop elements
    this.setTextContent('whoop-sleep-val', `${Math.round(this.metrics.sleep)}%`);
    this.setTextContent('whoop-recovery-val', `${Math.round(this.metrics.recovery)}%`);
    this.setTextContent('whoop-strain-val', this.metrics.strain.toFixed(1));

    // Withings elements
    this.setTextContent('withings-weight-val', this.metrics.weight.toFixed(1));
    this.setTextContent('withings-muscle-val', this.metrics.muscle.toFixed(1));
    this.setTextContent('withings-fat-val', this.metrics.fat.toFixed(1));

    // Last Synced
    this.updateSyncedTimeText();
  }

  setTextContent(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  updateSyncedTimeText() {
    const el = document.getElementById('health-sync-text');
    if (!el) return;

    if (!this.metrics.lastSynced) {
      el.textContent = 'Last synced: Just now';
      return;
    }

    const diffMs = Date.now() - this.metrics.lastSynced;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) {
      el.textContent = 'Last synced: Just now';
    } else if (diffMin === 1) {
      el.textContent = 'Last synced: 1 minute ago';
    } else if (diffMin < 60) {
      el.textContent = `Last synced: ${diffMin} minutes ago`;
    } else if (diffHour === 1) {
      el.textContent = 'Last synced: 1 hour ago';
    } else {
      el.textContent = `Last synced: ${diffHour} hours ago`;
    }
  }

  startRelativeTimeUpdater() {
    if (this.timeUpdater) clearInterval(this.timeUpdater);
    this.timeUpdater = setInterval(() => this.updateSyncedTimeText(), 30000); // every 30s
  }

  /**
   * Update a specific metric with visual feedback
   */
  updateMetric(name, rawValue) {
    const cleanName = name.toLowerCase().trim();
    const value = parseFloat(rawValue);

    if (isNaN(value)) {
      throw new Error(`Invalid numeric value: ${rawValue}`);
    }

    if (!(cleanName in this.metrics)) {
      throw new Error(`Unknown health metric: ${name}`);
    }

    // Trigger sync animation
    const syncContainer = document.querySelector('.last-sync-time');
    if (syncContainer) {
      syncContainer.classList.add('syncing');
    }

    // Update value
    this.metrics[cleanName] = value;
    this.metrics.lastSynced = Date.now();
    this.saveMetrics();

    // Trigger visual highlight based on metric type
    setTimeout(() => {
      this.updateUI();

      let targetEl;
      if (['sleep', 'recovery', 'strain'].includes(cleanName)) {
        targetEl = document.getElementById(`whoop-${cleanName}-card`);
      } else {
        targetEl = document.getElementById(`withings-${cleanName}-row`);
      }

      if (targetEl) {
        targetEl.classList.remove('highlight');
        void targetEl.offsetWidth; // Force reflow
        targetEl.classList.add('highlight');
      }

      if (syncContainer) {
        setTimeout(() => {
          syncContainer.classList.remove('syncing');
        }, 1200);
      }
    }, 400);

    return {
      success: true,
      metric: cleanName,
      value: value,
      message: `Updated ${name} to ${value} successfully.`
    };
  }
}

// Global initialization
const initHealthWidget = () => {
  window.healthWidget = new HealthWidget();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHealthWidget);
} else {
  initHealthWidget();
}
