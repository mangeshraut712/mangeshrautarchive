import express from 'express';
import { readFile, stat } from 'fs/promises';
import { brotliCompressSync, gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import { dirname, extname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const distDir = resolve(projectRoot, process.env.DIST_DIR || 'dist');
const port = Number.parseInt(process.env.PORT || '4180', 10);

const app = express();
const compressedCache = new Map();

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

const compressibleExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml',
]);

function setAssetHeaders(res, filePath) {
  const extension = extname(filePath).toLowerCase();

  if (extension === '.html') {
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    return;
  }

  if (['.css', '.js'].includes(extension)) {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    return;
  }

  if (
    ['.woff', '.woff2', '.ttf', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico', '.gif'].includes(
      extension
    )
  ) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }

  if (filePath.endsWith('service-worker.js') || filePath.endsWith('manifest.json')) {
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
  }
}

function getMimeType(filePath) {
  return mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function getCompressedPayload(filePath, buffer, encoding) {
  const cacheKey = `${filePath}:${encoding}`;
  if (compressedCache.has(cacheKey)) {
    return compressedCache.get(cacheKey);
  }

  const compressed =
    encoding === 'br'
      ? brotliCompressSync(buffer)
      : encoding === 'gzip'
        ? gzipSync(buffer)
        : buffer;

  compressedCache.set(cacheKey, compressed);
  return compressed;
}

async function resolveFile(requestPath) {
  const safePath = requestPath === '/' ? '/index.html' : requestPath;
  const resolvedPath = resolve(distDir, `.${safePath}`);

  if (!resolvedPath.startsWith(distDir)) {
    return null;
  }

  try {
    const fileStat = await stat(resolvedPath);
    if (fileStat.isFile()) {
      return resolvedPath;
    }
  } catch {
    // Fall through to SPA fallback.
  }

  const fallbackPath = join(distDir, 'index.html');
  try {
    await stat(fallbackPath);
    return fallbackPath;
  } catch {
    return null;
  }
}

app.get('*', async (req, res) => {
  const filePath = await resolveFile(req.path);
  if (!filePath) {
    res.status(404).send('Not Found');
    return;
  }

  const fileBuffer = await readFile(filePath);
  const extension = extname(filePath).toLowerCase();
  const acceptsEncoding = req.headers['accept-encoding'] || '';

  res.setHeader('Content-Type', getMimeType(filePath));
  res.setHeader('Vary', 'Accept-Encoding');
  setAssetHeaders(res, filePath);

  if (compressibleExtensions.has(extension) && acceptsEncoding.includes('br')) {
    const compressed = getCompressedPayload(filePath, fileBuffer, 'br');
    res.setHeader('Content-Encoding', 'br');
    res.send(compressed);
    return;
  }

  if (compressibleExtensions.has(extension) && acceptsEncoding.includes('gzip')) {
    const compressed = getCompressedPayload(filePath, fileBuffer, 'gzip');
    res.setHeader('Content-Encoding', 'gzip');
    res.send(compressed);
    return;
  }

  res.send(fileBuffer);
});

app.listen(port, () => {
  console.log(`🚀 Production static server running at http://127.0.0.1:${port}`);
  console.log(`📦 Serving ${distDir}`);
});
