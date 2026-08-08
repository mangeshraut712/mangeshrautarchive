/** Decode an image without blocking the main thread and release it immediately. */
export async function decodeImageBitmap(file, createBitmapFn = globalThis.createImageBitmap) {
  if (!file || typeof createBitmapFn !== 'function') return null;

  try {
    const bitmap = await createBitmapFn(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return dimensions;
  } catch {
    return null;
  }
}
