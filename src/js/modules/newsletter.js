/**
 * Dev newsletter subscription form
 */

import { getSubmissionContext, submitStoredForm } from '../services/form-submission.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setStatus(statusEl, message, type = 'info') {
  if (!statusEl) return;
  statusEl.hidden = !message;
  statusEl.textContent = message;
  statusEl.classList.remove('is-success', 'is-error');
  if (type === 'success') statusEl.classList.add('is-success');
  if (type === 'error') statusEl.classList.add('is-error');
}

function setSubmitting(submitBtn, isSubmitting) {
  if (!submitBtn) return;
  submitBtn.disabled = isSubmitting;
  submitBtn.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
  const label = submitBtn.querySelector('.newsletter-submit-text');
  if (label) {
    label.textContent = isSubmitting ? 'Subscribing…' : 'Subscribe';
  }
}

async function subscribeEmail(form, email) {
  return submitStoredForm('/api/newsletter/subscribe', {
    email,
    website: form.elements.website?.value || '',
    ...getSubmissionContext({ source: form.dataset.source || 'blog_newsletter' }),
  });
}

function bindNewsletterForm(form) {
  if (!form || form.dataset.bound === 'true') return;
  const emailInput = form.querySelector('input[name="email"]');
  const statusEl = form.querySelector('[data-newsletter-status], .newsletter-status');
  const submitBtn = form.querySelector('button[type="submit"]');

  if (!emailInput || !submitBtn) return;

  form.dataset.bound = 'true';

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const email = emailInput.value.trim();
    if (!EMAIL_PATTERN.test(email)) {
      setStatus(statusEl, 'Enter a valid email address.', 'error');
      emailInput.focus();
      return;
    }

    setStatus(statusEl, '');
    setSubmitting(submitBtn, true);

    try {
      const result = await subscribeEmail(form, email);
      setStatus(statusEl, result.message || 'Thanks for subscribing!', 'success');
      form.reset();
      globalThis.analytics?.track?.('newsletter_subscribe', {
        outcome: 'success',
        already_subscribed: Boolean(result.alreadySubscribed),
      });
    } catch (error) {
      setStatus(statusEl, error.message || 'Subscription failed. Please try again.', 'error');
      globalThis.analytics?.track?.('newsletter_subscribe', {
        outcome: 'error',
        message: error.message,
      });
    } finally {
      setSubmitting(submitBtn, false);
    }
  });
}

export function initNewsletterForms(root = document) {
  const forms = root.querySelectorAll('[data-newsletter-form], #newsletter-form');
  forms.forEach(bindNewsletterForm);
}

export const initNewsletterForm = initNewsletterForms;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initNewsletterForms(), { once: true });
} else {
  initNewsletterForms();
}
