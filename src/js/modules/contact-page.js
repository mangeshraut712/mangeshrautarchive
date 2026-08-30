/**
 * Contact Page & Section Interactive Module (2026 Apple Standard)
 * Handles direct message form submissions, clipboard copy for crypto/emails,
 * and media modal activations.
 */

import { initBlessingMediaModal } from './blessing-media-modal.js';
import { getSubmissionContext, submitStoredForm } from '../services/form-submission.js';
import { openCalendlyPopup } from '../utils/calendly.js';

export function initContactInteractions() {
  initBlessingMediaModal();
  initContactForm();
  initCryptoCopyButtons();
  initEmailCopyButtons();
  initCalendlyButton();
  initSupportDonationInteractions();
}

function initSupportDonationInteractions() {
  // 1. Support Mode Toggle (One-Time vs. Monthly Sponsorship)
  const modePills = document.querySelectorAll('.support-mode-pill');
  const onetimePanel = document.getElementById('support-panel-onetime');
  const monthlyPanel = document.getElementById('support-panel-monthly');

  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const mode = pill.getAttribute('data-support-mode');
      modePills.forEach(p => {
        const isActive = p === pill;
        p.classList.toggle('is-active', isActive);
        p.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      if (mode === 'monthly') {
        if (onetimePanel) onetimePanel.hidden = true;
        if (monthlyPanel) monthlyPanel.hidden = false;
      } else {
        if (onetimePanel) onetimePanel.hidden = false;
        if (monthlyPanel) monthlyPanel.hidden = true;
      }
    });
  });

  // 2. Donation Preset Chips
  const presetChips = document.querySelectorAll('.donation-chip');
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
      const amount = chip.getAttribute('data-amount');
      if (amount === 'custom') {
        showToast('You can enter any custom contribution amount on checkout! 🙏', 'info');
      } else {
        showToast(
          `Selected $${amount} contribution tier. Choose your payment method below!`,
          'success'
        );
      }
    });
  });

  // 3. Payment QR Code Modal
  const openQrBtn = document.getElementById('open-payment-qr-btn');
  const qrModal = document.getElementById('payment-qr-modal');
  const closeQrBtn = document.getElementById('close-payment-qr-btn');
  const qrImage = document.getElementById('payment-qr-image');
  const qrChannelLabel = document.getElementById('payment-qr-channel-label');
  const qrDirectLink = document.getElementById('payment-qr-direct-link');
  const qrTabs = document.querySelectorAll('.payment-qr-tab');

  const QR_TARGETS = {
    stripe: {
      url: 'https://buy.stripe.com/14A3cufGUgcV5ePfuA14401',
      label: 'Stripe Checkout (Apple Pay & Google Pay)',
    },
    paypal: {
      url: 'https://www.paypal.com/ncp/payment/LXNHJ5SUGNP82',
      label: 'PayPal & Venmo Checkout',
    },
    bmc: {
      url: 'https://buymeacoffee.com/xzvwsqf84xy',
      label: 'Buy Me a Coffee (Mangesh Bharat Raut)',
    },
    solana: {
      url: 'solana:3LaZpBbmJVnFtR8oNGSY1EmYBo3vevXDDvJJEfSFmkcc',
      label: 'Solana Wallet (3LaZpBbm...mkcc)',
    },
    bitcoin: {
      url: 'bitcoin:bc1qe55rgghcfgwhwdt0j33gjt4mnfvkgzpkn0j44j',
      label: 'Bitcoin Wallet (bc1qe55r...0j44j)',
    },
  };

  function updateQrDisplay(targetKey) {
    const config = QR_TARGETS[targetKey] || QR_TARGETS.stripe;
    const qrUrl = `https://quickchart.io/qr?size=280&dark=0071e3&light=ffffff&ecLevel=H&margin=1&text=${encodeURIComponent(config.url)}`;
    if (qrImage) {
      qrImage.src = qrUrl;
      qrImage.alt = `${config.label} QR Code`;
    }
    if (qrChannelLabel) qrChannelLabel.textContent = config.label;
    if (qrDirectLink) {
      qrDirectLink.href = config.url;
      qrDirectLink.style.display = config.url.startsWith('http') ? 'inline-flex' : 'none';
    }
  }

  function openModal() {
    if (!qrModal) return;
    qrModal.hidden = false;
    requestAnimationFrame(() => {
      qrModal.classList.add('is-open');
      if (closeQrBtn) closeQrBtn.focus();
    });
    if (openQrBtn) openQrBtn.setAttribute('aria-expanded', 'true');
  }

  function closeModal() {
    if (!qrModal) return;
    qrModal.classList.remove('is-open');
    setTimeout(() => {
      qrModal.hidden = true;
      if (openQrBtn) {
        openQrBtn.setAttribute('aria-expanded', 'false');
        openQrBtn.focus();
      }
    }, 250);
  }

  if (openQrBtn) {
    openQrBtn.addEventListener('click', () => {
      updateQrDisplay('stripe');
      qrTabs.forEach(t =>
        t.classList.toggle('is-active', t.getAttribute('data-qr-target') === 'stripe')
      );
      openModal();
    });
  }

  if (closeQrBtn) {
    closeQrBtn.addEventListener('click', closeModal);
  }

  if (qrModal) {
    qrModal.addEventListener('click', e => {
      if (e.target === qrModal) closeModal();
    });
  }

  qrTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      qrTabs.forEach(t => {
        const isActive = t === tab;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      const target = tab.getAttribute('data-qr-target');
      if (target) updateQrDisplay(target);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && qrModal && !qrModal.hidden) {
      closeModal();
    }
  });
}

function initCalendlyButton() {
  document.addEventListener('click', e => {
    const btn = e.target.closest(
      '.calendly-panel-button, #contact-book-meeting-btn, [data-open-calendly]'
    );
    if (!btn) return;
    e.preventDefault();
    void openCalendlyPopup();
  });
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.contact-feedback-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `contact-feedback-toast toast-notification toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

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
    const email = form.querySelector('#email, #contact-email')?.value || '';
    const subject = form.querySelector('#subject, #contact-subject')?.value || '';
    const message = form.querySelector('#message, #contact-message')?.value || '';

    try {
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const result = await submitStoredForm('/api/contact', {
        name,
        email,
        subject,
        message,
        website: form.elements.website?.value || '',
        ...getSubmissionContext({ source: 'github_pages_contact' }),
      });
      showToast(result.message || 'Message saved. Mangesh will get back to you soon.', 'success');
      form.reset();
    } catch (error) {
      showToast(
        `${error.message || 'Message could not be saved.'} Email mraut712@gmail.com if this continues.`,
        'error'
      );
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
