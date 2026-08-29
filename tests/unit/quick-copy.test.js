// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attachCodeBlockCopyButtons,
  copyToClipboard,
  handleCopyAction,
  initQuickCopy,
  showCopyToast,
} from '../../src/js/modules/quick-copy.js';

describe('quick-copy module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <button id="test-copy-btn" class="shadcn-copy-btn" data-copy-text="test@example.com" data-copy-label="Copied test email!">
          <span class="copy-icon">Copy</span>
          <span class="check-icon">✓</span>
          <span>Copy</span>
        </button>
        <pre><code id="code-sample">git clone https://github.com/mangeshraut712/mangeshrautarchive.git</code></pre>
      </div>
    `;

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    window.isSecureContext = true;
  });

  it('copies text using navigator.clipboard when available', async () => {
    const success = await copyToClipboard('mangesh@drexel.edu');
    expect(success).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('mangesh@drexel.edu');
  });

  it('renders and shows floating shadcn toast on copy', () => {
    vi.useFakeTimers();

    showCopyToast('Custom copy message!');
    const toast = document.getElementById('shadcn-copy-toast');

    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain('Custom copy message!');
    expect(toast.classList.contains('is-visible')).toBe(true);

    vi.advanceTimersByTime(2300);
    expect(toast.classList.contains('is-visible')).toBe(false);

    vi.useRealTimers();
  });

  it('toggles is-copied class and triggers toast on copy button action', async () => {
    vi.useFakeTimers();

    const btn = document.getElementById('test-copy-btn');
    await handleCopyAction(btn, 'test@example.com', 'Copied test email!');

    expect(btn.classList.contains('is-copied')).toBe(true);
    const toast = document.getElementById('shadcn-copy-toast');
    expect(toast.textContent).toContain('Copied test email!');

    vi.advanceTimersByTime(2100);
    expect(btn.classList.contains('is-copied')).toBe(false);

    vi.useRealTimers();
  });

  it('automatically triggers copy on click via initQuickCopy event delegation', async () => {
    initQuickCopy();
    const btn = document.getElementById('test-copy-btn');

    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Wait microtask tick for async copyToClipboard
    await Promise.resolve();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test@example.com');
  });

  it('automatically attaches copy buttons to code blocks and handles clicking', async () => {
    attachCodeBlockCopyButtons();
    const pre = document.querySelector('pre');
    const copyBtn = pre.querySelector('.code-block-copy-btn');

    expect(copyBtn).toBeTruthy();

    copyBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'git clone https://github.com/mangeshraut712/mangeshrautarchive.git'
    );
  });
});
