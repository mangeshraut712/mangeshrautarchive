/**
 * Debug Runner - Premium Coding Game
 * 2025 Portfolio Upgrade
 * Apple Arcade-inspired aesthetic with smooth physics and polished visuals.
 * Enhanced with mobile controls and full theme awareness
 */

class DebugRunner {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('debugRunnerHighScore')) || 0;
        this.speed = 8;
        this.gameLoop = null;
        this.groundY = 320;
        this.dev = null;
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];
        this.lastScoreIncrement = 0;
        this.invincible = false;
        this.invincibleUntil = 0;
        this.coffeePower = 0;
        this.stars = [];
        this.isMobile = this.detectMobile();
        this.mobileControls = null;

        // Premium Color Palette (Apple-inspired)
        this.themes = {
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
                heroGlow: 'rgba(255, 255, 255, 0.5)'
            },
            light: {
                bg: '#f5f5f7',
                ground: '#ffffff',
                groundLine: '#d2d2d7',
                text: '#1d1d1f',
                textSecondary: '#86868b',
                accent: '#0071e3',
                bug: '#ff3b30',
                conflict: '#ffcc00',
                fire: '#ff9500',
                coffee: '#a2845e',
                stackOverflow: '#f48024',
                hero: '#1d1d1f',
                heroGlow: 'rgba(0, 0, 0, 0.2)'
            }
        };

        this.colors = this.themes.dark; // Default
        this.updateTheme();
        this.initStars();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth <= 768;
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * 1200,
                y: Math.random() * 400,
                size: Math.random() * 2,
                opacity: Math.random()
            });
        }
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'debug-runner-canvas';
        this.canvas.width = 1200;
        this.canvas.height = 400;

        // Modern Canvas Styling
        Object.assign(this.canvas.style, {
            background: this.colors.bg,
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            height: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            border: `1px solid ${this.colors.groundLine}`,
            touchAction: 'none'
        });

        this.ctx = this.canvas.getContext('2d');

        // Initialize Hero
        this.resetHero();

        this.setupControls();
        this.setupTouchControls();

        // Always create mobile controls for better gameplay experience
        this.createMobileControls();

        // Initial Render
        this.updateTheme();
        this.setupThemeObserver();
        this.render();
        this.drawStartScreen();

        return this.canvas;
    }

    updateTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        this.colors = isDark ? this.themes.dark : this.themes.light;

        if (this.canvas) {
            this.canvas.style.background = this.colors.bg;
            this.canvas.style.borderColor = this.colors.groundLine;
        }

        // Update mobile controls theme
        if (this.mobileControls) {
            this.updateMobileControlsTheme();
        }

        // Force redraw if not running
        if (!this.gameRunning && this.ctx) {
            if (this.gameOver) {
                this.drawGameOver();
            } else {
                this.drawStartScreen();
            }
        }
    }

    setupThemeObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    this.updateTheme();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true
        });
    }

    createMobileControls() {
        const container = document.getElementById('debug-runner-container');
        if (!container || !container.parentElement) return;

        // Create controls wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'debug-runner-mobile-controls';
        wrapper.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            width: 100%;
            max-width: 600px;
            margin: 20px auto 0;
            padding: 0 10px;
            box-sizing: border-box;
            position: relative;
            z-index: 10;
        `;

        // Helper to handle interactions
        const bindAction = (btn, action, endAction) => {
            const start = (e) => {
                if (e.cancelable) e.preventDefault();

                // Auto-start game if not running
                if (!this.gameRunning || this.gameOver) {
                    this.start();
                }

                action();
                e.preventDefault();
                startAction();
                btn.style.transform = 'scale(0.92)';
            };
            const end = (e) => {
                e.preventDefault();
                if (endAction) endAction();
                btn.style.transform = 'scale(1)';
            };

            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('mousedown', start);

            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        };

        // Jump Button
        const jumpBtn = document.createElement('button');
        jumpBtn.className = 'mobile-control-jump';
        jumpBtn.innerHTML = '<i class="fas fa-arrow-up mr-2"></i> JUMP';
        bindAction(jumpBtn, () => this.jump());

        // Duck Button
        const duckBtn = document.createElement('button');
        duckBtn.className = 'mobile-control-duck';
        duckBtn.innerHTML = '<i class="fas fa-arrow-down mr-2"></i> DUCK';
        bindAction(duckBtn, () => this.duck(), () => this.standUp());

        wrapper.appendChild(jumpBtn);
        wrapper.appendChild(duckBtn);

        container.parentElement.appendChild(wrapper);
        this.mobileControls = wrapper;
    }


    vibrate(duration) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }

    resetHero() {
        this.dev = {
            x: 100,
            y: this.groundY - 50,
            width: 40,
            height: 50,
            velocityY: 0,
            onGround: true,
            jumpPower: 16,
            rotation: 0
        };
    }

    setupControls() {
        const handleInput = (e) => {
            // Ignore if typing in an input or textarea
            if (['INPUT', 'TEXTAREA', 'SELECT', 'CONTENTEDITABLE'].includes(e.target.tagName)) return;

            if (e.type === 'keydown') {
                if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) {
                    e.preventDefault();
                    if (!this.gameRunning && !this.gameOver) {
                        this.start();
                    } else if (this.gameOver) {
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

        document.addEventListener('keydown', handleInput);
        document.addEventListener('keyup', handleInput);
        this.keyHandler = handleInput;
    }

    setupTouchControls() {
        let touchStartY = 0;
        let touchStartX = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;

            if (!this.gameRunning || this.gameOver) {
                this.start();
                this.vibrate(20);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndX = e.changedTouches[0].clientX;
            const diffY = touchEndY - touchStartY;
            const diffX = Math.abs(touchEndX - touchStartX);

            if (this.gameRunning) {
                // Prioritize vertical swipes
                if (Math.abs(diffY) > diffX) {
                    if (diffY < -30) { // Swipe Up
                        this.jump();
                        this.vibrate(10);
                    } else if (diffY > 30) { // Swipe Down
                        this.duck();
                        this.vibrate(10);
                        setTimeout(() => this.standUp(), 500);
                    }
                } else if (diffX < 20 && Math.abs(diffY) < 20) {
                    // Tap
                    this.jump();
                    this.vibrate(10);
                }
            }
        }, { passive: false });
    }

    start() {
        if (this.gameRunning) return;

        this.gameRunning = true;
        this.gameOver = false;
        this.score = 0;
        this.speed = 8;
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];
        this.resetHero();

        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), 1000 / 60);

        this.vibrate(30);
        console.log('🚀 Game Started');
    }

    stop() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        this.vibrate([50, 100, 50]);
        this.drawGameOver();
    }

    jump() {
        if (this.dev.onGround) {
            this.dev.velocityY = -this.dev.jumpPower;
            this.dev.onGround = false;
            this.createParticles(this.dev.x + 20, this.dev.y + 50, 5, '#fff');
        }
    }

    duck() {
        if (this.dev.onGround) {
            this.dev.height = 25;
            this.dev.y = this.groundY - 25;
        }
    }

    standUp() {
        this.dev.height = 50;
        this.dev.y = this.groundY - 50;
    }

    update() {
        // Physics
        this.dev.velocityY += 0.8; // Gravity
        this.dev.y += this.dev.velocityY;

        // Ground Collision
        if (this.dev.y >= this.groundY - this.dev.height) {
            this.dev.y = this.groundY - this.dev.height;
            this.dev.velocityY = 0;
            this.dev.onGround = true;
        }

        // Speed Progression
        this.speed += 0.001;

        // Score
        this.score++;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('debugRunnerHighScore', this.highScore);
        }

        this.updateObstacles();
        this.updatePowerUps();
        this.updateParticles();
        this.checkCollisions();
        this.checkMilestones();

        this.render();
    }

    checkMilestones() {
        if (this.score >= 500) {
            const archReward = document.getElementById('reward-arch');
            if (archReward && archReward.classList.contains('locked')) {
                archReward.classList.remove('locked');
                archReward.classList.add('unlocked');
                archReward.querySelector('p').textContent = '🔓 Click to Open';
                this.vibrate([100, 50, 100]);
            }
        }

        if (this.score >= 1000) {
            const apiReward = document.getElementById('reward-api');
            if (apiReward && apiReward.classList.contains('locked')) {
                apiReward.classList.remove('locked');
                apiReward.classList.add('unlocked');
                apiReward.querySelector('p').textContent = '🔓 Click to Open';
                this.vibrate([100, 50, 100]);
            }
        }
    }

    updateObstacles() {
        // Spawn Logic
        if (Math.random() < 0.015) {
            const type = Math.random();
            let obstacle = { x: 1200, speed: this.speed };

            if (type < 0.33) { // Bug
                obstacle.type = 'bug';
                obstacle.y = this.groundY - 30;
                obstacle.width = 30;
                obstacle.height = 30;
                obstacle.color = this.colors.bug;
            } else if (type < 0.66) { // Conflict
                obstacle.type = 'conflict';
                obstacle.y = this.groundY - 40;
                obstacle.width = 30;
                obstacle.height = 40;
                obstacle.color = this.colors.conflict;
            } else { // Fire
                obstacle.type = 'fire';
                obstacle.y = this.groundY - 35;
                obstacle.width = 35;
                obstacle.height = 35;
                obstacle.color = this.colors.fire;
            }

            // Don't spawn if too close to another
            const lastObs = this.obstacles[this.obstacles.length - 1];
            if (!lastObs || (1200 - lastObs.x > 250)) {
                this.obstacles.push(obstacle);
            }
        }

        this.obstacles.forEach(obs => obs.x -= obs.speed);
        this.obstacles = this.obstacles.filter(obs => obs.x > -100);
    }

    updatePowerUps() {
        if (Math.random() < 0.002) {
            const type = Math.random() > 0.5 ? 'coffee' : 'stackoverflow';
            this.powerUps.push({
                x: 1200,
                y: this.groundY - 100 - Math.random() * 50,
                width: 30,
                height: 30,
                type: type,
                speed: this.speed * 0.8
            });
        }
        this.powerUps.forEach(p => p.x -= p.speed);
        this.powerUps = this.powerUps.filter(p => p.x > -100);

        // Powerup Timers
        if (this.invincible) {
            if (Date.now() > this.invincibleUntil) this.invincible = false;
        }
    }

    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1.0,
                color: color
            });
        }
    }

    updateParticles() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    checkCollisions() {
        const heroRect = { x: this.dev.x + 5, y: this.dev.y + 5, width: this.dev.width - 10, height: this.dev.height - 10 };

        // Obstacles
        if (!this.invincible) {
            for (let obs of this.obstacles) {
                if (this.rectIntersect(heroRect, obs)) {
                    this.gameOver = true;
                    this.createParticles(this.dev.x, this.dev.y, 20, this.colors.bug);
                    this.stop();
                    return;
                }
            }
        }

        // Powerups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            if (this.rectIntersect(heroRect, this.powerUps[i])) {
                const p = this.powerUps[i];
                this.createParticles(p.x, p.y, 10, this.colors.accent);

                if (p.type === 'coffee') {
                    this.score += 500;
                } else {
                    this.invincible = true;
                    this.invincibleUntil = Date.now() + 5000;
                }

                this.vibrate(15);
                this.powerUps.splice(i, 1);
            }
        }
    }

    rectIntersect(r1, r2) {
        return !(r2.x > r1.x + r1.width ||
            r2.x + r2.width < r1.x ||
            r2.y > r1.y + r1.height ||
            r2.y + r2.height < r1.y);
    }

    render() {
        // Clear
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Stars (only in dark mode)
        if (this.colors.bg === '#000000') {
            this.ctx.fillStyle = '#ffffff';
            this.stars.forEach(star => {
                this.ctx.globalAlpha = star.opacity;
                this.ctx.fillRect(star.x, star.y, star.size, star.size);
            });
            this.ctx.globalAlpha = 1.0;
        }

        // Ground
        this.ctx.fillStyle = this.colors.ground;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        this.ctx.strokeStyle = this.colors.groundLine;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();

        // Hero
        this.ctx.save();
        this.ctx.shadowColor = this.colors.accent;
        this.ctx.shadowBlur = this.invincible ? 20 : 10;
        this.ctx.fillStyle = this.invincible ? '#FFD60A' : this.colors.hero;

        const x = this.dev.x;
        const y = this.dev.y;
        const w = this.dev.width;
        const h = this.dev.height;

        // Head
        this.ctx.beginPath();
        this.ctx.arc(x + w / 2, y + 10, 10, 0, Math.PI * 2);
        this.ctx.fill();
        // Body
        this.ctx.fillRect(x, y + 20, w, h - 20);
        // Eyes
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(x + w / 2 - 4, y + 8, 2, 2);
        this.ctx.fillRect(x + w / 2 + 2, y + 8, 2, 2);

        this.ctx.restore();

        // Obstacles
        this.obstacles.forEach(obs => {
            this.ctx.fillStyle = obs.color;
            this.ctx.shadowColor = obs.color;
            this.ctx.shadowBlur = 10;

            if (obs.type === 'bug') {
                this.ctx.beginPath();
                this.ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (obs.type === 'conflict') {
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x + obs.width / 2, obs.y);
                this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                this.ctx.lineTo(obs.x, obs.y + obs.height);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            }
            this.ctx.shadowBlur = 0;
        });

        // Powerups
        this.powerUps.forEach(p => {
            this.ctx.fillStyle = p.type === 'coffee' ? this.colors.coffee : this.colors.stackOverflow;
            this.ctx.fillRect(p.x, p.y, p.width, p.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(p.type === 'coffee' ? '☕' : 'SO', p.x + 4, p.y + 20);
        });

        // Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(p.x, p.y, 3, 3);
        });
        this.ctx.globalAlpha = 1.0;

        // UI
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        this.ctx.fillText(`SCORE: ${Math.floor(this.score / 10)}`, 30, 50);

        this.ctx.fillStyle = this.colors.textSecondary;
        this.ctx.font = '20px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        this.ctx.fillText(`HI: ${Math.floor(this.highScore / 10)}`, 30, 80);

        // Show invincibility status
        if (this.invincible) {
            this.ctx.fillStyle = '#FFD60A';
            this.ctx.font = 'bold 16px -apple-system';
            this.ctx.fillText('⚡ INVINCIBLE', this.canvas.width - 150, 50);
        }
    }

    drawStartScreen() {
        this.ctx.fillStyle = this.colors.bg === '#000000' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 60px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("DEBUG RUNNER", this.canvas.width / 2, this.canvas.height / 2 - 30);

        this.ctx.font = '30px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        this.ctx.fillStyle = this.colors.accent;
        const startText = this.isMobile ? "Tap to Start" : "Press Space or Tap to Start";
        this.ctx.fillText(startText, this.canvas.width / 2, this.canvas.height / 2 + 30);

        if (this.isMobile) {
            this.ctx.font = '18px -apple-system';
            this.ctx.fillStyle = this.colors.textSecondary;
            this.ctx.fillText("Swipe ↑ to Jump • Swipe ↓ to Duck", this.canvas.width / 2, this.canvas.height / 2 + 70);
        }

        this.ctx.textAlign = 'left';
    }

    drawGameOver() {
        this.ctx.fillStyle = this.colors.bg === '#000000' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = this.colors.bug;
        this.ctx.font = 'bold 70px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2 - 30);

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '40px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        this.ctx.fillText(`Score: ${Math.floor(this.score / 10)}`, this.canvas.width / 2, this.canvas.height / 2 + 30);

        this.ctx.fillStyle = this.colors.textSecondary;
        this.ctx.font = '24px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        const restartText = this.isMobile ? "Tap to Restart" : "Press Space or Tap to Restart";
        this.ctx.fillText(restartText, this.canvas.width / 2, this.canvas.height / 2 + 70);
        this.ctx.textAlign = 'left';
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('debug-runner-container');
    if (container) {
        const game = new DebugRunner();
        const canvas = game.init();
        container.appendChild(canvas);
    }
});
