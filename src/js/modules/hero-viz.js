class HeroVisualization {
  constructor() {
    ((this.container = document.getElementById('hero-viz-container')),
      this.container &&
        ((this.canvas = document.createElement('canvas')),
        this.container.appendChild(this.canvas),
        (this.ctx = this.canvas.getContext('2d')),
        (this.nodes = []),
        (this.techStack = [
          { name: 'AI', icon: 'fa-brain' },
          { name: 'Java', icon: 'fa-coffee' },
          { name: 'Python', icon: 'fa-python' },
          { name: 'AWS', icon: 'fa-cloud' },
          { name: 'React', icon: 'fa-react' },
          { name: 'SQL', icon: 'fa-database' },
        ]),
        (this.mouseX = 0),
        (this.mouseY = 0),
        (this.isHovering = !1),
        this.init()));
  }
  init() {
    (this.resize(), this.createNodes(), this.setupEventListeners(), this.animate());
  }
  resize() {
    const t = this.container.parentElement.getBoundingClientRect();
    ((this.width = t.width),
      (this.height = t.height),
      (this.canvas.width = this.width),
      (this.canvas.height = this.height),
      (this.centerX = this.width / 2),
      (this.centerY = this.height / 2 - 20));
  }
  createNodes() {
    this.nodes = [];
    const t = 180;
    this.techStack.forEach((e, i) => {
      const s = (i / this.techStack.length) * Math.PI * 2;
      this.nodes.push({
        name: e.name,
        icon: e.icon,
        x: this.centerX + Math.cos(s) * t,
        y: this.centerY + Math.sin(s) * t,
        baseX: this.centerX + Math.cos(s) * t,
        baseY: this.centerY + Math.sin(s) * t,
        angle: s,
        distance: t,
        phase: Math.random() * Math.PI * 2,
        speed: 0.005 + 0.01 * Math.random(),
      });
    });
  }
  setupEventListeners() {
    (window.addEventListener('resize', () => this.resize()),
      document.addEventListener('mousemove', t => {
        const e = this.canvas.getBoundingClientRect();
        ((this.mouseX = t.clientX - e.left), (this.mouseY = t.clientY - e.top));
        const i = Math.sqrt(
          Math.pow(this.mouseX - this.centerX, 2) + Math.pow(this.mouseY - this.centerY, 2)
        );
        this.isHovering = i < 250;
      }));
  }
  animate() {
    (this.ctx.clearRect(0, 0, this.width, this.height),
      this.nodes.forEach(t => {
        t.angle += t.speed;
        const e = this.centerX + Math.cos(t.angle) * t.distance,
          i = this.centerY + Math.sin(t.angle) * t.distance,
          s = this.mouseX - e,
          n = this.mouseY - i,
          h = Math.sqrt(s * s + n * n);
        let a = e,
          c = i;
        if (h < 100) {
          const t = (100 - h) / 100;
          ((a -= s * t * 0.5), (c -= n * t * 0.5));
        }
        ((t.x += 0.1 * (a - t.x)), (t.y += 0.1 * (c - t.y)));
        const o = this.isHovering ? 0.3 : 0.1;
        (this.ctx.beginPath(),
          (this.ctx.strokeStyle = `rgba(0, 113, 227, ${o})`),
          (this.ctx.lineWidth = 1),
          this.ctx.moveTo(this.centerX, this.centerY),
          this.ctx.lineTo(t.x, t.y),
          this.ctx.stroke(),
          this.drawNode(t));
      }),
      requestAnimationFrame(() => this.animate()));
  }
  drawNode(t) {
    const e = document.documentElement.classList.contains('dark'),
      i = this.ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, 20);
    (i.addColorStop(0, 'rgba(0, 113, 227, 0.2)'),
      i.addColorStop(1, 'rgba(0, 113, 227, 0)'),
      (this.ctx.fillStyle = i),
      this.ctx.beginPath(),
      this.ctx.arc(t.x, t.y, 20, 0, 2 * Math.PI),
      this.ctx.fill(),
      (this.ctx.fillStyle = e ? '#fff' : '#0071e3'),
      this.ctx.beginPath(),
      this.ctx.arc(t.x, t.y, 4, 0, 2 * Math.PI),
      this.ctx.fill(),
      (this.ctx.font = '600 12px Inter'),
      (this.ctx.textAlign = 'center'),
      this.ctx.fillText(t.name, t.x, t.y + 20));
  }
}
document.addEventListener('DOMContentLoaded', () => {
  window.heroViz = new HeroVisualization();
});
