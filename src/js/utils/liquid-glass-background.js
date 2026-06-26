/**
 * Captures page background for WebGL liquid glass refraction.
 */
let captureModulePromise = null;

function shouldExcludeNode(node) {
  if (!(node instanceof Element)) return false;
  if (node.classList?.contains('lg-webgl-host')) return true;
  if (node.classList?.contains('birthday-notification')) return true;
  if (node.classList?.contains('a11y-glass-popover')) return true;
  if (node.id === 'a11y-glass-popover') return true;
  if (node.matches?.('.a11y-toolbar, [data-lg-skip-capture]')) return true;
  return false;
}

async function loadCaptureModule() {
  if (!captureModulePromise) {
    captureModulePromise = import('../vendor/html-to-image/index.js');
  }
  return captureModulePromise;
}

export function isLiquidGlassCaptureSupported() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-transparency: reduce)')?.matches) return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl', { alpha: true }));
  } catch {
    return false;
  }
}

export async function capturePageBackground({ target = document.documentElement } = {}) {
  const { toCanvas } = await loadCaptureModule();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  return toCanvas(target, {
    pixelRatio,
    cacheBust: true,
    skipAutoScale: true,
    backgroundColor: null,
    filter: node => !shouldExcludeNode(node),
  });
}

export function createProceduralBackground(width, height, { dark = false } = {}) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  if (dark) {
    gradient.addColorStop(0, '#0b1220');
    gradient.addColorStop(0.45, '#111827');
    gradient.addColorStop(1, '#1e1b4b');
  } else {
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(0.4, '#e0f2fe');
    gradient.addColorStop(1, '#fce7f3');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}
