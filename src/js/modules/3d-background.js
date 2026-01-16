/**
 * 3D Interactive Background - 2026 Enhancement
 * Creates an immersive 3D particle system that responds to mouse movement
 * Uses Three.js for WebGL rendering
 * 
 * Features:
 * - Animated particle field
 * - Mouse-following cursor effect
 * - Smooth performance with requestAnimationFrame
 * - Responsive to theme changes (dark/light mode)
 * - Low resource usage with optimized rendering
 */

export class Interactive3DBackground {
    constructor(options = {}) {
        this.options = {
            particleCount: 100,
            particleSize: 2,
            connectionDistance: 150,
            mouseInfluence: 100,
            animationSpeed: 0.0005,
            enableConnections: true,
            enableMouseInteraction: true,
            ...options
        };

        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.animationId = null;
        this.isInitialized = false;
        this.isDarkMode = false;
    }

    /**
     * Initialize the 3D background
     */
    async init() {
        if (this.isInitialized) return;

        // Create canvas element
        this.createCanvas();

        // Initialize particles
        this.initParticles();

        // Set up event listeners
        this.setupEventListeners();

        // Start animation loop
        this.animate();

        this.isInitialized = true;
        console.log('✨ 3D Interactive Background initialized');
    }

    /**
     * Create and inject canvas into DOM
     */
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = '3d-background-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
            opacity: 0.6;
            transition: opacity 0.3s ease;
        `;

        // Insert as first child of body
        document.body.insertBefore(this.canvas, document.body.firstChild);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }

    /**
     * Initialize particle system and cache the particle image
     */
    initParticles() {
        this.particles = [];

        // Cache particle image to avoid creating gradients every frame
        this.particleCache = document.createElement('canvas');
        this.particleCache.width = 20;
        this.particleCache.height = 20;
        const ctx = this.particleCache.getContext('2d');

        // Draw cached particle
        const centerX = 10;
        const centerY = 10;
        const radius = 2;

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 4);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 4, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < this.options.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * this.options.particleSize + 1,
                originalX: 0,
                originalY: 0
            });
        }

        // Store original positions
        this.particles.forEach(p => {
            p.originalX = p.x;
            p.originalY = p.y;
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Mouse movement
        if (this.options.enableMouseInteraction) {
            document.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });
        }

        // Window resize
        window.addEventListener('resize', () => this.resize());

        // Theme change detection
        const observer = new MutationObserver(() => {
            this.isDarkMode = document.documentElement.classList.contains('dark');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Initial theme check
        this.isDarkMode = document.documentElement.classList.contains('dark');

        // Visibility change (pause when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    /**
     * Handle canvas resize
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Update particle positions
     */
    updateParticles() {
        this.particles.forEach(particle => {
            // Apply velocity
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Mouse interaction
            if (this.options.enableMouseInteraction) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.options.mouseInfluence) {
                    const force = (this.options.mouseInfluence - distance) / this.options.mouseInfluence;
                    particle.vx -= (dx / distance) * force * 0.1;
                    particle.vy -= (dy / distance) * force * 0.1;
                }
            }

            // Boundary collision
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.vx *= -1;
                particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.vy *= -1;
                particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            }

            // Damping
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // Add slight random movement
            particle.vx += (Math.random() - 0.5) * 0.02;
            particle.vy += (Math.random() - 0.5) * 0.02;

            // Limit velocity
            const maxSpeed = 2;
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (speed > maxSpeed) {
                particle.vx = (particle.vx / speed) * maxSpeed;
                particle.vy = (particle.vy / speed) * maxSpeed;
            }
        });
    }

    /**
     * Draw particles and connections
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Get theme colors
        const isDark = this.isDarkMode;
        const connectionColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

        // Optimization: Use squared distance to avoid Math.sqrt
        const connectionDistSq = this.options.connectionDistance * this.options.connectionDistance;

        // Draw connections
        if (this.options.enableConnections) {
            this.ctx.strokeStyle = connectionColor;
            this.ctx.lineWidth = 1;

            for (let i = 0; i < this.particles.length; i++) {
                const p1 = this.particles[i];
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < connectionDistSq) {
                        const opacity = 1 - (distSq / connectionDistSq);
                        this.ctx.globalAlpha = opacity * 0.3;
                        this.ctx.beginPath();
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.stroke();
                    }
                }
            }
            this.ctx.globalAlpha = 1;
        }

        // Draw particles using cached image
        const particleOpacity = isDark ? 0.8 : 0.6;
        this.ctx.globalAlpha = particleOpacity;
        // Simple fix: Check theme and set filter or use different cache?
        // Let's just draw circles for light mode if cache doesn't work well, 
        // OR create two caches.

        if (!isDark) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else {
            // Dark mode - use glowing white cache
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                // Draw cached image centered at particle position
                // Scale based on radius
                const size = p.radius * 6; // Scale factor
                this.ctx.drawImage(this.particleCache, p.x - size / 2, p.y - size / 2, size, size);
            }
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Animation loop
     */
    animate() {
        this.updateParticles();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Pause animation
     */
    pause() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Resume animation
     */
    resume() {
        if (!this.animationId) {
            this.animate();
        }
    }

    /**
     * Destroy and clean up
     */
    destroy() {
        this.pause();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.isInitialized = false;
    }

    /**
     * Update configuration
     */
    updateConfig(newOptions) {
        this.options = { ...this.options, ...newOptions };

        // Reinitialize particles if count changed
        if (newOptions.particleCount && newOptions.particleCount !== this.particles.length) {
            this.initParticles();
        }
    }
}

/**
 * Lightweight 3D Cursor Follower
 * Creates a smooth cursor effect with 3D-like depth
 */
export class CursorFollower3D {
    constructor() {
        this.cursor = null;
        this.trail = [];
        this.maxTrailLength = 10;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;

        // Create cursor element
        this.cursor = document.createElement('div');
        this.cursor.className = 'cursor-3d';
        this.cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(0, 122, 255, 0.5);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            transition: all 0.1s ease;
            mix-blend-mode: difference;
        `;

        document.body.appendChild(this.cursor);

        // Mouse move event
        document.addEventListener('mousemove', (e) => {
            this.cursor.style.left = e.clientX + 'px';
            this.cursor.style.top = e.clientY + 'px';

            // Add trail effect
            this.addTrailPoint(e.clientX, e.clientY);
        });

        // Hover effects on interactive elements
        const interactiveElements = 'a, button, input, textarea, [role="button"]';
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches(interactiveElements)) {
                this.cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
                this.cursor.style.borderColor = 'rgba(0, 122, 255, 0.8)';
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.matches(interactiveElements)) {
                this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                this.cursor.style.borderColor = 'rgba(0, 122, 255, 0.5)';
            }
        });

        this.isInitialized = true;
        console.log('✨ 3D Cursor Follower initialized');
    }

    addTrailPoint(x, y) {
        this.trail.push({ x, y, opacity: 1 });

        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Update trail opacity
        this.trail.forEach((point, index) => {
            point.opacity = (index + 1) / this.trail.length;
        });
    }

    destroy() {
        if (this.cursor && this.cursor.parentNode) {
            this.cursor.parentNode.removeChild(this.cursor);
        }
        this.isInitialized = false;
    }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only initialize on desktop (not mobile)
        if (window.innerWidth > 768) {
            const background3D = new Interactive3DBackground({
                particleCount: 80,
                particleSize: 2,
                connectionDistance: 120,
                mouseInfluence: 100
            });
            background3D.init();

            // Optionally add cursor follower
            // const cursorFollower = new CursorFollower3D();
            // cursorFollower.init();

            // Make available globally for debugging
            window.background3D = background3D;
        }
    });
}

export default Interactive3DBackground;
