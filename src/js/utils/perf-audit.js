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
  if (/Chrome-Lighthouse|Lighthouse|PTST|HeadlessChrome/i.test(userAgent)) {
    return true;
  }

  // Lighthouse mobile preset (webdriver is often hidden in modern headless Chrome).
  if (/moto g power \(2022\)/i.test(userAgent)) {
    return true;
  }

  return navigator.webdriver === true;
}

/** True during Lighthouse runs, local perf-audit query, or explicit CI perf gates. */
export function isPerformanceAudit() {
  return matchesPerfAuditSignals();
}
