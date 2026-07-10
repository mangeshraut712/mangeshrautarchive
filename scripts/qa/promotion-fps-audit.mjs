/**
 * ProMotion FPS proxy audit via requestAnimationFrame delta sampling.
 * Run: node scripts/qa/promotion-fps-audit.mjs [url]
 */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] || 'http://127.0.0.1:4000';
const SAMPLE_MS = Number(process.env.PROMOTION_SAMPLE_MS || 4000);
const TARGET_FPS = Number(process.env.PROMOTION_TARGET_FPS || 55);
const VIEWPORT = { width: 440, height: 956 };

async function audit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(800);

  const metrics = await page.evaluate(async sampleMs => {
    const samples = [];
    const start = performance.now();
    let last = start;
    let frameId = 0;

    const sample = () => {
      const now = performance.now();
      const delta = now - last;
      last = now;

      if (delta > 0 && delta < 200) {
        samples.push(1000 / delta);
      }

      if (now - start < sampleMs) {
        frameId = requestAnimationFrame(sample);
      }
    };

    frameId = requestAnimationFrame(sample);

    const scrollTimer = window.setInterval(() => {
      const max = Math.max(0, document.body.scrollHeight - window.innerHeight);
      const next = Math.min(max, window.scrollY + window.innerHeight * 0.2);
      window.scrollTo({ top: next, behavior: 'instant' });
      if (next >= max) {
        window.clearInterval(scrollTimer);
      }
    }, 350);

    await new Promise(resolve => {
      const wait = () => {
        if (performance.now() - start >= sampleMs) {
          cancelAnimationFrame(frameId);
          window.clearInterval(scrollTimer);
          resolve();
          return;
        }
        requestAnimationFrame(wait);
      };
      requestAnimationFrame(wait);
    });

    const sorted = [...samples].sort((a, b) => a - b);
    const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
    const p10 = sorted[Math.floor(sorted.length * 0.1)] || 0;
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
    const jankFrames = samples.filter(fps => fps < 50).length;

    return {
      sampleCount: samples.length,
      avgFps: Number(avg.toFixed(1)),
      p10Fps: Number(p10.toFixed(1)),
      p50Fps: Number(p50.toFixed(1)),
      p90Fps: Number(p90.toFixed(1)),
      jankFrames,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      dpr: window.devicePixelRatio,
      innerW: window.innerWidth,
      innerH: window.innerHeight,
    };
  }, SAMPLE_MS);

  await browser.close();

  const failures = [];
  if (metrics.sampleCount < 30) failures.push(`insufficient samples (${metrics.sampleCount})`);
  if (metrics.p50Fps < TARGET_FPS) failures.push(`p50 FPS ${metrics.p50Fps} < ${TARGET_FPS}`);
  if (metrics.jankFrames > Math.max(8, Math.floor(metrics.sampleCount * 0.15))) {
    failures.push(`jank frames ${metrics.jankFrames}`);
  }

  const report = {
    base: BASE,
    device: 'iPhone 17 Pro Max (ProMotion proxy)',
    sampleMs: SAMPLE_MS,
    targetFps: TARGET_FPS,
    metrics,
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
