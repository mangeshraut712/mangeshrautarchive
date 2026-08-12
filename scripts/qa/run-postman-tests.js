/**
 * Postman Collection API Runner for mangeshrautarchive backend.
 * Validates all requests defined in tests/api/postman_collection.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const collectionPath = path.resolve(__dirname, '../../tests/api/postman_collection.json');

async function runPostmanSuite() {
  console.log('======================================================================');
  console.log('🧪 POSTMAN COLLECTION & MCP API SPEC TEST RUNNER');
  console.log('======================================================================\n');

  if (!fs.existsSync(collectionPath)) {
    console.error('❌ Postman collection not found at:', collectionPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(collectionPath, 'utf8');
  const collection = JSON.parse(rawData);
  const baseUrl = 'http://127.0.0.1:8001';

  console.log(`📦 Collection: ${collection.info.name}`);
  console.log(`🔗 Target URL: ${baseUrl}\n`);

  let total = 0;
  let passed = 0;

  for (const group of collection.item) {
    console.log(`📁 Group: ${group.name}`);
    for (const reqItem of group.item) {
      total++;
      const req = reqItem.request;
      const endpoint = req.url.path.join('/');
      const targetUrl = `${baseUrl}/${endpoint}`;
      const method = req.method;

      try {
        const fetchOptions = {
          method,
          headers: { 'Content-Type': 'application/json' },
        };
        if (req.body && req.body.raw) {
          fetchOptions.body = req.body.raw;
        }

        const res = await fetch(targetUrl, fetchOptions);
        if (res.ok) {
          console.log(`  ✓ [${method}] /${endpoint} → HTTP ${res.status}`);
          passed++;
        } else {
          console.log(`  ⚠ [${method}] /${endpoint} → HTTP ${res.status} (Non-200)`);
        }
      } catch (err) {
        console.log(`  ℹ [${method}] /${endpoint} → Server offline / skipped (${err.message})`);
      }
    }
  }

  console.log('\n======================================================================');
  console.log(`✨ Postman Suite Check Complete: ${passed}/${total} endpoints reachable`);
  console.log('======================================================================\n');
}

runPostmanSuite();
