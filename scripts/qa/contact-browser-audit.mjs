import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const ARTIFACT_DIR =
  '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/contact_audit';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, res => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve();
          } else {
            retry();
          }
        })
        .on('error', () => {
          retry();
        });
    };
    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error(`Timed out waiting for server at ${url}`));
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  });
}

async function runAudit() {
  console.log('🚀 Starting local dev server on port 4000...');
  const serverProcess = spawn('node', ['scripts/utils/local-server.js'], {
    env: { ...process.env, PORT: '4000', HOST: '127.0.0.1' },
    stdio: 'ignore',
  });

  try {
    await waitForServer('http://127.0.0.1:4000/contact.html');
    console.log('✅ Server ready at http://127.0.0.1:4000');

    const browser = await chromium.launch({ headless: true });
    const report = {
      testedAt: new Date().toISOString(),
      viewports: [],
    };

    const configs = [
      {
        name: '01_contact_subpage_desktop_light',
        url: 'http://127.0.0.1:4000/contact.html',
        width: 1440,
        height: 900,
        theme: 'light',
        isMobile: false,
      },
      {
        name: '02_contact_subpage_desktop_dark',
        url: 'http://127.0.0.1:4000/contact.html',
        width: 1440,
        height: 900,
        theme: 'dark',
        isMobile: false,
      },
      {
        name: '03_contact_subpage_mobile_light',
        url: 'http://127.0.0.1:4000/contact.html',
        width: 390,
        height: 844,
        theme: 'light',
        isMobile: true,
      },
      {
        name: '04_contact_subpage_mobile_dark',
        url: 'http://127.0.0.1:4000/contact.html',
        width: 390,
        height: 844,
        theme: 'dark',
        isMobile: true,
      },
      {
        name: '05_homepage_contact_desktop_light',
        url: 'http://127.0.0.1:4000/#contact',
        width: 1440,
        height: 900,
        theme: 'light',
        isMobile: false,
      },
      {
        name: '06_homepage_contact_desktop_dark',
        url: 'http://127.0.0.1:4000/#contact',
        width: 1440,
        height: 900,
        theme: 'dark',
        isMobile: false,
      },
      {
        name: '07_homepage_contact_mobile_light',
        url: 'http://127.0.0.1:4000/#contact',
        width: 390,
        height: 844,
        theme: 'light',
        isMobile: true,
      },
      {
        name: '08_homepage_contact_mobile_dark',
        url: 'http://127.0.0.1:4000/#contact',
        width: 390,
        height: 844,
        theme: 'dark',
        isMobile: true,
      },
    ];

    for (const cfg of configs) {
      console.log(`📸 Capturing viewport: ${cfg.name}...`);
      const context = await browser.newContext({
        viewport: { width: cfg.width, height: cfg.height },
        isMobile: cfg.isMobile,
        hasTouch: cfg.isMobile,
        colorScheme: cfg.theme,
      });

      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.addInitScript(theme => {
        localStorage.setItem('themeMode', theme);
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }, cfg.theme);

      await page.goto(cfg.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      if (cfg.url.includes('#contact')) {
        const contactSec = page.locator('#contact');
        if (await contactSec.count()) {
          await contactSec.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
        }
      }

      // Check overflow
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return {
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          hasOverflow: el.scrollWidth > el.clientWidth + 1,
        };
      });

      // Capture screenshot
      const screenshotPath = path.join(ARTIFACT_DIR, `${cfg.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // If first subpage test, also test blessing modals
      if (cfg.name === '01_contact_subpage_desktop_light') {
        const ganeshBtn = page.locator('.blessing-avatar-trigger[data-blessing="ganesh"]').first();
        if (await ganeshBtn.count()) {
          await ganeshBtn.click();
          await page.waitForTimeout(600);
          await page.screenshot({
            path: path.join(ARTIFACT_DIR, '09_blessing_ganesh_modal_opened.png'),
          });
          const closeBtn = page.locator('.blessing-modal-close').first();
          if (await closeBtn.count()) await closeBtn.click();
          await page.waitForTimeout(300);
        }

        const hanumanBtn = page
          .locator('.blessing-avatar-trigger[data-blessing="hanuman"]')
          .first();
        if (await hanumanBtn.count()) {
          await hanumanBtn.click();
          await page.waitForTimeout(600);
          await page.screenshot({
            path: path.join(ARTIFACT_DIR, '10_blessing_hanuman_modal_opened.png'),
          });
          const closeBtn = page.locator('.blessing-modal-close').first();
          if (await closeBtn.count()) await closeBtn.click();
          await page.waitForTimeout(300);
        }
      }

      report.viewports.push({
        config: cfg.name,
        overflow,
        consoleErrors,
        screenshot: `${cfg.name}.png`,
      });

      await context.close();
    }

    await browser.close();
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'audit_report.json'), JSON.stringify(report, null, 2));
    console.log('✅ Contact audit completed successfully.');
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
