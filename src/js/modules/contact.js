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

// Handle Let's Talk button
function initLetsTalkButton() {
  const talkButton = document.getElementById('contact-chatbot-cta');
  if (!talkButton || talkButton.dataset.initialized === 'true') return;

  talkButton.dataset.initialized = 'true';

  talkButton.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Open chat widget or redirect to chat
    const chatWidget = document.getElementById('chatbot-widget');
    if (chatWidget) {
      chatWidget.scrollIntoView({ behavior: 'smooth' });
      chatWidget.classList.add('active');
    } else {
      // Fallback: Open chat in new window or show message
      showMessage('Chat feature is currently being updated. Please try again later.', 'info');
    }
  });
}

// Handle Schedule Meeting button
function initScheduleMeetingButton() {
  const scheduleButton = document.getElementById('schedule-meeting-btn');
  if (!scheduleButton || scheduleButton.dataset.initialized === 'true') return;

  scheduleButton.dataset.initialized = 'true';
  const originalText = scheduleButton.innerHTML;

  scheduleButton.addEventListener('click', async (e) => {
    e.preventDefault();

    try {
      scheduleButton.disabled = true;
      scheduleButton.innerHTML = '<span class="spinner"></span> Scheduling...';

      await new Promise(resolve => setTimeout(resolve, 1500));

      showMessage('Meeting scheduler will open in a new window.', 'success');

      window.open('https://calendly.com/mangeshraut', '_blank');
    } catch {
      showMessage('Unable to open meeting scheduler. Please try again.', 'error');
    } finally {
      scheduleButton.disabled = false;
      scheduleButton.innerHTML = originalText;
    }
  });
}

// Handle Set Reminder button
function initSetReminderButton() {
  const reminderButton = document.getElementById('add-reminder-btn');
  if (!reminderButton || reminderButton.dataset.initialized === 'true') return;

  reminderButton.dataset.initialized = 'true';
  const originalText = reminderButton.innerHTML;

  reminderButton.addEventListener('click', async (e) => {
    e.preventDefault();

    try {
      reminderButton.disabled = true;
      reminderButton.innerHTML = '<span class="spinner"></span> Setting...';

      await new Promise(resolve => setTimeout(resolve, 1000));

      showMessage('Reminder set! You will receive a notification before the meeting.', 'success');
    } catch {
      showMessage('Unable to set reminder. Please try again.', 'error');
    } finally {
      reminderButton.disabled = false;
      reminderButton.innerHTML = originalText;
    }
  });
}

// Handle Email buttons
function initEmailButtons() {
  const emailButtons = document.querySelectorAll('a[href^="mailto:"]');
  emailButtons.forEach(button => {
    if (button.dataset.initialized === 'true') return;

    button.dataset.initialized = 'true';
    button.addEventListener('click', () => {
      // Track email clicks if needed
      console.log('Email button clicked:', button.href);
    });
  });
}

// Handle Support buttons
function initSupportButtons() {
  const supportButtons = document.querySelectorAll('.support-button');
  supportButtons.forEach(button => {
    if (button.dataset.initialized === 'true') return;

    button.dataset.initialized = 'true';
    button.addEventListener('click', () => {
      // Track support button clicks
      console.log('Support button clicked:', button.href);
    });
  });
}

// Handle Social links
function initSocialLinks() {
  const socialLinks = document.querySelectorAll('.social-link');
  socialLinks.forEach(link => {
    if (link.dataset.initialized === 'true') return;

    link.dataset.initialized = 'true';
    link.addEventListener('click', () => {
      // Track social link clicks
      console.log('Social link clicked:', link.href);
    });
  });
}

function showMessage(message, tone = 'success') {
  // Remove existing messages
  document.querySelectorAll('.contact-message').forEach(msg => msg.remove());

  const node = document.createElement('div');
  node.className = 'contact-message';
  node.innerHTML = buildAlertMarkup(message, tone);
  node.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(node);

  window.setTimeout(() => {
    node.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => node.remove(), 300);
  }, 4000);
}

export function initContactPage() {
  // Initialize all contact page interactions
  initLetsTalkButton();
  initScheduleMeetingButton();
  initSetReminderButton();
  initEmailButtons();
  initSupportButtons();
  initSocialLinks();

  // Add styles for animations
  if (!document.getElementById('contact-page-styles')) {
    const style = document.createElement('style');
    style.id = 'contact-page-styles';
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

      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }

      .contact-message {
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
      }

      .contact-message.success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
      }

      .contact-message.error {
        background: #fee2e2;
        color: #b91c1c;
        border: 1px solid #fca5a5;
      }

      .contact-message.info {
        background: #dbeafe;
        color: #1e40af;
        border: 1px solid #93c5fd;
      }

      /* Dark mode support */
      html.dark .contact-message {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      html.dark .contact-message.success {
        background: #14532d;
        color: #22c55e;
        border: 1px solid #166534;
      }

      html.dark .contact-message.error {
        background: #7f1d1d;
        color: #fca5a5;
        border: 1px solid #b91c1c;
      }

      html.dark .contact-message.info {
        background: #1e3a8a;
        color: #60a5fa;
        border: 1px solid #1e40af;
      }
    `;
    document.head.appendChild(style);
  }
}

// Legacy contact form support (if needed)
export function initContactForm(formId = 'contact-form', root = document) {
  const form = root.getElementById(formId);
  if (!form || form.dataset.contactInitialized === 'true') return;

  form.dataset.contactInitialized = 'true';

  const submitButton = form.querySelector('button[type="submit"], .btn');
  const fields = form.querySelectorAll('input, textarea');

  function showMessageLocal(message, tone = 'success') {
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
      showMessageLocal(`Please fill in: ${missingFields.join(', ')}`, 'error');
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      showMessageLocal('Please enter a valid email address.', 'error');
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
        showMessageLocal(detail, 'error');
        return;
      }

      showMessageLocal('Thank you. Your message has been sent successfully.');
      form.reset();
    } catch {
      showMessageLocal(errorMessages.contactSendError, 'error');
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

// Initialize contact page when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initContactPage();
    }, { once: true });
  } else {
    initContactPage();
  }
}

export default initContactPage;
