// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  handleSelectionChange,
  hideSelectionToolbar,
  initTextSelectionToolbar,
} from '../../src/js/modules/text-selection-toolbar.js';

describe('text-selection-toolbar module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="content">
        <p id="target-para">Building autonomous AI agents and scalable cloud microservices.</p>
      </div>
    `;

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    window.isSecureContext = true;
  });

  it('initializes text selection listeners without error', () => {
    expect(() => initTextSelectionToolbar()).not.toThrow();
  });

  it('hides toolbar when selection is empty or collapsed', () => {
    hideSelectionToolbar();
    const toolbar = document.getElementById('selection-floating-toolbar');
    if (toolbar) {
      expect(toolbar.hidden).toBe(true);
    }
  });

  it('creates and positions toolbar on valid text selection', () => {
    const para = document.getElementById('target-para');
    const range = document.createRange();
    range.selectNodeContents(para);

    // Mock getBoundingClientRect
    range.getBoundingClientRect = () => ({
      left: 100,
      top: 200,
      right: 300,
      bottom: 220,
      width: 200,
      height: 20,
    });

    const selection = {
      isCollapsed: false,
      rangeCount: 1,
      toString: () => 'autonomous AI agents',
      getRangeAt: () => range,
    };

    vi.spyOn(window, 'getSelection').mockReturnValue(selection);

    handleSelectionChange();

    const toolbar = document.getElementById('selection-floating-toolbar');
    expect(toolbar).toBeTruthy();
    expect(toolbar.hidden).toBe(false);
  });
});
