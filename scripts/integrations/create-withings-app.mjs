#!/usr/bin/env node
/**
 * Create Withings dev app + save credentials to .env (local redirect URI).
 * Requires logged-in Withings session in .playwright/gcp-profile.
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const PROFILE = resolve(ROOT, '.playwright/gcp-profile');
const ENV_FILE = resolve(ROOT, '.env');
const REDIRECT = 'http://127.0.0.1:8001/api/integrations/withings/callback';

function upsertEnvLine(content, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  return re.test(content) ? content.replace(re, line) : `${content.replace(/\s*$/, '')}\n${line}\n`;
}

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: true,
  viewport: { width: 1440, height: 900 },
});
await context.grantPermissions(['clipboard-read', 'clipboard-write']);
const page = context.pages()[0] || (await context.newPage());

await page.goto('https://developer.withings.com/dashboard/', {
  waitUntil: 'networkidle',
  timeout: 90000,
});
await page.waitForTimeout(2000);

const dashText = await page.locator('body').innerText();
if (/mangeshrautarchive/i.test(dashText) && /ClientID/i.test(dashText)) {
  await page.getByText('mangeshrautarchive').first().click();
} else {
  await page.goto('https://developer.withings.com/dashboard/create', {
    waitUntil: 'networkidle',
    timeout: 90000,
  });
  await page.waitForTimeout(1500);
  await page.getByText('Public API integration').first().click();
  await page.evaluate(() => {
    const cb = document.querySelector('#term_of_use');
    if (cb && !cb.checked) {
      cb.click();
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForTimeout(2500);
  await page.locator('#environment').click();
  await page.getByText('Development', { exact: true }).click();
  await page.locator('#name').fill('mangeshrautarchive');
  await page.locator('#description').fill('Portfolio health widget integration');
  await page.locator('[name="callback_urls.0.url"]').fill(REDIRECT);
  await page.evaluate(() =>
    [...document.querySelectorAll('button,span')]
      .find(e => e.textContent?.trim() === 'Done')
      ?.click()
  );
  await page.waitForTimeout(5000);
}

let clientId = (await page.locator('body').innerText()).match(
  /ClientID\s*\n?\s*([a-f0-9]{64})/i
)?.[1];
if (!clientId) {
  throw new Error('Withings Client ID not found on dashboard.');
}

await page.evaluate(() =>
  [...document.querySelectorAll('button,span')]
    .find(e => e.textContent?.trim() === 'Renew')
    ?.click()
);
await page.waitForTimeout(1500);
await page.evaluate(() =>
  [...document.querySelectorAll('button,span')]
    .find(e => e.textContent?.trim() === 'Continue')
    ?.click()
);
await page.waitForTimeout(3000);
await page
  .locator('dialog.modal-background, [role=dialog]')
  .first()
  .locator('button:has-text("Copy")')
  .last()
  .click({ force: true });
await page.waitForTimeout(500);
const clientSecret = await page.evaluate(async () => navigator.clipboard.readText());
if (!/^[a-f0-9]{64}$/i.test(clientSecret) || clientSecret === clientId) {
  throw new Error('Failed to capture Withings client secret from clipboard.');
}

let content = readFileSync(ENV_FILE, 'utf8');
content = upsertEnvLine(content, 'WITHINGS_CLIENT_ID', clientId);
content = upsertEnvLine(content, 'WITHINGS_CLIENT_SECRET', clientSecret);
content = upsertEnvLine(content, 'WITHINGS_REDIRECT_URI', REDIRECT);
writeFileSync(ENV_FILE, content, 'utf8');
console.log('[ok] Withings credentials saved to .env');
await context.close();
