import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gotoSiteReady } from './helpers/site.js';

test('visible button and contact labels are part of their accessible names', async ({ page }) => {
  await gotoSiteReady(page);
  const results = await new AxeBuilder({ page })
    .withRules(['label-content-name-mismatch'])
    .analyze();
  expect(results.violations).toEqual([]);
  await expect(page.getByRole('button', { name: 'View Competency Matrix & Radar' })).toBeAttached();
  await expect(
    page.getByRole('button', { name: 'View System Topology & Pipeline' })
  ).toBeAttached();
});
