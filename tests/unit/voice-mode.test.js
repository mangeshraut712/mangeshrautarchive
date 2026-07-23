import { describe, expect, it } from 'vitest';
import { cleanVoiceResponseText } from '../../src/js/services/VoiceModeService.js';

describe('cleanVoiceResponseText', () => {
  it('strips markdown for speech', () => {
    expect(cleanVoiceResponseText('**Hello** there')).toBe('Hello there');
  });

  it('extracts quoted reply from thinking fluff', () => {
    expect(cleanVoiceResponseText('I\'ve crafted a reply: "I am doing great!"')).toBe(
      'I am doing great!'
    );
  });

  it('returns empty when thinking has no quote', () => {
    expect(cleanVoiceResponseText("I'm processing the request carefully")).toBe('');
  });
});
