/**
 * Capability Radar Chart — Apple Style Multi-Axis Proficiency Graph
 * Interactive SVG polygon showing breadth & depth across core engineering disciplines.
 * Pure Vanilla ESM (Zero dependencies).
 */

export class SkillsRadarChart {
  /**
   * @param {HTMLElement} container
   * @param {Object} options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.categories = [
      {
        id: 'distributed',
        label: 'Distributed Systems',
        score: 96,
        tools: 'FastAPI, Uvicorn, SSE, AsyncIO',
      },
      {
        id: 'agentic',
        label: 'AI & Agentic Systems',
        score: 98,
        tools: 'OpenRouter, Grok, WebMCP, RAG',
      },
      {
        id: 'cloud',
        label: 'Cloud & Infrastructure',
        score: 92,
        tools: 'AWS, Vercel Edge, Docker, CI/CD',
      },
      {
        id: 'frontend',
        label: 'Frontend Architecture',
        score: 95,
        tools: 'Vanilla ESM, Liquid Glass, PWA',
      },
      {
        id: 'data',
        label: 'Data & Performance',
        score: 94,
        tools: 'Redis, PostgreSQL, Vector Search',
      },
      {
        id: 'testing',
        label: 'Testing & Quality Gates',
        score: 99,
        tools: 'Vitest, pytest, Playwright, Axe',
      },
    ];
    this.center = 200;
    this.radius = 115;

    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.attachEvents();
  }

  getCoordinates(angle, distance) {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: this.center + distance * Math.cos(rad),
      y: this.center + distance * Math.sin(rad),
    };
  }

  render() {
    const count = this.categories.length;
    const angleStep = 360 / count;
    const levels = [0.25, 0.5, 0.75, 1.0];

    // Build Polygon Points
    const polygonPoints = this.categories
      .map((cat, i) => {
        const dist = (cat.score / 100) * this.radius;
        const coords = this.getCoordinates(i * angleStep, dist);
        return `${coords.x.toFixed(1)},${coords.y.toFixed(1)}`;
      })
      .join(' ');

    this.container.innerHTML = `
      <div class="skills-radar-wrapper lg-glass-card" role="region" aria-label="Core Engineering Capabilities Radar">
        <div class="skills-radar-header">
          <div>
            <span class="skills-radar-pill">Competency Matrix</span>
            <h3 class="skills-radar-heading">Engineering Depth Radar</h3>
          </div>
          <div class="skills-radar-score-badge">
            <strong>96.5%</strong>
            <span>Aggregate Mastery</span>
          </div>
        </div>

        <div class="skills-radar-body">
          <div class="skills-radar-chart-pane">
            <svg class="skills-radar-svg" viewBox="-25 -15 450 430" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="radar-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#0071e3" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="#2997ff" stop-opacity="0.08" />
                </radialGradient>
              </defs>

              <!-- Concentric Background Webs -->
              <g class="radar-webs">
                ${levels
                  .map(lvl => {
                    const pts = Array.from({ length: count })
                      .map((_, i) => {
                        const c = this.getCoordinates(i * angleStep, lvl * this.radius);
                        return `${c.x.toFixed(1)},${c.y.toFixed(1)}`;
                      })
                      .join(' ');
                    return `<polygon class="radar-web-ring" points="${pts}" />`;
                  })
                  .join('')}
              </g>

              <!-- Axis Spoke Lines -->
              <g class="radar-axes">
                ${this.categories
                  .map((_, i) => {
                    const c = this.getCoordinates(i * angleStep, this.radius);
                    return `<line class="radar-axis-line" x1="${this.center}" y1="${this.center}" x2="${c.x.toFixed(1)}" y2="${c.y.toFixed(1)}" />`;
                  })
                  .join('')}
              </g>

              <!-- Data Polygon -->
              <polygon class="radar-data-polygon" points="${polygonPoints}" />

              <!-- Vertex Dots -->
              <g class="radar-vertices">
                ${this.categories
                  .map((cat, i) => {
                    const dist = (cat.score / 100) * this.radius;
                    const c = this.getCoordinates(i * angleStep, dist);
                    return `
                      <circle class="radar-vertex-dot" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="5" data-cat-id="${cat.id}">
                        <title>${cat.label}: ${cat.score}%</title>
                      </circle>
                    `;
                  })
                  .join('')}
              </g>

              <!-- Axis Labels -->
              <g class="radar-labels">
                ${this.categories
                  .map((cat, i) => {
                    const c = this.getCoordinates(i * angleStep, this.radius + 18);
                    const anchor =
                      c.x > this.center + 10 ? 'start' : c.x < this.center - 10 ? 'end' : 'middle';
                    return `
                      <text class="radar-axis-label" x="${c.x.toFixed(1)}" y="${c.y.toFixed(1)}" text-anchor="${anchor}">
                        ${cat.label}
                      </text>
                    `;
                  })
                  .join('')}
              </g>
            </svg>
          </div>

          <!-- Categories List / Detail Cards -->
          <div class="skills-radar-list">
            ${this.categories
              .map(
                cat => `
              <div class="skills-radar-item" data-cat-id="${cat.id}">
                <div class="skills-radar-item-top">
                  <span class="skills-radar-item-label">${cat.label}</span>
                  <span class="skills-radar-item-score">${cat.score}%</span>
                </div>
                <div class="skills-radar-bar-track">
                  <div class="skills-radar-bar-fill" style="width: ${cat.score}%;"></div>
                </div>
                <span class="skills-radar-item-tools">${cat.tools}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const items = this.container.querySelectorAll('.skills-radar-item');
    const dots = this.container.querySelectorAll('.radar-vertex-dot');

    items.forEach(item => {
      const id = item.getAttribute('data-cat-id');
      const dot = this.container.querySelector(`.radar-vertex-dot[data-cat-id="${id}"]`);

      item.addEventListener('mouseenter', () => {
        items.forEach(it => it.classList.remove('is-hovered'));
        dots.forEach(d => d.classList.remove('is-hovered'));
        item.classList.add('is-hovered');
        if (dot) dot.classList.add('is-hovered');
      });

      item.addEventListener('mouseleave', () => {
        item.classList.remove('is-hovered');
        if (dot) dot.classList.remove('is-hovered');
      });
    });
  }
}

export function initSkillsRadarChart(selector = '#skills-radar-container') {
  const el = document.querySelector(selector);
  if (!el) return null;
  if (el.dataset.radarHydrated === 'true') return null;
  el.dataset.radarHydrated = 'true';

  return new SkillsRadarChart(el);
}
