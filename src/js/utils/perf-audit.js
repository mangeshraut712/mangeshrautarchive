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

  return false;
}

/** True only for an explicitly requested performance audit. */
export function isPerformanceAudit() {
  return matchesPerfAuditSignals();
}
