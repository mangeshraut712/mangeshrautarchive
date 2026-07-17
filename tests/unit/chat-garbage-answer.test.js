import { describe, expect, it, beforeEach } from 'vitest';
import { IntelligentAssistant } from '../../src/js/core/chat.js';

describe('isGarbageModelAnswer', () => {
  let api;

  beforeEach(() => {
    api = new IntelligentAssistant();
  });

  it('rejects empty and whitespace-only answers', () => {
    expect(api.isGarbageModelAnswer('')).toBe(true);
    expect(api.isGarbageModelAnswer('   ')).toBe(true);
    expect(api.isGarbageModelAnswer(null)).toBe(true);
  });

  it('keeps short legitimate answers', () => {
    expect(api.isGarbageModelAnswer('Yes.')).toBe(false);
    expect(api.isGarbageModelAnswer('Philly.')).toBe(false);
    expect(api.isGarbageModelAnswer('In 2024.')).toBe(false);
    expect(api.isGarbageModelAnswer('Java/Spring.')).toBe(false);
  });

  it('rejects free-router safety classifier junk', () => {
    expect(api.isGarbageModelAnswer('safe')).toBe(true);
    expect(api.isGarbageModelAnswer('User Safety: Safe')).toBe(true);
    expect(api.isGarbageModelAnswer('blocked')).toBe(true);
  });

  it('rejects moderation model payloads', () => {
    expect(api.isGarbageModelAnswer('anything', { model: 'openai/content-safety' })).toBe(true);
  });
});
