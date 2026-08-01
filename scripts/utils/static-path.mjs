import { isAbsolute, relative, resolve } from 'node:path';

export function decodeStaticRequestPath(requestPath) {
  try {
    return decodeURIComponent(String(requestPath || '/'));
  } catch {
    return null;
  }
}

export function isPathInsideRoot(root, candidate) {
  const relativePath = relative(resolve(root), resolve(candidate));
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

export function resolveStaticCandidate(root, requestPath) {
  const decodedPath = decodeStaticRequestPath(requestPath);
  if (decodedPath === null) return null;

  const rootedPath = decodedPath.startsWith('/') ? decodedPath : `/${decodedPath}`;
  const normalizedPath =
    rootedPath.length > 1 && rootedPath.endsWith('/') ? rootedPath.replace(/\/+$/, '') : rootedPath;
  const safePath = normalizedPath === '/' ? '/index.html' : normalizedPath;
  const filePath = resolve(root, `.${safePath}`);

  if (!isPathInsideRoot(root, filePath)) return null;
  return { safePath, filePath };
}
