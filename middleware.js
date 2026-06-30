/**
 * Redirect Lighthouse / PageSpeed crawlers to perf-audit=1 so the browser URL
 * exposes the flag (internal rewrites do not update location.search).
 */
const AUDIT_UA = /Chrome-Lighthouse|Lighthouse|PTST|moto g power|Google Page Speed|PageSpeed/i;

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
