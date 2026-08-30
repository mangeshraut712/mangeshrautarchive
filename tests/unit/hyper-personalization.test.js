import { describe, it, expect, beforeEach } from 'vitest';
import { HyperPersonalizationEngine, LENSES } from '../../src/js/modules/hyper-personalization.js';

describe('HyperPersonalizationEngine', () => {
  let engine;

  beforeEach(() => {
    document.documentElement.removeAttribute('data-active-lens');
    localStorage.clear();
    engine = new HyperPersonalizationEngine();
  });

  it('initializes with general lens by default', () => {
    engine.init();
    expect(engine.activeLens).toBe('general');
    expect(document.documentElement.getAttribute('data-active-lens')).toBe('general');
  });

  it('sets and persists recruiter lens', () => {
    engine.setLens('recruiter', true);
    expect(engine.activeLens).toBe('recruiter');
    expect(document.documentElement.getAttribute('data-active-lens')).toBe('recruiter');
    expect(localStorage.getItem('mangesh_portfolio_lens')).toBe('recruiter');
  });

  it('falls back to general when invalid lens is provided', () => {
    engine.setLens('invalid-role');
    expect(engine.activeLens).toBe('general');
    expect(document.documentElement.getAttribute('data-active-lens')).toBe('general');
  });

  it('notifies subscribers on lens change', () => {
    let notified = null;
    engine.subscribe((lens, meta) => {
      notified = { lens, meta };
    });

    engine.setLens('engineer');
    expect(notified).not.toBeNull();
    expect(notified.lens).toBe('engineer');
    expect(notified.meta.label).toBe(LENSES.engineer.label);
  });

  it('resets to general lens', () => {
    engine.setLens('founder');
    expect(engine.activeLens).toBe('founder');

    engine.reset();
    expect(engine.activeLens).toBe('general');
    expect(localStorage.getItem('mangesh_portfolio_lens')).toBe('general');
  });
});
