import { chromium } from 'playwright';

const LIVE_URL = 'https://mangeshraut712.github.io/mangeshrautarchive/';

async function testLiveSite() {
  console.log('🚀 Launching Chromium browser to test live GitHub Pages...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(`[PageError] ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('402')) {
      errors.push(`[ConsoleError] ${msg.text()}`);
    }
  });

  console.log(`🌐 Navigating to ${LIVE_URL}...`);
  const response = await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  console.log(`📊 HTTP Status: ${response.status()}`);

  // 1. Verify Title and Hero
  const title = await page.title();
  console.log(`🏷️ Page Title: ${title}`);

  // 2. Verify Hero Music Card
  const musicCard = await page.$('#music-card');
  if (musicCard) {
    const isVisible = await musicCard.isVisible();
    const trackName = await page
      .$eval('#music-track-name', el => el.textContent.trim())
      .catch(() => 'N/A');
    const artistName = await page
      .$eval('#music-artist-name', el => el.textContent.trim())
      .catch(() => 'N/A');
    const statusText = await page
      .$eval('#music-status-text', el => el.textContent.trim())
      .catch(() => 'N/A');
    const spotifyHref = await page.$eval('#music-spotify-link', el => el.href).catch(() => 'N/A');
    const borderRadius = await musicCard.evaluate(el => window.getComputedStyle(el).borderRadius);

    console.log(`\n🎵 Music Card Audit:`);
    console.log(`  - Visible: ${isVisible}`);
    console.log(`  - Status: "${statusText}"`);
    console.log(`  - Track: "${trackName}"`);
    console.log(`  - Artist: "${artistName}"`);
    console.log(`  - Spotify Link: ${spotifyHref}`);
    console.log(`  - Border Radius: ${borderRadius}`);
  } else {
    console.log('⚠️ #music-card not found on homepage');
  }

  // 3. Test Chatbot AI & WebMCP Action
  console.log('\n🤖 Testing Chatbot with Music Query...');
  const chatToggle = await page.$('#chatbot-toggle');
  if (chatToggle) {
    await chatToggle.click();
    await page.waitForTimeout(1500);

    const chatInput = await page.$('#chatbot-input');
    if (chatInput) {
      await chatInput.fill('What music is Mangesh listening to right now?');
      await page.keyboard.press('Enter');
      console.log('  - Submitted query: "What music is Mangesh listening to right now?"');

      // Wait for response to appear in chat
      await page.waitForTimeout(5000);
      const messages = await page.$$eval(
        '#chatbot-messages .message.bot, #chatbot-messages .chatbot-message.bot, #chatbot-messages .message',
        els => els.map(el => el.textContent.trim())
      );
      const lastReply = messages.at(-1) || 'No reply captured';
      console.log(`  - Chatbot Response:\n${lastReply}`);
    }
  }

  // 4. Test Core Pages
  const pagesToTest = ['travel', 'monitor', 'systems', 'uses'];
  console.log('\n📄 Testing Core Subpages:');
  for (const sub of pagesToTest) {
    const subUrl = `${LIVE_URL}${sub}.html`;
    const res = await page
      .goto(subUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
      .catch(e => ({ status: () => e.message }));
    console.log(
      `  - /${sub}.html → Status: ${typeof res.status === 'function' ? res.status() : res.status}`
    );
  }

  console.log('\n🛑 Console / Page Errors:', errors.length ? errors : 'None! (0 errors)');

  await browser.close();
  console.log('\n✨ Live Browser Test Complete!');
}

testLiveSite().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
