/**
 * Comprehensive viewport audit for mangeshrautarchive.
 * Tests all pages at mobile (375×812) and desktop (1440×900).
 */
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4000';
const DIR = '/Users/mangeshraut/.gemini/antigravity/brain/a562c13f-d42b-4eaa-bd31-14ee0ecd6148';

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/systems.html', name: 'systems' },
  { path: '/monitor.html', name: 'monitor' },
  { path: '/travel.html', name: 'travel' },
  { path: '/uses.html', name: 'uses' },
];

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900, dpr: 2 },
  { label: 'mobile', width: 375, height: 812, dpr: 3, isMobile: true, hasTouch: true },
];

async function auditPage(browser, page, vp) {
  const issues = [];
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    isMobile: vp.isMobile || false,
    hasTouch: vp.hasTouch || false,
  });
  const p = await ctx.newPage();

  try {
    await p.goto(`${BASE}${page.path}`, { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(2000);

    // Full-page screenshot
    const ssName = `${vp.label}_${page.name}.png`;
    await p.screenshot({ path: `${DIR}/${ssName}`, fullPage: true });

    // Check horizontal overflow
    const overflow = await p.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return {
        scrollWidth: body.scrollWidth,
        clientWidth: html.clientWidth,
        hasOverflow: body.scrollWidth > html.clientWidth + 2,
      };
    });

    if (overflow.hasOverflow) {
      issues.push({
        severity: 'CRITICAL',
        issue: `Horizontal overflow detected: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`,
      });

      // Find the overflowing elements
      const overflowingEls = await p.evaluate(viewportWidth => {
        const results = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.right > viewportWidth + 2 && rect.width > 0) {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const cls =
              el.className && typeof el.className === 'string'
                ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}`
                : '';
            results.push({
              selector: `${tag}${id}${cls}`,
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            });
          }
        }
        // Deduplicate and show top-level overflowing elements
        return results.slice(0, 15);
      }, vp.width);

      if (overflowingEls.length > 0) {
        issues.push({
          severity: 'CRITICAL',
          issue: `Overflowing elements (${overflowingEls.length} found): ${overflowingEls.map(e => `${e.selector}(right:${e.right}px)`).join(', ')}`,
        });
      }
    }

    // Check for small touch targets on mobile
    if (vp.isMobile) {
      const smallTargets = await p.evaluate(() => {
        const interactive = document.querySelectorAll(
          'a, button, input, select, textarea, [role="button"], [tabindex]'
        );
        const small = [];
        for (const el of interactive) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            // Check if it's visible
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')
              continue;
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const cls =
              el.className && typeof el.className === 'string'
                ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
                : '';
            const text = (el.textContent || el.getAttribute('aria-label') || '')
              .trim()
              .substring(0, 30);
            small.push({
              selector: `${tag}${id}${cls}`,
              size: `${Math.round(rect.width)}×${Math.round(rect.height)}`,
              text,
            });
          }
        }
        return small.slice(0, 20);
      });

      if (smallTargets.length > 0) {
        issues.push({
          severity: 'MAJOR',
          issue: `${smallTargets.length} touch targets < 44×44px: ${smallTargets
            .slice(0, 8)
            .map(t => `${t.selector}(${t.size},"${t.text}")`)
            .join('; ')}`,
        });
      }
    }

    // Check for tiny text on mobile
    if (vp.isMobile) {
      const tinyText = await p.evaluate(() => {
        const textEls = document.querySelectorAll(
          'p, span, a, li, td, th, label, h1, h2, h3, h4, h5, h6, div'
        );
        const tiny = [];
        for (const el of textEls) {
          if (!el.textContent.trim()) continue;
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 11 && fontSize > 0) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const cls =
              el.className && typeof el.className === 'string'
                ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
                : '';
            tiny.push({
              selector: `${tag}${id}${cls}`,
              fontSize: `${fontSize}px`,
              text: el.textContent.trim().substring(0, 25),
            });
          }
        }
        return tiny.slice(0, 15);
      });

      if (tinyText.length > 0) {
        issues.push({
          severity: 'MAJOR',
          issue: `${tinyText.length} elements with font-size < 11px: ${tinyText
            .slice(0, 6)
            .map(t => `${t.selector}(${t.fontSize},"${t.text}")`)
            .join('; ')}`,
        });
      }
    }

    // Check navigation visibility
    const navInfo = await p.evaluate(() => {
      const nav = document.querySelector('.global-nav, .dynamic-island, nav');
      if (!nav) return { exists: false };
      const rect = nav.getBoundingClientRect();
      const style = getComputedStyle(nav);
      return {
        exists: true,
        visible: style.display !== 'none' && style.visibility !== 'hidden',
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        position: style.position,
      };
    });

    if (!navInfo.exists || !navInfo.visible) {
      issues.push({
        severity: 'MAJOR',
        issue: `Navigation not found or not visible at ${vp.label} viewport`,
      });
    }

    // Check for z-index stacking issues (elements covering navigation)
    const zIssues = await p.evaluate(() => {
      const results = [];
      const fixedEls = [];
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const style = getComputedStyle(el);
        if (
          (style.position === 'fixed' || style.position === 'sticky') &&
          style.display !== 'none'
        ) {
          const z = parseInt(style.zIndex, 10) || 0;
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const cls =
              el.className && typeof el.className === 'string'
                ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
                : '';
            fixedEls.push({ selector: `${tag}${id}${cls}`, z, top: rect.top, height: rect.height });
          }
        }
      }
      // Check for overlapping fixed elements
      for (let i = 0; i < fixedEls.length; i++) {
        for (let j = i + 1; j < fixedEls.length; j++) {
          const a = fixedEls[i];
          const b = fixedEls[j];
          if (Math.abs(a.top - b.top) < Math.max(a.height, b.height) / 2) {
            results.push(`${a.selector}(z:${a.z}) overlaps ${b.selector}(z:${b.z})`);
          }
        }
      }
      return results.slice(0, 5);
    });

    if (zIssues.length > 0) {
      issues.push({
        severity: 'MAJOR',
        issue: `Z-index stacking issues: ${zIssues.join('; ')}`,
      });
    }

    // Check for content clipped by viewport
    const clippedContent = await p.evaluate(vpWidth => {
      const sections = document.querySelectorAll(
        'section, .section, main, article, .card, .project-card'
      );
      const clipped = [];
      for (const s of sections) {
        const rect = s.getBoundingClientRect();
        if (rect.width > vpWidth + 5 || rect.left < -5) {
          const tag = s.tagName.toLowerCase();
          const id = s.id ? `#${s.id}` : '';
          clipped.push({
            selector: `${tag}${id}`,
            width: Math.round(rect.width),
            left: Math.round(rect.left),
          });
        }
      }
      return clipped.slice(0, 10);
    }, vp.width);

    if (clippedContent.length > 0) {
      issues.push({
        severity: 'MAJOR',
        issue: `Clipped sections: ${clippedContent.map(c => `${c.selector}(w:${c.width},l:${c.left})`).join('; ')}`,
      });
    }
  } catch (err) {
    issues.push({ severity: 'CRITICAL', issue: `Page load failed: ${err.message}` });
  }

  await ctx.close();
  return issues;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const allResults = {};

  for (const page of PAGES) {
    allResults[page.name] = {};
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Auditing ${page.name} @ ${vp.label} (${vp.width}×${vp.height}) ---`);
      const issues = await auditPage(browser, page, vp);
      allResults[page.name][vp.label] = issues;

      if (issues.length === 0) {
        console.log('  ✅ No issues found');
      } else {
        for (const i of issues) {
          const icon = i.severity === 'CRITICAL' ? '🔴' : i.severity === 'MAJOR' ? '🟠' : '🟡';
          console.log(`  ${icon} [${i.severity}] ${i.issue}`);
        }
      }
    }
  }

  // Summary
  console.log('\n\n=== AUDIT SUMMARY ===');
  let totalIssues = 0;
  let criticalCount = 0;
  let majorCount = 0;

  for (const [_pageName, viewports] of Object.entries(allResults)) {
    for (const [_vpLabel, issues] of Object.entries(viewports)) {
      for (const i of issues) {
        totalIssues++;
        if (i.severity === 'CRITICAL') criticalCount++;
        if (i.severity === 'MAJOR') majorCount++;
      }
    }
  }

  console.log(`Total issues: ${totalIssues} (${criticalCount} critical, ${majorCount} major)`);
  console.log('Screenshots saved to artifact directory');

  await browser.close();
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
