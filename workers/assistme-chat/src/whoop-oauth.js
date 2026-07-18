/**
 * Permanent WHOOP + Withings OAuth on the Cloudflare Worker.
 * Replaces dead Vercel / ephemeral Cloudflare-tunnel callbacks that forced repeat reauth.
 */

import {
  persistOAuthTokens,
  syncConnectedHealthProviders,
  whoopRedirectUri,
  withingsRedirectUri,
} from './health-sync.js';

const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const WHOOP_SCOPES = [
  'offline',
  'read:recovery',
  'read:cycles',
  'read:sleep',
  'read:body_measurement',
];
const WITHINGS_AUTH_URL = 'https://account.withings.com/oauth2_user/authorize2';
const WITHINGS_TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2';
const WITHINGS_SCOPES = ['user.metrics', 'user.activity'];

const DEFAULT_SUCCESS =
  'https://mangeshraut712.github.io/mangeshrautarchive/monitor.html#integrations-whoop';

function bytesToHex(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

function bytesToUrlSafeB64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function urlSafeB64ToBytes(value) {
  const normalized = String(value || '')
    .trim()
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  const bin = atob(normalized + '='.repeat(padLen));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function sha256Bytes(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest);
}

function signingMaterial(env) {
  return (
    String(env.INTEGRATION_ENCRYPTION_KEY || '').trim() ||
    String(env.INTEGRATION_SYNC_ADMIN_TOKEN || '').trim() ||
    String(env.MONITOR_ADMIN_TOKEN || '').trim()
  );
}

async function signingKeyBytes(env) {
  const material = signingMaterial(env);
  if (!material) throw new Error('signing_secret_missing');
  return sha256Bytes(material);
}

async function hmacSha256Hex(keyBytes, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bytesToHex(new Uint8Array(sig));
}

async function encodeSignedPayload(env, purpose, provider, ttlSeconds) {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${purpose}:${provider}:${expires}`;
  const signature = await hmacSha256Hex(await signingKeyBytes(env), payload);
  return bytesToUrlSafeB64(new TextEncoder().encode(`${payload}:${signature}`));
}

async function verifySignedPayload(env, token, purpose, provider) {
  if (!token) return false;
  try {
    const decoded = new TextDecoder().decode(urlSafeB64ToBytes(token));
    const lastColon = decoded.lastIndexOf(':');
    if (lastColon < 0) return false;
    const payload = decoded.slice(0, lastColon);
    const signature = decoded.slice(lastColon + 1);
    const expected = await hmacSha256Hex(await signingKeyBytes(env), payload);
    if (signature.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < signature.length; i += 1) {
      diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (diff !== 0) return false;
    const [tokenPurpose, tokenProvider, expiresRaw] = payload.split(':');
    if (tokenPurpose !== purpose || tokenProvider !== provider) return false;
    return Number(expiresRaw) >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function timingSafeEqual(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

function adminToken(env) {
  return (
    String(env.INTEGRATION_SYNC_ADMIN_TOKEN || '').trim() ||
    String(env.MONITOR_ADMIN_TOKEN || '').trim()
  );
}

function authorizeAdmin(request, env) {
  const expected = adminToken(env);
  if (!expected) return false;
  const provided = String(request.headers.get('x-integration-admin-token') || '').trim();
  return timingSafeEqual(provided, expected);
}

async function authorizeConnect(request, env, provider, authQuery) {
  if (authorizeAdmin(request, env)) return true;
  const fromQuery =
    authQuery ||
    (() => {
      try {
        return new URL(request.url).searchParams.get('auth');
      } catch {
        return '';
      }
    })();
  const token = String(fromQuery || '').trim();
  return verifySignedPayload(env, token, 'connect', provider);
}

function oauthSuccessRedirect(env, provider) {
  const explicit = String(env.OAUTH_SUCCESS_REDIRECT || '').trim();
  if (explicit) return explicit;
  const pages = String(env.PUBLIC_SITE_URL || '').trim();
  if (pages) return `${pages.replace(/\/$/, '')}/monitor.html#integrations-${provider}`;
  return DEFAULT_SUCCESS.replace('integrations-whoop', `integrations-${provider}`);
}

function whoopConfigured(env) {
  return Boolean(
    String(env.WHOOP_CLIENT_ID || '').trim() && String(env.WHOOP_CLIENT_SECRET || '').trim()
  );
}

function withingsConfigured(env) {
  return Boolean(
    String(env.WITHINGS_CLIENT_ID || '').trim() && String(env.WITHINGS_CLIENT_SECRET || '').trim()
  );
}

async function readProviderStatus(env, provider) {
  try {
    const base = String(env.SUPABASE_URL || '')
      .trim()
      .replace(/\/$/, '');
    const key = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (!base || !key) return { status: 'not_configured', connected: false };
    const res = await fetch(
      `${base}/rest/v1/integration_accounts?select=status&provider=eq.${provider}&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) return { status: 'disconnected', connected: false };
    const rows = await res.json();
    const status = rows?.[0]?.status || 'disconnected';
    return { status, connected: status === 'connected' };
  } catch {
    return { status: 'disconnected', connected: false };
  }
}

function buildWhoopAuthorizeUrl(env, state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: String(env.WHOOP_CLIENT_ID || '').trim(),
    redirect_uri: whoopRedirectUri(env),
    scope: WHOOP_SCOPES.join(' '),
    state,
  });
  return `${WHOOP_AUTH_URL}?${params}`;
}

async function exchangeWhoopCode(env, code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: String(env.WHOOP_CLIENT_ID || '').trim(),
    client_secret: String(env.WHOOP_CLIENT_SECRET || '').trim(),
    redirect_uri: whoopRedirectUri(env),
  });
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`whoop_exchange_${res.status}:${text.slice(0, 180)}`);
  }
  return res.json();
}

function redirect(url, status = 302) {
  return new Response(null, {
    status,
    headers: { Location: url, 'Cache-Control': 'no-store' },
  });
}

function json(body, status = 200, cors = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...cors,
    },
  });
}

export async function handleWhoopConnect(request, env, cors = {}) {
  if (!whoopConfigured(env)) {
    return json({ error: 'WHOOP OAuth is not configured on the edge worker.' }, 503, cors);
  }
  const url = new URL(request.url);
  const auth = url.searchParams.get('auth');
  if (!(await authorizeConnect(request, env, 'whoop', auth))) {
    return json(
      { error: 'Integration connect requires a signed owner auth token or admin header.' },
      403,
      cors
    );
  }
  if (!signingMaterial(env)) {
    return json({ error: 'Integration signing secret is not configured.' }, 503, cors);
  }
  const state = await encodeSignedPayload(env, 'oauth', 'whoop', 900);
  return redirect(buildWhoopAuthorizeUrl(env, state));
}

function oauthErrorHtml(title, detail, redirectUri) {
  const safeTitle = String(title || 'OAuth error');
  const safeDetail = String(detail || '');
  const safeRedirect = String(redirectUri || '');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${safeTitle}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1.25rem;line-height:1.5;color:#1d1d1f}code{background:#f5f5f7;padding:.15rem .4rem;border-radius:6px;font-size:.9em;word-break:break-all}a{color:#0071e3}</style></head><body>
<h1>${safeTitle}</h1>
<p>${safeDetail}</p>
<p>In the <a href="https://developer-dashboard.whoop.com/" target="_blank" rel="noopener">WHOOP Developer Dashboard</a>, open your app and set <strong>Redirect URI</strong> to exactly:</p>
<p><code>${safeRedirect}</code></p>
<p>No trailing slash. Then retry connect from Monitor → Integrations.</p>
<p><a href="https://mangeshraut712.github.io/mangeshrautarchive/monitor.html#integrations-whoop">Back to Monitor</a></p>
</body></html>`;
}

export async function handleWhoopCallback(request, env, cors = {}) {
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  if (error) {
    const redirectUri = whoopRedirectUri(env);
    const detail =
      error === 'request_forbidden'
        ? 'WHOOP rejected the authorization (request_forbidden). Almost always the Redirect URI is missing or does not match exactly.'
        : `WHOOP OAuth error: ${error}`;
    const accept = String(request.headers.get('Accept') || '');
    if (accept.includes('text/html') || !accept.includes('application/json')) {
      return new Response(oauthErrorHtml('WHOOP reconnect blocked', detail, redirectUri), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    return json({ error: `WHOOP OAuth error: ${error}`, redirectUri, detail }, 400, cors);
  }
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !(await verifySignedPayload(env, state || '', 'oauth', 'whoop'))) {
    return json({ error: 'Invalid WHOOP OAuth callback.' }, 400, cors);
  }
  try {
    const tokenPayload = await exchangeWhoopCode(env, code);
    const subject = String(tokenPayload.user_id || tokenPayload.sub || 'whoop-user');
    const saved = await persistOAuthTokens(env, 'whoop', {
      providerSubject: subject,
      scopes: WHOOP_SCOPES,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token,
      expiresIn: tokenPayload.expires_in,
    });
    if (!saved) {
      return json({ error: 'Failed to persist WHOOP tokens.' }, 502, cors);
    }
    // Immediate sync so vitals update without waiting for hourly cron.
    try {
      await syncConnectedHealthProviders(env);
    } catch {
      // Tokens are saved; cron will retry.
    }
    return redirect(oauthSuccessRedirect(env, 'whoop'));
  } catch (err) {
    return json(
      { error: 'WHOOP OAuth callback failed.', detail: String(err?.message || err).slice(0, 200) },
      502,
      cors
    );
  }
}

function buildWithingsAuthorizeUrl(env, state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: String(env.WITHINGS_CLIENT_ID || '').trim(),
    redirect_uri: withingsRedirectUri(env),
    scope: WITHINGS_SCOPES.join(','),
    state,
  });
  return `${WITHINGS_AUTH_URL}?${params}`;
}

async function exchangeWithingsCode(env, code) {
  const body = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'authorization_code',
    code,
    client_id: String(env.WITHINGS_CLIENT_ID || '').trim(),
    client_secret: String(env.WITHINGS_CLIENT_SECRET || '').trim(),
    redirect_uri: withingsRedirectUri(env),
  });
  const res = await fetch(WITHINGS_TOKEN_URL, { method: 'POST', body });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`withings_exchange_${res.status}:${text.slice(0, 180)}`);
  }
  const data = await res.json();
  if (data.status !== 0) throw new Error(data.error || 'withings_exchange_failed');
  const tokenBody = data.body || {};
  return {
    access_token: tokenBody.access_token,
    refresh_token: tokenBody.refresh_token,
    expires_in: tokenBody.expires_in,
    userid: tokenBody.userid,
  };
}

export async function handleWithingsConnect(request, env, cors = {}) {
  if (!withingsConfigured(env)) {
    return json({ error: 'Withings OAuth is not configured on the edge worker.' }, 503, cors);
  }
  const url = new URL(request.url);
  const auth = url.searchParams.get('auth');
  if (!(await authorizeConnect(request, env, 'withings', auth))) {
    return json(
      { error: 'Integration connect requires a signed owner auth token or admin header.' },
      403,
      cors
    );
  }
  if (!signingMaterial(env)) {
    return json({ error: 'Integration signing secret is not configured.' }, 503, cors);
  }
  const state = await encodeSignedPayload(env, 'oauth', 'withings', 900);
  return redirect(buildWithingsAuthorizeUrl(env, state));
}

export async function handleWithingsCallback(request, env, cors = {}) {
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  if (error) {
    return json({ error: `Withings OAuth error: ${error}` }, 400, cors);
  }
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !(await verifySignedPayload(env, state || '', 'oauth', 'withings'))) {
    return json({ error: 'Invalid Withings OAuth callback.' }, 400, cors);
  }
  try {
    const tokenPayload = await exchangeWithingsCode(env, code);
    const subject = String(tokenPayload.userid || 'withings-user');
    const saved = await persistOAuthTokens(env, 'withings', {
      providerSubject: subject,
      scopes: WITHINGS_SCOPES,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token,
      expiresIn: tokenPayload.expires_in,
    });
    if (!saved) {
      return json({ error: 'Failed to persist Withings tokens.' }, 502, cors);
    }
    try {
      await syncConnectedHealthProviders(env);
    } catch {
      // cron retries
    }
    return redirect(oauthSuccessRedirect(env, 'withings'));
  } catch (err) {
    return json(
      {
        error: 'Withings OAuth callback failed.',
        detail: String(err?.message || err).slice(0, 200),
      },
      502,
      cors
    );
  }
}

export async function handleAdminConnectUrl(request, env, provider, cors = {}) {
  const normalized = String(provider || '')
    .trim()
    .replace(/-/g, '_');
  if (!authorizeAdmin(request, env)) {
    return json({ error: 'Integration admin token required' }, 403, cors);
  }
  if (!signingMaterial(env)) {
    return json({ error: 'Integration signing secret is not configured.' }, 503, cors);
  }
  if (normalized === 'whoop') {
    if (!whoopConfigured(env)) {
      return json({ error: 'WHOOP OAuth is not configured.' }, 503, cors);
    }
    const auth = await encodeSignedPayload(env, 'connect', 'whoop', 600);
    return json(
      {
        success: true,
        provider: 'whoop',
        url: `/api/integrations/whoop/connect?auth=${auth}`,
        expiresIn: 600,
        redirectUri: whoopRedirectUri(env),
        host: 'cloudflare-worker',
        timestamp: new Date().toISOString(),
      },
      200,
      cors
    );
  }
  if (normalized === 'withings') {
    if (!withingsConfigured(env)) {
      return json({ error: 'Withings OAuth is not configured.' }, 503, cors);
    }
    const auth = await encodeSignedPayload(env, 'connect', 'withings', 600);
    return json(
      {
        success: true,
        provider: 'withings',
        url: `/api/integrations/withings/connect?auth=${auth}`,
        expiresIn: 600,
        redirectUri: withingsRedirectUri(env),
        host: 'cloudflare-worker',
        timestamp: new Date().toISOString(),
      },
      200,
      cors
    );
  }
  return json(
    {
      error: 'Edge OAuth supports WHOOP and Withings only (Google Calendar stays FastAPI).',
      provider: normalized,
    },
    404,
    cors
  );
}

export async function handleIntegrationsStatus(env, cors = {}) {
  const whoopConfiguredFlag = whoopConfigured(env);
  const withingsConfiguredFlag = withingsConfigured(env);
  const [whoop, withings] = await Promise.all([
    readProviderStatus(env, 'whoop'),
    readProviderStatus(env, 'withings'),
  ]);

  return json(
    {
      success: true,
      host: 'cloudflare-worker',
      available: true,
      timestamp: new Date().toISOString(),
      providers: {
        supabase: {
          configured: Boolean(
            String(env.SUPABASE_URL || '').trim() &&
            String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
          ),
          connected: Boolean(
            String(env.SUPABASE_URL || '').trim() &&
            String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
          ),
          purpose: 'Encrypted token vault and sanitized health summaries.',
        },
        whoop: {
          configured: whoopConfiguredFlag,
          connected: whoop.connected,
          status: whoop.status,
          needsReauth: whoop.status === 'needs_reauth',
          purpose: 'Sleep, recovery, strain, resting heart rate, and HRV trends.',
          scopes: WHOOP_SCOPES,
          connectUrl: null,
          requiresOwnerAuth: whoopConfiguredFlag,
          nextStep:
            whoop.status === 'needs_reauth'
              ? 'Reconnect WHOOP once (edge Worker callback is permanent).'
              : whoop.connected
                ? 'Connected — Cloudflare keepalive refreshes the grant every 30 minutes.'
                : 'Connect WHOOP via owner admin token on the monitor page.',
          redirectUri: whoopRedirectUri(env),
        },
        withings: {
          configured: withingsConfiguredFlag,
          connected: withings.connected,
          status: withings.status,
          needsReauth: withings.status === 'needs_reauth',
          purpose: 'Weight and body composition trends from Withings devices.',
          scopes: WITHINGS_SCOPES,
          connectUrl: null,
          requiresOwnerAuth: withingsConfiguredFlag,
          nextStep:
            withings.status === 'needs_reauth'
              ? 'Reconnect Withings once via edge Worker callback.'
              : withings.connected
                ? 'Connected — synced with WHOOP on the Cloudflare edge keepalive.'
                : 'Connect Withings via owner admin token on the monitor page.',
          redirectUri: withingsRedirectUri(env),
        },
        googleCalendar: {
          configured: false,
          connected: false,
          purpose: 'Portfolio UI uses Calendly; Google Calendar OAuth is optional FastAPI-only.',
          requiresOwnerAuth: false,
        },
      },
      privacy: {
        publicPayloads: 'Only sanitized summaries are exposed to the portfolio UI.',
        tokenStorage: 'OAuth tokens stay server-side and encrypted in Supabase.',
      },
    },
    200,
    cors
  );
}
