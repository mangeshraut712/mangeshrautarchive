// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('bootstrap lazy interaction guard', () => {
  let openChatbotAssistant;
  let openSearchOverlay;

  beforeAll(async () => {
    ({ openChatbotAssistant, openSearchOverlay } = await import('../../src/js/core/bootstrap.js'));
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="chatbot-toggle"></button>
      <button id="search-toggle"></button>
    `;
  });

  it('dedupes concurrent openChatbotAssistant calls', async () => {
    const loadStyles = vi.fn(async () => true);
    const chatbotModuleLoader = {
      load: vi.fn(() => new Promise(resolve => setTimeout(() => resolve(true), 30))),
    };

    await Promise.all([
      openChatbotAssistant({ loadStyles, chatbotModuleLoader }),
      openChatbotAssistant({ loadStyles, chatbotModuleLoader }),
    ]);

    expect(chatbotModuleLoader.load).toHaveBeenCalledTimes(1);
    expect(loadStyles).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent openSearchOverlay calls', async () => {
    const loadStyles = vi.fn(async () => true);
    const moduleLoader = {
      load: vi.fn(() => new Promise(resolve => setTimeout(() => resolve(true), 30))),
    };

    await Promise.all([
      openSearchOverlay({ loadStyles, moduleLoader }),
      openSearchOverlay({ loadStyles, moduleLoader }),
    ]);

    expect(moduleLoader.load).toHaveBeenCalledTimes(1);
    expect(loadStyles).toHaveBeenCalledTimes(1);
  });
});
