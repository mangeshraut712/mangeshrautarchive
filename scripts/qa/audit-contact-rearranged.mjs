import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const outDir =
  '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/contact_rearranged_audit';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Light (1440x900)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:4000', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.evaluate(() => {
      const contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView();
    });
    await page.waitForTimeout(800);
    const contactElem = await page.$('#contact');
    if (contactElem) {
      await contactElem.screenshot({ path: path.join(outDir, '01_desktop_contact_light.png') });
    }
    const followCard = await page.$('.follow-card');
    if (followCard) {
      await followCard.screenshot({ path: path.join(outDir, '04_follow_card_light.png') });
    }
    await page.close();
  }

  // 2. Desktop Dark (1440x900)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:4000', { waitUntil: 'networkidle' });
    const themeBtn = await page.$('#theme-toggle');
    if (themeBtn) {
      await themeBtn.click();
    }
    await page.evaluate(() => {
      const contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView();
    });
    await page.waitForTimeout(1000);
    const contactElem = await page.$('#contact');
    if (contactElem) {
      await contactElem.screenshot({ path: path.join(outDir, '02_desktop_contact_dark.png') });
    }
    const followCard = await page.$('.follow-card');
    if (followCard) {
      await followCard.screenshot({ path: path.join(outDir, '05_follow_card_dark.png') });
    }
    await page.close();
  }

  // 3. Mobile Light (390x844)
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto('http://127.0.0.1:4000', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.evaluate(() => {
      const contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView();
    });
    await page.waitForTimeout(800);
    const contactElem = await page.$('#contact');
    if (contactElem) {
      await contactElem.screenshot({ path: path.join(outDir, '03_mobile_contact_light.png') });
    }
    await page.close();
  }

  await browser.close();
  console.log('Visual audit completed successfully!');
}

runAudit().catch(console.error);
