/**
 * Debug Runner — Chrome Dino–inspired endless runner (October 2026 Edition)
 * Developer-themed obstacles with Dino-core physics, Web Audio synthesizer,
 * Gamepad API controller support, native Canvas roundRect, prefers-reduced-motion,
 * combo multiplier system, milestone chimes, and advanced cyberpunk visual FX.
 */

class DebugRunner {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.gameRunning = false;
    this.gameOver = false;
    this.paused = false;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('debugRunnerHighScore'), 10) || 0;
    this.baseSpeed = 6.2;
    this.speed = this.baseSpeed;
    this.level = 1;
    this.gameLoop = null;
    this.groundY = 320;
    this.dev = null;
    this.obstacles = [];
    this.powerUps = [];
    this.particles = [];
    this.speedLines = [];
    this.lastScoreIncrement = 0;
    this.invincible = false;
    this.invincibleUntil = 0;
    this.phaseCloak = false;
    this.phaseCloakUntil = 0;
    this.trail = [];
    this.isMobile = this.detectMobile();
    this.mobileControls = null;
    this.frame = 0;
    this.highScoreDisplay = document.getElementById('game-high-score');
    this.speedDisplay = document.getElementById('game-speed');
    this.comboDisplay = document.getElementById('game-combo-display');
    this.boostDisplay = document.getElementById('game-boost-display');
    this.lastUiHighScore = null;
    this.lastUiSpeed = null;
    this.lastUiCombo = null;
    this.lastUiBoost = null;
    this.floatingTexts = [];
    this.nextNoteTime = 0;
    this.noteIndex = 0;
    this.lastFrameTime = 0;
    this.nightMode = false;
    this.screenShake = 0;
    this.showLevelMessageUntil = 0;
    this.gravity = 0.82;
    this.fastFallVelocity = 14;

    // 2026 Combo Multiplier System
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.lastNearMissTime = 0;
    this.comboTimerMs = 3500;

    // Milestone chimes (every 100 display pts)
    this.lastMilestone = 0;
    this.milestoneFlashUntil = 0;

    // Reduced Motion compliance (AGENTS.md design audit)
    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Gamepad API state
    this.hasGamepad = false;
    this.lastGpJump = false;
    this.lastGpDuck = false;
    this.lastGpPause = false;

    // Audio & Sound
    this.audioCtx = null;
    this.muted = false;

    // Lifecycle cleanup
    this.abortController = new AbortController();
    this.touchDuckTimer = null;

    // Cyberpunk Parallax Background Assets
    this.gridOffset = 0;
    this.binaryStreams = [];
    this.neonStars = [];

    // Visual Style System
    this.themes = {
      dark: {
        bg: '#050508',
        ground: '#0c0c14',
        groundLine: '#1a1a2e',
        gridLine: 'rgba(0, 113, 227, 0.25)',
        gridHorizon: 'rgba(94, 92, 230, 0.4)',
        text: '#ffffff',
        textSecondary: '#86868b',
        accent: '#0A84FF',
        bug: '#FF453A',
        conflict: '#FFD60A',
        fire: '#FF9F0A',
        coffee: '#30D158',
        stackOverflow: '#BF5AF2',
        gitStash: '#00E5FF',
        memoryLeak: '#34C759',
        error404: '#FF3B30',
        hero: '#ffffff',
        heroVisor: '#00E5FF',
        heroGlow: 'rgba(10, 132, 255, 0.6)',
      },
      light: {
        bg: '#f5f5f7',
        ground: '#e5e7eb',
        groundLine: '#d1d5db',
        gridLine: 'rgba(0, 113, 227, 0.15)',
        gridHorizon: 'rgba(0, 113, 227, 0.2)',
        text: '#1d1d1f',
        textSecondary: '#6e6e73',
        accent: '#0071e3',
        bug: '#ff3b30',
        conflict: '#ffcc00',
        fire: '#ff9500',
        coffee: '#34c759',
        stackOverflow: '#af52de',
        gitStash: '#0071e3',
        memoryLeak: '#28cd41',
        error404: '#ff3b30',
        hero: '#1d1d1f',
        heroVisor: '#0071e3',
        heroGlow: 'rgba(0, 113, 227, 0.4)',
      },
    };

    this.colors = this.themes.dark;
    this.updateTheme();
    this.initBackgroundElements();
    this.initSpeedLines();
    this.setupA11yMotionListener();
    this.setupGamepadListeners();
  }

  detectMobile() {
    if (typeof window === 'undefined') return false;
    return (
      (window.matchMedia &&
        (window.matchMedia('(pointer: coarse)').matches ||
          window.matchMedia('(max-width: 768px)').matches)) ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent || ''
      )
    );
  }

  setupA11yMotionListener() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      mql.addEventListener(
        'change',
        e => {
          this.reducedMotion = e.matches;
          if (this.reducedMotion) {
            this.screenShake = 0;
            this.particles = [];
            this.speedLines = [];
          }
        },
        { signal: this.abortController.signal }
      );
    } catch {
      // Ignored for older browser support
    }
  }

  setupGamepadListeners() {
    if (typeof window === 'undefined') return;
    const onGpConnect = () => {
      this.hasGamepad = true;
    };
    const onGpDisconnect = () => {
      const remaining = navigator.getGamepads ? navigator.getGamepads() : [];
      this.hasGamepad = Array.from(remaining).some(gp => gp && gp.connected);
    };

    window.addEventListener('gamepadconnected', onGpConnect, {
      signal: this.abortController.signal,
    });
    window.addEventListener('gamepaddisconnected', onGpDisconnect, {
      signal: this.abortController.signal,
    });
  }

  initBackgroundElements() {
    this.neonStars = [];
    for (let i = 0; i < 40; i++) {
      this.neonStars.push({
        x: Math.random() * 1200,
        y: Math.random() * 250,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.4 + 0.1,
      });
    }

    this.binaryStreams = [];
    for (let i = 0; i < 20; i++) {
      this.binaryStreams.push({
        x: i * 60 + Math.random() * 20,
        y: Math.random() * -200,
        speed: Math.random() * 2 + 1,
        chars: Array.from({ length: 8 }, () => (Math.random() > 0.5 ? '1' : '0')),
        opacity: Math.random() * 0.15 + 0.05,
      });
    }
  }

  initSpeedLines() {
    this.speedLines = [];
    for (let i = 0; i < 12; i++) {
      this.speedLines.push({
        x: Math.random() * 1200,
        y: Math.random() * (this.groundY - 60),
        len: Math.random() * 70 + 30,
        speedMultiplier: Math.random() * 0.8 + 1.2,
        opacity: Math.random() * 0.35 + 0.1,
      });
    }
  }

  recordLeaderboardEntry() {
    const entry = { score: Math.floor(this.score / 10), at: Date.now() };
    let board;
    try {
      const raw = localStorage.getItem('debugRunnerLeaderboard');
      board = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(board)) board = [];
    } catch {
      board = [];
    }
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 3);

    try {
      const cloned =
        typeof structuredClone === 'function'
          ? structuredClone(board)
          : JSON.parse(JSON.stringify(board));
      localStorage.setItem('debugRunnerLeaderboard', JSON.stringify(cloned));
    } catch {
      localStorage.setItem('debugRunnerLeaderboard', JSON.stringify(board));
    }
    this.renderLeaderboard(board);
  }

  persistHighScore() {
    const stored = parseInt(localStorage.getItem('debugRunnerHighScore'), 10) || 0;
    if (this.highScore > stored) {
      localStorage.setItem('debugRunnerHighScore', String(Math.floor(this.highScore)));
    }
  }

  renderLeaderboard(board = null) {
    if (!board) {
      try {
        const raw = localStorage.getItem('debugRunnerLeaderboard');
        board = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(board)) board = [];
      } catch {
        board = [];
      }
    }

    const body = document.getElementById('game-leaderboard-body');
    if (!body) return;

    const topThree = board.slice(0, 3);

    if (!topThree.length) {
      body.innerHTML = '<p class="game-leaderboard-empty">No runs yet</p>';
      return;
    }

    const rankLabels = ['🥇', '🥈', '🥉'];
    body.innerHTML = `<ol class="game-leaderboard-list">${topThree
      .map(
        (entry, index) =>
          `<li><span class="game-leaderboard-rank" aria-hidden="true">${rankLabels[index] || `${index + 1}.`}</span><span class="game-leaderboard-score">${entry.score}</span></li>`
      )
      .join('')}</ol>`;
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'debug-runner-canvas';
    this.canvas.width = 1200;
    this.canvas.height = 400;
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute(
      'aria-label',
      'Debug Runner (2026). Focus the canvas first. Space or Up to jump, Down to duck or fast-fall, P to pause.'
    );

    Object.assign(this.canvas.style, {
      background: this.colors.bg,
      display: 'block',
      margin: '0 auto',
      width: '100%',
      maxWidth: '100%',
      height: 'auto',
      touchAction: 'none',
    });

    this.ctx = this.canvas.getContext('2d');

    this.resetHero();
    this.setupControls();
    this.setupTouchControls();
    this.createMobileControls();

    // Click handler for sound toggle and start triggers
    this.canvas.addEventListener(
      'click',
      e => {
        this.canvas.focus();
        const rect = this.canvas.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
        const clickY = ((e.clientY - rect.top) / rect.height) * this.canvas.height;

        // Audio toggle button area (top right)
        if (clickX >= 1130 && clickX <= 1180 && clickY >= 15 && clickY <= 65) {
          this.muted = !this.muted;
          this.vibrate(12);
          if (!this.muted && this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
          }
          this.playSound('powerup');
          if (!this.gameRunning && this.ctx) this.render();
          return;
        }

        if (!this.gameRunning || this.gameOver) {
          this.start();
        }
      },
      { signal: this.abortController.signal }
    );

    this.updateTheme();
    this.setupThemeObserver();
    this.render();
    this.drawStartScreen();
    this.updateSideStats();

    this.renderLeaderboard();
    return this.canvas;
  }

  playSound(type, extraPitchScale = 1.0) {
    if (this.muted) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new window.AudioContext();
      }
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'jump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.14);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.setValueAtTime(370, now + 0.08);
        osc.frequency.setValueAtTime(550, now + 0.16);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.24);
      } else if (type === 'stash') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.22);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.6);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'levelup') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(800, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === 'milestone') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1320, now + 0.07);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'nearmiss') {
        const baseFreq = 600 * extraPitchScale;
        const targetFreq = 1200 * extraPitchScale;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.1);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {
      // Procedural audio safety fallback
    }
  }

  createFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x: x,
      y: y,
      vy: this.reducedMotion ? -0.8 : -1.5,
      text: text,
      color: color,
      life: 1.0,
    });
  }

  playBackgroundMusic() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new window.AudioContext();
      }
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') return;

      const now = ctx.currentTime;
      if (!this.nextNoteTime || this.nextNoteTime < now) {
        this.nextNoteTime = now;
      }

      if (now >= this.nextNoteTime - 0.05) {
        const bassNotes = [110, 110, 130, 130, 98, 98, 87, 87];
        const freq = bassNotes[this.noteIndex % bassNotes.length];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.nextNoteTime);

        if (ctx.createBiquadFilter) {
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(320, this.nextNoteTime);
          osc.disconnect(gain);
          osc.connect(filter);
          filter.connect(gain);
        }

        const tempo = Math.max(0.24, 0.42 - this.speed * 0.012);
        const rampEnd = Math.max(this.nextNoteTime + 0.04, this.nextNoteTime + tempo - 0.02);

        gain.gain.setValueAtTime(0, this.nextNoteTime);
        gain.gain.linearRampToValueAtTime(0.028, this.nextNoteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, rampEnd);

        osc.start(this.nextNoteTime);
        osc.stop(this.nextNoteTime + tempo);

        this.nextNoteTime += tempo;
        this.noteIndex++;
      }
    } catch {
      // Audio synth silent fail
    }
  }

  updateTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    this.colors = isDark ? this.themes.dark : this.themes.light;

    if (this.canvas) {
      Object.assign(this.canvas.style, {
        background: this.colors.bg,
        borderColor: this.colors.groundLine,
      });
    }

    if (!this.gameRunning && this.ctx) {
      if (this.gameOver) {
        this.drawGameOver();
      } else if (this.paused) {
        this.render();
        this.drawPauseOverlay();
      } else {
        this.drawStartScreen();
      }
    }
  }

  getActivePalette() {
    if (!this.nightMode) return this.colors;
    const isSiteDark = this.colors.bg === '#050508';
    if (isSiteDark) {
      return {
        ...this.colors,
        bg: '#f5f5f7',
        text: '#1d1d1f',
        textSecondary: '#6e6e73',
        groundLine: '#d1d5db',
        hero: '#1d1d1f',
      };
    }
    return {
      ...this.colors,
      bg: '#050508',
      text: '#ffffff',
      textSecondary: '#86868b',
      groundLine: '#1a1a2e',
      hero: '#ffffff',
    };
  }

  setupThemeObserver() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          this.updateTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
    });
  }

  createMobileControls() {
    const container = document.getElementById('debug-runner-container');
    if (!container || !container.parentElement) return;

    const existing = document.querySelector('#debug-runner-section .debug-runner-mobile-controls');
    if (existing) {
      existing.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'debug-runner-mobile-controls';

    const bindAction = (btn, action, endAction) => {
      btn.style.touchAction = 'none';
      btn.style.userSelect = 'none';
      const start = () => {
        if (!this.gameRunning || this.gameOver) {
          this.start();
        }
        action();
        this.vibrate(15);
        btn.style.transform = 'scale(0.92)';
      };

      const end = () => {
        if (endAction) endAction();
        btn.style.transform = 'scale(1)';
      };

      btn.addEventListener('touchstart', start, {
        passive: true,
        signal: this.abortController.signal,
      });
      btn.addEventListener('mousedown', start, {
        passive: true,
        signal: this.abortController.signal,
      });
      btn.addEventListener('touchend', end, {
        passive: true,
        signal: this.abortController.signal,
      });
      btn.addEventListener('mouseup', end, {
        passive: true,
        signal: this.abortController.signal,
      });
      btn.addEventListener('mouseleave', end, {
        passive: true,
        signal: this.abortController.signal,
      });
    };

    const jumpBtn = this.createControlButton('JUMP', 'jump');
    bindAction(jumpBtn, () => this.jump());

    const duckBtn = this.createControlButton('DUCK', 'duck');
    bindAction(
      duckBtn,
      () => this.duck(),
      () => this.standUp()
    );

    wrapper.appendChild(jumpBtn);
    wrapper.appendChild(duckBtn);

    const slot = document.getElementById('debug-runner-mobile-controls-slot');
    if (slot) {
      slot.hidden = false;
      slot.replaceChildren(wrapper);
    } else {
      const statsPanel = container.closest('.game-area')?.querySelector('.game-stats-panel');
      if (statsPanel) {
        statsPanel.insertAdjacentElement('afterend', wrapper);
      } else {
        const gameArea = container.closest('.game-area');
        (gameArea || container.parentElement)?.appendChild(wrapper);
      }
    }
    this.mobileControls = wrapper;
  }

  createControlButton(text, type) {
    const btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.className = `debug-game-btn debug-game-btn--${type}`;

    const icon = document.createElement('i');
    icon.className = type === 'jump' ? 'fas fa-chevron-up' : 'fas fa-chevron-down';

    const label = document.createElement('span');
    label.textContent = text;

    btn.appendChild(icon);
    btn.appendChild(label);
    btn.setAttribute('aria-label', text);

    return btn;
  }

  updateSideStats() {
    const highScoreValue = Math.floor(this.highScore / 10);
    if (this.highScoreDisplay && this.lastUiHighScore !== highScoreValue) {
      this.highScoreDisplay.textContent = highScoreValue;
      this.lastUiHighScore = highScoreValue;
    }

    const speedMultiplier = Math.max(1, this.speed / this.baseSpeed);
    const speedLabel = `${speedMultiplier.toFixed(1)}x`;
    if (this.speedDisplay && this.lastUiSpeed !== speedLabel) {
      this.speedDisplay.textContent = speedLabel;
      this.lastUiSpeed = speedLabel;
    }

    const comboLabel = this.comboMultiplier > 1 ? `${this.comboMultiplier}x` : '1x';
    if (this.comboDisplay && this.lastUiCombo !== comboLabel) {
      this.comboDisplay.textContent = comboLabel;
      this.comboDisplay.style.color =
        this.comboMultiplier >= 3 ? '#ff9500' : this.comboMultiplier > 1 ? '#0071e3' : '';
      this.lastUiCombo = comboLabel;
    }

    const boostLabel = this.phaseCloak ? '⚡ Stash' : this.invincible ? '🛡️ Shield' : 'None';
    if (this.boostDisplay && this.lastUiBoost !== boostLabel) {
      this.boostDisplay.textContent = boostLabel;
      this.boostDisplay.style.color = this.phaseCloak
        ? '#00e5ff'
        : this.invincible
          ? '#ffd60a'
          : '';
      this.lastUiBoost = boostLabel;
    }
  }

  vibrate(duration) {
    if ('vibrate' in navigator && !this.reducedMotion) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Silently catch unsupported vibration
      }
    }
  }

  resetHero() {
    this.dev = {
      x: 120,
      y: this.groundY - 56,
      width: 44,
      height: 56,
      velocityY: 0,
      onGround: true,
      jumpPower: 17,
      rotation: 0,
      isDucking: false,
    };
  }

  setupControls() {
    const handleInput = e => {
      if (['INPUT', 'TEXTAREA', 'SELECT', 'CONTENTEDITABLE'].includes(e.target.tagName)) return;

      if (document.activeElement !== this.canvas) return;

      if (e.type === 'keydown') {
        if (e.code === 'KeyP' || e.code === 'Escape') {
          e.preventDefault();
          if (!this.gameRunning || this.gameOver) return;
          if (this.paused) this.resume();
          else this.pause();
          return;
        }

        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          if (!this.gameRunning || this.gameOver) {
            this.start();
          } else if (this.paused) {
            this.resume();
          } else {
            this.jump();
          }
        }
        if ((e.code === 'ArrowDown' || e.code === 'KeyS') && this.gameRunning && !this.paused) {
          e.preventDefault();
          this.duck();
        }
      } else if (e.type === 'keyup') {
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          this.standUp();
        }
      }
    };

    document.addEventListener('keydown', handleInput, { signal: this.abortController.signal });
    document.addEventListener('keyup', handleInput, { signal: this.abortController.signal });
    this.keyHandler = handleInput;
  }

  setupTouchControls() {
    let touchStartY = 0;
    let touchStartX = 0;

    this.canvas.addEventListener(
      'touchstart',
      e => {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;

        if (!this.gameRunning || this.gameOver) {
          this.start();
          this.vibrate(25);
        }
      },
      { passive: true, signal: this.abortController.signal }
    );

    this.canvas.addEventListener(
      'touchend',
      e => {
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const diffY = touchEndY - touchStartY;
        const diffX = Math.abs(touchEndX - touchStartX);

        if (this.gameRunning) {
          if (Math.abs(diffY) > diffX) {
            if (diffY < -25) {
              this.jump();
              this.vibrate(12);
            } else if (diffY > 25) {
              this.duck();
              this.vibrate(12);
              if (this.touchDuckTimer) clearTimeout(this.touchDuckTimer);
              this.touchDuckTimer = setTimeout(() => this.standUp(), 420);
            }
          } else if (diffX < 15 && Math.abs(diffY) < 15) {
            this.jump();
            this.vibrate(12);
          }
        }
      },
      { passive: true, signal: this.abortController.signal }
    );
  }

  pollGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp || !gp.connected) continue;
      this.hasGamepad = true;

      // Button 0 (A), Button 12 (D-pad Up)
      const jumpPressed =
        (gp.buttons[0] && gp.buttons[0].pressed) || (gp.buttons[12] && gp.buttons[12].pressed);
      // Button 1 (B), Button 13 (D-pad Down)
      const duckPressed =
        (gp.buttons[1] && gp.buttons[1].pressed) || (gp.buttons[13] && gp.buttons[13].pressed);
      // Button 9 (Start / Options), Button 8 (Select / Share)
      const pausePressed =
        (gp.buttons[9] && gp.buttons[9].pressed) || (gp.buttons[8] && gp.buttons[8].pressed);

      if (pausePressed && !this.lastGpPause) {
        if (!this.gameRunning || this.gameOver) {
          this.start();
        } else if (this.paused) {
          this.resume();
        } else {
          this.pause();
        }
      }
      this.lastGpPause = pausePressed;

      if (jumpPressed) {
        if (!this.gameRunning || this.gameOver) {
          this.start();
        } else if (this.paused) {
          this.resume();
        } else if (!this.lastGpJump) {
          this.jump();
        }
      }
      this.lastGpJump = jumpPressed;

      if (duckPressed) {
        if (this.gameRunning && !this.paused) {
          this.duck();
        }
      } else if (this.lastGpDuck && !duckPressed) {
        this.standUp();
      }
      this.lastGpDuck = duckPressed;
      break;
    }
  }

  start() {
    if (this.gameRunning && !this.gameOver) return;

    this.gameRunning = true;
    this.gameOver = false;
    this.paused = false;
    this.score = 0;
    this.speed = this.baseSpeed;
    this.level = 1;
    this.obstacles = [];
    this.powerUps = [];
    this.particles = [];
    this.floatingTexts = [];
    this.nextNoteTime = 0;
    this.noteIndex = 0;
    this.lastFrameTime = 0;
    this.nightMode = false;
    this.screenShake = 0;
    this.showLevelMessageUntil = 0;
    this.invincible = false;
    this.invincibleUntil = 0;
    this.phaseCloak = false;
    this.phaseCloakUntil = 0;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.lastNearMissTime = 0;
    this.lastMilestone = 0;
    this.milestoneFlashUntil = 0;
    this.trail = [];
    this.resetHero();
    this.updateSideStats();
    this.playSound('powerup');

    if (this.touchDuckTimer) {
      clearTimeout(this.touchDuckTimer);
      this.touchDuckTimer = null;
    }

    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }

    const loop = now => {
      if (!this.gameRunning || this.paused) return;
      this.update(now);
      this.gameLoop = requestAnimationFrame(loop);
    };
    this.gameLoop = requestAnimationFrame(loop);

    this.vibrate(30);
  }

  stop() {
    this.gameRunning = false;
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }
    if (this.touchDuckTimer) {
      clearTimeout(this.touchDuckTimer);
      this.touchDuckTimer = null;
    }
    this.playSound('gameover');
    this.vibrate([60, 120, 60]);
    this.drawGameOver();
  }

  pause() {
    if (!this.gameRunning || this.gameOver || this.paused) return;
    this.paused = true;
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }
    this.lastFrameTime = 0;
    this.render();
    this.drawPauseOverlay();
  }

  resume() {
    if (!this.gameRunning || !this.paused || this.gameOver) return;
    this.paused = false;
    this.lastFrameTime = 0;

    if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
    const loop = now => {
      if (!this.gameRunning || this.paused) return;
      this.update(now);
      this.gameLoop = requestAnimationFrame(loop);
    };
    this.gameLoop = requestAnimationFrame(loop);
  }

  jump() {
    if (this.paused || this.gameOver) return;

    if (this.dev.isDucking && this.dev.onGround) {
      this.standUp();
    }

    if (this.dev.onGround) {
      this.dev.velocityY = -this.dev.jumpPower;
      this.dev.onGround = false;
      this.playSound('jump');
      this.createParticles(this.dev.x + 10, this.groundY, 8, 'rgba(0, 113, 227, 0.4)');
    }
  }

  duck() {
    if (this.paused || this.gameOver || !this.gameRunning) return;

    if (!this.dev.onGround) {
      if (this.dev.velocityY < this.fastFallVelocity) {
        this.dev.velocityY = this.fastFallVelocity;
      }
      this.dev.isDucking = true;
      this.dev.height = 30;
      return;
    }

    this.dev.isDucking = true;
    this.dev.height = 30;
    this.dev.y = this.groundY - 30;
    this.createParticles(this.dev.x + 20, this.groundY, 3, this.colors.accent);
  }

  standUp() {
    const wasDucking = this.dev.isDucking;
    this.dev.isDucking = false;
    this.dev.height = 56;
    if (this.dev.onGround) {
      this.dev.y = this.groundY - 56;
    } else if (wasDucking) {
      this.dev.y = Math.min(this.dev.y, this.groundY - 56);
    }
  }

  update(now = performance.now()) {
    const dt = this.lastFrameTime ? Math.min(0.05, (now - this.lastFrameTime) / 1000) : 1 / 60;
    this.lastFrameTime = now;
    const frameScale = dt * 60;

    this.pollGamepad();

    // Background music loop
    if (this.gameRunning && !this.paused && !this.muted) {
      this.playBackgroundMusic();
    }

    // Gravity & physics
    this.dev.velocityY += this.gravity * frameScale;
    this.dev.y += this.dev.velocityY * frameScale;

    // Ground check
    if (this.dev.y >= this.groundY - this.dev.height) {
      this.dev.y = this.groundY - this.dev.height;
      this.dev.velocityY = 0;
      this.dev.onGround = true;
      if (this.dev.isDucking) {
        this.dev.height = 30;
        this.dev.y = this.groundY - 30;
      }
    } else {
      this.dev.onGround = false;
    }

    // Spin during jump (skipped in reduced-motion)
    if (!this.dev.onGround && !this.dev.isDucking && !this.reducedMotion) {
      this.dev.rotation += 0.08 * frameScale;
    } else {
      this.dev.rotation = 0;
    }

    // Sparks while sliding (ducking)
    if (this.dev.isDucking && this.dev.onGround && this.frame % 3 === 0) {
      this.createParticles(this.dev.x + 10, this.groundY, 2, '#FFD60A');
    }

    // Speed progression (gentle, steady arcade acceleration)
    this.speed += 0.0003 * frameScale;

    // Distance tracking
    this.score += this.speed * 0.22 * frameScale;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    // Milestone chimes every 100 display points
    const currentMilestone = Math.floor(this.score / 1000);
    if (currentMilestone > this.lastMilestone) {
      this.lastMilestone = currentMilestone;
      this.playSound('milestone');
      this.milestoneFlashUntil = Date.now() + 600;
      this.createFloatingText(
        this.dev.x + 20,
        this.dev.y - 20,
        `★ ${currentMilestone * 100} PTS!`,
        '#FFD60A'
      );
    }

    // Combo timer decay
    if (this.comboCount > 0 && Date.now() - this.lastNearMissTime > this.comboTimerMs) {
      this.comboCount = 0;
      this.comboMultiplier = 1;
    }

    // Night cycle every ~700 display points
    const displayScore = Math.floor(this.score / 10);
    const nightCycle = Math.floor(displayScore / 700);
    this.nightMode = nightCycle % 2 === 1;

    // Level up logic (natural progression every 2200 points, capped at 12.0)
    const newLevel = Math.floor(this.score / 2200) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.speed = Math.min(12.0, this.speed + 0.35);
      this.screenShake = this.reducedMotion ? 0 : 16;
      this.playSound('levelup');
      this.createParticles(this.canvas.width / 2, this.canvas.height / 2, 35, this.colors.accent);
      this.showLevelMessageUntil = Date.now() + 2000;
    }

    // Move grid offsets
    this.gridOffset = (this.gridOffset - this.speed * frameScale) % 80;

    // Update speed lines when moving fast
    if (this.speed >= 12 && !this.reducedMotion) {
      this.speedLines.forEach(line => {
        line.x -= this.speed * line.speedMultiplier * frameScale;
        if (line.x + line.len < 0) {
          line.x = 1200 + Math.random() * 200;
          line.y = Math.random() * (this.groundY - 60);
          line.len = Math.random() * 80 + 40;
        }
      });
    }

    this.updateObstacles(frameScale);
    this.updatePowerUps(frameScale);
    this.updateParticles(frameScale);

    // Update floating texts
    this.floatingTexts.forEach(ft => {
      ft.y += ft.vy * frameScale;
      ft.life -= 0.02 * frameScale;
    });
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

    this.updateTrail();
    this.checkCollisions();

    this.frame++;
    if (this.screenShake > 0) this.screenShake -= 1;

    this.updateSideStats();
    this.render();
  }

  updateTrail() {
    if (this.gameRunning) {
      this.trail.push({
        x: this.dev.x,
        y: this.dev.y,
        w: this.dev.width,
        h: this.dev.height,
        opacity: 0.45,
        phase: this.phaseCloak,
      });
      if (this.trail.length > 7) this.trail.shift();
      this.trail.forEach(t => (t.opacity -= 0.07));
    }
  }

  updateObstacles(frameScale = 1) {
    const spawnRate = 0.01 + Math.min(0.008, this.level * 0.001);
    if (Math.random() < Math.min(0.025, spawnRate * frameScale)) {
      const displayScore = Math.floor(this.score / 10);
      const type = Math.random();
      const obstacle = { x: 1250, speed: this.speed };

      const flyersUnlocked = displayScore >= 200;
      const memoryLeakUnlocked = displayScore >= 60;
      const error404Unlocked = displayScore >= 130;

      if (flyersUnlocked && type > 0.8) {
        const band = Math.floor(Math.random() * 2);
        obstacle.type = 'pointer';
        obstacle.band = band;
        obstacle.width = 44;
        obstacle.height = 26;
        obstacle.color = '#BF5AF2';
        obstacle.y = band === 0 ? this.groundY - 76 : this.groundY - 44;
      } else if (error404Unlocked && type > 0.65) {
        // 404 Cyber Portal Obstacle
        obstacle.type = 'error404';
        obstacle.y = this.groundY - 48;
        obstacle.width = 36;
        obstacle.height = 48;
        obstacle.color = this.colors.error404;
      } else if (memoryLeakUnlocked && type > 0.48) {
        // Pulsing Memory Leak Slime Obstacle
        obstacle.type = 'memoryLeak';
        obstacle.y = this.groundY - 34;
        obstacle.width = 40;
        obstacle.height = 34;
        obstacle.color = this.colors.memoryLeak;
        obstacle.seed = Math.random() * 100;
      } else if (type < 0.22) {
        obstacle.type = 'bug';
        obstacle.y = this.groundY - 32;
        obstacle.width = 32;
        obstacle.height = 32;
        obstacle.color = this.colors.bug;
      } else if (type < 0.45) {
        obstacle.type = 'conflict';
        obstacle.y = this.groundY - 46;
        obstacle.width = 34;
        obstacle.height = 46;
        obstacle.color = this.colors.conflict;
      } else {
        obstacle.type = 'fire';
        obstacle.y = this.groundY - 36;
        obstacle.width = 36;
        obstacle.height = 36;
        obstacle.color = this.colors.fire;
      }

      const minGap = Math.max(340, 270 + this.speed * 12);
      const lastObs = this.obstacles[this.obstacles.length - 1];
      if (!lastObs || 1200 - lastObs.x > minGap) {
        this.obstacles.push(obstacle);
      }
    }

    this.obstacles.forEach(obs => {
      obs.x -= obs.speed * frameScale;
    });
    this.obstacles = this.obstacles.filter(obs => obs.x > -100);
  }

  updatePowerUps(frameScale = 1) {
    if (Math.random() < 0.0035 * frameScale) {
      const roll = Math.random();
      let type = 'coffee';
      if (roll > 0.65) {
        type = 'gitStash';
      } else if (roll > 0.35) {
        type = 'stackoverflow';
      }

      this.powerUps.push({
        x: 1250,
        y: this.groundY - 90 - Math.random() * 70,
        width: 32,
        height: 32,
        type: type,
        speed: this.speed * 0.85,
      });
    }

    this.powerUps.forEach(p => {
      p.x -= p.speed * frameScale;
    });
    this.powerUps = this.powerUps.filter(p => p.x > -100);

    const now = Date.now();
    if (this.invincible && now > this.invincibleUntil) {
      this.invincible = false;
    }
    if (this.phaseCloak && now > this.phaseCloakUntil) {
      this.phaseCloak = false;
    }
  }

  createParticles(x, y, count, color) {
    if (this.reducedMotion) return;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - (y === this.groundY ? 2 : 0),
        life: 1.0,
        size: Math.random() * 3 + 1.5,
        color: color,
      });
    }
  }

  updateParticles(frameScale = 1) {
    this.particles.forEach(p => {
      p.x += p.vx * frameScale;
      p.y += p.vy * frameScale;
      p.life -= 0.045 * frameScale;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  checkCollisions() {
    const heroRect = {
      x: this.dev.x + 6,
      y: this.dev.y + 6,
      width: this.dev.width - 12,
      height: this.dev.height - 12,
    };

    // Damage immunity applies if either Shield or Quantum Phase Cloak is active
    const isImmune = this.invincible || this.phaseCloak;

    if (!isImmune) {
      for (const obs of this.obstacles) {
        if (this.rectIntersect(heroRect, obs)) {
          this.screenShake = this.reducedMotion ? 0 : 22;
          this.gameOver = true;
          this.createParticles(this.dev.x + 20, this.dev.y + 20, 35, this.colors.bug);
          this.stop();
          this.persistHighScore();
          this.recordLeaderboardEntry();
          return;
        }
      }
    }

    // Near miss detection & Combo chaining
    if (!isImmune) {
      for (const obs of this.obstacles) {
        if (
          !obs.nearMissChecked &&
          obs.x < this.dev.x + this.dev.width &&
          obs.x + obs.width > this.dev.x
        ) {
          obs.nearMissChecked = true;
          const distY = Math.abs(this.dev.y + this.dev.height / 2 - (obs.y + obs.height / 2));
          if (distY > 15 && distY < 85) {
            this.comboCount++;
            this.lastNearMissTime = Date.now();
            if (this.comboCount >= 6) {
              this.comboMultiplier = 5;
            } else if (this.comboCount >= 4) {
              this.comboMultiplier = 3;
            } else if (this.comboCount >= 2) {
              this.comboMultiplier = 2;
            } else {
              this.comboMultiplier = 1;
            }

            const pointsAwarded = 200 * this.comboMultiplier;
            this.score += pointsAwarded;

            const pitchScale = Math.min(1.8, 1.0 + (this.comboCount - 1) * 0.15);
            this.playSound('nearmiss', pitchScale);

            const comboTag =
              this.comboMultiplier > 1
                ? ` (+${pointsAwarded} · ${this.comboMultiplier}x COMBO!)`
                : `+${pointsAwarded} NEAR MISS!`;
            this.createFloatingText(
              obs.x + obs.width / 2,
              obs.y - 12,
              comboTag,
              this.comboMultiplier >= 3 ? '#FFD60A' : '#00E5FF'
            );
            this.createParticles(obs.x + obs.width / 2, obs.y, 6, '#00E5FF');
          }
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      if (this.rectIntersect(heroRect, this.powerUps[i])) {
        const p = this.powerUps[i];
        this.vibrate(20);

        if (p.type === 'coffee') {
          this.playSound('powerup');
          this.score += 600;
          this.createFloatingText(p.x, p.y - 10, '+600 COFFEE TURBO!', this.colors.coffee);
          this.createParticles(p.x + 16, p.y + 16, 18, this.colors.coffee);
        } else if (p.type === 'gitStash') {
          this.playSound('stash');
          this.phaseCloak = true;
          this.phaseCloakUntil = Date.now() + 3500;
          this.score += 400;
          this.createFloatingText(p.x, p.y - 10, '⚡ GIT STASH PHASE!', this.colors.gitStash);
          this.createParticles(p.x + 16, p.y + 16, 24, this.colors.gitStash);
        } else {
          this.playSound('powerup');
          this.invincible = true;
          this.invincibleUntil = Date.now() + 6000;
          this.createFloatingText(
            p.x,
            p.y - 10,
            '🛡️ TEST SUITE SHIELD!',
            this.colors.stackOverflow
          );
          this.createParticles(p.x + 16, p.y + 16, 24, this.colors.stackOverflow);
        }
        this.powerUps.splice(i, 1);
      }
    }
  }

  rectIntersect(r1, r2) {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }

  drawRoundRect(ctx, x, y, width, height, radius) {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
  }

  render() {
    this.ctx.save();

    // 1. Screen Shake Effect
    if (this.screenShake > 0 && !this.reducedMotion) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(dx, dy);
    }

    const palette = this.getActivePalette();

    // 2. Parallax Cyberpunk Background Gradient
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
    if (palette.bg === '#050508' || this.nightMode) {
      bgGrad.addColorStop(0, this.nightMode ? '#0a0a12' : '#04020a');
      bgGrad.addColorStop(1, this.nightMode ? '#14102a' : '#0e0b24');
    } else {
      bgGrad.addColorStop(0, '#f5f5f7');
      bgGrad.addColorStop(1, '#e5e7eb');
    }
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 3. Cyber Starfield Nodes
    this.ctx.fillStyle = palette.text;
    this.neonStars.forEach(star => {
      this.ctx.globalAlpha = star.opacity * (this.nightMode ? 1 : 0.85);
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
      if (!this.reducedMotion) {
        star.x -= star.speed * (this.speed * 0.15);
        if (star.x < 0) star.x = 1200;
      }
    });

    // 4. Warp Speed Lines (hyperspeed >= 12)
    if (this.speed >= 12 && !this.reducedMotion) {
      this.ctx.save();
      this.speedLines.forEach(line => {
        this.ctx.strokeStyle = palette.accent;
        this.ctx.globalAlpha = line.opacity;
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.moveTo(line.x, line.y);
        this.ctx.lineTo(line.x + line.len, line.y);
        this.ctx.stroke();
      });
      this.ctx.restore();
    }

    // 5. Parallax Scrolling Binary Stream
    if (!this.reducedMotion) {
      this.binaryStreams.forEach(stream => {
        this.ctx.fillStyle = palette.accent;
        this.ctx.globalAlpha = stream.opacity * (this.nightMode ? 1.4 : 1);
        this.ctx.font = '12px monospace';
        stream.chars.forEach((char, idx) => {
          this.ctx.fillText(char, stream.x, stream.y + idx * 16);
        });
        stream.y += stream.speed * (this.speed * 0.2);
        if (stream.y > this.groundY) {
          stream.y = Math.random() * -200;
          stream.x = Math.random() * 1200;
        }
      });
    }
    this.ctx.globalAlpha = 1.0;

    // 6. Vector Grid Horizon Line
    const horizonGrad = this.ctx.createLinearGradient(0, this.groundY - 60, 0, this.groundY);
    horizonGrad.addColorStop(0, 'rgba(10, 132, 255, 0)');
    horizonGrad.addColorStop(1, this.colors.gridHorizon);
    this.ctx.fillStyle = horizonGrad;
    this.ctx.fillRect(0, this.groundY - 60, this.canvas.width, 60);

    // 7. Perspective Neon Grid Floor
    this.ctx.strokeStyle = this.colors.gridLine;
    this.ctx.lineWidth = 1.5;

    const floorHeight = this.canvas.height - this.groundY;
    for (let yOffset = 0; yOffset < floorHeight; yOffset += 20) {
      const currentY = this.groundY + yOffset;
      this.ctx.beginPath();
      this.ctx.moveTo(0, currentY);
      this.ctx.lineTo(this.canvas.width, currentY);
      this.ctx.stroke();
    }

    const horizonX = this.canvas.width / 2;
    const gridLinesCount = 30;
    for (let i = -gridLinesCount; i <= gridLinesCount; i++) {
      const spacing = 45;
      const xStart = horizonX + i * spacing;
      const xEnd = horizonX + i * spacing * 4.5;
      this.ctx.beginPath();
      this.ctx.moveTo(xStart, this.groundY);
      this.ctx.lineTo(xEnd, this.canvas.height);
      this.ctx.stroke();
    }

    // Dynamic ground terrain markers that scroll with speed
    this.ctx.save();
    this.ctx.fillStyle = palette.accent;
    this.ctx.globalAlpha = 0.4;
    for (let mx = this.gridOffset; mx < this.canvas.width; mx += 80) {
      if (mx >= 0) {
        this.ctx.fillRect(mx, this.groundY - 1, 14, 2);
      }
    }
    this.ctx.restore();

    // Ground Edge line
    this.ctx.strokeStyle = palette.accent;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY);
    this.ctx.lineTo(this.canvas.width, this.groundY);
    this.ctx.stroke();

    if (this.nightMode) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.groundY);
    }

    // 8. Render Particles
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1.0;

    // 9. Render PowerUps
    this.powerUps.forEach(p => {
      this.ctx.save();
      const pColor =
        p.type === 'coffee'
          ? this.colors.coffee
          : p.type === 'gitStash'
            ? this.colors.gitStash
            : this.colors.stackOverflow;

      this.ctx.shadowColor = pColor;
      this.ctx.shadowBlur = 12;

      const bounce = Math.sin(this.frame * 0.12) * 5;
      this.ctx.fillStyle =
        p.type === 'coffee'
          ? 'rgba(48, 209, 88, 0.2)'
          : p.type === 'gitStash'
            ? 'rgba(0, 229, 255, 0.2)'
            : 'rgba(191, 90, 242, 0.2)';

      this.ctx.strokeStyle = pColor;
      this.ctx.lineWidth = 2;
      this.drawRoundRect(this.ctx, p.x, p.y + bounce, p.width, p.height, 8);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      const label = p.type === 'coffee' ? '☕' : p.type === 'gitStash' ? '⚡' : 'SO';
      this.ctx.fillText(label, p.x + 16, p.y + bounce + 20);
      this.ctx.restore();
    });

    // 10. Render Obstacles
    this.obstacles.forEach(obs => {
      this.ctx.save();
      this.ctx.shadowColor = obs.color;
      this.ctx.shadowBlur = 10;

      if (obs.type === 'bug') {
        const bugX = obs.x + obs.width / 2;
        const bugY = obs.y + obs.height / 2;

        this.ctx.strokeStyle = obs.color;
        this.ctx.lineWidth = 2;
        const legSwing = Math.sin(this.frame * 0.3) * 6;
        for (let j = -1; j <= 1; j++) {
          this.ctx.beginPath();
          this.ctx.moveTo(bugX - 8, bugY + j * 6);
          this.ctx.lineTo(bugX - 18, bugY + j * 6 + legSwing);
          this.ctx.stroke();

          this.ctx.beginPath();
          this.ctx.moveTo(bugX + 8, bugY + j * 6);
          this.ctx.lineTo(bugX + 18, bugY + j * 6 - legSwing);
          this.ctx.stroke();
        }

        this.ctx.fillStyle = obs.color;
        this.ctx.beginPath();
        this.ctx.ellipse(bugX, bugY, 12, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(bugX - 4, bugY - 8);
        this.ctx.quadraticCurveTo(bugX - 10, bugY - 16, bugX - 14, bugY - 14 + legSwing);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(bugX + 4, bugY - 8);
        this.ctx.quadraticCurveTo(bugX + 10, bugY - 16, bugX + 14, bugY - 14 - legSwing);
        this.ctx.stroke();
      } else if (obs.type === 'conflict') {
        const pulse = Math.sin(this.frame * 0.2) * 4;
        this.ctx.strokeStyle = obs.color;
        this.ctx.lineWidth = 3;
        this.ctx.fillStyle = 'rgba(255, 214, 10, 0.08)';

        this.ctx.beginPath();
        this.ctx.moveTo(obs.x + pulse, obs.y + obs.height);
        this.ctx.lineTo(obs.x + obs.width / 2, obs.y + pulse);
        this.ctx.lineTo(obs.x + obs.width - pulse, obs.y + obs.height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = obs.color;
        this.ctx.font = 'bold 18px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('!', obs.x + obs.width / 2, obs.y + obs.height - 10);
      } else if (obs.type === 'fire') {
        const px = obs.x;
        const py = obs.y;
        const pw = obs.width;
        const ph = obs.height;

        this.ctx.fillStyle = this.colors.fire;
        this.ctx.beginPath();
        this.ctx.moveTo(px, py + ph);
        const flameOffset1 = Math.sin(this.frame * 0.25) * 5;
        const flameOffset2 = Math.cos(this.frame * 0.3) * 6;
        this.ctx.quadraticCurveTo(px + pw * 0.2, py + flameOffset1, px + pw * 0.35, py + ph * 0.2);
        this.ctx.quadraticCurveTo(px + pw * 0.5, py + flameOffset2, px + pw * 0.65, py + ph * 0.35);
        this.ctx.quadraticCurveTo(px + pw * 0.8, py - flameOffset1, px + pw, py + ph);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (obs.type === 'memoryLeak') {
        // Pulsing Memory Leak Organic Blob
        const blobX = obs.x + obs.width / 2;
        const blobY = obs.y + obs.height / 2;
        const pulse = Math.sin(this.frame * 0.18 + (obs.seed || 0)) * 4;
        const radius = obs.width / 2 + pulse;

        this.ctx.fillStyle = 'rgba(52, 199, 89, 0.22)';
        this.ctx.strokeStyle = obs.color;
        this.ctx.lineWidth = 2.5;

        this.ctx.beginPath();
        this.ctx.arc(blobX, blobY, Math.max(4, radius), 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Inner toxic core
        this.ctx.fillStyle = '#34C759';
        this.ctx.beginPath();
        this.ctx.arc(blobX, blobY, Math.max(2, radius * 0.45), 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LEAK', blobX, obs.y - 4);
      } else if (obs.type === 'error404') {
        // 404 Cyber Portal with Glitch Shift
        const glitch = Math.sin(this.frame * 0.4) * 2;
        this.ctx.fillStyle = 'rgba(255, 59, 48, 0.18)';
        this.ctx.strokeStyle = obs.color;
        this.ctx.lineWidth = 2.5;

        this.drawRoundRect(this.ctx, obs.x + glitch, obs.y, obs.width, obs.height, 6);
        this.ctx.fill();
        this.ctx.stroke();

        // Cyan glitch offset edge
        this.ctx.strokeStyle = '#00E5FF';
        this.ctx.lineWidth = 1;
        this.drawRoundRect(this.ctx, obs.x - glitch, obs.y - glitch, obs.width, obs.height, 6);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('404', obs.x + obs.width / 2, obs.y + obs.height / 2 + 4);
      } else if (obs.type === 'pointer') {
        const pulse = Math.sin(this.frame * 0.15) * 3;
        this.ctx.fillStyle = 'rgba(191, 90, 242, 0.15)';
        this.ctx.strokeStyle = obs.color;
        this.ctx.lineWidth = 2.5;
        const bugX = obs.x + obs.width / 2;
        const bugY = obs.y + obs.height / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(bugX, obs.y + pulse);
        this.ctx.lineTo(obs.x + obs.width - pulse, bugY);
        this.ctx.lineTo(bugX, obs.y + obs.height - pulse);
        this.ctx.lineTo(obs.x + pulse, bugY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(bugX, bugY, 4 + pulse * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = obs.color;
        this.ctx.font = 'bold 9px monospace';
        this.ctx.textAlign = 'center';
        const bandLabel =
          obs.band === 0 ? 'HIGH' : obs.band === 2 ? 'LOW' : obs.band === 1 ? 'DUCK' : 'NULL';
        this.ctx.fillText(bandLabel, bugX, obs.y - 4);
      }
      this.ctx.restore();
    });

    // 11. Hero Trails
    this.trail.forEach(t => {
      this.ctx.save();
      this.ctx.globalAlpha = t.opacity;
      if (t.phase) {
        this.ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
      } else if (this.invincible) {
        this.ctx.fillStyle = 'rgba(255, 214, 10, 0.2)';
      } else {
        this.ctx.fillStyle = 'rgba(0, 113, 227, 0.15)';
      }
      this.drawRoundRect(this.ctx, t.x, t.y, t.w, t.h, 12);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 12. Animated Player Character (Cyber Hacker 2026)
    this.ctx.save();
    if (this.phaseCloak) {
      this.ctx.shadowColor = '#00E5FF';
      this.ctx.shadowBlur = 24;
      this.ctx.globalAlpha = 0.75 + Math.sin(this.frame * 0.3) * 0.2;
      this.ctx.fillStyle = '#00E5FF';
    } else if (this.invincible) {
      this.ctx.shadowColor = '#FFD60A';
      this.ctx.shadowBlur = 24;
      this.ctx.fillStyle = this.frame % 6 < 3 ? '#FFD60A' : '#FF9500';
    } else {
      this.ctx.shadowColor = palette.accent;
      this.ctx.shadowBlur = 12;
      this.ctx.fillStyle = palette.hero;
    }

    const px = this.dev.x;
    const py = this.dev.y;
    const pw = this.dev.width;
    const ph = this.dev.height;

    if (!this.dev.onGround && !this.dev.isDucking && !this.reducedMotion) {
      this.ctx.translate(px + pw / 2, py + ph / 2);
      this.ctx.rotate(this.dev.rotation);
      this.ctx.translate(-(px + pw / 2), -(py + ph / 2));
    }

    // Cyber Suit Hood/Head
    this.ctx.beginPath();
    this.ctx.arc(
      px + pw / 2,
      py + (this.dev.isDucking ? 8 : 12),
      this.dev.isDucking ? 10 : 12,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Cyber Visor Glow
    this.ctx.fillStyle = this.phaseCloak
      ? '#ffffff'
      : this.invincible
        ? '#ffffff'
        : palette.heroVisor || this.colors.heroVisor;
    this.ctx.fillRect(px + pw / 2 - 2, py + (this.dev.isDucking ? 6 : 8), 12, 4);

    // Glowing Cyber Coat Body
    this.ctx.fillStyle = this.phaseCloak ? '#00E5FF' : this.invincible ? '#FFD60A' : palette.hero;
    this.drawRoundRect(
      this.ctx,
      px + 2,
      py + (this.dev.isDucking ? 14 : 22),
      pw - 4,
      ph - (this.dev.isDucking ? 18 : 30),
      8
    );
    this.ctx.fill();

    // Arm swing counter-balance (when running)
    const cycle = Math.sin(this.frame * 0.22) * 8;
    if (this.dev.onGround && !this.dev.isDucking && !this.reducedMotion) {
      this.ctx.fillStyle = palette.accent;
      this.drawRoundRect(this.ctx, px - 2, py + 26 - cycle * 0.5, 6, 12, 3);
      this.ctx.fill();
      this.drawRoundRect(this.ctx, px + pw - 4, py + 26 + cycle * 0.5, 6, 12, 3);
      this.ctx.fill();
    }

    // Leg running cycles
    this.ctx.fillStyle = this.phaseCloak ? '#00E5FF' : palette.accent;
    if (this.dev.onGround && !this.dev.isDucking) {
      this.drawRoundRect(this.ctx, px + 6, py + ph - 8 + cycle, 12, 8, 4);
      this.ctx.fill();
      this.drawRoundRect(this.ctx, px + pw - 18, py + ph - 8 - cycle, 12, 8, 4);
      this.ctx.fill();
    } else if (!this.dev.isDucking) {
      this.drawRoundRect(this.ctx, px + 6, py + ph - 12, 12, 12, 4);
      this.ctx.fill();
      this.drawRoundRect(this.ctx, px + pw - 18, py + ph - 12, 12, 12, 4);
      this.ctx.fill();
    } else {
      this.drawRoundRect(this.ctx, px + 4, py + ph - 6, pw - 8, 6, 3);
      this.ctx.fill();
    }

    // Glowing Test Suite Forcefield Bubble
    if (this.invincible) {
      this.ctx.strokeStyle = '#FFD60A';
      this.ctx.lineWidth = 2.5;
      this.ctx.shadowColor = '#FFD60A';
      this.ctx.shadowBlur = 18;
      this.ctx.beginPath();
      this.ctx.arc(px + pw / 2, py + ph / 2, Math.max(pw, ph) * 0.74, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Glowing Quantum Git Stash Phase Cloak Ring
    if (this.phaseCloak) {
      this.ctx.strokeStyle = '#00E5FF';
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = '#00E5FF';
      this.ctx.shadowBlur = 18;
      this.ctx.setLineDash([6, 4]);
      this.ctx.beginPath();
      this.ctx.arc(px + pw / 2, py + ph / 2, Math.max(pw, ph) * 0.78, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    this.ctx.restore();

    // 13. Arcade CRT Scanlines (skipped in reduced motion)
    if (!this.reducedMotion) {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      this.ctx.lineWidth = 1;
      for (let i = 0; i < this.canvas.height; i += 4) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, i);
        this.ctx.lineTo(this.canvas.width, i);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // 14. UI HUD Stats & Progress Bar
    this.ctx.save();
    const isFlashing = Date.now() < this.milestoneFlashUntil;
    this.ctx.fillStyle = isFlashing ? '#FFD60A' : palette.text;
    this.ctx.font = 'bold 24px monospace';
    this.ctx.fillText(`SCORE: ${Math.floor(this.score / 10)}`, 30, 45);

    this.ctx.fillStyle = palette.textSecondary;
    this.ctx.font = '14px monospace';
    this.ctx.fillText(`HI: ${Math.floor(this.highScore / 10)}`, 30, 72);

    if (this.nightMode) {
      this.ctx.fillStyle = palette.accent;
      this.ctx.font = 'bold 12px monospace';
      this.ctx.fillText('NIGHT', 30, 94);
    }

    // Combo HUD Indicator
    if (this.comboCount > 1) {
      this.ctx.fillStyle = this.comboMultiplier >= 3 ? '#FFD60A' : '#00E5FF';
      this.ctx.font = 'bold 13px monospace';
      this.ctx.fillText(`🔥 ${this.comboMultiplier}x COMBO (${this.comboCount})`, 30, 114);
    }

    // Gamepad indicator badge if connected
    if (this.hasGamepad) {
      this.ctx.fillStyle = palette.accent;
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillText('🎮 GAMEPAD READY', 30, 134);
    }

    // Interactive Audio Speaker Icon (top right)
    this.ctx.fillStyle = this.muted ? '#ff3b30' : palette.accent;
    this.ctx.beginPath();
    this.ctx.arc(1155, 35, 18, 0, Math.PI * 2);
    this.ctx.fillStyle = this.muted ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0, 113, 227, 0.15)';
    this.ctx.fill();
    this.ctx.strokeStyle = this.muted ? '#ff3b30' : palette.accent;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // Speaker Shape
    this.ctx.fillStyle = this.muted ? '#ff3b30' : palette.text;
    this.ctx.beginPath();
    this.ctx.moveTo(1146, 31);
    this.ctx.lineTo(1151, 31);
    this.ctx.lineTo(1156, 26);
    this.ctx.lineTo(1156, 44);
    this.ctx.lineTo(1151, 39);
    this.ctx.lineTo(1146, 39);
    this.ctx.closePath();
    this.ctx.fill();

    if (this.muted) {
      this.ctx.strokeStyle = '#ff3b30';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(1160, 31);
      this.ctx.lineTo(1166, 37);
      this.ctx.moveTo(1166, 31);
      this.ctx.lineTo(1160, 37);
      this.ctx.stroke();
    } else {
      this.ctx.strokeStyle = palette.text;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(1154, 35, 6, -Math.PI / 3, Math.PI / 3);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(1154, 35, 10, -Math.PI / 3, Math.PI / 3);
      this.ctx.stroke();
    }

    // Level progress bar
    const nextLevelScore = this.level * 1200;
    const prevLevelScore = (this.level - 1) * 1200;
    const progress = Math.max(
      0,
      Math.min(1, (this.score - prevLevelScore) / (nextLevelScore - prevLevelScore))
    );

    const barWidth = 200;
    const barHeight = 8;
    const barX = this.canvas.width / 2 - barWidth / 2;
    const barY = 35;

    this.ctx.fillStyle = this.nightMode || palette.bg === '#050508' ? '#1c1c1e' : '#e5e7eb';
    this.drawRoundRect(this.ctx, barX, barY, barWidth, barHeight, 4);
    this.ctx.fill();

    const gradFill = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradFill.addColorStop(0, '#00E5FF');
    gradFill.addColorStop(1, palette.accent);
    this.ctx.fillStyle = gradFill;
    const fillWidth = barWidth * progress;
    if (fillWidth > 1) {
      this.drawRoundRect(this.ctx, barX, barY, fillWidth, barHeight, 4);
      this.ctx.fill();
    }

    this.ctx.fillStyle = palette.textSecondary;
    this.ctx.font = 'bold 11px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`LEVEL ${this.level}`, this.canvas.width / 2, 28);
    this.ctx.textAlign = 'left';

    if (this.phaseCloak) {
      this.ctx.fillStyle = '#00E5FF';
      this.ctx.font = 'bold 14px monospace';
      this.ctx.fillText('⚡ PHASE CLOAK ACTIVE', this.canvas.width - 320, 45);
    } else if (this.invincible) {
      this.ctx.fillStyle = '#FFD60A';
      this.ctx.font = 'bold 14px monospace';
      this.ctx.fillText('🛡️ SHIELD ACTIVE', this.canvas.width - 290, 45);
    }
    this.ctx.restore();

    // 15. Level Up Banner
    if (this.showLevelMessageUntil && Date.now() < this.showLevelMessageUntil) {
      this.ctx.save();
      this.ctx.fillStyle = this.colors.accent;
      this.ctx.font = 'bold 42px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = this.colors.accent;
      this.ctx.shadowBlur = 20;
      this.ctx.fillText(`LEVEL ${this.level}`, this.canvas.width / 2, 160);
      this.ctx.font = '16px monospace';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('⚡ SPEED BOOST INITIATED ⚡', this.canvas.width / 2, 200);
      this.ctx.restore();
    }

    // 16. Floating Texts
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      this.ctx.globalAlpha = ft.life;
      this.ctx.fillStyle = ft.color;
      this.ctx.font = 'bold 12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    this.ctx.restore();

    // 17. Glitch Slice Effect (omitted when reduced motion is requested)
    if (this.gameRunning && this.screenShake > 0 && !this.reducedMotion && Math.random() < 0.45) {
      const sliceY = Math.random() * this.canvas.height;
      const sliceHeight = Math.random() * 32 + 8;
      const shiftX = (Math.random() - 0.5) * this.screenShake * 1.5;
      this.ctx.save();
      this.ctx.drawImage(
        this.canvas,
        0,
        sliceY,
        this.canvas.width,
        sliceHeight,
        shiftX,
        sliceY,
        this.canvas.width,
        sliceHeight
      );
      this.ctx.restore();
    }
  }

  drawStartScreen() {
    const palette = this.getActivePalette();
    this.ctx.fillStyle =
      palette.bg === '#050508' ? 'rgba(5, 5, 8, 0.78)' : 'rgba(245, 245, 247, 0.78)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.fillStyle = palette.text;
    this.ctx.font = 'bold 62px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = palette.accent;
    this.ctx.shadowBlur = 14;
    this.ctx.fillText('DEBUG RUNNER', this.canvas.width / 2, this.canvas.height / 2 - 35);
    this.ctx.shadowBlur = 0;

    this.ctx.font = 'bold 20px monospace';
    this.ctx.fillStyle = palette.accent;
    const startText = this.isMobile
      ? 'Tap to start'
      : this.hasGamepad
        ? 'Press A (Controller) or SPACE to start'
        : 'Click canvas, then SPACE to start';
    this.ctx.fillText(startText, this.canvas.width / 2, this.canvas.height / 2 + 20);

    this.ctx.font = '13px monospace';
    this.ctx.fillStyle = palette.textSecondary;
    const controlsInfo = this.isMobile
      ? 'Jump / Duck buttons · swipe up/down on canvas'
      : this.hasGamepad
        ? 'Controller: A Jump · B Duck/Fast-Fall · Start Pause · night mode at 700'
        : 'SPACE/↑ jump · ↓ duck / fast-fall · P pause · night mode at 700';
    this.ctx.fillText(controlsInfo, this.canvas.width / 2, this.canvas.height / 2 + 56);
    this.ctx.restore();
  }

  drawPauseOverlay() {
    this.ctx.fillStyle =
      this.colors.bg === '#050508' ? 'rgba(5, 5, 8, 0.72)' : 'rgba(245, 245, 247, 0.72)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 10);
    this.ctx.font = '16px monospace';
    this.ctx.fillStyle = this.colors.accent;
    this.ctx.fillText(
      this.hasGamepad ? 'Press Start or SPACE to resume' : 'Press P or SPACE to resume',
      this.canvas.width / 2,
      this.canvas.height / 2 + 35
    );
    this.ctx.restore();
  }

  drawGameOver() {
    this.ctx.fillStyle =
      this.colors.bg === '#050508' ? 'rgba(5, 5, 8, 0.88)' : 'rgba(245, 245, 247, 0.88)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.fillStyle = this.colors.bug;
    this.ctx.font = 'bold 56px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = this.colors.bug;
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);

    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '28px monospace';
    this.ctx.fillText(
      `Score ${Math.floor(this.score / 10)}  ·  HI ${Math.floor(this.highScore / 10)}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 20
    );

    this.ctx.fillStyle = this.colors.accent;
    this.ctx.font = '18px monospace';
    const restartText = this.isMobile
      ? 'Tap to retry'
      : this.hasGamepad
        ? 'Press A (Controller) or SPACE to retry'
        : 'Press SPACE to retry';
    this.ctx.fillText(restartText, this.canvas.width / 2, this.canvas.height / 2 + 65);
    this.ctx.restore();
  }

  destroy() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }
    if (this.touchDuckTimer) {
      clearTimeout(this.touchDuckTimer);
      this.touchDuckTimer = null;
    }
    this.abortController.abort();
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {
        // Ignored
      }
    }
  }
}

export default DebugRunner;

// Lazy-init only when the disclosure is opened (keeps homepage light)
const initDebugRunner = () => {
  if (
    window.__PERF_AUDIT__ === true ||
    new URLSearchParams(window.location.search).has('perf-audit')
  ) {
    return;
  }

  const container = document.getElementById('debug-runner-container');
  if (!container || container.dataset.gameReady === 'true') return;

  const disclosure = container.closest('details.debug-runner-disclosure');
  if (disclosure && !disclosure.open) {
    const onToggle = () => {
      if (!disclosure.open) return;
      disclosure.removeEventListener('toggle', onToggle);
      initDebugRunner();
    };
    disclosure.addEventListener('toggle', onToggle);
    return;
  }

  container.dataset.gameReady = 'true';
  const game = new DebugRunner();
  const canvas = game.init();
  container.appendChild(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.pause();
    } else if (!disclosure || disclosure.open) {
      game.resume();
    }
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && (!disclosure || disclosure.open)) {
          game.resume();
        } else {
          game.pause();
        }
      });
    },
    { threshold: 0.1 }
  );
  observer.observe(container);

  if (disclosure) {
    disclosure.addEventListener('toggle', () => {
      if (!disclosure.open) {
        game.pause();
      }
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDebugRunner);
} else {
  initDebugRunner();
}
