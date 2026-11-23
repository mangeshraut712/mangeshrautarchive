import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const read = name => readFileSync(new URL(name, new URL('../../', import.meta.url)), 'utf8');
const failures = [];
for (const name of readdirSync(new URL('../../.github/workflows/', import.meta.url))) {
  const path = `.github/workflows/${name}`;
  const source = read(path);
  if (/permissions:\s*write-all/.test(source)) failures.push(`${path}: broad workflow permissions`);
  const agent = /uses:.*(?:codex-action|claude-code-action)|\b(?:codex|claude)\s+(?:exec|--)/i.test(
    source
  );
  if (
    agent &&
    /pull_request_target|issue_comment|\bissues:|secrets\.|(?:contents|pull-requests):\s*write/.test(
      source
    )
  ) {
    failures.push(`${path}: agent workflow combines untrusted input or privileged access`);
  }
}
const scripts = JSON.parse(read('package.json')).scripts;
for (const [name, command] of Object.entries(scripts)) {
  if (/npx\s+(?:-y\s+)?\S+@latest|--yolo|--dangerously-skip-permissions/.test(command))
    failures.push(`package.json: unsafe launcher ${name}`);
}
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0');
for (const name of files.filter(name =>
  /(?:AGENTS(?:\.override)?\.md|CLAUDE\.md|\.cursorrules)$/.test(name)
)) {
  if (/[\u061c\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/u.test(read(name)))
    failures.push(`${name}: hidden Unicode control`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    'Repository safety policy checks passed. Account protections still require manual verification.'
  );
