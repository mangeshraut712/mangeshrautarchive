/** Keep request-controlled paths separate from the configured upstream origin. */
export function createApiProxyUrl(requestPath, upstreamOrigin) {
  if (
    typeof requestPath !== 'string' ||
    !requestPath.startsWith('/') ||
    requestPath.startsWith('//')
  ) {
    throw new TypeError('Expected an origin-relative API path');
  }
  const inbound = new URL(requestPath, 'http://local.invalid');
  if (
    inbound.origin !== 'http://local.invalid' ||
    (inbound.pathname !== '/api' && !inbound.pathname.startsWith('/api/'))
  ) {
    throw new TypeError('Expected an API path');
  }
  const destination = new URL(upstreamOrigin);
  if (
    !['http:', 'https:'].includes(destination.protocol) ||
    destination.username ||
    destination.password
  ) {
    throw new TypeError('Expected an HTTP upstream without URL credentials');
  }
  destination.pathname = inbound.pathname;
  destination.search = inbound.search;
  destination.hash = '';
  return destination;
}
