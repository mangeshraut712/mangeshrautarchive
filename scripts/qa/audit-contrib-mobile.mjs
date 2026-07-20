/**
 * Contribution Graph Viewport & Tooltip Verification Script.
 * Verifies 2D, 3D, and Both view modes on mobile (390px) and desktop (1440px)
 * and verifies floating tooltip positioning and Activity Overview rendering.
 */
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4000';

async function testContributionGraph() {
  console.log('🧪 Testing GitHub Contribution Graph (2D/3D/Both, Mobile & Tooltips)...\n');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'Mobile (390px)', width: 390, height: 844 },
    { name: 'Desktop (1440px)', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    console.log(`Checking ${vp.name}...`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    try {
      await page.goto(`${BASE}/#projects`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);

      // Scroll to #projects
      await page.evaluate(() => {
        const el = document.getElementById('projects');
        if (el) el.scrollIntoView();
      });
      await page.waitForTimeout(1000);

      // Verify View mode toggles
      const viewModes = ['2d', '3d', 'both'];
      for (const vm of viewModes) {
        await page.evaluate(mode => {
          const btn = document.querySelector(`.gh-contrib__view-btn[data-view="${mode}"]`);
          if (btn) btn.click();
        }, vm);
        await page.waitForTimeout(500);

        const activeView = await page.evaluate(() => {
          return document.getElementById('gh-contrib')?.getAttribute('data-view');
        });
        console.log(`  - View Mode "${vm}": ${activeView === vm ? '✅ Active' : '❌ Failed'}`);
      }

      // Test 2D cell hover tooltip
      await page.evaluate(() => {
        const btn2d = document.querySelector('.gh-contrib__view-btn[data-view="2d"]');
        if (btn2d) btn2d.click();
      });
      await page.waitForTimeout(800);

      const cellHoverResult = await page.evaluate(() => {
        const cell = document.querySelector('.gh-hm__cell:not(.gh-hm__cell--empty)');
        if (!cell) return { found: false };
        cell.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        cell.dispatchEvent(new Event('touchstart', { bubbles: true }));
        const tooltip = document.getElementById('gh-contrib-tooltip');
        return {
          found: true,
          visible: tooltip?.classList.contains('is-visible'),
          text: tooltip?.textContent,
        };
      });

      console.log(
        `  - Floating Tooltip: ${cellHoverResult.visible ? `✅ Active ("${cellHoverResult.text}")` : '❌ Inactive'}`
      );

      // Verify Activity Overview section is removed
      const activityOverviewResult = await page.evaluate(() => {
        const overview = document.getElementById('gh-activity');
        return {
          removed: !overview,
        };
      });

      console.log(
        `  - Activity Overview: ${activityOverviewResult.removed ? '✅ Cleanly Removed' : '❌ Still Present'}`
      );
    } catch (err) {
      console.error(`  Error on ${vp.name}:`, err.message);
    }

    await context.close();
  }

  await browser.close();
  console.log('\nContribution Graph Test Completed!');
}

testContributionGraph().catch(err => {
  console.error(err);
  process.exit(1);
});
