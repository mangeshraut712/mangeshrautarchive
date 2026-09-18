/**
 * Telegram-style rich media helpers for AssistMe (free path).
 * - Charts from ```chart JSON fences → SVG
 * - Free image URLs via Pollinations (OpenRouter image gen is paid-only)
 * - Safe SVG fence passthrough
 */

export const POLLINATIONS_HOSTS = new Set([
  'image.pollinations.ai',
  'pollinations.ai',
  'gen.pollinations.ai',
]);

const IMAGE_INTENT_RE =
  /\b(generate|create|draw|make|design|paint|illustrate)\b.{0,40}\b(image|picture|illustration|logo|icon|artwork|poster)\b/i;
const CHART_INTENT_RE = /\b(chart|graph|bar chart|pie chart|visualize|plot)\b/i;

export function isImageGenerationIntent(text = '') {
  return IMAGE_INTENT_RE.test(String(text || ''));
}

export function isChartIntent(text = '') {
  return CHART_INTENT_RE.test(String(text || ''));
}

export function buildPollinationsImageUrl(prompt, { width = 768, height = 768 } = {}) {
  const cleaned = String(prompt || '')
    .replace(IMAGE_INTENT_RE, ' ')
    .replace(/\b(of|an|a|the|please|for me)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
  const subject = cleaned || 'abstract portfolio illustration';
  const encoded = encodeURIComponent(subject);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&enhance=true`;
}

export function extractChartPromptFallback(userText = '') {
  // Simple skills chart when user asks to visualize portfolio skills
  if (/\bskills?\b/i.test(userText)) {
    return {
      type: 'bar',
      title: 'Mangesh — core skills',
      labels: ['Java', 'Python', 'Spring', 'AWS', 'React', 'SQL'],
      values: [92, 88, 90, 85, 80, 86],
    };
  }
  return {
    type: 'bar',
    title: 'Sample chart',
    labels: ['A', 'B', 'C', 'D'],
    values: [40, 65, 55, 80],
  };
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderChartSvg(spec = {}) {
  const type = String(spec.type || 'bar').toLowerCase();
  const title = escapeXml(spec.title || 'Chart');
  const labels = Array.isArray(spec.labels) ? spec.labels.slice(0, 12) : [];
  const values = Array.isArray(spec.values)
    ? spec.values.slice(0, 12).map(v => Math.max(0, Number(v) || 0))
    : [];
  if (!labels.length || labels.length !== values.length) {
    return `<p class="rich-chart-error">Chart data incomplete.</p>`;
  }

  const max = Math.max(...values, 1);
  const width = 420;
  const height = 220;
  const pad = 36;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;

  if (type === 'pie') {
    const total = values.reduce((a, b) => a + b, 0) || 1;
    let angle = -Math.PI / 2;
    const cx = width / 2;
    const cy = height / 2 + 6;
    const r = 70;
    const colors = ['#0071e3', '#34c759', '#ff9f0a', '#af52de', '#ff375f', '#64d2ff'];
    const slices = values
      .map((v, i) => {
        const sweep = (v / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        angle += sweep;
        const x2 = cx + r * Math.cos(angle);
        const y2 = cy + r * Math.sin(angle);
        const large = sweep > Math.PI ? 1 : 0;
        return `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}" />`;
      })
      .join('');
    const legend = labels
      .map(
        (label, i) =>
          `<text x="16" y="${24 + i * 16}" font-size="11" fill="currentColor">${escapeXml(label)} (${values[i]})</text>`
      )
      .join('');
    return `<figure class="rich-chart"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}"><title>${title}</title>${slices}${legend}</svg><figcaption>${title}</figcaption></figure>`;
  }

  const barW = plotW / labels.length;
  const bars = values
    .map((v, i) => {
      const h = (v / max) * plotH;
      const x = pad + i * barW + barW * 0.15;
      const y = pad + (plotH - h);
      const w = barW * 0.7;
      return `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#0071e3" />
        <text x="${x + w / 2}" y="${height - 10}" text-anchor="middle" font-size="10" fill="currentColor">${escapeXml(String(labels[i]).slice(0, 8))}</text>
        <text x="${x + w / 2}" y="${y - 4}" text-anchor="middle" font-size="10" fill="currentColor">${v}</text>
      `;
    })
    .join('');

  return `<figure class="rich-chart"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}"><title>${title}</title>
    <text x="${pad}" y="18" font-size="13" font-weight="600" fill="currentColor">${title}</text>
    <line x1="${pad}" y1="${pad + plotH}" x2="${pad + plotW}" y2="${pad + plotH}" stroke="currentColor" opacity="0.25" />
    ${bars}
  </svg><figcaption>${title}</figcaption></figure>`;
}

/**
 * Pull a trusted Pollinations (or other https) image URL out of messy model markdown.
 * @param {string} raw
 * @returns {string}
 */
export function extractTrustedMediaUrl(raw) {
  const text = String(raw || '')
    .trim()
    .replace(/^<|>$/g, '')
    .replace(/\s+/g, '');
  const polli = text.match(/https:\/\/(?:image\.|gen\.)?pollinations\.ai\/[^\s)<>"']+/i);
  const candidate = polli ? polli[0].replace(/[.,;]+$/g, '') : text;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:') return '';
    if (POLLINATIONS_HOSTS.has(parsed.hostname)) return parsed.toString();
  } catch {
    return '';
  }
  return '';
}

/**
 * Lightweight flowchart renderer for ```mermaid fences (no mermaid.js vendor).
 * Renders HTML pills so geometry survives DOMPurify. Supports
 * `flowchart|graph LR|TD` with `A[label] --> B[label]`.
 * @param {string} source
 * @returns {string}
 */
export function renderMermaidDiagram(source = '') {
  const text = String(source || '').trim();
  if (!text) return '<p class="rich-chart-error">Empty diagram.</p>';

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !/^style\s+/i.test(line) && !/^classDef\b/i.test(line));
  const header = lines[0] || '';
  if (!/^(flowchart|graph)\b/i.test(header)) {
    return `<pre class="rich-mermaid-fallback"><code>${escapeXml(text)}</code></pre>`;
  }

  const horizontal = !/\b(TD|TB|BT)\b/i.test(header);
  const nodes = new Map();
  const edges = [];
  const nodeToken = /([A-Za-z][\w]*)\s*(?:\[([^\]]+)\]|\(([^)]+)\)|\{([^}]+)\})?/g;

  const remember = (id, label) => {
    if (!id) return;
    const existing = nodes.get(id);
    const nextLabel = label || existing?.label || id;
    nodes.set(id, { id, label: nextLabel });
  };

  for (const line of lines.slice(1)) {
    const edge = /([A-Za-z][\w]*)[^\n-]*?-->\s*([A-Za-z][\w]*)/.exec(line);
    if (edge) edges.push({ from: edge[1], to: edge[2] });
    nodeToken.lastIndex = 0;
    let token;
    while ((token = nodeToken.exec(line)) !== null) {
      remember(token[1], token[2] || token[3] || token[4] || '');
    }
  }

  if (!nodes.size) {
    return `<pre class="rich-mermaid-fallback"><code>${escapeXml(text)}</code></pre>`;
  }

  const list = [...nodes.values()];
  const byId = Object.fromEntries(list.map(node => [node.id, node]));
  const used = new Set();
  const sequence = [];
  if (edges.length) {
    let cursor = edges[0].from;
    sequence.push(cursor);
    used.add(cursor);
    for (const edge of edges) {
      if (!used.has(edge.to)) {
        sequence.push(edge.to);
        used.add(edge.to);
      }
    }
    for (const node of list) {
      if (!used.has(node.id)) sequence.push(node.id);
    }
  } else {
    list.forEach(node => sequence.push(node.id));
  }

  const rowClass = horizontal ? 'rich-mermaid-row' : 'rich-mermaid-col';
  const parts = [];
  sequence.forEach((id, index) => {
    const label = escapeXml(String(byId[id]?.label || id).slice(0, 28));
    if (index) {
      parts.push(
        `<span class="rich-mermaid-arrow" aria-hidden="true">${horizontal ? '→' : '↓'}</span>`
      );
    }
    parts.push(`<span class="rich-mermaid-node">${label}</span>`);
  });

  return `<figure class="rich-mermaid"><div class="${rowClass}" role="img" aria-label="Flowchart">${parts.join('')}</div></figure>`;
}

/**
 * Rewrite markdown before marked parse:
 * - ```chart JSON → HTML figure (placeholder token)
 * - ```svg → sanitized inline SVG figure
 * - ```mermaid flowchart → HTML flow pills (DOMPurify strips SVG geometry)
 * - Inject pollinations image when intent detected and no image markdown yet
 */
export function preprocessRichMediaMarkdown(markdown, { userPrompt = '', slots = [] } = {}) {
  let text = String(markdown || '');
  const stash = html => {
    const token = `§RICHSLOT${slots.length}§`;
    slots.push(html);
    return `\n\n${token}\n\n`;
  };

  text = text.replace(/```chart\s*([\s\S]*?)```/gi, (_m, body) => {
    try {
      const spec = JSON.parse(String(body).trim());
      return stash(renderChartSvg(spec));
    } catch {
      return stash('<p class="rich-chart-error">Could not parse chart JSON.</p>');
    }
  });

  text = text.replace(/```svg\s*([\s\S]*?)```/gi, (_m, body) => {
    const svg = String(body || '')
      .trim()
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    if (!/^<svg[\s>]/i.test(svg) || /<script/i.test(svg)) {
      return stash('<p class="rich-chart-error">SVG blocked for safety.</p>');
    }
    return stash(`<figure class="rich-svg-media">${svg}</figure>`);
  });

  text = text.replace(/```mermaid\s*([\s\S]*?)```/gi, (_m, body) => {
    return stash(renderMermaidDiagram(body));
  });

  text = text.replace(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?\s*\)/g, (full, alt, href) => {
    const trusted = extractTrustedMediaUrl(href);
    if (!trusted) return full;
    return `![${alt}](${trusted})`;
  });

  if (
    userPrompt &&
    isImageGenerationIntent(userPrompt) &&
    !/!\[/.test(text) &&
    !/pollinations\.ai/.test(text)
  ) {
    const url = buildPollinationsImageUrl(userPrompt);
    text += `\n\n![Generated image](${url})\n`;
  }

  if (
    /pollinations\.ai/.test(text) &&
    !/!\[[^\]]*\]\(\s*https:\/\/(?:image\.|gen\.)?pollinations\.ai/i.test(text)
  ) {
    const url = extractTrustedMediaUrl(text);
    if (url) text += `\n\n![Generated image](${url})\n`;
  }

  if (userPrompt && isChartIntent(userPrompt) && !/```chart|class="rich-chart"/.test(text)) {
    text += `\n\n${renderChartSvg(extractChartPromptFallback(userPrompt))}\n`;
  }

  return text;
}
