/**
 * Debug Runner - Premium Cyberpunk 2026 Edition
 * Portfolio Upgrade
 * Apple Arcade-inspired aesthetic with retro audio synthesis, parallax code rain,
 * a perspective-moving neon vector grid, and high-fidelity animations.
 */

class DebugRunner {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.gameRunning = false;
    this.gameOver = false;
    this.paused = false;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('debugRunnerHighScore')) || 0;
    this.speed = 8;
    this.level = 1;
    this.gameLoop = null;
    this.groundY = 320;
    this.dev = null;
    this.obstacles = [];
    this.powerUps = [];
    this.particles = [];
    this.lastScoreIncrement = 0;
    this.invincible = false;
    this.invincibleUntil = 0;
    this.trail = [];
    this.isMobile = this.detectMobile();
    this.mobileControls = null;
    this.frame = 0;
    this.highScoreDisplay = document.getElementById('game-high-score');
    this.scoreDisplay = document.getElementById('game-current-score');
    this.speedDisplay = document.getElementById('game-speed');
    this.lastUiHighScore = null;
    this.lastUiScore = null;
    this.lastUiSpeed = null;
    this.floatingTexts = [];
    this.nextNoteTime = 0;
    this.noteIndex = 0;

    // Audio & Sound
    this.audioCtx = null;
    this.muted = false;

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
        hero: '#1d1d1f',
        heroVisor: '#0071e3',
        heroGlow: 'rgba(0, 113, 227, 0.4)',
      },
    };

    this.colors = this.themes.dark;
    this.updateTheme();
    this.initBackgroundElements();
  }

  detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );
  }

  initBackgroundElements() {
    // Cyberpunk Stars/Nodes
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

    // Binary / Code rain streams (Matrix Cyberpunk Style)
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

  recordLeaderboardEntry() {
    const entry = { score: Math.floor(this.score / 10), at: Date.now() };
    let board = [];
    try {
      board = JSON.parse(localStorage.getItem('debugRunnerLeaderboard') || '[]');
      if (!Array.isArray(board)) board = [];
    } catch (_error) {
      board = [];
    }
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 3);
    localStorage.setItem('debugRunnerLeaderboard', JSON.stringify(board));
    this.renderLeaderboard(board);
  }

  renderLeaderboard(board = null) {
    if (!board) {
      try {
        board = JSON.parse(localStorage.getItem('debugRunnerLeaderboard') || '[]');
        if (!Array.isArray(board)) board = [];
      } catch (_error) {
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
      'Debug Runner Game - Use Space, Up arrow, or W to jump, and Down arrow or S to duck. Focus first to play.'
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
    this.canvas.addEventListener('click', e => {
      this.canvas.focus(); // Ensure canvas is focused so keyboard controls work instantly
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
    });

    this.updateTheme();
    this.setupThemeObserver();
    this.render();
    this.drawStartScreen();
    this.updateSideStats();

    this.renderLeaderboard();
    return this.canvas;
  }

  playSound(type) {
    if (this.muted) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
      } else if (type === 'nearmiss') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (_e) {
      console.warn('Audio synthesis blocked by browser security.', _e);
    }
  }

  createFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x: x,
      y: y,
      vy: -1.5,
      text: text,
      color: color,
      life: 1.0,
    });
  }

  playBackgroundMusic() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') return;

      const now = ctx.currentTime;
      if (!this.nextNoteTime || this.nextNoteTime < now) {
        this.nextNoteTime = now;
      }

      // Play note slightly ahead
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

        const tempo = Math.max(0.2, 0.42 - this.speed * 0.015);
        const rampEnd = Math.max(this.nextNoteTime + 0.04, this.nextNoteTime + tempo - 0.02);

        gain.gain.setValueAtTime(0, this.nextNoteTime);
        gain.gain.linearRampToValueAtTime(0.03, this.nextNoteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, rampEnd);

        osc.start(this.nextNoteTime);
        osc.stop(this.nextNoteTime + tempo);

        this.nextNoteTime += tempo;
        this.noteIndex++;
      }
    } catch (_err) {
      // Suppress procedural audio error
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
      } else {
        this.drawStartScreen();
      }
    }
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

    // Check if controls already exist
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

      btn.addEventListener('touchstart', start, { passive: true });
      btn.addEventListener('mousedown', start, { passive: true });
      btn.addEventListener('touchend', end, { passive: true });
      btn.addEventListener('mouseup', end, { passive: true });
      btn.addEventListener('mouseleave', end, { passive: true });
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
    const scoreValue = Math.floor(this.score / 10);
    if (this.scoreDisplay && this.lastUiScore !== scoreValue) {
      this.scoreDisplay.textContent = scoreValue;
      this.lastUiScore = scoreValue;
    }

    const highScoreValue = Math.floor(this.highScore / 10);
    if (this.highScoreDisplay && this.lastUiHighScore !== highScoreValue) {
      this.highScoreDisplay.textContent = highScoreValue;
      this.lastUiHighScore = highScoreValue;
    }

    const speedMultiplier = Math.max(1, this.speed / 8);
    const speedLabel = `${speedMultiplier.toFixed(1)}x`;
    if (this.speedDisplay && this.lastUiSpeed !== speedLabel) {
      this.speedDisplay.textContent = speedLabel;
      this.lastUiSpeed = speedLabel;
    }
  }

  vibrate(duration) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch (_e) {
        // Suppress vibration security errors
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

      // Only handle game controls if the canvas has focus to avoid keyboard trapping / scroll hijacking
      if (document.activeElement !== this.canvas) return;

      if (e.type === 'keydown') {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          if (!this.gameRunning || this.gameOver) {
            this.start();
          } else {
            this.jump();
          }
        }
        if ((e.code === 'ArrowDown' || e.code === 'KeyS') && this.gameRunning) {
          e.preventDefault();
          this.duck();
        }
      } else if (e.type === 'keyup') {
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          this.standUp();
        }
      }
    };

    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      document.removeEventListener('keyup', this.keyHandler);
    }

    document.addEventListener('keydown', handleInput);
    document.addEventListener('keyup', handleInput);
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
      { passive: true }
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
              setTimeout(() => this.standUp(), 400);
            }
          } else if (diffX < 15 && Math.abs(diffY) < 15) {
            this.jump();
            this.vibrate(12);
          }
        }
      },
      { passive: true }
    );
  }

  start() {
    if (this.gameRunning && !this.gameOver) return;

    this.gameRunning = true;
    this.gameOver = false;
    this.paused = false;
    this.score = 0;
    this.speed = 8;
    this.level = 1;
    this.obstacles = [];
    this.powerUps = [];
    this.particles = [];
    this.floatingTexts = [];
    this.nextNoteTime = 0;
    this.noteIndex = 0;
    this.resetHero();
    this.updateSideStats();
    this.playSound('powerup');

    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }

    const loop = () => {
      if (!this.gameRunning || this.paused) return;
      this.update();
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
    this.playSound('gameover');
    this.vibrate([60, 120, 60]);
    this.drawGameOver();
  }

  pause() {
    if (!this.gameRunning || this.gameOver) return;
    this.paused = true;
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }
  }

  resume() {
    if (!this.gameRunning || !this.paused || this.gameOver) return;
    this.paused = false;

    if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
    const loop = () => {
      if (!this.gameRunning || this.paused) return;
      this.update();
      this.gameLoop = requestAnimationFrame(loop);
    };
    this.gameLoop = requestAnimationFrame(loop);
  }

  jump() {
    if (this.dev.onGround && !this.dev.isDucking) {
      this.dev.velocityY = -this.dev.jumpPower;
      this.dev.onGround = false;
      this.playSound('jump');
      // Dust particles on jump
      this.createParticles(this.dev.x + 10, this.groundY, 8, 'rgba(0, 113, 227, 0.4)');
    }
  }

  duck() {
    if (this.dev.onGround) {
      this.dev.isDucking = true;
      this.dev.height = 30;
      this.dev.y = this.groundY - 30;
      // Sliding particles
      this.createParticles(this.dev.x + 20, this.groundY, 3, this.colors.accent);
    }
  }

  standUp() {
    this.dev.isDucking = false;
    this.dev.height = 56;
    this.dev.y = this.groundY - 56;
  }

  update() {
    // Background music loop
    if (this.gameRunning && !this.paused && !this.muted) {
      this.playBackgroundMusic();
    }

    // Gravity & physics
    this.dev.velocityY += 0.82;
    this.dev.y += this.dev.velocityY;

    // Ground check
    if (this.dev.y >= this.groundY - this.dev.height) {
      this.dev.y = this.groundY - this.dev.height;
      this.dev.velocityY = 0;
      this.dev.onGround = true;
    }

    // Spin during jump
    if (!this.dev.onGround) {
      this.dev.rotation += 0.1;
    } else {
      this.dev.rotation = 0;
    }

    // Sparks while sliding (ducking)
    if (this.dev.isDucking && this.dev.onGround && this.frame % 3 === 0) {
      this.createParticles(this.dev.x + 10, this.groundY, 2, '#FFD60A');
    }

    // Speed progression
    this.speed += 0.0012;

    // Score increments
    this.score++;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('debugRunnerHighScore', this.highScore);
    }

    // Level up logic
    const newLevel = Math.floor(this.score / 1200) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.speed += 1.2;
      this.screenShake = 22;
      this.playSound('levelup');
      this.createParticles(this.canvas.width / 2, this.canvas.height / 2, 45, this.colors.accent);
      this.showLevelMessageUntil = Date.now() + 2000;
    }

    // Move grid offsets
    this.gridOffset = (this.gridOffset - this.speed) % 80;

    this.updateObstacles();
    this.updatePowerUps();
    this.updateParticles();

    // Update floating texts
    this.floatingTexts.forEach(ft => {
      ft.y += ft.vy;
      ft.life -= 0.02;
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
      });
      if (this.trail.length > 6) this.trail.shift();
      this.trail.forEach(t => (t.opacity -= 0.08));
    }
  }

  updateObstacles() {
    // Spawning frequency proportional to speed
    const spawnRate = 0.012 + this.level * 0.002;
    if (Math.random() < Math.min(0.03, spawnRate)) {
      const type = Math.random();
      const obstacle = { x: 1250, speed: this.speed };

      if (type < 0.25) {
        // Bug obstacle
        obstacle.type = 'bug';
        obstacle.y = this.groundY - 32;
        obstacle.width = 32;
        obstacle.height = 32;
        obstacle.color = this.colors.bug;
      } else if (type < 0.5) {
        // Merge Conflict obstacle
        obstacle.type = 'conflict';
        obstacle.y = this.groundY - 48;
        obstacle.width = 36;
        obstacle.height = 48;
        obstacle.color = this.colors.conflict;
      } else if (type < 0.75) {
        // Firewall Flame
        obstacle.type = 'fire';
        obstacle.y = this.groundY - 38;
        obstacle.width = 38;
        obstacle.height = 38;
        obstacle.color = this.colors.fire;
      } else {
        // Null Pointer overhead obstacle (requires ducking!)
        obstacle.type = 'pointer';
        obstacle.y = this.groundY - 58;
        obstacle.width = 40;
        obstacle.height = 24;
        obstacle.color = '#BF5AF2'; // Purple
      }

      // Check distance from last obstacle
      const lastObs = this.obstacles[this.obstacles.length - 1];
      if (!lastObs || 1200 - lastObs.x > 260 + this.speed * 8) {
        this.obstacles.push(obstacle);
      }
    }

    this.obstacles.forEach(obs => (obs.x -= obs.speed));
    this.obstacles = this.obstacles.filter(obs => obs.x > -100);
  }

  updatePowerUps() {
    if (Math.random() < 0.003) {
      const type = Math.random() > 0.45 ? 'coffee' : 'stackoverflow';
      this.powerUps.push({
        x: 1250,
        y: this.groundY - 90 - Math.random() * 70,
        width: 32,
        height: 32,
        type: type,
        speed: this.speed * 0.85,
      });
    }

    this.powerUps.forEach(p => (p.x -= p.speed));
    this.powerUps = this.powerUps.filter(p => p.x > -100);

    if (this.invincible && Date.now() > this.invincibleUntil) {
      this.invincible = false;
    }
  }

  createParticles(x, y, count, color) {
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

  updateParticles() {
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.045;
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

    if (!this.invincible) {
      for (const obs of this.obstacles) {
        if (this.rectIntersect(heroRect, obs)) {
          this.screenShake = 22;
          this.gameOver = true;
          this.createParticles(this.dev.x + 20, this.dev.y + 20, 35, this.colors.bug);
          this.stop();
          this.recordLeaderboardEntry();
          return;
        }
      }
    }

    // Near miss detection (skip when invincible — passing through doesn't count)
    if (!this.invincible) {
      for (const obs of this.obstacles) {
        if (
          !obs.nearMissChecked &&
          obs.x < this.dev.x + this.dev.width &&
          obs.x + obs.width > this.dev.x
        ) {
          obs.nearMissChecked = true;
          const distY = Math.abs(this.dev.y + this.dev.height / 2 - (obs.y + obs.height / 2));
          if (distY > 15 && distY < 85) {
            this.score += 200;
            this.playSound('nearmiss');
            this.createFloatingText(
              obs.x + obs.width / 2,
              obs.y - 12,
              '+200 NEAR MISS!',
              '#00E5FF'
            );
            this.createParticles(obs.x + obs.width / 2, obs.y, 6, '#00E5FF');
          }
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      if (this.rectIntersect(heroRect, this.powerUps[i])) {
        const p = this.powerUps[i];
        this.playSound('powerup');
        this.vibrate(20);

        if (p.type === 'coffee') {
          this.score += 600;
          this.createParticles(p.x + 16, p.y + 16, 18, this.colors.coffee);
        } else {
          this.invincible = true;
          this.invincibleUntil = Date.now() + 6000;
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

  render() {
    this.ctx.save();

    // 1. Shake Effect
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(dx, dy);
    }

    // 2. Cyberpunk Background Gradient
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
    if (this.colors.bg === '#050508') {
      bgGrad.addColorStop(0, '#04020a');
      bgGrad.addColorStop(1, '#0e0b24');
    } else {
      bgGrad.addColorStop(0, '#f5f5f7');
      bgGrad.addColorStop(1, '#e5e7eb');
    }
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 3. Cyber Starfield / Nodes
    this.ctx.fillStyle = this.colors.text;
    this.neonStars.forEach(star => {
      this.ctx.globalAlpha = star.opacity;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
      star.x -= star.speed * (this.speed * 0.15);
      if (star.x < 0) star.x = 1200;
    });

    // 4. Parallax Scrolling Binary Stream
    this.binaryStreams.forEach(stream => {
      this.ctx.fillStyle = this.colors.accent;
      this.ctx.globalAlpha = stream.opacity;
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
    this.ctx.globalAlpha = 1.0;

    // 5. Vector Grid Horizon Line
    const horizonGrad = this.ctx.createLinearGradient(0, this.groundY - 60, 0, this.groundY);
    horizonGrad.addColorStop(0, 'rgba(10, 132, 255, 0)');
    horizonGrad.addColorStop(1, this.colors.gridHorizon);
    this.ctx.fillStyle = horizonGrad;
    this.ctx.fillRect(0, this.groundY - 60, this.canvas.width, 60);

    // 6. Perspective Neon Grid Floor
    this.ctx.strokeStyle = this.colors.gridLine;
    this.ctx.lineWidth = 1.5;

    // Horizontal grid lines moving with speed
    const floorHeight = this.canvas.height - this.groundY;
    for (let yOffset = 0; yOffset < floorHeight; yOffset += 20) {
      // Perspective scaling for depth
      const currentY = this.groundY + yOffset;
      this.ctx.beginPath();
      this.ctx.moveTo(0, currentY);
      this.ctx.lineTo(this.canvas.width, currentY);
      this.ctx.stroke();
    }

    // Perspective vertical grid lines spreading from horizon point
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

    // Ground Edge line
    this.ctx.strokeStyle = this.colors.accent;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY);
    this.ctx.lineTo(this.canvas.width, this.groundY);
    this.ctx.stroke();

    // 7. Render Particles
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1.0;

    // 8. Render PowerUps
    this.powerUps.forEach(p => {
      this.ctx.save();
      this.ctx.shadowColor = p.type === 'coffee' ? this.colors.coffee : this.colors.stackOverflow;
      this.ctx.shadowBlur = 12;

      // Draw floating icon container
      const bounce = Math.sin(this.frame * 0.12) * 5;
      this.ctx.fillStyle =
        p.type === 'coffee' ? 'rgba(48, 209, 88, 0.2)' : 'rgba(191, 90, 242, 0.2)';
      this.ctx.strokeStyle = p.type === 'coffee' ? this.colors.coffee : this.colors.stackOverflow;
      this.ctx.lineWidth = 2;
      this.drawRoundedRect(this.ctx, p.x, p.y + bounce, p.width, p.height, 8);
      this.ctx.fill();
      this.ctx.stroke();

      // Render inner text symbol
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(p.type === 'coffee' ? '☕' : 'SO', p.x + 16, p.y + bounce + 20);
      this.ctx.restore();
    });

    // 9. Render Obstacles
    this.obstacles.forEach(obs => {
      this.ctx.save();
      this.ctx.shadowColor = obs.color;
      this.ctx.shadowBlur = 10;

      if (obs.type === 'bug') {
        // Draw Cyberbug animated beetle
        const bugX = obs.x + obs.width / 2;
        const bugY = obs.y + obs.height / 2;

        // Legs wiggling
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

        // Insect body
        this.ctx.fillStyle = obs.color;
        this.ctx.beginPath();
        this.ctx.ellipse(bugX, bugY, 12, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Antennae
        this.ctx.beginPath();
        this.ctx.moveTo(bugX - 4, bugY - 8);
        this.ctx.quadraticCurveTo(bugX - 10, bugY - 16, bugX - 14, bugY - 14 + legSwing);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(bugX + 4, bugY - 8);
        this.ctx.quadraticCurveTo(bugX + 10, bugY - 16, bugX + 14, bugY - 14 - legSwing);
        this.ctx.stroke();
      } else if (obs.type === 'conflict') {
        // Glitchy Holographic Git Conflict
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

        // Inner Warning Symbol exclamation
        this.ctx.fillStyle = obs.color;
        this.ctx.font = 'bold 18px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('!', obs.x + obs.width / 2, obs.y + obs.height - 10);
      } else if (obs.type === 'fire') {
        // Firewall animated flames
        const px = obs.x;
        const py = obs.y;
        const pw = obs.width;
        const ph = obs.height;

        this.ctx.fillStyle = this.colors.fire;
        this.ctx.beginPath();
        this.ctx.moveTo(px, py + ph);
        // Animate flame tips
        const flameOffset1 = Math.sin(this.frame * 0.25) * 5;
        const flameOffset2 = Math.cos(this.frame * 0.3) * 6;
        this.ctx.quadraticCurveTo(px + pw * 0.2, py + flameOffset1, px + pw * 0.35, py + ph * 0.2);
        this.ctx.quadraticCurveTo(px + pw * 0.5, py + flameOffset2, px + pw * 0.65, py + ph * 0.35);
        this.ctx.quadraticCurveTo(px + pw * 0.8, py - flameOffset1, px + pw, py + ph);
        this.ctx.closePath();
        this.ctx.fill();
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
        this.ctx.fillText('NULL', bugX, obs.y - 4);
      }
      this.ctx.restore();
    });

    // 10. Hero Trails
    this.trail.forEach(t => {
      this.ctx.save();
      this.ctx.globalAlpha = t.opacity;
      this.ctx.fillStyle = this.invincible ? 'rgba(255, 214, 10, 0.15)' : 'rgba(0, 113, 227, 0.15)';
      this.drawRoundedRect(this.ctx, t.x, t.y, t.w, t.h, 12);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 11. Animated Player Character (Cyber Hacker)
    this.ctx.save();
    if (this.invincible) {
      this.ctx.shadowColor = '#FFD60A';
      this.ctx.shadowBlur = 24;
      // Flash orange/yellow
      this.ctx.fillStyle = this.frame % 6 < 3 ? '#FFD60A' : '#FF9500';
    } else {
      this.ctx.shadowColor = this.colors.accent;
      this.ctx.shadowBlur = 12;
      this.ctx.fillStyle = this.colors.hero;
    }

    const px = this.dev.x;
    const py = this.dev.y;
    const pw = this.dev.width;
    const ph = this.dev.height;

    // Apply rotation for jump spin
    if (!this.dev.onGround) {
      this.ctx.translate(px + pw / 2, py + ph / 2);
      this.ctx.rotate(this.dev.rotation);
      this.ctx.translate(-(px + pw / 2), -(py + ph / 2));
    }

    // Cyber Suit Hood/Head
    this.ctx.beginPath();
    this.ctx.arc(px + pw / 2, py + 12, 12, 0, Math.PI * 2);
    this.ctx.fill();

    // Cyber Visor Glow
    this.ctx.fillStyle = this.invincible ? '#ffffff' : this.colors.heroVisor;
    this.ctx.fillRect(px + pw / 2 - 2, py + 8, 12, 4);

    // Glowing Cyber Coat Body
    this.ctx.fillStyle = this.invincible ? '#FFD60A' : this.colors.hero;
    this.drawRoundedRect(this.ctx, px + 2, py + 22, pw - 4, ph - 30, 8);
    this.ctx.fill();

    // Leg running cycles
    const cycle = Math.sin(this.frame * 0.22) * 8;
    this.ctx.fillStyle = this.colors.accent;
    if (this.dev.onGround) {
      // Runner leg 1
      this.drawRoundedRect(this.ctx, px + 6, py + ph - 8 + cycle, 12, 8, 4);
      this.ctx.fill();
      // Runner leg 2
      this.drawRoundedRect(this.ctx, px + pw - 18, py + ph - 8 - cycle, 12, 8, 4);
      this.ctx.fill();
    } else {
      // Tuck legs on jump
      this.drawRoundedRect(this.ctx, px + 6, py + ph - 12, 12, 12, 4);
      this.ctx.fill();
      this.drawRoundedRect(this.ctx, px + pw - 18, py + ph - 12, 12, 12, 4);
      this.ctx.fill();
    }

    this.ctx.restore();

    // 12. Arcade CRT Scanlines & Screen Filter
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.canvas.height; i += 4) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // 13. UI HUD Stats & Progress Bar
    this.ctx.save();
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 24px monospace';
    this.ctx.fillText(`SCORE: ${Math.floor(this.score / 10)}`, 30, 45);

    this.ctx.fillStyle = this.colors.textSecondary;
    this.ctx.font = '14px monospace';
    this.ctx.fillText(`HI: ${Math.floor(this.highScore / 10)}`, 30, 72);

    // Audio Speaker Icon (Interactive)
    this.ctx.fillStyle = this.muted ? '#ff3b30' : this.colors.accent;
    this.ctx.beginPath();
    this.ctx.arc(1155, 35, 18, 0, Math.PI * 2);
    this.ctx.fillStyle = this.muted ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0, 113, 227, 0.15)';
    this.ctx.fill();
    this.ctx.strokeStyle = this.muted ? '#ff3b30' : this.colors.accent;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // Speaker Shape
    this.ctx.fillStyle = this.muted ? '#ff3b30' : this.colors.text;
    this.ctx.beginPath();
    this.ctx.moveTo(1146, 31);
    this.ctx.lineTo(1151, 31);
    this.ctx.lineTo(1156, 26);
    this.ctx.lineTo(1156, 44);
    this.ctx.lineTo(1151, 39);
    this.ctx.lineTo(1146, 39);
    this.ctx.closePath();
    this.ctx.fill();

    // Muted X or waves
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
      // Sound waves
      this.ctx.strokeStyle = this.colors.text;
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

    // Bar background
    this.ctx.fillStyle = this.colors.bg === '#050508' ? '#1c1c1e' : '#e5e7eb';
    this.drawRoundedRect(this.ctx, barX, barY, barWidth, barHeight, 4);
    this.ctx.fill();

    // Bar progress fill
    const gradFill = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradFill.addColorStop(0, '#00E5FF');
    gradFill.addColorStop(1, this.colors.accent);
    this.ctx.fillStyle = gradFill;
    const fillWidth = barWidth * progress;
    if (fillWidth > 1) {
      this.drawRoundedRect(this.ctx, barX, barY, fillWidth, barHeight, 4);
      this.ctx.fill();
    }

    // Progress Level Label
    this.ctx.fillStyle = this.colors.textSecondary;
    this.ctx.font = 'bold 11px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`LEVEL ${this.level}`, this.canvas.width / 2, 28);
    this.ctx.textAlign = 'left';

    if (this.invincible) {
      this.ctx.fillStyle = '#FFD60A';
      this.ctx.font = 'bold 14px monospace';
      this.ctx.fillText('⚡ SHIELD ACTIVE', this.canvas.width - 290, 45);
    }
    this.ctx.restore();

    // 14. Level Up Banner Display
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

    // 15. Render Floating Texts
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      this.ctx.globalAlpha = ft.life;
      this.ctx.fillStyle = ft.color;
      this.ctx.font = 'bold 12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    this.ctx.restore(); // Screen shake restore

    // 16. Chromatic Aberration / Canvas Glitch Slice Effect
    if (this.gameRunning && this.screenShake > 0 && Math.random() < 0.45) {
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
    this.ctx.fillStyle =
      this.colors.bg === '#050508' ? 'rgba(5, 5, 8, 0.75)' : 'rgba(245, 245, 247, 0.75)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 64px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = this.colors.accent;
    this.ctx.shadowBlur = 15;
    this.ctx.fillText('DEBUG RUNNER', this.canvas.width / 2, this.canvas.height / 2 - 25);

    this.ctx.font = '24px monospace';
    this.ctx.fillStyle = this.colors.accent;
    const startText = this.isMobile ? 'Tap to Initialize' : 'Press SPACE or Tap to Initialize';
    this.ctx.fillText(startText, this.canvas.width / 2, this.canvas.height / 2 + 35);

    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = this.colors.textSecondary;
    const controlsInfo = this.isMobile
      ? 'Use buttons below to Jump & Duck'
      : 'W/Space = Jump, S/Arrow Down = Duck';
    this.ctx.fillText(controlsInfo, this.canvas.width / 2, this.canvas.height / 2 + 75);
    this.ctx.restore();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
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

  drawGameOver() {
    this.ctx.fillStyle =
      this.colors.bg === '#050508' ? 'rgba(5, 5, 8, 0.88)' : 'rgba(245, 245, 247, 0.88)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.fillStyle = this.colors.bug;
    this.ctx.font = 'bold 72px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = this.colors.bug;
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('CRITICAL EXCEPTION', this.canvas.width / 2, this.canvas.height / 2 - 30);

    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '28px monospace';
    this.ctx.fillText(
      `Final Score: ${Math.floor(this.score / 10)}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 35
    );

    this.ctx.fillStyle = this.colors.accent;
    this.ctx.font = '18px monospace';
    const restartText = this.isMobile ? 'Tap to Re-compile' : 'Press SPACE or Tap to Re-compile';
    this.ctx.fillText(restartText, this.canvas.width / 2, this.canvas.height / 2 + 80);
    this.ctx.restore();
  }
}

export default DebugRunner;

// Auto-initialize
const initDebugRunner = () => {
  if (
    window.__PERF_AUDIT__ === true ||
    new URLSearchParams(window.location.search).has('perf-audit')
  ) {
    return;
  }

  const container = document.getElementById('debug-runner-container');
  if (container) {
    const game = new DebugRunner();
    const canvas = game.init();
    container.appendChild(canvas);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        game.pause();
      } else {
        game.resume();
      }
    });

    const observerOptions = {
      threshold: 0.1,
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          game.resume();
        } else {
          game.pause();
        }
      });
    }, observerOptions);
    observer.observe(container);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDebugRunner);
} else {
  initDebugRunner();
}
