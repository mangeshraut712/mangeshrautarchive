import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(
  new URL('../../src/js/utils/deferred-analytics.js', import.meta.url),
  'utf8'
);

function createAnalyticsPage() {
  const listeners = new Map();
  const scripts = [];
  const documentListeners = new Map();
  const timers = [];
  let idle;
  const window = {
    location: {
      hostname: 'mangeshraut712.github.io',
      href: 'https://mangeshraut712.github.io/mangeshrautarchive/',
    },
    addEventListener: (name, handler) => listeners.set(name, handler),
    requestIdleCallback: handler => {
      idle = handler;
    },
    setTimeout: (handler, delay) => timers.push({ handler, delay }),
  };
  const document = {
    title: 'Portfolio',
    addEventListener: (name, handler) => documentListeners.set(name, handler),
    createElement: () => ({}),
    head: { appendChild: script => scripts.push(script) },
  };
  runInNewContext(source, { window, document, URL });
  return {
    window,
    scripts,
    timers,
    click: target => documentListeners.get('click')?.({ target: { closest: () => target } }),
    emit: name => listeners.get(name)?.(),
    idle: () => idle(),
  };
}

test('scripted scrolling does not count as analytics input, while a visitor wheel does', () => {
  const page = createAnalyticsPage();
  page.emit('scroll');
  assert.equal(page.scripts.length, 0);
  page.emit('wheel');
  assert.equal(page.scripts.length, 1);
  assert.match(page.scripts[0].src, /gtag\/js\?id=G-HVKF4N150Y$/);
});

test('analytics retains queued events and the existing idle fallback without visitor input', () => {
  const page = createAnalyticsPage();
  page.window.trackPortfolioEvent('resume_download', { placement: 'hero' });
  assert.equal(page.window.dataLayer.length, 3);
  const config = page.window.dataLayer[1][2];
  assert.equal(config.cookie_domain, 'mangeshraut712.github.io');
  assert.equal(config.send_page_view, true);
  page.idle();
  assert.equal(page.timers[0].delay, 3500);
  page.timers[0].handler();
  page.emit('pagehide');
  assert.equal(page.scripts.length, 1);
});

test('leaving before the idle fallback starts analytics once with its queued page view', () => {
  const page = createAnalyticsPage();
  page.emit('pagehide');
  page.emit('pointerdown');
  assert.equal(page.scripts.length, 1);
  assert.equal(page.window.dataLayer[1][0], 'config');
});

test('high-intent conversion events (checkout, lead, newsletter, reverse interview) dispatch cleanly to dataLayer', () => {
  const page = createAnalyticsPage();
  page.window.trackPortfolioEvent('checkout_initiated', {
    provider: 'stripe',
    product: 'technical_advisory',
    amount: '250',
    currency: 'usd',
  });
  page.window.trackPortfolioEvent('lead_generated', {
    channel: 'contact_form',
    subject: 'Senior Backend Opportunity',
  });
  page.window.trackPortfolioEvent('newsletter_subscribed', {
    source: 'homepage_newsletter',
  });
  page.window.trackPortfolioEvent('reverse_interview_click', {
    prompt_id: 'dual_host',
    prompt_text: 'Explain your zero-drift dual-host architecture',
  });

  const events = page.window.dataLayer.filter(item => item[0] === 'event');
  assert.equal(events.length, 4);
  assert.equal(events[0][1], 'checkout_initiated');
  assert.equal(events[0][2].provider, 'stripe');
  assert.equal(events[1][1], 'lead_generated');
  assert.equal(events[2][1], 'newsletter_subscribed');
  assert.equal(events[3][1], 'reverse_interview_click');
});

function link(href) {
  return {
    getAttribute: name => (name === 'href' ? href : null),
    classList: { contains: () => false },
    hasAttribute: () => false,
    closest: () => null,
    dataset: {},
    textContent: 'Support',
  };
}

test('checkout delegation rejects lookalike hosts, URL credentials and embedded destinations', () => {
  const page = createAnalyticsPage();
  for (const href of [
    'https://buy.stripe.com.attacker.example/pay',
    'https://attacker.example/?next=https://www.paypal.com/pay',
    'https://www.paypal.com@attacker.example/pay',
    'https://notbuymeacoffee.com/mangesh',
    'https://attacker.example/github.com/sponsors/mangesh',
    'javascript:open("https://buy.stripe.com/pay")',
    'http://buy.stripe.com/pay',
    'https://user:pass@www.paypal.com/pay',
  ])
    page.click(link(href));
  assert.equal(page.window.dataLayer.filter(item => item[0] === 'event').length, 0);
});

test('checkout delegation preserves real providers and their event payloads', () => {
  const page = createAnalyticsPage();
  const targets = [
    ['https://buy.stripe.com/example', 'stripe'],
    ['https://www.paypal.com/ncp/payment/example', 'paypal'],
    ['https://paypal.me/mangesh', 'paypal'],
    ['https://buymeacoffee.com/mangesh', 'buymeacoffee'],
    ['https://github.com/sponsors/mangeshraut712', 'github_sponsors'],
  ];
  for (const [href] of targets) page.click(link(href));
  const events = page.window.dataLayer.filter(item => item[1] === 'checkout_initiated');
  assert.equal(events.length, targets.length);
  events.forEach((event, index) => {
    assert.equal(event[2].provider, targets[index][1]);
    assert.equal(event[2].destination, targets[index][0]);
  });
});
