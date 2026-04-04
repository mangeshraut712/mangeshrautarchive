class DebugRunner {
  constructor() {
    ((this.canvas = null),
      (this.ctx = null),
      (this.gameRunning = !1),
      (this.gameOver = !1),
      (this.score = 0),
      (this.highScore = parseInt(localStorage.getItem('debugRunnerHighScore')) || 0),
      (this.speed = 8),
      (this.level = 1),
      (this.gameLoop = null),
      (this.groundY = 320),
      (this.dev = null),
      (this.obstacles = []),
      (this.powerUps = []),
      (this.particles = []),
      (this.lastScoreIncrement = 0),
      (this.invincible = !1),
      (this.invincibleUntil = 0),
      (this.coffeePower = 0),
      (this.stars = []),
      (this.codeSnippets = []),
      (this.screenShake = 0),
      (this.trail = []),
      (this.isMobile = this.detectMobile()),
      (this.mobileControls = null),
      (this.frame = 0),
      (this.highScoreDisplay = document.getElementById('game-high-score')),
      (this.speedDisplay = document.getElementById('game-speed')),
      (this.lastUiHighScore = null),
      (this.lastUiSpeed = null),
      (this.themes = {
        dark: {
          bg: '#000000',
          ground: '#1c1c1e',
          groundLine: '#333333',
          text: '#ffffff',
          textSecondary: '#86868b',
          accent: '#0A84FF',
          bug: '#FF453A',
          conflict: '#FFD60A',
          fire: '#FF9F0A',
          coffee: '#AC8E68',
          stackOverflow: '#F48024',
          hero: '#ffffff',
          heroGlow: 'rgba(255, 255, 255, 0.5)',
        },
        light: {
          bg: '#ffffff',
          ground: '#ffffff',
          groundLine: '#e5e5e7',
          text: '#1d1d1f',
          textSecondary: '#86868b',
          accent: '#0071e3',
          bug: '#ff3b30',
          conflict: '#ffcc00',
          fire: '#ff9500',
          coffee: '#a2845e',
          stackOverflow: '#f48024',
          hero: '#1d1d1f',
          heroGlow: 'rgba(0, 0, 0, 0.2)',
        },
      }),
      (this.colors = this.themes.dark),
      this.updateTheme(),
      this.initStars());
  }
  detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );
  }
  initStars() {
    this.stars = [];
    for (let t = 0; t < 50; t++)
      this.stars.push({
        x: 1200 * Math.random(),
        y: 400 * Math.random(),
        size: 2 * Math.random(),
        opacity: Math.random(),
        speed: 0.5 * Math.random(),
      });
    this.codeSnippets = [];
    const t = ['{ }', '01', '=>', 'git', 'push', 'merge', '++'];
    for (let e = 0; e < 15; e++)
      this.codeSnippets.push({
        x: 1200 * Math.random(),
        y: 300 * Math.random(),
        text: t[Math.floor(Math.random() * t.length)],
        opacity: 0.3 * Math.random(),
        speed: 1 * Math.random() + 0.5,
      });
  }
  init() {
    return (
      (this.canvas = document.createElement('canvas')),
      (this.canvas.id = 'debug-runner-canvas'),
      (this.canvas.width = 1200),
      (this.canvas.height = 400),
      Object.assign(this.canvas.style, {
        background: this.colors.bg,
        display: 'block',
        margin: '0 auto',
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
        touchAction: 'none',
      }),
      (this.ctx = this.canvas.getContext('2d')),
      this.resetHero(),
      this.setupControls(),
      this.setupTouchControls(),
      this.createMobileControls(),
      this.updateTheme(),
      this.setupThemeObserver(),
      this.render(),
      this.drawStartScreen(),
      this.updateSideStats(),
      this.canvas
    );
  }
  updateTheme() {
    const t = document.documentElement.classList.contains('dark');
    ((this.colors = t ? this.themes.dark : this.themes.light),
      this.canvas &&
        ((this.canvas.style.background = this.colors.bg),
        (this.canvas.style.borderColor = this.colors.groundLine)),
      !this.gameRunning &&
        this.ctx &&
        (this.gameOver ? this.drawGameOver() : this.drawStartScreen()));
  }
  setupThemeObserver() {
    new MutationObserver(t => {
      t.forEach(t => {
        'class' === t.attributeName && this.updateTheme();
      });
    }).observe(document.documentElement, { attributes: !0 });
  }
  createMobileControls() {
    const t = document.getElementById('debug-runner-container');
    if (!t || !t.parentElement) return;
    const e = document.createElement('div');
    e.className = 'debug-runner-mobile-controls';
    const s = (t, e, s) => {
        const i = s => {
            (s.cancelable && s.preventDefault(),
              (this.gameRunning && !this.gameOver) || this.start(),
              e(),
              this.vibrate(10),
              (t.style.transform = 'scale(0.95)'));
          },
          h = e => {
            (e.cancelable && e.preventDefault(), s && s(), (t.style.transform = 'scale(1)'));
          };
        (t.addEventListener('touchstart', i, { passive: !1 }),
          t.addEventListener('mousedown', i),
          t.addEventListener('touchend', h, { passive: !1 }),
          t.addEventListener('mouseup', h),
          t.addEventListener('mouseleave', h));
      },
      i = this.createControlButton('↑ JUMP', 'jump');
    s(i, () => this.jump());
    const h = this.createControlButton('↓ DUCK', 'duck');
    (s(
      h,
      () => this.duck(),
      () => this.standUp()
    ),
      e.appendChild(i),
      e.appendChild(h),
      t.parentElement.appendChild(e),
      (this.mobileControls = e));
  }
  createControlButton(t, e) {
    const s = document.createElement('button');
    return (
      (s.className = `debug-game-btn debug-game-btn--${e}`),
      (s.type = 'button'),
      (s.textContent = t),
      s.setAttribute('aria-label', t),
      s
    );
  }
  updateSideStats() {
    const t = Math.floor(this.highScore / 10);
    this.highScoreDisplay &&
      this.lastUiHighScore !== t &&
      ((this.highScoreDisplay.textContent = t), (this.lastUiHighScore = t));
    const e = `${Math.max(1, this.speed / 8).toFixed(1)}x`;
    this.speedDisplay &&
      this.lastUiSpeed !== e &&
      ((this.speedDisplay.textContent = e), (this.lastUiSpeed = e));
  }
  vibrate(t) {
    'vibrate' in navigator && navigator.vibrate(t);
  }
  resetHero() {
    this.dev = {
      x: 100,
      y: this.groundY - 50,
      width: 40,
      height: 50,
      velocityY: 0,
      onGround: !0,
      jumpPower: 16,
      rotation: 0,
    };
  }
  setupControls() {
    const t = t => {
      ['INPUT', 'TEXTAREA', 'SELECT', 'CONTENTEDITABLE'].includes(t.target.tagName) ||
        ('keydown' === t.type
          ? (('Space' !== t.code && 'ArrowUp' !== t.code && 'KeyW' !== t.code) ||
              (t.preventDefault(),
              this.gameRunning || this.gameOver
                ? this.gameOver
                  ? this.start()
                  : this.jump()
                : this.start()),
            ('ArrowDown' !== t.code && 'KeyS' !== t.code) ||
              !this.gameRunning ||
              (t.preventDefault(), this.duck()))
          : 'keyup' === t.type &&
            (('ArrowDown' !== t.code && 'KeyS' !== t.code) || this.standUp()));
    };
    (document.addEventListener('keydown', t),
      document.addEventListener('keyup', t),
      (this.keyHandler = t));
  }
  setupTouchControls() {
    let t = 0,
      e = 0;
    (this.canvas.addEventListener(
      'touchstart',
      s => {
        (s.preventDefault(),
          (t = s.touches[0].clientY),
          (e = s.touches[0].clientX),
          (this.gameRunning && !this.gameOver) || (this.start(), this.vibrate(20)));
      },
      { passive: !1 }
    ),
      this.canvas.addEventListener(
        'touchmove',
        t => {
          t.preventDefault();
        },
        { passive: !1 }
      ),
      this.canvas.addEventListener(
        'touchend',
        s => {
          s.preventDefault();
          const i = s.changedTouches[0].clientY,
            h = s.changedTouches[0].clientX,
            a = i - t,
            o = Math.abs(h - e);
          this.gameRunning &&
            (Math.abs(a) > o
              ? a < -30
                ? (this.jump(), this.vibrate(10))
                : a > 30 && (this.duck(), this.vibrate(10), setTimeout(() => this.standUp(), 500))
              : o < 20 && Math.abs(a) < 20 && (this.jump(), this.vibrate(10)));
        },
        { passive: !1 }
      ));
  }
  start() {
    this.gameRunning ||
      ((this.gameRunning = !0),
      (this.gameOver = !1),
      (this.score = 0),
      (this.speed = 8),
      (this.obstacles = []),
      (this.powerUps = []),
      (this.particles = []),
      this.resetHero(),
      this.updateSideStats(),
      this.gameLoop && clearInterval(this.gameLoop),
      (this.gameLoop = setInterval(() => this.update(), 1e3 / 60)),
      this.vibrate(30),
      console.log('🚀 Game Started'));
  }
  stop() {
    ((this.gameRunning = !1),
      clearInterval(this.gameLoop),
      this.vibrate([50, 100, 50]),
      this.drawGameOver());
  }
  jump() {
    this.dev.onGround &&
      ((this.dev.velocityY = -this.dev.jumpPower),
      (this.dev.onGround = !1),
      this.createParticles(this.dev.x + 20, this.dev.y + 50, 5, '#fff'));
  }
  duck() {
    this.dev.onGround && ((this.dev.height = 25), (this.dev.y = this.groundY - 25));
  }
  standUp() {
    ((this.dev.height = 50), (this.dev.y = this.groundY - 50));
  }
  update() {
    ((this.dev.velocityY += 0.8),
      (this.dev.y += this.dev.velocityY),
      this.dev.y >= this.groundY - this.dev.height &&
        ((this.dev.y = this.groundY - this.dev.height),
        (this.dev.velocityY = 0),
        (this.dev.onGround = !0)),
      (this.speed += 0.001),
      this.score++,
      this.score > this.highScore &&
        ((this.highScore = this.score),
        localStorage.setItem('debugRunnerHighScore', this.highScore)));
    const t = Math.floor(this.score / 1e3) + 1;
    (t > this.level &&
      ((this.level = t),
      (this.speed += 1),
      (this.screenShake = 20),
      this.createParticles(this.canvas.width / 2, this.canvas.height / 2, 30, this.colors.accent),
      (this.showLevelMessageUntil = Date.now() + 2e3)),
      this.updateObstacles(),
      this.updatePowerUps(),
      this.updateParticles(),
      this.updateTrail(),
      this.checkCollisions(),
      this.frame++,
      this.screenShake > 0 && (this.screenShake -= 1),
      this.updateSideStats(),
      this.render());
  }
  updateTrail() {
    this.gameRunning &&
      (this.trail.push({
        x: this.dev.x,
        y: this.dev.y,
        w: this.dev.width,
        h: this.dev.height,
        opacity: 0.5,
      }),
      this.trail.length > 5 && this.trail.shift(),
      this.trail.forEach(t => (t.opacity -= 0.1)));
  }
  updateObstacles() {
    if (Math.random() < 0.015) {
      const t = Math.random();
      let e = { x: 1200, speed: this.speed };
      t < 0.33
        ? ((e.type = 'bug'),
          (e.y = this.groundY - 30),
          (e.width = 30),
          (e.height = 30),
          (e.color = this.colors.bug))
        : t < 0.66
          ? ((e.type = 'conflict'),
            (e.y = this.groundY - 40),
            (e.width = 30),
            (e.height = 40),
            (e.color = this.colors.conflict))
          : ((e.type = 'fire'),
            (e.y = this.groundY - 35),
            (e.width = 35),
            (e.height = 35),
            (e.color = this.colors.fire));
      const s = this.obstacles[this.obstacles.length - 1];
      (!s || 1200 - s.x > 250) && this.obstacles.push(e);
    }
    (this.obstacles.forEach(t => (t.x -= t.speed)),
      (this.obstacles = this.obstacles.filter(t => t.x > -100)));
  }
  updatePowerUps() {
    if (Math.random() < 0.002) {
      const t = Math.random() > 0.5 ? 'coffee' : 'stackoverflow';
      this.powerUps.push({
        x: 1200,
        y: this.groundY - 100 - 50 * Math.random(),
        width: 30,
        height: 30,
        type: t,
        speed: 0.8 * this.speed,
      });
    }
    (this.powerUps.forEach(t => (t.x -= t.speed)),
      (this.powerUps = this.powerUps.filter(t => t.x > -100)),
      this.invincible && Date.now() > this.invincibleUntil && (this.invincible = !1));
  }
  createParticles(t, e, s, i) {
    for (let h = 0; h < s; h++)
      this.particles.push({
        x: t,
        y: e,
        vx: 5 * (Math.random() - 0.5),
        vy: 5 * (Math.random() - 0.5),
        life: 1,
        color: i,
      });
  }
  updateParticles() {
    (this.particles.forEach(t => {
      ((t.x += t.vx), (t.y += t.vy), (t.life -= 0.05));
    }),
      (this.particles = this.particles.filter(t => t.life > 0)));
  }
  checkCollisions() {
    const t = {
      x: this.dev.x + 5,
      y: this.dev.y + 5,
      width: this.dev.width - 10,
      height: this.dev.height - 10,
    };
    if (!this.invincible)
      for (let e of this.obstacles)
        if (this.rectIntersect(t, e))
          return (
            (this.screenShake = 15),
            (this.gameOver = !0),
            this.createParticles(this.dev.x, this.dev.y, 20, this.colors.bug),
            void this.stop()
          );
    for (let e = this.powerUps.length - 1; e >= 0; e--)
      if (this.rectIntersect(t, this.powerUps[e])) {
        const t = this.powerUps[e];
        (this.createParticles(t.x, t.y, 10, this.colors.accent),
          'coffee' === t.type
            ? (this.score += 500)
            : ((this.invincible = !0), (this.invincibleUntil = Date.now() + 5e3)),
          this.vibrate(15),
          this.powerUps.splice(e, 1));
      }
  }
  rectIntersect(t, e) {
    return !(
      e.x > t.x + t.width ||
      e.x + e.width < t.x ||
      e.y > t.y + t.height ||
      e.y + e.height < t.y
    );
  }
  render() {
    if ((this.ctx.save(), this.screenShake > 0)) {
      const t = (Math.random() - 0.5) * this.screenShake,
        e = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(t, e);
    }
    ((this.ctx.fillStyle = this.colors.bg),
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height),
      '#000000' === this.colors.bg &&
        ((this.ctx.fillStyle = '#ffffff'),
        this.stars.forEach(t => {
          ((this.ctx.globalAlpha = t.opacity),
            this.ctx.fillRect(t.x, t.y, t.size, t.size),
            (t.x -= t.speed),
            t.x < 0 && (t.x = 1200));
        }),
        this.codeSnippets.forEach(t => {
          ((this.ctx.fillStyle = this.colors.accent),
            (this.ctx.globalAlpha = t.opacity),
            (this.ctx.font = '14px monospace'),
            this.ctx.fillText(t.text, t.x, t.y),
            (t.x -= t.speed),
            t.x < -100 && (t.x = 1200));
        }),
        (this.ctx.globalAlpha = 1)),
      (this.ctx.fillStyle = this.colors.ground),
      this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY),
      (this.ctx.strokeStyle = this.colors.groundLine),
      (this.ctx.lineWidth = 2),
      this.ctx.beginPath(),
      this.ctx.moveTo(0, this.groundY),
      this.ctx.lineTo(this.canvas.width, this.groundY),
      this.ctx.stroke(),
      this.trail.forEach(t => {
        ((this.ctx.globalAlpha = t.opacity),
          (this.ctx.fillStyle = this.invincible ? '#FFD60A' : this.colors.hero),
          this.ctx.fillRect(t.x, t.y + 20, t.w, t.h - 20));
      }),
      (this.ctx.globalAlpha = 1),
      this.ctx.save(),
      (this.ctx.shadowColor = this.colors.accent),
      (this.ctx.shadowBlur = this.invincible ? 20 : 10),
      (this.ctx.fillStyle = this.invincible ? '#FFD60A' : this.colors.hero));
    const t = this.dev.x,
      e = this.dev.y,
      s = this.dev.width,
      i = this.dev.height,
      h = 10 * Math.sin(0.2 * this.frame);
    (this.ctx.beginPath(),
      this.ctx.arc(t + s / 2, e + 10, 10, 0, 2 * Math.PI),
      this.ctx.fill(),
      this.ctx.fillRect(t, e + 20, s, i - 25),
      this.dev.onGround
        ? (this.ctx.fillRect(t + 5, e + i - 5 + h, 10, 5),
          this.ctx.fillRect(t + s - 15, e + i - 5 - h, 10, 5))
        : (this.ctx.fillRect(t + 5, e + i - 10, 10, 10),
          this.ctx.fillRect(t + s - 15, e + i - 10, 10, 10)),
      (this.ctx.fillStyle = this.colors.bg),
      this.ctx.fillRect(t + s / 2 - 4, e + 8, 2, 2),
      this.ctx.fillRect(t + s / 2 + 2, e + 8, 2, 2),
      this.ctx.restore(),
      this.obstacles.forEach(t => {
        ((this.ctx.fillStyle = t.color),
          (this.ctx.shadowColor = t.color),
          (this.ctx.shadowBlur = 10),
          'bug' === t.type
            ? (this.ctx.beginPath(),
              this.ctx.arc(t.x + t.width / 2, t.y + t.height / 2, t.width / 2, 0, 2 * Math.PI),
              this.ctx.fill())
            : 'conflict' === t.type
              ? (this.ctx.beginPath(),
                this.ctx.moveTo(t.x + t.width / 2, t.y),
                this.ctx.lineTo(t.x + t.width, t.y + t.height),
                this.ctx.lineTo(t.x, t.y + t.height),
                this.ctx.fill())
              : this.ctx.fillRect(t.x, t.y, t.width, t.height),
          (this.ctx.shadowBlur = 0));
      }),
      this.powerUps.forEach(t => {
        ((this.ctx.fillStyle =
          'coffee' === t.type ? this.colors.coffee : this.colors.stackOverflow),
          this.ctx.fillRect(t.x, t.y, t.width, t.height),
          (this.ctx.fillStyle = '#fff'),
          (this.ctx.font = '12px sans-serif'),
          this.ctx.fillText('coffee' === t.type ? '☕' : 'SO', t.x + 4, t.y + 20));
      }),
      this.particles.forEach(t => {
        ((this.ctx.fillStyle = t.color),
          (this.ctx.globalAlpha = t.life),
          this.ctx.fillRect(t.x, t.y, 3, 3));
      }),
      (this.ctx.globalAlpha = 1),
      (this.ctx.fillStyle = this.colors.text),
      (this.ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'),
      this.ctx.fillText(`SCORE: ${Math.floor(this.score / 10)}`, 30, 50),
      (this.ctx.fillStyle = this.colors.textSecondary),
      (this.ctx.font = '20px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'),
      this.ctx.fillText(`HI: ${Math.floor(this.highScore / 10)}`, 30, 80),
      this.invincible &&
        ((this.ctx.fillStyle = '#FFD60A'),
        (this.ctx.font = 'bold 16px -apple-system'),
        this.ctx.fillText('⚡ INVINCIBLE', this.canvas.width - 150, 50)),
      this.showLevelMessageUntil &&
        Date.now() < this.showLevelMessageUntil &&
        (this.ctx.save(),
        (this.ctx.fillStyle = this.colors.accent),
        (this.ctx.font = 'bold 40px -apple-system'),
        (this.ctx.textAlign = 'center'),
        (this.ctx.shadowColor = this.colors.accent),
        (this.ctx.shadowBlur = 15),
        this.ctx.fillText(`LEVEL ${this.level}`, this.canvas.width / 2, 150),
        (this.ctx.font = '20px -apple-system'),
        this.ctx.fillText('SPEED INCREASED!', this.canvas.width / 2, 190),
        this.ctx.restore()),
      this.ctx.restore());
  }
  drawStartScreen() {
    ((this.ctx.fillStyle =
      '#000000' === this.colors.bg ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'),
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height),
      (this.ctx.fillStyle = this.colors.text),
      (this.ctx.font = 'bold 60px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'),
      (this.ctx.textAlign = 'center'),
      this.ctx.fillText('DEBUG RUNNER', this.canvas.width / 2, this.canvas.height / 2 - 30),
      (this.ctx.font = '30px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'),
      (this.ctx.fillStyle = this.colors.accent));
    const t = this.isMobile ? 'Tap to Start' : 'Press Space or Tap to Start';
    (this.ctx.fillText(t, this.canvas.width / 2, this.canvas.height / 2 + 30),
      this.isMobile &&
        ((this.ctx.font = '18px -apple-system'),
        (this.ctx.fillStyle = this.colors.textSecondary),
        this.ctx.fillText(
          'Swipe ↑ to Jump • Swipe ↓ to Duck',
          this.canvas.width / 2,
          this.canvas.height / 2 + 70
        )),
      (this.ctx.textAlign = 'left'));
  }
  drawGameOver() {
    ((this.ctx.fillStyle =
      '#000000' === this.colors.bg ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)'),
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height),
      (this.ctx.fillStyle = this.colors.bug),
      (this.ctx.font = 'bold 70px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'),
      (this.ctx.textAlign = 'center'),
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30),
      (this.ctx.fillStyle = this.colors.text),
      (this.ctx.font = '40px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'),
      this.ctx.fillText(
        `Score: ${Math.floor(this.score / 10)}`,
        this.canvas.width / 2,
        this.canvas.height / 2 + 30
      ),
      (this.ctx.fillStyle = this.colors.textSecondary),
      (this.ctx.font = '24px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'));
    const t = this.isMobile ? 'Tap to Restart' : 'Press Space or Tap to Restart';
    (this.ctx.fillText(t, this.canvas.width / 2, this.canvas.height / 2 + 70),
      (this.ctx.textAlign = 'left'));
  }
}
const initDebugRunner = () => {
  const t = document.getElementById('debug-runner-container');
  if (t) {
    const e = new DebugRunner().init();
    t.appendChild(e);
  }
};
'loading' === document.readyState
  ? document.addEventListener('DOMContentLoaded', initDebugRunner)
  : initDebugRunner();
