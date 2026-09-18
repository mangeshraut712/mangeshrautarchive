import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initChangelogPage } from '../../src/js/modules/changelog-page.js';
import { CHANGELOG_TAGS, changelogEntries } from '../../src/js/data/changelog-entries.js';

describe('changelog browsing', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <time id="changelog-updated"></time><span id="changelog-count"></span>
      <div id="changelog-type-filters"></div>
      <button id="changelog-filters-toggle"></button>
      <div id="changelog-filter-panel"><div id="changelog-tag-filters"></div></div>
      <p id="changelog-results-label"></p><div id="changelog-timeline"></div>`;
    initChangelogPage();
  });

  it('keeps complete summaries available inside closed disclosures', () => {
    const entry = document.querySelector('.changelog-entry');
    const source = changelogEntries.find(item => item.id === entry.dataset.id);
    const details = entry.querySelector('details');
    expect(details).not.toBeNull();
    expect(details.open).toBe(false);
    expect(details.querySelector('summary').textContent).toContain('Details');
    expect(details.textContent).toContain(source.summary);
  });

  it('keeps keyboard focus on the selected filter while updating results', () => {
    const filter = document.querySelector('[data-type="improvement"]');
    filter.focus();
    filter.click();
    expect(document.activeElement.dataset.type).toBe('improvement');
    expect(document.activeElement.getAttribute('aria-pressed')).toBe('true');
    expect(
      [...document.querySelectorAll('.changelog-entry')].every(
        entry => entry.dataset.type === 'improvement'
      )
    ).toBe(true);
  });

  it('uses one concise live region for filtered result announcements', () => {
    const html = readFileSync(join(process.cwd(), 'src/changelog.html'), 'utf8');
    const page = new DOMParser().parseFromString(html, 'text/html');
    const toolbar = page.querySelector('.changelog-toolbar');
    const results = page.getElementById('changelog-results-label');
    const timeline = page.getElementById('changelog-timeline');

    expect(toolbar.getAttribute('role')).toBeNull();
    expect(toolbar.getAttribute('aria-label')).toBe('Changelog filters');
    expect(results.getAttribute('role')).toBe('status');
    expect(results.getAttribute('aria-live')).toBe('polite');
    expect(results.getAttribute('aria-atomic')).toBe('true');
    expect(timeline.getAttribute('aria-live')).toBeNull();
  });

  it('combines area and type filters and resets an empty result', () => {
    document.querySelector('[data-type="retired"]').click();
    document.getElementById('changelog-filters-toggle').click();
    document.querySelector('[data-tag="voice"]').click();
    const expected = changelogEntries.filter(
      e => e.type === 'retired' && e.tags?.includes('voice')
    );
    expect(document.querySelectorAll('.changelog-entry')).toHaveLength(expected.length);
    expect(document.getElementById('changelog-filters-toggle').textContent).toContain('(1)');
    if (!expected.length) {
      document.querySelector('[data-reset-filters]').click();
      expect(document.querySelectorAll('.changelog-entry')).toHaveLength(changelogEntries.length);
      expect(
        document.getElementById('changelog-filters-toggle').getAttribute('aria-expanded')
      ).toBe('false');
      expect(document.activeElement.dataset.type).toBe('all');
    }
  });

  it('uses the curated area taxonomy and keeps legacy-only entries filterable', () => {
    const knownAreas = new Set(CHANGELOG_TAGS.map(tag => tag.id));
    const renderedAreas = [...document.querySelectorAll('.changelog-entry')].map(
      entry => entry.dataset.area
    );
    expect(renderedAreas.every(area => knownAreas.has(area))).toBe(true);

    document.getElementById('changelog-filters-toggle').click();
    document.querySelector('[data-tag="other"]').click();
    const otherEntries = [...document.querySelectorAll('.changelog-entry')];
    expect(otherEntries.length).toBeGreaterThan(0);
    expect(otherEntries.every(entry => entry.dataset.area === 'other')).toBe(true);
  });

  it('renders commit links only for entries verified against repository history', () => {
    for (const entry of document.querySelectorAll('.changelog-entry')) {
      const source = changelogEntries.find(item => item.id === entry.dataset.id);
      const links = entry.querySelectorAll(
        '.changelog-entry__title-link, .changelog-entry__commit'
      );
      expect(links.length > 0).toBe(source.commitVerified);
    }
  });

  it('connects each month control to its list and toggles expanded state', () => {
    const button = document.querySelector('[data-month-toggle]');
    expect(document.getElementById(button.getAttribute('aria-controls'))).not.toBeNull();
    button.click();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.closest('section').classList.contains('is-collapsed')).toBe(true);
    button.click();
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('separates concise headline from detailed subtitle for clean scannability', () => {
    const entry = document.querySelector('.changelog-entry');
    const source = changelogEntries.find(item => item.id === entry.dataset.id);
    const titleLink = entry.querySelector('.changelog-entry__title-link, .changelog-entry__title');
    if (source.title.includes(':')) {
      const [expectedShort, ...rest] = source.title.split(':');
      expect(titleLink.textContent.trim()).toBe(expectedShort.trim());
      const detailSubtitle = entry.querySelector('.changelog-entry__detail-title');
      expect(detailSubtitle).not.toBeNull();
      expect(detailSubtitle.textContent.trim()).toBe(rest.join(':').trim());
    } else {
      expect(titleLink.textContent.trim()).toBe(source.title);
    }
  });
});
