#!/usr/bin/env node
/**
 * Playwright setup for WHOOP + Withings developer apps → .env.local
 * Uses persistent profile at .playwright/gcp-profile
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const PROFILE = resolve(ROOT, '.playwright/gcp-profile');
const ENV_FILE = resolve(ROOT, '.env.local');
const WHOOP_REDIRECT = 'http://127.0.0.1:8001/api/integrations/whoop/callback';
const WITHINGS_REDIRECT = 'http://127.0.0.1:8001/api/integrations/withings/callback';

function upsertEnvLine(content, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  return re.test(content) ? content.replace(re, line) : `${content.replace(/\s*$/, '')}\n${line}\n`;
}

async function fillVisible(page, matcher, value) {
  const count = await page.locator('input:visible').count();
  for (let i = 0; i < count; i += 1) {
    const el = page.locator('input:visible').nth(i);
    const meta = await el.evaluate(node => ({
      id: node.id,
      name: node.name,
      placeholder: node.placeholder,
      type: node.type,
      aria: node.getAttribute('aria-label') || '',
    }));
    const label = `${meta.id} ${meta.name} ${meta.placeholder} ${meta.aria}`.toLowerCase();
    if (matcher.test(label)) {
      await el.fill(value);
      return true;
    }
  }
  return false;
}

async function setupWithings(page) {
  await page.goto('https://developer.withings.com/dashboard/', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2000);

  const body = await page.locator('body').innerText();
  if (/client id/i.test(body) && /client secret/i.test(body)) {
    return extractWithingsCreds(body);
  }

  if (/create your first application/i.test(body)) {
    await page.getByRole('button', { name: /create application/i }).click();
    await page.waitForTimeout(2500);
  }

  // Wizard: Public API
  if (await page.getByText(/Public API integration/i).count()) {
    await page.getByText(/Public API integration/i).first().click();
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: /next|continue/i }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Terms
  if (await page.getByText(/terms/i).count()) {
    const checkbox = page.locator('input[type=checkbox]:visible').first();
    if (await checkbox.count()) await checkbox.check({ force: true }).catch(() => {});
    await page.getByRole('button', { name: /accept|next|continue/i }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Development target
  if (await page.getByText(/^Development$/i).count()) {
    await page.getByText(/^Development$/i).first().click();
    await page.waitForTimeout(800);
  }

  // App info form
  await fillVisible(page, /name/, 'mangeshrautarchive');
  await fillVisible(page, /desc/, 'Portfolio health widget');
  await fillVisible(page, /url|redirect|callback|registered/, WITHINGS_REDIRECT);

  const nameInput = page.locator('#name:visible, input[name=name]:visible').first();
  if (await nameInput.count()) await nameInput.fill('mangeshrautarchive');
  const descInput = page.locator('#description:visible, textarea:visible').first();
  if (await descInput.count()) await descInput.fill('Portfolio health widget');

  const urlInputs = page.locator('input:visible');
  const n = await urlInputs.count();
  for (let i = 0; i < n; i += 1) {
    const el = urlInputs.nth(i);
    const ph = ((await el.getAttribute('placeholder')) || '').toLowerCase();
    const id = ((await el.getAttribute('id')) || '').toLowerCase();
    if (/url|redirect|callback|registered|website/.test(`${ph} ${id}`)) {
      await el.fill(WITHINGS_REDIRECT);
    }
  }

  await page.getByRole('button', { name: /save|create|next|continue|confirm/i }).first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(4000);

  const finalText = await page.locator('body').innerText();
  await page.screenshot({ path: resolve(ROOT, '.playwright/withings-final.png'), fullPage: true });
  return extractWithingsCreds(finalText);
}

function extractWithingsCreds(text) {
  const clientId =
    text.match(/Client ID\s*\n?\s*([a-f0-9]{32})/i)?.[1] ||
    text.match(/Client ID\s*[:\s]+([^\s\n]+)/i)?.[1];
  const clientSecret =
    text.match(/Client Secret\s*\n?\s*([a-f0-9]{64})/i)?.[1] ||
    text.match(/Client Secret\s*[:\s]+([^\s\n]+)/i)?.[1];
  return { clientId, clientSecret };
}

async function setupWhoop(page) {
  await page.goto('https://developer-dashboard.whoop.com/apps', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(5000);

  let text = await page.locator('body').innerText();
  if (!text.trim() || /sign in|log in/i.test(text)) {
    await page.goto('https://developer-dashboard.whoop.com/apps/create', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(5000);
    text = await page.locator('body').innerText();
  }

  if (/client id/i.test(text) && /client secret/i.test(text)) {
    return extractWhoopCreds(text);
  }

  // Try create flow
  const createLink = page.locator('a[href*="create"], button:has-text("Create")').first();
  if (await createLink.count()) {
    await createLink.click();
    await page.waitForTimeout(3000);
  } else {
    await page.goto('https://developer-dashboard.whoop.com/apps/create', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);
  }

  await fillVisible(page, /name|app/, 'mangeshrautarchive');
  await fillVisible(page, /redirect|callback|uri/, WHOOP_REDIRECT);

  const inputs = page.locator('input:visible, textarea:visible');
  const count = await inputs.count();
  for (let i = 0; i < count; i += 1) {
    const el = inputs.nth(i);
    const ph = ((await el.getAttribute('placeholder')) || '').toLowerCase();
    const name = ((await el.getAttribute('name')) || '').toLowerCase();
    if (/redirect|callback|uri/.test(`${ph} ${name}`)) await el.fill(WHOOP_REDIRECT);
    if (/name/.test(`${ph} ${name}`) && !/user|team/.test(`${ph} ${name}`)) await el.fill('mangeshrautarchive');
  }

  // Scopes checkboxes - enable offline + read scopes
  for (const scope of ['offline', 'read:recovery', 'read:cycles', 'read:sleep', 'read:body_measurement']) {
    const box = page.locator(`input[type=checkbox][value="${scope}"], label:has-text("${scope}") input`).first();
    if (await box.count()) await box.check({ force: true }).catch(() => {});
  }

  await page.getByRole('button', { name: /create|save|submit/i }).first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(4000);

  text = await page.locator('body').innerText();
  await page.screenshot({ path: resolve(ROOT, '.playwright/whoop-final.png'), fullPage: true });

  if (!/client id/i.test(text)) {
    // click first app in list
    const app = page.locator('a[href*="/apps/"]').first();
    if (await app.count()) {
      await app.click();
      await page.waitForTimeout(3000);
      text = await page.locator('body').innerText();
    }
  }

  return extractWhoopCreds(text);
}

function extractWhoopCreds(text) {
  const clientId =
    text.match(/Client ID\s*\n?\s*([^\s\n]+)/i)?.[1] ||
    text.match(/client_id[:\s]+([^\s\n]+)/i)?.[1];
  const clientSecret =
    text.match(/Client Secret\s*\n?\s*([^\s\n]+)/i)?.[1] ||
    text.match(/client_secret[:\s]+([^\s\n]+)/i)?.[1];
  return { clientId, clientSecret };
}

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: true,
  viewport: { width: 1440, height: 900 },
});
const page = context.pages()[0] || (await context.newPage());

const withings = await setupWithings(page);
const whoop = await setupWhoop(page);
await context.close();

console.log(JSON.stringify({
  withings: { configured: Boolean(withings.clientId && withings.clientSecret) },
  whoop: { configured: Boolean(whoop.clientId && whoop.clientSecret) },
}, null, 2));

if (!withings.clientId || !withings.clientSecret) {
  console.error('[fail] Withings credentials not found. See .playwright/withings-final.png');
}
if (!whoop.clientId || !whoop.clientSecret) {
  console.error('[fail] WHOOP credentials not found. See .playwright/whoop-final.png');
}

if (!withings.clientId || !withings.clientSecret || !whoop.clientId || !whoop.clientSecret) {
  process.exit(1);
}

let content = readFileSync(ENV_FILE, 'utf8');
content = upsertEnvLine(content, 'WHOOP_CLIENT_ID', whoop.clientId);
content = upsertEnvLine(content, 'WHOOP_CLIENT_SECRET', whoop.clientSecret);
content = upsertEnvLine(content, 'WHOOP_REDIRECT_URI', WHOOP_REDIRECT);
content = upsertEnvLine(content, 'WITHINGS_CLIENT_ID', withings.clientId);
content = upsertEnvLine(content, 'WITHINGS_CLIENT_SECRET', withings.clientSecret);
content = upsertEnvLine(content, 'WITHINGS_REDIRECT_URI', WITHINGS_REDIRECT);
writeFileSync(ENV_FILE, content, 'utf8');
console.log('[ok] Saved WHOOP + Withings credentials to .env.local (local redirect URIs)');
