/**
 * Changelog page unit smoke — data shape + filter helpers.
 */

import { describe, expect, it } from 'vitest';
import {
  CHANGELOG_TAGS,
  CHANGELOG_TYPES,
  changelogEntries,
  getChangelogUpdatedAt,
} from '../../src/js/data/changelog-entries.js';

describe('changelog entries', () => {
  it('has typed entries with required fields and real SHAs', () => {
    expect(changelogEntries.length).toBeGreaterThan(0);
    for (const entry of changelogEntries) {
      expect(entry.id).toBeTruthy();
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['release', 'improvement', 'retired']).toContain(entry.type);
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.summary.trim().length).toBeGreaterThan(0);
      expect(entry.sha).toMatch(/^[0-9a-f]{7,40}$/i);
    }
  });

  it('spans multiple months from real history', () => {
    const months = new Set(changelogEntries.map(e => e.date.slice(0, 7)));
    expect(months.size).toBeGreaterThanOrEqual(6);
    expect(months.has('2026-07')).toBe(true);
    expect(months.has('2025-12')).toBe(true);
  });

  it('exposes type and tag catalogs', () => {
    expect(CHANGELOG_TYPES.some(t => t.id === 'all')).toBe(true);
    expect(CHANGELOG_TAGS.some(t => t.id === 'assistme')).toBe(true);
  });

  it('reports latest update date', () => {
    const latest = getChangelogUpdatedAt();
    expect(latest).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const sorted = changelogEntries.map(e => e.date).sort();
    expect(latest).toBe(sorted[sorted.length - 1]);
  });
});
