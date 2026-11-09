const EDGE = 'https://assistme-chat.mangeshraut712.workers.dev';
export const INTERVAL = 300000;
export const TARGETS = [
  { id: 'github_pages', url: 'https://mangeshraut712.github.io/mangeshrautarchive/' },
  { id: 'github_repos', url: `${EDGE}/api/github/repos/public?limit=1` },
  { id: 'chat_health', url: `${EDGE}/api/chat/health` },
  { id: 'lastfm', url: `${EDGE}/api/music/recent?limit=1` },
  { id: 'health_vitals', url: `${EDGE}/api/health-vitals/summary` },
  { id: 'integrations', url: `${EDGE}/api/integrations/status` },
];

export async function probe(target, fetcher = fetch) {
  const started = Date.now();
  try {
    const response = await fetcher(target.url, {
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
      headers: { Accept: 'application/json,text/html', 'User-Agent': 'Portfolio-Uptime/1.0' },
    });
    const status = response.status;
    // These are availability probes, not purchases, conversations or OAuth mutations.
    await response.body?.cancel();
    return {
      id: target.id,
      state:
        status >= 200 && status < 400
          ? 'healthy'
          : [401, 403, 404, 429].includes(status)
            ? 'degraded'
            : 'unhealthy',
      http_status: status,
      latency_ms: Date.now() - started,
    };
  } catch {
    return { id: target.id, state: 'unhealthy', http_status: 0, latency_ms: null };
  }
}

export async function collect(env, fetcher = fetch, now = Date.now()) {
  const slot = Math.floor(now / INTERVAL) * INTERVAL;
  const existing = await env.DB.prepare('SELECT COUNT(*) AS n FROM samples WHERE slot=?')
    .bind(slot)
    .first();
  if (existing?.n === TARGETS.length) return;
  const results = await Promise.all(TARGETS.map(target => probe(target, fetcher)));
  const checkedAt = Date.now();
  await env.DB.batch(
    results.map(result =>
      env.DB.prepare(
        'INSERT OR IGNORE INTO samples(service_id,slot,checked_at,state,http_status,latency_ms) VALUES(?,?,?,?,?,?)'
      ).bind(result.id, slot, checkedAt, result.state, result.http_status, result.latency_ms)
    )
  );
  // Aggregates retain the 90-day window; incident records are never pruned here.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM samples WHERE slot < ?').bind(slot - 7 * 86400000),
    env.DB.prepare("DELETE FROM daily WHERE day < date(? / 1000,'unixepoch')").bind(
      slot - 90 * 86400000
    ),
  ]);
}

export function summarizeHistory(rows, states, now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10);
  const start = Date.parse(`${today}T00:00:00Z`) - 89 * 86400000;
  return TARGETS.map(target => {
    const current = states.find(state => state.service_id === target.id);
    const days = Array.from({ length: 90 }, (_, index) => {
      const dateMs = start + index * 86400000;
      const day = new Date(dateMs).toISOString().slice(0, 10);
      const row = rows.find(item => item.service_id === target.id && item.day === day);
      const total = (row?.healthy || 0) + (row?.degraded || 0) + (row?.unhealthy || 0);
      const first = Math.max(dateMs, current?.first_slot ?? now + INTERVAL);
      const last = Math.min(dateMs + 86400000 - INTERVAL, Math.floor(now / INTERVAL) * INTERVAL);
      const expected = Math.max(0, Math.floor((last - first) / INTERVAL) + 1);
      return {
        day,
        healthy: row?.healthy || 0,
        degraded: row?.degraded || 0,
        unhealthy: row?.unhealthy || 0,
        total,
        expected,
        uptime: total ? (row.healthy / total) * 100 : null,
      };
    });
    const total = days.reduce((sum, day) => sum + day.total, 0);
    const expected = days.reduce((sum, day) => sum + day.expected, 0);
    return {
      id: target.id,
      tracking_since: current?.first_slot ?? null,
      last_checked: current?.checked_at ?? null,
      state: current?.state ?? 'unknown',
      samples: total,
      expected,
      coverage: expected ? Math.min(100, (total / expected) * 100) : null,
      uptime: total ? (days.reduce((sum, day) => sum + day.healthy, 0) / total) * 100 : null,
      days,
    };
  });
}

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'public, max-age=30',
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: HEADERS });
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(collect(env));
  },
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
    if (request.method !== 'GET') return json({ error: 'Read-only endpoint' }, 405);
    const url = new URL(request.url);
    if (url.pathname === '/health')
      return json({ service: 'portfolio-status', version: env.RELEASE_SHA || 'development' });
    if (!['/api/history', '/api/incidents'].includes(url.pathname))
      return json({ error: 'Not found' }, 404);
    try {
      let beforeTime = Number.MAX_SAFE_INTEGER,
        beforeId = '~';
      if (url.searchParams.has('before')) {
        const match = url.searchParams.get('before').match(/^(\d+)\|([a-z_]+:\d+)$/);
        if (!match) return json({ error: 'Invalid cursor' }, 400);
        beforeTime = Number(match[1]);
        beforeId = match[2];
      }
      const incidentRows = await env.DB.prepare(
        'SELECT * FROM incidents WHERE started_at < ? OR (started_at = ? AND id < ?) ORDER BY started_at DESC,id DESC LIMIT 21'
      )
        .bind(beforeTime, beforeTime, beforeId)
        .all();
      const incidents = incidentRows.results.slice(0, 20);
      const last = incidents.at(-1);
      const paging = {
        incidents,
        next_cursor: incidentRows.results.length > 20 ? `${last.started_at}|${last.id}` : null,
      };
      if (url.pathname === '/api/incidents') return json(paging);
      const now = Date.now();
      const [daily, states, active] = await env.DB.batch([
        env.DB.prepare(
          "SELECT * FROM daily WHERE day >= date(? / 1000,'unixepoch','-89 days')"
        ).bind(now),
        env.DB.prepare('SELECT * FROM service_state'),
        env.DB.prepare(
          'SELECT * FROM incidents WHERE resolved_at IS NULL ORDER BY started_at DESC'
        ),
      ]);
      return json({
        generated_at: new Date(now).toISOString(),
        interval_seconds: 300,
        window_days: 90,
        services: summarizeHistory(daily.results, states.results, now),
        active_incidents: active.results,
        ...paging,
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Monitoring history unavailable' }), {
        status: 503,
        headers: { ...HEADERS, 'Cache-Control': 'no-store' },
      });
    }
  },
};
