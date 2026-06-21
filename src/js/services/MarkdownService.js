/**
 * MarkdownService — Telegram-style rich chat rendering for AssistMe
 *
 * Extended GFM markdown → sanitized HTML with tables, nested lists, task lists,
 * math (KaTeX), footnotes, spoilers, collapsible sections, and trusted inline images.
 */

import { Marked, DOMPurify, katex, markedFootnote } from '../vendor/rich-markdown.js';

export const SHOW_MORE_CHAR_THRESHOLD = 8000;
export const SHOW_MORE_PREVIEW_CHARS = 4000;

export const TRUSTED_IMAGE_HOSTS = new Set([
  'mangeshraut.pro',
  'www.mangeshraut.pro',
  'mangeshraut712.github.io',
  'raw.githubusercontent.com',
  'github.com',
  'avatars.githubusercontent.com',
  'lastfm.freetls.fastly.net',
  'i.scdn.co',
]);

const SAFE_URL_PATTERN = /^(https?:|mailto:|tel:|\/(?!\/)|#)/i;

const KATEX_TAGS = [
  'math',
  'semantics',
  'mrow',
  'mi',
  'mo',
  'mn',
  'msup',
  'msub',
  'mfrac',
  'mspace',
  'mtext',
  'annotation',
  'menclose',
  'mstyle',
  'mtable',
  'mtr',
  'mtd',
  'svg',
  'path',
  'line',
  'rect',
  'g',
];

const KATEX_ATTR = [
  'class',
  'style',
  'aria-hidden',
  'encoding',
  'xmlns',
  'width',
  'height',
  'viewBox',
  'd',
  'fill',
];

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isTrustedImageUrl(url) {
  try {
    const parsed = new URL(url, 'https://mangeshraut.pro');
    if (parsed.protocol !== 'https:') return false;
    return TRUSTED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function splitMathSegments(markdown) {
  const segments = [];
  let cursor = 0;
  const pattern = /(\$\$[\s\S]+?\$\$|\$(?!\$)[^\n$]+?\$(?!\$))/g;
  let match;

  while ((match = pattern.exec(markdown)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: 'text', value: markdown.slice(cursor, match.index) });
    }
    const raw = match[0];
    const display = raw.startsWith('$$');
    const tex = display ? raw.slice(2, -2).trim() : raw.slice(1, -1).trim();
    segments.push({ type: 'math', display, tex });
    cursor = match.index + raw.length;
  }

  if (cursor < markdown.length) {
    segments.push({ type: 'text', value: markdown.slice(cursor) });
  }

  return segments;
}

function renderMathSegment(tex, displayMode) {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
    });
  } catch {
    return displayMode
      ? `<pre class="math-error">${escapeHtml(tex)}</pre>`
      : `<code>${escapeHtml(tex)}</code>`;
  }
}

function preprocessMath(markdown) {
  const segments = splitMathSegments(markdown);
  if (segments.every(segment => segment.type === 'text')) {
    return markdown;
  }

  return segments
    .map(segment => {
      if (segment.type === 'text') return segment.value;
      return renderMathSegment(segment.tex, segment.display);
    })
    .join('');
}

class MarkdownService {
  constructor() {
    this._configured = false;
    this._marked = null;
  }

  _ensureConfigured() {
    if (this._configured) return;

    const marked = new Marked({
      gfm: true,
      breaks: true,
      pedantic: false,
    });

    marked.use(markedFootnote());
    marked.use({
      extensions: [
        {
          name: 'spoiler',
          level: 'inline',
          start(src) {
            return src.indexOf('||');
          },
          tokenizer(src) {
            const match = /^\|\|([\s\S]+?)\|\|/.exec(src);
            if (!match) return undefined;
            return {
              type: 'spoiler',
              raw: match[0],
              text: match[1],
            };
          },
          renderer(token) {
            return `<span class="rich-spoiler" tabindex="0" role="button" aria-label="Reveal spoiler">${escapeHtml(token.text)}</span>`;
          },
        },
        {
          name: 'detailsBlock',
          level: 'block',
          start(src) {
            return src.match(/^:{3,}/)?.index;
          },
          tokenizer(src) {
            const match = /^:{3,}\s*([^\n]+)\n([\s\S]*?)\n:{3,}/.exec(src);
            if (!match) return undefined;
            return {
              type: 'detailsBlock',
              raw: match[0],
              summary: match[1].trim(),
              text: match[2].trim(),
            };
          },
          renderer(token) {
            const inner = marked.parse(token.text);
            return `<details class="rich-details"><summary>${escapeHtml(token.summary)}</summary><div class="rich-details-body">${inner}</div></details>`;
          },
        },
      ],
    });

    marked.use({
      renderer: {
        image({ href, title, text }) {
          if (!href || !isTrustedImageUrl(href)) {
            return `<span class="rich-image-blocked" title="Image blocked for security">[image: ${escapeHtml(text || 'untrusted')}]</span>`;
          }
          const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
          const alt = escapeHtml(text || 'inline image');
          return `<figure class="rich-inline-media"><img src="${escapeHtml(href)}" alt="${alt}" loading="lazy" decoding="async"${titleAttr} /></figure>`;
        },
        link({ href, title, text }) {
          if (!href || !SAFE_URL_PATTERN.test(href)) {
            return text;
          }
          const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
          return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
        },
      },
    });
    this._marked = marked;
    this._configured = true;
  }

  _sanitize(html) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        's',
        'del',
        'sub',
        'sup',
        'code',
        'pre',
        'blockquote',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'a',
        'hr',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'span',
        'div',
        'figure',
        'figcaption',
        'img',
        'details',
        'summary',
        'input',
        'label',
        'section',
        ...KATEX_TAGS,
      ],
      ALLOWED_ATTR: [
        'href',
        'class',
        'title',
        'target',
        'rel',
        'src',
        'alt',
        'loading',
        'decoding',
        'type',
        'checked',
        'disabled',
        'aria-label',
        'aria-hidden',
        'role',
        'tabindex',
        'start',
        'open',
        'id',
        'data-footnote-ref',
        'data-footnote-backref',
        ...KATEX_ATTR,
      ],
      ALLOWED_URI_REGEXP: SAFE_URL_PATTERN,
      ALLOW_DATA_ATTR: true,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'button'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'style'],
      FORCE_BODY: false,
      ADD_TAGS: KATEX_TAGS,
      ADD_ATTR: KATEX_ATTR,
    });
  }

  /**
   * Render Markdown to a sanitised HTML string.
   * @param {string} markdown
   * @returns {string}
   */
  render(markdown) {
    if (!markdown || typeof markdown !== 'string') return '';

    this._ensureConfigured();

    try {
      const withMath = preprocessMath(markdown);
      let html = this._marked.parse(withMath);
      html = html
        .replace(/<table/g, '<div class="rich-table-wrap"><table')
        .replace(/<\/table>/g, '</table></div>');
      return this._sanitize(html);
    } catch (err) {
      console.warn('Markdown parse error:', err);
      return `<p>${escapeHtml(markdown)}</p>`;
    }
  }

  /**
   * Render assistant chat output with optional Show more wrapper.
   * @param {string} markdown
   * @returns {{ html: string, collapsed: boolean, charCount: number }}
   */
  renderForChat(markdown) {
    const charCount = markdown?.length || 0;
    if (!markdown || charCount <= SHOW_MORE_CHAR_THRESHOLD) {
      return {
        html: this.render(markdown),
        collapsed: false,
        charCount,
      };
    }

    const previewMarkdown = `${markdown.slice(0, SHOW_MORE_PREVIEW_CHARS).trim()}\n\n…`;
    const previewHtml = this.render(previewMarkdown);
    const fullHtml = this.render(markdown);

    return {
      html: `<div class="rich-message rich-message--collapsed" data-rich-collapsed="true">
  <div class="rich-message-preview">${previewHtml}</div>
  <div class="rich-message-full" hidden>${fullHtml}</div>
  <button type="button" class="rich-show-more-btn" aria-expanded="false">Show more</button>
</div>`,
      collapsed: true,
      charCount,
    };
  }

  /**
   * Wire spoiler taps and show-more buttons inside a message content root.
   * @param {HTMLElement} root
   */
  bindRichInteractions(root) {
    if (!root) return;

    root.querySelectorAll('.rich-spoiler:not([data-rich-bound])').forEach(node => {
      node.dataset.richBound = 'true';
      const reveal = () => node.classList.add('revealed');
      node.addEventListener('click', reveal);
      node.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          reveal();
        }
      });
    });

    root.querySelectorAll('.rich-show-more-btn:not([data-rich-bound])').forEach(button => {
      button.dataset.richBound = 'true';
      button.addEventListener('click', () => {
        const host = button.closest('.rich-message');
        const preview = host?.querySelector('.rich-message-preview');
        const full = host?.querySelector('.rich-message-full');
        if (!host || !preview || !full) return;

        const expanded = host.classList.toggle('rich-message--expanded');
        host.classList.toggle('rich-message--collapsed', !expanded);
        preview.hidden = expanded;
        full.hidden = !expanded;
        button.setAttribute('aria-expanded', String(expanded));
        button.textContent = expanded ? 'Show less' : 'Show more';
      });
    });
  }

  containsMarkdown(text) {
    if (!text) return false;
    return /(\*\*|__|`|\$\$?|#{1,6}\s|\[[ xX]\]|^\s*[-*+]\s|^\s*\d+\.\s|\[.*\]\(|>\s|^\|.*\||\|\|.+?\|\||\[\^[^\]]+\]|^:{3,})/m.test(
      text
    );
  }

  toPlainText(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\$\$([\s\S]+?)\$\$/g, '$1')
      .replace(/\$(.+?)\$/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/!\[.*?\]\(.+?\)/g, '')
      .replace(/^\s*[-*+]\s/gm, '')
      .replace(/^\s*\[[ xX]\]\s/gm, '')
      .replace(/^\s*\d+\.\s/gm, '')
      .replace(/>\s/g, '')
      .replace(/\|\|(.+?)\|\|/g, '$1')
      .replace(/\[\^[^\]]+\]/g, '')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }
}

export const markdownService = new MarkdownService();
