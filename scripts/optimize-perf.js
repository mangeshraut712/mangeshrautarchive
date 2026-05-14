#!/usr/bin/env node
/**
 * Aggressive Performance Optimization Script
 * Targets: 100/100/100/100 on Lighthouse
 */

import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const srcDir = resolve(projectRoot, 'src');
const distDir = resolve(projectRoot, 'dist');

// Colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

async function minifyCSS(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*}/g, '}') // Remove last semicolon in block
    .replace(/;\s*;/g, ';') // Remove duplicate semicolons
    .replace(/\s*{\s*/g, '{') // Clean braces
    .replace(/\s*}\s*/g, '}')
    .replace(/,\s*/g, ',') // Clean commas
    .replace(/:\s*/g, ':') // Clean colons
    .replace(/;\s*/g, ';') // Clean semicolons
    .trim();
}

async function minifyJS(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*;/g, ';') // Remove duplicate semicolons
    .trim();
}

async function _optimizeHTML(content) {
  return content
    .replace(/<!--(?!<!\[CDATA\[)[\s\S]*?-->/g, '') // Remove comments
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/"\s+>/g, '">') // Clean tag endings
    .trim();
}

async function processDirectory(dir, extension, processor) {
  const entries = await readdir(dir, { withFileTypes: true });
  let totalSaved = 0;

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      const saved = await processDirectory(path, extension, processor);
      totalSaved += saved;
    } else if (entry.name.endsWith(extension)) {
      const content = await readFile(path, 'utf8');
      const originalSize = Buffer.byteLength(content, 'utf8');
      const optimized = await processor(content);
      const newSize = Buffer.byteLength(optimized, 'utf8');

      await writeFile(path, optimized, 'utf8');
      totalSaved += originalSize - newSize;

      const kb = (originalSize - newSize) / 1024;
      if (kb > 0.1) {
        console.log(`${colors.green}✓${colors.reset} ${entry.name}: saved ${kb.toFixed(2)} KB`);
      }
    }
  }

  return totalSaved;
}

async function optimizeImages() {
  console.log(`${colors.blue}\n📸 Optimizing images...${colors.reset}`);

  const imagesDir = resolve(srcDir, 'assets/images');

  try {
    // Use sharp if available for WebP conversion
    const sharp = await import('sharp').catch(() => null);

    if (sharp) {
      const entries = await readdir(imagesDir, { withFileTypes: true, recursive: true });

      await Promise.all(entries.map(async entry => {
        if (!entry.isFile()) return;

        const ext = entry.name.toLowerCase();
        if (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png')) {
          const path = join(entry.parentPath || imagesDir, entry.name);
          const webpPath = path.replace(/\.(jpg|jpeg|png)$/i, '.webp');

          try {
            await sharp.default(path).webp({ quality: 85, effort: 6 }).toFile(webpPath);

            const originalSize = (await stat(path)).size;
            const webpSize = (await stat(webpPath)).size;
            const saved = (originalSize - webpSize) / 1024;

            console.log(
              `${colors.green}✓${colors.reset} ${entry.name} → .webp (saved ${saved.toFixed(2)} KB)`
            );
          } catch (_e) {
            // Ignore errors for individual images
          }
        }
      }));
    }
  } catch (_e) {
    console.log(
      `${colors.yellow}⚠${colors.reset} Image optimization skipped (sharp not available)`
    );
  }
}

async function addPerformanceHeaders() {
  console.log(`${colors.blue}\n🔧 Adding performance optimizations to HTML...${colors.reset}`);

  const indexPath = resolve(srcDir, 'index.html');
  let html = await readFile(indexPath, 'utf8');

  // Add resource hints for external domains
  const resourceHints = `
  <!-- Critical Performance Optimizations -->
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
  <link rel="dns-prefetch" href="https://ws.audioscrobbler.com" />
  <link rel="dns-prefetch" href="https://lastfm.freetls.fastly.net" />
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin />
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
  <meta name="view-transition" content="same-origin" />
`;

  // Insert after charset meta
  html = html.replace(/<meta charset="UTF-8" \/>/, `<meta charset="UTF-8" />${resourceHints}`);

  // Add loading="lazy" to all images that don't have it
  html = html.replace(/<img(?!.*?loading=)([^>]*?)>/gi, '<img$1 loading="lazy" decoding="async">');

  // Add fetchpriority to critical images only
  html = html.replace(
    /<img([^>]*?)src="assets\/images\/profile\.jpg"([^>]*?)>/i,
    '<img$1src="assets/images/profile.jpg"$2 fetchpriority="high" loading="eager" decoding="async">'
  );

  // Defer all non-critical scripts
  html = html.replace(/<script((?!.*?(defer|async))[^>]*?)src=/gi, '<script$1 defer src=');

  // Add critical CSS inline
  const criticalCSS = `
    <style>
      /* Critical CSS for above-the-fold content */
      .hero-section{min-height:100vh;display:flex;align-items:center;justify-content:center}
      .profile-image-wrapper{position:relative;width:200px;height:200px;margin:0 auto}
      .profile-image{width:100%;height:100%;object-fit:cover;border-radius:50%}
      .hero-name{font-size:3rem;font-weight:700;text-align:center;margin-bottom:1rem}
      .hero-title{font-size:1.5rem;text-align:center;opacity:0.9}
      .hero-actions{display:flex;gap:1rem;justify-content:center;margin-top:2rem}
      .btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;border-radius:9999px;font-weight:500;transition:all 0.2s}
      .btn:hover{transform:translateY(-2px)}
      .skip-link{position:absolute;left:-9999px}
      .skip-link:focus{left:0;z-index:10000}
    </style>
  `;

  // Insert critical CSS before first stylesheet
  html = html.replace(/<link rel="stylesheet"/, `${criticalCSS}<link rel="stylesheet"`);

  await writeFile(indexPath, html, 'utf8');
  console.log(`${colors.green}✓${colors.reset} HTML performance optimizations applied`);
}

async function optimize() {
  console.log(`${colors.blue}🚀 Starting aggressive performance optimization...${colors.reset}\n`);

  // Step 1: Build first
  console.log(`${colors.blue}📦 Building project...${colors.reset}`);
  try {
    execSync('pnpm run build', { cwd: projectRoot, stdio: 'inherit' });
  } catch (_e) {
    console.error(`${colors.red}✗ Build failed${colors.reset}`);
    process.exit(1);
  }

  // Step 2: Minify CSS
  console.log(`${colors.blue}\n🎨 Minifying CSS...${colors.reset}`);
  const cssSaved = await processDirectory(distDir, '.css', minifyCSS);
  console.log(
    `${colors.green}✓${colors.reset} CSS optimization saved ${(cssSaved / 1024).toFixed(2)} KB`
  );

  // Step 3: Minify JS
  console.log(`${colors.blue}\n📜 Minifying JavaScript...${colors.reset}`);
  const jsSaved = await processDirectory(distDir, '.js', minifyJS);
  console.log(
    `${colors.green}✓${colors.reset} JS optimization saved ${(jsSaved / 1024).toFixed(2)} KB`
  );

  // Step 4: Optimize images
  await optimizeImages();

  // Step 5: Add performance headers to HTML
  await addPerformanceHeaders();

  // Step 6: Final optimized build
  console.log(`${colors.blue}\n📦 Final optimized build...${colors.reset}`);
  try {
    execSync('pnpm run build', { cwd: projectRoot, stdio: 'inherit' });
  } catch (_e) {
    // Continue even if build has warnings
  }

  console.log(`${colors.green}\n✅ Performance optimization complete!${colors.reset}`);
  console.log(`${colors.yellow}\n🎯 Target scores: 100/100/100/100${colors.reset}`);
  console.log(`${colors.blue}Run 'pnpm run qa:lighthouse:desktop' to verify${colors.reset}\n`);
}

optimize().catch(console.error);
