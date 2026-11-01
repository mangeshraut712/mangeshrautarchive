import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(
  new URL('../../src/js/modules/hero-flyout-position.js', import.meta.url),
  'utf8'
);

function classList() {
  const classes = new Set();
  return {
    add: name => classes.add(name),
    remove: name => classes.delete(name),
    contains: name => classes.has(name),
    toggle: (name, force) => (force ? classes.add(name) : classes.delete(name)),
  };
}

function setup({ slotRect, width = 375, height = 812 } = {}) {
  const slot = slotRect && { classList: classList(), getBoundingClientRect: () => slotRect };
  const flyout = {
    id: 'vibe-stack-flyout',
    classList: classList(),
    style: {},
    offsetWidth: 340,
    offsetHeight: 90,
  };
  const anchor = {
    getBoundingClientRect: () => ({ left: 120, width: 100, top: 240, bottom: 280 }),
  };
  const document = {
    readyState: 'complete',
    body: { appendChild() {} },
    getElementById: () => null,
    querySelector: () => slot,
  };
  const context = { document, window: { innerWidth: width, innerHeight: height } };
  runInNewContext(source, context);
  return { context, flyout, anchor, slot };
}

test('flyout docks to the music row, stays in the viewport, and restores the row on close', () => {
  const { context, flyout, anchor, slot } = setup({
    slotRect: { top: 330, width: 320, height: 100 },
  });
  context.positionHeroFlyout({ flyout, anchor });
  assert.equal(flyout.style.top, '330px');
  assert.equal(flyout.classList.contains('hero-flyout--music-slot'), true);
  assert.equal(slot.classList.contains('is-flyout-covered'), true);
  assert.ok(Number.parseInt(flyout.style.left, 10) >= 14);
  assert.ok(Number.parseInt(flyout.style.left, 10) + flyout.offsetWidth <= 375 - 14);
  context.clearHeroFlyoutLayout(flyout);
  assert.equal(slot.classList.contains('is-flyout-covered'), false);
  assert.equal(flyout.style.left, '');
  assert.equal(flyout.style.position, '');
});

test('flyout uses the anchor when no music row is available', () => {
  const { context, flyout, anchor } = setup();
  context.positionHeroFlyout({ flyout, anchor });
  assert.equal(flyout.style.top, '290px');
  assert.equal(flyout.classList.contains('hero-flyout--music-slot'), false);
  assert.equal(flyout.style.maxWidth, '340px');
});

test('closing one flyout keeps the music row covered while the other remains open', () => {
  const { context, flyout, anchor, slot } = setup({
    slotRect: { top: 330, width: 320, height: 100 },
  });
  const otherFlyout = { classList: classList() };
  otherFlyout.classList.add('is-open');
  context.document.getElementById = id => (id === 'reach-flyout' ? otherFlyout : null);
  context.positionHeroFlyout({ flyout, anchor });
  context.clearHeroFlyoutLayout(flyout);
  assert.equal(slot.classList.contains('is-flyout-covered'), true);
});
