// @vitest-environment jsdom

import { describe, expect, it, beforeEach } from 'vitest';
import {
  markdownService,
  SHOW_MORE_CHAR_THRESHOLD,
  SHOW_MORE_PREVIEW_CHARS,
} from './MarkdownService.js';

describe('MarkdownService.render', () => {
  it('renders basic markdown', () => {
    const html = markdownService.render('Hello **world** and `code`');
    expect(html).toContain('<strong>world</strong>');
    expect(html).toContain('<code>code</code>');
    expect(html).not.toContain('<script');
  });

  it('renders spoilers', () => {
    const html = markdownService.render('The answer is ||42||.');
    expect(html).toContain('class="rich-spoiler"');
    expect(html).toContain('42');
    expect(html).not.toContain('||');
  });

  it('renders collapsible details blocks', () => {
    const markdown = '::: More info\nHidden **detail** here.\n:::';
    const html = markdownService.render(markdown);
    expect(html).toContain('<details class="rich-details">');
    expect(html).toContain('<summary>More info</summary>');
    expect(html).toContain('<strong>detail</strong>');
  });

  it('renders inline and display math', () => {
    const inline = markdownService.render('Energy: $E=mc^2$');
    expect(inline).toMatch(/katex|math/);

    const display = markdownService.render('$$\\frac{a}{b}$$');
    expect(display).toMatch(/katex-display|katex/);
  });

  it('renders task lists', () => {
    const html = markdownService.render('- [ ] Todo item\n- [x] Done item');
    expect(html).toContain('<input');
    expect(html).toContain('Todo item');
    expect(html).toContain('Done item');
    expect(html).toContain('checked=""');
    expect(html).toContain('disabled');
  });

  it('renders footnotes', () => {
    const html = markdownService.render('Claim[^1]\n\n[^1]: Source note.');
    expect(html).toMatch(/footnote|footnotes/i);
    expect(html).toContain('Source note');
  });

  it('wraps tables for horizontal scroll', () => {
    const html = markdownService.render('| A | B |\n| --- | --- |\n| 1 | 2 |');
    expect(html).toContain('rich-table-wrap');
    expect(html).toContain('<table');
  });

  it('blocks untrusted images', () => {
    const html = markdownService.render('![logo](https://evil.example.com/logo.png)');
    expect(html).toContain('rich-image-blocked');
    expect(html).not.toContain('evil.example.com');
  });

  it('allows trusted images', () => {
    const html = markdownService.render(
      '![profile](https://mangeshraut.pro/assets/images/profile.webp)'
    );
    expect(html).toContain('rich-inline-media');
    expect(html).toContain('mangeshraut.pro');
  });
});

describe('MarkdownService.renderForChat', () => {
  it('returns full render for short messages', () => {
    const result = markdownService.renderForChat('Short **reply**');
    expect(result.collapsed).toBe(false);
    expect(result.html).toContain('<strong>reply</strong>');
    expect(result.html).not.toContain('rich-show-more-btn');
  });

  it('truncates long messages with show-more wrapper', () => {
    const body = 'Word '.repeat(Math.ceil(SHOW_MORE_CHAR_THRESHOLD / 5) + 200);
    const result = markdownService.renderForChat(body);

    expect(result.collapsed).toBe(true);
    expect(result.charCount).toBeGreaterThan(SHOW_MORE_CHAR_THRESHOLD);
    expect(result.html).toContain('rich-message--collapsed');
    expect(result.html).toContain('rich-show-more-btn');
    expect(result.html).toContain('rich-message-preview');
    expect(result.html).toContain('rich-message-full');
    expect(body.slice(0, SHOW_MORE_PREVIEW_CHARS).trim()).toBeTruthy();
  });
});

describe('MarkdownService.bindRichInteractions', () => {
  let root;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  it('reveals spoilers on click', () => {
    root.innerHTML = '<span class="rich-spoiler" tabindex="0">secret</span>';
    markdownService.bindRichInteractions(root);

    const spoiler = root.querySelector('.rich-spoiler');
    spoiler.click();
    expect(spoiler.classList.contains('revealed')).toBe(true);
  });

  it('toggles show-more content', () => {
    root.innerHTML = `<div class="rich-message rich-message--collapsed" data-rich-collapsed="true">
      <div class="rich-message-preview"><p>Preview</p></div>
      <div class="rich-message-full" hidden><p>Full content</p></div>
      <button type="button" class="rich-show-more-btn" aria-expanded="false">Show more</button>
    </div>`;

    markdownService.bindRichInteractions(root);

    const button = root.querySelector('.rich-show-more-btn');
    const host = root.querySelector('.rich-message');
    const preview = root.querySelector('.rich-message-preview');
    const full = root.querySelector('.rich-message-full');

    button.click();
    expect(host.classList.contains('rich-message--expanded')).toBe(true);
    expect(preview.hidden).toBe(true);
    expect(full.hidden).toBe(false);
    expect(button.textContent).toBe('Show less');
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('MarkdownService.containsMarkdown', () => {
  it('detects common markdown patterns', () => {
    expect(markdownService.containsMarkdown('**bold**')).toBe(true);
    expect(markdownService.containsMarkdown('$x^2$')).toBe(true);
    expect(markdownService.containsMarkdown('- [ ] task')).toBe(true);
    expect(markdownService.containsMarkdown('||spoiler||')).toBe(true);
    expect(markdownService.containsMarkdown('plain text only')).toBe(false);
  });
});
