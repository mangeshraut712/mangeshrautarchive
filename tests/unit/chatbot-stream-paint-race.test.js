// @vitest-environment node

/**
 * Streaming paint must not overwrite a finalized AssistMe bubble.
 * Mirrors fixed chatbot.js generation guard.
 */
import { describe, expect, it } from 'vitest';

async function reproduceStreamingPaintRaceFixed() {
  const contentDiv = { innerHTML: '', classList: { add() {} } };
  let streamPaintGeneration = 0;

  async function paintStreamingContent(text, delayMs) {
    const paintGeneration = streamPaintGeneration;
    await new Promise(r => setTimeout(r, delayMs));
    if (paintGeneration !== streamPaintGeneration) return;
    contentDiv.innerHTML = `stream:${text}`;
  }

  async function finalizeStreamingContent(text) {
    streamPaintGeneration += 1;
    contentDiv.innerHTML = `final:${text}`;
  }

  void paintStreamingContent('hello **world**', 40);
  await new Promise(r => setTimeout(r, 5));
  await finalizeStreamingContent('hello **world**');
  await new Promise(r => setTimeout(r, 50));

  return contentDiv.innerHTML;
}

describe('AssistMe streaming paint race (fixed algorithm)', () => {
  it('finalized HTML must win over late streaming paint', async () => {
    const html = await reproduceStreamingPaintRaceFixed();
    expect(html).toBe('final:hello **world**');
  });
});
