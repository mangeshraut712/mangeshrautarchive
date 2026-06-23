/**
 * Engineering page — SVG visualizations & telemetry rendering (Apple Control Center style).
 */

import { buildDonutSegments } from '../utils/monitor-metrics.js';
import {
  productionMetricGroups,
  openSourceActivity,
  staticBenchmarks,
} from './engineering-showcase-data.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
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
  if (b.id === 'local-actions') return 92;
  if (b.id === 'dashboard-cut') return 40;
  if (b.id === 'chat-ttft') return 72;
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
  const status = snapshot?.status || 'unknown';
  const statusClass =
    status === 'ok' || status === 'healthy'
      ? 'healthy'
      : status === 'degraded'
        ? 'degraded'
        : 'unhealthy';
  const statusLabel =
    status === 'ok' || status === 'healthy'
      ? 'Operational'
      : status.charAt(0).toUpperCase() + status.slice(1);
  const trend = snapshot?.response_time_trend || [];
  const sparkline = renderSparklineSvg(trend, { className: 'systems-sparkline--telemetry' });
  const donut = renderDonutSvg({
    total_requests: snapshot?.total_requests,
    error_count: Math.round(((snapshot?.error_rate || 0) / 100) * (snapshot?.total_requests || 0)),
    endpoints: snapshot?.endpoints || [],
  });

  const healthy = snapshot?.summary?.healthy ?? snapshot?.summary?.monitored_endpoints ?? '—';
  const total = snapshot?.summary?.total ?? snapshot?.summary?.monitored_endpoints ?? '—';

  return `
    <article class="systems-bento-tile systems-bento-tile--status lg-glass-card" data-tile="status">
      <p class="systems-tile-eyebrow">Live status</p>
      <div class="systems-status-lockup">
        <span class="systems-status-pill ${statusClass}">
          <span class="systems-status-dot"></span>
          ${escapeHtml(statusLabel)}
        </span>
        <p class="systems-tile-metric" id="telemetry-uptime">${escapeHtml(snapshot?.uptime_human || '—')}</p>
        <p class="systems-tile-caption">Uptime</p>
      </div>
      <p class="systems-tile-foot" id="telemetry-tile-synced">Synced ${escapeHtml(snapshot?.generated_at ? 'just now' : '…')}</p>
    </article>

    <article class="systems-bento-tile systems-bento-tile--chart lg-glass-card" data-tile="latency">
      <p class="systems-tile-eyebrow">API latency trend</p>
      <div class="systems-sparkline-wrap">${sparkline}</div>
      <div class="systems-tile-stat-row">
        <div>
          <p class="systems-tile-metric" id="telemetry-avg-latency">${snapshot?.avg_latency_ms != null ? `${Math.round(snapshot.avg_latency_ms)}ms` : '—'}</p>
          <p class="systems-tile-caption">Avg response</p>
        </div>
        <div>
          <p class="systems-tile-metric" id="telemetry-rps">${snapshot?.requests_per_second != null ? formatNumber(snapshot.requests_per_second) : '—'}</p>
          <p class="systems-tile-caption">Req/s</p>
        </div>
      </div>
    </article>

    <article class="systems-bento-tile systems-bento-tile--donut lg-glass-card" data-tile="reliability">
      <p class="systems-tile-eyebrow">Request reliability</p>
      <div class="systems-donut-wrap">${donut}</div>
      <div class="systems-donut-legend">
        <span><i class="systems-legend-dot success"></i>2xx</span>
        <span><i class="systems-legend-dot client"></i>4xx</span>
        <span><i class="systems-legend-dot server"></i>5xx</span>
      </div>
      <p class="systems-tile-foot">Error rate <strong id="telemetry-error-rate">${escapeHtml(String(snapshot?.error_rate ?? '—'))}%</strong></p>
    </article>

    <article class="systems-bento-tile systems-bento-tile--services lg-glass-card" data-tile="services">
      <p class="systems-tile-eyebrow">Service matrix</p>
      <p class="systems-tile-metric systems-tile-metric--large"><span id="telemetry-healthy">${escapeHtml(String(healthy))}</span><span class="systems-tile-metric-dim">/${escapeHtml(String(total))}</span></p>
      <p class="systems-tile-caption">Healthy services</p>
      <div class="systems-service-bars" id="telemetry-service-bars">
        ${renderServiceBars(snapshot?.summary)}
      </div>
      <a class="systems-tile-link" href="monitor.html">Open System Monitor →</a>
    </article>
  `;
}

function renderServiceBars(summary) {
  if (!summary) {
    return '<div class="systems-service-bar systems-service-bar--empty">No service summary</div>';
  }
  const healthy = Number(summary.healthy ?? 0);
  const degraded = Number(summary.degraded ?? 0);
  const unhealthy = Number(summary.unhealthy ?? 0);
  const total = Math.max(healthy + degraded + unhealthy, 1);
  const pct = v => `${Math.round((v / total) * 100)}%`;

  return `
    <div class="systems-service-bar" title="Healthy">
      <span class="systems-service-bar-fill healthy" style="width:${pct(healthy)}"></span>
    </div>
    <div class="systems-service-bar" title="Degraded">
      <span class="systems-service-bar-fill degraded" style="width:${pct(degraded)}"></span>
    </div>
    <div class="systems-service-bar" title="Unhealthy">
      <span class="systems-service-bar-fill unhealthy" style="width:${pct(unhealthy)}"></span>
    </div>
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
