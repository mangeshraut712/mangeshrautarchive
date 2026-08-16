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

  const artifactDir =
    '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/scratch/desktop_sections';
  fs.mkdirSync(artifactDir, { recursive: true });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const sections = await page.evaluate(() => {
    const secs = Array.from(document.querySelectorAll('main > section[id]'));
    return secs.map(s => {
      const rect = s.getBoundingClientRect();
      const container = s.querySelector('.container');
      const cRect = container ? container.getBoundingClientRect() : null;
      return {
        id: s.id,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        container: cRect ? { left: cRect.left, width: cRect.width, right: cRect.right } : null,
      };
    });
  });

  for (const s of sections) {
    const loc = page.locator(`section#${s.id}`);
    if (await loc.isVisible()) {
      await loc.screenshot({ path: path.join(artifactDir, `section_${s.id}.png`) });
    }
  }

  fs.writeFileSync(
    path.join(artifactDir, 'desktop_section_layout.json'),
    JSON.stringify(sections, null, 2)
  );

  await browser.close();
  server.close();
  console.log('Desktop section audit complete!');
  process.exit(0);
});
