import { fileURLToPath } from 'url';
import { dirname, resolve, join, relative } from 'path';
import { mkdir, rm, readdir, stat, readFile, writeFile } from 'fs/promises';
import { transform } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Use /tmp when inside macOS-restricted directories (Downloads, Desktop in some configs)
// Detect by attempting a test write; fall back to /tmp/dist on EPERM
async function resolveDistDir() {
  const standard = resolve(projectRoot, 'dist');
  try {
    await mkdir(standard, { recursive: true });
    // Quick write test
    const probe = resolve(standard, '.write-probe');
    await writeFile(probe, '');
    await rm(probe, { force: true });
    return standard;
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      const tmp = resolve('/tmp', 'mangeshrautarchive-dist');
      console.warn(`⚠️  Project is in a macOS-restricted directory (${err.code}).`);
      console.warn(`   Building to ${tmp} instead.`);
      console.warn(`   To fix permanently: move the project out of Downloads.`);
      return tmp;
    }
    throw err;
  }
}

const srcDir = resolve(projectRoot, 'src');

const staticExtras = ['perplexity-mcp.json', 'CNAME'];

// Build-time public config injection for GitHub Pages
// SECURITY: API keys must NEVER be written here — they live in backend env vars only.
async function injectApiKeys(distDir) {
  const config = {
    // Safe public configuration only — NO secrets
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE || 'https://mangeshraut.pro',
    siteUrl: process.env.OPENROUTER_SITE_URL || 'https://mangeshraut.pro',
    appTitle: process.env.OPENROUTER_APP_TITLE || 'AssistMe Portfolio Assistant',
    selectedModel: process.env.OPENROUTER_MODEL || 'x-ai/grok-4.1-fast',
    lastfmApiKey: process.env.NEXT_PUBLIC_LASTFM_API_KEY || 'bef46b0d7702dac5b071906cd186bd28',
    musicDirectFallback: true,
    buildTime: new Date().toISOString(),
    version: `v${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
  };

  // Create build config JSON file (safe to ship — contains no secrets)
  const configPath = resolve(distDir, 'build-config.json');
  await writeFile(configPath, JSON.stringify(config, null, 2));

  console.log('⚙️  Build config written to: dist/build-config.json (no secrets)');

  // Create a JavaScript config for direct browser import
  const jsConfig = `// Auto-generated build configuration — safe public values only
// DO NOT add API keys or secrets to this file.
// This file is shipped to browsers and publicly visible.
(function () {
  const buildConfig = ${JSON.stringify(config, null, 2)};
  globalThis.buildConfig = buildConfig;
  globalThis.APP_CONFIG = Object.assign({}, globalThis.APP_CONFIG || {}, buildConfig);
})();
`;
  const jsConfigPath = resolve(distDir, 'build-config.js');
  await writeFile(jsConfigPath, jsConfig);

  console.log('📝 JS config written to: dist/build-config.js');
}

async function pathExists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively copy a directory by reading/writing file content byte-by-byte.
 * Avoids fs.cp() which tries to copy extended attributes (com.apple.provenance,
 * com.apple.quarantine) and fails with EPERM on macOS when source files have
 * origin metadata set by the OS on files from the Downloads folder or archives.
 */
async function copyDirContent(src, dest, depth = 0) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  await Promise.all(entries.map(async entry => {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirContent(srcPath, destPath, depth + 1);
    } else if (entry.isFile()) {
      try {
        const content = await readFile(srcPath);
        await writeFile(destPath, content);
      } catch (err) {
        // Skip unreadable files and keep building
        console.warn(`⚠️  Skipped (unreadable): ${relative(projectRoot, srcPath)} — ${err.code}`);
      }
    }
    // symlinks are intentionally skipped — not needed in dist
  }));
}

async function optimizeCopiedAssets(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const minifiableExtensions = new Set(['css', 'js']);

  await Promise.all(entries.map(async entry => {
    const entryPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await optimizeCopiedAssets(entryPath);
      return;
    }

    if (!entry.isFile()) {
      return;
    }

    const extension = entry.name.split('.').pop()?.toLowerCase();
    if (!extension || !minifiableExtensions.has(extension)) {
      return;
    }

    if (entry.name === 'build-config.js') {
      return;
    }

    const source = await readFile(entryPath, 'utf8');
    const result = await transform(source, {
      loader: extension === 'css' ? 'css' : 'js',
      legalComments: 'none',
      minify: true,
      target: extension === 'css' ? 'es2020' : 'es2020',
    });

    await writeFile(entryPath, result.code, 'utf8');
  }));
}

async function build() {
  const distDir = await resolveDistDir();

  const [, sourceExists] = await Promise.all([
    rm(distDir, { recursive: true, force: true }),
    pathExists(srcDir),
  ]);
  if (!sourceExists) {
    throw new Error('Source directory "src/" not found.');
  }

  await mkdir(distDir, { recursive: true });

  // Use content-copy (not fs.cp) to avoid EPERM on macOS provenance attributes
  console.log('📂 Copying src/ → dist/ ...');
  await copyDirContent(srcDir, distDir);

  await Promise.all(staticExtras.map(async item => {
    const source = resolve(projectRoot, item);
    if (await pathExists(source)) {
      const destination = resolve(distDir, item.split('/').pop());
      try {
        const content = await readFile(source);
        await writeFile(destination, content);
        console.log(`📋 Copied extra asset: ${item}`);
      } catch (err) {
        console.warn(`⚠️  Skipped extra asset: ${item} — ${err.code}`);
      }
    }
  }));

  console.log('⚡ Minifying copied CSS/JS assets ...');
  await Promise.all([
    injectApiKeys(distDir),
    optimizeCopiedAssets(distDir),
    addCacheBusting(distDir),
  ]);

  console.log(`✨ Build complete. Static assets written to ${distDir}`);
}

// Add cache busting query parameters to CSS and JS assets in HTML
async function addCacheBusting(distDir) {
  const htmlPath = resolve(distDir, 'index.html');
  const monitorPath = resolve(distDir, 'monitor.html');
  const travelPath = resolve(distDir, 'travel.html');

  const version = `v${Date.now()}`;

  const appendVersion = rawPath => {
    if (!rawPath) return rawPath;

    const [pathWithQuery, hash = ''] = String(rawPath).split('#');
    const [base, queryString = ''] = pathWithQuery.split('?');

    if (!/\.(css|js)$/i.test(base)) {
      return rawPath;
    }

    const params = new URLSearchParams(queryString);
    params.set('v', version);
    const nextPath = `${base}?${params.toString()}`;

    return hash ? `${nextPath}#${hash}` : nextPath;
  };

  await Promise.all([htmlPath, monitorPath, travelPath].map(async htmlFile => {
    if (await pathExists(htmlFile)) {
      let content = await readFile(htmlFile, 'utf8');

      // Add cache busting to CSS and JS files
      content = content.replace(
        /(href|src)="([^"]+)"/g,
        (match, attr, rawPath) => `${attr}="${appendVersion(rawPath)}"`
      );

      // Keep static asset paths repo-relative for GitHub Pages deployments.
      content = content.replace(
        /(href|src|data-href)="\/(assets|js)\//g,
        (match, attr, folder) => `${attr}="${folder}/`
      );

      await writeFile(htmlFile, content);
      console.log(`🔄 Added cache busting to ${relative(distDir, htmlFile)}`);
    }
  }));
}

build().catch(error => {
  console.error('Build failed:', error);
  process.exitCode = 1;
});
