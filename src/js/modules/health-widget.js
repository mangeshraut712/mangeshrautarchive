/**
 * Health Widget Module
 * Manages Whoop and Withings metrics, localStorage persistence,
 * UI updates, count-up/highlight animations, and synchronization triggers.
 */

const DEFAULT_METRICS = {
  sleep: null,
  recovery: null,
  strain: null,
  weight: null,
  muscle: null,
  fat: null,
  lastSynced: null,
};

function resolveApiBase() {
  const base =
    globalThis.APP_CONFIG?.apiBaseUrl ||
    (typeof globalThis.buildConfig !== 'undefined' && globalThis.buildConfig.apiBaseUrl) ||
    '';
  if (base) return base.replace(/\/$/, '');
  if (
    globalThis.location?.hostname === 'localhost' ||
    globalThis.location?.hostname === '127.0.0.1'
  ) {
    return '';
  }
  return 'https://mangeshraut.pro';
}

function parseWeightTrend(weightTrend) {
  if (typeof weightTrend !== 'string' || !weightTrend.trim()) {
    return { weight: null, muscle: null, fat: null };
  }

  const weightMatch = weightTrend.match(/([\d.]+)\s*kg/i);
  const muscleMatch = weightTrend.match(/([\d.]+)\s*%\s*muscle/i);
  const fatMatch = weightTrend.match(/([\d.]+)\s*%\s*fat/i);
  return {
    weight: weightMatch ? parseFloat(weightMatch[1]) : null,
    muscle: muscleMatch ? parseFloat(muscleMatch[1]) : null,
    fat: fatMatch ? parseFloat(fatMatch[1]) : null,
  };
}

class HealthWidget {
  constructor() {
    this.storageKey = 'mangesh_health_metrics_v2';
    this.metrics = this.loadMetrics();
    this.init();
  }

  loadMetrics() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_METRICS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to read health metrics from localStorage:', e);
    }

    return { ...DEFAULT_METRICS };
  }

  saveMetrics() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.metrics));
    } catch (e) {
      console.error('Failed to save health metrics to localStorage:', e);
    }
  }

  init() {
    const container = document.getElementById('health-section');
    if (!container) return;

    this.updateUI();
    this.startRelativeTimeUpdater();
    this.fetchFromApi();
  }

  async fetchFromApi() {
    const apiBase = resolveApiBase();
    const url = apiBase ? `${apiBase}/api/health-vitals/summary` : '/api/health-vitals/summary';

    try {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok) return;
      const payload = await response.json();
      if (!payload.data) return;

      const data = payload.data;
      const isLive = payload.status === 'live';

      if (typeof data.sleepScore === 'number') this.metrics.sleep = data.sleepScore;
      else if (isLive) this.metrics.sleep = null;

      if (typeof data.recoveryScore === 'number') this.metrics.recovery = data.recoveryScore;
      else if (isLive) this.metrics.recovery = null;

      if (typeof data.strain === 'number') this.metrics.strain = data.strain;
      else if (isLive) this.metrics.strain = null;

      const parsedWeight = parseWeightTrend(data.weightTrend);
      if (parsedWeight.weight !== null) this.metrics.weight = parsedWeight.weight;
      else if (isLive) this.metrics.weight = null;

      if (parsedWeight.muscle !== null) this.metrics.muscle = parsedWeight.muscle;
      else if (isLive) this.metrics.muscle = null;

      if (parsedWeight.fat !== null) this.metrics.fat = parsedWeight.fat;
      else if (isLive) this.metrics.fat = null;

      if (data.lastSyncedAt) {
        const parsed = Date.parse(data.lastSyncedAt);
        if (!Number.isNaN(parsed)) this.metrics.lastSynced = parsed;
      } else if (isLive) {
        this.metrics.lastSynced = Date.now();
      }

      this.saveMetrics();
      this.updateUI();
    } catch (error) {
      console.warn('Health summary API unavailable, using cached metrics.', error);
    }
  }

  formatMetric(value, suffix = '') {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return `--${suffix}`;
    }
    return `${value}${suffix}`;
  }

  updateUI() {
    this.setTextContent(
      'whoop-sleep-val',
      this.metrics.sleep === null ? '--%' : `${Math.round(this.metrics.sleep)}%`
    );
    this.setTextContent(
      'whoop-recovery-val',
      this.metrics.recovery === null ? '--%' : `${Math.round(this.metrics.recovery)}%`
    );
    this.setTextContent(
      'whoop-strain-val',
      this.metrics.strain === null ? '--' : this.metrics.strain.toFixed(1)
    );

    this.setTextContent(
      'withings-weight-val',
      this.metrics.weight === null ? '--' : this.metrics.weight.toFixed(1)
    );
    this.setTextContent(
      'withings-muscle-val',
      this.metrics.muscle === null ? '--' : this.metrics.muscle.toFixed(1)
    );
    this.setTextContent(
      'withings-fat-val',
      this.metrics.fat === null ? '--' : this.metrics.fat.toFixed(1)
    );

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
      el.textContent = 'Last synced: Pending';
      return;
    }

    const diffMs = Date.now() - this.metrics.lastSynced;
    const diffMin = Math.floor(diffMs / 60000);
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
    this.timeUpdater = setInterval(() => this.updateSyncedTimeText(), 30000);
  }

  updateMetric(name, rawValue) {
    const cleanName = name.toLowerCase().trim();
    const value = parseFloat(rawValue);

    if (isNaN(value)) {
      throw new Error(`Invalid numeric value: ${rawValue}`);
    }

    if (!(cleanName in this.metrics)) {
      throw new Error(`Unknown health metric: ${name}`);
    }

    const syncContainer = document.querySelector('.last-sync-time');
    if (syncContainer) {
      syncContainer.classList.add('syncing');
    }

    this.metrics[cleanName] = value;
    this.metrics.lastSynced = Date.now();
    this.saveMetrics();

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
        void targetEl.offsetWidth;
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
      message: `Updated ${name} to ${value} successfully.`,
    };
  }
}

const initHealthWidget = () => {
  window.healthWidget = new HealthWidget();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHealthWidget);
} else {
  initHealthWidget();
}
