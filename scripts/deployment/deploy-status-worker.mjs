/** Deploy the independent status collector. Never print credentials or request headers. */
import { readFile, readdir } from 'node:fs/promises';
const root = new URL('../../workers/portfolio-status/', import.meta.url);
const config = JSON.parse(await readFile(new URL('wrangler.json', root), 'utf8'));
const account = process.env.CLOUDFLARE_ACCOUNT_ID || 'a537fe8750aecab2da884ab534aa8f62';
const token = String(process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFARE_API_KEY || '')
  .trim()
  .replace(/^["']|["']$/g, '');
if (!token) throw new Error('Cloudflare deployment credential is missing');
let auth = { Authorization: `Bearer ${token}` };
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
try {
  await api(`/accounts/${account}/workers/scripts`);
} catch {
  auth = {
    'X-Auth-Key': token,
    'X-Auth-Email': process.env.CLOUDFLARE_EMAIL || 'mbr63@drexel.edu',
  };
  await api(`/accounts/${account}/workers/scripts`);
}
const database = config.d1_databases[0];
for (const file of (await readdir(new URL('migrations/', root)))
  .filter(name => name.endsWith('.sql'))
  .sort()) {
  await api(`/accounts/${account}/d1/database/${database.database_id}/query`, {
    method: 'POST',
    body: { sql: await readFile(new URL(`migrations/${file}`, root), 'utf8') },
  });
}
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
