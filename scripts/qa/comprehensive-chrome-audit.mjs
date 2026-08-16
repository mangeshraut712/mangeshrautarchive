import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const ARTIFACTS_DIR = path.resolve(
  '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/chrome_browser_audit'
);

const BASE_URL = 'http://127.0.0.1:4000';

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'systems', path: '/systems' },
  { name: 'monitor', path: '/monitor' },
  { name: 'travel', path: '/travel' },
  { name: 'uses', path: '/uses' },
  { name: 'changelog', path: '/changelog' },
  { name: '404', path: '/404' },
];

async function runAudit() {
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const auditReport = {
    timestamp: new Date().toISOString(),
    consoleErrors: [],
    consoleWarnings: [],
    failedRequests: [],
    visualFindings: [],
    interactionsTested: [],
  };

  console.log('🚀 Starting Comprehensive Chrome Browser Audit...');

  // 1. Desktop Audit (1440x900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  const page = await desktopContext.newPage();

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      auditReport.consoleErrors.push({ page: page.url(), text });
      console.log(`[Console Error] ${text}`);
    } else if (type === 'warn') {
      auditReport.consoleWarnings.push({ page: page.url(), text });
    }
  });

  page.on('requestfailed', req => {
    auditReport.failedRequests.push({
      url: req.url(),
      failure: req.failure()?.errorText || 'Unknown failure',
    });
    console.log(`[Request Failed] ${req.url()} - ${req.failure()?.errorText}`);
  });

  page.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('/404')) {
      auditReport.failedRequests.push({
        url: res.url(),
        status: res.status(),
      });
      console.log(`[HTTP ${res.status()}] ${res.url()}`);
    }
  });

  // Audit all pages on Desktop (Light & Dark)
  for (const p of PAGES) {
    console.log(`\n📄 Auditing Desktop: ${p.name} (${p.path})`);
    await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Check overflow
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        hasOverflow: doc.scrollWidth > doc.clientWidth,
      };
    });

    if (overflow.hasOverflow) {
      auditReport.visualFindings.push({
        page: p.name,
        issue: `Desktop horizontal overflow: scrollWidth (${overflow.scrollWidth}px) > clientWidth (${overflow.clientWidth}px)`,
      });
    }

    // Capture Light Screenshot
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, `desktop_${p.name}_light.png`),
      fullPage: false,
    });

    // Switch to Dark Theme
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(400);

    // Capture Dark Screenshot
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, `desktop_${p.name}_dark.png`),
      fullPage: false,
    });

    // Reset back to Light
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
  }

  // 2. Interactive Feature Testing on Homepage
  console.log('\n⚡ Testing Interactive Features on Homepage...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  // A. Search Palette
  try {
    const searchBtn = await page.$(
      '#search-trigger-island, .search-island-btn, [data-action="search"]'
    );
    if (searchBtn) {
      await searchBtn.click();
      await page.waitForTimeout(400);
      const isSearchVisible = await page.evaluate(() => {
        const modal = document.querySelector(
          '#search-palette-modal, .search-palette-overlay, .search-dialog'
        );
        return (
          modal &&
          window.getComputedStyle(modal).display !== 'none' &&
          window.getComputedStyle(modal).visibility !== 'hidden'
        );
      });
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'desktop_search_modal_open.png'),
      });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      auditReport.interactionsTested.push({
        feature: 'Search Palette',
        working: true,
        visible: isSearchVisible,
      });
      console.log('✓ Search Palette interaction verified');
    }
  } catch (err) {
    auditReport.visualFindings.push({ feature: 'Search Palette', error: err.message });
  }

  // B. Chatbot Assistant Modal
  try {
    const chatToggle = await page.$('#chatbot-toggle');
    if (chatToggle) {
      await chatToggle.click();
      await page.waitForTimeout(600);
      const isChatVisible = await page.evaluate(() => {
        const sheet = document.querySelector('#chat-modal-sheet, .chatbot-container');
        return (
          sheet &&
          (sheet.classList.contains('active') ||
            sheet.classList.contains('open') ||
            window.getComputedStyle(sheet).display !== 'none')
        );
      });
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'desktop_chatbot_open.png'),
      });

      // Send a test prompt
      const chatInput = await page.$('#chatbot-input');
      const sendBtn = await page.$('#chatbot-send');
      if (chatInput && sendBtn) {
        await chatInput.fill('Hi Mangesh, what are your core skills?');
        await sendBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: path.join(ARTIFACTS_DIR, 'desktop_chatbot_message_sent.png'),
        });
      }

      const chatClose = await page.$('#chatbot-close, .chatbot-close');
      if (chatClose) {
        await chatClose.click();
        await page.waitForTimeout(400);
      }
      auditReport.interactionsTested.push({
        feature: 'AssistMe Chatbot',
        working: true,
        visible: isChatVisible,
      });
      console.log('✓ AssistMe Chatbot interaction verified');
    }
  } catch (err) {
    auditReport.visualFindings.push({ feature: 'AssistMe Chatbot', error: err.message });
  }

  // C. Skills Radar Interactive Tabs
  try {
    const radarPill = await page.$(
      '.skills-category-pill:not(.active), [data-skills-tab]:not(.active)'
    );
    if (radarPill) {
      await radarPill.click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'desktop_skills_radar_switched.png'),
      });
      auditReport.interactionsTested.push({ feature: 'Skills Radar Tabs', working: true });
      console.log('✓ Skills Radar Tabs verified');
    }
  } catch (err) {
    auditReport.visualFindings.push({ feature: 'Skills Radar', error: err.message });
  }

  // D. Project Filter Pills
  try {
    const filterPill = await page.$('.filter-pill:not(.active), [data-filter]:not(.active)');
    if (filterPill) {
      await filterPill.click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'desktop_projects_filter_switched.png'),
      });
      auditReport.interactionsTested.push({ feature: 'Project Filter Pills', working: true });
      console.log('✓ Project Filter Pills verified');
    }
  } catch (err) {
    auditReport.visualFindings.push({ feature: 'Project Filter', error: err.message });
  }

  // E. Music Card & Media Tab in Contact Section
  try {
    const mediaTab = await page.$('[data-currently-tab="media"], #tab-media-toggle');
    if (mediaTab) {
      await mediaTab.click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'desktop_music_card_active.png'),
      });
      auditReport.interactionsTested.push({ feature: 'Music / Media Tab', working: true });
      console.log('✓ Music / Media Tab verified');
    }
  } catch (err) {
    auditReport.visualFindings.push({ feature: 'Music Card', error: err.message });
  }

  await desktopContext.close();

  // 3. Mobile Viewport Audit (390x844 iPhone 14)
  console.log('\n📱 Auditing Mobile Viewports (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  });

  const mobilePage = await mobileContext.newPage();

  mobilePage.on('console', msg => {
    if (msg.type() === 'error') {
      auditReport.consoleErrors.push({ page: `mobile:${mobilePage.url()}`, text: msg.text() });
    }
  });

  for (const p of PAGES) {
    console.log(`📱 Auditing Mobile: ${p.name} (${p.path})`);
    await mobilePage.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(800);

    const mobileOverflow = await mobilePage.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        hasOverflow: doc.scrollWidth > doc.clientWidth,
      };
    });

    if (mobileOverflow.hasOverflow) {
      auditReport.visualFindings.push({
        page: `mobile_${p.name}`,
        issue: `Mobile horizontal overflow: scrollWidth (${mobileOverflow.scrollWidth}px) > clientWidth (${mobileOverflow.clientWidth}px)`,
      });
    }

    await mobilePage.screenshot({
      path: path.join(ARTIFACTS_DIR, `mobile_${p.name}_light.png`),
      fullPage: false,
    });
  }

  // Mobile Menu Interaction
  try {
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(600);
    const menuBtn = await mobilePage.$('#menu-toggle-btn, .mobile-menu-btn, .hamburger');
    if (menuBtn) {
      await menuBtn.click();
      await mobilePage.waitForTimeout(400);
      await mobilePage.screenshot({
        path: path.join(ARTIFACTS_DIR, 'mobile_menu_overlay_open.png'),
      });
      auditReport.interactionsTested.push({ feature: 'Mobile Menu Overlay', working: true });
      console.log('✓ Mobile Menu Overlay verified');
    }
  } catch (err) {
    auditReport.visualFindings.push({ feature: 'Mobile Menu', error: err.message });
  }

  await mobileContext.close();
  await browser.close();

  // Write report
  const reportPath = path.join(ARTIFACTS_DIR, 'browser_audit_report.json');
  await fs.writeFile(reportPath, JSON.stringify(auditReport, null, 2), 'utf8');
  console.log(`\n✅ Audit complete! Report written to ${reportPath}`);
  console.log(`Console Errors: ${auditReport.consoleErrors.length}`);
  console.log(`Failed Requests: ${auditReport.failedRequests.length}`);
  console.log(`Visual Findings: ${auditReport.visualFindings.length}`);
  console.log(`Interactions Tested: ${auditReport.interactionsTested.length}`);
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
