import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getOrCreateSessionId, SESSION_ID_KEY } from '../../src/js/chatbot/session-memory.js';

describe('AssistMe session memory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses cryptographic randomness for a new session identifier', () => {
    const randomUUID = vi.spyOn(crypto, 'randomUUID').mockReturnValue('secure-random-id');
    const id = getOrCreateSessionId();
    expect(randomUUID).toHaveBeenCalledOnce();
    expect(id).toContain('secure-random-id');
    expect(localStorage.getItem(SESSION_ID_KEY)).toBe(id);
  });

  it('keeps cryptographic entropy when browser storage is unavailable', () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('secure-one')
      .mockReturnValueOnce('secure-two');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(getOrCreateSessionId()).toContain('secure-one');
    expect(getOrCreateSessionId()).toContain('secure-two');
  });
});
