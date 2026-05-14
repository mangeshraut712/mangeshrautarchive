const CALENDLY_URL = 'https://calendly.com/mbr63drexel/30min';
const CALENDLY_WIDGET_CSS = 'https://assets.calendly.com/assets/external/widget.css';
const CALENDLY_WIDGET_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';

let calendlyLoadPromise = null;

function loadStylesheet(href) {
  const existing = document.querySelector(`link[href="${href}"]`);
  if (existing) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.href = href;
    link.rel = 'stylesheet';
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

function loadScript(src) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function ensureCalendlyLoaded() {
  if (window.Calendly) return true;

  calendlyLoadPromise ??= Promise.all([
    loadStylesheet(CALENDLY_WIDGET_CSS),
    loadScript(CALENDLY_WIDGET_SCRIPT),
  ])
    .then(() => Boolean(window.Calendly))
    .catch(error => {
      console.warn('Calendly widget failed to load', error);
      return false;
    });

  return calendlyLoadPromise;
}

export async function openCalendlyPopup() {
  const loaded = await ensureCalendlyLoaded();
  if (loaded && window.Calendly) {
    window.Calendly.initPopupWidget({ url: CALENDLY_URL });
    return;
  }

  window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
}

