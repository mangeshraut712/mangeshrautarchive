/**
 * Shared blog markdown parser — used by blog-loader (browser) and build (Node).
 */

export function escapeHTML(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
        `<li class="article-toc-item article-toc-level-${h.level}"><a href="#${escapeHTML(h.id)}" class="article-toc-link">${escapeHTML(h.text)}</a></li>`
    )
    .join('');

  return `<nav class="article-toc" aria-label="Table of contents"><h2 class="article-toc-title">On this page</h2><ol class="article-toc-list">${items}</ol></nav>`;
}

export function getAllTags(posts = []) {
  const tags = new Set();
  for (const post of posts) {
    for (const tag of post.tags || []) {
      tags.add(tag);
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function getRelatedPosts(post, posts = [], limit = 3) {
  const scored = posts
    .filter(p => p.id !== post.id)
    .map(p => {
      const sharedTags = (p.tags || []).filter(tag => (post.tags || []).includes(tag)).length;
      const dateDiff = Math.abs(new Date(p.date) - new Date(post.date));
      return { post: p, score: sharedTags * 10 - dateDiff / 86400000 };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(entry => entry.post);
}

export function formatBlogDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}
