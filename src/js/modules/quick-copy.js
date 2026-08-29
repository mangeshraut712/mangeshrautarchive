/**
 * Quick Copy Component (shadcn UI/UX style)
 * Provides seamless copy-to-clipboard functionality with SVG morphing checkmark
 * and an Apple glass floating toast notification.
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
 * Initialize universal copy-to-clipboard listeners across the page.
 */
export function initQuickCopy() {
  document.addEventListener('click', e => {
    const copyBtn = e.target.closest('[data-copy-text], .shadcn-copy-btn, .quick-copy-trigger');
    if (!copyBtn) {
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
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuickCopy);
  } else {
    initQuickCopy();
  }
}
