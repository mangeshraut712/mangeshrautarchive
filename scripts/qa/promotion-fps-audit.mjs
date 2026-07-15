/**
 * ProMotion FPS proxy audit via requestAnimationFrame delta sampling.
 * Run: node scripts/qa/promotion-fps-audit.mjs [url]
 *
 * Gates on *idle* frame timing only. Scroll is stress-sampled for reporting
 * (instant scroll jumps always create short low-FPS bursts and must not fail CI).
 */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] || 'http://127.0.0.1:4000';
const IDLE_SAMPLE_MS = Number(process.env.PROMOTION_IDLE_MS || 2500);
const SCROLL_SAMPLE_MS = Number(process.env.PROMOTION_SCROLL_MS || 2000);
const TARGET_FPS = Number(process.env.PROMOTION_TARGET_FPS || 55);
const VIEWPORT = { width: 440, height: 956 };

async function sampleFps(page, sampleMs, { scroll = false } = {}) {
  return page.evaluate(
    async ({ sampleMs: ms, scroll: doScroll }) => {
      const samples = [];
      const start = performance.now();
      let last = start;
      let frameId = 0;
      let scrollTimer = 0;

      const sample = () => {
        const now = performance.now();
        const delta = now - last;
        last = now;
        if (delta > 0 && delta < 200) {
          samples.push(1000 / delta);
        }
        if (now - start < ms) {
          frameId = requestAnimationFrame(sample);
        }
      };

      frameId = requestAnimationFrame(sample);

      if (doScroll) {
        scrollTimer = window.setInterval(() => {
          const max = Math.max(0, document.body.scrollHeight - window.innerHeight);
          const next = Math.min(max, window.scrollY + window.innerHeight * 0.15);
          window.scrollTo({ top: next, behavior: 'instant' });
          if (next >= max) {
            window.scrollTo({ top: 0, behavior: 'instant' });
          }
        }, 400);
      }

      await new Promise(resolve => {
        const wait = () => {
          if (performance.now() - start >= ms) {
            cancelAnimationFrame(frameId);
            if (scrollTimer) window.clearInterval(scrollTimer);
            resolve();
            return;
          }
          requestAnimationFrame(wait);
        };
        requestAnimationFrame(wait);
      });

      const sorted = [...samples].sort((a, b) => a - b);
      const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
      const at = q => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] || 0;
      const jankFrames = samples.filter(fps => fps < 50).length;

      return {
        sampleCount: samples.length,
        avgFps: Number(avg.toFixed(1)),
        p10Fps: Number(at(0.1).toFixed(1)),
        p50Fps: Number(at(0.5).toFixed(1)),
        p90Fps: Number(at(0.9).toFixed(1)),
        jankFrames,
      };
    },
    { sampleMs, scroll }
  );
}

async function audit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    // Prefer reduced motion so decorative effects do not dominate the FPS gate.
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  // Let first paint / deferred modules settle before measuring idle FPS.
  await page.waitForTimeout(1500);

  const idle = await sampleFps(page, IDLE_SAMPLE_MS, { scroll: false });
  const scroll = await sampleFps(page, SCROLL_SAMPLE_MS, { scroll: true });

  const env = await page.evaluate(() => ({
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    dpr: window.devicePixelRatio,
    innerW: window.innerWidth,
    innerH: window.innerHeight,
  }));

  await browser.close();

  const failures = [];
  if (idle.sampleCount < 30) failures.push(`insufficient idle samples (${idle.sampleCount})`);
  if (idle.p50Fps < TARGET_FPS) failures.push(`idle p50 FPS ${idle.p50Fps} < ${TARGET_FPS}`);
  // Idle jank budget: ≤20% of frames under 50fps (CI headless is noisier than a phone).
  const maxIdleJank = Math.max(12, Math.floor(idle.sampleCount * 0.2));
  if (idle.jankFrames > maxIdleJank) {
    failures.push(`idle jank frames ${idle.jankFrames} > ${maxIdleJank}`);
  }

  const report = {
    base: BASE,
    device: 'iPhone 17 Pro Max (ProMotion proxy)',
    idleSampleMs: IDLE_SAMPLE_MS,
    scrollSampleMs: SCROLL_SAMPLE_MS,
    targetFps: TARGET_FPS,
    env,
    idle,
    scroll,
    // Back-compat fields for older log parsers
    metrics: { ...idle, ...env },
    failures,
    passed: failures.length === 0,
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(failures.length ? 1 : 0);
}

audit().catch(error => {
  console.error(error);
  process.exit(1);
});
