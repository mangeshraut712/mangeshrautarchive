export function resolveApiUrl(targetUrl, path) {
  const target = new URL(targetUrl);
  const apiOrigin =
    target.hostname === 'mangeshraut712.github.io'
      ? 'https://assistme-chat.mangeshraut712.workers.dev'
      : target.origin;
  return new URL(path, apiOrigin).toString();
}
