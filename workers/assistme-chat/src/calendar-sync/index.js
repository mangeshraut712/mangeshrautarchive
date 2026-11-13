import { SourceStore, configured, sourceHealth, sourceErrorCode } from './store.js';
import {
  SESSION_COOKIE,
  OAUTH_COOKIE,
  randomToken,
  digest,
  seal,
  open,
  cookie,
  cookieValue,
  ownerSession,
  allowedOwner,
  requireCsrf,
  readJson,
  fetchBounded,
} from './security.js';
import { GOOGLE_SCOPES, googleJson, googleSnapshot } from './google.js';
import { lumaSnapshot, validateLumaFeed } from './luma.js';
import { deduplicate, publicSnapshot, validateAppleSnapshot } from './normalize.js';

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}
function callbackUri(request, env) {
  return (
    env.GOOGLE_CALENDAR_REDIRECT_URI ||
    `${new URL(request.url).origin}/api/calendar/callback/google`
  );
}
async function connect(request, env) {
  if (!env.GOOGLE_CALENDAR_CLIENT_ID || !env.GOOGLE_CALENDAR_CLIENT_SECRET)
    return json({ error: 'google_not_configured' }, 503);
  const verifier = randomToken();
  const state = `cs1.${randomToken()}`;
  const payload = await seal(env, 'oauth', { verifier, state, exp: Date.now() + 600_000 });
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  auth.search = new URLSearchParams({
    client_id: env.GOOGLE_CALENDAR_CLIENT_ID,
    redirect_uri: callbackUri(request, env),
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent select_account',
    state,
    code_challenge: await digest(verifier),
    code_challenge_method: 'S256',
  }).toString();
  return new Response(null, {
    status: 302,
    headers: {
      Location: auth.href,
      'Cache-Control': 'no-store',
      'Set-Cookie': cookie(OAUTH_COOKIE, payload, 600, '/api'),
    },
  });
}
async function callback(request, env, store) {
  const url = new URL(request.url);
  let pending;
  try {
    pending = await open(env, 'oauth', cookieValue(request, OAUTH_COOKIE));
  } catch {
    return json({ error: 'oauth_state_invalid' }, 400);
  }
  if (
    pending.exp <= Date.now() ||
    pending.state !== url.searchParams.get('state') ||
    !url.searchParams.get('code')
  )
    return json({ error: 'oauth_state_invalid' }, 400);
  const tokens = JSON.parse(
    await fetchBounded('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: env.GOOGLE_CALENDAR_CLIENT_ID,
        client_secret: env.GOOGLE_CALENDAR_CLIENT_SECRET,
        redirect_uri: callbackUri(request, env),
        grant_type: 'authorization_code',
        code: url.searchParams.get('code'),
        code_verifier: pending.verifier,
      }),
    })
  );
  const scopes = String(tokens.scope || '').split(' ');
  if (
    !tokens.access_token ||
    !GOOGLE_SCOPES.filter(s => s.startsWith('https:')).every(s => scopes.includes(s))
  )
    return json({ error: 'google_read_scopes_required' }, 403);
  const identity = await googleJson(
    'https://openidconnect.googleapis.com/v1/userinfo',
    tokens.access_token
  );
  if (identity.email_verified !== true || !identity.sub || !allowedOwner(env, identity.email))
    return json({ error: 'owner_not_allowed' }, 403);
  const id = `google:${identity.sub}`;
  await store.ensure(id, 'google', identity.email);
  await store.mutate(id, async source => {
    const previous = source.credentials
      ? await open(env, `credentials:${id}`, source.credentials)
      : {};
    const credentials = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || previous.refreshToken,
      expiresAt: Date.now() + Number(tokens.expires_in || 3600) * 1000,
    };
    if (!credentials.refreshToken) throw new Error('google_offline_consent_required');
    return { credentials: await seal(env, `credentials:${id}`, credentials), error: null };
  });
  const session = await seal(env, 'session', {
    email: identity.email,
    sub: identity.sub,
    csrf: randomToken(),
    exp: Date.now() + 3600_000,
  });
  const headers = new Headers({
    Location: `${url.origin}/api/calendar-sync/owner`,
    'Cache-Control': 'no-store',
  });
  headers.append('Set-Cookie', cookie(SESSION_COOKIE, session, 3600));
  headers.append('Set-Cookie', cookie(OAUTH_COOKIE, '', 0, '/api'));
  return new Response(null, { status: 303, headers });
}
export async function syncCalendars(env) {
  if (!configured(env)) return { configured: false, refreshed: 0 };
  const store = new SourceStore(env);
  let sources;
  try {
    sources = await store.list();
  } catch {
    return { configured: false, refreshed: 0, error: 'calendar_storage_unavailable' };
  }
  const results = [];
  for (const source of sources.filter(
    s => s.credentials && ['google', 'luma'].includes(s.provider)
  )) {
    try {
      await store.mutate(source.id, locked =>
        locked.provider === 'google' ? googleSnapshot(env, locked) : lumaSnapshot(env, locked)
      );
      results.push({ provider: source.provider, ok: true });
    } catch (error) {
      console.error(
        JSON.stringify({
          event: 'calendar_sync_failed',
          provider: source.provider,
          error: sourceErrorCode(error),
        })
      );
      results.push({ provider: source.provider, ok: false });
    }
  }
  return { configured: true, refreshed: results.filter(r => r.ok).length, results };
}
export async function configureLumaFeed(env, feedUrl) {
  const validated = validateLumaFeed(feedUrl);
  const store = new SourceStore(env);
  const id = 'luma:personal';
  await store.ensure(id, 'luma', 'Luma personal events');
  return store.mutate(id, async source => {
    const credentials = await seal(env, `credentials:${id}`, { feedUrl: validated });
    return { credentials, ...(await lumaSnapshot(env, { ...source, credentials })) };
  });
}
async function privateView(request, env, store) {
  const session = await ownerSession(request, env);
  if (!session) return json({ authenticated: false, error: 'owner_required' }, 401);
  const sources = await store.list();
  const attach = field =>
    sources.flatMap(s => (s.snapshot?.[field] || []).map(e => ({ ...e, sourceId: s.id })));
  return json({
    authenticated: true,
    csrfToken: session.csrf,
    sources: sources.map(s => sourceHealth(s, true)),
    events: deduplicate(attach('events')),
    reminders: attach('reminders'),
    passes: attach('passes'),
  });
}
async function appleUpload(request, env, store) {
  const bearer = request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if (!bearer) return json({ error: 'upload_token_required' }, 401);
  const source = await store.get('apple:mac');
  if (
    !source?.settings?.uploadTokenHash ||
    (await digest(bearer)) !== source.settings.uploadTokenHash
  )
    return json({ error: 'upload_token_invalid' }, 401);
  const payload = await readJson(request);
  let replay = false;
  await store.mutate(source.id, async locked => {
    if ((await digest(bearer)) !== locked.settings.uploadTokenHash)
      throw Object.assign(new Error('upload_token_invalid'), { status: 401 });
    const snapshot = validateAppleSnapshot(payload, locked.snapshot);
    replay = !snapshot;
    return snapshot ? { snapshot, last_success: new Date().toISOString(), error: null } : {};
  });
  return json({ ok: true, replay });
}
async function ownerWrite(request, env, store, path) {
  const session = await ownerSession(request, env);
  if (!session) return json({ authenticated: false, error: 'owner_required' }, 401);
  requireCsrf(request, session);
  if (path === '/logout')
    return json({ ok: true }, 200, { 'Set-Cookie': cookie(SESSION_COOKIE, '', 0) });
  if (path === '/sync') return json(await syncCalendars(env));
  const body = await readJson(request, 20000);
  if (path === '/luma') {
    await configureLumaFeed(env, body.feedUrl);
    return json({ ok: true });
  }
  if (path === '/apple/token' || path === '/apple/revoke') {
    await store.ensure('apple:mac', 'apple', 'Mac Calendar and Reminders');
    const token = path === '/apple/token' ? randomToken() : null;
    await store.mutate('apple:mac', async source => ({
      settings: { ...source.settings, uploadTokenHash: token ? await digest(token) : null },
    }));
    return json({
      ok: true,
      ...(token
        ? {
            token,
            sourceId: 'apple:mac',
            uploadUrl: `${new URL(request.url).origin}/api/calendar-sync/apple/upload`,
          }
        : {}),
    });
  }
  if (path === '/settings') {
    if (typeof body.sourceId !== 'string' || typeof body.publicationEnabled !== 'boolean')
      return json({ error: 'invalid_settings' }, 400);
    await store.mutate(body.sourceId, async source => ({
      settings: { ...source.settings, publicationEnabled: body.publicationEnabled },
    }));
    return json({ ok: true });
  }
  return json({ error: 'not_found' }, 404);
}
export async function handleCalendarSync(request, env) {
  const url = new URL(request.url);
  const isCallback =
    url.pathname === '/api/calendar/callback/google' &&
    url.searchParams.get('state')?.startsWith('cs1.');
  if (!isCallback && !url.pathname.startsWith('/api/calendar-sync/')) return null;
  const path = url.pathname.slice('/api/calendar-sync'.length);
  if (['/owner', '/owner.js', '/owner.css'].includes(path)) return null;
  if (!configured(env))
    return json({ configured: false, error: 'calendar_sync_not_configured' }, 503);
  const store = new SourceStore(env);
  try {
    if (request.method === 'GET') {
      if (isCallback || path === '/google/callback') return await callback(request, env, store);
      if (path === '/google/connect') return await connect(request, env);
      if (path === '/private') return await privateView(request, env, store);
      if (path === '/public') {
        const sources = await store.list();
        const health = sources.map(s => sourceHealth(s));
        return json({
          configured: sources.some(s => s.last_success),
          events: await publicSnapshot(sources),
          lastSuccessAt:
            sources
              .map(s => s.last_success)
              .filter(Boolean)
              .sort()
              .at(-1) || null,
          stale: health.some(s => s.stale),
          sources: health.map(({ provider, stale, lastSuccessAt }) => ({
            provider,
            stale,
            lastSuccessAt,
          })),
        });
      }
    }
    if (request.method === 'POST') {
      if (path === '/apple/upload') return await appleUpload(request, env, store);
      return await ownerWrite(request, env, store, path);
    }
    return json({ error: 'not_found' }, 404);
  } catch (error) {
    const safe = [
      'owner_csrf_required',
      'invalid_luma_feed',
      'invalid_apple_snapshot',
      'outdated_snapshot',
      'source_busy',
      'source_lock_lost',
      'upload_token_invalid',
      'json_required',
      'invalid_json',
      'body_required',
      'payload_too_large',
    ];
    return json(
      { error: safe.includes(error.message) ? error.message : 'calendar_sync_unavailable' },
      error.status || 503
    );
  }
}
