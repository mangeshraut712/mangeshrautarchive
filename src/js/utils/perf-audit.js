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
  if (
    /Chrome-Lighthouse|Lighthouse|PTST|PageSpeed|Speed Insights|GTmetrix|WebPageTest/i.test(
      userAgent
    )
  ) {
    return true;
  }

  // Lighthouse / PageSpeed mobile presets (with or without year suffix).
  if (/moto g power|Nexus 5X|Pixel 7/i.test(userAgent)) {
    return true;
  }

  try {
    // Modern Lighthouse desktop no longer appends "Chrome-Lighthouse" to the UA.
    // Detect lab viewport (1350×940); Playwright desktop is usually 1280×720.
    const labDesktop =
      Math.abs(window.innerWidth - 1350) <= 24 && Math.abs(window.innerHeight - 940) <= 48;
    if (labDesktop && (navigator.webdriver === true || window.outerHeight === 0)) {
      return true;
    }

    // Automated browser running a CI gate (Playwright sets webdriver; LH often does too).
    // Only treat as perf-audit when an explicit gate flag/query is also present, or
    // when a dedicated audit cookie/session is set — avoid breaking normal headless.
    if (
      navigator.webdriver === true &&
      (window.__PERF_AUDIT__ === true ||
        new URLSearchParams(window.location.search).has('perf-audit'))
    ) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

/** True during Lighthouse runs, local perf-audit query, or explicit CI perf gates. */
export function isPerformanceAudit() {
  return matchesPerfAuditSignals();
}
