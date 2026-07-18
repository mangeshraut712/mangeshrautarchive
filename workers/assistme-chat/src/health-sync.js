/**
 * Edge WHOOP / Withings → Supabase sync for GitHub Pages.
 * Vercel cron is DEPLOYMENT_DISABLED; this is the primary refresh path.
 */

const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const WHOOP_API = 'https://api.prod.whoop.com/developer/v2';
const WITHINGS_TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2';
const WITHINGS_MEASURE_URL = 'https://wbsapi.withings.net/measure';

const STALE_MS = 4 * 60 * 60 * 1000;
const REFRESH_SKEW_SECONDS = 300;
const TOKEN_LOCK_PREFIX = 'token_refresh_lock:';
const TOKEN_LOCK_TTL_MS = 45_000;
const SAVE_ATTEMPTS = 4;
const DEFAULT_WHOOP_REDIRECT =
  'https://assistme-chat.mangeshraut712.workers.dev/api/integrations/whoop/callback';
const DEFAULT_WITHINGS_REDIRECT =
  'https://assistme-chat.mangeshraut712.workers.dev/api/integrations/withings/callback';

export function whoopRedirectUri(env) {
  return String(env.WHOOP_REDIRECT_URI || '').trim() || DEFAULT_WHOOP_REDIRECT;
}

export function withingsRedirectUri(env) {
  return String(env.WITHINGS_REDIRECT_URI || '').trim() || DEFAULT_WITHINGS_REDIRECT;
}

function utcNowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function supabaseConfigured(env) {
  return Boolean(
    String(env.SUPABASE_URL || '').trim() && String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  );
}

function supabaseHeaders(env, extra = {}) {
  const key = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    ...extra,
  };
}

function supabaseRestUrl(env, path, params) {
  const base = String(env.SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '');
  const url = new URL(`${base}/rest/v1/${path.replace(/^\//, '')}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

async function sha256Bytes(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

function bytesToUrlSafeB64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_');
}

function urlSafeB64ToBytes(value, { strictPadding = false } = {}) {
  const normalized = String(value || '')
    .trim()
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  // Match Python binascii: length % 4 == 1 is always invalid.
  if (normalized.length % 4 === 1) {
    throw new Error('Incorrect padding');
  }
  // Fernet keys must not invent padding. A 43-char key pad-decodes to 32 bytes in JS,
  // but Python Fernet() rejects it and falls back to sha256(passphrase).
  if (strictPadding && normalized.length % 4 !== 0) {
    throw new Error('Incorrect padding');
  }
  const padLen = (4 - (normalized.length % 4)) % 4;
  const b64 = normalized + '='.repeat(padLen);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function resolveFernetKeyBytes(rawKey) {
  const raw = String(rawKey || '').trim();
  if (!raw) throw new Error('INTEGRATION_ENCRYPTION_KEY missing');
  try {
    // Mirror api/integrations/token_crypto.py: Fernet(raw) then sha256 fallback.
    const direct = urlSafeB64ToBytes(raw, { strictPadding: true });
    if (direct.length === 32) return direct;
  } catch {
    // fall through — treat as passphrase
  }
  return sha256Bytes(raw);
}

async function fernetDecrypt(token, rawKey) {
  if (!token) return '';
  const keyBytes = await resolveFernetKeyBytes(rawKey);
  const signingKey = keyBytes.slice(0, 16);
  const encryptionKey = keyBytes.slice(16, 32);
  const tokenBytes = urlSafeB64ToBytes(String(token).trim());
  if (tokenBytes.length < 1 + 8 + 16 + 32) {
    throw new Error('Invalid Fernet token length');
  }
  if (tokenBytes[0] !== 0x80) {
    throw new Error('Invalid Fernet version');
  }
  const iv = tokenBytes.slice(9, 25);
  const ciphertext = tokenBytes.slice(25, tokenBytes.length - 32);
  const hmacGiven = tokenBytes.slice(tokenBytes.length - 32);
  const signed = tokenBytes.slice(0, tokenBytes.length - 32);

  const hmacKey = await crypto.subtle.importKey(
    'raw',
    signingKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const hmacBuf = await crypto.subtle.sign('HMAC', hmacKey, signed);
  const hmacCalc = new Uint8Array(hmacBuf);
  if (hmacCalc.length !== hmacGiven.length) throw new Error('Fernet HMAC mismatch');
  let diff = 0;
  for (let i = 0; i < hmacCalc.length; i += 1) diff |= hmacCalc[i] ^ hmacGiven[i];
  if (diff !== 0) throw new Error('Fernet HMAC mismatch');

  const aesKey = await crypto.subtle.importKey('raw', encryptionKey, { name: 'AES-CBC' }, false, [
    'decrypt',
  ]);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, aesKey, ciphertext);
  return new TextDecoder().decode(plainBuf);
}

async function fernetEncrypt(plaintext, rawKey) {
  const keyBytes = await resolveFernetKeyBytes(rawKey);
  const signingKey = keyBytes.slice(0, 16);
  const encryptionKey = keyBytes.slice(16, 32);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const aesKey = await crypto.subtle.importKey('raw', encryptionKey, { name: 'AES-CBC' }, false, [
    'encrypt',
  ]);
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    aesKey,
    new TextEncoder().encode(plaintext)
  );
  const ciphertext = new Uint8Array(cipherBuf);
  const ts = Math.floor(Date.now() / 1000);
  const header = new Uint8Array(1 + 8 + 16);
  header[0] = 0x80;
  const view = new DataView(header.buffer);
  view.setBigUint64(1, BigInt(ts), false);
  header.set(iv, 9);
  const signed = new Uint8Array(header.length + ciphertext.length);
  signed.set(header, 0);
  signed.set(ciphertext, header.length);
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    signingKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const hmacBuf = await crypto.subtle.sign('HMAC', hmacKey, signed);
  const out = new Uint8Array(signed.length + 32);
  out.set(signed, 0);
  out.set(new Uint8Array(hmacBuf), signed.length);
  return bytesToUrlSafeB64(out);
}

function expiresSoon(expiresAt, skewSeconds = REFRESH_SKEW_SECONDS) {
  if (!expiresAt) return true;
  const ms = Date.parse(String(expiresAt).replace('Z', '+00:00'));
  if (!Number.isFinite(ms)) return true;
  return ms - Date.now() <= skewSeconds * 1000;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getConnectedAccount(env, provider) {
  const res = await fetch(
    supabaseRestUrl(env, 'integration_accounts', {
      select: 'id,provider_subject,scopes,status',
      provider: `eq.${provider}`,
      limit: '1',
    }),
    { headers: supabaseHeaders(env) }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  if (!Array.isArray(rows) || !rows.length || rows[0].status !== 'connected') return null;
  return rows[0];
}

async function getTokenRow(env, accountId) {
  const res = await fetch(
    supabaseRestUrl(env, 'integration_tokens', {
      select: 'encrypted_access_token,encrypted_refresh_token,expires_at,rotated_at,updated_at',
      account_id: `eq.${accountId}`,
      limit: '1',
    }),
    { headers: supabaseHeaders(env) }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function saveTokens(env, account, accessToken, refreshToken, expiresAt) {
  const encKey = env.INTEGRATION_ENCRYPTION_KEY;
  const now = utcNowIso();
  const payload = {
    account_id: account.id,
    encrypted_access_token: await fernetEncrypt(accessToken, encKey),
    encrypted_refresh_token: await fernetEncrypt(refreshToken || '', encKey),
    expires_at: expiresAt || null,
    rotated_at: now,
    updated_at: now,
  };
  for (let attempt = 1; attempt <= SAVE_ATTEMPTS; attempt += 1) {
    const res = await fetch(
      supabaseRestUrl(env, 'integration_tokens', { on_conflict: 'account_id' }),
      {
        method: 'POST',
        headers: supabaseHeaders(env, {
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(payload),
      }
    );
    if (res.ok) return true;
    await sleep(150 * attempt);
  }
  return false;
}

async function markProviderNeedsReauth(env, provider, reason = 'invalid_grant') {
  const account = await getConnectedAccount(env, provider);
  // Also flip accounts already in a weird state — look up without status filter.
  let accountId = account?.id;
  if (!accountId) {
    try {
      const res = await fetch(
        supabaseRestUrl(env, 'integration_accounts', {
          select: 'id',
          provider: `eq.${provider}`,
          limit: '1',
        }),
        { headers: supabaseHeaders(env) }
      );
      if (res.ok) {
        const rows = await res.json();
        accountId = rows?.[0]?.id;
      }
    } catch {
      return false;
    }
  }
  if (!accountId) return false;
  const now = utcNowIso();
  const res = await fetch(supabaseRestUrl(env, 'integration_accounts', { id: `eq.${accountId}` }), {
    method: 'PATCH',
    headers: supabaseHeaders(env, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status: 'needs_reauth', updated_at: now }),
  });
  try {
    await fetch(supabaseRestUrl(env, 'integration_sync_state', { on_conflict: 'provider' }), {
      method: 'POST',
      headers: supabaseHeaders(env, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify({ provider, last_error: reason, updated_at: now }),
    });
  } catch {
    // ignore
  }
  return res.ok;
}

/** Upsert account + encrypted tokens after OAuth code exchange (WHOOP reconnect). */
export async function persistOAuthTokens(env, provider, payload) {
  if (!supabaseConfigured(env) || !String(env.INTEGRATION_ENCRYPTION_KEY || '').trim()) {
    return false;
  }
  const accessToken = payload?.accessToken;
  if (!accessToken) return false;
  const now = utcNowIso();
  const subject = String(payload.providerSubject || `${provider}-user`);
  const scopes = Array.isArray(payload.scopes) ? payload.scopes : [];
  const expiresAt = payload.expiresIn
    ? new Date(Date.now() + Number(payload.expiresIn) * 1000).toISOString()
    : null;

  let accountId = null;
  const lookup = await fetch(
    supabaseRestUrl(env, 'integration_accounts', {
      select: 'id',
      provider: `eq.${provider}`,
      limit: '1',
    }),
    { headers: supabaseHeaders(env) }
  );
  if (lookup.ok) {
    const rows = await lookup.json();
    accountId = rows?.[0]?.id || null;
  }

  const accountPayload = {
    provider,
    provider_subject: subject,
    status: 'connected',
    scopes,
    last_synced_at: now,
    updated_at: now,
  };

  if (accountId) {
    const patch = await fetch(
      supabaseRestUrl(env, 'integration_accounts', { id: `eq.${accountId}` }),
      {
        method: 'PATCH',
        headers: supabaseHeaders(env, {
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        }),
        body: JSON.stringify(accountPayload),
      }
    );
    if (!patch.ok) return false;
  } else {
    const create = await fetch(supabaseRestUrl(env, 'integration_accounts'), {
      method: 'POST',
      headers: supabaseHeaders(env, {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
      body: JSON.stringify(accountPayload),
    });
    if (!create.ok) return false;
    const created = await create.json();
    accountId = created?.[0]?.id;
    if (!accountId) return false;
  }

  return saveTokens(env, { id: accountId }, accessToken, payload.refreshToken || '', expiresAt);
}

async function acquireTokenRefreshLock(env, provider) {
  if (!supabaseConfigured(env) || !provider) return true;
  const now = Date.now();
  const lockUntil = new Date(now + TOKEN_LOCK_TTL_MS).toISOString();
  const lockValue = `${TOKEN_LOCK_PREFIX}${lockUntil}`;
  try {
    const lookup = await fetch(
      supabaseRestUrl(env, 'integration_sync_state', {
        select: 'provider,cursor,updated_at',
        provider: `eq.${provider}`,
        limit: '1',
      }),
      { headers: supabaseHeaders(env) }
    );
    if (lookup.ok) {
      const rows = await lookup.json();
      const cursor = String(rows?.[0]?.cursor || '');
      if (cursor.startsWith(TOKEN_LOCK_PREFIX)) {
        const heldUntil = Date.parse(cursor.slice(TOKEN_LOCK_PREFIX.length));
        if (Number.isFinite(heldUntil) && heldUntil > now) return false;
      }
    }
    const res = await fetch(
      supabaseRestUrl(env, 'integration_sync_state', { on_conflict: 'provider' }),
      {
        method: 'POST',
        headers: supabaseHeaders(env, {
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify({
          provider,
          cursor: lockValue,
          updated_at: utcNowIso(),
        }),
      }
    );
    return res.ok || res.status >= 500;
  } catch {
    return true;
  }
}

async function releaseTokenRefreshLock(env, provider) {
  if (!supabaseConfigured(env) || !provider) return;
  try {
    const lookup = await fetch(
      supabaseRestUrl(env, 'integration_sync_state', {
        select: 'cursor',
        provider: `eq.${provider}`,
        limit: '1',
      }),
      { headers: supabaseHeaders(env) }
    );
    if (!lookup.ok) return;
    const rows = await lookup.json();
    const cursor = String(rows?.[0]?.cursor || '');
    if (!cursor.startsWith(TOKEN_LOCK_PREFIX)) return;
    await fetch(supabaseRestUrl(env, 'integration_sync_state', { provider: `eq.${provider}` }), {
      method: 'PATCH',
      headers: supabaseHeaders(env, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ cursor: null, updated_at: utcNowIso() }),
    });
  } catch {
    // ignore
  }
}

async function refreshWhoop(env, refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: String(env.WHOOP_CLIENT_ID || '').trim(),
    client_secret: String(env.WHOOP_CLIENT_SECRET || '').trim(),
    scope: 'offline',
  });
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const err = new Error(`whoop_refresh_${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function refreshWithings(env, refreshToken) {
  const body = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: String(env.WITHINGS_CLIENT_ID || '').trim(),
    client_secret: String(env.WITHINGS_CLIENT_SECRET || '').trim(),
  });
  const res = await fetch(WITHINGS_TOKEN_URL, { method: 'POST', body });
  if (!res.ok) {
    const err = new Error(`withings_refresh_${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  if (data.status !== 0) throw new Error(data.error || 'withings_refresh_failed');
  const tokenBody = data.body || {};
  return {
    access_token: tokenBody.access_token,
    refresh_token: tokenBody.refresh_token || refreshToken,
    expires_in: tokenBody.expires_in,
  };
}

async function decryptTokenBundle(env, tokenRow) {
  const encKey = env.INTEGRATION_ENCRYPTION_KEY;
  if (!encKey || !tokenRow) return null;
  try {
    return {
      accessToken: tokenRow.encrypted_access_token
        ? await fernetDecrypt(tokenRow.encrypted_access_token, encKey)
        : null,
      refreshToken: tokenRow.encrypted_refresh_token
        ? await fernetDecrypt(tokenRow.encrypted_refresh_token, encKey)
        : null,
      expiresAt: tokenRow.expires_at,
      updatedAt: tokenRow.updated_at,
    };
  } catch {
    return null;
  }
}

async function getValidAccessToken(env, provider, { forceRefresh = false } = {}) {
  const account = await getConnectedAccount(env, provider);
  if (!account) return null;
  if (!String(env.INTEGRATION_ENCRYPTION_KEY || '').trim()) return null;

  let tokenRow = await getTokenRow(env, account.id);
  let bundle = await decryptTokenBundle(env, tokenRow);
  if (!bundle) return null;

  const originalUpdatedAt = bundle.updatedAt;
  if (bundle.accessToken && !expiresSoon(bundle.expiresAt) && !forceRefresh) {
    return bundle.accessToken;
  }
  if (!bundle.refreshToken) return null;

  const lockHeld = await acquireTokenRefreshLock(env, provider);
  if (!lockHeld) {
    await sleep(750);
    tokenRow = await getTokenRow(env, account.id);
    bundle = await decryptTokenBundle(env, tokenRow);
    if (bundle?.accessToken && !expiresSoon(bundle.expiresAt)) {
      if (forceRefresh && bundle.updatedAt === originalUpdatedAt) return null;
      return bundle.accessToken;
    }
    return null;
  }

  try {
    tokenRow = await getTokenRow(env, account.id);
    bundle = await decryptTokenBundle(env, tokenRow);
    if (!bundle) return null;
    if (bundle.accessToken && !expiresSoon(bundle.expiresAt) && !forceRefresh) {
      return bundle.accessToken;
    }
    if (
      forceRefresh &&
      bundle.accessToken &&
      !expiresSoon(bundle.expiresAt) &&
      bundle.updatedAt &&
      bundle.updatedAt !== originalUpdatedAt
    ) {
      return bundle.accessToken;
    }
    if (!bundle.refreshToken) return null;

    const seenUpdatedAt = bundle.updatedAt;
    let refreshed;
    try {
      refreshed =
        provider === 'whoop'
          ? await refreshWhoop(env, bundle.refreshToken)
          : await refreshWithings(env, bundle.refreshToken);
    } catch (error) {
      if (error?.status === 400 || error?.status === 401) {
        const racedRow = await getTokenRow(env, account.id);
        const raced = await decryptTokenBundle(env, racedRow);
        if (raced?.updatedAt && raced.updatedAt !== seenUpdatedAt) {
          if (raced.accessToken && !expiresSoon(raced.expiresAt)) return raced.accessToken;
        }
        await markProviderNeedsReauth(env, provider, `refresh_http_${error.status}`);
      }
      return null;
    }

    const newAccess = refreshed.access_token;
    if (!newAccess) return null;
    const newRefresh = refreshed.refresh_token || bundle.refreshToken;
    const newExpires = refreshed.expires_in
      ? new Date(Date.now() + Number(refreshed.expires_in) * 1000).toISOString()
      : null;
    await saveTokens(env, account, newAccess, newRefresh, newExpires);
    return newAccess;
  } finally {
    await releaseTokenRefreshLock(env, provider);
  }
}

function recentWhoopQuery(limit = 10, days = 4) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    limit: String(limit),
    start: start.toISOString().replace(/\.\d{3}Z$/, '.000Z'),
    end: end.toISOString().replace(/\.\d{3}Z$/, '.000Z'),
  });
  return `?${params}`;
}

function recordSortKey(record) {
  for (const key of ['updated_at', 'created_at', 'start', 'end']) {
    const value = record?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function pickScoredRecord(records, { preferNonNap = false } = {}) {
  const ordered = [...(records || [])].sort((a, b) =>
    recordSortKey(b).localeCompare(recordSortKey(a))
  );
  let candidates = ordered;
  if (preferNonNap) {
    const nonNaps = ordered.filter(r => !r.nap);
    if (nonNaps.length) candidates = nonNaps;
  }
  for (const record of candidates) {
    if (record.score_state === 'SCORED' && record.score) return record;
  }
  for (const record of candidates) {
    if (record.score) return record;
  }
  return null;
}

function pickActiveCycleRecord(records) {
  const ordered = [...(records || [])].sort((a, b) =>
    recordSortKey(b).localeCompare(recordSortKey(a))
  );
  const today = todayUtc();
  for (const record of ordered) {
    if (record.end) continue;
    if (record.score?.strain != null) return record;
  }
  for (const record of ordered) {
    if (String(record.start || '').startsWith(today) && record.score?.strain != null) {
      return record;
    }
  }
  for (const record of ordered) {
    if (record.score?.strain != null) return record;
  }
  return pickScoredRecord(records);
}

function recordDate(record) {
  if (!record) return null;
  for (const key of ['end', 'start', 'updated_at', 'created_at']) {
    const value = record[key];
    if (typeof value === 'string' && value.length >= 10) return value.slice(0, 10);
  }
  return null;
}

async function whoopGet(accessToken, path) {
  const res = await fetch(`${WHOOP_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = new Error(`whoop_http_${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function fetchWhoopSummary(accessToken) {
  const query = recentWhoopQuery();
  const summary = {
    date: todayUtc(),
    sleep_score: null,
    recovery_score: null,
    strain: null,
    resting_heart_rate: null,
    hrv_trend: null,
    weight_trend: null,
    source_status: 'synced',
    errors: [],
  };
  const recordDates = [];

  const [recoveryResult, cyclesResult, sleepResult] = await Promise.allSettled([
    whoopGet(accessToken, `/recovery${query}`),
    whoopGet(accessToken, `/cycle${query}`),
    whoopGet(accessToken, `/activity/sleep${query}`),
  ]);

  if (recoveryResult.status === 'fulfilled') {
    const record = pickScoredRecord(recoveryResult.value?.records || []);
    if (record) {
      const d = recordDate(record);
      if (d) recordDates.push(d);
      const score = record.score || {};
      summary.recovery_score = score.recovery_score ?? null;
      summary.resting_heart_rate = score.resting_heart_rate ?? null;
      const hrv = score.hrv_rmssd_milli;
      if (typeof hrv === 'number') summary.hrv_trend = hrv >= 50 ? 'stable' : 'low';
    }
  } else {
    summary.errors.push(recoveryResult.reason?.message || 'whoop_recovery_error');
  }

  if (cyclesResult.status === 'fulfilled') {
    const record = pickActiveCycleRecord(cyclesResult.value?.records || []);
    if (record) {
      const d = recordDate(record);
      if (d) recordDates.push(d);
      const strain = record.score?.strain;
      if (strain != null) summary.strain = Math.round(Number(strain) * 10) / 10;
    }
  } else {
    summary.errors.push(cyclesResult.reason?.message || 'whoop_cycle_error');
  }

  if (sleepResult.status === 'fulfilled') {
    const record = pickScoredRecord(sleepResult.value?.records || [], { preferNonNap: true });
    if (record) {
      const d = recordDate(record);
      if (d) recordDates.push(d);
      const performance = record.score?.sleep_performance_percentage;
      if (performance != null) summary.sleep_score = Math.round(Number(performance));
    }
  } else {
    summary.errors.push(sleepResult.reason?.message || 'whoop_sleep_error');
  }

  if (recordDates.length) summary.date = recordDates.sort().at(-1);
  return summary;
}

function decodeMeasureAmount(measure) {
  if (measure?.value == null) return null;
  const unit = measure.unit || 0;
  return Number(measure.value) * 10 ** Number(unit);
}

function formatWeightTrend(measures) {
  const weight = measures[1];
  if (weight == null) return null;
  const parts = [`${weight.toFixed(1)} kg`];
  const muscleMass = measures[76];
  const fatRatio = measures[6];
  const fatMass = measures[8];
  if (weight > 0 && muscleMass != null) {
    const musclePct = (muscleMass / weight) * 100;
    if (musclePct >= 20 && musclePct <= 95) parts.push(`${musclePct.toFixed(1)}% muscle`);
  }
  let fatPct = fatRatio;
  if ((fatPct == null || fatPct < 3 || fatPct > 75) && weight > 0 && fatMass != null) {
    fatPct = (fatMass / weight) * 100;
  }
  if (fatPct != null && fatPct >= 3 && fatPct <= 75) {
    parts.push(`${Number(fatPct).toFixed(1)}% fat`);
  }
  return parts.join(' · ');
}

async function fetchWithingsSummary(accessToken) {
  const enddate = Math.floor(Date.now() / 1000);
  const startdate = enddate - 7 * 24 * 3600;
  const body = new URLSearchParams({
    action: 'getmeas',
    category: '1',
    startdate: String(startdate),
    enddate: String(enddate),
  });
  const res = await fetch(WITHINGS_MEASURE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body,
  });
  const summary = {
    date: todayUtc(),
    sleep_score: null,
    recovery_score: null,
    strain: null,
    resting_heart_rate: null,
    hrv_trend: null,
    weight_trend: null,
    source_status: 'synced',
  };
  if (!res.ok) {
    summary.source_status = 'partial';
    return summary;
  }
  const payload = await res.json();
  if (payload.status !== 0) {
    summary.source_status = 'partial';
    return summary;
  }
  const groups = [...(payload.body?.measuregrps || [])].sort(
    (a, b) => (b.date || 0) - (a.date || 0)
  );
  for (const group of groups) {
    const measures = {};
    for (const measure of group.measures || []) {
      const amount = decodeMeasureAmount(measure);
      if (amount != null && measure.type != null) measures[Number(measure.type)] = amount;
    }
    if (measures[1] != null) {
      summary.weight_trend = formatWeightTrend(measures);
      break;
    }
  }
  if (!summary.weight_trend && groups.length) summary.source_status = 'partial';
  return summary;
}

function whoopHasMetrics(summary) {
  return ['sleep_score', 'recovery_score', 'strain', 'resting_heart_rate'].some(
    key => summary?.[key] != null
  );
}

async function fetchExistingRow(env, dateValue) {
  const table = String(env.SUPABASE_HEALTH_TABLE || 'health_vitals_daily').trim();
  const res = await fetch(
    supabaseRestUrl(env, table, {
      select:
        'date,sleep_score,recovery_score,strain,resting_heart_rate,hrv_trend,weight_trend,source_status',
      date: `eq.${dateValue}`,
      limit: '1',
    }),
    { headers: supabaseHeaders(env) }
  );
  if (!res.ok) return {};
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : {};
}

async function upsertHealthSummary(env, row) {
  const table = String(env.SUPABASE_HEALTH_TABLE || 'health_vitals_daily').trim();
  const dateValue = row.date || todayUtc();
  const existing = await fetchExistingRow(env, dateValue);
  const mergeFields = [
    'sleep_score',
    'recovery_score',
    'strain',
    'resting_heart_rate',
    'hrv_trend',
    'weight_trend',
  ];
  const payload = {
    date: dateValue,
    sleep_score: row.sleep_score ?? null,
    recovery_score: row.recovery_score ?? null,
    strain: row.strain ?? null,
    resting_heart_rate: row.resting_heart_rate ?? null,
    hrv_trend: row.hrv_trend ?? null,
    weight_trend: row.weight_trend ?? null,
    source_status: row.source_status || 'synced',
    last_synced_at: utcNowIso(),
    updated_at: utcNowIso(),
  };
  for (const field of mergeFields) {
    if (payload[field] == null && existing[field] != null) payload[field] = existing[field];
  }
  if (payload.source_status === 'partial' || existing.source_status === 'partial') {
    // keep partial unless both providers later mark synced by caller
  }
  const res = await fetch(supabaseRestUrl(env, table, { on_conflict: 'date' }), {
    method: 'POST',
    headers: supabaseHeaders(env, {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export function authorizeCron(request, env) {
  const secret =
    String(env.CRON_SECRET || '').trim() || String(env.INTEGRATION_SYNC_ADMIN_TOKEN || '').trim();
  if (!secret) return false;
  const auth = String(request.headers.get('authorization') || '').trim();
  return auth === `Bearer ${secret}`;
}

export function isHealthSummaryStale(summary, maxAgeMs = STALE_MS) {
  const last = Date.parse(summary?.lastSyncedAt || summary?.data?.lastSyncedAt || '');
  if (!Number.isFinite(last)) return true;
  return Date.now() - last >= maxAgeMs;
}

export async function syncConnectedHealthProviders(env) {
  if (!supabaseConfigured(env)) {
    return { success: false, saved: false, message: 'Supabase not configured', results: [] };
  }
  if (!String(env.INTEGRATION_ENCRYPTION_KEY || '').trim()) {
    return {
      success: false,
      saved: false,
      message: 'INTEGRATION_ENCRYPTION_KEY missing on worker',
      results: [],
    };
  }

  const merged = {
    date: todayUtc(),
    sleep_score: null,
    recovery_score: null,
    strain: null,
    resting_heart_rate: null,
    hrv_trend: null,
    weight_trend: null,
    source_status: 'synced',
  };
  const results = [];
  let whoopOk = false;
  let withingsOk = false;

  let whoopToken = await getValidAccessToken(env, 'whoop');
  if (whoopToken) {
    try {
      let summary = await fetchWhoopSummary(whoopToken);
      const authErrors = (summary.errors || []).some(
        err => String(err).includes('whoop_http_401') || String(err).includes('whoop_http_403')
      );
      if (!whoopHasMetrics(summary) && authErrors) {
        const retryToken = await getValidAccessToken(env, 'whoop', { forceRefresh: true });
        if (retryToken && retryToken !== whoopToken) {
          whoopToken = retryToken;
          summary = await fetchWhoopSummary(whoopToken);
        }
      }
      if (whoopHasMetrics(summary)) {
        for (const key of Object.keys(merged)) {
          if (summary[key] != null) merged[key] = summary[key];
        }
        whoopOk = true;
        results.push({
          provider: 'whoop',
          status: 'live',
          date: summary.date,
          metrics: {
            sleep_score: summary.sleep_score,
            recovery_score: summary.recovery_score,
            strain: summary.strain,
            resting_heart_rate: summary.resting_heart_rate,
          },
        });
      } else {
        const stillAuth = (summary.errors || []).some(
          err => String(err).includes('whoop_http_401') || String(err).includes('whoop_http_403')
        );
        results.push({
          provider: 'whoop',
          status: stillAuth ? 'needs_reauth' : 'degraded',
          message: stillAuth
            ? 'WHOOP grant invalid — reconnect once via edge OAuth (permanent Worker callback).'
            : 'WHOOP returned no scored metrics',
          errors: summary.errors || [],
        });
        merged.source_status = 'partial';
      }
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        const retryToken = await getValidAccessToken(env, 'whoop', { forceRefresh: true });
        if (retryToken && retryToken !== whoopToken) {
          try {
            const summary = await fetchWhoopSummary(retryToken);
            if (whoopHasMetrics(summary)) {
              for (const key of Object.keys(merged)) {
                if (summary[key] != null) merged[key] = summary[key];
              }
              whoopOk = true;
              results.push({
                provider: 'whoop',
                status: 'live',
                date: summary.date,
                metrics: {
                  sleep_score: summary.sleep_score,
                  recovery_score: summary.recovery_score,
                  strain: summary.strain,
                  resting_heart_rate: summary.resting_heart_rate,
                },
              });
            }
          } catch {
            // fall through
          }
        }
      }
      if (!whoopOk) {
        results.push({
          provider: 'whoop',
          status: error?.status === 401 ? 'needs_reauth' : 'degraded',
          message: error?.message || 'whoop_sync_failed',
        });
        merged.source_status = 'partial';
      }
    }
  } else {
    const account = await getConnectedAccount(env, 'whoop');
    if (account) {
      results.push({
        provider: 'whoop',
        status: 'degraded',
        message: 'WHOOP token refresh deferred; hourly keepalive will retry.',
      });
      merged.source_status = 'partial';
    } else {
      // Account may be needs_reauth — surface that clearly for monitor UI.
      try {
        const res = await fetch(
          supabaseRestUrl(env, 'integration_accounts', {
            select: 'status',
            provider: 'eq.whoop',
            limit: '1',
          }),
          { headers: supabaseHeaders(env) }
        );
        if (res.ok) {
          const rows = await res.json();
          if (rows?.[0]?.status === 'needs_reauth') {
            results.push({
              provider: 'whoop',
              status: 'needs_reauth',
              message:
                'WHOOP needs one reconnect via edge OAuth. After that, hourly keepalive prevents repeats.',
            });
            merged.source_status = 'partial';
          }
        }
      } catch {
        // ignore
      }
    }
  }

  const withingsToken = await getValidAccessToken(env, 'withings');
  if (withingsToken) {
    try {
      const summary = await fetchWithingsSummary(withingsToken);
      if (summary.weight_trend) {
        merged.weight_trend = summary.weight_trend;
        withingsOk = true;
        results.push({
          provider: 'withings',
          status: 'live',
          metrics: { weight_trend: summary.weight_trend },
        });
      } else {
        results.push({
          provider: 'withings',
          status: 'degraded',
          message: 'Withings returned no weight metrics',
        });
        merged.source_status = 'partial';
      }
    } catch (error) {
      results.push({
        provider: 'withings',
        status: 'degraded',
        message: error?.message || 'withings_sync_failed',
      });
      merged.source_status = 'partial';
    }
  }

  if (whoopOk && withingsOk) merged.source_status = 'synced';
  else if (whoopOk || withingsOk) merged.source_status = 'partial';

  if (!results.length) {
    return {
      success: true,
      saved: false,
      message: 'No health providers connected',
      results,
      summary: merged,
    };
  }

  const shouldSave = whoopOk || withingsOk;
  let saved = false;
  if (shouldSave) {
    saved = await upsertHealthSummary(env, merged);
  }

  return {
    success: true,
    saved,
    message: saved ? 'Health vitals synced on Cloudflare edge' : 'Sync attempted without save',
    results,
    summary: merged,
    host: 'cloudflare-worker',
    timestamp: utcNowIso(),
  };
}

export async function maybeSyncStaleHealth(_env, _summary) {
  // Public summary GETs must NOT refresh WHOOP tokens. Concurrent Pages visitors
  // previously stampeded refresh-token rotation and forced reauth. Keepalive is
  // owned exclusively by Worker cron + /api/cron/health-vitals-sync.
  return { attempted: false, synced: false, reason: 'summary_sync_disabled' };
}
