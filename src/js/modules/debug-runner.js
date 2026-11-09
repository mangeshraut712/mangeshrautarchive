/**
 * Debug Runner — Debug Ascent (Rooftop Reset & Apple Arcade Edition)
 * Apple HIG-inspired developer runner: 6 cloud architecture stages (0-1000m),
 * 3 difficulty modes (Normal, Hard, Nightmare), Air Dash mechanic with invulnerability,
 * dynamic hazards (oscillating saws, cyber lasers, hydraulic compression gates),
 * Rooftop Reset pedestal at 1000m, Web Audio arpeggios, and Gamepad API.
 */

const safeStorage = {
  _mem: {},
  getItem(key) {
    try {
      return typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(key)
        : this._mem[key] || null;
    } catch {
      return this._mem[key] || null;
    }
  },
  setItem(key, val) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch {
      // Storage access blocked or restricted in iframe sandbox
    }
    this._mem[key] = String(val);
  },
};

class DebugRunner {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.gameRunning = false;
    this.gameOver = false;
    this.won = false;
    this.paused = false;
    this.difficulty = safeStorage.getItem('debugRunnerDifficulty') || 'normal';
    this.stages = [
      { id: 1, name: 'Localhost', sub: 'Basement Runtime', start: 0, end: 150, color: '#0a84ff' },
      { id: 2, name: 'Staging CI', sub: 'Pipeline Shaft', start: 150, end: 350, color: '#30d158' },
      { id: 3, name: 'Code Review', sub: 'Compiler Hall', start: 350, end: 550, color: '#ffd60a' },
      { id: 4, name: 'Kubernetes', sub: 'Cluster Core', start: 550, end: 750, color: '#bf5af2' },
      { id: 5, name: 'Global CDN', sub: 'Edge Antenna', start: 750, end: 920, color: '#64d2ff' },
      { id: 6, name: 'Production', sub: 'Rooftop Reset', start: 920, end: 1000, color: '#ff453a' },
    ];
    this.totalDistance = 1000;
    this.distance = 0;
    this.stageIdx = 0;
    this.deaths = 0;
    this.startTime = 0;
    this.clearTime = 0;
    this.resetPedestalX = null;
    this.toastText = '';
    this.toastUntil = 0;
    this.score = 0;
    this.highScore = parseInt(safeStorage.getItem('debugRunnerHighScore') || '0', 10) || 0;
    this.baseSpeed =
      this.difficulty === 'nightmare' ? 10.5 : this.difficulty === 'hard' ? 8.6 : 6.8;
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
    this.bestTimes = {
      normal: parseFloat(safeStorage.getItem('debugRunnerBest_normal') || '0'),
      hard: parseFloat(safeStorage.getItem('debugRunnerBest_hard') || '0'),
      nightmare: parseFloat(safeStorage.getItem('debugRunnerBest_nightmare') || '0'),
    };
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
    this.lastGpDash = false;
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
      const raw = safeStorage.getItem('debugRunnerLeaderboard');
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
      safeStorage.setItem('debugRunnerLeaderboard', JSON.stringify(cloned));
    } catch {
      safeStorage.setItem('debugRunnerLeaderboard', JSON.stringify(board));
    }
    this.renderLeaderboard(board);
  }

  persistHighScore() {
    const stored = parseInt(safeStorage.getItem('debugRunnerHighScore') || '0', 10) || 0;
    if (this.highScore > stored) {
      safeStorage.setItem('debugRunnerHighScore', String(Math.floor(this.highScore)));
    }
  }

  renderLeaderboard(board = null) {
    if (!board) {
      try {
        const raw = safeStorage.getItem('debugRunnerLeaderboard');
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
    this.setupSegmentedControls();

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

        if (!this.gameRunning || this.gameOver || this.won) {
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
      } else if (type === 'dash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.13);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.13);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'death') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.28);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'checkpoint') {
        [330, 440, 660].forEach((f, i) => {
          const oscC = ctx.createOscillator();
          const gainC = ctx.createGain();
          oscC.connect(gainC);
          gainC.connect(ctx.destination);
          const t = now + i * 0.075;
          oscC.type = 'triangle';
          oscC.frequency.setValueAtTime(f, t);
          oscC.frequency.exponentialRampToValueAtTime(f * 1.02, t + 0.14);
          gainC.gain.setValueAtTime(0.08, t);
          gainC.gain.linearRampToValueAtTime(0.001, t + 0.14);
          oscC.start(t);
          oscC.stop(t + 0.15);
        });
      } else if (type === 'win') {
        [330, 415, 494, 660, 830].forEach((f, i) => {
          const oscW = ctx.createOscillator();
          const gainW = ctx.createGain();
          oscW.connect(gainW);
          gainW.connect(ctx.destination);
          const t = now + i * 0.08;
          oscW.type = 'triangle';
          oscW.frequency.setValueAtTime(f, t);
          oscW.frequency.exponentialRampToValueAtTime(f * 1.02, t + 0.18);
          gainW.gain.setValueAtTime(0.09, t);
          gainW.gain.linearRampToValueAtTime(0.001, t + 0.18);
          oscW.start(t);
          oscW.stop(t + 0.19);
        });
      }
    } catch {
      // Procedural audio safety fallback
    }
  }

  showToast(msg, durationMs = 2200) {
    this.toastText = msg;
    this.toastUntil = performance.now() + durationMs;
  }

  setDifficulty(mode) {
    if (!['normal', 'hard', 'nightmare'].includes(mode)) return;
    this.difficulty = mode;
    safeStorage.setItem('debugRunnerDifficulty', mode);

    if (mode === 'normal') {
      this.baseSpeed = 6.8;
    } else if (mode === 'hard') {
      this.baseSpeed = 8.6;
    } else {
      this.baseSpeed = 10.5;
    }
    this.speed = this.baseSpeed;

    const modes = ['normal', 'hard', 'nightmare'];
    modes.forEach(m => {
      const btn = document.getElementById(`debug-seg-${m}`);
      if (btn) {
        const isActive = m === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
    });

    if (!this.gameRunning || this.gameOver || this.won) {
      this.drawStartScreen();
    } else {
      this.start();
    }
    this.showToast(`Selected: ${mode.toUpperCase()} Mode`);
  }

  setupSegmentedControls() {
    const modes = ['normal', 'hard', 'nightmare'];
    modes.forEach(mode => {
      const btn = document.getElementById(`debug-seg-${mode}`);
      if (btn) {
        btn.disabled = false;
        const isActive = mode === this.difficulty;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        btn.addEventListener(
          'click',
          e => {
            e.preventDefault();
            this.setDifficulty(mode);
            this.vibrate(15);
          },
          { signal: this.abortController.signal }
        );
      }
    });
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

    const duckBtn = this.createControlButton('SLIDE', 'duck');
    bindAction(
      duckBtn,
      () => this.duck(),
      () => this.standUp()
    );

    const dashBtn = this.createControlButton('DASH', 'dash');
    bindAction(dashBtn, () => this.dash());

    const jumpBtn = this.createControlButton('JUMP', 'jump');
    jumpBtn.classList.add('specular-shine');
    bindAction(jumpBtn, () => this.jump());

    wrapper.appendChild(duckBtn);
    wrapper.appendChild(dashBtn);
    wrapper.appendChild(jumpBtn);

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
    icon.className =
      type === 'jump' ? 'fas fa-arrow-up' : type === 'dash' ? 'fas fa-bolt' : 'fas fa-arrow-down';

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

    // Air Dash readiness or Combo
    let dashLabel = 'Ready';
    let dashColor = '#30d158';
    if (this.dev && !this.dev.dashReady) {
      dashLabel = `${this.dev.dashCooldown.toFixed(1)}s`;
      dashColor = '#86868b';
    } else if (this.comboMultiplier > 1) {
      dashLabel = `${this.comboMultiplier}x 🔥`;
      dashColor = '#0071e3';
    }

    if (this.comboDisplay && this.lastUiCombo !== dashLabel) {
      this.comboDisplay.textContent = dashLabel;
      this.comboDisplay.style.color = dashColor;
      this.lastUiCombo = dashLabel;
    }

    // Current floor/stage or boost
    const curStage = this.stages[this.stageIdx] || this.stages[0];
    let boostLabel = `0${curStage.id} ${curStage.name}`;
    let boostColor = curStage.color;
    if (this.phaseCloak) {
      boostLabel = '⚡ Stash';
      boostColor = '#00e5ff';
    } else if (this.invincible) {
      boostLabel = '🛡️ Shield';
      boostColor = '#ffd60a';
    }

    if (this.boostDisplay && this.lastUiBoost !== boostLabel) {
      this.boostDisplay.textContent = boostLabel;
      this.boostDisplay.style.color = boostColor;
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
      dashReady: true,
      dashCooldown: 0,
      isDashing: false,
      dashFrames: 0,
    };
  }

  setupControls() {
    const handleInput = e => {
      if (['INPUT', 'TEXTAREA', 'SELECT', 'CONTENTEDITABLE'].includes(e.target.tagName)) return;

      if (document.activeElement !== this.canvas) return;

      if (e.type === 'keydown') {
        if (e.code === 'KeyP' || e.code === 'Escape') {
          e.preventDefault();
          if (!this.gameRunning || this.gameOver || this.won) return;
          if (this.paused) this.resume();
          else this.pause();
          return;
        }

        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          if (!this.gameRunning || this.gameOver || this.won) {
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
        if (
          (e.code === 'ShiftLeft' ||
            e.code === 'ShiftRight' ||
            e.code === 'KeyX' ||
            e.code === 'KeyD') &&
          this.gameRunning &&
          !this.paused
        ) {
          e.preventDefault();
          this.dash();
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

        if (!this.gameRunning || this.gameOver || this.won) {
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
          } else if (diffX > 40) {
            this.dash();
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
      // Button 2 (X), Button 5 (RB) -> Dash
      const dashPressed =
        (gp.buttons[2] && gp.buttons[2].pressed) || (gp.buttons[5] && gp.buttons[5].pressed);
      // Button 9 (Start / Options), Button 8 (Select / Share)
      const pausePressed =
        (gp.buttons[9] && gp.buttons[9].pressed) || (gp.buttons[8] && gp.buttons[8].pressed);

      if (pausePressed && !this.lastGpPause) {
        if (!this.gameRunning || this.gameOver || this.won) {
          this.start();
        } else if (this.paused) {
          this.resume();
        } else {
          this.pause();
        }
      }
      this.lastGpPause = pausePressed;

      if (jumpPressed) {
        if (!this.gameRunning || this.gameOver || this.won) {
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

      if (dashPressed && !this.lastGpDash && this.gameRunning && !this.paused) {
        this.dash();
      }
      this.lastGpDash = dashPressed;
      break;
    }
  }

  start() {
    if (this.gameRunning && !this.gameOver && !this.won) return;

    this.gameRunning = true;
    this.gameOver = false;
    this.won = false;
    this.paused = false;
    this.distance = 0;
    this.score = 0;
    this.stageIdx = 0;
    this.deaths = 0;
    this.startTime = performance.now();
    this.clearTime = 0;
    this.speed = this.baseSpeed;
    this.level = 1;
    this.obstacles = [];
    this.powerUps = [];
    this.particles = [];
    this.floatingTexts = [];
    this.resetPedestalX = null;
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
    this.showToast(`Ascent Started: ${this.difficulty.toUpperCase()} Mode`);

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
    if (!this.won) {
      this.playSound('gameover');
      this.vibrate([60, 120, 60]);
      this.drawGameOver();
    }
  }

  dash() {
    if (this.paused || this.gameOver || !this.gameRunning || this.won) return;
    if (!this.dev) return;

    if (this.dev.dashReady && !this.dev.isDashing) {
      this.dev.isDashing = true;
      this.dev.dashFrames = 15;
      this.dev.dashReady = false;
      this.dev.dashCooldown = 1.35;
      this.dev.velocityY = 0;
      this.playSound('dash');
      this.vibrate(25);
      this.createParticles(this.dev.x, this.dev.y + this.dev.height / 2, 20, '#64d2ff');
      this.updateSideStats();
    }
  }

  pause() {
    if (!this.gameRunning || this.gameOver || this.paused || this.won) return;
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
    if (!this.gameRunning || !this.paused || this.gameOver || this.won) return;
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
    if (this.paused || this.gameOver || this.won) return;

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
    if (this.paused || this.gameOver || !this.gameRunning || this.won) return;

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

    // Air Dash Movement & Cooldown
    if (this.dev.isDashing) {
      this.dev.dashFrames--;
      if (Math.random() < 0.6) {
        this.createParticles(this.dev.x, this.dev.y + this.dev.height / 2, 2, '#64d2ff');
      }
      if (this.dev.dashFrames <= 0) {
        this.dev.isDashing = false;
      }
    } else {
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
    }

    // Dash recharge (must touch ground to refuel)
    if (!this.dev.dashReady) {
      this.dev.dashCooldown = Math.max(0, this.dev.dashCooldown - dt);
      if (this.dev.dashCooldown <= 0 && this.dev.onGround) {
        this.dev.dashReady = true;
        this.updateSideStats();
      }
    }

    // Spin during jump (skipped in reduced-motion or ducking)
    if (!this.dev.onGround && !this.dev.isDucking && !this.dev.isDashing && !this.reducedMotion) {
      this.dev.rotation += 0.08 * frameScale;
    } else {
      this.dev.rotation = 0;
    }

    // Sparks while sliding (ducking)
    if (this.dev.isDucking && this.dev.onGround && this.frame % 3 === 0) {
      this.createParticles(this.dev.x + 10, this.groundY, 2, '#FFD60A');
    }

    // Distance tracking & 6-Floor Stage Advancement
    this.distance += this.speed * dt * 5;
    this.score = Math.floor(this.distance * 10);
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    // Speed progression capped by difficulty
    const maxSpeed =
      this.difficulty === 'nightmare' ? 16.5 : this.difficulty === 'hard' ? 14.5 : 12.5;
    this.speed = Math.min(maxSpeed, this.baseSpeed + (this.distance / this.totalDistance) * 3.6);

    // Stage progression checks
    const cycleDist =
      this.difficulty === 'normal' ? this.distance % this.totalDistance : this.distance;
    const currentLoop = Math.floor(this.distance / this.totalDistance) + 1;
    for (let i = 0; i < this.stages.length; i++) {
      if (cycleDist >= this.stages[i].start && cycleDist < this.stages[i].end) {
        if (this.stageIdx !== i) {
          this.stageIdx = i;
          this.playSound('checkpoint');
          this.createParticles(this.dev.x + 20, this.groundY - 20, 25, this.stages[i].color);
          const loopLabel = currentLoop > 1 ? ` (Loop ${currentLoop})` : '';
          this.showToast(`Stage Cleared: ${this.stages[i].name}${loopLabel}`);
          this.updateSideStats();
        }
        break;
      }
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
    if (this.won) {
      this.obstacles = [];
      return;
    }

    // At 960m+ in Hard/Nightmare modes, stop spawning hazards and spawn Rooftop Reset pedestal at 1000m
    if (this.difficulty !== 'normal' && this.distance >= this.totalDistance - 40) {
      if (this.resetPedestalX === null) {
        this.resetPedestalX = this.canvas.width + 120;
      }
    } else {
      const stage = this.stageIdx;
      const spawnRate = 0.012 + Math.min(0.01, (this.stageIdx + 1) * 0.002);
      if (Math.random() < Math.min(0.03, spawnRate * frameScale)) {
        const minGap = Math.max(300, 440 - (this.speed - 6) * 12);
        const lastObs = this.obstacles[this.obstacles.length - 1];
        if (!lastObs || this.canvas.width - lastObs.x > minGap) {
          const roll = Math.random();
          const obstacle = { x: this.canvas.width + 40, speed: this.speed };

          if (stage >= 1 && roll < 0.28) {
            // Titanium Oscillating Saw
            obstacle.type = 'saw';
            obstacle.radius = 22;
            obstacle.width = 44;
            obstacle.height = 44;
            obstacle.y = this.groundY - 34;
            obstacle.baseY = this.groundY - 38;
            obstacle.phase = Math.random() * Math.PI * 2;
            obstacle.amp = stage >= 3 ? 34 : 20;
            obstacle.color = '#ff453a';
          } else if (stage >= 2 && roll < 0.52) {
            // Head-Height Cyber Laser Beam (duck/slide or dash through)
            obstacle.type = 'laser';
            obstacle.y = this.groundY - 56;
            obstacle.width = 62;
            obstacle.height = 16;
            obstacle.color = '#ff3b30';
          } else if (stage >= 3 && roll < 0.7) {
            // Hydraulic Compression Gate (high press, duck/slide under)
            obstacle.type = 'press';
            obstacle.y = this.groundY - 96;
            obstacle.width = 52;
            obstacle.height = 62;
            obstacle.color = '#ff9f0a';
          } else if (stage >= 1 && roll < 0.82) {
            // Drone Pointer / Flying Bug
            const isFlyer = stage >= 2 && Math.random() < 0.45;
            obstacle.type = 'pointer';
            obstacle.band = isFlyer ? 0 : 1;
            obstacle.width = 42;
            obstacle.height = 26;
            obstacle.color = '#bf5af2';
            obstacle.y = isFlyer ? this.groundY - 78 : this.groundY - 44;
          } else if (roll < 0.88) {
            obstacle.type = 'memoryLeak';
            obstacle.y = this.groundY - 34;
            obstacle.width = 40;
            obstacle.height = 34;
            obstacle.color = this.colors.memoryLeak;
            obstacle.seed = Math.random() * 100;
          } else if (roll < 0.94) {
            obstacle.type = 'bug';
            obstacle.y = this.groundY - 32;
            obstacle.width = 32;
            obstacle.height = 32;
            obstacle.color = this.colors.bug;
          } else {
            obstacle.type = 'fire';
            obstacle.y = this.groundY - 36;
            obstacle.width = 36;
            obstacle.height = 36;
            obstacle.color = this.colors.fire;
          }

          this.obstacles.push(obstacle);
        }
      }
    }

    this.obstacles.forEach(obs => {
      obs.x -= obs.speed * frameScale;
      if (obs.type === 'saw') {
        obs.y = obs.baseY + Math.sin(this.frame * 0.08 + obs.phase) * obs.amp;
      }
    });
    this.obstacles = this.obstacles.filter(obs => obs.x > -120);

    // Update 1000m reset pedestal position if active
    if (this.resetPedestalX !== null) {
      this.resetPedestalX -= this.speed * frameScale;
    }
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

  die() {
    this.playSound('death');
    this.deaths++;
    this.vibrate([50, 100, 50]);
    this.createParticles(this.dev.x + 20, this.dev.y + 20, 35, this.colors.bug);

    if (this.difficulty === 'nightmare') {
      // Nightmare Mode: 0 Checkpoints - Back to basement!
      this.distance = 0;
      this.score = 0;
      this.stageIdx = 0;
      this.speed = this.baseSpeed;
      this.obstacles = [];
      this.resetPedestalX = null;
      this.resetHero();
      this.showToast('NIGHTMARE RESET · BACK TO BASEMENT');
      this.updateSideStats();
    } else if (this.difficulty === 'hard') {
      // Hard Mode: Checkpoint at current stage start
      this.distance = this.stages[this.stageIdx].start;
      this.score = Math.floor(this.distance * 10);
      this.obstacles = this.obstacles.filter(o => o.x > this.canvas.width + 200);
      this.resetPedestalX = null;
      this.resetHero();
      this.showToast(`CHECKPOINT: ${this.stages[this.stageIdx].name.toUpperCase()}`);
      this.updateSideStats();
    } else {
      // Normal Mode: Classic stop / game over
      this.gameOver = true;
      this.stop();
      this.persistHighScore();
      this.recordLeaderboardEntry();
    }
  }

  win() {
    if (this.won) return;
    this.won = true;
    this.gameRunning = false;
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }

    const elapsed = Math.max(1, (performance.now() - this.startTime) / 1000);
    this.clearTime = elapsed;
    const bestKey = `debugRunnerBest_${this.difficulty}`;
    const prevBest = parseFloat(safeStorage.getItem(bestKey) || '0');
    if (prevBest === 0 || elapsed < prevBest) {
      safeStorage.setItem(bestKey, elapsed.toFixed(1));
      this.bestTimes[this.difficulty] = elapsed;
    }

    this.playSound('win');
    this.vibrate([100, 50, 100, 50, 200]);
    this.createParticles(this.dev.x + 30, this.groundY - 30, 45, '#ffd60a');
    this.createParticles(this.dev.x + 30, this.groundY - 60, 45, '#0a84ff');
    this.createParticles(this.dev.x + 30, this.groundY - 45, 45, '#30d158');

    this.persistHighScore();
    this.recordLeaderboardEntry();
    this.drawWinScreen();
  }

  checkCollisions() {
    if (this.won || !this.dev) return;

    // Check 1000m Rooftop Reset Button interaction
    if (this.resetPedestalX !== null) {
      const rx = this.resetPedestalX;
      if (rx <= this.dev.x + this.dev.width && rx + 80 >= this.dev.x) {
        this.win();
        return;
      }
    }

    const heroRect = {
      x: this.dev.x + 6,
      y: this.dev.isDucking ? this.groundY - 28 : this.dev.y + 6,
      width: this.dev.width - 12,
      height: this.dev.isDucking ? 26 : this.dev.height - 12,
    };

    // Invulnerability: Shield, Quantum Git Stash, or Air Dash
    const isImmune = this.invincible || this.phaseCloak || this.dev.isDashing;

    if (!isImmune) {
      for (const obs of this.obstacles) {
        let hit = false;
        if (obs.type === 'saw') {
          const centerX = obs.x;
          const centerY = obs.y;
          const heroCenterX = heroRect.x + heroRect.width / 2;
          const heroCenterY = heroRect.y + heroRect.height / 2;
          const dx = heroCenterX - centerX;
          const dy = heroCenterY - centerY;
          const r = obs.radius + 8;
          if (dx * dx + dy * dy < r * r) hit = true;
        } else if (obs.type === 'laser') {
          if (
            heroRect.x + heroRect.width > obs.x &&
            heroRect.x < obs.x + obs.width &&
            heroRect.y < obs.y + obs.height &&
            heroRect.y + heroRect.height > obs.y
          ) {
            hit = true;
          }
        } else if (obs.type === 'press') {
          if (
            heroRect.x + heroRect.width > obs.x &&
            heroRect.x < obs.x + obs.width &&
            heroRect.y < obs.y + obs.height
          ) {
            hit = true;
          }
        } else {
          if (this.rectIntersect(heroRect, obs)) {
            hit = true;
          }
        }

        if (hit) {
          this.screenShake = this.reducedMotion ? 0 : 20;
          this.die();
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

    // Ground Edge line with Dynamic Stage Glow
    const curStageColor =
      (this.stages[this.stageIdx] && this.stages[this.stageIdx].color) || palette.accent;
    this.ctx.save();
    this.ctx.strokeStyle = curStageColor;
    this.ctx.shadowColor = curStageColor;
    this.ctx.shadowBlur = 14;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY);
    this.ctx.lineTo(this.canvas.width, this.groundY);
    this.ctx.stroke();
    this.ctx.restore();

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
      } else if (obs.type === 'saw') {
        this.ctx.save();
        this.ctx.translate(obs.x, obs.y);
        this.ctx.rotate(this.frame * 0.14);
        this.ctx.fillStyle = '#ff453a';
        this.ctx.shadowColor = '#ff453a';
        this.ctx.shadowBlur = 14;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, obs.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Metallic Saw Teeth
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2.5;
        for (let i = 0; i < 8; i++) {
          this.ctx.rotate(Math.PI / 4);
          this.ctx.strokeRect(-2, -obs.radius - 4, 4, 8);
        }
        this.ctx.restore();
      } else if (obs.type === 'laser') {
        this.ctx.save();
        this.ctx.fillStyle = '#ff3b30';
        this.ctx.shadowColor = '#ff3b30';
        this.ctx.shadowBlur = 18;
        this.drawRoundRect(this.ctx, obs.x, obs.y, obs.width, obs.height, 4);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.drawRoundRect(this.ctx, obs.x + 3, obs.y + 4, obs.width - 6, obs.height - 8, 2);
        this.ctx.fill();
        this.ctx.restore();
      } else if (obs.type === 'press') {
        this.ctx.save();
        this.ctx.fillStyle = '#ff9f0a';
        this.ctx.shadowColor = '#ff9f0a';
        this.ctx.shadowBlur = 12;
        this.drawRoundRect(this.ctx, obs.x, obs.y, obs.width, obs.height, 6);
        this.ctx.fill();
        // Warning stripes
        this.ctx.strokeStyle = '#1c1c1e';
        this.ctx.lineWidth = 3;
        for (let ly = obs.y + 4; ly < obs.y + obs.height - 4; ly += 12) {
          this.ctx.beginPath();
          this.ctx.moveTo(obs.x + 4, ly);
          this.ctx.lineTo(obs.x + obs.width - 4, ly + 6);
          this.ctx.stroke();
        }
        this.ctx.restore();
      }
      this.ctx.restore();
    });

    // Rooftop Reset Pedestal (1000m Victory Button)
    if (this.resetPedestalX !== null) {
      const rx = this.resetPedestalX;
      const ry = this.groundY - 44;
      this.ctx.save();
      // Glass Pedestal
      this.ctx.fillStyle =
        palette.bg === '#050508' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
      this.ctx.strokeStyle =
        palette.bg === '#050508' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)';
      this.ctx.lineWidth = 1.5;
      this.drawRoundRect(this.ctx, rx, ry + 18, 80, 26, 6);
      this.ctx.fill();
      this.ctx.stroke();

      // Glowing Red Reset Button
      this.ctx.fillStyle = '#ff453a';
      this.ctx.shadowColor = '#ff453a';
      this.ctx.shadowBlur = 24;
      this.drawRoundRect(this.ctx, rx + 12, ry, 56, 20, 6);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('RESET', rx + 40, ry + 14);
      this.ctx.restore();
    }

    // 11. Hero Trails
    this.trail.forEach(t => {
      this.ctx.save();
      this.ctx.globalAlpha = t.opacity;
      if (this.dev.isDashing) {
        this.ctx.fillStyle = 'rgba(100, 210, 255, 0.35)';
      } else if (t.phase) {
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

    // 12. Animated Player Character (Apple Cyber-Astronaut 2026)
    this.ctx.save();
    if (this.dev.isDashing) {
      this.ctx.shadowColor = '#64d2ff';
      this.ctx.shadowBlur = 28;
      this.ctx.fillStyle = '#64d2ff';
    } else if (this.phaseCloak) {
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
    const idleOffset = !this.gameRunning || this.paused ? Math.sin(this.frame * 0.08) * 3.5 : 0;
    const py = this.dev.y + idleOffset;
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

    // In-canvas Toast Capsule Overlay
    if (this.toastText && performance.now() < this.toastUntil) {
      this.ctx.save();
      const tw = Math.min(this.canvas.width - 40, 380);
      const th = 36;
      const tx = (this.canvas.width - tw) / 2;
      const ty = 20;
      this.ctx.fillStyle =
        palette.bg === '#050508' ? 'rgba(30, 30, 35, 0.92)' : 'rgba(255, 255, 255, 0.95)';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      this.ctx.shadowBlur = 16;
      this.drawRoundRect(this.ctx, tx, ty, tw, th, 18);
      this.ctx.fill();
      this.ctx.strokeStyle =
        palette.bg === '#050508' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.fillStyle = palette.text;
      this.ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.toastText, this.canvas.width / 2, ty + 23);
      this.ctx.restore();
    }

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

  drawAppleCard(title, subtitle, action, accentColor = '#0071e3') {
    const palette = this.getActivePalette();
    const isDark = palette.bg === '#050508';
    const cardWidth = Math.min(this.canvas.width - 60, 520);
    const cardHeight = 260;
    const cx = (this.canvas.width - cardWidth) / 2;
    const cy = (this.canvas.height - cardHeight) / 2;

    this.ctx.save();
    // Backdrop overlay
    this.ctx.fillStyle = isDark ? 'rgba(5, 5, 8, 0.85)' : 'rgba(255, 255, 255, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Frosted Apple Card
    this.ctx.fillStyle = isDark ? 'rgba(28, 28, 30, 0.92)' : 'rgba(255, 255, 255, 0.95)';
    this.ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.15)';
    this.ctx.shadowBlur = 32;
    this.ctx.shadowOffsetY = 12;
    this.drawRoundRect(this.ctx, cx, cy, cardWidth, cardHeight, 20);
    this.ctx.fill();
    this.ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // Title
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.fillStyle = accentColor;
    this.ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(title, this.canvas.width / 2, cy + 65);

    // Subtitle
    this.ctx.fillStyle = isDark ? '#a1a1a6' : '#6e6e73';
    this.ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    this.ctx.fillText(subtitle, this.canvas.width / 2, cy + 115);

    // Action Capsule Button
    const btnW = 240;
    const btnH = 44;
    const btnX = (this.canvas.width - btnW) / 2;
    const btnY = cy + 160;
    this.ctx.fillStyle = accentColor;
    this.ctx.shadowColor = accentColor;
    this.ctx.shadowBlur = 18;
    this.drawRoundRect(this.ctx, btnX, btnY, btnW, btnH, 22);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    this.ctx.fillText(action, this.canvas.width / 2, btnY + 27);
    this.ctx.restore();
  }

  drawStartScreen() {
    const modeUpper = this.difficulty.toUpperCase();
    const accent =
      this.difficulty === 'nightmare'
        ? '#ff3b30'
        : this.difficulty === 'hard'
          ? '#ff9500'
          : '#0071e3';
    const subtitle =
      this.difficulty === 'normal'
        ? 'NORMAL MODE (ENDLESS) · SPACE / TAP TO RUN FOR HIGH SCORE'
        : `${modeUpper} MODE · SPACE / TAP TO ASCEND (0 → 1,000m)`;
    const action = this.isMobile ? 'Tap to Launch' : 'Press SPACE to Start';
    this.drawAppleCard('DEBUG ASCENT', subtitle, action, accent);
  }

  drawPauseOverlay() {
    const palette = this.getActivePalette();
    const isDark = palette.bg === '#050508';
    this.ctx.fillStyle = isDark ? 'rgba(5, 5, 8, 0.72)' : 'rgba(245, 245, 247, 0.72)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.fillStyle = palette.text;
    this.ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 10);
    this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    this.ctx.fillStyle = palette.accent;
    this.ctx.fillText(
      this.hasGamepad ? 'Press Start or SPACE to resume' : 'Press P or SPACE to resume',
      this.canvas.width / 2,
      this.canvas.height / 2 + 35
    );
    this.ctx.restore();
  }

  drawWinScreen() {
    const elapsedSec = (this.clearTime / 1000).toFixed(2);
    const deathsText = this.deaths === 0 ? 'Flawless Run (0 resets)' : `${this.deaths} resets`;
    const subtitle = `1,000m Cleared in ${elapsedSec}s · ${deathsText} · ${this.difficulty.toUpperCase()}`;
    const action = this.isMobile ? 'Tap to Replay' : 'Press SPACE to Replay';
    this.drawAppleCard('RESET PRESSED!', subtitle, action, '#34c759');
  }

  drawGameOver() {
    const fallenMeters =
      this.difficulty === 'normal'
        ? Math.floor(this.distance)
        : Math.min(1000, Math.floor(this.distance));
    const subtitle = `Failed at ${fallenMeters}m · Checkpoint Reset · ${this.difficulty.toUpperCase()}`;
    const action = this.isMobile ? 'Tap to Retry' : 'Press SPACE to Retry';
    this.drawAppleCard('DEPLOYMENT FAILED', subtitle, action, '#ff3b30');
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
  container.__game = game;
  if (typeof window !== 'undefined') {
    window.debugRunnerGame = game;
  }
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
