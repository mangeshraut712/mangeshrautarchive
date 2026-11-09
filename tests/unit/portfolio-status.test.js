import test from 'node:test';
import assert from 'node:assert/strict';
import { portfolioStatus, STATUS_SERVICES } from '../../src/js/utils/portfolio-status.js';
const now = Date.parse('2026-11-09T12:00:00Z');
const data = () => ({
  status: 'ok',
  timestamp: new Date(now).toISOString(),
  checks: STATUS_SERVICES.map(service => ({ id: service.id, status: 'healthy', latency_ms: 10 })),
});
test('only a complete fresh set of probes can report all services operational', () => {
  assert.equal(portfolioStatus(data(), now).state, 'healthy');
  const missing = data();
  missing.checks.pop();
  assert.equal(portfolioStatus(missing, now).state, 'unknown');
  assert.equal(portfolioStatus(null, now).state, 'unknown');
  assert.equal(portfolioStatus({ ...data(), checks: {} }, now).state, 'unknown');
});
test('stale and future snapshots cannot report green availability', () => {
  assert.equal(portfolioStatus(data(), now + 121000).state, 'unknown');
  assert.equal(portfolioStatus(data(), now - 31000).state, 'unknown');
});
test('failures and broader API warnings are preserved, configuration checks do not replace probes', () => {
  const value = data();
  value.checks[0].status = 'unhealthy';
  assert.equal(portfolioStatus(value, now).state, 'unhealthy');
  value.checks[0].status = 'degraded';
  assert.equal(portfolioStatus(value, now).state, 'degraded');
  assert.equal(portfolioStatus({ ...data(), status: 'degraded' }, now).state, 'degraded');
  assert.equal(
    portfolioStatus({ ...data(), checks: [{ id: 'openrouter', status: 'healthy' }] }, now).state,
    'unknown'
  );
});
