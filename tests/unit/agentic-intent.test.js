import { describe, expect, it } from 'vitest';
import {
  isAllowedAgenticMatch,
  isOpenContactFormIntent,
  isResumeDownloadIntent,
  isSiteSearchIntent,
} from '../../src/js/chatbot/agentic-intent.js';

describe('isSiteSearchIntent', () => {
  it('matches explicit on-site search', () => {
    expect(isSiteSearchIntent('search this site for Java')).toBe(true);
    expect(isSiteSearchIntent('find AWS on this portfolio')).toBe(true);
  });

  it('does not steal data-structure or search-engine questions', () => {
    expect(
      isSiteSearchIntent(
        'Explain B plus trees like I am a junior engineer who already knows binary search trees.'
      )
    ).toBe(false);
    expect(
      isSiteSearchIntent(
        'Act as a site search engine for this portfolio. Give a concise map of what I can ask about.'
      )
    ).toBe(false);
    expect(isSiteSearchIntent('Do not search the site.')).toBe(false);
  });
});

describe('isResumeDownloadIntent', () => {
  it('matches resume/CV asks', () => {
    expect(isResumeDownloadIntent('download your resume')).toBe(true);
    expect(isResumeDownloadIntent("send me Mangesh's CV")).toBe(true);
  });

  it('ignores generic file downloads', () => {
    expect(
      isResumeDownloadIntent(
        'TCP vs UDP: when would a game, a file download, and a video call pick each one?'
      )
    ).toBe(false);
  });
});

describe('isOpenContactFormIntent', () => {
  it('opens the form only for send/open-form phrasing', () => {
    expect(isOpenContactFormIntent('open the contact form')).toBe(true);
    expect(isOpenContactFormIntent('send a message to Mangesh')).toBe(true);
  });

  it('leaves contact-info questions for the LLM', () => {
    expect(
      isOpenContactFormIntent(
        'How can I contact Mangesh? Include email, LinkedIn, GitHub, and the best first step.'
      )
    ).toBe(false);
    expect(isOpenContactFormIntent("what's your email")).toBe(false);
  });
});

describe('isAllowedAgenticMatch', () => {
  it('gates the greedy actions and passes others through', () => {
    expect(isAllowedAgenticMatch('search', 'binary search trees')).toBe(false);
    expect(isAllowedAgenticMatch('toggle_theme', 'switch to dark mode')).toBe(true);
  });
});
