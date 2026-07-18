/**
 * Permanent WHOOP OAuth on the Cloudflare Worker.
 * Replaces dead Vercel / ephemeral Cloudflare-tunnel callbacks that forced repeat reauth.
 */

import {
  persistOAuthTokens,
  syncConnectedHealthProviders,
  whoopRedirectUri,
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

export async function handleWhoopCallback(request, env, cors = {}) {
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  if (error) {
    return json({ error: `WHOOP OAuth error: ${error}` }, 400, cors);
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

export async function handleAdminConnectUrl(request, env, provider, cors = {}) {
  const normalized = String(provider || '')
    .trim()
    .replace(/-/g, '_');
  if (normalized !== 'whoop') {
    return json(
      {
        error: 'Only WHOOP connect is available on the edge worker right now.',
        provider: normalized,
      },
      404,
      cors
    );
  }
  if (!authorizeAdmin(request, env)) {
    return json({ error: 'Integration admin token required' }, 403, cors);
  }
  if (!whoopConfigured(env)) {
    return json({ error: 'WHOOP OAuth is not configured.' }, 503, cors);
  }
  if (!signingMaterial(env)) {
    return json({ error: 'Integration signing secret is not configured.' }, 503, cors);
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

export async function handleIntegrationsStatus(env, cors = {}) {
  const whoopConfiguredFlag = whoopConfigured(env);
  let whoopConnected = false;
  let whoopStatus = 'not_configured';
  try {
    const base = String(env.SUPABASE_URL || '')
      .trim()
      .replace(/\/$/, '');
    const key = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (base && key) {
      const res = await fetch(
        `${base}/rest/v1/integration_accounts?select=status&provider=eq.whoop&limit=1`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Accept: 'application/json',
          },
        }
      );
      if (res.ok) {
        const rows = await res.json();
        whoopStatus = rows?.[0]?.status || 'disconnected';
        whoopConnected = whoopStatus === 'connected';
      }
    }
  } catch {
    // ignore
  }

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
          connected: whoopConnected,
          status: whoopStatus,
          needsReauth: whoopStatus === 'needs_reauth',
          purpose: 'Sleep, recovery, strain, resting heart rate, and HRV trends.',
          scopes: WHOOP_SCOPES,
          connectUrl: null,
          requiresOwnerAuth: whoopConfiguredFlag,
          nextStep:
            whoopStatus === 'needs_reauth'
              ? 'Reconnect WHOOP once (edge Worker callback is permanent).'
              : 'Connect WHOOP via owner admin token on the monitor page.',
          redirectUri: whoopRedirectUri(env),
        },
        withings: {
          configured: Boolean(
            String(env.WITHINGS_CLIENT_ID || '').trim() &&
            String(env.WITHINGS_CLIENT_SECRET || '').trim()
          ),
          connected: false,
          purpose: 'Weight trends (edge OAuth for Withings coming next).',
          requiresOwnerAuth: false,
        },
        googleCalendar: {
          configured: false,
          connected: false,
          purpose: 'Calendar OAuth remains on FastAPI when Vercel is available.',
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
