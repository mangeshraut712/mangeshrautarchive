import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4360;
const DIST = path.resolve(process.cwd(), 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function createStaticServer() {
  return http.createServer((req, res) => {
    const parsed = new URL(req.url, `http://127.0.0.1:${PORT}`);
    let p = parsed.pathname;
    if (p === '/' || p === '') p = '/index.html';
    const file = path.join(DIST, p);

    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

async function testProjectShowcaseFeatures() {
  console.log('🚀 Starting Project Showcase Playwright QA Audit...');
  const server = createStaticServer();
  await new Promise(resolve => server.listen(PORT, resolve));

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();

  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Scroll to #projects to trigger on-demand hydration
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  // 1. Check Project Cards rendered
  const initialCards = await page
    .locator('#github-projects-container .showcase-project-card')
    .count();
  console.log(`✅ Initial Project Cards Count: ${initialCards}`);
  if (initialCards === 0) {
    throw new Error('Expected project cards to be rendered.');
  }

  // 2. Check Tech Filter Buttons exist
  const techChips = page.locator('.project-tech-chip');
  const techChipCount = await techChips.count();
  console.log(`✅ Tech Filter Chips Count: ${techChipCount}`);
  if (techChipCount < 5) {
    throw new Error('Expected at least 5 tech filter chips.');
  }

  // 3. Test Tech Filter: TypeScript
  const tsChip = page.locator('[data-project-tech="typescript"]');
  await tsChip.click();
  await page.waitForTimeout(400);
  const tsCards = await page.locator('#github-projects-container .showcase-project-card').count();
  console.log(`✅ Filter [TypeScript] Cards: ${tsCards}`);
  if (tsCards === 0) {
    throw new Error('Expected TypeScript projects to be shown.');
  }

  // 4. Test Tech Filter: Python
  const pyChip = page.locator('[data-project-tech="python"]');
  await pyChip.click();
  await page.waitForTimeout(400);
  const pyCards = await page.locator('#github-projects-container .showcase-project-card').count();
  console.log(`✅ Filter [Python] Cards: ${pyCards}`);
  if (pyCards === 0) {
    throw new Error('Expected Python projects to be shown.');
  }

  // 5. Test Tech Filter: All Tech
  const allTechChip = page.locator('[data-project-tech="all"]');
  await allTechChip.click();
  await page.waitForTimeout(400);
  const resetCards = await page
    .locator('#github-projects-container .showcase-project-card')
    .count();
  console.log(`✅ Filter [All Tech] Cards: ${resetCards}`);

  // 6. Test Clone Button Copy Action
  const firstCloneBtn = page.locator('.project-clone-btn').first();
  if (await firstCloneBtn.isVisible()) {
    await firstCloneBtn.click();
    await page.waitForTimeout(300);
    const labelText = await firstCloneBtn.locator('.clone-label').textContent();
    console.log(`✅ Clone Button Click Feedback: "${labelText}"`);
    if (!labelText.includes('Copied')) {
      throw new Error('Expected clone button to display "Copied! ✓" feedback.');
    }
  }

  // 7. Test Search Input with `/` Keyboard Shortcut
  await page.keyboard.press('/');
  await page.waitForTimeout(200);
  const searchFocused = await page.evaluate(() => {
    return document.activeElement?.id === 'project-search-input';
  });
  console.log(`✅ Search Keyboard Shortcut (/) Focused Input: ${searchFocused}`);
  if (!searchFocused) {
    throw new Error('Expected "/" shortcut to focus search input.');
  }

  // 8. Test Search Filter
  await page.locator('#project-search-input').fill('Gravity');
  await page.waitForTimeout(400);
  const searchCards = await page
    .locator('#github-projects-container .showcase-project-card')
    .count();
  console.log(`✅ Search "Gravity" Cards Count: ${searchCards}`);
  if (searchCards === 0) {
    throw new Error('Expected at least 1 project for "Gravity".');
  }

  // Clear search
  await page.locator('#project-search-input').fill('');
  await page.waitForTimeout(400);

  // 9. Test Expand / Collapse Button
  const expandBtn = page.locator('#projects-expand-btn');
  if (await expandBtn.isVisible()) {
    const expandTextBefore = await expandBtn.textContent();
    console.log(`✅ Expand Button Text (Before): "${expandTextBefore}"`);
    await expandBtn.click();
    await page.waitForTimeout(400);
    const expandedCards = await page
      .locator('#github-projects-container .showcase-project-card')
      .count();
    console.log(`✅ Expanded Project Cards Count: ${expandedCards}`);
    if (expandedCards <= initialCards) {
      throw new Error('Expected expanded view to show more project cards.');
    }
  }

  // 10. Check Pulse Dots and Badges
  const pulseDots = await page.locator('.project-pulse-dot').count();
  console.log(`✅ Active Pulse Dots Count: ${pulseDots}`);
  const licenseBadges = await page.locator('.project-license-badge').count();
  console.log(`✅ License Badges Count: ${licenseBadges}`);
  const sizeBadges = await page.locator('.project-size-badge').count();
  console.log(`✅ Size Badges Count: ${sizeBadges}`);

  console.log('\n🎉 ALL PROJECT SHOWCASE TESTS PASSED SUCCESSFULLY!');
  await browser.close();
  server.close();
}

testProjectShowcaseFeatures().catch(err => {
  console.error('❌ QA Test failed:', err);
  process.exit(1);
});
