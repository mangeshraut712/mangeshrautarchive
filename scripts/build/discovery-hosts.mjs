/**
 * Hosts that discovery files may still name. Production output rewrites them
 * to the live static origin (GitHub Pages unless OPENROUTER_SITE_URL is set).
 * Longer names come first so `www.` is not left half-rewritten.
 */
export const DISCOVERY_HOSTS = [
  'https://www.mangeshraut.pro',
  'https://mangeshraut.pro',
  'https://mangeshraut712.github.io/mangeshrautarchive',
];

export function rewriteDiscoveryHosts(text, siteUrl) {
  const target = String(siteUrl || '').replace(/\/$/, '');
  let next = String(text ?? '');
  for (const host of DISCOVERY_HOSTS) {
    if (!host || host === target) continue;
    next = next.split(host).join(target);
  }
  return next;
}
