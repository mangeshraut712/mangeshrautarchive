import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { caseStudies } from '../../src/js/modules/case-studies-data.js';
import { SITE_URL as CANONICAL_SITE_URL } from '../../src/js/data/portfolio-public-data.js';
import { ASSET_VER, fontAwesomeStylesheet } from './asset-version.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = (
  process.env.OPENROUTER_SITE_URL ||
  process.env.PAGES_SITE_URL ||
  CANONICAL_SITE_URL
).replace(/\/$/, '');
const ASSET_PREFIX = '..';

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMetrics(cs) {
  if (!cs.metrics?.length) return '';
  return `<div class="case-study-metrics">${cs.metrics
    .map(
      m => `<div class="case-study-metric lg-glass-card">
        <strong>${escapeHTML(m.value)}</strong>
        <span>${escapeHTML(m.label)}</span>
      </div>`
    )
    .join('')}</div>`;
}

function renderVideo(cs) {
  if (!cs.videoUrl) return '';
  const label = cs.videoLabel || 'Watch demo';
  return `<div class="case-study-video lg-glass-card">
    <p class="systems-eyebrow">Demo</p>
    <a class="case-study-video-link" href="${escapeHTML(cs.videoUrl)}" target="_blank" rel="noopener noreferrer">
      <i class="fab fa-youtube" aria-hidden="true"></i>
      ${escapeHTML(label)}
    </a>
  </div>`;
}

function renderCaseStudyBody(cs) {
  return `
    <nav class="monitor-page-nav case-study-nav" aria-label="Case study navigation">
      <div class="monitor-page-nav__left">
        <a class="monitor-page-nav__home" href="${ASSET_PREFIX}/" aria-label="Home">
          <img src="${ASSET_PREFIX}/assets/images/profile-icon.png" alt="" width="28" height="28" />
        </a>
        <a class="monitor-page-nav__back" href="${ASSET_PREFIX}/systems#projects">
          <i class="fas fa-chevron-left" aria-hidden="true"></i>
          <span>Notebook</span>
        </a>
      </div>
      <div class="monitor-page-nav__brand">
        <span class="monitor-page-nav__kicker">Case study</span>
        <span class="monitor-page-nav__label">${escapeHTML(cs.title)}</span>
      </div>
      <div class="monitor-page-nav__actions">
        <button id="theme-toggle" class="monitor-page-nav__theme" type="button" aria-label="Toggle theme">
          <span id="theme-toggle-icon" aria-hidden="true"></span>
        </button>
      </div>
    </nav>

    <main class="systems-container case-study-page" id="main-content">
      <header class="case-study-header">
        <p class="systems-eyebrow">Project story</p>
        <h1>${escapeHTML(cs.title)}</h1>
        <p class="case-study-tagline">${escapeHTML(cs.tagline)}</p>
        <div class="case-study-evidence-bar">
          ${cs.repoUrl ? `<a href="${escapeHTML(cs.repoUrl)}" target="_blank" rel="noopener noreferrer">Repository</a>` : ''}
          ${cs.demoUrl ? `<a href="${escapeHTML(cs.demoUrl)}" target="_blank" rel="noopener noreferrer">Live demo</a>` : ''}
          ${cs.architectureAnchor ? `<a href="${ASSET_PREFIX}/${escapeHTML(cs.architectureAnchor)}">Architecture</a>` : ''}
          ${cs.blogHref ? `<a href="${ASSET_PREFIX}/${escapeHTML(cs.blogHref)}">Related writing</a>` : ''}
        </div>
      </header>

      ${renderMetrics(cs)}
      ${renderVideo(cs)}

      <article class="case-study-story lg-glass-card">
        <div class="case-study-step" id="architecture"><h2>Problem</h2><p>${escapeHTML(cs.problem)}</p></div>
        <div class="case-study-step"><h2>Why existing solutions fail</h2><p>${escapeHTML(cs.whyExistingFail)}</p></div>
        <div class="case-study-step"><h2>My approach</h2><p>${escapeHTML(cs.approach)}</p></div>
        <div class="case-study-step"><h2>Tradeoffs</h2><p>${escapeHTML(cs.tradeoffs)}</p></div>
        <div class="case-study-step"><h2>Results</h2><ul>${cs.results.map(r => `<li>${escapeHTML(r)}</li>`).join('')}</ul></div>
        <div class="case-study-step"><h2>What I would improve</h2><ul>${cs.improvements.map(r => `<li>${escapeHTML(r)}</li>`).join('')}</ul></div>
        <div class="case-study-stack">${cs.stack.map(s => `<span>${escapeHTML(s)}</span>`).join('')}</div>
      </article>

      <footer class="systems-footer-links">
        <a href="${ASSET_PREFIX}/#projects">All projects</a>
        <a href="${ASSET_PREFIX}/">Portfolio home</a>
      </footer>
    </main>
  `;
}

function pageShell({ title, description, canonical, body }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="description" content="${escapeHTML(description)}" />
    <meta name="author" content="Mangesh Raut" />
    <link rel="canonical" href="${canonical}" />
    <title>${escapeHTML(title)}</title>
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${escapeHTML(title)}" />
    <meta property="og:description" content="${escapeHTML(description)}" />
    <meta property="og:image" content="https://mangeshraut.pro/assets/images/home.png" />
    <meta property="og:image:width" content="3024" />
    <meta property="og:image:height" content="1722" />
    <meta property="og:image:alt" content="${escapeHTML(title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHTML(title)}" />
    <meta name="twitter:description" content="${escapeHTML(description)}" />
    <meta name="twitter:image" content="https://mangeshraut.pro/assets/images/home.png" />
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": "${escapeHTML(title)}",
        "description": "${escapeHTML(description)}",
        "url": "${canonical}",
        "image": "https://mangeshraut.pro/assets/images/home.png",
        "author": {
          "@type": "Person",
          "name": "Mangesh Raut",
          "url": "https://mangeshraut.pro"
        },
        "publisher": {
          "@type": "Person",
          "name": "Mangesh Raut",
          "url": "https://mangeshraut.pro"
        }
      }
    </script>
    <link rel="icon" href="${ASSET_PREFIX}/favicon.svg?v=${ASSET_VER}" type="image/svg+xml" />
    <link rel="icon" href="${ASSET_PREFIX}/favicon.ico?v=${ASSET_VER}" sizes="48x48" />
    <link rel="icon" href="${ASSET_PREFIX}/favicon-32x32.png?v=${ASSET_VER}" type="image/png" sizes="32x32" />
    <link rel="apple-touch-icon" href="${ASSET_PREFIX}/apple-touch-icon.png?v=${ASSET_VER}" sizes="180x180" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/apple-design-system.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/sitewide-design-system.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/monitor.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/liquid-glass.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/systems.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/theme-solid-surfaces.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/accessibility.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/apple-platform-features.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/chrome-surfaces.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${ASSET_PREFIX}/assets/css/ux-polish-fixes.css?v=${ASSET_VER}" />
    <link rel="stylesheet" href="${fontAwesomeStylesheet(ASSET_PREFIX)}" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="${fontAwesomeStylesheet(ASSET_PREFIX)}" /></noscript>
    <script src="${ASSET_PREFIX}/js/utils/liquid-glass-boot.js?v=${ASSET_VER}"></script>
    <script src="${ASSET_PREFIX}/js/utils/theme-head.js"></script>
    <script src="${ASSET_PREFIX}/js/utils/deferred-analytics.js?v=${ASSET_VER}" defer></script>
  </head>
  <body class="systems-page case-study-standalone">
    <div class="skip-links" role="navigation" aria-label="Skip links">
      <a href="#main-content" class="skip-link">Skip to main content</a>
    </div>
    ${body}
    <script type="module" src="${ASSET_PREFIX}/js/core/subpage-chrome.js?v=${ASSET_VER}"></script>
    <script type="module" src="${ASSET_PREFIX}/js/utils/theme.js"></script>
  </body>
</html>`;
}

export async function generateCaseStudyPages(distDir) {
  const outDir = resolve(distDir, 'case-studies');
  await mkdir(outDir, { recursive: true });

  await Promise.all(
    caseStudies.map(async cs => {
      const canonical = `${SITE_URL}/case-studies/${cs.slug}`;
      const html = pageShell({
        title: `${cs.title} | Mangesh Raut`,
        description: cs.tagline,
        canonical,
        body: renderCaseStudyBody(cs),
      });
      await writeFile(resolve(outDir, `${cs.slug}.html`), html, 'utf8');
    })
  );

  console.log(`📐 Generated ${caseStudies.length} case study pages in case-studies/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const distDir = resolve(__dirname, '../../dist');
  generateCaseStudyPages(distDir).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
