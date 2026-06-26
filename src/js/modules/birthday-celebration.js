/**
 *  MANGESH'S BIRTHDAY SYSTEM 2026
 * Engine: Canvas Physics Particle System
 * Design: Apple Design 2026 + WebGL Liquid Glass
 */
import appleSounds from './apple-sounds.js';
import { attachLiquidGlass, getLiquidGlassEngine } from './liquid-glass-engine.js';
import { createProceduralBackground } from '../utils/liquid-glass-background.js';

class BirthdayCelebration {
  constructor(testMode = false) {
    this.birthMonth = 12; // Dec
    this.birthDay = 7;
    this.birthYear = 1998;
    this.name = 'Mangesh Raut';
    this.testMode = testMode;
    this.glassSurfaces = [];

    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.balloons = [];
    this.animationId = null;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Physics Config
    this.colors = ['#FF3B30', '#34C759', '#007AFF', '#FF9500', '#AF52DE', '#FFD60A'];

    this.init();
  }

  init() {
    const mode = this.resolveTestMode();

    if (mode === 'celebration') {
      setTimeout(() => this.showBirthdayCelebration(), 500);
      return;
    }

    if (mode === 'notification') {
      setTimeout(() => this.showBirthdayNotification(true), 500);
      return;
    }

    if (this.testMode === true) {
      setTimeout(() => this.showBirthdayCelebration(), 500);
      return;
    }

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    if (month === this.birthMonth && day === this.birthDay - 1) this.showBirthdayNotification();
    if (month === this.birthMonth && day === this.birthDay) this.showBirthdayCelebration();
  }

  resolveTestMode() {
    if (typeof this.testMode === 'string') return this.testMode;
    if (typeof window === 'undefined') return null;
    const param = new URLSearchParams(window.location.search).get('birthday-test');
    if (param === 'notification' || param === 'celebration') return param;
    return null;
  }

  createCelebrationGlassBackground() {
    const canvas = createProceduralBackground(window.innerWidth, window.innerHeight, {
      dark: true,
    });
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const w = canvas.width;
    const h = canvas.height;
    const blobs = [
      ['#7c3aed', w * 0.2, h * 0.25, w * 0.35],
      ['#ec4899', w * 0.72, h * 0.3, w * 0.28],
      ['#06b6d4', w * 0.45, h * 0.72, w * 0.32],
      ['#f59e0b', w * 0.82, h * 0.78, w * 0.22],
    ];
    blobs.forEach(([color, x, y, r]) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    return canvas;
  }

  mountLiquidGlass(element, options = {}) {
    const surface = attachLiquidGlass(element, options);
    if (surface) this.glassSurfaces.push(surface);
    return surface;
  }

  refreshCelebrationGlassBackground() {
    const engine = getLiquidGlassEngine();
    const bg = this.createCelebrationGlassBackground();
    if (this.canvas) {
      const ctx = bg.getContext('2d');
      ctx?.drawImage(this.canvas, 0, 0, bg.width, bg.height);
    }
    engine.backgroundCanvas = bg;
    this.glassSurfaces.forEach(surface => surface.setBackgroundSource(bg));
  }

  disposeGlass() {
    const engine = getLiquidGlassEngine();
    this.glassSurfaces.forEach(surface => engine.detach(surface));
    this.glassSurfaces = [];
  }

  calculateAge() {
    const today = new Date();
    let age = today.getFullYear() - this.birthYear;
    if (
      today.getMonth() + 1 < this.birthMonth ||
      (today.getMonth() + 1 === this.birthMonth && today.getDate() < this.birthDay)
    ) {
      age--;
    }
    return age;
  }

  getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  /* ═══════════════════════════════════════════════════════════
       NOTIFICATION SYSTEM (Maintains the approved design)
       ═══════════════════════════════════════════════════════════ */
  showBirthdayNotification(force = false) {
    const dismissed = localStorage.getItem('birthday-notification-dismissed');
    const today = new Date().toDateString();
    if (!force && dismissed === today) return;

    const age = this.calculateAge() + 1;
    const notification = document.createElement('div');
    notification.className = 'birthday-notification';

    notification.innerHTML = `
            <div class="ios-header">
                <div class="ios-icon-container">
                    <div class="ios-calendar-icon">
                        <div class="ios-calendar-header"></div>
                        <div class="ios-calendar-date">7</div>
                    </div>
                </div>
                <span class="ios-app-name">CALENDAR</span>
                <span class="ios-time">now</span>
            </div>
            <div class="ios-content">
                <div class="ios-title">Mangesh's ${this.getOrdinal(age)} Birthday</div>
                <div class="ios-body">Tomorrow</div>
            </div>
        `;

    document.body.appendChild(notification);

    requestAnimationFrame(() => {
      this.mountLiquidGlass(notification, {
        settings: {
          radius: 22,
          depth: 20,
          refraction: 1.1,
          chromaticAberration: 0.02,
        },
      });
      getLiquidGlassEngine().scheduleCapture(true);
    });

    const close = () => {
      // Adaptive Exit Animation
      if (window.innerWidth >= 769) {
        // Desktop: Slide Right
        notification.style.transform = 'translateX(120%)';
      } else {
        // Mobile: Slide Up (Preserve Centering)
        notification.style.transform = 'translateX(-50%) translateY(-150%)';
      }

      notification.style.transition = 'transform 0.5s cubic-bezier(0.32, 0, 0.67, 0)';
      setTimeout(() => {
        this.disposeGlass();
        notification.remove();
      }, 500);
      localStorage.setItem('birthday-notification-dismissed', today);
    };

    // Auto-dismiss logic
    const isMobile = window.innerWidth < 769;
    const dismissTime = isMobile ? 10000 : 15000; // 10s Mobile, 15s Desktop

    setTimeout(() => {
      if (notification.parentNode) close();
    }, dismissTime);

    // Optional: Click to dismiss manually if user wants to clear it
    notification.onclick = () => close();
  }

  /* ═══════════════════════════════════════════════════════════
       CANVAS PHYSICS ENGINE (The 2026 Upgrade)
       ═══════════════════════════════════════════════════════════ */
  showBirthdayCelebration() {
    const celebrated = sessionStorage.getItem('birthday-celebrated');
    const today = new Date().toDateString();
    const testMode = this.resolveTestMode();
    if (celebrated === today && !testMode && this.testMode !== true) return;

    const age = this.calculateAge();

    // DOM Overlay
    const overlay = document.createElement('div');
    overlay.className = 'birthday-celebration';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', `Happy ${this.getOrdinal(age)} Birthday, ${this.name}`);

    overlay.innerHTML = `
      <div class="birthday-bg-art">
        <div class="aurora-gradient"></div>
      </div>
      <canvas id="celebration-canvas" aria-hidden="true"></canvas>
      <div class="birthday-hero">
        <div class="birthday-emoji-row" aria-hidden="true">
          <span class="b-emoji" style="--d:0s">🎉</span>
          <span class="b-emoji" style="--d:.15s">🎂</span>
          <span class="b-emoji" style="--d:.3s">🎁</span>
          <span class="b-emoji" style="--d:.45s">🥳</span>
          <span class="b-emoji" style="--d:.6s">✨</span>
        </div>
        <div class="hero-title">Happy Birthday</div>
        <div class="hero-subtitle">${this.name}</div>
        <div class="hero-badge">Celebrating ${this.getOrdinal(age)} Year ✦ Born Dec 7</div>
        <div class="action-area">
          <button class="glass-btn" id="birthday-enter-btn">
            <span class="glass-btn-icon">🚀</span> Enter Portfolio
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      const badge = overlay.querySelector('.hero-badge');
      const enterBtn = overlay.querySelector('.glass-btn');
      [badge, enterBtn].forEach(node => {
        if (!node) return;
        this.mountLiquidGlass(node, {
          settings: {
            radius: 18,
            depth: 24,
            refraction: 1.05,
            chromaticAberration: 0.028,
          },
        });
      });
      this.refreshCelebrationGlassBackground();
    });

    // Initialize Canvas
    this.canvas = document.getElementById('celebration-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this._resizeHandler = () => this.resize();
    window.addEventListener('resize', this._resizeHandler);

    // Launch Physics
    this.createParticles();
    this.createBalloons();
    this.startLoop();

    // Close Interaction — sound plays here (inside user gesture)
    const enterBtn = overlay.querySelector('#birthday-enter-btn');
    enterBtn.addEventListener('click', () => {
      appleSounds.playBirthday();
      overlay.style.cssText = 'opacity: 0; transition: opacity 0.8s ease; pointer-events: none;';
      cancelAnimationFrame(this.animationId);
      window.removeEventListener('resize', this._resizeHandler);
      setTimeout(() => {
        this.disposeGlass();
        overlay.remove();
      }, 800);
      sessionStorage.setItem('birthday-celebrated', today);
    });

    // Also play on overlay show after a brief delay
    setTimeout(() => appleSounds.playBirthday(), 600);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  createParticles() {
    // Create 200 confetti pieces
    for (let i = 0; i < 200; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height - this.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 12 + 6,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 4 + 2,
        angle: Math.random() * 360,
        spinConfig: Math.random() * 0.2 - 0.1,
      });
    }
  }

  createBalloons() {
    // Create 15 balloons
    for (let i = 0; i < 15; i++) {
      this.balloons.push({
        x: Math.random() * this.width,
        y: this.height + Math.random() * 500,
        radius: Math.random() * 15 + 30, // 30-45px radius
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        vx: 0,
        vy: -(Math.random() * 2 + 1), // Upward speed
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.05 + 0.02,
      });
    }
  }

  startLoop() {
    let frame = 0;
    const loop = () => {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.updateParticles();
      this.updateBalloons();
      frame += 1;
      if (frame % 12 === 0 && this.glassSurfaces.length) {
        this.refreshCelebrationGlassBackground();
      }
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }

  updateParticles() {
    this.particles.forEach(p => {
      // Physics
      p.y += p.vy;
      p.x += Math.sin(p.angle * 0.01) * 2; // Sway
      p.angle += p.spinConfig * 10;

      // Loop functionality
      if (p.y > this.height) {
        p.y = -20;
        p.x = Math.random() * this.width;
      }

      // Draw Confetti
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.angle * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.fill(new Path2D(`M0 0 L${p.w} 0 L${p.w} ${p.h} L0 ${p.h} Z`)); // Rect path
      this.ctx.restore();
    });
  }

  updateBalloons() {
    this.balloons.forEach(b => {
      // Physics
      b.y += b.vy;
      b.wobble += b.wobbleSpeed;
      b.x += Math.sin(b.wobble) * 0.5;

      // Recycle balloons that float off the top
      if (b.y + b.radius < 0) {
        b.y = this.height + b.radius * 2;
        b.x = Math.random() * this.width;
      }

      // Draw String
      this.ctx.beginPath();
      this.ctx.moveTo(b.x, b.y + b.radius * 1.2);
      this.ctx.quadraticCurveTo(
        b.x + Math.sin(b.wobble * 2) * 10,
        b.y + b.radius * 1.2 + 50,
        b.x,
        b.y + b.radius * 1.2 + 100
      );
      this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Draw Balloon Body
      this.ctx.beginPath();
      this.ctx.ellipse(b.x, b.y, b.radius, b.radius * 1.2, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = b.color;
      // Add sheen gradient
      const grad = this.ctx.createRadialGradient(
        b.x - b.radius * 0.3,
        b.y - b.radius * 0.3,
        b.radius * 0.1,
        b.x,
        b.y,
        b.radius
      );
      grad.addColorStop(0, 'rgba(255,255,255,0.4)');
      grad.addColorStop(1, b.color);
      this.ctx.fillStyle = grad;
      this.ctx.fill();

      // Draw Knot
      this.ctx.beginPath();
      this.ctx.moveTo(b.x, b.y + b.radius * 1.15);
      this.ctx.lineTo(b.x - 4, b.y + b.radius * 1.25);
      this.ctx.lineTo(b.x + 4, b.y + b.radius * 1.25);
      this.ctx.fillStyle = b.color;
      this.ctx.fill();
    });
  }

  playBirthdaySound() {
    // Kept for backward compat — actual sound is now triggered by user gesture
    // in showBirthdayCelebration's click handler to comply with browser autoplay policy
    appleSounds.playBirthday();
  }
}

// Global Initialization
const initBirthdaySystem = () => {
  const today = new Date().toDateString();
  if (!window.__birthdaySystem || window.__birthdaySystemDate !== today) {
    window.__birthdaySystem = new BirthdayCelebration();
    window.__birthdaySystemDate = today;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBirthdaySystem);
} else {
  initBirthdaySystem();
}

if (!window.__birthdayVisibilityBound) {
  window.__birthdayVisibilityBound = true;
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) initBirthdaySystem();
  });
}

if (!window.BirthdayCelebration) window.BirthdayCelebration = BirthdayCelebration;

export default BirthdayCelebration;
