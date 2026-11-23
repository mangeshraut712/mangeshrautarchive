/** Deploy the independent status collector. Never print credentials or request headers. */
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
const root = new URL('../../workers/portfolio-status/', import.meta.url);
const config = JSON.parse(await readFile(new URL('wrangler.json', root), 'utf8'));
const mode = process.argv[2] || '--plan';
const database = config.d1_databases[0];
const migrations = (await readdir(new URL('migrations/', root)))
  .filter(name => /^[a-zA-Z0-9_-]+\.sql$/.test(name))
  .sort();
if (mode === '--plan') {
  console.log('Database name:', database.database_name);
  console.log('Migration files:', migrations.join(', '));
  console.log('No credentials read and no network requests made.');
  process.exit(0);
}
if (
  !['--deploy', '--migrate'].includes(mode) ||
  process.env.EXPECTED_DATABASE_NAME !== database.database_name
) {
  throw new Error(
    'WARNING: remote deployment requires an explicit mode and matching EXPECTED_DATABASE_NAME.'
  );
}
if (mode === '--migrate' && !process.argv.includes('--confirm-schema-change')) {
  throw new Error(
    'WARNING: migrations change remote database schema. Review --plan and explicitly confirm.'
  );
}
if (process.env.PORTFOLIO_LOCAL_ONLY === '1')
  throw new Error('Remote deployment is disabled in local-only execution.');
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!account || !token)
  throw new Error('A scoped CLOUDFLARE_API_TOKEN and explicit account are required.');
const auth = { Authorization: `Bearer ${token}` };
async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      ...auth,
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60000),
  });
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(
      `Cloudflare ${method} ${path} failed: ${response.status} ${data.errors?.map(error => error.code).join(',') || ''}`
    );
  return data.result;
}
if (mode === '--migrate') {
  console.warn(
    'WARNING: applying remote schema migrations; schema mistakes can interrupt service or damage data.'
  );
  const query = sql =>
    api(`/accounts/${account}/d1/database/${database.database_id}/query`, {
      method: 'POST',
      body: { sql },
    });
  await query(
    'CREATE TABLE IF NOT EXISTS portfolio_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)'
  );
  const result = await query('SELECT name, checksum FROM portfolio_migrations');
  const applied = new Map((result[0]?.results || []).map(row => [row.name, row.checksum]));
  for (const file of migrations) {
    const sql = await readFile(new URL(`migrations/${file}`, root), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    if (applied.has(file)) {
      if (applied.get(file) !== checksum)
        throw new Error('Applied migration changed; manual review required.');
      continue;
    }
    await query(sql);
    await query(
      `INSERT INTO portfolio_migrations (name, checksum) VALUES ('${file}', '${checksum}')`
    );
    console.log('Applied migration:', file);
  }
  process.exit(0);
}
console.warn(
  'WARNING: deploying replaces remote Worker code and schedules; database schema is not changed.'
);
const form = new FormData();
form.append(
  'metadata',
  new Blob(
    [
      JSON.stringify({
        main_module: 'index.js',
        compatibility_date: config.compatibility_date,
        observability: config.observability,
        bindings: [
          { type: 'd1', name: database.binding, id: database.database_id },
          { type: 'plain_text', name: 'RELEASE_SHA', text: process.env.GITHUB_SHA || 'local' },
        ],
      }),
    ],
    { type: 'application/json' }
  )
);
form.append(
  'index.js',
  new Blob([await readFile(new URL(config.main, root), 'utf8')], {
    type: 'application/javascript+module',
  }),
  'index.js'
);
await api(`/accounts/${account}/workers/scripts/${config.name}`, { method: 'PUT', body: form });
await api(`/accounts/${account}/workers/scripts/${config.name}/subdomain`, {
  method: 'POST',
  body: { enabled: true, previews_enabled: false },
});
await api(`/accounts/${account}/workers/scripts/${config.name}/schedules`, {
  method: 'PUT',
  body: config.triggers.crons.map(cron => ({ cron })),
});
console.log(`Deployed ${config.name}; persistent database retained; five-minute schedule enabled.`);
