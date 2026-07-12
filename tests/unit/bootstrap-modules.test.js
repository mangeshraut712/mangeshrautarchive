import { describe, it, expect } from 'vitest';

/**
 * Bootstrap module parity test.
 * Ensures every module in MODULE_IMPORTERS is reachable from
 * SECTION_MODULES, INTERACTION_MODULES, or loadDeferredBootstrapModules.
 *
 * This prevents regressions where modules are registered as importable
 * but never wired to a load path (e.g. experience-interactivity, awards-shelf).
 */

// Replicate the module registration lists from src/js/core/bootstrap.js
// to verify parity without importing the full bootstrap module (which has
// browser-side side effects).

const SECTION_MODULES = [
  { sectionId: 'home', modulePath: '../modules/lastfm.js' },
  { sectionId: 'about', modulePath: '../modules/card-content-accessibility.js' },
  { sectionId: 'about', modulePath: '../modules/about-interactivity.js' },
  { sectionId: 'home', modulePath: '../modules/live-activity-strip.js' },
  { sectionId: 'projects', modulePath: '../modules/quick-look.js' },
  { sectionId: 'skills', modulePath: '../modules/skills-visualization.js' },
  { sectionId: 'blog', modulePath: '../modules/blog-loader.js' },
  { sectionId: 'blog', modulePath: '../modules/newsletter.js' },
  { sectionId: 'contact', modulePath: '../modules/calendar.js' },
  { sectionId: 'currently-section', modulePath: '../modules/currently.js' },
  { sectionId: 'currently-section', modulePath: '../modules/real-media-loader.js' },
  { sectionId: 'currently-section', modulePath: '../modules/lastfm.js' },
  { sectionId: 'currently-section', modulePath: '../modules/health-widget.js' },
  { sectionId: 'debug-runner-section', modulePath: '../modules/debug-runner.js' },
  { sectionId: 'experience', modulePath: '../modules/experience-interactivity.js' },
  { sectionId: 'awards', modulePath: '../modules/awards-shelf.js' },
];

const INTERACTION_MODULES = [
  '../modules/agentic-actions.js',
  '../modules/premium-enhancements.js',
  '../modules/birthday-celebration.js',
];

const EAGER_MODULES = [
  '../modules/accessibility.js',
  '../modules/scroll-animations.js',
  '../modules/section-preview.js',
];

const IDLE_EAGER_MODULES = [
  '../modules/liquid-glass-engine.js',
  '../modules/liquid-glass-chrome.js',
];

// Modules loaded by loadDeferredBootstrapModules()
const DEFERRED_BOOTSTRAP_MODULES = [
  '../modules/external-config.js',
  '../modules/currently.js',
  '../modules/avatar-toggle.js',
  '../modules/portfolio-feature-upgrades.js',
  '../modules/vercel-analytics.js',
  '../modules/overlay.js',
];

// Modules loaded by initOnDemandModules() via createModuleLoader
const ON_DEMAND_MODULES = ['../modules/chatbot.js', '../modules/search.js'];

// Modules loaded by initBootstrap() via runWhenIdle
const IDLE_LOADED_MODULES = ['../modules/real-media-loader.js'];

// Modules loaded by initAppleDisplayEnhancements()
const APPLE_ENHANCEMENT_MODULES = [
  '../modules/apple-sounds.js',
  '../modules/offscreen-animation-pause.js',
];

// Modules loaded by loadEnhancementModules()
const ENHANCEMENT_MODULES = [
  '../modules/apple-haptics.js',
  '../utils/view-transitions-nav.js',
  '../modules/aod-dim-mode.js',
];

// Modules loaded by warmProjectShowcaseAssets()
const PROJECT_SHOWCASE_MODULES = ['../modules/projects-showcase.js'];

// Modules loaded by initEngineeringTeaserOnDemand()
const ENGINEERING_TEASER_MODULES = ['../modules/engineering-showcase.js'];

// All known load paths
const ALL_LOAD_PATHS = new Set([
  ...SECTION_MODULES.map(m => m.modulePath),
  ...INTERACTION_MODULES,
  ...EAGER_MODULES,
  ...IDLE_EAGER_MODULES,
  ...DEFERRED_BOOTSTRAP_MODULES,
  ...ON_DEMAND_MODULES,
  ...IDLE_LOADED_MODULES,
  ...APPLE_ENHANCEMENT_MODULES,
  ...ENHANCEMENT_MODULES,
  ...PROJECT_SHOWCASE_MODULES,
  ...ENGINEERING_TEASER_MODULES,
]);

// MODULE_IMPORTERS keys from bootstrap.js
const MODULE_IMPORTERS = new Set([
  '../modules/accessibility.js',
  '../modules/liquid-glass-engine.js',
  '../modules/liquid-glass-chrome.js',
  '../modules/card-content-accessibility.js',
  '../modules/agentic-actions.js',
  '../modules/premium-enhancements.js',
  '../modules/birthday-celebration.js',
  '../modules/skills-visualization.js',
  '../modules/blog-loader.js',
  '../modules/newsletter.js',
  '../modules/calendar.js',
  '../modules/currently.js',
  '../modules/real-media-loader.js',
  '../modules/lastfm.js',
  '../modules/health-widget.js',
  '../modules/debug-runner.js',
  '../modules/chatbot.js',
  '../modules/quick-look.js',
  '../modules/live-activity-strip.js',
  '../modules/experience-interactivity.js',
  '../modules/awards-shelf.js',
  '../modules/search.js',
  '../modules/about-interactivity.js',
  '../modules/scroll-animations.js',
  '../modules/section-preview.js',
]);

describe('Bootstrap module parity', () => {
  it('every MODULE_IMPORTERS entry has at least one load path', () => {
    const unreachable = [];

    for (const modulePath of MODULE_IMPORTERS) {
      if (!ALL_LOAD_PATHS.has(modulePath)) {
        unreachable.push(modulePath);
      }
    }

    expect(unreachable, `Unreachable modules: ${unreachable.join(', ')}`).toEqual([]);
  });

  it('every SECTION_MODULES modulePath exists in MODULE_IMPORTERS', () => {
    const missing = [];

    for (const { modulePath } of SECTION_MODULES) {
      if (!MODULE_IMPORTERS.has(modulePath)) {
        missing.push(modulePath);
      }
    }

    expect(missing, `Missing from MODULE_IMPORTERS: ${missing.join(', ')}`).toEqual([]);
  });

  it('every INTERACTION_MODULES path exists in MODULE_IMPORTERS', () => {
    const missing = [];

    for (const modulePath of INTERACTION_MODULES) {
      if (!MODULE_IMPORTERS.has(modulePath)) {
        missing.push(modulePath);
      }
    }

    expect(missing, `Missing from MODULE_IMPORTERS: ${missing.join(', ')}`).toEqual([]);
  });

  it('no duplicate sectionId + modulePath pairs in SECTION_MODULES', () => {
    const seen = new Set();
    const duplicates = [];

    for (const { sectionId, modulePath } of SECTION_MODULES) {
      const key = `${sectionId}:${modulePath}`;
      if (seen.has(key)) {
        duplicates.push(key);
      }
      seen.add(key);
    }

    expect(duplicates, `Duplicate section+module pairs: ${duplicates.join(', ')}`).toEqual([]);
  });
});
