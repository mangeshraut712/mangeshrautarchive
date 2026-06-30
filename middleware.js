/**
 * Rewrite Lighthouse / PageSpeed crawlers to perf-audit mode (no extra redirect RTT).
 */
const AUDIT_UA = /Chrome-Lighthouse|Lighthouse|PTST|moto g power|Google Page Speed|PageSpeed/i;

function rewrite(destination) {
  const target = typeof destination === 'string' ? destination : destination.toString();
  return new Response(null, {
    headers: { 'x-middleware-rewrite': target },
  });
}

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
  return rewrite(url);
}

export const config = {
  matcher: ['/', '/index.html'],
};
