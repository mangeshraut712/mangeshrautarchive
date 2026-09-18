/**
 * Changelog page unit smoke — data shape + filter helpers.
 */

import { describe, expect, it } from 'vitest';
import {
  CHANGELOG_TAGS,
  CHANGELOG_TYPES,
  changelogEntries,
  getChangelogUpdatedAt,
  getCommitUrl,
} from '../../src/js/data/changelog-entries.js';

describe('changelog entries', () => {
  it('has typed entries with explicit commit verification status', () => {
    expect(changelogEntries.length).toBeGreaterThan(0);
    for (const entry of changelogEntries) {
      expect(entry.id).toBeTruthy();
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['release', 'improvement', 'fix', 'retired']).toContain(entry.type);
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.summary.trim().length).toBeGreaterThan(0);
      expect(typeof entry.commitVerified).toBe('boolean');
      if (entry.sha) expect(entry.sha).toMatch(/^[0-9a-f]{8,40}$/i);
      if (entry.commitVerified) {
        expect(entry.sha).toBeTruthy();
        expect(getCommitUrl(entry)).toBe(
          `https://github.com/mangeshraut712/mangeshrautarchive/commit/${entry.sha}`
        );
        if (entry.link) expect(entry.link).toBe(getCommitUrl(entry));
      } else {
        expect(getCommitUrl(entry)).toBeNull();
        expect(entry.link || '').not.toContain('/commit/');
      }
    }
  });

  it('requires verified provenance for releases and keeps the draft unlinked', () => {
    const released = changelogEntries.filter(entry => entry.status !== 'unreleased');
    const unresolved = released.filter(entry => !entry.sha || entry.commitVerified !== true);
    const unreleased = changelogEntries.filter(entry => entry.status === 'unreleased');

    expect(unresolved).toEqual([]);
    expect(released.every(entry => getCommitUrl(entry)?.endsWith(entry.sha))).toBe(true);
    expect(unreleased).toHaveLength(1);
    expect(unreleased[0]).toMatchObject({ sha: null, commitVerified: false });
    expect(getCommitUrl(unreleased[0])).toBeNull();
  });

  it('spans multiple months from real history', () => {
    const months = new Set(changelogEntries.map(e => e.date.slice(0, 7)));
    expect(months.size).toBeGreaterThanOrEqual(6);
    expect(months.has('2026-08')).toBe(true);
    expect(months.has('2026-07')).toBe(true);
    expect(months.has('2025-12')).toBe(true);
    expect(months.has('2025-10')).toBe(true);
    expect(months.has('2025-04')).toBe(true);
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
