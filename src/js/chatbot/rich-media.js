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
 * Rewrite markdown before marked parse:
 * - ```chart JSON → HTML figure (placeholder token)
 * - ```svg → sanitized inline SVG figure
 * - Inject pollinations image when intent detected and no image markdown yet
 */
export function preprocessRichMediaMarkdown(markdown, { userPrompt = '' } = {}) {
  let text = String(markdown || '');

  text = text.replace(/```chart\s*([\s\S]*?)```/gi, (_m, body) => {
    try {
      const spec = JSON.parse(String(body).trim());
      return `\n\n${renderChartSvg(spec)}\n\n`;
    } catch {
      return '\n\n<p class="rich-chart-error">Could not parse chart JSON.</p>\n\n';
    }
  });

  text = text.replace(/```svg\s*([\s\S]*?)```/gi, (_m, body) => {
    const svg = String(body || '').trim();
    if (!/^<svg[\s>]/i.test(svg) || /<script/i.test(svg)) {
      return '\n\n<p class="rich-chart-error">SVG blocked for safety.</p>\n\n';
    }
    return `\n\n<figure class="rich-svg-media">${svg}</figure>\n\n`;
  });

  if (
    userPrompt &&
    isImageGenerationIntent(userPrompt) &&
    !/!\[/.test(text) &&
    !/image\.pollinations\.ai/.test(text)
  ) {
    const url = buildPollinationsImageUrl(userPrompt);
    text += `\n\n![Generated image](${url})\n`;
  }

  if (userPrompt && isChartIntent(userPrompt) && !/```chart|class="rich-chart"/.test(text)) {
    text += `\n\n${renderChartSvg(extractChartPromptFallback(userPrompt))}\n`;
  }

  return text;
}
