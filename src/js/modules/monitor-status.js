import { portfolioStatus, STATUS_SERVICES } from '../utils/portfolio-status.js';

const labels = {
  healthy: 'Operational',
  degraded: 'Degraded',
  unhealthy: 'Unavailable',
  unknown: 'Not verified',
};
const headlines = {
  healthy: 'All monitored services operational',
  degraded: 'Some services need attention',
  unhealthy: 'A service is currently unavailable',
  unknown: 'Service status is not verified',
};
const HISTORY_ORIGIN = 'https://portfolio-status.mangeshraut712.workers.dev';
let historyData = null;
let historyFailed = false;
let historyInFlight = null;
let historyLoadedAt = null;
let incidentCursor = null;
let incidentPages = [];
let loadingMore = false;

let latestData = null;
let lastAttempt = null;
const escape = value =>
  String(value ?? '').replace(
    /[&<>"']/g,
    char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  );
const time = value =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function renderPublicStatus(data, { record = true } = {}) {
  if (record) {
    latestData = data;
    lastAttempt = Date.now();
  }
  const model = portfolioStatus(latestData);
  const root = document.getElementById('public-status');
  if (!root) return;
  root.dataset.state = model.state;
  document.getElementById('public-status-title').textContent = headlines[model.state];
  document.getElementById('public-status-description').textContent = model.fresh
    ? 'Live availability checks for the services behind this portfolio.'
    : 'Fresh monitoring data is unavailable. This does not confirm a website outage. Try refreshing.';
  document.getElementById('public-status-updated').textContent = model.fresh
    ? `Checked ${time(model.timestamp)} · refreshes every 30 seconds`
    : `No fresh result${lastAttempt ? ` · last attempt ${time(lastAttempt)}` : ''}`;
  const focusedService = document.activeElement?.closest('details[data-service]')?.dataset.service;
  const focusedDaily = document.activeElement?.matches('.status-daily summary');
  const expandedDaily = new Set(
    [...root.querySelectorAll('.status-daily[open]')].map(
      item => item.closest('[data-service]').dataset.service
    )
  );
  const expanded = new Set(
    [...root.querySelectorAll('details[open]')].map(item => item.dataset.service)
  );
  document.getElementById('status-services').innerHTML = [
    ...new Set(model.services.map(service => service.group)),
  ]
    .map(
      group => `
    <section class="status-service-group" aria-label="${escape(group)}">
      <h3>${escape(group)}</h3>
      ${model.services
        .filter(service => service.group === group)
        .map(service => {
          const history = historyData?.services?.find(item => item.id === service.id);
          const days = Array.isArray(history?.days) ? history.days : [];
          const bars = days.length
            ? days
                .map(day => {
                  const state = !day.total
                    ? 'unknown'
                    : day.unhealthy
                      ? 'unhealthy'
                      : day.degraded
                        ? 'degraded'
                        : day.total < day.expected
                          ? 'unknown'
                          : 'healthy';
                  return `<span class="status-bar ${!day.total ? 'status-bar--empty' : ''}" data-state="${state}" title="${escape(day.day)} UTC: ${day.total ? `${percent(day.uptime)} sampled uptime, ${day.total}/${day.expected} checks` : 'No data'}" aria-hidden="true"></span>`;
                })
                .join('')
            : Array.from(
                { length: 90 },
                () => '<span class="status-bar status-bar--empty" aria-hidden="true"></span>'
              ).join('');
          const uptime = history?.samples
            ? `${percent(history.uptime)} sampled uptime · ${history.samples} checks · ${percent(history.coverage)} coverage`
            : 'No stored checks yet';
          const daily = days.filter(day => day.total || day.expected).reverse();
          const dailyTable = daily.length
            ? `<details class="status-daily" ${expandedDaily.has(service.id) ? 'open' : ''}><summary>Daily availability · UTC</summary><div class="status-table-wrap" tabindex="0" aria-label="Daily checks for ${service.name}"><table><caption>Recorded checks and monitoring coverage</caption><thead><tr><th scope="col">Date</th><th scope="col">Sampled uptime</th><th scope="col">Checks / expected</th></tr></thead><tbody>${daily.map(day => `<tr><th scope="row">${escape(day.day)}</th><td>${day.total ? percent(day.uptime) : 'No data'}</td><td>${day.total} / ${day.expected}</td></tr>`).join('')}</tbody></table></div></details>`
            : '';
          return `<details class="status-service" data-service="${service.id}" ${expanded.has(service.id) ? 'open' : ''}>
          <summary><span class="status-service-name">${service.name}</span><span class="status-label" data-state="${service.state}"><span class="status-indicator" aria-hidden="true"></span>${labels[service.state]}</span><span class="status-chevron" aria-hidden="true">⌄</span></summary>
          <div class="status-service-detail"><p>${service.description}</p><p>${escape(model.fresh ? service.detail : 'Awaiting a fresh probe.')}${model.fresh && service.latency !== null ? ` · Response ${service.latency} ms` : ''}</p>${dailyTable}</div>
          </details><div class="status-observations" role="img" aria-label="${service.name}: 90-day availability history. ${escape(uptime)}.">${bars}</div><p class="status-uptime">${escape(uptime)}</p>`;
        })
        .join('')}
    </section>`
    )
    .join('');
  if (focusedService)
    root
      .querySelector(
        `details[data-service="${focusedService}"] ${focusedDaily ? '.status-daily summary' : 'summary'}`
      )
      ?.focus({ preventScroll: true });
  const issues = model.services.filter(service =>
    ['degraded', 'unhealthy'].includes(service.state)
  );
  const unknown = model.services.some(service => service.state === 'unknown');
  document.getElementById('status-issues').innerHTML = issues.length
    ? issues
        .map(
          service =>
            `<article class="status-issue"><span class="status-label" data-state="${service.state}">${labels[service.state]}</span><h3>${service.name}</h3><p>${escape(service.detail)}</p><p class="status-caption">Observed ${escape(time(model.timestamp))}. This is an automated probe result, not a confirmed incident report.</p></article>`
        )
        .join('')
    : `<p class="status-empty">${unknown ? 'Current issues cannot be confirmed until all monitoring results are available.' : model.state !== 'healthy' ? 'The monitoring API reports a broader service warning. Open Diagnostics for details.' : 'No issues detected by the latest availability checks.'}</p>`;
  const latestStored = Math.max(
    0,
    ...(historyData?.services || []).map(service => service.last_checked || 0)
  );
  const started = Math.min(
    ...(historyData?.services || [])
      .map(service => service.tracking_since)
      .filter(value => Number.isFinite(value))
  );
  document.getElementById('status-observation-count').textContent = Number.isFinite(started)
    ? `Tracking since ${dateTime(started)}`
    : 'Persistent monitoring · every five minutes';
  const historyNote = document.getElementById('history-status');
  if (historyNote)
    historyNote.textContent = historyFailed
      ? `History refresh unavailable.${historyLoadedAt ? ` Showing records retrieved ${dateTime(historyLoadedAt)}.` : ' Try again to load stored records.'}`
      : latestStored
        ? `Last stored check ${dateTime(latestStored)}.${Date.now() - latestStored > 900000 ? ' Scheduled monitoring is delayed; coverage may be incomplete.' : ''}`
        : 'Waiting for the first scheduled checks. Earlier days have no data.';
  renderIncidents();
}

export function expirePublicStatus() {
  if (latestData && !portfolioStatus(latestData).fresh) renderPublicStatus(null, { record: false });
}

function percent(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toFixed(2)}%`
    : 'Unavailable';
}
function dateTime(value) {
  return (
    new Date(value).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC'
  );
}
function renderIncidents() {
  const container = document.getElementById('persistent-incidents');
  if (!container) return;
  const records = [
    ...(historyData?.active_incidents || []),
    ...(historyData?.incidents || []),
    ...incidentPages,
  ];
  const byId = new Map();
  for (const item of records) if (!byId.has(item.id)) byId.set(item.id, item);
  const unique = [...byId.values()];
  container.innerHTML = unique.length
    ? unique
        .map(incident => {
          const name =
            STATUS_SERVICES.find(service => service.id === incident.service_id)?.name ||
            'Portfolio service';
          const resolved = Number.isFinite(incident.resolved_at);
          return `<article class="status-issue" data-incident-id="${escape(incident.id)}"><span class="status-label" data-state="${resolved ? 'healthy' : incident.severity === 'degraded' ? 'degraded' : 'unhealthy'}">${resolved ? 'Resolved' : 'Ongoing'}</span><h3>${name} availability</h3><p>Automated checks detected ${incident.http_status ? `HTTP ${Number(incident.http_status)}` : 'a connection failure or timeout'}.</p><ol class="incident-timeline"><li>First failed check: ${escape(dateTime(incident.started_at))}</li><li>Confirmed after consecutive failures: ${escape(dateTime(incident.confirmed_at))}</li><li>${resolved ? `Recovery confirmed: ${escape(dateTime(incident.resolved_at))}` : `Last failed check: ${escape(dateTime(incident.last_failure_at))}`}</li></ol></article>`;
        })
        .join('')
    : `<p class="status-empty">${!historyData ? 'Incident history is unavailable until stored records load.' : 'No confirmed incidents recorded since monitoring began.'}</p>`;
  const more = document.getElementById('history-load-more');
  more.hidden = !incidentCursor;
  more.disabled = loadingMore;
}
export function refreshPersistentHistory() {
  if (historyInFlight) return historyInFlight;
  historyInFlight = (async () => {
    try {
      const response = await fetch(`${HISTORY_ORIGIN}/api/history`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error('History unavailable');
      const data = await response.json();
      if (!Array.isArray(data.services) || !Array.isArray(data.incidents))
        throw new Error('Invalid history');
      historyData = data;
      // Keep already expanded history while refreshing the newest page.
      if (!incidentPages.length) incidentCursor = data.next_cursor;
      historyFailed = false;
      historyLoadedAt = Date.now();
    } catch {
      historyFailed = true;
    } finally {
      historyInFlight = null;
      if (lastAttempt) renderPublicStatus(latestData, { record: false });
    }
  })();
  return historyInFlight;
}
document.addEventListener('click', async event => {
  if (event.target.closest('#history-retry')) {
    await refreshPersistentHistory();
    return;
  }
  if (!event.target.closest('#history-load-more') || loadingMore || !incidentCursor) return;
  loadingMore = true;
  renderIncidents();
  try {
    const response = await fetch(
      `${HISTORY_ORIGIN}/api/incidents?before=${encodeURIComponent(incidentCursor)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) throw new Error('History unavailable');
    const data = await response.json();
    if (!Array.isArray(data.incidents)) throw new Error('Invalid incidents');
    incidentPages.push(...data.incidents);
    incidentCursor = data.next_cursor;
    document.getElementById('incident-page-message').textContent = '';
  } catch {
    document.getElementById('incident-page-message').textContent =
      'Older incidents could not load. Try again.';
  } finally {
    loadingMore = false;
    renderIncidents();
  }
});
