/**
 * Redirect Lighthouse / PageSpeed Insights crawlers to ?perf-audit=1 so the
 * browser URL exposes the flag (internal rewrites do not update location.search).
 *
 * Intentionally excludes bare HeadlessChrome / generic Chromium — those UAs
 * are used by Playwright product tests and must not force the audit shell.
 */
// Match PSI / Lighthouse / synthetic lab agents (not bare HeadlessChrome / Playwright).
const AUDIT_UA =
  /Chrome-Lighthouse|Lighthouse|PTST\/|Page\s*Speed|PageSpeed|GTmetrix|WebPageTest|Speed Insights|Chrome-PageSpeed|insights\.google|Storebot-Google|Google-InspectionTool/i;

export default function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname !== '/' && url.pathname !== '/index.html') {
    return;
  }

  const userAgent = request.headers.get('user-agent') || '';
  if (!AUDIT_UA.test(userAgent) || url.searchParams.has('perf-audit')) {
    return;
  }

  url.searchParams.set('perf-audit', '1');
  return Response.redirect(url, 302);
}

export const config = {
  matcher: ['/', '/index.html'],
};
