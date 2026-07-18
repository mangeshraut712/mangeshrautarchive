/**
 * Playwright audit v2: Verifies all 6 visual fidelity fixes for the
 * GitHub contribution graph.
 */
import { chromium } from 'playwright';
import { join } from 'path';

const BASE_URL = 'http://127.0.0.1:4000';
const SCREENSHOT_DIR =
  '/Users/mangeshraut/.gemini/antigravity/brain/a562c13f-d42b-4eaa-bd31-14ee0ecd6148';

async function auditContributionGraphV2() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('--- Navigating to homepage ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

  const projectsSection = page.locator('#projects');
  await projectsSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);

  const graphContainer = page.locator('#github-graph-container');
  const graphVisible = await graphContainer.isVisible();
  console.log(`Graph container visible: ${graphVisible}`);

  if (!graphVisible) {
    console.log('ERROR: Graph container is NOT visible');
    await browser.close();
    return;
  }

  // --- STRUCTURAL CHECKS ---
  const checks = [];

  // Fix 1: Contribution count in header
  const contribCount = await page.evaluate(() => {
    const el = document.getElementById('graph-contrib-count');
    return el ? { text: el.textContent, visible: getComputedStyle(el).display !== 'none' } : null;
  });
  checks.push({
    check: 'FIX 1: Contribution count in header',
    expected: 'Non-empty number',
    actual: contribCount
      ? `"${contribCount.text}", visible: ${contribCount.visible}`
      : 'Element missing',
    pass: contribCount && contribCount.text.length > 0 && /\d/.test(contribCount.text),
  });

  // Fix 2: Title text is lowercase GitHub style
  const titleText = await page.evaluate(() => {
    const el = document.querySelector('#github-graph-container .graph-title');
    return el ? el.textContent : '';
  });
  checks.push({
    check: 'FIX 1b: Title is "contributions in the last year"',
    expected: '"contributions in the last year"',
    actual: `"${titleText}"`,
    pass: titleText === 'contributions in the last year',
  });

  // Fix 3: Border-radius on scroll container is 6px
  const borderRadius = await page.evaluate(() => {
    const scroll = document.querySelector('#github-graph-container .github-graph-scroll');
    return scroll ? getComputedStyle(scroll).borderRadius : 'N/A';
  });
  checks.push({
    check: 'FIX 5: Scroll container border-radius ≤ 6px',
    expected: '6px',
    actual: borderRadius,
    pass: borderRadius === '6px',
  });

  // Fix 4: Refresh button is subtle (not a large blue circle)
  const refreshBtn = await page.evaluate(() => {
    const btn = document.getElementById('refresh-graph-btn');
    if (!btn) return null;
    const cs = getComputedStyle(btn);
    return {
      width: cs.width,
      height: cs.height,
      background: cs.backgroundColor,
      borderRadius: cs.borderRadius,
      fontSize: cs.fontSize,
    };
  });
  checks.push({
    check: 'FIX 4: Refresh button is subtle (small, transparent)',
    expected: 'Transparent background, compact size',
    actual: refreshBtn
      ? `bg: ${refreshBtn.background}, size: ${refreshBtn.width}×${refreshBtn.height}, radius: ${refreshBtn.borderRadius}`
      : 'Button missing',
    pass:
      refreshBtn &&
      (refreshBtn.background === 'rgba(0, 0, 0, 0)' || refreshBtn.background === 'transparent'),
  });

  // Fix 5: Tooltip container exists
  const tooltipEl = await page.evaluate(() => {
    const el = document.getElementById('contrib-tooltip');
    return el ? { present: true, className: el.className } : null;
  });
  checks.push({
    check: 'FIX 6: Rich tooltip container exists',
    expected: 'contrib-tooltip element present',
    actual: tooltipEl ? `Present, class: "${tooltipEl.className}"` : 'Missing',
    pass: tooltipEl && tooltipEl.present,
  });

  // Fix 6: Cells use data-tooltip instead of <title>
  const cellDataCheck = await page.evaluate(() => {
    const svg = document.getElementById('github-fallback-svg');
    if (!svg) return { dataTooltips: 0, titleElements: 0 };
    const cells = svg.querySelectorAll('.contrib-cell');
    let dataTooltips = 0;
    let titleElements = 0;
    cells.forEach(c => {
      if (c.getAttribute('data-tooltip')) dataTooltips++;
      if (c.querySelector('title')) titleElements++;
    });
    return { dataTooltips, titleElements };
  });
  checks.push({
    check: 'FIX 6b: Cells use data-tooltip (no <title> elements)',
    expected: '300+ data-tooltip, 0 <title>',
    actual: `${cellDataCheck.dataTooltips} data-tooltip, ${cellDataCheck.titleElements} <title>`,
    pass: cellDataCheck.dataTooltips >= 300 && cellDataCheck.titleElements === 0,
  });

  // Fix 7: Tooltip hover works
  const firstCell = page.locator('#github-fallback-svg .contrib-cell[data-tooltip]').first();
  await firstCell.hover();
  await page.waitForTimeout(200);
  const tooltipVisible = await page.evaluate(() => {
    const tip = document.getElementById('contrib-tooltip');
    return tip && tip.classList.contains('visible') && tip.textContent.length > 0;
  });
  const tooltipContent = await page.evaluate(() => {
    const tip = document.getElementById('contrib-tooltip');
    return tip ? tip.textContent : '';
  });
  checks.push({
    check: 'FIX 6c: Tooltip popover appears on hover',
    expected: 'Visible with content',
    actual: tooltipVisible ? `Visible: "${tooltipContent.substring(0, 60)}"` : 'Not visible',
    pass: tooltipVisible,
  });

  // --- TAKE SCREENSHOTS ---
  // Light mode
  await projectsSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await graphContainer.screenshot({
    path: join(SCREENSHOT_DIR, 'contribution_graph_v2_light.png'),
  });
  console.log('Screenshot: contribution_graph_v2_light.png');

  // Dark mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    document.dispatchEvent(new CustomEvent('portfolio-theme-change'));
  });
  await page.waitForTimeout(1500);
  await graphContainer.screenshot({
    path: join(SCREENSHOT_DIR, 'contribution_graph_v2_dark.png'),
  });
  console.log('Screenshot: contribution_graph_v2_dark.png');

  // Full section light (switch back)
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.dispatchEvent(new CustomEvent('portfolio-theme-change'));
  });
  await page.waitForTimeout(1500);
  await projectsSection.screenshot({
    path: join(SCREENSHOT_DIR, 'projects_showcase_v2_light.png'),
  });
  console.log('Screenshot: projects_showcase_v2_light.png');

  // --- RESULTS ---
  console.log('\n--- Audit Results ---');
  let allPass = true;
  for (const c of checks) {
    const icon = c.pass ? '✅' : '❌';
    console.log(`${icon} ${c.check}`);
    console.log(`   Expected: ${c.expected}`);
    console.log(`   Actual:   ${c.actual}`);
    if (!c.pass) allPass = false;
  }

  console.log(`\n${allPass ? '✅ ALL FIDELITY FIXES VERIFIED' : '❌ SOME FIXES FAILED'}`);

  await browser.close();
}

auditContributionGraphV2().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
