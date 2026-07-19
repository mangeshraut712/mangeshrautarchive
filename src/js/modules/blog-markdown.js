import { escapeHTML } from '../utils/escape-html.js';
/**
 * Shared blog markdown parser — used by blog-loader (browser) and build (Node).
 * Supports headings, lists, quotes, code, HR, and media blocks:
 *   :::figure / :::video / :::audio / :::chart / :::callout / :::embed
 */

function safeHref(href = '') {
  try {
    const url = new URL(href, 'https://example.com');
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
      return '#';
    }
    return href;
  } catch {
    return '#';
  }
}

function safeMediaSrc(src = '') {
  const value = String(src || '').trim();
  if (!value) return '';
  if (
    value.startsWith('assets/') ||
    value.startsWith('/assets/') ||
    value.startsWith('../assets/')
  ) {
    return value;
  }
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return value;
    }
  } catch {
    // fall through
  }
  return '';
}

export function slugifyHeading(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function parseInline(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="article-inline-code">$1</code>')
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      (_match, label, href) =>
        `<a href="${safeHref(href)}" target="_blank" rel="noopener noreferrer" class="article-link">${label}</a>`
    );
}

function parseBlockAttrs(body = '') {
  const attrs = {};
  body.split('\n').forEach(line => {
    const match = line.match(/^([a-zA-Z][\w-]*)\s*:\s*(.+)$/);
    if (match) {
      attrs[match[1].toLowerCase()] = match[2].trim();
    }
  });
  return attrs;
}

function renderMediaBlock(kind, body) {
  const a = parseBlockAttrs(body);
  if (kind === 'figure') {
    const src = safeMediaSrc(a.src);
    if (!src) return '';
    const alt = escapeHTML(a.alt || a.caption || '');
    const caption = a.caption ? `<figcaption>${escapeHTML(a.caption)}</figcaption>` : '';
    return `<figure class="article-figure">
      <img src="${escapeHTML(src)}" alt="${alt}" loading="lazy" decoding="async" width="${escapeHTML(a.width || '1200')}" height="${escapeHTML(a.height || '675')}" />
      ${caption}
    </figure>`;
  }
  if (kind === 'video') {
    const src = safeMediaSrc(a.src);
    if (!src) return '';
    const title = escapeHTML(a.title || 'Embedded video');
    const isYoutube = /youtube\.com|youtu\.be|youtube-nocookie/.test(src);
    if (isYoutube || a.embed === 'iframe') {
      return `<figure class="article-video">
        <div class="article-video__frame">
          <iframe src="${escapeHTML(src)}" title="${title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        ${a.caption ? `<figcaption>${escapeHTML(a.caption)}</figcaption>` : ''}
      </figure>`;
    }
    return `<figure class="article-video">
      <video controls preload="metadata" playsinline poster="${escapeHTML(safeMediaSrc(a.poster) || '')}">
        <source src="${escapeHTML(src)}" type="${escapeHTML(a.type || 'video/mp4')}" />
        Your browser does not support the video tag.
      </video>
      ${a.caption ? `<figcaption>${escapeHTML(a.caption)}</figcaption>` : ''}
    </figure>`;
  }
  if (kind === 'audio') {
    const src = safeMediaSrc(a.src);
    if (!src) return '';
    return `<figure class="article-audio">
      <div class="article-audio__meta">
        <span class="article-audio__label">${escapeHTML(a.label || 'Listen')}</span>
        <strong>${escapeHTML(a.title || 'Audio')}</strong>
      </div>
      <audio controls preload="metadata" src="${escapeHTML(src)}">Your browser does not support audio.</audio>
      ${a.caption ? `<figcaption>${escapeHTML(a.caption)}</figcaption>` : ''}
    </figure>`;
  }
  if (kind === 'chart') {
    const title = escapeHTML(a.title || 'Chart');
    const bars = String(a.bars || '')
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const [label, valueRaw] = part.split('|').map(s => s.trim());
        const value = Math.max(0, Math.min(100, Number(valueRaw) || 0));
        return `<div class="article-chart__row">
          <span class="article-chart__label">${escapeHTML(label || '')}</span>
          <div class="article-chart__track" role="img" aria-label="${escapeHTML(label || '')} ${value}%">
            <div class="article-chart__fill" style="width:${value}%"></div>
          </div>
          <span class="article-chart__value">${value}</span>
        </div>`;
      })
      .join('');
    return `<figure class="article-chart">
      <figcaption class="article-chart__title">${title}</figcaption>
      <div class="article-chart__bars">${bars}</div>
      ${a.note ? `<p class="article-chart__note">${escapeHTML(a.note)}</p>` : ''}
    </figure>`;
  }
  if (kind === 'callout') {
    const type = ['note', 'warn', 'tip', 'source'].includes(a.type) ? a.type : 'note';
    const label = escapeHTML(a.label || type.toUpperCase());
    const text = parseInline(a.text || body.replace(/^type:.*$/im, '').trim());
    return `<aside class="article-callout article-callout--${type}" role="note">
      <span class="article-callout__label">${label}</span>
      <p>${text}</p>
    </aside>`;
  }
  if (kind === 'embed') {
    const href = safeHref(a.href || a.url || '');
    if (!href || href === '#') return '';
    return `<a class="article-embed-card" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">
      <span class="article-embed-card__kicker">${escapeHTML(a.kicker || 'Source')}</span>
      <strong class="article-embed-card__title">${escapeHTML(a.title || href)}</strong>
      ${a.desc ? `<span class="article-embed-card__desc">${escapeHTML(a.desc)}</span>` : ''}
    </a>`;
  }
  return '';
}

export function parseBlogContent(content, { addHeadingIds = false } = {}) {
  if (!content) return { html: '', headings: [] };

  const codeBlocks = [];
  let placeholderCount = 0;

  let processedContent = content.replace(/```([\s\S]*?)```/g, (_match, code) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${placeholderCount}__`;
    codeBlocks.push({ placeholder, code: code.trim() });
    placeholderCount += 1;
    return placeholder;
  });

  // Media blocks :::kind ... :::
  const mediaBlocks = [];
  processedContent = processedContent.replace(
    /:::([a-z]+)\n([\s\S]*?):::/g,
    (_match, kind, body) => {
      const placeholder = `__MEDIA_BLOCK_PLACEHOLDER_${mediaBlocks.length}__`;
      mediaBlocks.push({ placeholder, kind, body: body.trim() });
      return placeholder;
    }
  );

  const paragraphs = processedContent.split(/\n\n+/);
  const html = [];
  const headings = [];
  let inList = false;
  let listItems = [];

  const closeList = () => {
    if (inList) {
      html.push(`<ul class="article-list">${listItems.join('')}</ul>`);
      listItems = [];
      inList = false;
    }
  };

  const codeMap = new Map(codeBlocks.map(c => [c.placeholder, c]));
  const mediaMap = new Map(mediaBlocks.map(m => [m.placeholder, m]));

  const pushHeading = (level, text) => {
    const id = slugifyHeading(text);
    headings.push({ level, text, id });
    const idAttr = addHeadingIds && id ? ` id="${escapeHTML(id)}"` : '';
    const className = `article-h${level}`;
    html.push(`<h${level} class="${className}"${idAttr}>${parseInline(text)}</h${level}>`);
  };

  for (let block of paragraphs) {
    block = block.trim();
    if (!block) continue;

    if (block.startsWith('__CODE_BLOCK_PLACEHOLDER_')) {
      closeList();
      const found = codeMap.get(block);
      if (found) {
        const escapedCode = found.code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        html.push(`<pre class="article-code-block"><code>${escapedCode}</code></pre>`);
      }
      continue;
    }

    if (block.startsWith('__MEDIA_BLOCK_PLACEHOLDER_')) {
      closeList();
      const found = mediaMap.get(block);
      if (found) {
        const rendered = renderMediaBlock(found.kind, found.body);
        if (rendered) html.push(rendered);
      }
      continue;
    }

    if (block.startsWith('# ')) {
      closeList();
      pushHeading(1, block.substring(2));
      continue;
    }
    if (block.startsWith('## ')) {
      closeList();
      pushHeading(2, block.substring(3));
      continue;
    }
    if (block.startsWith('### ')) {
      closeList();
      pushHeading(3, block.substring(4));
      continue;
    }

    if (block === '---' || block === '***') {
      closeList();
      html.push('<hr class="article-hr">');
      continue;
    }

    if (block.startsWith('>')) {
      closeList();
      const lines = block.split('\n').map(line => line.replace(/^>\s*/, ''));
      html.push(
        `<blockquote class="article-blockquote">${parseInline(lines.join('<br>'))}</blockquote>`
      );
      continue;
    }

    const lines = block.split('\n');
    const firstLine = lines[0].trim();
    if (firstLine.startsWith('- ') || firstLine.startsWith('* ') || firstLine.startsWith('• ')) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
          listItems.push(
            `<li class="article-list-item">${parseInline(line.replace(/^[-*•]\s*/, ''))}</li>`
          );
        } else if (line) {
          if (listItems.length > 0) {
            listItems[listItems.length - 1] += ` ${parseInline(line)}`;
          } else {
            listItems.push(`<li class="article-list-item">${parseInline(line)}</li>`);
          }
        }
      }
      continue;
    }

    closeList();
    html.push(`<p class="article-p">${parseInline(block)}</p>`);
  }

  closeList();
  return { html: html.join('\n'), headings: headings.filter(h => h.level >= 2) };
}

export function buildTableOfContents(headings = []) {
  if (!headings.length) return '';
  const items = headings
    .map(
      h =>
        `<li class="article-toc__item article-toc__item--h${h.level}"><a href="#${escapeHTML(h.id)}">${escapeHTML(h.text)}</a></li>`
    )
    .join('');
  return `<nav class="article-toc" aria-label="On this page"><p class="article-toc__title">On this page</p><ol class="article-toc__list">${items}</ol></nav>`;
}

export function formatBlogDate(dateString) {
  try {
    // YYYY-MM-DD as local calendar day (avoid UTC midnight → previous-day shift)
    const raw = String(dateString || '').trim();
    const isoDay = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = isoDay
      ? new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]), 12, 0, 0)
      : new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getAllTags(posts = []) {
  const tags = new Set();
  posts.forEach(post => (post.tags || []).forEach(tag => tags.add(tag)));
  return [...tags].sort((a, b) => a.localeCompare(b));
}

/** Most frequent tags first — keeps archive filter chips quiet. */
export function getTopTags(posts = [], limit = 8) {
  const counts = new Map();
  posts.forEach(post => {
    (post.tags || []).forEach(tag => {
      const key = String(tag || '').trim();
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, Math.max(0, limit))
    .map(([tag]) => tag);
}

export function getRelatedPosts(posts = [], currentId, limit = 3) {
  const current = posts.find(p => p.id === currentId);
  if (!current) return posts.filter(p => p.id !== currentId).slice(0, limit);
  const currentTags = new Set(current.tags || []);
  return posts
    .filter(p => p.id !== currentId)
    .map(p => ({
      post: p,
      score: (p.tags || []).reduce((n, t) => n + (currentTags.has(t) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date))
    .slice(0, limit)
    .map(x => x.post);
}

export { escapeHTML };
