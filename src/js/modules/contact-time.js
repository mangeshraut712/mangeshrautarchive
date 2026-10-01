import { escapeHtml } from '../utils/escape-html.js';

const CITIES = [
  ['New York', 'America/New_York'],
  ['London', 'Europe/London'],
  ['Mumbai', 'Asia/Kolkata'],
  ['Tokyo', 'Asia/Tokyo'],
  ['Sydney', 'Australia/Sydney'],
  ['Paris', 'Europe/Paris'],
];
const INDIA_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
let panchang = null;
let requestedDay = '';
let clockTimer = null;
let nextPanchangRefresh = 0;

function renderPanchang() {
  const root = document.getElementById('contact-panchang');
  if (!root) return;
  const today = INDIA_DAY.format(new Date());
  const valid =
    panchang?.date === today &&
    panchang?.source === 'https://www.kalnirnay.com/' &&
    ['tithi', 'nakshatra', 'yog', 'karan', 'sunrise', 'sunset'].every(
      key => typeof panchang[key] === 'string' && panchang[key].trim()
    );
  const fields = valid
    ? [
        ['Tithi', panchang.tithi],
        ['Nakshatra', panchang.nakshatra],
        ['Yog', panchang.yog],
        ['Karan', panchang.karan],
        ['Sunrise', panchang.sunrise],
        ['Sunset', panchang.sunset],
      ]
    : [];
  root.innerHTML = `
    <div class="panchang-heading"><h4>Today’s Panchang</h4><time datetime="${today}">${escapeHtml(new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }).format(new Date()))}</time></div>
    ${valid ? `<dl class="panchang-values">${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>` : '<p class="panchang-fallback">View today’s Panchang directly from Kalnirnay.</p>'}
    <a class="calendar-marathi-link" href="https://www.kalnirnay.com/" target="_blank" rel="noopener noreferrer">Open the official Marathi calendar <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
    ${valid ? '<p class="panchang-source">Source: Kalnirnay</p>' : ''}`;
}

async function refreshPanchang() {
  const day = INDIA_DAY.format(new Date());
  if (requestedDay === day && Date.now() < nextPanchangRefresh) return;
  requestedDay = day;
  nextPanchangRefresh = Date.now() + 30 * 60 * 1000;
  if (panchang?.date !== day) panchang = null;
  renderPanchang();
  try {
    const url = new URL('../../assets/data/kalnirnay-panchang.json', import.meta.url);
    url.searchParams.set('day', day);
    const response = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout(8000) });
    if (response.ok) panchang = await response.json();
  } catch {
    // The official source link remains available when today's publication cannot be loaded.
  }
  renderPanchang();
}

function clockFace() {
  return `<svg class="world-clock-face" viewBox="0 0 120 120" aria-hidden="true">
    <circle class="clock-dial" cx="60" cy="60" r="57" />
    ${Array.from({ length: 12 }, (_, index) => {
      const number = index + 1;
      const angle = (number * Math.PI) / 6;
      return `<text x="${60 + Math.sin(angle) * 45}" y="${60 - Math.cos(angle) * 45}" text-anchor="middle" dominant-baseline="central">${number}</text>`;
    }).join('')}
    <line class="clock-hour" x1="60" y1="60" x2="60" y2="32" />
    <line class="clock-minute" x1="60" y1="60" x2="60" y2="20" />
    <line class="clock-second" x1="60" y1="67" x2="60" y2="16" />
    <circle class="clock-center" cx="60" cy="60" r="2.5" />
  </svg>`;
}

function updateClocks() {
  if (document.hidden) return;
  const now = new Date();
  for (const card of document.querySelectorAll('.world-clock')) {
    const zone = card.dataset.timeZone;
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(now);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const hour = Number(values.hour);
    const minute = Number(values.minute);
    const second = Number(values.second);
    card
      .querySelector('.clock-hour')
      .setAttribute('transform', `rotate(${(hour % 12) * 30 + minute / 2 + second / 120} 60 60)`);
    card
      .querySelector('.clock-minute')
      .setAttribute('transform', `rotate(${minute * 6 + second / 10} 60 60)`);
    card.querySelector('.clock-second').setAttribute('transform', `rotate(${second * 6} 60 60)`);
    const time = card.querySelector('time');
    time.textContent = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(now);
    time.dateTime = now.toISOString();
    card.querySelector('.world-clock-date').textContent = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(now);
  }
  void refreshPanchang();
}

export function initContactTime() {
  const root = document.getElementById('contact-world-clocks');
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `<h4>World clocks</h4><div class="world-clocks-grid">${CITIES.map(([city, zone]) => `<div class="world-clock" data-time-zone="${zone}">${clockFace()}<h5>${city}</h5><time></time><span class="world-clock-date"></span></div>`).join('')}</div>`;
  }
  renderPanchang();
  if (!clockTimer) {
    updateClocks();
    clockTimer = setInterval(updateClocks, 1000);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    clearInterval(clockTimer);
    clockTimer = null;
  });
  window.addEventListener('pageshow', () => {
    if (document.getElementById('contact-world-clocks')) initContactTime();
  });
  document.addEventListener('visibilitychange', updateClocks);
}
