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
  // Lighthouse-specific UA tokens only — not generic HeadlessChrome (Playwright E2E).
  if (/Chrome-Lighthouse|Lighthouse|PTST/i.test(userAgent)) {
    return true;
  }

  // Lighthouse mobile preset.
  if (/moto g power \(2022\)/i.test(userAgent)) {
    return true;
  }

  return false;
}

/** True during Lighthouse runs, local perf-audit query, or explicit CI perf gates. */
export function isPerformanceAudit() {
  return matchesPerfAuditSignals();
}
