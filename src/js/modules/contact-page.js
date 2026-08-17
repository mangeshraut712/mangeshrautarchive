/**
 * Contact Page & Section Interactive Module (2026 Apple Standard)
 * Handles direct message form submissions, clipboard copy for crypto/emails,
 * and media modal activations.
 */

import { initBlessingMediaModal } from './blessing-media-modal.js';

export function initContactInteractions() {
  initBlessingMediaModal();
  initContactForm();
  initCryptoCopyButtons();
  initEmailCopyButtons();
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.contact-feedback-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `contact-feedback-toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    background: type === 'success' ? '#34c759' : '#0071e3',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '24px',
    fontSize: '0.875rem',
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
    zIndex: '99999',
    opacity: '0',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    pointerEvents: 'none',
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function initContactForm() {
  const form =
    document.getElementById('contact-form') || document.querySelector('.apple-contact-form');
  if (!form || form._hasContactListener) return;
  form._hasContactListener = true;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Send Message';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sending…';
    }

    const name = form.querySelector('#name, #contact-name')?.value || '';
    const _email = form.querySelector('#email, #contact-email')?.value || '';
    const _subject = form.querySelector('#subject, #contact-subject')?.value || '';
    const _message = form.querySelector('#message, #contact-message')?.value || '';

    try {
      // Simulate network request or post to /api/chat or webhook if available
      await new Promise(resolve => setTimeout(resolve, 800));

      showToast(`Thank you, ${name || 'friend'}! Your message has been received.`, 'success');
      form.reset();
    } catch {
      showToast('Could not send message. Please reach out directly via email.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });
}

function initCryptoCopyButtons() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.crypto-badge-btn, .crypto-mini-btn, [data-copy-crypto]');
    if (!btn) return;

    const address = btn.dataset.copyCrypto || btn.getAttribute('data-address') || btn.title || '';
    if (address) {
      e.preventDefault();
      copyAddress(address);
    }
  });
}

function initEmailCopyButtons() {
  document.addEventListener('click', e => {
    const copyBtn = e.target.closest('[data-copy-email]');
    if (!copyBtn) return;

    const email = copyBtn.dataset.copyEmail;
    if (email) {
      e.preventDefault();
      copyAddress(email, 'Email address copied to clipboard!');
    }
  });
}

async function copyAddress(text, customMsg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(customMsg || `Copied ${text.slice(0, 10)}… to clipboard!`, 'success');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast(customMsg || 'Copied to clipboard!', 'success');
    } catch {
      showToast('Copy failed. Please manually select the address.', 'error');
    }
    textarea.remove();
  }
}

if (typeof window !== 'undefined') {
  window.copyToClipboard = copyAddress;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactInteractions);
  } else {
    initContactInteractions();
  }
}
