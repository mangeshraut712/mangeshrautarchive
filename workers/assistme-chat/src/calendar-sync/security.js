const encoder = new TextEncoder();
export const SESSION_COOKIE = '__Secure-calendar-owner';
export const OAUTH_COOKIE = '__Secure-calendar-oauth';

export function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
function unbase64(value) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}
export function randomToken() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}
export async function digest(value) {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}
async function encryptionKey(env, purpose) {
  if (!env.INTEGRATION_ENCRYPTION_KEY) throw new Error('encryption_not_configured');
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.INTEGRATION_ENCRYPTION_KEY),
    'HKDF',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode('calendar-sync-v1'),
      info: encoder.encode(purpose),
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
// Purpose-specific keys keep these new encrypted records separate from legacy Fernet records.
export async function seal(env, purpose, payload) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(env, purpose),
    encoder.encode(JSON.stringify(payload))
  );
  return `${base64url(iv)}.${base64url(new Uint8Array(ciphertext))}`;
}
export async function open(env, purpose, value) {
  const [iv, ciphertext] = String(value || '').split('.');
  const bytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unbase64(iv) },
    await encryptionKey(env, purpose),
    unbase64(ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(bytes));
}
export function cookieValue(request, name) {
  return (
    request.headers
      .get('cookie')
      ?.split(';')
      .map(v => v.trim())
      .find(v => v.startsWith(`${name}=`))
      ?.slice(name.length + 1) || ''
  );
}
export function cookie(name, value, maxAge, path = '/api/calendar-sync') {
  return `${name}=${value}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export function allowedOwner(env, email) {
  return String(env.CALENDAR_SYNC_OWNER_EMAILS || '')
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
    .includes(String(email || '').toLowerCase());
}
export async function ownerSession(request, env) {
  try {
    const data = await open(env, 'session', cookieValue(request, SESSION_COOKIE));
    return data.exp > Date.now() && allowedOwner(env, data.email) ? data : null;
  } catch {
    return null;
  }
}
export function requireCsrf(request, session) {
  if (
    !session ||
    request.headers.get('origin') !== new URL(request.url).origin ||
    request.headers.get('x-csrf-token') !== session.csrf
  ) {
    throw Object.assign(new Error('owner_csrf_required'), { status: 403 });
  }
}
export async function readJson(request, maxBytes = 2_000_000) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw Object.assign(new Error('json_required'), { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) throw Object.assign(new Error('body_required'), { status: 400 });
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBytes) {
      await reader.cancel();
      throw Object.assign(new Error('payload_too_large'), { status: 413 });
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw Object.assign(new Error('invalid_json'), { status: 400 });
  }
}
export async function fetchBounded(url, init = {}, maxBytes = 5_000_000) {
  const response = await fetch(url, {
    ...init,
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok)
    throw Object.assign(new Error(`provider_http_${response.status}`), {
      providerStatus: response.status,
    });
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('provider_response_too_large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}
