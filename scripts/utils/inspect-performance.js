import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = ['lighthouse-desktop.json', 'lighthouse-mobile.json'];
const reportDir =
  '/Users/mangeshraut/Desktop/Mangesh/Drexel University MSCS/Academics/Projects/mangeshrautarchive/artifacts/lighthouse';

for (const file of files) {
  const filePath = resolve(reportDir, file);
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    console.log(`\n=================== ${file} ===================`);

    // Core performance metrics
    const performance = data.categories.performance;
    console.log(`Performance Score: ${Math.round(performance.score * 100)}`);

    const metricAudits = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'speed-index',
      'interactive',
      'total-blocking-time',
    ];

    console.log('\n--- Metrics ---');
    for (const id of metricAudits) {
      const audit = data.audits[id];
      if (audit) {
        console.log(`${audit.title}: ${audit.displayValue} (Score: ${audit.score})`);
      }
    }

    console.log('\n--- Performance Opportunities & Diagnostics ---');
    for (const [id, audit] of Object.entries(data.audits)) {
      if (audit.score !== null && audit.score < 1 && audit.details) {
        const isPerfCat = performance.auditRefs.some(ref => ref.id === id);
        if (isPerfCat) {
          console.log(`\n🔴 [${id}] (Score: ${audit.score}) - ${audit.title}`);
          if (audit.displayValue) console.log(`   Value/Savings: ${audit.displayValue}`);
          if (audit.details.items && audit.details.items.length > 0) {
            console.log(`   Items (${audit.details.items.length}):`);
            audit.details.items.slice(0, 5).forEach((item, idx) => {
              console.log(`     ${idx + 1}:`, JSON.stringify(item).substring(0, 300));
            });
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
}
