import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { blogPosts } from '../../src/js/modules/blog-data.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const outputPath = resolve(repoRoot, 'src/assets/data/blog-catalog.json');
const catalog = blogPosts.map(({ id, title, date, summary, tags }) => ({
  id,
  title,
  date,
  summary,
  tags,
}));

await mkdir(dirname(outputPath), { recursive: true });
const prettierConfig = (await prettier.resolveConfig(outputPath)) || {};
await writeFile(
  outputPath,
  await prettier.format(JSON.stringify(catalog), {
    ...prettierConfig,
    parser: 'json',
    filepath: outputPath,
  })
);
console.log(`Generated blog catalogue: ${catalog.length} posts`);
