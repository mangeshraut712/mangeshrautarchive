/**
 * Architecture diagrams — trees, queues, bars, and network graphs (Apple-style SVG).
 */

const DIAGRAM_CAPTIONS = {
  'dual-host':
    'Vercel CDN + GitHub Pages static shell with FastAPI on Vercel for /api — traffic split measured in production.',
  assistme:
    'Local WebMCP stack handles sub-50ms actions; intent router branches to site facts or OpenRouter for LLM paths.',
  build:
    'src → build → QA gates (Lighthouse, a11y, E2E) → dual deploy to Vercel preview and GitHub Pages.',
};

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function renderDualHostDiagram(gradId) {
  return `<svg class="systems-arch-svg systems-arch-svg--network" viewBox="0 0 640 280" role="img" aria-label="Dual host network topology">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgb(0 113 227 / 35%)" />
        <stop offset="100%" stop-color="rgb(90 200 250 / 12%)" />
      </linearGradient>
    </defs>
    <path class="arch-edge arch-edge--glow" d="M120 140 H200 M320 90 H400 M320 190 H400 M480 140 H520" />
    <circle class="arch-node-port" cx="80" cy="140" r="36" />
    <text class="arch-node-text" x="80" y="145" text-anchor="middle">Client</text>
    <rect class="arch-node arch-node--cdn" x="168" y="58" width="104" height="48" rx="14" />
    <text class="arch-node-text" x="220" y="87" text-anchor="middle">Vercel CDN</text>
    <rect class="arch-node" x="168" y="174" width="104" height="48" rx="14" />
    <text class="arch-node-text" x="220" y="203" text-anchor="middle">GH Pages</text>
    <rect class="arch-node arch-node--accent" x="400" y="108" width="120" height="64" rx="16" fill="url(#${gradId})" />
    <text class="arch-node-text" x="460" y="136" text-anchor="middle">FastAPI</text>
    <text class="arch-node-text arch-node-text--sub" x="460" y="154" text-anchor="middle">/api</text>
    <g class="arch-bar-group" transform="translate(400 220)">
      <text class="arch-bar-label" x="0" y="0">Traffic split</text>
      <rect class="arch-bar-track" x="0" y="8" width="120" height="8" rx="4" />
      <rect class="arch-bar-fill arch-bar-fill--a is-animated" x="0" y="8" width="0" height="8" rx="4" data-target-w="72" />
      <rect class="arch-bar-fill arch-bar-fill--b is-animated" x="72" y="8" width="0" height="8" rx="4" data-target-w="48" />
    </g>
  </svg>`;
}

export function renderAssistMeDiagram() {
  return `<svg class="systems-arch-svg systems-arch-svg--queue" viewBox="0 0 640 300" role="img" aria-label="AssistMe queue and routing flow">
    <text class="arch-diagram-title" x="320" y="28" text-anchor="middle">Request routing — stack vs cloud</text>
    <rect class="arch-queue-box" x="40" y="48" width="160" height="200" rx="16" />
    <text class="arch-queue-label" x="120" y="72" text-anchor="middle">Local stack</text>
    <g class="arch-stack-items">
      <rect x="60" y="88" width="120" height="32" rx="8" class="arch-stack-item arch-stack-item--top" />
      <text x="120" y="108" text-anchor="middle" class="arch-stack-text">WebMCP tools</text>
      <rect x="60" y="126" width="120" height="32" rx="8" class="arch-stack-item" />
      <text x="120" y="146" text-anchor="middle" class="arch-stack-text">Site facts</text>
      <rect x="60" y="164" width="120" height="32" rx="8" class="arch-stack-item" />
      <text x="120" y="184" text-anchor="middle" class="arch-stack-text">Regex router</text>
    </g>
    <path class="arch-edge" d="M200 148 H260" />
    <g transform="translate(270 100)">
      <circle cx="50" cy="50" r="44" class="arch-node arch-node--accent" />
      <text x="50" y="48" text-anchor="middle" class="arch-node-text">Router</text>
      <text x="50" y="64" text-anchor="middle" class="arch-node-text arch-node-text--sub">decision</text>
    </g>
    <g class="arch-tree" transform="translate(400 56)">
      <line x1="60" y1="40" x2="30" y2="90" class="arch-tree-edge" />
      <line x1="60" y1="40" x2="90" y2="90" class="arch-tree-edge" />
      <line x1="30" y1="90" x2="10" y2="150" class="arch-tree-edge" />
      <line x1="30" y1="90" x2="50" y2="150" class="arch-tree-edge" />
      <line x1="90" y1="90" x2="110" y2="150" class="arch-tree-edge" />
      <circle cx="60" cy="40" r="22" class="arch-tree-node" />
      <text x="60" y="45" text-anchor="middle" class="arch-tree-text">Intent</text>
      <rect x="0" y="150" width="70" height="36" rx="10" class="arch-tree-leaf" />
      <text x="35" y="173" text-anchor="middle" class="arch-tree-text">Local</text>
      <rect x="80" y="150" width="70" height="36" rx="10" class="arch-tree-leaf arch-tree-leaf--cloud" />
      <text x="115" y="173" text-anchor="middle" class="arch-tree-text">OpenRouter</text>
    </g>
    <g class="arch-bar-group" transform="translate(40 260)">
      <text class="arch-bar-label" x="0" y="0">Latency (ms)</text>
      ${[
        { label: 'Nav', w: 28 },
        { label: 'Theme', w: 12 },
        { label: 'LLM', w: 120 },
      ]
        .map((b, i) => {
          const h = Math.round((b.w / 120) * 56);
          const y = 56 - h;
          return `<g transform="translate(${i * 72} 10)">
        <rect class="arch-bar-track" width="56" height="56" y="0" rx="6" />
        <rect class="arch-bar-fill arch-bar-fill--latency is-animated" width="56" height="0" y="56" rx="6" data-target-h="${h}" data-target-y="${y}" />
        <text class="arch-bar-value" x="28" y="68" text-anchor="middle">${b.w}</text>
        <text class="arch-bar-value" x="28" y="80" text-anchor="middle">${b.label}</text>
      </g>`;
        })
        .join('')}
    </g>
  </svg>`;
}

export function renderCiPipelineDiagram() {
  return `<svg class="systems-arch-svg systems-arch-svg--pipeline" viewBox="0 0 640 260" role="img" aria-label="CI pipeline with quality gates">
    <text class="arch-diagram-title" x="320" y="28" text-anchor="middle">Build pipeline — gates & deploy</text>
    ${[
      { x: 24, label: 'src/', w: 90 },
      { x: 130, label: 'build', w: 100 },
      { x: 246, label: 'QA', w: 110 },
      { x: 372, label: 'Vercel', w: 88 },
      { x: 476, label: 'Pages', w: 88 },
    ]
      .map(
        (s, i) => `<g transform="translate(${s.x} 80)">
      <rect class="arch-pipeline-stage" width="${s.w}" height="52" rx="14" />
      <text class="arch-node-text" x="${s.w / 2}" y="32" text-anchor="middle">${s.label}</text>
      ${i < 4 ? `<path class="arch-edge" d="M${s.w + 4} 26 H${s.w + 20}" />` : ''}
    </g>`
      )
      .join('')}
    <g transform="translate(246 150)">
      <text class="arch-bar-label" x="55" y="0" text-anchor="middle">Gate scores</text>
      ${[
        { label: 'LH', v: 95 },
        { label: 'A11y', v: 95 },
        { label: 'E2E', v: 100 },
      ]
        .map((g, i) => {
          const h = (g.v / 100) * 70;
          const y = 70 - h;
          return `<g transform="translate(${i * 48} 12)">
        <rect class="arch-bar-track" width="36" height="70" rx="6" />
        <rect class="arch-bar-fill arch-bar-fill--gate is-animated" width="36" height="0" y="70" rx="6" data-target-h="${h}" data-target-y="${y}" />
        <text class="arch-bar-value" x="18" y="82" text-anchor="middle">${g.v}</text>
      </g>`;
        })
        .join('')}
    </g>
  </svg>`;
}

function animateArchBars(host) {
  host.querySelectorAll('.arch-bar-fill.is-animated').forEach(bar => {
    const targetW = bar.getAttribute('data-target-w');
    const targetH = bar.getAttribute('data-target-h');
    const targetY = bar.getAttribute('data-target-y');
    bar.setAttribute('width', '0');
    if (targetH) {
      bar.setAttribute('height', '0');
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (targetW) bar.setAttribute('width', targetW);
        if (targetH) {
          bar.setAttribute('height', targetH);
          if (targetY) bar.setAttribute('y', targetY);
        }
      });
    });
  });
}

export function remountArchPanel(panelId) {
  const host = document.querySelector(`[data-arch-diagram="${panelId}"]`);
  if (host) animateArchBars(host);
}

export function mountArchitectureDiagrams() {
  const map = {
    'dual-host': () => renderDualHostDiagram(uid('archGrad')),
    assistme: renderAssistMeDiagram,
    build: renderCiPipelineDiagram,
  };

  Object.entries(map).forEach(([id, render]) => {
    const host = document.querySelector(`[data-arch-diagram="${id}"]`);
    if (!host) return;
    const svg = typeof render === 'function' ? render() : render;
    const caption = DIAGRAM_CAPTIONS[id] || '';
    host.innerHTML = `${svg}<p class="systems-arch-caption">${caption}</p>`;
    animateArchBars(host);
  });
}
