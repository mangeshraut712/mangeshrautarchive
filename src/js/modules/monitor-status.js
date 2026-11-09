import { portfolioStatus } from '../utils/portfolio-status.js';

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
const observations = [];
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
  if (
    record &&
    (!observations.length || observations.at(-1).timestamp !== model.timestamp || !model.fresh)
  ) {
    observations.push({ ...model, checkedAt: lastAttempt });
    if (observations.length > 24) observations.shift();
  }
  const focusedService = document.activeElement?.closest('details[data-service]')?.dataset.service;
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
          const samples = observations.map(sample => ({
            state: sample.services.find(item => item.id === service.id)?.state || 'unknown',
            checkedAt: sample.checkedAt,
          }));
          const bars =
            Array.from(
              { length: 24 - samples.length },
              () => '<span class="status-bar status-bar--empty" aria-hidden="true"></span>'
            ).join('') +
            samples
              .map(
                sample =>
                  `<span class="status-bar" data-state="${sample.state}" title="${escape(time(sample.checkedAt))}: ${labels[sample.state]}" aria-hidden="true"></span>`
              )
              .join('');
          return `<details class="status-service" data-service="${service.id}" ${expanded.has(service.id) ? 'open' : ''}>
          <summary><span class="status-service-name">${service.name}</span><span class="status-label" data-state="${service.state}"><span class="status-indicator" aria-hidden="true"></span>${labels[service.state]}</span><span class="status-chevron" aria-hidden="true">⌄</span></summary>
          <div class="status-service-detail"><p>${service.description}</p><p>${escape(model.fresh ? service.detail : 'Awaiting a fresh probe.')}${model.fresh && service.latency !== null ? ` · Response ${service.latency} ms` : ''}</p></div>
          </details><div class="status-observations" role="img" aria-label="${service.name}: ${samples.length} observations this visit. Latest: ${labels[service.state]}.">${bars}</div>`;
        })
        .join('')}
    </section>`
    )
    .join('');
  if (focusedService)
    root
      .querySelector(`details[data-service="${focusedService}"] summary`)
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
  document.getElementById('status-observation-count').textContent =
    `${observations.length} of 24 observations · this visit only`;
}

export function expirePublicStatus() {
  if (latestData && !portfolioStatus(latestData).fresh) renderPublicStatus(null, { record: false });
}
