import http from 'node:http';
import { resolve, extname } from 'node:path';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4365;
const distDir = resolve(process.cwd(), 'dist');
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  let filePath = resolve(distDir, urlPath.slice(1));
  if (!existsSync(filePath)) {
    filePath = resolve(distDir, 'index.html');
  }
  const ext = extname(filePath);
  const mime = mimeTypes[ext] || 'application/octet-stream';
  try {
    const data = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch (_err) {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  const artifactsDir = resolve(process.cwd(), '.tempmediaStorage');
  if (!existsSync(artifactsDir)) mkdirSync(artifactsDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // Desktop check
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const musicCard = page.locator('#music-card');
    const isVisible = await musicCard.isVisible();
    console.log(`Music card is visible: ${isVisible}`);

    // Verify ordering
    const artBox = await page.locator('#music-card .album-art-container').boundingBox();
    const trackBox = await page.locator('#music-card #track-name').boundingBox();
    const artistBox = await page.locator('#music-card #artist-name').boundingBox();
    const statusBox = await page.locator('#music-card .status-row').boundingBox();
    const spotifyBox = await page.locator('#music-card #music-spotify-link').boundingBox();

    console.log('Bounding boxes:');
    console.log('Art box x:', artBox?.x, 'y:', artBox?.y);
    console.log('Track box x:', trackBox?.x, 'y:', trackBox?.y);
    console.log('Artist box x:', artistBox?.x, 'y:', artistBox?.y);
    console.log('Status box x:', statusBox?.x, 'y:', statusBox?.y);
    console.log('Spotify box x:', spotifyBox?.x, 'y:', spotifyBox?.y);

    if (artBox && trackBox && spotifyBox) {
      if (artBox.x < trackBox.x && trackBox.x < spotifyBox.x) {
        console.log('✅ PASS: Horizontal layout order (Artwork -> Track Info -> Spotify Link)');
      } else {
        console.log('❌ FAIL: Horizontal layout order incorrect');
      }
    }

    if (trackBox && artistBox && statusBox) {
      if (trackBox.y < artistBox.y && artistBox.y < statusBox.y) {
        console.log('✅ PASS: Vertical text order (Song Name -> Artist Name -> Status)');
      } else {
        console.log('❌ FAIL: Vertical text order incorrect');
      }
    }

    // Take Desktop Light screenshot of Music Card
    await musicCard.screenshot({ path: resolve(artifactsDir, 'music_card_desktop_light.png') });
    console.log('Saved music_card_desktop_light.png');

    // Switch to Dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(300);
    await musicCard.screenshot({ path: resolve(artifactsDir, 'music_card_desktop_dark.png') });
    console.log('Saved music_card_desktop_dark.png');

    // Mobile iPhone 14 check
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    await mobilePage.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(1000);

    const mobileMusicCard = mobilePage.locator('#music-card');
    await mobileMusicCard.screenshot({ path: resolve(artifactsDir, 'music_card_mobile.png') });
    console.log('Saved music_card_mobile.png');

    // Check overflow
    const overflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`Mobile page has overflow: ${overflow}`);
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
