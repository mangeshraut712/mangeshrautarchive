import { beforeEach, describe, expect, it } from 'vitest';
import { initChangelogPage } from '../../src/js/modules/changelog-page.js';
import { changelogEntries } from '../../src/js/data/changelog-entries.js';

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

  it('connects each month control to its list and toggles expanded state', () => {
    const button = document.querySelector('[data-month-toggle]');
    expect(document.getElementById(button.getAttribute('aria-controls'))).not.toBeNull();
    button.click();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.closest('section').classList.contains('is-collapsed')).toBe(true);
    button.click();
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });
});
