import { fileURLToPath } from 'url';
import { dirname, resolve, join, relative } from 'path';
import { mkdir, rm, readdir, stat, readFile, writeFile } from 'fs/promises';

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

const staticExtras = ['perplexity-mcp.json'];

// Build-time public config injection for GitHub Pages
// SECURITY: API keys must NEVER be written here — they live in backend env vars only.
async function injectApiKeys(distDir) {
  const config = {
    // Safe public configuration only — NO secrets
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE || 'https://mangeshrautarchive.vercel.app',
    siteUrl: process.env.OPENROUTER_SITE_URL || 'https://mangeshraut.pro',
    appTitle: process.env.OPENROUTER_APP_TITLE || 'AssistMe Portfolio Assistant',
    selectedModel: process.env.OPENROUTER_MODEL || 'x-ai/grok-4.1-fast',
    buildTime: new Date().toISOString(),
  };

  // Create build config JSON file (safe to ship — contains no secrets)
  const configPath = resolve(distDir, 'build-config.json');
  await writeFile(configPath, JSON.stringify(config, null, 2));

  console.log('⚙️  Build config written to: dist/build-config.json (no secrets)');

  // Create a JavaScript config for direct browser import
  const jsConfig = `// Auto-generated build configuration — safe public values only
// DO NOT add API keys or secrets to this file.
// This file is shipped to browsers and publicly visible.
const buildConfig = ${JSON.stringify(config, null, 2)};

export default buildConfig;
export { buildConfig };
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

  for (const entry of entries) {
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
  }
}

async function build() {
  const distDir = await resolveDistDir();

  await rm(distDir, { recursive: true, force: true });

  if (!(await pathExists(srcDir))) {
    throw new Error('Source directory "src/" not found.');
  }

  await mkdir(distDir, { recursive: true });

  // Use content-copy (not fs.cp) to avoid EPERM on macOS provenance attributes
  console.log('📂 Copying src/ → dist/ ...');
  await copyDirContent(srcDir, distDir);

  for (const item of staticExtras) {
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
  }

  // Inject safe public config at build time (no secrets)
  await injectApiKeys(distDir);

  console.log(`✨ Build complete. Static assets written to ${distDir}`);
}

build().catch(error => {
  console.error('Build failed:', error);
  process.exitCode = 1;
});
