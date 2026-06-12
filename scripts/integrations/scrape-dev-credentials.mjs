#!/usr/bin/env node
/**
 * Read OAuth app credentials from developer dashboards using saved browser profile.
 * Outputs JSON to stdout (caller must not log secrets publicly).
 */
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const PROFILE = resolve(ROOT, '.playwright/gcp-profile');

async function scrapeWhoop(page) {
  await page.goto('https://developer-dashboard.whoop.com/apps', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(3000);
  const url = page.url();
  if (/login|sign/i.test(url)) {
    return { provider: 'whoop', error: 'not_logged_in', url };
  }

  const appLink = page.locator('a[href*="/apps/"]').first();
  if (await appLink.count()) {
    await appLink.click();
    await page.waitForTimeout(2000);
  }

  const text = await page.locator('body').innerText();
  const clientId =
    text.match(/Client\s*ID[:\s]+([^\s\n]+)/i)?.[1] ||
    text.match(/client_id[:\s]+([^\s\n]+)/i)?.[1] ||
    null;
  const clientSecret =
    text.match(/Client\s*Secret[:\s]+([^\s\n]+)/i)?.[1] ||
    text.match(/client_secret[:\s]+([^\s\n]+)/i)?.[1] ||
    null;

  const inputs = await page
    .locator('input')
    .evaluateAll(nodes =>
      nodes.map(n => ({ name: n.getAttribute('name') || n.id, value: n.value, type: n.type }))
    );

  return {
    provider: 'whoop',
    url: page.url(),
    clientId,
    clientSecret,
    hasSecret: Boolean(clientSecret),
    inputCount: inputs.length,
    title: await page.title(),
  };
}

async function scrapeWithings(page) {
  await page.goto('https://developer.withings.com/dashboard', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(3000);
  const url = page.url();
  if (/login|sign|authorize/i.test(url)) {
    return { provider: 'withings', error: 'not_logged_in', url };
  }

  const text = await page.locator('body').innerText();
  const clientId =
    text.match(/Client\s*ID[:\s]+([^\s\n]+)/i)?.[1] ||
    text.match(/client_id[:\s]+([^\s\n]+)/i)?.[1] ||
    null;
  const clientSecret =
    text.match(/Client\s*Secret[:\s]+([^\s\n]+)/i)?.[1] ||
    text.match(/client_secret[:\s]+([^\s\n]+)/i)?.[1] ||
    null;

  return {
    provider: 'withings',
    url: page.url(),
    clientId,
    clientSecret,
    hasSecret: Boolean(clientSecret),
    title: await page.title(),
  };
}

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: true,
  viewport: { width: 1440, height: 900 },
});
const page = context.pages()[0] || (await context.newPage());
const whoop = await scrapeWhoop(page);
const withings = await scrapeWithings(page);
await context.close();

process.stdout.write(JSON.stringify({ whoop, withings }, null, 2));
