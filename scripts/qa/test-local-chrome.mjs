import { chromium } from 'playwright';

const LOCAL_URL = 'http://127.0.0.1:4000/';

async function testLocalChrome() {
  console.log('🚀 Launching Desktop Chrome to test local dev server...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(`[PageError] ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('402')) {
      errors.push(`[ConsoleError] ${msg.text()}`);
    }
  });

  console.log(`🌐 Navigating to ${LOCAL_URL}...`);
  const response = await page.goto(LOCAL_URL, { waitUntil: 'networkidle', timeout: 20000 });
  console.log(`📊 HTTP Status: ${response.status()}`);

  // 1. Verify Homepage & Music Card
  const musicCard = await page.$('#music-card');
  if (musicCard) {
    const isVisible = await musicCard.isVisible();
    const trackName = await page
      .$eval('#music-track-name', el => el.textContent.trim())
      .catch(() => 'N/A');
    const artistName = await page
      .$eval('#music-artist-name', el => el.textContent.trim())
      .catch(() => 'N/A');
    const spotifyHref = await page.$eval('#music-spotify-link', el => el.href).catch(() => 'N/A');
    console.log(`🎵 Local Hero Music Card:`);
    console.log(`  - Visible: ${isVisible}`);
    console.log(`  - Track: "${trackName}" by "${artistName}"`);
    console.log(`  - Spotify Link: ${spotifyHref}`);
  }

  // 2. Test Local Chatbot AI & WebMCP Action
  console.log('\n🤖 Testing Local Chatbot...');
  const chatToggle = await page.$('#chatbot-toggle');
  if (chatToggle) {
    await chatToggle.click();
    await page.waitForTimeout(1000);

    const chatInput = await page.$('#chatbot-input');
    if (chatInput) {
      await chatInput.fill('What music is Mangesh listening to right now?');
      await page.keyboard.press('Enter');
      console.log('  - Submitted query: "What music is Mangesh listening to right now?"');

      await page.waitForTimeout(4000);
      const messages = await page.$$eval(
        '#chatbot-messages .message.bot, #chatbot-messages .chatbot-message.bot, #chatbot-messages .message',
        els => els.map(el => el.textContent.trim())
      );
      const lastReply = messages.at(-1) || 'No reply captured';
      console.log(`  - Chatbot Response:\n${lastReply}`);
    }
  }

  // 3. Test Local Subpages: Uses, Monitor, Travel, Systems, Changelog
  const pagesToTest = [
    'uses.html',
    'monitor.html',
    'travel.html',
    'systems.html',
    'changelog.html',
  ];
  console.log('\n📄 Testing Local Subpages in Chrome:');
  for (const sub of pagesToTest) {
    const subUrl = `${LOCAL_URL}${sub}`;
    const res = await page.goto(subUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const pageTitle = await page.title();
    console.log(`  - /${sub} → Status: ${res.status()} | Title: "${pageTitle}"`);
  }

  console.log('\n🛑 Console / Page Errors:', errors.length ? errors : 'None! (0 errors)');

  await browser.close();
  console.log('\n✨ Local Chrome Testing Complete!');
}

testLocalChrome().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
