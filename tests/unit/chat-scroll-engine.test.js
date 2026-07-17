import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { ChatScrollEngine } from '../../src/js/utils/chat-scroll-engine.js';

function makeMessages({ scrollHeight = 1000, clientHeight = 400, scrollTop = 0 } = {}) {
  const el = document.createElement('div');
  el.id = 'chatbot-messages';
  Object.defineProperty(el, 'scrollHeight', {
    get: () => scrollHeight,
    configurable: true,
  });
  Object.defineProperty(el, 'clientHeight', {
    get: () => clientHeight,
    configurable: true,
  });
  let top = scrollTop;
  Object.defineProperty(el, 'scrollTop', {
    get: () => top,
    set: v => {
      top = v;
    },
    configurable: true,
  });
  document.body.appendChild(el);
  return el;
}

describe('ChatScrollEngine', () => {
  let messages;
  let engine;

  beforeEach(() => {
    document.body.innerHTML = '';
    messages = makeMessages({ scrollHeight: 1000, clientHeight: 400, scrollTop: 900 });
    engine = new ChatScrollEngine(messages);
  });

  afterEach(() => {
    engine?.dispose();
    document.body.innerHTML = '';
  });

  it('detects near-bottom when within threshold', () => {
    // distance from bottom = 1000 - 900 - 400 = -300? wait 1000-900-400 = -300
    // actually 1000 - 900 - 400 = -300 means overscrolled; set properly
    Object.defineProperty(messages, 'scrollTop', {
      get: () => 528, // 1000 - 400 - 72 = 528 → distance 72
      set: () => {},
      configurable: true,
    });
    expect(engine.isNearBottom(72)).toBe(true);
    Object.defineProperty(messages, 'scrollTop', {
      get: () => 0,
      set: () => {},
      configurable: true,
    });
    expect(engine.isNearBottom(72)).toBe(false);
  });

  it('pauseFollowing and resumeFollowing toggle following flag', () => {
    expect(engine.isFollowing()).toBe(true);
    engine.pauseFollowing('test');
    expect(engine.isFollowing()).toBe(false);
    engine.resumeFollowing('test');
    expect(engine.isFollowing()).toBe(true);
  });

  it('ensureScrollAnchor inserts and reuses anchor', () => {
    const a1 = engine.ensureScrollAnchor();
    const a2 = engine.ensureScrollAnchor();
    expect(a1).toBeTruthy();
    expect(a1.id).toBe('chatbot-scroll-anchor');
    expect(a2).toBe(a1);
  });

  it('dispose clears bound handlers without throw', () => {
    engine.bind();
    expect(() => engine.dispose()).not.toThrow();
  });

  it('ensureUserPinPad is a no-op (no spacer thrash)', () => {
    engine.bind();
    expect(engine.ensureUserPinPad()).toBeNull();
    expect(messages.querySelector('#chatbot-user-pin-pad')).toBeNull();
  });

  it('restoreSession forces following and clears sticky session', () => {
    sessionStorage.setItem(
      'assistme-chat-scroll-v1',
      JSON.stringify({ scrollTop: 12, following: false, messageId: 'x' })
    );
    engine.pauseFollowing('test');
    expect(engine.restoreSession()).toBe(true);
    expect(engine.isFollowing()).toBe(true);
    expect(sessionStorage.getItem('assistme-chat-scroll-v1')).toBeNull();
  });

  it('jump button stays hidden until activity below while not following', () => {
    const widget = document.createElement('div');
    document.body.appendChild(widget);
    engine.dispose();
    engine = new ChatScrollEngine(messages, { widgetEl: widget });
    engine.bind();
    expect(engine.jumpBtn.hidden).toBe(true);
    engine.pauseFollowing('test');
    engine.markActivityBelow();
    expect(engine.jumpBtn.hidden).toBe(false);
    expect(engine.jumpBtn.classList.contains('is-visible')).toBe(true);
  });
});
