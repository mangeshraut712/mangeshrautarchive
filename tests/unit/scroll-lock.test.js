import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  lockBodyScroll,
  releaseBodyScrollStyles,
  restoreBodyScrollPosition,
  unlockBodyScroll,
  recoverPageScroll,
} from '../../src/js/utils/scroll-lock.js';

describe('scroll-lock utility', () => {
  let mockWindow;

  beforeEach(() => {
    document.body.removeAttribute('style');
    delete document.body.dataset.scrollLocked;
    delete document.body.dataset.overlayScrollY;
    delete document.body.dataset.overlayAnchorId;
    delete document.body.dataset.overlayAnchorTop;
    document.body.className = '';
    document.documentElement.className = '';

    mockWindow = {
      scrollY: 150,
      pageYOffset: 150,
      scrollTo: vi.fn(),
      requestAnimationFrame: vi.fn(cb => cb()),
      setTimeout: vi.fn(),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('locks body scroll at current scroll offset', () => {
    lockBodyScroll(document.body, mockWindow);

    expect(document.body.dataset.scrollLocked).toBe('true');
    expect(document.body.dataset.overlayScrollY).toBe('150');
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-150px');
    expect(document.body.style.width).toBe('100%');
  });

  it('does not re-lock if body is already locked', () => {
    lockBodyScroll(document.body, mockWindow);
    mockWindow.scrollY = 300;
    lockBodyScroll(document.body, mockWindow);

    // Preserves initial scroll position
    expect(document.body.dataset.overlayScrollY).toBe('150');
    expect(document.body.style.top).toBe('-150px');
  });

  it('releases scroll styles and cleans dataset', () => {
    lockBodyScroll(document.body, mockWindow);
    const released = releaseBodyScrollStyles(document.body);

    expect(released.scrollY).toBe(150);
    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.dataset.scrollLocked).toBeUndefined();
    expect(document.body.dataset.overlayScrollY).toBeUndefined();
  });

  it('restores window scroll position upon unlock', () => {
    lockBodyScroll(document.body, mockWindow);
    unlockBodyScroll(document.body, mockWindow);

    expect(mockWindow.scrollTo).toHaveBeenCalledWith(0, 150);
    expect(document.body.style.position).toBe('');

    // Test restoreBodyScrollPosition directly
    restoreBodyScrollPosition(220, { windowRef: mockWindow });
    expect(mockWindow.scrollTo).toHaveBeenCalledWith(0, 220);
  });

  it('keeps delayed scroll restoration bound to the originating document', () => {
    const callbacks = [];
    const documentRef = {
      body: { scrollTop: 0 },
      documentElement: { scrollTop: 0 },
      getElementById: () => null,
    };
    mockWindow.document = documentRef;
    mockWindow.setTimeout = callback => callbacks.push(callback);

    restoreBodyScrollPosition(240, { windowRef: mockWindow });
    vi.stubGlobal('document', undefined);

    expect(() => callbacks.forEach(callback => callback())).not.toThrow();
    expect(documentRef.documentElement.scrollTop).toBe(240);
    expect(documentRef.body.scrollTop).toBe(240);
  });

  it('recovers stuck fixed body when no overlay dialog is active', () => {
    document.body.style.position = 'fixed';
    document.body.style.overflow = 'hidden';

    const recovered = recoverPageScroll();
    expect(recovered).toBe(true);
    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('handles null body gracefully without throwing', () => {
    expect(() => lockBodyScroll(null, mockWindow)).not.toThrow();
    expect(releaseBodyScrollStyles(null)).toEqual({
      scrollY: 0,
      anchorId: '',
      anchorTop: Number.NaN,
    });
  });
});
