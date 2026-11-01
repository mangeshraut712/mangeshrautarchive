import { test, expect } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

test('theme stylesheet is moved only when another style follows it', async ({ page }) => {
  await gotoSite(page, '/');
  const result = await page.evaluate(() => {
    const sheet = document.querySelector('link[href*="theme-solid-surfaces"]');
    document.head.appendChild(sheet);
    const append = document.head.appendChild;
    let moves = 0;
    document.head.appendChild = function (node) {
      if (node === sheet) moves += 1;
      return append.call(this, node);
    };
    window.__portfolioTheme.init();
    const unnecessaryMoves = moves;
    const laterStyle = document.createElement('style');
    laterStyle.textContent = ':root { --test-later-style: 1; }';
    document.head.appendChild(laterStyle);
    window.__portfolioTheme.init();
    const restoredOrder =
      laterStyle.compareDocumentPosition(sheet) & Node.DOCUMENT_POSITION_FOLLOWING;
    document.head.appendChild = append;
    laterStyle.remove();
    return { unnecessaryMoves, moves, restoredOrder: Boolean(restoredOrder) };
  });
  expect(result.unnecessaryMoves).toBe(0);
  expect(result.moves).toBe(1);
  expect(result.restoredOrder).toBe(true);
});
