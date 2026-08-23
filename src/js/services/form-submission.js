const EDGE_API_BASE = 'https://assistme-chat.mangeshraut712.workers.dev';
const LOCAL_API_BASE = 'http://127.0.0.1:8001';
const TRACKED_UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'];

export function getFormsApiBase(location = globalThis.location || {}) {
  const hostname = String(location.hostname || '').toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return LOCAL_API_BASE;
  }
  if (hostname.endsWith('github.io')) {
    return EDGE_API_BASE;
  }
  return String(globalThis.APP_CONFIG?.apiBaseUrl || '').replace(/\/$/, '');
}

export function getSubmissionContext({
  source = 'website',
  location = globalThis.location || {},
  referrer = globalThis.document?.referrer || '',
} = {}) {
  const incoming = new URLSearchParams(String(location.search || ''));
  const tracked = new URLSearchParams();
  for (const key of TRACKED_UTM_KEYS) {
    const value = String(incoming.get(key) || '').trim();
    if (value) tracked.set(key, value.slice(0, 128));
  }
  const query = tracked.toString();
  const landingPath = `${String(location.pathname || '/')}${query ? `?${query}` : ''}${String(
    location.hash || ''
  )}`.slice(0, 512);
  const isDailyDev = /(^|\.)daily\.dev$/i.test(
    (() => {
      try {
        return new URL(String(referrer || '')).hostname;
      } catch {
        return '';
      }
    })()
  );
  const utmSource = String(tracked.get('utm_source') || '').slice(0, 128);

  return {
    source: (utmSource || (isDailyDev ? 'dailydev' : source)).slice(0, 64),
    landingPath,
    referrer: String(referrer || '').slice(0, 1024),
    utmSource,
    utmMedium: String(tracked.get('utm_medium') || '').slice(0, 128),
    utmCampaign: String(tracked.get('utm_campaign') || '').slice(0, 128),
  };
}

function responseError(payload, status) {
  return (
    payload?.error ||
    payload?.detail ||
    payload?.message ||
    (status === 429
      ? 'Too many attempts. Please wait before trying again.'
      : 'The form could not be saved. Please try again.')
  );
}

export async function submitStoredForm(endpoint, payload, { fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('Form submission is unavailable.');
  }
  const response = await fetchImpl(`${getFormsApiBase()}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(responseError(result, response.status));
  }
  if (!result?.success || result?.persisted !== true) {
    throw new Error('Subscription could not be saved. Please try again.');
  }
  return result;
}

export { EDGE_API_BASE };
