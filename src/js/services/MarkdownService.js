/**
 * MarkdownService — Isolated Markdown → HTML rendering with XSS sanitisation
 *
 * Extracted from ChatUI (script.js) to separate concerns.
 * Wraps marked.js + DOMPurify so no other module needs to know about them.
 *
 * Usage:
 *   import { markdownService } from './MarkdownService.js';
 *   const html = markdownService.render(rawMarkdown);
 *   element.innerHTML = html; // safe — DOMPurify sanitised
 */

// Lazy-grab the libs from the global scope (loaded via CDN in index.html)
function getMarked() {
  return window.marked ?? (typeof marked !== 'undefined' ? marked : null);
}

function getDOMPurify() {
  return window.DOMPurify ?? (typeof DOMPurify !== 'undefined' ? DOMPurify : null);
}

function getPrism() {
  return window.Prism ?? (typeof Prism !== 'undefined' ? Prism : null);
}

function getHljs() {
  return window.hljs ?? null;
}

class MarkdownService {
  constructor() {
    this._configured = false;
  }

  _ensureConfigured() {
    if (this._configured) return;

    const marked = getMarked();
    if (!marked) return;

    const renderer = new marked.Renderer();

    // Code blocks with Prism syntax highlighting
    renderer.code = token => {
      const code = token.text ?? token;
      const lang = token.lang ?? '';
      const Prism = getPrism();
      const hljs = getHljs();

      if (Prism && lang && Prism.languages[lang]) {
        try {
          const highlighted = Prism.highlight(code, Prism.languages[lang], lang);
          return `<pre><code class="language-${lang}">${highlighted}</code></pre>`;
        } catch {
          /* fall through */
        }
      }

      if (hljs) {
        try {
          if (lang && hljs.getLanguage?.(lang)) {
            const highlighted = hljs.highlight(code, {
              language: lang,
              ignoreIllegals: true,
            }).value;
            return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
          }

          const autoHighlighted = hljs.highlightAuto(code).value;
          return `<pre><code class="hljs">${autoHighlighted}</code></pre>`;
        } catch {
          // fall through to escaped output
        }
      }

      return `<pre><code>${this._escapeHtml(code)}</code></pre>`;
    };

    marked.use({
      renderer,
      pedantic: false,
      gfm: true,
      breaks: true,
      smartypants: false,
    });

    this._configured = true;
  }

  _escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Render Markdown to a sanitised HTML string.
   * Falls back to escaped plain text if marked.js is unavailable.
   *
   * @param {string} markdown  Raw markdown string
   * @returns {string}         Sanitised HTML
   */
  render(markdown) {
    if (!markdown || typeof markdown !== 'string') return '';

    this._ensureConfigured();

    const marked = getMarked();
    const DOMPurify = getDOMPurify();

    if (!marked) {
      // Graceful fallback: escape HTML and preserve line breaks
      return `<p>${this._escapeHtml(markdown).replace(/\n/g, '<br>')}</p>`;
    }

    let html;
    try {
      html = marked.parse(markdown);
    } catch (err) {
      console.warn('Markdown parse error:', err);
      return `<p>${this._escapeHtml(markdown)}</p>`;
    }

    if (DOMPurify) {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p',
          'br',
          'strong',
          'em',
          'u',
          's',
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
          'img',
          'hr',
          'table',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
          'span',
          'div',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'title', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
        FORCE_BODY: false,
      });
    }

    // No DOMPurify — strip dangerous tags manually (best-effort)
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');
  }

  /**
   * Check whether a string contains markdown syntax.
   * Useful for avoiding unnecessary renders on plain-text responses.
   * @param {string} text
   * @returns {boolean}
   */
  containsMarkdown(text) {
    if (!text) return false;
    return /(\*\*|__|`|#{1,6} |\*|-\s|\[.*\]\(|>)/.test(text);
  }

  /**
   * Strip markdown syntax and return plain text.
   * Used for TTS so it doesn't read markdown characters aloud.
   * @param {string} text
   * @returns {string}
   */
  toPlainText(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1') // bold
      .replace(/\*(.+?)\*/g, '$1') // italic
      .replace(/`(.+?)`/g, '$1') // inline code
      .replace(/#{1,6}\s/g, '') // headings
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
      .replace(/!\[.*?\]\(.+?\)/g, '') // images
      .replace(/^\s*[-*+]\s/gm, '') // list bullets
      .replace(/^\s*\d+\.\s/gm, '') // numbered lists
      .replace(/>\s/g, '') // blockquotes
      .replace(/\n{2,}/g, '\n') // multiple blank lines
      .trim();
  }
}

// Singleton export
export const markdownService = new MarkdownService();
