import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveNotification } from '../../workers/assistme-chat/src/notification-safety.js';

test('notifications require confirmation, allowlist, valid message units and durable quota', async t => {
  const destination = 'test-recipient';
  const digest = [
    ...new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`telegram:${destination}`))
    ),
  ]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  const env = {
    CONTACT_NOTIFICATIONS_ENABLED: 'true',
    CONTACT_NOTIFICATION_ALLOWLIST: digest,
    CONTACT_NOTIFICATION_DAILY_LIMIT: '2',
    SUPABASE_URL: 'https://database.invalid',
    SUPABASE_SERVICE_ROLE_KEY: 'test-only',
  };
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    calls++;
    assert.equal(JSON.parse(options.body).daily_limit, 2);
    return new Response(JSON.stringify(calls === 1));
  });
  assert.equal(await reserveNotification(env, 'telegram', destination, false), false);
  assert.equal(await reserveNotification(env, 'telegram', 'unapproved', true), false);
  assert.equal(
    await reserveNotification(
      { ...env, CONTACT_NOTIFICATION_DAILY_LIMIT: '1000' },
      'telegram',
      destination,
      true
    ),
    false
  );
  assert.equal(calls, 0);
  assert.equal(await reserveNotification(env, 'telegram', destination, true), true);
  assert.equal(await reserveNotification(env, 'telegram', destination, true), false);
  assert.equal(
    await reserveNotification({ ...env, PORTFOLIO_LOCAL_ONLY: '1' }, 'telegram', destination, true),
    false
  );
});

test('notification quota failure never permits an external send', async t => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('unavailable');
  });
  const destination = 'test-recipient';
  const digest = [
    ...new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`telegram:${destination}`))
    ),
  ]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  const env = {
    CONTACT_NOTIFICATIONS_ENABLED: 'true',
    CONTACT_NOTIFICATION_ALLOWLIST: digest,
    CONTACT_NOTIFICATION_DAILY_LIMIT: '2',
    SUPABASE_URL: 'https://database.invalid',
    SUPABASE_SERVICE_ROLE_KEY: 'test-only',
  };
  assert.equal(await reserveNotification(env, 'telegram', destination, true), false);
  assert.equal(globalThis.fetch.mock.callCount(), 1);
});
