import { describe, expect, it, vi } from 'vitest';
import { decodeImageBitmap } from '../../src/js/utils/image-bitmap.js';

describe('decodeImageBitmap', () => {
  it('returns dimensions and closes the decoded bitmap', async () => {
    const close = vi.fn();
    const createBitmap = vi.fn().mockResolvedValue({ width: 1200, height: 800, close });
    const file = new Blob(['image'], { type: 'image/png' });

    await expect(decodeImageBitmap(file, createBitmap)).resolves.toEqual({
      width: 1200,
      height: 800,
    });
    expect(createBitmap).toHaveBeenCalledWith(file);
    expect(close).toHaveBeenCalledOnce();
  });

  it('returns null when decoding fails', async () => {
    const createBitmap = vi.fn().mockRejectedValue(new Error('decode failed'));

    await expect(decodeImageBitmap(new Blob(), createBitmap)).resolves.toBeNull();
  });

  it('returns null when bitmap decoding is unavailable', async () => {
    await expect(decodeImageBitmap(new Blob(), undefined)).resolves.toBeNull();
  });
});
