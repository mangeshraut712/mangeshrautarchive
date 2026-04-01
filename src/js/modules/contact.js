import { api, errorMessages } from '../core/config.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveContactEndpoint() {
  const configuredBase = window.APP_CONFIG?.apiBaseUrl || api.baseUrl || '';
  if (!configuredBase) return api.endpoints.contact;
  return `${configuredBase.replace(/\/+$/, '')}${api.endpoints.contact}`;
}

function buildAlertMarkup(message, tone) {
  const palette =
    tone === 'success'
      ? 'background:#dcfce7;color:#166534;border:1px solid #bbf7d0;'
      : 'background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;';

  return `<div style="${palette}padding:12px;border-radius:10px;margin-bottom:16px;">${message}</div>`;
}

export function initContactForm(formId = 'contact-form', root = document) {
  const form = root.getElementById(formId);
  if (!form || form.dataset.contactInitialized === 'true') return;

  form.dataset.contactInitialized = 'true';

  const submitButton = form.querySelector('button[type="submit"], .btn');
  const fields = form.querySelectorAll('input, textarea');

  function showMessage(message, tone = 'success') {
    form.querySelector('.contact-message')?.remove();

    const node = document.createElement('div');
    node.className = 'contact-message';
    node.innerHTML = buildAlertMarkup(message, tone);
    form.prepend(node);

    window.setTimeout(() => {
      node.remove();
    }, 5000);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    if (submitButton?.disabled) return;

    const payload = Object.fromEntries(new FormData(form).entries());
    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim();
    const subject = String(payload.subject || '').trim();
    const message = String(payload.message || '').trim();

    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!subject) missingFields.push('subject');
    if (!message) missingFields.push('message');

    if (missingFields.length > 0) {
      showMessage(`Please fill in: ${missingFields.join(', ')}`, 'error');
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      showMessage('Please enter a valid email address.', 'error');
      return;
    }

    const originalButtonText = submitButton?.innerHTML || 'Send Message';

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner"></span> Sending...';
    }

    fields.forEach(field => {
      field.disabled = true;
    });

    try {
      const response = await fetch(resolveContactEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        const detail = data.detail || data.message || errorMessages.contactSendError;
        showMessage(detail, 'error');
        return;
      }

      showMessage('Thank you. Your message has been sent successfully.');
      form.reset();
    } catch {
      showMessage(errorMessages.contactSendError, 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }

      fields.forEach(field => {
        field.disabled = false;
      });
    }
  }

  form.addEventListener('submit', handleSubmit, { capture: true });

  if (!document.getElementById('contact-form-styles')) {
    const style = document.createElement('style');
    style.id = 'contact-form-styles';
    style.textContent = `
      .spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        margin-right: 8px;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initContactForm();
    }, { once: true });
  } else {
    initContactForm();
  }
}

export default initContactForm;
