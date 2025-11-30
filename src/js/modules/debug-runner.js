/**
 * Debug Runner - Chrome Dino Style Coding Game
 * 2025 Portfolio Upgrade - Phase 3
 * Inspired by Chrome Dino but with coding themes: bugs, coffee, Stack Overflow answers
 */

class DebugRunner {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('debugRunnerHighScore')) || 0;
        this.speed = 6;
        this.gameLoop = null;
        this.groundY = 300;
        this.dev = null;
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];
        this.lastScoreIncrement = 0;
        this.invincible = false;
        this.invincibleUntil = 0;
        this.coffeePower = 0;
        this.coffeeUntil = 0;
        this.starfield = [];

        // Assets
        this.bgSky = '#0a0a0a';
        this.bgGradient = null;
        this.groundColor = '#1a1a1a';
        this.textColor = '#00ff41';

        this.initStarfield();
    }

    /**
     * Initialize starfield background
     */
    initStarfield() {
        this.starfield = [];
        for (let i = 0; i < 100; i++) {
            this.starfield.push({
                x: Math.random() * 1200,
                y: Math.random() * 400,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.02
            });
        }
    }

    /**
     * Initialize the game canvas
     */
    init() {
        // Create canvas with matrix-style appearance
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'debug-runner-canvas';
        this.canvas.width = 1200;
        this.canvas.height = 400;
        this.canvas.style.background = 'black';
        this.canvas.style.border = '2px solid #00ff41';
        this.canvas.style.borderRadius = '4px';
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.width = '100%';
        this.canvas.style.maxWidth = '900px';
        this.canvas.style.height = 'auto';
        this.canvas.style.touchAction = 'none';

        this.ctx = this.canvas.getContext('2d');

        // Create gradient background
        this.bgGradient = this.ctx.createLinearGradient(0, 0, 0, 400);
        this.bgGradient.addColorStop(0, '#000011');
        this.bgGradient.addColorStop(1, '#000000');

        // Initialize developer character
        this.dev = {
            x: 100,
            y: this.groundY - 60,
            width: 40,
            height: 60,
            velocityY: 0,
            onGround: true,
            jumpPower: 15,
            color: '#00ff41',
            // Developer appearance
            head: { x: 110, y: this.groundY - 80, radius: 8 },
            body: { x: 105, y: this.groundY - 60, width: 10, height: 30 },
            arms: [
                { x: 100, y: this.groundY - 50, width: 15, height: 5 }, // Left arm
                { x: 125, y: this.groundY - 50, width: 15, height: 5 }  // Right arm
            ],
            legs: [
                { x: 105, y: this.groundY - 25, width: 5, height: 20 }, // Left leg
                { x: 115, y: this.groundY - 25, width: 5, height: 20 }  // Right leg
            ]
        };

        // Initialize game state
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.speed = 6;
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];

        // Add keyboard controls
        this.setupControls();
        this.setupTouchControls();

        // Start starfield animation
        this.animateStarfield();

        return this.canvas;
    }

    /**
     * Setup keyboard controls
     */
    setupControls() {
        const handleKeyPress = (e) => {
            if (!this.gameRunning) return;

            switch (e.code) {
                case 'Space':
                case 'ArrowUp':
                case 'KeyW':
                    e.preventDefault();
                    this.jump();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    e.preventDefault();
                    this.duck();
                    break;
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.standUp();
            }
        };

        // Add event listeners
        document.addEventListener('keydown', handleKeyPress);
        document.addEventListener('keyup', handleKeyUp);

        // Store for cleanup
        this.keyListeners = { handleKeyPress, handleKeyUp };
    }

    /**
     * Touch / mobile controls
     */
    setupTouchControls() {
        const canvas = this.canvas;
        if (!canvas) return;

        let touchStartY = null;
        let performedDuck = false;

        const handleTouchStart = (e) => {
            if (!this.gameRunning) return;
            const touch = e.changedTouches[0];
            touchStartY = touch.clientY;
            performedDuck = false;
            // Light tap triggers jump; deeper swipe handled on end
            e.preventDefault();
        };

        const handleTouchEnd = (e) => {
            if (!this.gameRunning) return;
            const touch = e.changedTouches[0];
            const deltaY = touch.clientY - (touchStartY ?? touch.clientY);

            if (deltaY > 40) {
                // Swipe/drag down -> duck briefly
                performedDuck = true;
                this.duck();
                setTimeout(() => this.standUp(), 450);
            } else if (!performedDuck) {
                this.jump();
            }

            touchStartY = null;
            performedDuck = false;
            e.preventDefault();
        };

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        this.touchHandlers = { handleTouchStart, handleTouchEnd };
    }

    /**
     * Start the game
     */
    start() {
        if (this.gameRunning) return;

        this.gameRunning = true;
        this.gameOver = false;
        this.score = 0;
        this.speed = 6;
        this.obstacles = [];
        this.powerUps = [];
        this.invincible = false;
        this.coffeePower = 0;

        console.log('🕹️ Debug Runner started!');
        this.gameLoop = setInterval(() => this.update(), 1000 / 60);
    }

    /**
     * Stop the game
     */
    stop() {
        this.gameRunning = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }

        // Remove event listeners
        if (this.keyListeners) {
            document.removeEventListener('keydown', this.keyListeners.handleKeyPress);
            document.removeEventListener('keyup', this.keyListeners.handleKeyUp);
        }

        console.log('🛑 Debug Runner stopped');
    }

    /**
     * Jump action
     */
    jump() {
        if (this.dev.onGround) {
            this.dev.velocityY = -this.dev.jumpPower;
            this.dev.onGround = false;

            // Add jump particles
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: this.dev.x + 20,
                    y: this.dev.y + 60,
                    vx: (Math.random() - 0.5) * 4,
                    vy: Math.random() * -2 - 1,
                    life: 30,
                    color: '#00ff41',
                    type: 'dust'
                });
            }
        }
    }

    /**
     * Duck action
     */
    duck() {
        this.dev.height = 30; // Reduce height when ducking
        this.dev.y = this.groundY - 30;
    }

    /**
     * Stand up from duck
     */
    standUp() {
        this.dev.height = 60;
        this.dev.y = this.groundY - 60;
    }

    /**
     * Main game update loop
     */
    update() {
        if (!this.gameRunning || this.gameOver) return;

        // Update developer physics
        this.updateDeveloper();

        // Update obstacles
        this.updateObstacles();

        // Update power-ups
        this.updatePowerUps();

        // Update particles
        this.updateParticles();

        // Update power effects
        this.updatePowerEffects();

        // Check collisions
        this.checkCollisions();

        // Increment score
        this.updateScore();

        // Increase difficulty over time
        this.updateDifficulty();

        // Render everything
        this.render();
    }

    /**
     * Update developer physics
     */
    updateDeveloper() {
        // Gravity
        this.dev.velocityY += 0.8;
        this.dev.y += this.dev.velocityY;

        // Ground collision
        if (this.dev.y >= this.groundY - this.dev.height) {
            this.dev.y = this.groundY - this.dev.height;
            this.dev.velocityY = 0;
            this.dev.onGround = true;
        }
    }

    /**
     * Update obstacles
     */
    updateObstacles() {
        // Spawn obstacles
        if (Math.random() < 0.008) {
            const obstacleType = Math.random();
            if (obstacleType < 0.4) {
                // Bug obstacle
                this.obstacles.push({
                    x: 1200,
                    y: this.groundY - 20,
                    width: 25,
                    height: 20,
                    type: 'bug',
                    color: '#ff4444',
                    speed: this.speed
                });
            } else if (obstacleType < 0.7) {
                // Merge conflict obstacle
                this.obstacles.push({
                    x: 1200,
                    y: this.groundY - 25,
                    width: 35,
                    height: 25,
                    type: 'conflict',
                    color: '#ffaa00',
                    speed: this.speed
                });
            } else {
                // Production fire obstacle
                this.obstacles.push({
                    x: 1200,
                    y: this.groundY - 30,
                    width: 30,
                    height: 30,
                    type: 'fire',
                    color: '#ff6600',
                    speed: this.speed
                });
            }
        }

        // Move obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.x -= obstacle.speed;
        });

        // Remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obs => obs.x > -50);
    }

    /**
     * Update power-ups
     */
    updatePowerUps() {
        // Spawn power-ups occasionally
        if (Math.random() < 0.003) {
            const powerType = Math.random();
            if (powerType < 0.5) {
                // Coffee power-up (speed boost)
                this.powerUps.push({
                    x: 1200,
                    y: 200 + Math.random() * 100,
                    width: 20,
                    height: 20,
                    type: 'coffee',
                    color: '#8B4513',
                    speed: this.speed * 0.8 // Slower than obstacles
                });
            } else {
                // Stack Overflow answer (invincibility)
                this.powerUps.push({
                    x: 1200,
                    y: 150 + Math.random() * 150,
                    width: 25,
                    height: 25,
                    type: 'stackoverflow',
                    color: '#ff9900',
                    speed: this.speed * 0.8
                });
            }
        }

        // Move power-ups
        this.powerUps.forEach(power => {
            power.x -= power.speed;
        });

        // Remove off-screen power-ups
        this.powerUps = this.powerUps.filter(power => power.x > -50);
    }

    /**
     * Update particles
     */
    updateParticles() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;

            if (particle.type === 'dust') {
                particle.vy += 0.1; // Gravity for dust
            }
        });

        this.particles = this.particles.filter(p => p.life > 0);
    }

    /**
     * Update power effects
     */
    updatePowerEffects() {
        // Check coffee power expiration
        if (this.coffeePower > 0) {
            this.coffeePower--;
            if (this.coffeePower <= 0) {
                this.speed /= 1.5; // Return to normal speed
                console.log('☕ Coffee power ended');
            }
        }

        // Check invincibility expiration
        if (this.invincible && Date.now() > this.invincibleUntil) {
            this.invincible = false;
            console.log('🛡️ Invincibility ended');
        }
    }

    /**
     * Check collision detection
     */
    checkCollisions() {
        if (this.invincible) return;

        const devRect = {
            x: this.dev.x,
            y: this.dev.y,
            width: this.dev.width,
            height: this.dev.height
        };

        // Check obstacle collisions
        for (const obstacle of this.obstacles) {
            if (this.rectsCollide(devRect, obstacle)) {
                this.gameOver = true;
                console.log('💥 Game Over! Hit:', obstacle.type);
                this.stop();
                return;
            }
        }

        // Check power-up collisions
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const power = this.powerUps[i];
            if (this.rectsCollide(devRect, power)) {
                this.collectPowerUp(power);
                this.powerUps.splice(i, 1);

                // Add collection particles
                for (let j = 0; j < 8; j++) {
                    this.particles.push({
                        x: power.x + power.width / 2,
                        y: power.y + power.height / 2,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        life: 40,
                        color: power.color,
                        type: 'sparkle'
                    });
                }
            }
        }
    }

    /**
     * Rectangle collision detection
     */
    rectsCollide(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }

    /**
     * Collect power-up
     */
    collectPowerUp(power) {
        switch (power.type) {
            case 'coffee':
                console.log('☕ Coffee power! Speed increased!');
                if (this.coffeePower === 0) {
                    this.speed *= 1.5;
                    this.coffeePower = 300; // 5 seconds at 60fps
                } else {
                    this.coffeePower += 180; // Extend by 3 seconds
                }
                this.score += 50;
                break;
            case 'stackoverflow':
                console.log('📚 Stack Overflow power! Invincibility!');
                this.invincible = true;
                this.invincibleUntil = Date.now() + 5000; // 5 seconds
                this.score += 100;
                break;
        }
    }

    /**
     * Update score
     */
    updateScore() {
        const now = Date.now();
        if (now - this.lastScoreIncrement > 100) { // Every 100ms
            this.score += Math.floor(this.speed / 2);
            this.lastScoreIncrement = now;
        }

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('debugRunnerHighScore', this.highScore.toString());
        }
    }

    /**
     * Update difficulty
     */
    updateDifficulty() {
        // Gradually increase speed
        if (this.score > 0 && this.score % 500 === 0) {
            this.speed += 0.5;
            console.log('⚡ Difficulty increased! Speed:', this.speed);
        }
    }

    /**
     * Animate starfield
     */
    animateStarfield() {
        this.starfield.forEach(star => {
            star.brightness += star.twinkleSpeed;
            if (star.brightness > 1) star.brightness = 0;
        });

        if (this.gameRunning) {
            setTimeout(() => this.animateStarfield(), 50);
        }
    }

    /**
     * Render the game
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw starfield
        this.ctx.fillStyle = 'white';
        this.starfield.forEach(star => {
            const alpha = star.brightness * 0.8 + 0.2;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillRect(star.x, star.y, 1, 1);
        });
        this.ctx.globalAlpha = 1;

        // Draw ground
        this.ctx.fillStyle = this.groundColor;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        // Draw ground lines
        this.ctx.strokeStyle = '#333';
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.groundY);
            this.ctx.lineTo(x + 25, this.groundY);
            this.ctx.stroke();
        }

        // Draw developer
        this.drawDeveloper();

        // Draw obstacles
        this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));

        // Draw power-ups
        this.powerUps.forEach(power => this.drawPowerUp(power));

        // Draw particles
        this.particles.forEach(particle => this.drawParticle(particle));

        // Draw UI
        this.drawUI();
    }

    /**
     * Draw developer character
     */
    drawDeveloper() {
        this.ctx.fillStyle = this.dev.color;

        // Draw developer body parts
        const dev = this.dev;

        // Head
        this.ctx.beginPath();
        this.ctx.arc(dev.head.x, dev.head.y, dev.head.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes (simple dots)
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(dev.head.x - 3, dev.head.y - 2, 1.5, 0, Math.PI * 2);
        this.ctx.arc(dev.head.x + 3, dev.head.y - 2, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Mouth (smile)
        this.ctx.strokeStyle = this.dev.color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(dev.head.x, dev.head.y + 1, 3, 0.2, Math.PI - 0.2);
        this.ctx.stroke();

        // Body
        this.ctx.fillStyle = '#00cccc';
        this.ctx.fillRect(dev.body.x, dev.body.y, dev.body.width, dev.body.height);

        // Arms (animated)
        const armOffset = Math.sin(Date.now() * 0.01) * 2;
        this.ctx.fillStyle = this.dev.color;
        dev.arms.forEach(arm => {
            this.ctx.fillRect(arm.x, arm.y + armOffset, arm.width, arm.height);
        });

        // Legs (animated)
        const legOffset = Math.sin(Date.now() * 0.02) * 2;
        dev.legs.forEach(leg => {
            this.ctx.fillRect(leg.x, leg.y + legOffset, leg.width, leg.height);
        });

        // Laptop outline (developer badge)
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(dev.x - 5, dev.y - 5, 50, 70);
    }

    /**
     * Draw obstacle
     */
    drawObstacle(obstacle) {
        // Draw obstacle based on type
        switch (obstacle.type) {
            case 'bug':
                // Draw bug as red rectangle with legs
                this.ctx.fillStyle = obstacle.color;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

                // Bug legs
                this.ctx.fillStyle = '#880000';
                for (let i = 0; i < 6; i++) {
                    const legY = obstacle.y + 8 + (i % 2) * 4;
                    const legX = obstacle.x + 2 + i * 3;
                    this.ctx.fillRect(legX, legY, 2, 6);
                }
                break;

            case 'conflict':
                // Draw merge conflict as yellow triangle
                this.ctx.fillStyle = obstacle.color;
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();

                // Conflict icon (X)
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + 6, obstacle.y + 6);
                this.ctx.lineTo(obstacle.x + obstacle.width - 6, obstacle.y + obstacle.height - 6);
                this.ctx.moveTo(obstacle.x + obstacle.width - 6, obstacle.y + 6);
                this.ctx.lineTo(obstacle.x + 6, obstacle.y + obstacle.height - 6);
                this.ctx.stroke();
                break;

            case 'fire': {
                // Draw production fire as animated flame
                const flameHeight = obstacle.height + Math.sin(Date.now() * 0.02) * 5;
                this.ctx.fillStyle = obstacle.color;
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height - flameHeight);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            }
        }
    }

    /**
     * Draw power-up
     */
    drawPowerUp(power) {
        // Draw power-up based on type
        switch (power.type) {
            case 'coffee':
                // Draw coffee cup
                this.ctx.fillStyle = power.color;
                this.ctx.fillRect(power.x, power.y, power.width - 5, power.height - 5);
                this.ctx.fillRect(power.x + 2, power.y - 3, power.width - 9, 3); // Handle

                // Steam
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(power.x + 5, power.y - 3);
                this.ctx.lineTo(power.x + 5, power.y - 8);
                this.ctx.moveTo(power.x + 8, power.y - 3);
                this.ctx.lineTo(power.x + 8, power.y - 10);
                this.ctx.stroke();
                break;

            case 'stackoverflow':
                // Draw Stack Overflow logo style (orange box with text)
                this.ctx.fillStyle = power.color;
                this.ctx.fillRect(power.x, power.y, power.width, power.height);

                // SO text
                this.ctx.fillStyle = 'white';
                this.ctx.font = '10px monospace';
                this.ctx.fillText('SO', power.x + 5, power.y + 16);
                break;
        }
    }

    /**
     * Draw particle
     */
    drawParticle(particle) {
        this.ctx.fillStyle = particle.color;
        this.ctx.globalAlpha = particle.life / 40;

        switch (particle.type) {
            case 'dust':
            case 'sparkle':
                this.ctx.fillRect(particle.x, particle.y, 2, 2);
                break;
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw UI elements
     */
    drawUI() {
        // Draw score
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = '24px monospace';
        this.ctx.fillText(`SCORE: ${this.score}`, 20, 40);

        // Draw high score
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`HIGH: ${this.highScore}`, 20, 70);

        // Draw speed indicator
        this.ctx.fillText(`SPEED: ${this.speed.toFixed(1)}x`, 20, 90);

        // Draw power indicators
        if (this.invincible) {
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.fillText('🛡️ INVINCIBLE', 20, 120);
        }

        if (this.coffeePower > 0) {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillText('☕ CAFFEINATED', 20, 140);
        }

        // Draw instructions
        if (!this.gameRunning && !this.gameOver) {
            this.ctx.fillStyle = this.textColor;
            this.ctx.font = '20px monospace';
            this.ctx.fillText('PRESS SPACE TO START', 450, 200);
            this.ctx.font = '14px monospace';
            this.ctx.fillText('SPACE: JUMP  |  DOWN: DUCK', 450, 230);
        }

        // Draw game over screen
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(300, 150, 600, 200);

            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = '36px monospace';
            this.ctx.fillText('GAME OVER', 480, 200);

            this.ctx.fillStyle = this.textColor;
            this.ctx.font = '20px monospace';
            this.ctx.fillText(`FINAL SCORE: ${this.score}`, 470, 240);
            this.ctx.fillText('PRESS SPACE TO RESTART', 420, 280);
        }
    }

    /**
     * Create game popup/modal
     */
    createGameModal() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'debug-runner-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 30px;
            background: none;
            border: none;
            color: #00ff41;
            cursor: pointer;
            padding: 10px;
        `;
        closeBtn.onclick = () => this.closeGame();

        // Create game container
        const gameContainer = document.createElement('div');
        gameContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        `;

        // Title
        const title = document.createElement('h2');
        title.textContent = '🐛 DEBUG RUNNER 🏃‍♂️';
        title.style.cssText = `
            color: #00ff41;
            font-family: monospace;
            font-size: 32px;
            margin: 0;
            text-shadow: 0 0 10px #00ff41;
        `;

        // Game canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.style.cssText = `
            position: relative;
            border: 3px solid #00ff41;
            border-radius: 8px;
            padding: 10px;
            background: #111;
            box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
        `;

        // Initialize and add canvas
        const canvas = this.init();
        canvasContainer.appendChild(canvas);

        // Add everything to modal
        gameContainer.appendChild(title);
        gameContainer.appendChild(canvasContainer);
        modal.appendChild(closeBtn);
        modal.appendChild(gameContainer);

        return modal;
    }

    /**
     * Show the game
     */
    showGame() {
        const modal = this.createGameModal();
        document.body.appendChild(modal);

        // Focus the modal
        modal.focus();

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeGame();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Store modal reference for cleanup
        this.currentModal = modal;

        console.log('🎮 Debug Runner game launched!');
    }

    /**
     * Close the game
     */
    closeGame() {
        if (this.gameRunning) {
            this.stop();
        }

        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }

        console.log('🎮 Debug Runner game closed');
    }

    /**
     * Restart the game
     */
    restart() {
        if (this.gameOver) {
            this.gameOver = false;
            this.score = 0;
            this.speed = 6;
            this.obstacles = [];
            this.powerUps = [];
            this.invincible = false;
            this.coffeePower = 0;
            this.dev.y = this.groundY - 60;
            this.dev.velocityY = 0;
            this.dev.onGround = true;
            this.start();
        }
    }

    /**
     * Mount game to a container element (always visible mode)
     */
    mountToContainer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        // Create game wrapper
        const gameWrapper = document.createElement('div');
        gameWrapper.className = 'debug-runner-wrapper';

        // Initialize and add canvas
        const canvas = this.init();
        gameWrapper.appendChild(canvas);

        // Mobile-friendly quick controls
        const mobileControls = document.createElement('div');
        mobileControls.className = 'debug-runner-mobile-controls';
        if (window.innerWidth <= 1024) {
            mobileControls.classList.add('is-active');
        }
        const jumpBtn = document.createElement('button');
        jumpBtn.textContent = 'Tap to Jump';
        jumpBtn.type = 'button';
        jumpBtn.className = 'debug-game-btn debug-game-btn--jump';
        jumpBtn.onclick = () => {
            if (!this.gameRunning) return;
            this.jump();
        };

        const duckBtn = document.createElement('button');
        duckBtn.textContent = 'Hold to Duck';
        duckBtn.type = 'button';
        duckBtn.className = 'debug-game-btn debug-game-btn--duck';
        duckBtn.onmousedown = duckBtn.ontouchstart = (e) => {
            e.preventDefault();
            if (!this.gameRunning) return;
            this.duck();
        };
        duckBtn.onmouseup = duckBtn.onmouseleave = duckBtn.ontouchend = () => {
            if (!this.gameRunning) return;
            this.standUp();
        };

        mobileControls.appendChild(jumpBtn);
        mobileControls.appendChild(duckBtn);

        gameWrapper.appendChild(mobileControls);

        const syncMobileControls = () => {
            mobileControls.classList.toggle('is-active', window.innerWidth <= 1024);
        };
        window.addEventListener('resize', syncMobileControls, { passive: true });
        syncMobileControls();

        // Add start button
        const startBtn = document.createElement('button');
        startBtn.textContent = '▶ START GAME';
        startBtn.type = 'button';
        startBtn.className = 'debug-game-btn debug-game-btn--start';
        const markRunning = () => {
            startBtn.textContent = '🎮 PLAYING...';
            startBtn.disabled = true;
            startBtn.classList.add('is-running');
        };
        const markReady = (label = '▶ START GAME') => {
            startBtn.textContent = label;
            startBtn.disabled = false;
            startBtn.classList.remove('is-running');
        };
        startBtn.onclick = () => {
            if (!this.gameRunning) {
                this.start();
                markRunning();
            }
        };

        // Add restart handler for when game ends
        const originalStop = this.stop.bind(this);
        this.stop = () => {
            originalStop();
            markReady('🔄 RESTART');
        };

        // Handle space key to start/restart
        const handleSpace = (e) => {
            if (e.code === 'Space' && !this.gameRunning) {
                e.preventDefault();
                if (this.gameOver) {
                    this.restart();
                } else {
                    this.start();
                }
                markRunning();
            }
        };
        document.addEventListener('keydown', handleSpace);

        gameWrapper.appendChild(startBtn);
        container.appendChild(gameWrapper);

        console.log('🎮 Debug Runner mounted to container:', containerId);
    }
}


// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugRunner;
}

// Auto-initialize for both container mount and Easter egg activation
document.addEventListener('DOMContentLoaded', () => {
    // Create global game instance
    window.debugRunner = new DebugRunner();

    // Mount to container if it exists (always visible mode)
    const container = document.getElementById('debug-runner-container');
    if (container) {
        window.debugRunner.mountToContainer('debug-runner-container');
        console.log('🎮 Debug Runner mounted to page!');
    }

    // Easter egg activation: Ctrl+Shift+G (still works for modal)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'G') {
            e.preventDefault();
            if (window.debugRunner && !container) {
                // Only show modal if not already mounted to container
                window.debugRunner.showGame();
            }
        }
    });

    // Offline mode suggestion (like Chrome Dino)
    window.addEventListener('offline', () => {
        // Show offline message and suggest game
        if (window.debugRunner && !window.debugRunner.currentModal && !container) {
            setTimeout(() => {
                const offlineMsg = document.createElement('div');
                offlineMsg.id = 'offline-msg';
                offlineMsg.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: rgba(0,0,0,0.9);
                        color: #00ff41;
                        padding: 15px 20px;
                        border-radius: 8px;
                        border: 1px solid #00ff41;
                        font-family: monospace;
                        z-index: 10001;
                        cursor: pointer;
                    " onclick="this.remove(); window.debugRunner.showGame();">
                        🌐 OFFLINE - Press <kbd>Ctrl+Shift+G</kbd> to play Debug Runner!
                    </div>
                `;
                document.body.appendChild(offlineMsg);

                // Auto remove after 5 seconds
                setTimeout(() => {
                    if (offlineMsg.parentNode) {
                        offlineMsg.remove();
                    }
                }, 5000);
            }, 1000);
        }
    });

    console.log('🐛 Debug Runner ready! ' + (container ? 'Scroll down to play!' : 'Press Ctrl+Shift+G to play'));
});
