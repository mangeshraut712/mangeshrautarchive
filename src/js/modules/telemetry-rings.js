/**
 * Telemetry Rings & Metric Sparkline Visualizer — Apple Activity & Watch Health Standard
 * Visualizes 3 concentric circular rings (System Health, Test Pass Rate, Edge Performance)
 * and interactive sparklines with zero external libraries.
 */

export class TelemetryRings {
  /**
   * @param {HTMLElement} container
   * @param {Object} options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.rings = [
      {
        id: 'uptime',
        label: 'System Uptime',
        value: 99.99,
        target: '99.99%',
        color: '#ff3b30',
        radius: 80,
        stroke: 14,
      },
      {
        id: 'tests',
        label: 'Test Pass Floor',
        value: 100,
        target: '160/160',
        color: '#34c759',
        radius: 62,
        stroke: 14,
      },
      {
        id: 'perf',
        label: 'Lighthouse CI',
        value: 100,
        target: '100/100',
        color: '#0071e3',
        radius: 44,
        stroke: 14,
      },
    ];

    this.sparklines = [
      {
        label: 'Edge TTFB',
        current: '24 ms',
        change: '-12%',
        points: [34, 31, 28, 26, 29, 25, 24],
      },
      {
        label: 'Memory Footprint',
        current: '14.2 MB',
        change: '-18%',
        points: [22, 19, 18, 16, 15, 14.5, 14.2],
      },
      {
        label: 'Chat Token Speed',
        current: '85 tok/s',
        change: '+32%',
        points: [52, 60, 68, 74, 78, 82, 85],
      },
    ];

    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="telemetry-rings-wrapper lg-glass-card" role="region" aria-label="System Health & Live Telemetry Activity Rings">
        <div class="telemetry-rings-header">
          <div>
            <span class="telemetry-rings-pill">Live Telemetry</span>
            <h3 class="telemetry-rings-heading">System Vitality Rings</h3>
          </div>
          <div class="telemetry-rings-live-badge">
            <span class="telemetry-pulse-dot"></span>
            <span>All Systems Nominal</span>
          </div>
        </div>

        <div class="telemetry-rings-grid">
          <!-- 3-Ring SVG Concentric Dials -->
          <div class="telemetry-rings-visual-pane">
            <svg class="telemetry-rings-svg" viewBox="0 0 220 220">
              <defs>
                ${this.rings
                  .map(
                    r => `
                  <filter id="glow-${r.id}" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                `
                  )
                  .join('')}
              </defs>

              <g transform="translate(110, 110) rotate(-90)">
                ${this.rings
                  .map(ring => {
                    const circ = 2 * Math.PI * ring.radius;
                    const offset = circ * (1 - ring.value / 100);
                    return `
                    <!-- Background Track -->
                    <circle
                      class="telemetry-ring-bg"
                      r="${ring.radius}"
                      stroke="${ring.color}"
                      stroke-width="${ring.stroke}"
                      stroke-opacity="0.18"
                      fill="none"
                    />
                    <!-- Progress Ring -->
                    <circle
                      class="telemetry-ring-bar"
                      r="${ring.radius}"
                      stroke="${ring.color}"
                      stroke-width="${ring.stroke}"
                      stroke-linecap="round"
                      stroke-dasharray="${circ.toFixed(1)}"
                      stroke-dashoffset="${offset.toFixed(1)}"
                      fill="none"
                      filter="url(#glow-${ring.id})"
                    />
                  `;
                  })
                  .join('')}
              </g>
            </svg>

            <div class="telemetry-rings-legend">
              ${this.rings
                .map(
                  r => `
                <div class="telemetry-legend-chip">
                  <span class="telemetry-legend-swatch" style="background: ${r.color};"></span>
                  <div class="telemetry-legend-text">
                    <span class="telemetry-legend-title">${r.label}</span>
                    <strong class="telemetry-legend-val">${r.target}</strong>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Sparkline KPI Column -->
          <div class="telemetry-sparklines-column">
            ${this.sparklines.map(spark => this.renderSparklineTile(spark)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderSparklineTile(spark) {
    const min = Math.min(...spark.points);
    const max = Math.max(...spark.points);
    const range = max - min || 1;
    const width = 160;
    const height = 40;

    const coords = spark.points.map((val, idx) => {
      const x = (idx / (spark.points.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return { x, y };
    });

    const pathD = coords.reduce(
      (acc, c, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`,
      ''
    );
    const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

    return `
      <div class="telemetry-sparkline-card">
        <div class="telemetry-spark-meta">
          <div>
            <span class="telemetry-spark-label">${spark.label}</span>
            <strong class="telemetry-spark-current">${spark.current}</strong>
          </div>
          <span class="telemetry-spark-badge positive">${spark.change}</span>
        </div>
        <div class="telemetry-spark-svg-box">
          <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
            <defs>
              <linearGradient id="spark-fill-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#0071e3" stop-opacity="0.3" />
                <stop offset="100%" stop-color="#0071e3" stop-opacity="0.0" />
              </linearGradient>
            </defs>
            <path class="telemetry-spark-area" d="${areaD}" fill="url(#spark-fill-grad)" />
            <path class="telemetry-spark-line" d="${pathD}" fill="none" />
            <circle class="telemetry-spark-dot" cx="${coords[coords.length - 1].x}" cy="${coords[coords.length - 1].y}" r="3" />
          </svg>
        </div>
      </div>
    `;
  }
}

export function initTelemetryRings(selector = '#telemetry-rings-container') {
  const el = document.querySelector(selector);
  if (el) {
    return new TelemetryRings(el);
  }
  return null;
}
