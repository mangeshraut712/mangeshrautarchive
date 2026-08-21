/**
 * @file Unit tests for MonitorPage module
 * @module tests/unit/monitor-page.test.js
 */

import { describe, expect, it } from 'vitest';
import { escapeHtml, formatDuration, formatTimeAgo } from '../../src/js/modules/monitor-page.js';

describe('MonitorPage Module', () => {
  describe('formatDuration', () => {
    it('formats seconds into minutes when under an hour', () => {
      expect(formatDuration(120)).toBe('2m');
      expect(formatDuration(59)).toBe('0m');
      expect(formatDuration(1800)).toBe('30m');
    });

    it('formats seconds into hours and minutes when under a day', () => {
      expect(formatDuration(3600)).toBe('1h 0m');
      expect(formatDuration(7320)).toBe('2h 2m');
      expect(formatDuration(86399)).toBe('23h 59m');
    });

    it('formats seconds into days, hours, and minutes when 1 day or more', () => {
      expect(formatDuration(86400)).toBe('1d 0h 0m');
      expect(formatDuration(90060)).toBe('1d 1h 1m');
      expect(formatDuration(172800)).toBe('2d 0h 0m');
    });
  });

  describe('formatTimeAgo', () => {
    it('returns "Just now" for events within the last 60 seconds', () => {
      const now = new Date().toISOString();
      expect(formatTimeAgo(now)).toBe('Just now');
    });

    it('formats past minutes, hours, and days', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatTimeAgo(fiveMinsAgo)).toBe('5m ago');

      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      expect(formatTimeAgo(threeHoursAgo)).toBe('3h ago');

      const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
      expect(formatTimeAgo(twoDaysAgo)).toBe('2d ago');
    });
  });

  describe('escapeHtml', () => {
    it('escapes standard HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml("Mangesh's & Company")).toBe('Mangesh&#39;s &amp; Company');
    });

    it('handles empty or non-string inputs safely', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('null');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(123)).toBe('123');
    });
  });
});
