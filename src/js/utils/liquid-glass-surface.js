import { LiquidGlassRenderer } from '../vendor/liquid-glass/LiquidGlassRenderer.js';
import { lerpSettings, liquidGlassPresets } from '../vendor/liquid-glass/presets.js';

const CLEAR_PRESET = liquidGlassPresets.clear;
const TINTED_PRESET = liquidGlassPresets.frosted;

function buildSettings(tintRatio, overrides = {}) {
  const base = lerpSettings(CLEAR_PRESET, TINTED_PRESET, tintRatio);
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark && tintRatio > 0.35) {
    base.darkTint = Math.max(base.darkTint, 0.12 + tintRatio * 0.18);
    base.brightness = Math.min(base.brightness, -0.01);
  }
  return { ...base, ...overrides };
}

export class LiquidGlassSurface {
  constructor(element, { tintRatio = 0, settings = {}, onReady } = {}) {
    this.element = element;
    this.tintRatio = tintRatio;
    this.settingsOverrides = settings;
    this.onReady = onReady;
    this.disposed = false;
    this.liquid = { stretch: 0, velocity: 0, target: 0 };
    this.motionFrame = 0;

    element.classList.add('lg-webgl-host');
    if (!element.querySelector(':scope > .lg-webgl-content')) {
      const content = document.createElement('div');
      content.className = 'lg-webgl-content';
      while (element.firstChild) {
        content.appendChild(element.firstChild);
      }
      element.appendChild(content);
    }

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'lg-webgl-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    element.insertBefore(this.canvas, element.firstChild);

    const merged = buildSettings(tintRatio, settings);
    merged.radius = settings.radius ?? Math.min(merged.radius, 28);
    merged.lensWidth = element.clientWidth || merged.lensWidth;
    merged.lensHeight = element.clientHeight || merged.lensHeight;

    try {
      this.renderer = new LiquidGlassRenderer(this.canvas, '', merged);
      this.renderer.setBackgroundSampling(true);
      this.renderer.materialMorph = 1;
      this.resize();
      this.bindMotion();
      onReady?.(this);
    } catch (error) {
      element.classList.remove('lg-webgl-host');
      element.classList.add('lg-webgl-fallback');
      console.warn('Liquid Glass WebGL unavailable:', error);
      this.renderer = null;
    }
  }

  bindMotion() {
    if (!this.renderer) return;
    const spring = this.renderer.settings.liquidSpring ?? 0.055;
    const damping = this.renderer.settings.liquidDamping ?? 0.84;
    const motion = this.renderer.settings.liquidMotion ?? 0.14;

    const onMove = event => {
      const rect = this.element.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const speed = Math.hypot(dx, dy);
      this.liquid.target = Math.min(0.12, 0.02 + (speed / 2200) * motion);
    };

    this.element.addEventListener('pointermove', onMove);
    this.element.addEventListener('pointerleave', () => {
      this.liquid.target = 0;
    });

    const tick = () => {
      if (this.disposed || !this.renderer) return;
      this.liquid.velocity += (this.liquid.target - this.liquid.stretch) * spring;
      this.liquid.velocity *= damping;
      this.liquid.stretch += this.liquid.velocity;
      const rect = this.canvas.getBoundingClientRect();
      this.renderer.setGeometry(
        rect.width / 2,
        rect.height / 2,
        this.liquid.stretch,
        false,
        1,
        1,
        0
      );
      this.motionFrame = requestAnimationFrame(tick);
    };
    this.motionFrame = requestAnimationFrame(tick);
    this._cleanupMotion = () => {
      this.element.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(this.motionFrame);
    };
  }

  setTintRatio(tintRatio) {
    this.tintRatio = tintRatio;
    if (!this.renderer) return;
    const merged = buildSettings(tintRatio, this.settingsOverrides);
    const rect = this.element.getBoundingClientRect();
    merged.lensWidth = rect.width || merged.lensWidth;
    merged.lensHeight = rect.height || merged.lensHeight;
    this.renderer.setSettings(merged);
  }

  setBackgroundSource(source) {
    if (!this.renderer || !source) return;
    this.renderer.setTextureSource(source);
    this.renderer.syncGeometryFromCanvas();
  }

  resize() {
    if (!this.renderer) return;
    const rect = this.element.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    this.renderer.resize(rect.width, rect.height);
    this.renderer.syncGeometryFromCanvas();
  }

  dispose() {
    this.disposed = true;
    this._cleanupMotion?.();
    this.renderer?.dispose();
    this.renderer = null;
    this.canvas?.remove();
    this.element?.classList.remove('lg-webgl-host', 'lg-webgl-fallback');
  }
}

export function mountLiquidGlassSurface(element, options) {
  if (!element || element.classList.contains('lg-webgl-host')) return null;
  return new LiquidGlassSurface(element, options);
}
