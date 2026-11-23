// One external message per confirmed submission; shared database enforces the daily budget.
export async function reserveNotification(env, channel, destination, confirmed) {
  if (
    !confirmed ||
    env.PORTFOLIO_LOCAL_ONLY === '1' ||
    env.CONTACT_NOTIFICATIONS_ENABLED !== 'true'
  )
    return false;
  const hash = [
    ...new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${channel}:${destination}`))
    ),
  ]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  if (
    !String(env.CONTACT_NOTIFICATION_ALLOWLIST || '')
      .split(',')
      .map(value => value.trim())
      .includes(hash)
  )
    return false;
  const limit = Number(env.CONTACT_NOTIFICATION_DAILY_LIMIT);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !env.SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY
  )
    return false;
  try {
    const response = await fetch(
      `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/reserve_contact_notification`,
      {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient_hash: hash, daily_limit: limit }),
        signal: AbortSignal.timeout(5000),
      }
    );
    return response.ok && (await response.json()) === true;
  } catch {
    return false;
  }
}
