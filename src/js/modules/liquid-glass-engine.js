import {
  capturePageBackground,
  createProceduralBackground,
  isLiquidGlassCaptureSupported,
} from '../utils/liquid-glass-background.js';
import { mountLiquidGlassSurface } from '../utils/liquid-glass-surface.js';

class LiquidGlassEngine {
  constructor() {
    this.enabled = isLiquidGlassCaptureSupported();
    this.surfaces = new Set();
    this.tintRatio = 0;
    this.backgroundCanvas = null;
    this.capturePending = false;
    this.captureTimer = 0;
    this.heavyCaptureEnabled = false;
    this.heavyCaptureScheduled = false;
    this.resizeObserver = null;
    this._onScroll = () => this.scheduleCapture();
    this._onResize = () => {
      this.scheduleCapture();
      this.surfaces.forEach(surface => surface.resize());
    };
  }

  scheduleHeavyCapture() {
    if (this.heavyCaptureScheduled || !this.enabled) return;
    this.heavyCaptureScheduled = true;

    const enable = () => {
      this.heavyCaptureEnabled = true;
      this.scheduleCapture(true);
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(enable, { timeout: 8000 });
    } else {
      window.setTimeout(enable, 8000);
    }
  }

  init() {
    if (!this.enabled || this._initialized) return;
    this._initialized = true;

    this.tintRatio = this.readTintRatio();
    window.addEventListener('scroll', this._onScroll, { passive: true });
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
    if (this.capturePending && !force) return;
    clearTimeout(this.captureTimer);
    this.captureTimer = window.setTimeout(
      () => {
        void this.refreshBackground();
      },
      force ? 0 : 180
    );
  }

  async refreshBackground() {
    if (!this.enabled || this.capturePending) return;
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
        console.warn('Liquid glass background capture failed, using procedural fallback:', error);
        canvas = createProceduralBackground(window.innerWidth, window.innerHeight, { dark });
      }
      this.backgroundCanvas = canvas;
      this.surfaces.forEach(surface => surface.setBackgroundSource(canvas));
    } finally {
      this.capturePending = false;
    }
  }

  attach(element, options = {}) {
    if (!this.enabled || !element) return null;
    this.init();

    const surface = mountLiquidGlassSurface(element, {
      tintRatio: options.tintRatio ?? this.tintRatio,
      settings: options.settings ?? {},
      onReady: s => {
        if (this.backgroundCanvas) {
          s.setBackgroundSource(this.backgroundCanvas);
        } else {
          void this.refreshBackground();
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
  if (!engine.enabled) return;
  engine.init();
  engine.setTintRatio(tintRatio);
}

if (typeof window !== 'undefined') {
  window.liquidGlassEngine = engine;
  engine.observeTheme();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => engine.init(), { once: true });
  } else {
    engine.init();
  }
}

export default engine;
