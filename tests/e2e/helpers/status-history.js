import { STATUS_SERVICES } from '../../../src/js/utils/portfolio-status.js';
export function storedHistory() {
  const now = Date.now();
  const start = Math.floor(now / 300000) * 300000;
  const day = new Date(now).toISOString().slice(0, 10);
  return {
    generated_at: new Date(now).toISOString(),
    window_days: 90,
    interval_seconds: 300,
    services: STATUS_SERVICES.map(service => ({
      id: service.id,
      tracking_since: start,
      last_checked: now,
      samples: 2,
      expected: 3,
      uptime: 50,
      coverage: 66.6667,
      days: Array.from({ length: 90 }, (_, index) => ({
        day: new Date(Date.parse(day + 'T00:00:00Z') - (89 - index) * 86400000)
          .toISOString()
          .slice(0, 10),
        total: index === 89 ? 2 : 0,
        expected: index === 89 ? 3 : 0,
        healthy: index === 89 ? 1 : 0,
        degraded: 0,
        unhealthy: index === 89 ? 1 : 0,
        uptime: index === 89 ? 50 : null,
      })),
    })),
    active_incidents: [],
    incidents: [],
    next_cursor: null,
  };
}
