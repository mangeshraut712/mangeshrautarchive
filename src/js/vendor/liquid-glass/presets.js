/**
 * Liquid Glass material presets — MIT © Tirth Patel / liquidglass-oss
 */
export const liquidGlassPresets = {
  clear: {
    blur: 1,
    refraction: 1.2,
    chromaticAberration: 0.012,
    distortion: 0,
    edgeHighlight: 0,
    specular: 0.04,
    fresnel: 0.56,
    radius: 18,
    depth: 14,
    brightness: 0.02,
    saturation: 0,
    shadow: 0,
    darkTint: 0,
    tintStrength: 0.38,
    tintColor: [0.92, 0.95, 1.05],
    tint: 0,
    opacity: 0.88,
    bevel: 1,
    lensWidth: 56,
    lensHeight: 32,
    liquidMotion: 0.24,
    liquidSpring: 0.055,
    liquidDamping: 0.84
  },
  frosted: {
    blur: 0.52,
    refraction: 0.58,
    chromaticAberration: 0.035,
    distortion: 0.025,
    edgeHighlight: 0.11,
    specular: 0.08,
    fresnel: 0.95,
    radius: 22,
    depth: 36,
    brightness: 0.04,
    saturation: -0.08,
    shadow: 0,
    darkTint: 0.09,
    tintStrength: 0.12,
    tintColor: [0.92, 0.95, 1.05],
    tint: 0,
    opacity: 1,
    bevel: 0,
    lensWidth: 54,
    lensHeight: 34,
    liquidMotion: 0.13,
    liquidSpring: 0.052,
    liquidDamping: 0.85
  },
  dark: {
    blur: 0.18,
    refraction: 0.72,
    chromaticAberration: 0.045,
    distortion: 0.015,
    edgeHighlight: 0.08,
    specular: 0.14,
    fresnel: 1.08,
    radius: 22,
    depth: 42,
    brightness: -0.03,
    saturation: 0.03,
    shadow: 0,
    darkTint: 0.28,
    tintStrength: 0.06,
    tintColor: [0.92, 0.95, 1.05],
    tint: 0,
    opacity: 1,
    bevel: 0,
    lensWidth: 54,
    lensHeight: 34,
    liquidMotion: 0.14,
    liquidSpring: 0.055,
    liquidDamping: 0.84
  },
  prism: {
    blur: 0.06,
    refraction: 0.82,
    chromaticAberration: 0.18,
    distortion: 0.035,
    edgeHighlight: 0.13,
    specular: 0.08,
    fresnel: 1.18,
    radius: 22,
    depth: 48,
    brightness: 0.02,
    saturation: 0.1,
    shadow: 0,
    darkTint: 0.12,
    tintStrength: 0.14,
    tintColor: [0.92, 0.95, 1.05],
    tint: 0,
    opacity: 1,
    bevel: 0,
    lensWidth: 58,
    lensHeight: 36,
    liquidMotion: 0.16,
    liquidSpring: 0.06,
    liquidDamping: 0.83
  },
  dome: {
    blur: 0.08,
    refraction: 0.74,
    chromaticAberration: 0.06,
    distortion: 0.01,
    edgeHighlight: 0.12,
    specular: 0.16,
    fresnel: 1.05,
    radius: 22,
    depth: 56,
    brightness: 0.02,
    saturation: 0.02,
    shadow: 0,
    darkTint: 0.11,
    tintStrength: 0.1,
    tintColor: [0.92, 0.95, 1.05],
    tint: 0,
    opacity: 1,
    bevel: 1,
    lensWidth: 56,
    lensHeight: 38,
    liquidMotion: 0.13,
    liquidSpring: 0.05,
    liquidDamping: 0.86
  }
};

export const defaultLiquidGlassSettings = liquidGlassPresets.frosted;

export function resolveLiquidGlassSettings(variant = 'frosted', overrides = {}) {
  const base = liquidGlassPresets[variant] ?? liquidGlassPresets.frosted;
  return { ...base, ...overrides };
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpSettings(clear, tinted, tintRatio) {
  const t = Math.min(1, Math.max(0, tintRatio));
  const out = {};
  for (const key of Object.keys(clear)) {
    const a = clear[key];
    const b = tinted[key];
    if (Array.isArray(a) && Array.isArray(b)) {
      out[key] = a.map((v, i) => lerp(v, b[i], t));
    } else if (typeof a === 'number' && typeof b === 'number') {
      out[key] = lerp(a, b, t);
    } else {
      out[key] = t < 0.5 ? a : b;
    }
  }
  return out;
}
