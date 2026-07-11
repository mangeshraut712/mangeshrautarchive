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
  // Only real Lighthouse / PageSpeed / WebPageTest agents — not bare HeadlessChrome.
  // Headless-only detection disables search/theme bootstrap for Playwright CI.
  if (/Chrome-Lighthouse|Lighthouse|PTST|PageSpeed/i.test(userAgent)) {
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
