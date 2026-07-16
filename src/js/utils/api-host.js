/**
 * Shared API host health — avoids spamming a blocked Vercel host from GitHub Pages.
 * Marks hosts dead on 402 DEPLOYMENT_DISABLED / network failure for the session.
 */

const deadHosts = new Set();
const healthyHosts = new Set();
let probePromise = null;

function originOf(urlOrBase) {
  try {
    if (!urlOrBase) return '';
    if (urlOrBase.startsWith('/')) {
      return typeof window !== 'undefined' ? window.location.origin : '';
    }
    return new URL(urlOrBase).origin;
  } catch {
    return '';
  }
}

export function markApiHostDead(base) {
  const o = originOf(base);
  if (o) {
    deadHosts.add(o);
    healthyHosts.delete(o);
  }
}

export function isApiHostMarkedDead(base) {
  const o = originOf(base);
  return Boolean(o && deadHosts.has(o));
}

/**
 * Quick HEAD/GET probe of /api/health (or path). Caches result for the page session.
 */
export async function probeApiBase(base, { timeoutMs = 3500, path = '/api/health' } = {}) {
  const origin = originOf(base);
  if (!origin) return false;
  if (deadHosts.has(origin)) return false;
  if (healthyHosts.has(origin)) return true;

  try {
    const res = await fetch(`${origin}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text().catch(() => '');
    if (
      res.status === 402 ||
      res.status === 503 ||
      /DEPLOYMENT_DISABLED|Payment required/i.test(text)
    ) {
      deadHosts.add(origin);
      return false;
    }
    // Any non-network response means the host is reachable (even 404).
    healthyHosts.add(origin);
    return true;
  } catch {
    deadHosts.add(origin);
    return false;
  }
}

/**
 * Resolve first healthy base from candidates (absolute URLs only).
 */
export async function resolveHealthyApiBase(candidates = [], options = {}) {
  const list = [...new Set((candidates || []).filter(Boolean).map(c => originOf(c) || c))];
  for (const base of list) {
    if (await probeApiBase(base, options)) {
      return base.replace(/\/$/, '');
    }
  }
  return '';
}

/**
 * One-shot probe for default Pages → Vercel path.
 */
export function probeDefaultPagesApi() {
  if (probePromise) return probePromise;
  if (typeof window === 'undefined') return Promise.resolve(false);
  const cfg = globalThis.APP_CONFIG || globalThis.buildConfig || {};
  const candidates = [
    ...(Array.isArray(cfg.apiBaseCandidates) ? cfg.apiBaseCandidates : []),
    cfg.apiBaseUrl,
    'https://mangeshraut.pro',
  ].filter(Boolean);
  probePromise = resolveHealthyApiBase(candidates).then(base => {
    if (base && globalThis.APP_CONFIG) {
      globalThis.APP_CONFIG.apiBaseUrl = base;
    }
    return Boolean(base);
  });
  return probePromise;
}
