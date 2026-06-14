// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { markdownService } from '../services/MarkdownService.js';

describe('chatbot markdown integration patterns', () => {
  it('uses containsMarkdown for streaming detection heuristics', () => {
    const plain = 'Hello there';
    const rich = 'Here is **bold** and a list:\n- item';

    expect(markdownService.containsMarkdown(plain)).toBe(false);
    expect(
      markdownService.containsMarkdown(plain) || plain.length >= 48
    ).toBe(false);

    expect(markdownService.containsMarkdown(rich)).toBe(true);
    expect(
      markdownService.containsMarkdown(rich) || rich.length >= 48
    ).toBe(true);
  });

  it('finalizes assistant output with renderForChat and interaction hooks', () => {
    const markdown = 'Answer with ||spoiler|| and [link](https://mangeshraut.pro)';
    const rendered = markdownService.renderForChat(markdown);

    expect(rendered.collapsed).toBe(false);
    expect(rendered.html).toContain('rich-spoiler');

    const root = document.createElement('div');
    root.innerHTML = rendered.html;
    document.body.appendChild(root);

    markdownService.bindRichInteractions(root);
    root.querySelector('.rich-spoiler')?.click();
    expect(root.querySelector('.rich-spoiler')?.classList.contains('revealed')).toBe(true);
  });
});
