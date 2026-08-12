import { describe, expect, it } from 'vitest';

import { getWhoopMetricTone } from '../../src/js/utils/whoop-metric-tone.js';

describe('WHOOP traffic-light tones', () => {
  it.each([
    [100, 'metric-green'],
    [67, 'metric-green'],
    [66, 'metric-yellow'],
    [34, 'metric-yellow'],
    [33, 'metric-red'],
    [0, 'metric-red'],
  ])('classifies Recovery score %s', (score, expected) => {
    expect(getWhoopMetricTone('recovery', score)).toBe(expected);
  });

  it.each([
    [100, 'metric-green'],
    [85, 'metric-green'],
    [84, 'metric-yellow'],
    [70, 'metric-yellow'],
    [69, 'metric-red'],
    [0, 'metric-red'],
  ])('classifies Sleep Performance score %s', (score, expected) => {
    expect(getWhoopMetricTone('sleep', score)).toBe(expected);
  });

  it('keeps Strain neutral because its target is personal', () => {
    expect(getWhoopMetricTone('strain', 17.2)).toBeNull();
  });

  it('keeps unavailable values neutral', () => {
    expect(getWhoopMetricTone('sleep', null)).toBeNull();
    expect(getWhoopMetricTone('recovery', Number.NaN)).toBeNull();
  });
});
