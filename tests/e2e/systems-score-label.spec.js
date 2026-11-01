import { test, expect } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

test('systems performance tile describes the audit gate without invented metrics', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoSite(page, '/systems.html');
  const tile = page.locator('#systems-telemetry-bento [data-tile="performance"]');
  await tile.scrollIntoViewIfNeeded();
  await expect(tile.locator('.systems-tile-metric')).toHaveText('100/100/100/100');
  await expect(tile.locator('.systems-tile-foot')).toContainText('audit mode');
  const fits = await tile.locator('.systems-tile-metric').evaluate(element => {
    return element.scrollWidth <= element.clientWidth + 1;
  });
  expect(fits).toBe(true);
});

test('systems telemetry labels average latency and does not invent missing samples', async ({
  page,
}) => {
  await gotoSite(page, '/systems.html');
  const results = await page.evaluate(async () => {
    const { renderTelemetryBento } = await import('./js/modules/systems-viz.js');
    const parse = snapshot => {
      const doc = new DOMParser().parseFromString(renderTelemetryBento(snapshot), 'text/html');
      return {
        latency: doc.querySelector('[data-tile="verification"] .systems-tile-metric').textContent,
        caption: doc.querySelector('[data-tile="verification"] .systems-tile-caption').textContent,
        agent: doc.querySelector('[data-tile="agent"] .systems-tile-metric').textContent,
      };
    };
    return {
      absent: parse({ status: 'ok' }),
      present: parse({ status: 'ok', avg_latency_ms: 42 }),
    };
  });
  expect(results.absent.latency).toBe('Not measured');
  expect(results.present.latency).toBe('42ms');
  expect(results.present.caption).toContain('Average');
  expect(results.present.agent).toBe('Local');
});
