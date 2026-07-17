import {
  capturePageBackground,
  createProceduralBackground,
  isLiquidGlassCaptureSupported,
  isLowPowerClient,
} from '../utils/liquid-glass-background.js';
import { mountLiquidGlassSurface } from '../utils/liquid-glass-surface.js';
import { isPerformanceAudit } from '../utils/perf-audit.js';

class LiquidGlassEngine {
  constructor() {
    // Lazy: WebGL probe itself is a long task — defer until init/attach.
    this._enabledResolved = false;
    this.enabled = false;
    this.surfaces = new Set();
    this.tintRatio = 0;
    this.backgroundCanvas = null;
    this.capturePending = false;
    this.captureTimer = 0;
    this.heavyCaptureEnabled = false;
    this.heavyCaptureScheduled = false;
    this.resizeObserver = null;
    this.captureFallbackReported = false;
    // Do not capture on scroll — html2canvas/page capture mid-fling destroys FPS.
    // Resize/theme changes are enough; surfaces already use CSS backdrop when capture is cold.
    this._onScroll = null;
    this._onResize = () => {
      if (!this.enabled || this.surfaces.size === 0) return;
      this.scheduleCapture(false);
      this.surfaces.forEach(surface => surface.resize());
    };
  }

  resolveEnabled() {
    if (this._enabledResolved) return this.enabled;
    this._enabledResolved = true;
    // iPhone / low-power: CSS glass only — WebGL multi-surface rAF OOMs Mobile Safari
    this.enabled = isLiquidGlassCaptureSupported() && !isPerformanceAudit() && !isLowPowerClient();
    return this.enabled;
  }

  scheduleHeavyCapture() {
    // Heavy DOM capture is opt-in only (see liquid-glass-background.js).
    // Procedural backgrounds keep WebGL refraction without multi-second TBT.
    if (this.heavyCaptureScheduled || !this.enabled) return;
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;
    if (isPerformanceAudit()) return;
    if (typeof window !== 'undefined' && window.__LG_HEAVY_CAPTURE__ !== true) {
      return;
    }
    this.heavyCaptureScheduled = true;
    this.heavyCaptureEnabled = true;
    this.scheduleCapture(true);
  }

  init() {
    this.resolveEnabled();
    if (!this.enabled || this._initialized) return;
    this._initialized = true;

    this.tintRatio = this.readTintRatio();
    window.addEventListener('resize', this._onResize, { passive: true });

    this.resizeObserver = new ResizeObserver(() => {
      this.surfaces.forEach(surface => surface.resize());
    });

    void this.refreshBackground();
    this.scheduleHeavyCapture();
  }

  readTintRatio() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--lg-tint').trim();
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0;
  }

  scheduleCapture(force = false) {
    if (!this.enabled) return;
    if (this.surfaces.size === 0 && !force) return;
    if (this.capturePending && !force) return;
    clearTimeout(this.captureTimer);
    this.captureTimer = window.setTimeout(
      () => {
        void this.refreshBackground(force);
      },
      force ? 0 : 180
    );
  }

  async refreshBackground(force = false) {
    if (!this.enabled || this.capturePending) return;
    if (this.surfaces.size === 0 && !force) return;
    this.capturePending = true;
    try {
      const dark = document.documentElement.classList.contains('dark');
      let canvas = null;
      try {
        const captureTarget = document.querySelector('[data-liquid-glass-background]');
        if (this.heavyCaptureEnabled && captureTarget) {
          canvas = await capturePageBackground({ target: captureTarget });
        } else {
          canvas = createProceduralBackground(window.innerWidth, window.innerHeight, { dark });
        }
      } catch (error) {
        if (!this.captureFallbackReported) {
          this.captureFallbackReported = true;
          console.debug('Liquid glass background capture using procedural fallback:', error);
        }
        canvas = createProceduralBackground(window.innerWidth, window.innerHeight, { dark });
      }
      this.backgroundCanvas = canvas;
      this.surfaces.forEach(surface => surface.setBackgroundSource(canvas));
    } finally {
      this.capturePending = false;
    }
  }

  attach(element, options = {}) {
    this.resolveEnabled();
    if (!this.enabled || !element) return null;
    this.init();

    const surface = mountLiquidGlassSurface(element, {
      tintRatio: options.tintRatio ?? this.tintRatio,
      settings: options.settings ?? {},
      onReady: s => {
        if (this.backgroundCanvas) {
          s.setBackgroundSource(this.backgroundCanvas);
        } else {
          void this.refreshBackground(true);
          this.scheduleHeavyCapture();
        }
        options.onReady?.(s);
      },
    });

    if (!surface?.renderer) return null;

    this.surfaces.add(surface);
    this.resizeObserver.observe(element);
    return surface;
  }

  detach(surface) {
    if (!surface) return;
    this.surfaces.delete(surface);
    this.resizeObserver?.unobserve(surface.element);
    surface.dispose();
  }

  setTintRatio(ratio) {
    this.tintRatio = Math.min(1, Math.max(0, ratio));
    this.surfaces.forEach(surface => surface.setTintRatio(this.tintRatio));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('liquid-glass:sync-chrome'));
    }
  }

  observeTheme() {
    const observer = new MutationObserver(() => {
      this.scheduleCapture(true);
      this.surfaces.forEach(surface => surface.setTintRatio(this.tintRatio));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-lg-mode'],
    });
    return observer;
  }
}

const engine = new LiquidGlassEngine();

export function getLiquidGlassEngine() {
  return engine;
}

export function attachLiquidGlass(element, options) {
  return engine.attach(element, options);
}

export function syncLiquidGlassWebGL(tintRatio) {
  engine.resolveEnabled();
  if (!engine.enabled) return;
  engine.init();
  engine.setTintRatio(tintRatio);
}

if (typeof window !== 'undefined' && !isPerformanceAudit()) {
  window.liquidGlassEngine = engine;
  // Do not auto-init / probe WebGL on import — chrome module calls init when needed.
}

export default engine;
