import { beforeEach, describe, expect, it } from 'vitest';
import { mountArticleReactions } from '../../src/js/modules/blog-reactions.js';

describe('blog-reactions', () => {
  let container;

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('mounts the reaction toolbar with default zero counts', () => {
    mountArticleReactions(container, 'post-1');

    const aside = container.querySelector('[data-blog-reactions="post-1"]');
    expect(aside).not.toBeNull();
    expect(aside.getAttribute('aria-label')).toBe('Article reactions');

    const buttons = container.querySelectorAll('.article-reaction');
    expect(buttons.length).toBe(3);

    const clapBtn = container.querySelector('[data-reaction="clap"]');
    const clapCount = clapBtn.querySelector('[data-count-for="clap"]');
    expect(clapCount.textContent).toBe('0');
    expect(clapBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('increments reaction count and updates active state on click', () => {
    mountArticleReactions(container, 'post-1');

    const clapBtn = container.querySelector('[data-reaction="clap"]');
    clapBtn.click();

    const updatedClapBtn = container.querySelector('[data-reaction="clap"]');
    expect(updatedClapBtn.classList.contains('is-active')).toBe(true);
    expect(updatedClapBtn.getAttribute('aria-pressed')).toBe('true');
    const clapCount = updatedClapBtn.querySelector('[data-count-for="clap"]');
    expect(clapCount.textContent).toBe('1');

    const stored = JSON.parse(localStorage.getItem('mangesh-blog-reactions-v1') || '{}');
    expect(stored['post-1'].counts.clap).toBe(1);
    expect(stored['post-1'].mine.clap).toBe(true);
  });

  it('toggles reaction off when clicked again', () => {
    mountArticleReactions(container, 'post-1');

    container.querySelector('[data-reaction="clap"]').click(); // toggle on
    container.querySelector('[data-reaction="clap"]').click(); // toggle off

    const updatedClapBtn = container.querySelector('[data-reaction="clap"]');
    expect(updatedClapBtn.classList.contains('is-active')).toBe(false);
    expect(updatedClapBtn.getAttribute('aria-pressed')).toBe('false');
    const clapCount = updatedClapBtn.querySelector('[data-count-for="clap"]');
    expect(clapCount.textContent).toBe('0');

    const stored = JSON.parse(localStorage.getItem('mangesh-blog-reactions-v1') || '{}');
    expect(stored['post-1'].counts.clap).toBe(0);
    expect(stored['post-1'].mine.clap).toBeUndefined();
  });

  it('restores persisted reactions upon re-mounting', () => {
    const initialState = {
      'post-42': {
        counts: { clap: 5, insight: 2 },
        mine: { clap: true },
      },
    };
    localStorage.setItem('mangesh-blog-reactions-v1', JSON.stringify(initialState));

    mountArticleReactions(container, 'post-42');

    const clapBtn = container.querySelector('[data-reaction="clap"]');
    expect(clapBtn.classList.contains('is-active')).toBe(true);
    expect(clapBtn.querySelector('[data-count-for="clap"]').textContent).toBe('5');

    const insightBtn = container.querySelector('[data-reaction="insight"]');
    expect(insightBtn.classList.contains('is-active')).toBe(false);
    expect(insightBtn.querySelector('[data-count-for="insight"]').textContent).toBe('2');
  });
});
