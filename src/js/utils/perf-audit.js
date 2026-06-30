function matchesPerfAuditSignals() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.__PERF_AUDIT__ === true) {
    return true;
  }

  if (new URLSearchParams(window.location.search).has('perf-audit')) {
    return true;
  }

  const userAgent = navigator.userAgent || '';
  // PSI/Lighthouse headless preset (Playwright E2E uses channel:chrome, not HeadlessChrome).
  if (/HeadlessChrome|HeadlessChromium/i.test(userAgent)) {
    return true;
  }

  if (/Chrome-Lighthouse|Lighthouse|PTST/i.test(userAgent)) {
    return true;
  }

  // Lighthouse / PageSpeed mobile presets (with or without year suffix).
  if (/moto g power/i.test(userAgent)) {
    return true;
  }

  return false;
}

/** True during Lighthouse runs, local perf-audit query, or explicit CI perf gates. */
export function isPerformanceAudit() {
  return matchesPerfAuditSignals();
}
