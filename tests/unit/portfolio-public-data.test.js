import { describe, expect, it } from 'vitest';
import {
  formatDeployLighthouseGate,
  formatQualitySummary,
  LIGHTHOUSE_DEPLOY_GATES,
  PWA_POLICY,
  SITE_THEME,
  SOCIAL_IMAGE,
  TEST_COUNTS,
  usesCatalog,
  usesStack,
  getUsesStats,
  WEBMCP_TOOL_COUNT,
} from '../../src/js/data/portfolio-public-data.js';

describe('portfolio-public-data', () => {
  it('exports deploy Lighthouse gates matching deploy workflow floors', () => {
    expect(LIGHTHOUSE_DEPLOY_GATES.mobile).toEqual({
      performance: 100,
      accessibility: 100,
      bestPractices: 100,
      seo: 100,
    });
    expect(formatDeployLighthouseGate()).toBe('100/100/100/100');
  });

  it('documents consistent test counts and WebMCP tools', () => {
    expect(TEST_COUNTS.pytest).toBe(132);
    expect(TEST_COUNTS.playwrightProjects).toBe(15);
    expect(TEST_COUNTS.vitest).toBeGreaterThanOrEqual(81);
    expect(WEBMCP_TOOL_COUNT).toBe(10);
    expect(formatQualitySummary()).toContain(`${TEST_COUNTS.vitest} Vitest`);
    expect(formatQualitySummary()).toContain(`${TEST_COUNTS.pytest} pytest`);
    expect(formatQualitySummary()).toContain('Lighthouse deploy gate 100/100/100/100');
  });

  it('uses vanilla stack on Uses page (no React/Next for this repo)', () => {
    expect(usesStack.engineering.some(item => /Vanilla HTML/i.test(item))).toBe(true);
    expect(usesStack.engineering.some(item => /React|Next\.js/i.test(item))).toBe(false);
    expect(usesCatalog.some(cat => cat.id === 'engineering')).toBe(true);
    expect(getUsesStats().tools).toBeGreaterThan(10);
    expect(getUsesStats().featured).toBeGreaterThan(0);
  });

  it('states PWA policy without active service worker registration', () => {
    expect(PWA_POLICY.installable).toBe(true);
    expect(PWA_POLICY.serviceWorkerRegistered).toBe(false);
    expect(PWA_POLICY.offlineMode).toBe('manual-reconnect-only');
    expect(PWA_POLICY.summary).toMatch(/disabled/i);
    expect(PWA_POLICY.summary).toMatch(/offline\.html/i);
  });

  it('keeps social image and theme tokens aligned', () => {
    expect(SOCIAL_IMAGE.width).toBe(3024);
    expect(SOCIAL_IMAGE.height).toBe(1722);
    expect(SOCIAL_IMAGE.url).toContain('github.io/mangeshrautarchive');
    expect(SITE_THEME.appleBlue).toBe('#0071e3');
  });
});
