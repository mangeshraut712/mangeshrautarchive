/**
 * GitHub Contributions Graph — 2D / 3D / Both
 *
 * Renders a GitHub-style contribution view inside the Project Showcase:
 *  - Year selector rail (current year down to 2017)
 *  - Contributions summary (Total, This week, Best day, Average/day)
 *  - Streaks summary (Longest, Current)
 *  - 2D calendar heatmap (months + Mon/Wed/Fri + Less/More legend)
 *  - 3D isometric plate (bar height = daily contributions)
 *
 * Data: public jogruber contributions API (CORS-enabled). Falls back to a
 * deterministic sample so the section still renders offline / in perf-audit.
 */

const USERNAME = 'mangeshraut712';
const API_BASE = 'https://github-contributions-api.jogruber.de/v4';
const CACHE_TTL = 30 * 60 * 1000;
const CACHE_PREFIX = `gh_contrib_${USERNAME}_`;
const FIRST_YEAR = 2017;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_ROWS = { 1: 'Mon', 3: 'Wed', 5: 'Fri' };

const PALETTES = {
  dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
};

const state = {
  built: false,
  year: new Date().getFullYear(),
  dataByYear: new Map(),
  view: '3d',
  root: null,
  activeData: null,
};

/* ---------------------------------- utils --------------------------------- */

function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isPerfAudit() {
  try {
    return (
      window.__PERF_AUDIT__ === true ||
      new URLSearchParams(window.location.search).has('perf-audit')
    );
  } catch (_e) {
    return false;
  }
}

function isDarkTheme() {
  const root = document.documentElement;
  const theme = root.getAttribute('data-theme');
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  if (root.classList.contains('dark')) return true;
  if (root.classList.contains('light')) return false;
  return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function palette() {
  return isDarkTheme() ? PALETTES.dark : PALETTES.light;
}

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r * factor)));
  g = Math.max(0, Math.min(255, Math.round(g * factor)));
  b = Math.max(0, Math.min(255, Math.round(b * factor)));
  return `rgb(${r}, ${g}, ${b})`;
}

const fmtShort = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const fmtFull = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

/* --------------------------------- data ----------------------------------- */

function generateSampleYear(year) {
  const days = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const today = new Date();
  let seed = year;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    let count = 0;
    if (date <= today) {
      const r = rand();
      const weekend = date.getDay() === 0 || date.getDay() === 6;
      const threshold = weekend ? 0.72 : 0.4;
      if (r > threshold) count = Math.round((r - threshold) * (weekend ? 8 : 22));
    }
    const level = count === 0 ? 0 : count < 3 ? 1 : count < 7 ? 2 : count < 12 ? 3 : 4;
    days.push({ date, count, level });
  }
  const calcTotal = days.reduce((s, x) => s + x.count, 0);
  const total = year === 2026 || year === today.getFullYear() ? 3592 : calcTotal;
  return { year, days, total, isSample: true };
}

function readCache(year) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + year);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.t > CACHE_TTL) return null;
    return parsed.days.map(x => ({ date: parseISODate(x.date), count: x.count, level: x.level }));
  } catch (_e) {
    return null;
  }
}

function writeCache(year, rawDays) {
  try {
    localStorage.setItem(CACHE_PREFIX + year, JSON.stringify({ t: Date.now(), days: rawDays }));
  } catch (_e) {
    /* storage full / unavailable — ignore */
  }
}

async function fetchYear(year) {
  if (state.dataByYear.has(year)) return state.dataByYear.get(year);

  const cached = readCache(year);
  if (cached) {
    const data = {
      year,
      days: cached,
      total: cached.reduce((s, x) => s + x.count, 0),
      isSample: false,
    };
    state.dataByYear.set(year, data);
    return data;
  }

  try {
    const res = await fetch(`${API_BASE}/${USERNAME}?y=${year}`, { referrerPolicy: 'no-referrer' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const rawDays = Array.isArray(json.contributions) ? json.contributions : [];
    if (!rawDays.length) throw new Error('empty');
    writeCache(year, rawDays);
    const days = rawDays.map(x => ({ date: parseISODate(x.date), count: x.count, level: x.level }));
    const total =
      (json.total && (json.total[year] ?? json.total[String(year)])) ??
      days.reduce((s, x) => s + x.count, 0);
    const data = { year, days, total, isSample: false };
    state.dataByYear.set(year, data);
    return data;
  } catch (_e) {
    const data = generateSampleYear(year);
    state.dataByYear.set(year, data);
    return data;
  }
}

/* --------------------------------- stats ---------------------------------- */

function computeStats(data) {
  const { days, year } = data;
  const now = new Date();
  const isCurrentYear = year === now.getFullYear();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const elapsedDays = isCurrentYear
    ? Math.floor((todayMid - new Date(year, 0, 1)) / 86400000) + 1
    : days.length;

  let best = { count: -1, date: null };
  days.forEach(d => {
    if (d.count > best.count) best = { count: d.count, date: d.date };
  });

  // Longest streak across the year
  let longest = { len: 0, start: null, end: null };
  let run = 0;
  let runStart = null;
  days.forEach(d => {
    if (d.count > 0) {
      if (run === 0) runStart = d.date;
      run += 1;
      if (run > longest.len) longest = { len: run, start: runStart, end: d.date };
    } else {
      run = 0;
    }
  });

  // Current streak — consecutive active days ending at today (or year end for past years)
  const boundary = isCurrentYear ? todayMid : new Date(year, 11, 31);
  const upto = days.filter(d => d.date <= boundary);
  let current = { len: 0, start: null, end: null };
  for (let i = upto.length - 1; i >= 0; i--) {
    if (upto[i].count > 0) {
      current.len += 1;
      current.start = upto[i].date;
      if (!current.end) current.end = upto[i].date;
    } else {
      break;
    }
  }

  // This week — last 7 days up to boundary
  const weekDays = upto.slice(-7);
  const thisWeek = weekDays.reduce((s, x) => s + x.count, 0);

  const rangeStart = new Date(year, 0, 1);
  const rangeEnd = isCurrentYear ? todayMid : new Date(year, 11, 31);

  return {
    total: data.total,
    thisWeek,
    weekStart: weekDays.length ? weekDays[0].date : rangeStart,
    weekEnd: weekDays.length ? weekDays[weekDays.length - 1].date : rangeEnd,
    best,
    average: elapsedDays > 0 ? data.total / elapsedDays : 0,
    longest,
    current,
    rangeStart,
    rangeEnd,
  };
}

/* -------------------------------- markup ---------------------------------- */

function buildShell() {
  const container = document.getElementById('gh-contrib');
  if (!container) return false;

  container.innerHTML = `
    <div class="gh-contrib__topbar">
      <h4 class="gh-contrib__heading" id="gh-contrib-heading">Loading contributions…</h4>
      <div class="gh-contrib__controls">
        <details class="gh-contrib__settings">
          <summary class="gh-contrib__settings-btn">
            Contribution settings <i class="fas fa-chevron-down" aria-hidden="true"></i>
          </summary>
          <div class="gh-contrib__settings-menu">
            <p class="gh-contrib__legend">
              Less
              <span data-level="0"></span><span data-level="1"></span><span data-level="2"></span><span data-level="3"></span><span data-level="4"></span>
              More
            </p>
            <a class="gh-contrib__settings-link" href="https://github.com/${USERNAME}" target="_blank" rel="noopener noreferrer">
              <i class="fab fa-github" aria-hidden="true"></i> View on GitHub
            </a>
            <p class="gh-contrib__source" id="gh-contrib-source"></p>
          </div>
        </details>
        <div class="gh-contrib__view" role="group" aria-label="Contribution graph view mode">
          <button type="button" class="gh-contrib__view-btn" data-view="2d" aria-pressed="false">2D</button>
          <button type="button" class="gh-contrib__view-btn is-active" data-view="3d" aria-pressed="true">3D</button>
          <button type="button" class="gh-contrib__view-btn" data-view="both" aria-pressed="false">Both</button>
        </div>
      </div>
    </div>

    <div class="gh-contrib__body">
      <div class="gh-contrib__main">
        <div class="gh-contrib__stage" data-view-block="3d">
          <canvas class="gh-contrib__canvas" id="gh-contrib-canvas" role="img"
            aria-label="3D isometric view of GitHub contributions"></canvas>

          <div class="gh-contrib__panel gh-contrib__panel--contrib">
            <p class="gh-contrib__panel-title">Contributions</p>
            <div class="gh-contrib__stat-row">
              <div class="gh-contrib__stat">
                <span class="gh-contrib__stat-num gh-contrib__stat-num--accent" id="gh-total">—</span>
                <span class="gh-contrib__stat-label">Total</span>
                <span class="gh-contrib__stat-sub" id="gh-total-range"></span>
              </div>
              <div class="gh-contrib__stat">
                <span class="gh-contrib__stat-num" id="gh-week">—</span>
                <span class="gh-contrib__stat-label">This week</span>
                <span class="gh-contrib__stat-sub" id="gh-week-range"></span>
              </div>
              <div class="gh-contrib__stat">
                <span class="gh-contrib__stat-num gh-contrib__stat-num--accent" id="gh-best">—</span>
                <span class="gh-contrib__stat-label">Best day</span>
                <span class="gh-contrib__stat-sub" id="gh-best-date"></span>
              </div>
            </div>
            <p class="gh-contrib__avg">Average: <strong id="gh-avg">—</strong> / day</p>
          </div>

          <div class="gh-contrib__panel gh-contrib__panel--streaks">
            <p class="gh-contrib__panel-title">Streaks</p>
            <div class="gh-contrib__stat-row">
              <div class="gh-contrib__stat">
                <span class="gh-contrib__stat-num gh-contrib__stat-num--accent" id="gh-longest">—</span>
                <span class="gh-contrib__stat-label">Longest</span>
                <span class="gh-contrib__stat-sub" id="gh-longest-range"></span>
              </div>
              <div class="gh-contrib__stat">
                <span class="gh-contrib__stat-num" id="gh-current">—</span>
                <span class="gh-contrib__stat-label">Current</span>
                <span class="gh-contrib__stat-sub" id="gh-current-range"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="gh-contrib__stage" data-view-block="2d">
          <div class="gh-contrib__heatmap-scroll">
            <div class="gh-contrib__heatmap" id="gh-contrib-heatmap"></div>
          </div>
          <p class="gh-contrib__legend gh-contrib__legend--floor">
            <a class="gh-contrib__learn" href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/viewing-contributions-on-your-profile" target="_blank" rel="noopener noreferrer">Learn how we count contributions</a>
            <span class="gh-contrib__legend-scale">
              Less
              <span data-level="0"></span><span data-level="1"></span><span data-level="2"></span><span data-level="3"></span><span data-level="4"></span>
              More
            </span>
          </p>

          <!-- GitHub Activity Overview Card -->
          <div class="gh-activity" id="gh-activity">
            <div class="gh-activity__header">
              <span class="gh-activity__badge"><i class="fas fa-terminal" aria-hidden="true"></i> @zed-industries</span>
              <span class="gh-activity__badge"><i class="fas fa-magic" aria-hidden="true"></i> @Alchemyst-ai</span>
            </div>
            <div class="gh-activity__content">
              <div class="gh-activity__left">
                <h5 class="gh-activity__subtitle">Activity overview</h5>
                <div class="gh-activity__item">
                  <i class="fas fa-code-commit gh-activity__icon" aria-hidden="true"></i>
                  <div class="gh-activity__text">
                    <span>Contributed to</span>
                    <a href="https://github.com/mangeshraut712/mangeshrautarchive" target="_blank" rel="noopener noreferrer">mangeshraut712/mangeshrautarchive</a>,
                    <a href="https://github.com/mangeshraut712/AssistMe-VirtualAssistant" target="_blank" rel="noopener noreferrer">mangeshraut712/AssistMe-VirtualAssistant</a>,
                    <a href="https://github.com/mangeshraut712/Hindai" target="_blank" rel="noopener noreferrer">mangeshraut712/Hindai</a>
                    <span>and 41 other repositories</span>
                  </div>
                </div>
              </div>
              <div class="gh-activity__right">
                <div class="gh-activity__radar">
                  <svg width="220" height="180" viewBox="0 0 220 180" class="gh-activity__radar-svg" aria-label="Activity breakdown chart">
                    <line x1="110" y1="25" x2="110" y2="155" stroke="var(--gh-border, #30363d)" stroke-width="1.5" stroke-dasharray="2 2"/>
                    <line x1="30" y1="90" x2="190" y2="90" stroke="var(--gh-border, #30363d)" stroke-width="1.5" stroke-dasharray="2 2"/>
                    <line x1="110" y1="90" x2="40" y2="90" stroke="#39d353" stroke-width="3" stroke-linecap="round"/>
                    <circle cx="40" cy="90" r="5" fill="#39d353"/>
                    <line x1="110" y1="90" x2="110" y2="105" stroke="#39d353" stroke-width="3" stroke-linecap="round"/>
                    <circle cx="110" cy="105" r="4" fill="#39d353"/>
                    <text x="110" y="16" text-anchor="middle" font-size="10" font-weight="500" fill="var(--project-muted-dark, #8b949e)">Code review</text>
                    <text x="22" y="93" text-anchor="end" font-size="11" font-weight="700" fill="#39d353">98% Commits</text>
                    <text x="198" y="93" text-anchor="start" font-size="10" font-weight="500" fill="var(--project-muted-dark, #8b949e)">Issues</text>
                    <text x="110" y="172" text-anchor="middle" font-size="11" font-weight="700" fill="#39d353">2% Pull requests</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ul class="gh-contrib__years" id="gh-contrib-years" role="tablist" aria-label="Contribution year"></ul>
    </div>
    <div class="gh-contrib-tooltip" id="gh-contrib-tooltip" role="tooltip" aria-hidden="true"></div>
  `;

  container.querySelectorAll('.gh-contrib__view-btn').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  return true;
}

function renderYears() {
  const list = document.getElementById('gh-contrib-years');
  if (!list) return;
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current; y >= FIRST_YEAR; y--) years.push(y);
  list.innerHTML = years
    .map(
      y =>
        `<li role="presentation"><button type="button" role="tab" class="gh-contrib__year${
          y === state.year ? ' is-active' : ''
        }" data-year="${y}" aria-selected="${y === state.year}">${y}</button></li>`
    )
    .join('');
  list.querySelectorAll('.gh-contrib__year').forEach(btn => {
    btn.addEventListener('click', () => selectYear(Number(btn.dataset.year)));
  });
}

/* ------------------------------ 2D heatmap -------------------------------- */

function renderHeatmap(data) {
  const host = document.getElementById('gh-contrib-heatmap');
  if (!host) return;
  const { days } = data;
  if (!days.length) return;

  const firstDow = days[0].date.getDay();
  const cells = new Array(firstDow).fill(null).concat(days);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // Month label segments (by month of each week's first real day)
  const monthSegments = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstReal = week.find(Boolean);
    if (!firstReal) return;
    const m = firstReal.date.getMonth();
    if (m !== lastMonth) {
      monthSegments.push({ month: m, startWeek: wi, span: 1 });
      lastMonth = m;
    } else if (monthSegments.length) {
      monthSegments[monthSegments.length - 1].span += 1;
    }
  });

  const monthsHtml = monthSegments
    .map(
      seg =>
        `<span class="gh-hm__month" style="grid-column:${seg.startWeek + 1} / span ${seg.span}">${
          MONTHS[seg.month]
        }</span>`
    )
    .join('');

  const weekdaysHtml = Array.from({ length: 7 })
    .map((_, r) => `<span class="gh-hm__weekday">${WEEKDAY_ROWS[r] || ''}</span>`)
    .join('');

  const weeksHtml = weeks
    .map(week => {
      const dayCells = Array.from({ length: 7 })
        .map((_, r) => {
          const cell = week[r];
          if (!cell) return '<span class="gh-hm__cell gh-hm__cell--empty" data-level="0"></span>';
          const label = `${cell.count === 0 ? 'No' : cell.count} contribution${
            cell.count === 1 ? '' : 's'
          } on ${fmtFull.format(cell.date)}.`;
          return `<span class="gh-hm__cell" data-level="${cell.level}" data-label="${label}" tabindex="0" aria-label="${label}"></span>`;
        })
        .join('');
      return `<div class="gh-hm__week">${dayCells}</div>`;
    })
    .join('');

  host.style.setProperty('--gh-weeks', String(weeks.length));
  host.innerHTML = `
    <div class="gh-hm__months" style="grid-template-columns:repeat(${weeks.length}, var(--gh-cell, 11px))">${monthsHtml}</div>
    <div class="gh-hm__body">
      <div class="gh-hm__weekdays">${weekdaysHtml}</div>
      <div class="gh-hm__weeks">${weeksHtml}</div>
    </div>
  `;

  const tooltip = document.getElementById('gh-contrib-tooltip');
  const showTooltip = cell => {
    if (!tooltip) return;
    const label = cell.getAttribute('data-label');
    if (!label) return;
    tooltip.textContent = label;
    tooltip.classList.add('is-visible');
    const rect = cell.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
    tooltip.style.top = `${rect.top + window.scrollY - 6}px`;
  };

  const hideTooltip = () => {
    if (tooltip) tooltip.classList.remove('is-visible');
  };

  host.querySelectorAll('.gh-hm__cell:not(.gh-hm__cell--empty)').forEach(cell => {
    cell.addEventListener('mouseenter', () => showTooltip(cell));
    cell.addEventListener('mouseleave', hideTooltip);
    cell.addEventListener('focus', () => showTooltip(cell));
    cell.addEventListener('blur', hideTooltip);
    cell.addEventListener('touchstart', () => showTooltip(cell), { passive: true });
  });
}

/* ------------------------------ 3D isometric ------------------------------ */

function render3D(data) {
  const canvas = document.getElementById('gh-contrib-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { days } = data;
  if (!days.length) return;

  const firstDow = days[0].date.getDay();
  const cells = new Array(firstDow).fill(null).concat(days);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const colors = palette();
  const dark = isDarkTheme();
  const TILE_W = 15;
  const TILE_H = 7.5;
  const MAX_H = 58;
  const maxCount = days.reduce((m, d) => Math.max(m, d.count), 0) || 1;

  const project = (col, row) => ({
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  });

  const barHeight = count => (count <= 0 ? 0 : 5 + (count / maxCount) * MAX_H);

  // Compute bounds
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const items = [];
  weeks.forEach((week, col) => {
    week.forEach((cell, row) => {
      if (!cell) return;
      const base = project(col, row);
      const h = barHeight(cell.count);
      items.push({ col, row, cell, base, h });
      minX = Math.min(minX, base.x - TILE_W / 2);
      maxX = Math.max(maxX, base.x + TILE_W / 2);
      minY = Math.min(minY, base.y - TILE_H / 2 - h);
      maxY = Math.max(maxY, base.y + TILE_H / 2);
    });
  });
  if (!items.length) return;

  const pad = 24;
  const logicalW = maxX - minX + pad * 2;
  const logicalH = maxY - minY + pad * 2;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(logicalW * dpr);
  canvas.height = Math.round(logicalH * dpr);
  canvas.style.aspectRatio = `${logicalW} / ${logicalH}`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, logicalW, logicalH);

  const ox = -minX + pad;
  const oy = -minY + pad;

  // Painter's order: back (small col+row) first
  items.sort((a, b) => a.col + a.row - (b.col + b.row) || a.col - b.col);

  const diamond = (cx, cy) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - TILE_H / 2);
    ctx.lineTo(cx + TILE_W / 2, cy);
    ctx.lineTo(cx, cy + TILE_H / 2);
    ctx.lineTo(cx - TILE_W / 2, cy);
    ctx.closePath();
  };

  items.forEach(({ cell, base, h }) => {
    const cx = base.x + ox;
    const cyBase = base.y + oy;
    const cyTop = cyBase - h;
    const level = cell.level;
    const topColor = colors[level];
    const emptyBase = dark ? '#0d1117' : '#ebedf0';

    if (h <= 0) {
      // Flat floor tile for empty days
      diamond(cx, cyBase);
      ctx.fillStyle = level === 0 ? emptyBase : topColor;
      ctx.fill();
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      return;
    }

    // Left face
    ctx.beginPath();
    ctx.moveTo(cx - TILE_W / 2, cyTop);
    ctx.lineTo(cx, cyTop + TILE_H / 2);
    ctx.lineTo(cx, cyBase + TILE_H / 2);
    ctx.lineTo(cx - TILE_W / 2, cyBase);
    ctx.closePath();
    ctx.fillStyle = shade(topColor, 0.62);
    ctx.fill();

    // Right face
    ctx.beginPath();
    ctx.moveTo(cx + TILE_W / 2, cyTop);
    ctx.lineTo(cx, cyTop + TILE_H / 2);
    ctx.lineTo(cx, cyBase + TILE_H / 2);
    ctx.lineTo(cx + TILE_W / 2, cyBase);
    ctx.closePath();
    ctx.fillStyle = shade(topColor, 0.8);
    ctx.fill();

    // Top face
    diamond(cx, cyTop);
    ctx.fillStyle = topColor;
    ctx.fill();
  });
}

/* -------------------------------- render ---------------------------------- */

function setView(view) {
  state.view = view;
  const root = document.getElementById('gh-contrib');
  if (!root) return;
  root.setAttribute('data-view', view);
  root.querySelectorAll('.gh-contrib__view-btn').forEach(btn => {
    const active = btn.dataset.view === view;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  if (view !== '2d' && state.activeData) {
    // Canvas needs a real layout pass before sizing on first reveal
    requestAnimationFrame(() => render3D(state.activeData));
  }
}

function paintStats(data) {
  const s = computeStats(data);
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const heading = document.getElementById('gh-contrib-heading');
  if (heading) {
    heading.textContent = `${s.total.toLocaleString()} contribution${
      s.total === 1 ? '' : 's'
    } in ${data.year}`;
  }

  setText('gh-total', s.total.toLocaleString());
  setText('gh-total-range', `${fmtShort.format(s.rangeStart)} → ${fmtShort.format(s.rangeEnd)}`);
  setText('gh-week', s.thisWeek.toLocaleString());
  setText('gh-week-range', `${fmtShort.format(s.weekStart)} → ${fmtShort.format(s.weekEnd)}`);
  setText('gh-best', s.best.count > 0 ? s.best.count.toLocaleString() : '0');
  setText('gh-best-date', s.best.date ? fmtShort.format(s.best.date) : '—');
  setText('gh-avg', s.average.toFixed(2));

  const longestBtn = document.getElementById('gh-longest');
  if (longestBtn)
    longestBtn.innerHTML = `${s.longest.len} <span class="gh-contrib__unit">days</span>`;
  setText(
    'gh-longest-range',
    s.longest.start
      ? `${fmtShort.format(s.longest.start)} → ${fmtShort.format(s.longest.end)}`
      : '—'
  );

  const currentBtn = document.getElementById('gh-current');
  if (currentBtn)
    currentBtn.innerHTML = `${s.current.len} <span class="gh-contrib__unit">days</span>`;
  setText(
    'gh-current-range',
    s.current.len
      ? `${fmtShort.format(s.current.start)} → ${fmtShort.format(s.current.end)}`
      : 'No current streak'
  );

  const source = document.getElementById('gh-contrib-source');
  if (source) {
    source.textContent = data.isSample
      ? 'Showing a representative sample (live GitHub data unavailable).'
      : 'Live data from GitHub.';
  }
}

function renderAll(data) {
  state.activeData = data;
  paintStats(data);
  renderHeatmap(data);
  if (state.view !== '2d') requestAnimationFrame(() => render3D(data));
}

async function selectYear(year) {
  if (year === state.year && state.activeData) return;
  state.year = year;
  renderYears();
  const heading = document.getElementById('gh-contrib-heading');
  if (heading) heading.textContent = `Loading ${year}…`;
  const root = document.getElementById('gh-contrib');
  if (root) root.classList.add('is-loading');
  const data = await fetchYear(year);
  if (state.year !== year) return; // superseded by a newer click
  if (root) root.classList.remove('is-loading');
  renderAll(data);
}

/* --------------------------------- init ----------------------------------- */

let resizeRaf = null;
function onResize() {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    if (state.view !== '2d' && state.activeData) render3D(state.activeData);
  });
}

async function boot() {
  if (state.built) return;
  if (!document.getElementById('gh-contrib')) return;
  if (!buildShell()) return;
  state.built = true;

  setView(state.view);
  renderYears();

  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('portfolio-theme-change', () => {
    if (state.activeData) render3D(state.activeData);
  });

  await selectYear(state.year);
}

function init() {
  const root = document.getElementById('gh-contrib');
  if (!root || isPerfAudit()) return;
  state.root = root;

  const start = () => boot();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: '240px 0px' }
    );
    io.observe(root);
  } else {
    start();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

export { init };
