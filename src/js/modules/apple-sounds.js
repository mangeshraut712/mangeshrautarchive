/**
 * Apple Sound System 2026
 * Procedural Web Audio API sounds inspired by macOS/iOS
 * No external audio files — all synthesized on-device
 */

class AppleSoundSystem {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._enabled = this._loadPref();
    this._userInteracted = false;
    this._bindInteraction();
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  _loadPref() {
    try {
      const stored = localStorage.getItem('apple-sounds-enabled');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  }

  _savePref(val) {
    try {
      localStorage.setItem('apple-sounds-enabled', String(val));
    } catch {
      /* ignore */
    }
  }

  _bindInteraction() {
    const unlock = () => {
      this._userInteracted = true;
      document.removeEventListener('click', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      document.removeEventListener('touchstart', unlock, true);
    };
    document.addEventListener('click', unlock, { capture: true, once: true, passive: true });
    document.addEventListener('keydown', unlock, { capture: true, once: true, passive: true });
    document.addEventListener('touchstart', unlock, { capture: true, once: true, passive: true });
  }

  _getCtx() {
    if (!this._userInteracted) return null;
    try {
      if (!this._ctx) {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        this._masterGain = this._ctx.createGain();
        this._masterGain.gain.setValueAtTime(0.6, this._ctx.currentTime);
        this._masterGain.connect(this._ctx.destination);
      }
      if (this._ctx.state === 'suspended') {
        this._ctx.resume().catch(() => {});
      }
      return this._ctx;
    } catch {
      return null;
    }
  }

  _chain(nodes) {
    // Connect nodes[0] → nodes[1] → ... → masterGain → destination
    const ctx = this._getCtx();
    if (!ctx || !this._masterGain) return null;
    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].connect(nodes[i + 1]);
    }
    nodes[nodes.length - 1].connect(this._masterGain);
    return ctx;
  }

  _scheduleOscillator(type, freq, startTime, duration, peakGain = 0.15, gainNode = null) {
    const ctx = this._getCtx();
    if (!ctx) return;
    const g = gainNode || ctx.createGain();
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, startTime);
    if (!gainNode) {
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      o.connect(g);
      g.connect(this._masterGain);
    }
    o.start(startTime);
    o.stop(startTime + duration + 0.01);
    return o;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  get enabled() {
    return this._enabled;
  }

  toggle() {
    this._enabled = !this._enabled;
    this._savePref(this._enabled);
    if (this._enabled) this.playThemeToggle();
    return this._enabled;
  }

  enable() {
    this._enabled = true;
    this._savePref(true);
  }
  disable() {
    this._enabled = false;
    this._savePref(false);
  }

  // ── Click / Tap — soft UI tap (macOS Finder click feel) ──────────────────
  playClick() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const g = ctx.createGain();
      const o = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(1200, t);
      f.Q.setValueAtTime(0.8, t);
      o.type = 'sine';
      o.frequency.setValueAtTime(900, t);
      o.frequency.exponentialRampToValueAtTime(600, t + 0.045);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(f);
      f.connect(g);
      g.connect(this._masterGain);
      o.start(t);
      o.stop(t + 0.07);
    } catch {
      /* ignore */
    }
  }

  // ── Navigation — subtle macOS tab switch ──────────────────────────────────
  playNav() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      // Two quick sine tones (ascending)
      [
        [440, 0],
        [554, 0.06],
      ].forEach(([freq, delay]) => {
        const g = ctx.createGain();
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t + delay);
        g.gain.setValueAtTime(0, t + delay);
        g.gain.linearRampToValueAtTime(0.05, t + delay + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.1);
        o.connect(g);
        g.connect(this._masterGain);
        o.start(t + delay);
        o.stop(t + delay + 0.12);
      });
    } catch {
      /* ignore */
    }
  }

  // ── Launch Welcome — brief Mac boot chime (C5 → E5) ─────────────────────
  playLaunch() {
    if (!this._enabled) return;
    this._userInteracted = true;
    const ctx = this._getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      [
        [523.25, 0, 0.14, 0.055],
        [659.25, 0.09, 0.2, 0.045],
      ].forEach(([freq, delay, dur, peak]) => {
        const g = ctx.createGain();
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t + delay);
        g.gain.setValueAtTime(0, t + delay);
        g.gain.linearRampToValueAtTime(peak, t + delay + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
        o.connect(g);
        g.connect(this._masterGain);
        o.start(t + delay);
        o.stop(t + delay + dur + 0.02);
      });
    } catch {
      /* ignore */
    }
  }

  // ── Theme Toggle — Mac "plink" (two-tone ping) ───────────────────────────
  playThemeToggle() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      // High crystal ping + low resonance
      [
        [1046, 0, 0.12],
        [523, 0.03, 0.18],
      ].forEach(([freq, delay, dur]) => {
        const g = ctx.createGain();
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t + delay);
        g.gain.setValueAtTime(0, t + delay);
        g.gain.linearRampToValueAtTime(0.07, t + delay + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
        o.connect(g);
        g.connect(this._masterGain);
        o.start(t + delay);
        o.stop(t + delay + dur + 0.01);
      });
    } catch {
      /* ignore */
    }
  }

  // ── Success — iOS success chime (C major arpeggio) ───────────────────────
  playSuccess() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const g = ctx.createGain();
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t + i * 0.08);
        g.gain.setValueAtTime(0, t + i * 0.08);
        g.gain.linearRampToValueAtTime(0.08, t + i * 0.08 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.22);
        o.connect(g);
        g.connect(this._masterGain);
        o.start(t + i * 0.08);
        o.stop(t + i * 0.08 + 0.25);
      });
    } catch {
      /* ignore */
    }
  }

  // ── Error — soft low thump (macOS error alert feel) ───────────────────────
  playError() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      [200, 150].forEach((freq, i) => {
        const g = ctx.createGain();
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t + i * 0.05);
        g.gain.setValueAtTime(0, t + i * 0.05);
        g.gain.linearRampToValueAtTime(0.1, t + i * 0.05 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.05 + 0.18);
        o.connect(g);
        g.connect(this._masterGain);
        o.start(t + i * 0.05);
        o.stop(t + i * 0.05 + 0.2);
      });
    } catch {
      /* ignore */
    }
  }

  // ── Birthday — first 4 notes of Happy Birthday ───────────────────────────
  playBirthday() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      // "Hap-py Birth-day to you" first phrase
      const melody = [
        [392, 0.0, 0.2], // G4
        [392, 0.22, 0.1], // G4
        [440, 0.33, 0.3], // A4
        [392, 0.65, 0.3], // G4
        [523, 0.97, 0.3], // C5
        [494, 1.3, 0.5], // B4
      ];
      melody.forEach(([freq, delay, dur]) => {
        const g = ctx.createGain();
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t + delay);
        g.gain.setValueAtTime(0, t + delay);
        g.gain.linearRampToValueAtTime(0.09, t + delay + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
        o.connect(g);
        g.connect(this._masterGain);
        o.start(t + delay);
        o.stop(t + delay + dur + 0.01);
      });
    } catch {
      /* ignore */
    }
  }

  // ── Notification — iOS tri-tone ──────────────────────────────────────────
  playNotification() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const notes = [1046.5, 1318.5, 1568]; // C6 E6 G6
      notes.forEach((freq, i) => {
        const g = ctx.createGain();
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t + i * 0.12);
        g.gain.setValueAtTime(0, t + i * 0.12);
        g.gain.linearRampToValueAtTime(0.06, t + i * 0.12 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.15);
        o.connect(g);
        g.connect(this._masterGain);
        o.start(t + i * 0.12);
        o.stop(t + i * 0.12 + 0.18);
      });
    } catch {
      /* ignore */
    }
  }
}

// Singleton export
const appleSounds = new AppleSoundSystem();
globalThis.appleSounds = appleSounds;
export default appleSounds;
