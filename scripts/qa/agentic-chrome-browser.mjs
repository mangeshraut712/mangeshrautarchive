import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve(
  '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/agentic_chrome_browse'
);
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runAgenticChromeSession() {
  console.log('🚀 Launching Chrome browser for agentic browsing...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warn') {
      consoleLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  const journeyLog = [];
  function logStep(step, detail) {
    console.log(`▶ [${step}] ${detail}`);
    journeyLog.push({ step, detail, time: new Date().toISOString() });
  }

  // ── JOURNEY 1: Homepage & Hero Exploration ─────────────────
  logStep('Navigate', 'Navigating to http://127.0.0.1:4000/index.html');
  await page.goto('http://127.0.0.1:4000/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take Hero Screenshot
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01_homepage_hero.png'),
    fullPage: false,
  });
  logStep('Hero Inspected', 'Captured 01_homepage_hero.png');

  // Check Apple Music Card State
  const musicCard = page.locator('#music-card');
  const isMusicVisible = await musicCard.isVisible();
  logStep('Music Card', `Music card visible: ${isMusicVisible}`);

  // ── JOURNEY 2: About Section Story Tabs ─────────────────────
  logStep('About Tabs', 'Testing About section story switching (Full Story vs Quick Summary)');
  const quickSummaryTab = page.locator(
    '#tab-summary, #tab-quick-summary, .about-segmented-control button:nth-child(2)'
  );
  if (await quickSummaryTab.isVisible()) {
    await quickSummaryTab.click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02_about_quick_summary.png'),
    });
    logStep('About Tabs', 'Switched to Quick Summary and captured screenshot');

    const fullStoryTab = page.locator(
      '#tab-full, #tab-full-story, .about-segmented-control button:nth-child(1)'
    );
    if (await fullStoryTab.isVisible()) {
      await fullStoryTab.click();
      await page.waitForTimeout(300);
    }
  }

  // ── JOURNEY 3: Skills Marquee & Radar Disclosure ────────────
  logStep('Skills Section', 'Scrolling to #skills and activating Competency Radar disclosure');
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const radarBtn = page.locator('#skills-radar-toggle-btn');
  if (await radarBtn.isVisible()) {
    logStep('Radar Toggle', 'Clicking View Competency Matrix & Radar button');
    await radarBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03_skills_radar_revealed.png'),
    });
  }

  // ── JOURNEY 4: Systems Engineering Architecture Tree ───────
  logStep(
    'Engineering Section',
    'Scrolling to #engineering and activating System Topology disclosure'
  );
  await page.locator('#engineering').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const archBtn = page.locator('#arch-tree-toggle-btn');
  if (await archBtn.isVisible()) {
    logStep('Arch Tree Toggle', 'Clicking View System Topology & Pipeline button');
    await archBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04_system_topology_revealed.png'),
    });
  }

  // ── JOURNEY 5: Project Showcase Interaction & Search ────────
  logStep('Projects Section', 'Testing Project filter chips and real-time instant search');
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const searchInput = page.locator('#project-search-input');
  if (await searchInput.isVisible()) {
    logStep('Search Test', 'Typing "agent" into project search');
    await searchInput.fill('agent');
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05_projects_search_agent.png'),
    });
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(400);
  }

  // Test Tech Filter Chips
  const tsChip = page.locator('.project-tech-chip[data-tech="typescript"]');
  if (await tsChip.isVisible()) {
    logStep('Tech Chip', 'Filtering projects by TypeScript');
    await tsChip.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06_projects_tech_chip_ts.png'),
    });
    const allLens = page.locator('.project-lens-chip[data-project-lens="all"]');
    if (await allLens.isVisible()) {
      await allLens.click();
      await page.waitForTimeout(400);
    }
  }

  // ── JOURNEY 6: Subpages Exploration ─────────────────────────
  const subpages = [
    { url: 'http://127.0.0.1:4000/systems.html', name: '07_subpage_systems' },
    { url: 'http://127.0.0.1:4000/monitor.html', name: '08_subpage_monitor' },
    { url: 'http://127.0.0.1:4000/travel.html', name: '09_subpage_travel' },
    { url: 'http://127.0.0.1:4000/uses.html', name: '10_subpage_uses' },
    { url: 'http://127.0.0.1:4000/changelog.html', name: '11_subpage_changelog' },
    { url: 'http://127.0.0.1:4000/404.html', name: '12_subpage_404' },
  ];

  for (const sp of subpages) {
    logStep('Subpage Browse', `Browsing ${sp.url}`);
    await page.goto(sp.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${sp.name}.png`),
      fullPage: false,
    });
  }

  // ── JOURNEY 7: Dark / Light Mode Theme Switching ────────────
  logStep('Theme Switching', 'Testing theme switcher across pages');
  await page.goto('http://127.0.0.1:4000/index.html', { waitUntil: 'networkidle' });
  const themeToggle = page.locator('#theme-toggle, .theme-toggle-btn');
  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '13_homepage_theme_switched.png'),
    });
    logStep('Theme Switched', 'Captured 13_homepage_theme_switched.png');
  }

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    totalJourneys: 7,
    consoleLogsCount: consoleLogs.length,
    consoleLogs,
    journeyLog,
    screenshotsCaptured: fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')),
  };

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'agentic_browsing_report.json'),
    JSON.stringify(report, null, 2)
  );

  await browser.close();
  console.log('✅ Agentic Chrome browsing session successfully completed!');
  console.log(
    `📁 Captured ${report.screenshotsCaptured.length} visual state screenshots in ${SCREENSHOT_DIR}`
  );
}

runAgenticChromeSession().catch(err => {
  console.error('❌ Agentic browsing session error:', err);
  process.exit(1);
});
