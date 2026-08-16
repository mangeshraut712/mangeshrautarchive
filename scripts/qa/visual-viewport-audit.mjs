import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import serveStatic from 'serve-static';

const serve = serveStatic('src');
const server = http.createServer((req, res) => {
  serve(req, res, () => {
    res.statusCode = 404;
    res.end('Not found');
  });
});

server.listen(0, async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });
  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'desktop_1920', width: 1920, height: 1080 },
    { name: 'mobile_iphone14', width: 390, height: 844, isMobile: true },
  ];

  const pages = [
    { url: `http://localhost:${port}/index.html`, name: 'homepage' },
    { url: `http://localhost:${port}/systems.html`, name: 'systems' },
    { url: `http://localhost:${port}/uses.html`, name: 'uses' },
    { url: `http://localhost:${port}/monitor.html`, name: 'monitor' },
    { url: `http://localhost:${port}/travel.html`, name: 'travel' },
    { url: `http://localhost:${port}/changelog.html`, name: 'changelog' },
  ];

  const artifactDir =
    '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/scratch/viewport_audit';
  fs.mkdirSync(artifactDir, { recursive: true });

  const results = [];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile || false,
    });
    const page = await context.newPage();
    for (const p of pages) {
      await page.goto(p.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const filePath = path.join(artifactDir, `${p.name}_${vp.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });

      // Measure layout metrics
      const layout = await page.evaluate(() => {
        const main = document.querySelector('main') || document.getElementById('main-content');
        const nav = document.getElementById('global-nav');

        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalOverflow:
            document.documentElement.scrollWidth > document.documentElement.clientWidth,
          mainWidth: main ? main.getBoundingClientRect().width : null,
          mainLeft: main ? main.getBoundingClientRect().left : null,
          navWidth: nav ? nav.getBoundingClientRect().width : null,
          navLeft: nav ? nav.getBoundingClientRect().left : null,
          windowInnerWidth: window.innerWidth,
        };
      });

      results.push({ page: p.name, viewport: vp.name, layout, file: filePath });
    }
    await context.close();
  }

  await browser.close();
  server.close();
  fs.writeFileSync(path.join(artifactDir, 'audit_metrics.json'), JSON.stringify(results, null, 2));
  console.log('Visual audit complete. Results saved in ' + artifactDir);
  process.exit(0);
});
