/**
 * Architecture Tree & System Flow Visualizer — Apple Keynote-Grade Interactive Graph
 * Visualizes the agentic full-stack topology: Client -> Edge -> FastAPI -> Models + WebMCP Tools.
 * Pure Vanilla ESM + SVG (Zero external dependencies).
 */

export class ArchitectureTree {
  /**
   * @param {HTMLElement} container
   * @param {Object} options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.activeNodeId = null;
    this.nodes = [
      {
        id: 'client',
        title: 'Client Runtime',
        badge: 'Zero-Framework',
        desc: 'Vanilla HTML5 / CSS / ESM JS with PWA Offline Cache, Liquid Glass UI, and WebMCP agent hooks.',
        metrics: { latency: '< 16ms', memory: '12 MB', bundle: '42 kB' },
        icon: 'fa-desktop',
        x: 120,
        y: 200,
        links: ['edge'],
      },
      {
        id: 'edge',
        title: 'Edge Gateway',
        badge: 'Vercel / Cloudflare',
        desc: 'Globally distributed edge routing, asset compression, rate-limiting, and geo-distributed DNS.',
        metrics: { ttfb: '24ms', cacheHit: '99.4%', edgeNodes: '310+' },
        icon: 'fa-bolt',
        x: 380,
        y: 200,
        links: ['backend'],
      },
      {
        id: 'backend',
        title: 'FastAPI Core Engine',
        badge: 'Python 3.12+',
        desc: 'High-concurrency async server with Pydantic v2 validation, memory session management, and SSE streaming.',
        metrics: { concurrency: '10k req/s', latency: '< 45ms', testCoverage: '100%' },
        icon: 'fa-server',
        x: 640,
        y: 200,
        links: ['models', 'tools'],
      },
      {
        id: 'models',
        title: 'LLM Gateway',
        badge: 'Multi-Model Proxy',
        desc: 'OpenRouter dynamic streaming proxy routing between Grok 4.3, Gemma 2, Nemotron 70B, and offline fallback.',
        metrics: { streamTps: '85 tok/s', context: '128k', uptime: '99.99%' },
        icon: 'fa-brain',
        x: 900,
        y: 110,
        links: [],
      },
      {
        id: 'tools',
        title: 'WebMCP Agent Suite',
        badge: '13 Agentic Tools',
        desc: 'Browser-side agent execution engine for instantaneous DOM actions, navigation, and resume data retrieval.',
        metrics: { tools: '13 Active', execTime: '< 2ms', protocol: 'WebMCP v1' },
        icon: 'fa-cube',
        x: 900,
        y: 290,
        links: [],
      },
    ];

    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="arch-tree-wrapper lg-glass-card" role="region" aria-label="Interactive System Architecture Flow">
        <div class="arch-tree-header">
          <div class="arch-tree-title-group">
            <span class="arch-tree-pill">System Topology</span>
            <h3 class="arch-tree-heading">Agentic Full-Stack Pipeline</h3>
          </div>
          <div class="arch-tree-legend">
            <span class="arch-legend-item"><span class="arch-dot active"></span> Active Signal</span>
            <span class="arch-legend-item"><span class="arch-dot tool"></span> WebMCP Loop</span>
          </div>
        </div>

        <div class="arch-tree-viewport">
          <svg class="arch-tree-svg" viewBox="0 0 1040 400" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="arch-edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0071e3" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#2997ff" stop-opacity="0.9" />
              </linearGradient>
              <filter id="arch-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <!-- Connector Lines -->
            <g class="arch-links">
              <!-- Client -> Edge -->
              <path class="arch-path" id="link-client-edge" d="M 210 200 L 290 200" />
              <circle class="arch-particle" r="4"><animateMotion dur="2s" repeatCount="indefinite" path="M 210 200 L 290 200" /></circle>

              <!-- Edge -> Backend -->
              <path class="arch-path" id="link-edge-backend" d="M 470 200 L 550 200" />
              <circle class="arch-particle" r="4"><animateMotion dur="2s" begin="0.6s" repeatCount="indefinite" path="M 470 200 L 550 200" /></circle>

              <!-- Backend -> Models -->
              <path class="arch-path" id="link-backend-models" d="M 730 185 C 780 185, 780 110, 810 110" />
              <circle class="arch-particle" r="4"><animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite" path="M 730 185 C 780 185, 780 110, 810 110" /></circle>

              <!-- Backend -> Tools -->
              <path class="arch-path" id="link-backend-tools" d="M 730 215 C 780 215, 780 290, 810 290" />
              <circle class="arch-particle tool" r="4"><animateMotion dur="2.4s" begin="1.4s" repeatCount="indefinite" path="M 730 215 C 780 215, 780 290, 810 290" /></circle>
            </g>

            <!-- Nodes -->
            <g class="arch-nodes">
              ${this.nodes.map(node => this.renderNodeSvg(node)).join('')}
            </g>
          </svg>
        </div>

        <!-- Node Details Inspector Drawer -->
        <div class="arch-details-drawer" id="arch-details-drawer" aria-live="polite">
          <div class="arch-drawer-prompt">
            <i class="fas fa-hand-pointer" aria-hidden="true"></i>
            <span>Click or hover any system node to inspect telemetry, protocols, and latency.</span>
          </div>
        </div>
      </div>
    `;
  }

  renderNodeSvg(node) {
    const width = 180;
    const height = 90;
    const rx = node.x - width / 2;
    const ry = node.y - height / 2;

    return `
      <g class="arch-node-group" data-node-id="${node.id}" tabindex="0" role="button" aria-label="${node.title}: ${node.badge}">
        <!-- Card Rect -->
        <rect class="arch-node-rect" x="${rx}" y="${ry}" width="${width}" height="${height}" rx="16" ry="16" />
        
        <!-- Icon Circle -->
        <circle class="arch-node-icon-bg" cx="${rx + 28}" cy="${ry + 28}" r="16" />
        <text class="arch-node-icon-symbol fa" x="${rx + 28}" y="${ry + 33}" text-anchor="middle">&#x${this.getFaUnicode(node.icon)};</text>

        <!-- Titles -->
        <text class="arch-node-title" x="${rx + 54}" y="${ry + 26}">${node.title}</text>
        <text class="arch-node-badge" x="${rx + 54}" y="${ry + 42}">${node.badge}</text>

        <!-- Micro Sparkline / Metric -->
        <line class="arch-node-divider" x1="${rx + 14}" y1="${ry + 54}" x2="${rx + width - 14}" y2="${ry + 54}" />
        <text class="arch-node-subtext" x="${rx + 14}" y="${ry + 74}">
          ${Object.entries(node.metrics)[0][0].toUpperCase()}: ${Object.entries(node.metrics)[0][1]}
        </text>
      </g>
    `;
  }

  getFaUnicode(iconClass) {
    const map = {
      'fa-desktop': 'f108',
      'fa-bolt': 'f0e7',
      'fa-server': 'f233',
      'fa-brain': 'f5dc',
      'fa-cube': 'f1b2',
    };
    return map[iconClass] || 'f013';
  }

  attachEvents() {
    const nodeGroups = this.container.querySelectorAll('.arch-node-group');
    const drawer = this.container.querySelector('#arch-details-drawer');

    nodeGroups.forEach(group => {
      const nodeId = group.getAttribute('data-node-id');
      const nodeData = this.nodes.find(n => n.id === nodeId);

      const activate = () => {
        nodeGroups.forEach(g => g.classList.remove('is-active'));
        group.classList.add('is-active');
        this.renderDrawer(drawer, nodeData);
      };

      group.addEventListener('mouseenter', activate);
      group.addEventListener('click', activate);
      group.addEventListener('focus', activate);
    });
  }

  renderDrawer(drawer, node) {
    if (!drawer || !node) return;
    const metricEntries = Object.entries(node.metrics);

    drawer.innerHTML = `
      <div class="arch-drawer-content">
        <div class="arch-drawer-header">
          <div class="arch-drawer-icon"><i class="fas ${node.icon}"></i></div>
          <div>
            <h4 class="arch-drawer-title">${node.title}</h4>
            <span class="arch-drawer-badge">${node.badge}</span>
          </div>
        </div>
        <p class="arch-drawer-desc">${node.desc}</p>
        <div class="arch-drawer-metrics">
          ${metricEntries
            .map(
              ([k, v]) => `
            <div class="arch-metric-tile">
              <span class="arch-metric-key">${k}</span>
              <strong class="arch-metric-val">${v}</strong>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }
}

export function initArchitectureTree(selector = '#architecture-tree-container') {
  const el = document.querySelector(selector);
  if (!el) return null;
  if (el.dataset.treeHydrated === 'true') return null;
  el.dataset.treeHydrated = 'true';

  return new ArchitectureTree(el);
}
