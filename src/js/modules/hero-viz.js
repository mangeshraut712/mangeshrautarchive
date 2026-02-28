/**
 * Hero Visualization Module
 * Creates a high-end interactive tech-stack visualization around the profile image
 * 2026 Portfolio "Wow Factor"
 */

class HeroVisualization {
  constructor() {
    this.container = document.getElementById('hero-viz-container');
    if (!this.container) return;

    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.nodes = [];
    this.techStack = [
      { name: 'AI', icon: 'fa-brain' },
      { name: 'Java', icon: 'fa-coffee' },
      { name: 'Python', icon: 'fa-python' },
      { name: 'AWS', icon: 'fa-cloud' },
      { name: 'React', icon: 'fa-react' },
      { name: 'SQL', icon: 'fa-database' },
    ];

    this.mouseX = 0;
    this.mouseY = 0;
    this.isHovering = false;

    this.init();
  }

  init() {
    this.resize();
    this.createNodes();
    this.setupEventListeners();
    this.animate();
  }

  resize() {
    const rect = this.container.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Center of the profile image
    this.centerX = this.width / 2;
    this.centerY = this.height / 2 - 20; // Adjusted for profile spacing
  }

  createNodes() {
    this.nodes = [];
    const radius = 180;

    this.techStack.forEach((tech, i) => {
      const angle = (i / this.techStack.length) * Math.PI * 2;
      this.nodes.push({
        name: tech.name,
        icon: tech.icon,
        x: this.centerX + Math.cos(angle) * radius,
        y: this.centerY + Math.sin(angle) * radius,
        baseX: this.centerX + Math.cos(angle) * radius,
        baseY: this.centerY + Math.sin(angle) * radius,
        angle: angle,
        distance: radius,
        phase: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.01,
      });
    });
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resize());

    document.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;

      const dist = Math.sqrt(
        Math.pow(this.mouseX - this.centerX, 2) + Math.pow(this.mouseY - this.centerY, 2)
      );
      this.isHovering = dist < 250;
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw connections to center
    this.nodes.forEach(node => {
      // Update position (floating orbit)
      node.angle += node.speed;
      const orbitX = this.centerX + Math.cos(node.angle) * node.distance;
      const orbitY = this.centerY + Math.sin(node.angle) * node.distance;

      // Mouse attraction/repulsion
      const dx = this.mouseX - orbitX;
      const dy = this.mouseY - orbitY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let tx = orbitX;
      let ty = orbitY;

      if (dist < 100) {
        const force = (100 - dist) / 100;
        tx -= dx * force * 0.5;
        ty -= dy * force * 0.5;
      }

      node.x += (tx - node.x) * 0.1;
      node.y += (ty - node.y) * 0.1;

      // Draw line to center
      const opacity = this.isHovering ? 0.3 : 0.1;
      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(0, 113, 227, ${opacity})`;
      this.ctx.lineWidth = 1;
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.lineTo(node.x, node.y);
      this.ctx.stroke();

      // Draw Node
      this.drawNode(node);
    });

    requestAnimationFrame(() => this.animate());
  }

  drawNode(node) {
    const isDark = document.documentElement.classList.contains('dark');

    // Glow effect
    const grad = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 20);
    grad.addColorStop(0, 'rgba(0, 113, 227, 0.2)');
    grad.addColorStop(1, 'rgba(0, 113, 227, 0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
    this.ctx.fill();

    // Core
    this.ctx.fillStyle = isDark ? '#fff' : '#0071e3';
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Label
    this.ctx.font = '600 12px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(node.name, node.x, node.y + 20);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.heroViz = new HeroVisualization();
});
