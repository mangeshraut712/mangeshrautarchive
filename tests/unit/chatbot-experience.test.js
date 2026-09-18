import { describe, expect, it } from 'vitest';
import {
  shouldStreamOpenRouter,
  thinkingStageLabel,
  timeOfDayGreeting,
  usableTranscriptTurns,
  welcomeCopy,
  WELCOME_ACTION_CHIPS,
} from '../../src/js/chatbot/experience.js';

describe('timeOfDayGreeting', () => {
  it('returns morning / afternoon / evening buckets', () => {
    expect(timeOfDayGreeting(new Date(2026, 8, 18, 8))).toBe('Good morning');
    expect(timeOfDayGreeting(new Date(2026, 8, 18, 14))).toBe('Good afternoon');
    expect(timeOfDayGreeting(new Date(2026, 8, 18, 20))).toBe('Good evening');
  });
});

describe('shouldStreamOpenRouter', () => {
  it('streams whenever the client requested a stream, including free models', () => {
    expect(shouldStreamOpenRouter(true)).toBe(true);
    expect(shouldStreamOpenRouter(false)).toBe(false);
    expect(shouldStreamOpenRouter(undefined)).toBe(false);
  });
});

describe('thinkingStageLabel', () => {
  it('hides the timer for the first second, then appends elapsed seconds', () => {
    expect(thinkingStageLabel('generating', 0)).toBe('Generating');
    expect(thinkingStageLabel('generating', 1)).toBe('Generating');
    expect(thinkingStageLabel('generating', 3)).toBe('Generating · 3s');
    expect(thinkingStageLabel('thinking', 12)).toBe('Thinking · 12s');
  });
});

describe('welcomeCopy', () => {
  it('uses a Siri-style greeting and four starter chips', () => {
    const copy = welcomeCopy({ now: new Date(2026, 8, 18, 14), returning: false });
    expect(copy.title).toContain('Good afternoon');
    expect(copy.title).toContain('AssistMe');
    expect(WELCOME_ACTION_CHIPS).toHaveLength(4);
  });

  it('warms the title for returning visitors', () => {
    const copy = welcomeCopy({ now: new Date(2026, 8, 18, 9), returning: true });
    expect(copy.title).toContain('welcome back');
  });
});

describe('usableTranscriptTurns', () => {
  it('drops empty and unknown roles', () => {
    expect(
      usableTranscriptTurns([
        { role: 'user', content: 'Hello' },
        { role: 'system', content: 'nope' },
        { role: 'assistant', content: '  ' },
        { role: 'assistant', content: 'Hi there' },
      ])
    ).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]);
  });
});
