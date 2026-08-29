/**
 * Quick Copy Component (shadcn UI/UX style)
 * Provides seamless copy-to-clipboard functionality with SVG morphing checkmark,
 * Apple glass floating toast notification, and automated code block copy buttons.
 */

let toastTimer = null;

/**
 * Show a floating shadcn/Apple-style glass toast notification.
 * @param {string} message
 */
export function showCopyToast(message = 'Copied to clipboard!') {
  let toast = document.getElementById('shadcn-copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'shadcn-copy-toast';
    toast.className = 'shadcn-copy-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg class="toast-check-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
    <span>${message}</span>
  `;

  toast.classList.remove('is-hidden');
  toast.classList.add('is-visible');

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.classList.add('is-hidden');
  }, 2200);
}

/**
 * Copy text to clipboard with modern Clipboard API and legacy fallback.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  if (!text) {
    return false;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback if clipboard API throws
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Handle copy button click, trigger icon morph, and show toast.
 * @param {HTMLElement} button
 * @param {string} text
 * @param {string} label
 */
export async function handleCopyAction(button, text, label = 'Copied to clipboard!') {
  const success = await copyToClipboard(text);
  if (!success) {
    return;
  }

  button.classList.add('is-copied');
  showCopyToast(label);

  setTimeout(() => {
    button.classList.remove('is-copied');
  }, 2000);
}

/**
 * Auto-attach sleek Apple-glass copy buttons to all code blocks and terminal snippets.
 */
export function attachCodeBlockCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre, .code-snippet-box, .terminal-box');
  codeBlocks.forEach(block => {
    if (block.dataset.copyAttached === 'true') return;
    block.dataset.copyAttached = 'true';

    // Ensure relative positioning
    const style = window.getComputedStyle(block);
    if (style.position === 'static') {
      block.style.position = 'relative';
    }

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'code-block-copy-btn shadcn-copy-btn';
    copyBtn.setAttribute('aria-label', 'Copy code snippet');
    copyBtn.title = 'Copy code';
    copyBtn.innerHTML = `
      <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
      </svg>
      <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
      <span class="code-copy-text">Copy</span>
    `;

    copyBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const codeEl = block.querySelector('code') || block;
      const text = (codeEl.textContent || '').trim();
      if (text) {
        handleCopyAction(copyBtn, text, 'Code copied to clipboard!');
      }
    });

    block.appendChild(copyBtn);
  });
}

/**
 * Initialize universal copy-to-clipboard listeners across the page.
 */
export function initQuickCopy() {
  document.addEventListener('click', e => {
    const copyBtn = e.target.closest('[data-copy-text], .shadcn-copy-btn, .quick-copy-trigger');
    if (!copyBtn || copyBtn.classList.contains('code-block-copy-btn')) {
      return;
    }

    const textToCopy = copyBtn.getAttribute('data-copy-text') || copyBtn.dataset.copyText;
    if (!textToCopy) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const label = copyBtn.getAttribute('data-copy-label') || 'Copied to clipboard!';
    handleCopyAction(copyBtn, textToCopy, label);
  });

  // Attach to code blocks
  attachCodeBlockCopyButtons();
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuickCopy);
  } else {
    initQuickCopy();
  }
}
