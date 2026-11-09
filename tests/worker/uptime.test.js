import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import worker, {
  collect,
  probe,
  summarizeHistory,
  TARGETS,
} from '../../workers/portfolio-status/src/index.js';
const migrations = new URL('../../workers/portfolio-status/migrations/', import.meta.url);
const schema = readdirSync(migrations)
  .filter(file => file.endsWith('.sql'))
  .sort()
  .map(file => readFileSync(new URL(file, migrations), 'utf8'))
  .join('\n');
function database(path = ':memory:') {
  const sqlite = new DatabaseSync(path);
  sqlite.exec(schema);
  const db = {
    prepare(sql) {
      let args = [];
      const q = {
        bind(...params) {
          args = params;
          return q;
        },
        async first() {
          return sqlite.prepare(sql).get(...args);
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...args) };
        },
        async run() {
          return sqlite.prepare(sql).run(...args);
        },
      };
      return q;
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const r = [];
        for (const s of statements) r.push(await s.all());
        sqlite.exec('COMMIT');
        return r;
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return { sqlite, DB: db };
}
const start = Date.parse('2026-11-09T00:00:00Z');
function sample(db, index, state, id = 'github_pages') {
  db.prepare('INSERT OR IGNORE INTO samples VALUES(?,?,?,?,?,?)').run(
    id,
    start + index * 300000,
    start + index * 300000,
    state,
    state === 'healthy' ? 200 : 503,
    42
  );
}
test('confirmed incidents survive fresh DB adapters and resolve after two healthy samples', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'uptime-'));
  const path = join(directory, 'history.sqlite');
  let { sqlite } = database(path);
  sample(sqlite, 0, 'unhealthy');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM incidents').get().n, 0);
  sample(sqlite, 1, 'degraded');
  let incident = sqlite.prepare('SELECT * FROM incidents').get();
  assert.equal(incident.started_at, start);
  assert.equal(incident.severity, 'unhealthy');
  assert.equal(incident.resolved_at, null);
  sqlite.close();
  ({ sqlite } = database(path));
  assert.equal(sqlite.prepare('SELECT * FROM incidents').get().started_at, start);
  sample(sqlite, 2, 'healthy');
  assert.equal(sqlite.prepare('SELECT resolved_at FROM incidents').get().resolved_at, null);
  sample(sqlite, 3, 'healthy');
  incident = sqlite.prepare('SELECT * FROM incidents').get();
  assert.equal(incident.resolved_at, start + 900000);
  sqlite.close();
  rmSync(directory, { recursive: true });
});
test('duplicates do not inflate uptime and out-of-order checks do not corrupt incident state', () => {
  const { sqlite } = database();
  sample(sqlite, 1, 'unhealthy');
  sample(sqlite, 2, 'unhealthy');
  sample(sqlite, 2, 'healthy');
  sample(sqlite, 0, 'healthy');
  assert.equal(sqlite.prepare('SELECT state FROM service_state').get().state, 'unhealthy');
  assert.equal(sqlite.prepare('SELECT resolved_at FROM incidents').get().resolved_at, null);
  assert.equal(sqlite.prepare('SELECT healthy+degraded+unhealthy n FROM daily').get().n, 3);
  sqlite.close();
});
test('monitoring gaps break confirmation and recovery streaks', () => {
  const { sqlite } = database();
  sample(sqlite, 0, 'unhealthy');
  sample(sqlite, 2, 'unhealthy');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM incidents').get().n, 0);
  sample(sqlite, 3, 'unhealthy');
  sample(sqlite, 4, 'healthy');
  sample(sqlite, 6, 'healthy');
  assert.equal(sqlite.prepare('SELECT resolved_at FROM incidents').get().resolved_at, null);
  sample(sqlite, 7, 'healthy');
  assert.equal(
    sqlite.prepare('SELECT resolved_at FROM incidents').get().resolved_at,
    start + 2100000
  );
  sqlite.close();
});
test('uptime excludes missing observations while coverage exposes gaps and unobserved days', () => {
  const values = summarizeHistory(
    [{ service_id: 'github_pages', day: '2026-11-09', healthy: 2, degraded: 0, unhealthy: 1 }],
    [{ service_id: 'github_pages', first_slot: start, checked_at: start }],
    start + 1200000
  )[0];
  assert.equal(values.days.length, 90);
  assert.equal(values.samples, 3);
  assert.equal(values.expected, 5);
  assert.equal(values.coverage, 60);
  assert.ok(Math.abs(values.uptime - 66.666666) < 0.001);
  assert.equal(values.days[0].uptime, null);
  assert.equal(values.days[0].expected, 0);
});
test('collector writes six real probes once per slot and preserves incidents through retention', async () => {
  const env = database();
  const slot = Math.floor(Date.now() / 300000) * 300000;
  const old = slot - 100 * 86400000;
  env.sqlite
    .prepare('INSERT INTO incidents VALUES(?,?,?,?,?,?,?,?)')
    .run('github_pages:old', 'github_pages', old, old, old, old + 600000, 'unhealthy', 503);
  env.sqlite
    .prepare('INSERT INTO samples VALUES(?,?,?,?,?,?)')
    .run('github_pages', old, old, 'healthy', 200, 42);
  let calls = 0;
  await collect(
    env,
    async () => {
      calls++;
      return new Response('ok');
    },
    slot
  );
  await collect(
    env,
    async () => {
      calls++;
      return new Response('ok');
    },
    slot
  );
  assert.equal(calls, TARGETS.length);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) n FROM samples').get().n, 6);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) n FROM incidents').get().n, 1);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) n FROM daily').get().n, 6);
  env.sqlite.close();
});
test('probe records HTTP errors and timeouts instead of synthetic healthy results', async () => {
  assert.equal(
    (await probe(TARGETS[0], async () => new Response('', { status: 503 }))).state,
    'unhealthy'
  );
  assert.equal(
    (await probe(TARGETS[0], async () => new Response('', { status: 429 }))).state,
    'degraded'
  );
  assert.equal(
    (
      await probe(TARGETS[0], async () => {
        throw new Error('timeout');
      })
    ).http_status,
    0
  );
});
test('public history API persists records, paginates tied timestamps and rejects mutations', async () => {
  const env = database();
  for (let i = 0; i < 25; i++)
    env.sqlite
      .prepare('INSERT INTO incidents VALUES(?,?,?,?,?,?,?,?)')
      .run(
        `github_pages:${i}`,
        'github_pages',
        start,
        start,
        start,
        start + 300000,
        'unhealthy',
        503
      );
  const first = await (await worker.fetch(new Request('https://status/api/incidents'), env)).json();
  assert.equal(first.incidents.length, 20);
  assert.ok(first.next_cursor);
  const second = await (
    await worker.fetch(
      new Request('https://status/api/incidents?before=' + encodeURIComponent(first.next_cursor)),
      env
    )
  ).json();
  assert.equal(second.incidents.length, 5);
  assert.equal(new Set([...first.incidents, ...second.incidents].map(x => x.id)).size, 25);
  const response = await worker.fetch(new Request('https://status/api/history'), env);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.equal((await response.json()).services.length, 6);
  assert.equal(
    (await worker.fetch(new Request('https://status/api/history', { method: 'POST' }), env)).status,
    405
  );
  assert.equal(
    (await worker.fetch(new Request('https://status/api/incidents?before=invalid'), env)).status,
    400
  );
  env.sqlite.close();
});
test('database failure returns unavailable instead of an empty incident history', async () => {
  const response = await worker.fetch(new Request('https://status/api/history'), {
    DB: {
      prepare() {
        throw new Error('unavailable');
      },
    },
  });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
