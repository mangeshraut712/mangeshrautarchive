import { describe, expect, it } from 'vitest';
import {
  extractTrustedMediaUrl,
  preprocessRichMediaMarkdown,
  renderMermaidDiagram,
} from '../../src/js/chatbot/rich-media.js';

describe('extractTrustedMediaUrl', () => {
  it('accepts Pollinations image URLs', () => {
    const url =
      'https://image.pollinations.ai/prompt/glassmorphic%20chatbot?width=768&height=768&nologo=true';
    expect(extractTrustedMediaUrl(url)).toContain('image.pollinations.ai');
  });

  it('rejects other hosts', () => {
    expect(extractTrustedMediaUrl('https://evil.example.com/x.png')).toBe('');
  });
});

describe('renderMermaidDiagram', () => {
  it('turns a LR flowchart into labeled HTML pills', () => {
    const html = renderMermaidDiagram(`flowchart LR
A[Java / Spring] --> D[AssistMe AI]
B[Python / FastAPI] --> D
C[AWS] --> D`);
    expect(html).toContain('class="rich-mermaid"');
    expect(html).toContain('rich-mermaid-node');
    expect(html).toContain('AssistMe AI');
    expect(html).toContain('Java / Spring');
    expect(html).not.toContain('<svg');
  });
});

describe('preprocessRichMediaMarkdown', () => {
  it('rewrites mermaid fences before marked', () => {
    const slots = [];
    const out = preprocessRichMediaMarkdown('```mermaid\nflowchart TD\nA[Start] --> B[End]\n```', {
      slots,
    });
    expect(out).toContain('§RICHSLOT0§');
    expect(out).not.toContain('```mermaid');
    expect(slots[0]).toContain('rich-mermaid');
  });

  it('injects a Pollinations image for generate-image prompts', () => {
    const out = preprocessRichMediaMarkdown('Sure.', {
      userPrompt: 'Generate a markdown image of a glassmorphic chatbot panel',
    });
    expect(out).toContain('image.pollinations.ai');
    expect(out).toContain('![Generated image]');
  });
});
