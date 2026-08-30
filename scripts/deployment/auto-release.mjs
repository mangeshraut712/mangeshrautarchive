#!/usr/bin/env node
/**
 * Automated Semantic GitHub Release Publisher.
 * Parses the latest entry in src/js/data/changelog-entries.js and publishes a formatted GitHub Release.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

async function publishRelease() {
  const { changelogEntries, CHANGELOG_REPO } =
    await import('../../src/js/data/changelog-entries.js');
  if (!changelogEntries || changelogEntries.length === 0) {
    console.log('[auto-release] No changelog entries found.');
    return;
  }

  const latest = changelogEntries[0];
  const tagName = `v${latest.date.replace(/-/g, '.')}-${latest.id}`;
  const releaseTitle = `${latest.title} (${latest.date})`;

  console.log(`[auto-release] Latest entry: "${latest.title}" [${latest.id}]`);
  console.log(`[auto-release] Target tag: ${tagName}`);

  const releaseBody = `## ${latest.title}

> **Type:** \`${latest.type}\` | **Date:** \`${latest.date}\` | **Commit:** [\`${latest.sha}\`](${CHANGELOG_REPO}/commit/${latest.sha})

### Summary
${latest.summary}

${latest.tags && latest.tags.length ? `### Tags\n${latest.tags.map(t => `\`#${t}\``).join(' ')}` : ''}

---
*Automated Release generated from \`src/js/data/changelog-entries.js\` via GitHub Actions.*
`;

  // Output for GitHub Actions step
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `tag_name=${tagName}\n`);
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `release_title=${encodeURIComponent(releaseTitle)}\n`
    );
  }

  const releasePayloadPath = path.join(ROOT_DIR, 'dist-release-body.md');
  fs.writeFileSync(releasePayloadPath, releaseBody, 'utf-8');
  console.log(`[auto-release] Release notes written to ${releasePayloadPath}`);
}

publishRelease().catch(err => {
  console.error('[auto-release] Error:', err);
  process.exit(1);
});
