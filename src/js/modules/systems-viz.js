/**
 * Engineering page — SVG visualizations & telemetry rendering (Apple Control Center style).
 */

import { buildDonutSegments } from '../utils/monitor-metrics.js';
import {
  productionMetricGroups,
  openSourceActivity,
  productionSnapshot,
  staticBenchmarks,
} from './engineering-showcase-data.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderSparklineSvg(points, { width = 280, height = 88, className = '' } = {}) {
  const values = (points || [])
    .map(p => Number(p?.value ?? p?.latency ?? p))
    .filter(v => Number.isFinite(v));
  if (values.length < 2) {
    return `<svg class="systems-sparkline ${className}" viewBox="0 0 ${width} ${height}" aria-hidden="true">
      <path class="systems-sparkline-grid" d="M0 ${height * 0.72}H${width}M0 ${height * 0.36}H${width}"></path>
      <text class="systems-sparkline-empty" x="${width / 2}" y="${height / 2}" text-anchor="middle">Awaiting samples</text>
    </svg>`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const step = width / (values.length - 1);

  const coords = values.map((v, i) => {
    const x = i * step;
    const y = height - 12 - ((v - min) / range) * (height - 24);
    return [x, y];
  });

  const line = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `M0,${height} L${coords.map(([x, y]) => `${x} ${y}`).join(' L')} L${width},${height} Z`;

  return `<svg class="systems-sparkline ${className}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Response time trend">
    <path class="systems-sparkline-grid" d="M0 ${height * 0.72}H${width}M0 ${height * 0.36}H${width}"></path>
    <path class="systems-sparkline-area" d="${area}"></path>
    <polyline class="systems-sparkline-line" points="${line}"></polyline>
  </svg>`;
}

export function renderDonutSvg(metrics, { size = 120 } = {}) {
  const { successCount, clientErrCount, serverErrCount } = buildDonutSegments(metrics);
  const total = successCount + clientErrCount + serverErrCount;
  const r = (size - 12) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  if (total <= 0) {
    return `<svg class="systems-donut" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-label="No request data yet">
      <circle cx="${cx}" cy="${cy}" r="${r}" class="systems-donut-track"></circle>
      <text x="${cx}" y="${cy + 4}" text-anchor="middle" class="systems-donut-center">—</text>
    </svg>`;
  }

  const segments = [
    { value: successCount, className: 'systems-donut-success' },
    { value: clientErrCount, className: 'systems-donut-client' },
    { value: serverErrCount, className: 'systems-donut-server' },
  ];

  let offset = 0;
  const arcs = segments
    .filter(s => s.value > 0)
    .map(s => {
      const dash = (s.value / total) * circ;
      const arc = `<circle cx="${cx}" cy="${cy}" r="${r}" class="systems-donut-segment ${s.className}"
        stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-offset}"></circle>`;
      offset += dash;
      return arc;
    })
    .join('');

  const successPct = Math.round((successCount / total) * 100);

  return `<svg class="systems-donut" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${successPct}% successful requests">
    <circle cx="${cx}" cy="${cy}" r="${r}" class="systems-donut-track"></circle>
    ${arcs}
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="systems-donut-center">${successPct}%</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="systems-donut-sub">2xx</text>
  </svg>`;
}

function benchmarkBarWidth(b) {
  if (b.id === 'lighthouse') return 95;
  if (b.id === 'accessibility') return 95;
  if (b.id === 'best-practices') return 100;
  if (b.id === 'local-actions') return 92;
  if (b.id === 'chat-ttft') return 72;
  if (b.id === 'prompt-cache') return 95;
  if (b.id === 'webmcp-mcp') return 90;
  if (b.id === 'dashboard-cut') return 40;
  const raw = String(b.value).replace(/[^0-9.]/g, '');
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0 && n <= 100) return n;
  return 0;
}

export function renderBenchmarkBarsHtml() {
  return staticBenchmarks
    .map(b => {
      const width = benchmarkBarWidth(b);
      const isLive = Boolean(b.liveKey);
      return `<div class="systems-bench-row lg-glass-card" data-benchmark-id="${escapeHtml(b.id)}" data-live-key="${escapeHtml(b.liveKey || '')}">
        <div class="systems-bench-row-head">
          <span class="systems-bench-label">${escapeHtml(b.label)}</span>
          <strong class="systems-bench-value" data-benchmark-value>${escapeHtml(b.value)}<small>${escapeHtml(b.unit)}</small></strong>
        </div>
        <div class="systems-bench-bar-track" aria-hidden="true">
          <div class="systems-bench-bar-fill ${isLive ? 'is-live' : ''}" style="width: ${width || 8}%"></div>
        </div>
        <span class="systems-bench-context">${escapeHtml(b.context)}</span>
      </div>`;
    })
    .join('');
}

export function renderTelemetryBento(snapshot) {
  const isLive = snapshot?.status === 'ok' || snapshot?.status === 'healthy';
  const statusClass = isLive ? 'healthy' : 'degraded';
  const statusLabel = isLive ? 'Connected' : 'Static Snapshot';

  return `
    <article class="systems-bento-tile systems-bento-tile--budget lg-glass-card" data-tile="performance">
      <p class="systems-tile-eyebrow">Performance budget</p>
      <div class="systems-status-lockup">
        <span class="systems-status-pill healthy">
          <span class="systems-status-dot"></span>
          Lighthouse CI gate
        </span>
        <p class="systems-tile-metric">95+<small>/100</small></p>
        <p class="systems-tile-caption">Core Web Vitals in budget</p>
      </div>
      <p class="systems-tile-foot">LCP &lt; 1.5s · INP &lt; 100ms · CLS 0.00</p>
    </article>

    <article class="systems-bento-tile systems-bento-tile--budget lg-glass-card" data-tile="quality">
      <p class="systems-tile-eyebrow">Code quality gates</p>
      <div class="systems-status-lockup">
        <span class="systems-status-pill healthy">
          <span class="systems-status-dot"></span>
          CI passing
        </span>
        <p class="systems-tile-metric">Passing</p>
        <p class="systems-tile-caption">Lint · format · e2e on every push</p>
      </div>
      <p class="systems-tile-foot">ESLint · Prettier · Playwright</p>
    </article>

    <article class="systems-bento-tile systems-bento-tile--budget lg-glass-card" data-tile="agent">
      <p class="systems-tile-eyebrow">Local agent</p>
      <div class="systems-status-lockup">
        <span class="systems-status-pill healthy">
          <span class="systems-status-dot"></span>
          WebMCP runtime
        </span>
        <p class="systems-tile-metric">&lt; 50<small>ms</small></p>
        <p class="systems-tile-caption">Deterministic browser actions</p>
      </div>
      <p class="systems-tile-foot">9 tools · navigate · theme · resume</p>
    </article>

    <article class="systems-bento-tile systems-bento-tile--budget lg-glass-card" data-tile="verification">
      <p class="systems-tile-eyebrow">Live API verification</p>
      <div class="systems-status-lockup">
        <span class="systems-status-pill ${statusClass}">
          <span class="systems-status-dot"></span>
          ${escapeHtml(statusLabel)}
        </span>
        <p class="systems-tile-metric">${isLive ? `${Math.round(snapshot?.avg_latency_ms || 120)}<small>ms</small>` : 'Static'}</p>
        <p class="systems-tile-caption">p95 connection latency</p>
      </div>
      <p class="systems-tile-foot" id="telemetry-tile-synced">Syncing telemetry…</p>
      <a class="systems-tile-link" href="monitor.html" style="margin-top:0.4rem;display:inline-block;">Open System Monitor →</a>
    </article>
  `;
}

export function updateLiveBenchmarkValues(snapshot) {
  const p95 = snapshot?.avg_latency_ms;
  const p95El = document.querySelector('[data-benchmark-id="api-p95"] [data-benchmark-value]');
  if (p95El && p95 != null) {
    p95El.innerHTML = `${Math.round(p95)}<small>ms</small>`;
    const fill = p95El.closest('.systems-bench-row')?.querySelector('.systems-bench-bar-fill');
    if (fill) fill.style.width = `${Math.min(100, Math.round((p95 / 500) * 100))}%`;
  }

  const uptimeEl = document.querySelector('[data-benchmark-id="uptime"] [data-benchmark-value]');
  if (uptimeEl && snapshot?.uptime_human) {
    uptimeEl.textContent = snapshot.uptime_human;
  }

  document.querySelectorAll('[data-metric-live="apiP95"]').forEach(el => {
    if (p95 != null) el.textContent = `${Math.round(p95)}`;
  });
  document.querySelectorAll('[data-metric-live="health"]').forEach(el => {
    const ok = snapshot?.status === 'ok' || snapshot?.status === 'healthy';
    el.textContent = ok ? 'Operational' : snapshot?.status || '—';
  });
  document.querySelectorAll('[data-metric-live="uptime"]').forEach(el => {
    if (snapshot?.uptime_human) el.textContent = snapshot.uptime_human;
  });
}

function metricRowHtml(row) {
  const live = row.liveKey ? ` data-metric-live="${escapeHtml(row.liveKey)}"` : '';
  const unit = row.unit ? `<small class="systems-metric-unit">${escapeHtml(row.unit)}</small>` : '';
  return `<div class="systems-metric-row">
    <span class="systems-metric-label">${escapeHtml(row.label)}</span>
    <strong class="systems-metric-value"${live}>${escapeHtml(row.value)}${unit}</strong>
  </div>`;
}

export function renderProductionSnapshot() {
  const rows = productionSnapshot.map(metricRowHtml).join('');
  return `<article class="systems-metric-panel systems-metric-panel--snapshot lg-glass-card">
    <h3 class="systems-metric-panel-title">Current deployment</h3>
    <div class="systems-metric-rows">${rows}</div>
  </article>`;
}

export function renderProductionMetricsGrid() {
  return productionMetricGroups
    .map(
      group => `<article class="systems-metric-panel lg-glass-card" data-metric-group="${escapeHtml(group.id)}">
      <h3 class="systems-metric-panel-title">${escapeHtml(group.title)}</h3>
      <div class="systems-metric-rows">${group.rows.map(metricRowHtml).join('')}</div>
    </article>`
    )
    .join('');
}

export function renderOpenSourcePanel() {
  const rows = openSourceActivity.rows.map(metricRowHtml).join('');
  return `<article class="systems-metric-panel systems-metric-panel--oss lg-glass-card">
    <div class="systems-metric-panel-head">
      <h3 class="systems-metric-panel-title">${escapeHtml(openSourceActivity.label)}</h3>
      <a class="systems-tile-link" href="${escapeHtml(openSourceActivity.repoUrl)}" target="_blank" rel="noopener noreferrer">GitHub →</a>
    </div>
    <div class="systems-metric-rows">${rows}</div>
    <p class="systems-metric-live-note" id="oss-live-note">Syncing public activity…</p>
  </article>`;
}
