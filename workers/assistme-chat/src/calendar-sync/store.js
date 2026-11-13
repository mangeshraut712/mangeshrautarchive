const TABLE = 'calendar_sync_sources';
const SAFE_SOURCE_ERRORS = new Set([
  'encryption_not_configured',
  'calendar_storage_unavailable',
  'source_busy',
  'source_lock_lost',
  'invalid_luma_feed',
  'invalid_ical_feed',
  'ical_date_missing',
  'ical_timezone_missing',
  'ical_uid_missing',
  'ical_recurrence_limit',
  'ical_item_limit',
  'invalid_provider_page',
  'provider_item_limit',
  'provider_page_cycle',
  'provider_page_limit',
  'provider_response_too_large',
  'google_token_missing',
  'google_sync_cursor_missing',
  'google_event_incomplete',
  'google_offline_consent_required',
  'reconnect_required',
]);
export function sourceErrorCode(error) {
  if (['OperationError', 'DataError', 'InvalidCharacterError'].includes(error?.name)) {
    return 'credential_decryption_failed';
  }
  const status = error?.providerStatus;
  if (status === 401 || status === 403) return 'reconnect_required';
  if (Number.isInteger(status) && status >= 300 && status <= 599) return `provider_http_${status}`;
  if (['AbortError', 'TimeoutError'].includes(error?.name)) return 'provider_timeout';
  if (error?.name === 'SyntaxError') return 'provider_invalid_payload';
  return SAFE_SOURCE_ERRORS.has(error?.message) ? error.message : 'refresh_failed';
}
export function configured(env) {
  return Boolean(
    env.SUPABASE_URL &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    env.INTEGRATION_ENCRYPTION_KEY &&
    env.CALENDAR_SYNC_OWNER_EMAILS
  );
}
export class SourceStore {
  constructor(env) {
    this.env = env;
  }
  async request(query = '', method = 'GET', body, prefer = 'return=representation') {
    const response = await fetch(
      `${this.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${TABLE}${query}`,
      {
        method,
        headers: {
          apikey: this.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: prefer,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(15_000),
      }
    );
    if (!response.ok) throw new Error('calendar_storage_unavailable');
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  }
  async list() {
    return this.request('?select=*&order=id&limit=100');
  }
  async get(id) {
    return (await this.request(`?id=eq.${encodeURIComponent(id)}&select=*`))[0] || null;
  }
  async ensure(id, provider, label) {
    await this.request(
      '',
      'POST',
      { id, provider, label },
      'resolution=ignore-duplicates,return=minimal'
    );
    return this.get(id);
  }
  async lock(id) {
    const source = await this.get(id);
    if (!source) throw new Error('source_not_found');
    const now = new Date().toISOString();
    const token = crypto.randomUUID();
    const rows = await this.request(
      `?id=eq.${encodeURIComponent(id)}&version=eq.${source.version}&or=(lock_until.is.null,lock_until.lt.${encodeURIComponent(now)})`,
      'PATCH',
      {
        version: source.version + 1,
        lock_token: token,
        lock_until: new Date(Date.now() + 600_000).toISOString(),
        last_attempt: now,
      }
    );
    if (!rows.length) throw Object.assign(new Error('source_busy'), { status: 409 });
    return rows[0];
  }
  async finish(source, patch) {
    const rows = await this.request(
      `?id=eq.${encodeURIComponent(source.id)}&version=eq.${source.version}&lock_token=eq.${source.lock_token}&lock_until=gt.${encodeURIComponent(new Date().toISOString())}`,
      'PATCH',
      { ...patch, version: source.version + 1, lock_token: null, lock_until: null }
    );
    if (!rows.length) throw Object.assign(new Error('source_lock_lost'), { status: 409 });
    return rows[0];
  }
  async mutate(id, fn) {
    const source = await this.lock(id);
    try {
      return await this.finish(source, await fn(source));
    } catch (error) {
      // A failed refresh updates health only: its previous successful snapshot stays intact.
      await this.finish(source, {
        error: sourceErrorCode(error),
      }).catch(() => {});
      throw error;
    }
  }
}
export function sourceHealth(source, privateView = false) {
  const stale =
    !source.last_success ||
    Date.now() - Date.parse(source.last_success) > 45 * 60_000 ||
    Boolean(source.error);
  return {
    id: source.id,
    provider: source.provider,
    lastSuccessAt: source.last_success,
    lastAttemptAt: source.last_attempt,
    stale,
    ...(privateView
      ? {
          label: source.label,
          error: source.error,
          calendars: (source.snapshot?.calendars || []).map(calendar => ({
            ...calendar,
            published: source.settings?.publicationEnabled !== false,
            publicationPolicy: source.provider === 'luma' ? 'nonprivate' : 'explicit-public-only',
          })),
        }
      : {}),
  };
}
