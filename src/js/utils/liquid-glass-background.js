/**
 * Background source for WebGL liquid glass refraction.
 *
 * Full-page html-to-image capture is intentionally disabled by default:
 * it costs multi-second main-thread work (Lighthouse TBT collapse) and
 * CSS backdrop-filter already delivers the glass look sitewide.
 * Opt-in only: window.__LG_HEAVY_CAPTURE__ = true after a user gesture.
 *
 * iPhone / low-power devices skip WebGL entirely — multiple perpetual rAF + WebGL
 * contexts crash Safari with "A problem repeatedly occurred on …".
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

/**
 * True for iPhone / iPad (including iPadOS desktop UA) and other touch Macs.
 * Used to avoid WebGL liquid glass which OOM-crashes Mobile Safari.
 */
export function isIOSLikeDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  // iPadOS 13+ reports as MacIntel with touch
  if (navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1) {
    return true;
  }
  return false;
}

/** Heuristic for devices that should never run multi-context WebGL glass. */
export function isLowPowerClient() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
  if (isIOSLikeDevice()) return true;
  if (window.matchMedia?.('(prefers-reduced-transparency: reduce)')?.matches) return true;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return true;
  // Coarse pointer + limited cores ≈ phone / tablet class
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches;
  const cores = Number(navigator.hardwareConcurrency || 8);
  if (coarse && cores > 0 && cores <= 6) return true;
  if (
    typeof navigator.deviceMemory === 'number' &&
    navigator.deviceMemory > 0 &&
    navigator.deviceMemory <= 4
  ) {
    return true;
  }
  if (navigator.connection?.saveData) return true;
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
  // CSS backdrop-filter only on iPhone / low-power — never multi-WebGL hosts
  if (isLowPowerClient()) return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl', { alpha: true, failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext('experimental-webgl', { alpha: true, failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    // Release the probe context immediately so we don't burn one of Safari's slots
    const ext = gl.getExtension('WEBGL_lose_context');
    ext?.loseContext?.();
    return true;
  } catch {
    return false;
  }
}

export async function capturePageBackground({ target = document.documentElement } = {}) {
  const dark = document.documentElement.classList.contains('dark');
  const procedural = () =>
    createProceduralBackground(window.innerWidth, window.innerHeight, { dark });

  // Default + mobile/low-power/audit: cheap procedural canvas (no DOM clone)
  if (
    isLowPowerClient() ||
    typeof window === 'undefined' ||
    window.__LG_HEAVY_CAPTURE__ !== true ||
    navigator.webdriver === true
  ) {
    return procedural();
  }

  try {
    const { toCanvas } = await loadCaptureModule();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    return await toCanvas(target, {
      pixelRatio,
      cacheBust: true,
      skipFonts: true,
      fontEmbedCSS: '',
      skipAutoScale: true,
      backgroundColor: null,
      filter: node => !shouldExcludeNode(node),
    });
  } catch {
    return procedural();
  }
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
