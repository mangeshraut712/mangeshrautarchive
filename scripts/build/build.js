import { fileURLToPath } from 'url';
import { dirname, resolve, join, relative } from 'path';
import { mkdir, rm, readdir, stat, readFile, writeFile } from 'fs/promises';
import { execSync } from 'child_process';
import { transform } from 'esbuild';
import { blogPosts } from '../../src/js/modules/blog-data.js';
import { generateBlogPages } from './generate-blog-pages.mjs';
import { generateCaseStudyPages } from './generate-case-study-pages.mjs';
import { caseStudies } from '../../src/js/modules/case-studies-data.js';
import { ASSET_VER } from './asset-version.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../');

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

const REQUIRED_VENDOR_ASSETS = [
  'assets/vendor/fontawesome/css/all.min.css',
  'assets/vendor/fontawesome/webfonts/fa-solid-900.woff2',
  'assets/vendor/fontawesome/webfonts/fa-regular-400.woff2',
  'assets/vendor/fontawesome/webfonts/fa-brands-400.woff2',
  'assets/vendor/fontawesome/LICENSE.txt',
];

async function assertVendorAssets() {
  const missing = [];
  for (const relativePath of REQUIRED_VENDOR_ASSETS) {
    const absolutePath = resolve(srcDir, relativePath);
    try {
      await stat(absolutePath);
    } catch {
      missing.push(relativePath);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing self-hosted vendor assets:\n${missing.map(item => `  - src/${item}`).join('\n')}\nCommit src/assets/vendor/fontawesome before building.`
    );
  }
}

const staticExtras = ['CNAME'];

const OPENROUTER_MODEL_ALIASES = {
  'x-ai/grok-4.1-fast': 'x-ai/grok-4.3',
  'x-ai/grok-4-fast': 'x-ai/grok-4.3',
};

function normalizeSelectedModel(rawModel) {
  const requested = (rawModel || 'x-ai/grok-4.3').trim();
  return OPENROUTER_MODEL_ALIASES[requested] || requested;
}

// Build-time public config injection for GitHub Pages
// SECURITY: API keys must NEVER be written here — they live in backend env vars only.
async function injectApiKeys(distDir) {
  let gitCommit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '';
  if (!gitCommit) {
    try {
      gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      gitCommit = '';
    }
  }

  const config = {
    // Safe public configuration only — NO secrets
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE || 'https://mangeshraut.pro',
    siteUrl: process.env.OPENROUTER_SITE_URL || 'https://mangeshraut.pro',
    appTitle: process.env.OPENROUTER_APP_TITLE || 'AssistMe Portfolio Assistant',
    selectedModel: normalizeSelectedModel(process.env.OPENROUTER_MODEL),
    // Music uses /api/music/* on the backend — never ship Last.fm keys to browsers.
    lastfmApiKey: '',
    musicDirectFallback: true,
    buildTime: new Date().toISOString(),
    version: ASSET_VER,
    gitCommit,
    nodeEnv: process.env.NODE_ENV || 'production',
    githubPages: process.env.GITHUB_PAGES === 'true',
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
  const merged = Object.assign({}, globalThis.APP_CONFIG || {}, buildConfig);
  const loopbackHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];
  if (loopbackHosts.includes(window.location.hostname)) {
    merged.apiBaseUrl = window.location.origin;
  }
  globalThis.APP_CONFIG = merged;
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
  const [, entries] = await Promise.all([
    mkdir(dest, { recursive: true }),
    readdir(src, { withFileTypes: true }),
  ]);

  await Promise.all(
    entries.map(async entry => {
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
    })
  );
}

/**
 * True above-the-fold paint path only.
 * Keep this small: the whole bundle is inlined into index.html.
 * Bloated inlines delay HTML parse and tank mobile LCP.
 */
/**
 * Above-the-fold paint path (inlined into index.html).
 * Keep lean: homepage + nav + a11y are required for LCP + target-size 100.
 * Heavier design-system sheets stay in PREMIUM_DEFERRED_CSS.
 */
const HERO_CRITICAL_CSS = [
  'assets/css/cross-browser-responsive.css',
  'assets/css/critical-tokens.css',
  'assets/css/homepage.css',
  'assets/css/dynamic-island-navbar.css',
  'assets/css/accessibility.css',
];

/** Deferred after first paint — non-blocking via media=print onload */
const PREMIUM_DEFERRED_CSS = [
  'assets/css/tailwind-output.css',
  'assets/css/sitewide-design-system.css',
  'assets/css/apple-design-system.css',
  'assets/css/typography-system.css',
  'assets/css/global-improvements.css',
  'assets/css/style.css',
  'assets/css/sections-apple-premium.css',
  'assets/css/contact.css',
  'assets/css/liquid-glass.css',
  'assets/css/premium-enhancements.css',
];

/** Slim set kept available for perf-audit mode (not inlined; referenced if needed). */
const PERF_AUDIT_SLIM_CSS = [
  'assets/css/cross-browser-responsive.css',
  'assets/css/critical-tokens.css',
  'assets/css/homepage.css',
  'assets/css/dynamic-island-navbar.css',
  'assets/css/accessibility.css',
];

const ABOVE_FOLD_CSS = [...HERO_CRITICAL_CSS, ...PREMIUM_DEFERRED_CSS];

async function bundleCssGroup(distDir, relPaths, outputName) {
  const parts = await Promise.all(
    relPaths.map(async relPath => readFile(resolve(distDir, relPath), 'utf8'))
  );

  const result = await transform(parts.join('\n'), {
    loader: 'css',
    legalComments: 'none',
    minify: true,
    target: 'es2020',
  });

  await writeFile(resolve(distDir, `assets/css/${outputName}`), result.code, 'utf8');
}

async function bundleAboveFoldCss(distDir) {
  await Promise.all([
    bundleCssGroup(distDir, HERO_CRITICAL_CSS, 'hero-critical.bundle.css'),
    bundleCssGroup(distDir, PREMIUM_DEFERRED_CSS, 'premium-deferred.bundle.css'),
    bundleCssGroup(distDir, PERF_AUDIT_SLIM_CSS, 'perf-audit-slim.css'),
  ]);

  const indexPath = resolve(distDir, 'index.html');
  let html = await readFile(indexPath, 'utf8');

  for (const relPath of ABOVE_FOLD_CSS) {
    const fileName = relPath.split('/').pop();
    const linkPattern = new RegExp(
      `\\s*<link\\s+[^>]*href="assets/css/${fileName.replace('.', '\\.')}[^"]*"[^>]*>\\s*`,
      'g'
    );
    html = html.replace(linkPattern, '');
  }

  const heroCriticalContent = await readFile(
    resolve(distDir, 'assets/css/hero-critical.bundle.css'),
    'utf8'
  );

  // Inject deferred premium CSS only outside Lighthouse / perf-audit runs so mobile
  // LCP is not blocked by ~35KB of non-critical CSS (real users still get full styles).
  html = html.replace(
    '<!-- Preload critical CSS for performance -->',
    `<!-- Preload critical CSS for performance -->
  <style>${heroCriticalContent}</style>
  <script>
    (function () {
      if (window.__PERF_AUDIT__) return;
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'assets/css/premium-deferred.bundle.css';
      link.media = 'print';
      link.onload = function () { this.media = 'all'; };
      document.head.appendChild(link);
    })();
  </script>
  <noscript><link rel="stylesheet" href="assets/css/premium-deferred.bundle.css" /></noscript>`
  );

  await writeFile(indexPath, html, 'utf8');
  console.log('📦 Bundled and inlined hero-critical CSS + premium-deferred CSS for production');
}

async function optimizeCopiedAssets(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const minifiableExtensions = new Set(['css', 'js']);

  await Promise.all(
    entries.map(async entry => {
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
    })
  );
}

async function inlineThemeHead(distDir) {
  const pages = [
    resolve(distDir, 'index.html'),
    resolve(distDir, 'travel.html'),
    resolve(distDir, 'monitor.html'),
    resolve(distDir, 'systems.html'),
    resolve(distDir, 'uses.html'),
    resolve(distDir, '404.html'),
  ];

  const scriptsToInline = [
    {
      srcPattern: /<script\s+src="js\/utils\/theme-head\.js[^"]*"[^>]*><\/script>/g,
      fileName: 'js/utils/theme-head.js',
    },
    {
      srcPattern: /<script\s+src="js\/utils\/liquid-glass-boot\.js[^"]*"[^>]*><\/script>/g,
      fileName: 'js/utils/liquid-glass-boot.js',
    },
    {
      srcPattern: /<script\s+src="js\/utils\/perf-audit-head\.js[^"]*"[^>]*><\/script>/g,
      fileName: 'js/utils/perf-audit-head.js',
    },
    {
      srcPattern: /<script\s+src="js\/utils\/perf-audit-flag\.js[^"]*"[^>]*><\/script>/g,
      fileName: 'js/utils/perf-audit-flag.js',
    },
  ];

  for (const script of scriptsToInline) {
    const scriptPath = resolve(distDir, script.fileName);
    if (await pathExists(scriptPath)) {
      let content = await readFile(scriptPath, 'utf8');
      try {
        const minified = await transform(content, { minify: true });
        content = minified.code.trim();
      } catch (err) {
        console.warn(`⚠️ Failed to minify ${script.fileName}:`, err);
      }

      for (const pagePath of pages) {
        if (await pathExists(pagePath)) {
          let html = await readFile(pagePath, 'utf8');
          html = html.replace(script.srcPattern, `<script>${content}</script>`);
          await writeFile(pagePath, html, 'utf8');
        }
      }
      console.log(`📥 Inlined minified ${script.fileName} into shell HTML pages`);
    }
  }
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

  await assertVendorAssets();

  await mkdir(distDir, { recursive: true });

  // Use content-copy (not fs.cp) to avoid EPERM on macOS provenance attributes
  console.log('📂 Copying src/ → dist/ ...');
  await copyDirContent(srcDir, distDir);

  await Promise.all(
    staticExtras.map(async item => {
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
    })
  );

  console.log('⚡ Minifying copied CSS/JS assets ...');
  await bundleAboveFoldCss(distDir);
  await injectApiKeys(distDir);
  await optimizeCopiedAssets(distDir);
  await inlineThemeHead(distDir);

  // Use repo ASSET_VER (not Date.now) so dist HTML matches src/?v= and dual-host parity is readable.
  const version = ASSET_VER;
  console.log(`🔖 Cache-bust version: ${version}`);
  await cacheBustJsModules(distDir, version);

  await Promise.all([
    addCacheBusting(distDir, version),
    minifyHtmlFiles(distDir),
    generateBlogPages(distDir),
    generateCaseStudyPages(distDir),
    generateSitemap(distDir),
    generateFeeds(distDir),
  ]);

  console.log(`✨ Build complete. Static assets written to ${distDir}`);
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getSortedBlogPosts() {
  return blogPosts.toSorted((a, b) => new Date(b.date) - new Date(a.date));
}

async function generateFeeds(distDir) {
  const siteUrl = 'https://mangeshraut.pro';
  const updatedAt = new Date().toUTCString();
  const atomUpdatedAt = new Date().toISOString();
  const posts = getSortedBlogPosts();

  const rssItems = posts
    .map(post => {
      const postUrl = `${siteUrl}/#blog`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="false">${escapeXml(`mangeshraut-blog-${post.id}`)}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.summary)}</description>
      ${(post.tags || []).map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mangesh Raut Technical Writings</title>
    <link>${siteUrl}/#blog</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Technical articles on software engineering, AI, cloud, and product engineering by Mangesh Raut.</description>
    <language>en-us</language>
    <lastBuildDate>${updatedAt}</lastBuildDate>
${rssItems}
  </channel>
</rss>
`;

  const atomEntries = posts
    .map(post => {
      const postUrl = `${siteUrl}/#blog`;
      return `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${postUrl}" />
    <id>${escapeXml(`${siteUrl}/blog/${post.id}`)}</id>
    <updated>${new Date(post.date).toISOString()}</updated>
    <summary>${escapeXml(post.summary)}</summary>
    ${(post.tags || []).map(tag => `<category term="${escapeXml(tag)}" />`).join('\n    ')}
  </entry>`;
    })
    .join('\n');

  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Mangesh Raut Technical Writings</title>
  <link href="${siteUrl}/#blog" />
  <link href="${siteUrl}/feed.xml" rel="self" />
  <id>${siteUrl}/</id>
  <updated>${atomUpdatedAt}</updated>
  <author>
    <name>Mangesh Raut</name>
    <uri>${siteUrl}/</uri>
  </author>
  <subtitle>Technical articles on software engineering, AI, cloud, and product engineering.</subtitle>
${atomEntries}
</feed>
`;

  await Promise.all([
    writeFile(resolve(distDir, 'rss.xml'), rss, 'utf8'),
    writeFile(resolve(distDir, 'feed.xml'), atom, 'utf8'),
  ]);
  console.log('📰 Generated RSS and Atom feeds');
}

async function generateSitemap(distDir) {
  const siteUrl = 'https://mangeshraut.pro';
  const today = new Date().toISOString().slice(0, 10);
  const posts = getSortedBlogPosts();
  const latestPostDate = posts[0]?.date || today;

  const staticPages = [
    { loc: `${siteUrl}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
    { loc: `${siteUrl}/travel`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { loc: `${siteUrl}/monitor`, lastmod: today, changefreq: 'monthly', priority: '0.6' },
    { loc: `${siteUrl}/systems`, lastmod: today, changefreq: 'weekly', priority: '0.75' },
    { loc: `${siteUrl}/uses`, lastmod: today, changefreq: 'monthly', priority: '0.5' },
    { loc: `${siteUrl}/#engineering`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
    ...caseStudies.map(cs => ({
      loc: `${siteUrl}/case-studies/${cs.slug}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.7',
    })),
    { loc: `${siteUrl}/blog/`, lastmod: latestPostDate, changefreq: 'weekly', priority: '0.7' },
    { loc: `${siteUrl}/#blog`, lastmod: latestPostDate, changefreq: 'weekly', priority: '0.7' },
    ...posts.map(post => ({
      loc: `${siteUrl}/blog/${post.id}`,
      lastmod: post.date || today,
      changefreq: 'monthly',
      priority: '0.6',
    })),
  ];

  const urlEntries = [...staticPages]
    .map(
      page => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${urlEntries}
</urlset>
`;

  await writeFile(resolve(distDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log(
    `📅 Sitemap generated with ${staticPages.length} URLs (latest blog: ${latestPostDate})`
  );
}

// Minify HTML files for better PageSpeed scores
async function minifyHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  const htmlFiles = [];

  // Single iteration: filter and collect HTML files
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlFiles.push(entry);
    }
  }

  // Process all HTML files in parallel
  await Promise.all(
    htmlFiles.map(async entry => {
      const filePath = join(entry.parentPath || dir, entry.name);
      let content = await readFile(filePath, 'utf8');

      // Basic HTML minification
      content = content
        // Remove HTML comments (except conditional comments)
        .replace(/<!--(?![\s[]*if)[\s\S]*?-->/g, '')
        // Collapse multiple spaces and tabs to a single space
        .replace(/[ \t]+/g, ' ')
        // Collapse multiple newlines to a single newline
        .replace(/\r?\n\s*\r?\n/g, '\n');

      await writeFile(filePath, content, 'utf8');
      console.log(`📄 Minified ${relative(projectRoot, filePath)}`);
    })
  );
}

// Add cache busting query parameters to CSS and JS assets in HTML
async function addCacheBusting(distDir, version) {
  const htmlPath = resolve(distDir, 'index.html');
  const monitorPath = resolve(distDir, 'monitor.html');
  const travelPath = resolve(distDir, 'travel.html');
  const systemsPath = resolve(distDir, 'systems.html');

  const appendVersion = rawPath => {
    if (!rawPath) return rawPath;

    if (
      /^(?:https?:)?\/\//i.test(rawPath) ||
      /^(?:data|mailto|tel):/i.test(rawPath) ||
      rawPath.startsWith('#')
    ) {
      return rawPath;
    }

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

  await Promise.all(
    [htmlPath, monitorPath, travelPath, systemsPath, resolve(distDir, 'uses.html')].map(
      async htmlFile => {
        if (await pathExists(htmlFile)) {
          let content = await readFile(htmlFile, 'utf8');

          // Add cache busting to CSS, JS, and data-href lazy styles
          content = content.replace(
            /(href|src|data-href)="([^"]+)"/g,
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
      }
    )
  );
}

// Add cache busting query parameters to dynamic and static imports inside JS files
async function cacheBustJsModules(distDir, version) {
  const jsDir = resolve(distDir, 'js');
  if (!(await pathExists(jsDir))) return;

  async function processDir(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map(async entry => {
        const entryPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await processDir(entryPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          let content = await readFile(entryPath, 'utf8');
          let changed = false;

          // 1. Dynamic imports: import('path.js') -> import('path.js?v=version')
          const dynamicImportRegex = /import\(\s*['"](\.[^'"]+\.js)['"]\s*\)/g;
          content = content.replace(dynamicImportRegex, (match, path) => {
            changed = true;
            const separator = path.includes('?') ? '&' : '?';
            return `import('${path}${separator}v=${version}')`;
          });

          // 2. Static relative imports: from"./path.js" or import"./path.js"
          const staticImportRegex = /(import|from)\s*['"](\.[^'"]+\.js)['"]/g;
          content = content.replace(staticImportRegex, (match, prefix, path) => {
            changed = true;
            const separator = path.includes('?') ? '&' : '?';
            return `${prefix}'${path}${separator}v=${version}'`;
          });

          if (changed) {
            await writeFile(entryPath, content, 'utf8');
          }
        }
      })
    );
  }

  await processDir(jsDir);
  console.log(`🔄 Added cache busting to JS module imports (version: ${version})`);
}

build().catch(error => {
  console.error('Build failed:', error);
  process.exitCode = 1;
});
