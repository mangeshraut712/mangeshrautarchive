/**
 * Dev newsletter subscription form
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getApiBase() {
  if (typeof window === 'undefined') {
    return globalThis.APP_CONFIG?.apiBaseUrl || '';
  }
  const host = window.location.hostname || '';
  if (['localhost', '127.0.0.1', '0.0.0.0'].includes(host)) {
    return 'http://127.0.0.1:8001';
  }
  // GitHub Pages: Cloudflare edge (newsletter may soft-fail if route absent)
  if (host.endsWith('github.io')) {
    const configured = window.APP_CONFIG?.apiBaseUrl || '';
    if (configured && !/mangeshraut\.pro|vercel\.app/i.test(configured)) {
      return configured.replace(/\/$/, '');
    }
    return 'https://assistme-chat.mangeshraut712.workers.dev';
  }
  // Vercel / apex: same-origin relative API
  return window.APP_CONFIG?.apiBaseUrl || '';
}

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

async function subscribeEmail(email) {
  const response = await fetch(`${getApiBase()}/api/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      payload?.detail ||
      (typeof payload?.error === 'string' ? payload.error : payload?.error?.message) ||
      payload?.message ||
      (response.status === 503
        ? 'Newsletter is offline on this mirror — email mbr63@drexel.edu instead.'
        : 'Subscription failed. Please try again.');
    throw new Error(typeof detail === 'string' ? detail : 'Subscription failed. Please try again.');
  }

  return payload;
}

export function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  if (!form || form.dataset.bound === 'true') return;

  const emailInput = form.querySelector('#newsletter-email');
  const statusEl = form.querySelector('#newsletter-status');
  const submitBtn = form.querySelector('#newsletter-submit');

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
      const result = await subscribeEmail(email);
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewsletterForm, { once: true });
} else {
  initNewsletterForm();
}
