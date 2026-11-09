/** Public probe semantics. Endpoint availability is not end-to-end transaction success. */
export const STATUS_SERVICES = [
  {
    id: 'github_pages',
    name: 'Portfolio website',
    group: 'Website',
    description: 'Availability of the published homepage on GitHub Pages.',
  },
  {
    id: 'github_repos',
    name: 'Projects',
    group: 'Website',
    description: 'The public repository feed used by the portfolio.',
  },
  {
    id: 'chat_health',
    name: 'AssistMe',
    group: 'Interactive services',
    description:
      'Chat health endpoint readiness. This check does not send a conversation or verify model inference.',
  },
  {
    id: 'lastfm',
    name: 'Now playing',
    group: 'Interactive services',
    description:
      'Availability of the recent-music endpoint. Audio previews depend on the music provider.',
  },
  {
    id: 'health_vitals',
    name: 'Health insights',
    group: 'Connected services',
    description:
      'Availability of the public health summary. Individual readings may have an earlier sync time.',
  },
  {
    id: 'integrations',
    name: 'Connected accounts',
    group: 'Connected services',
    description:
      'Availability of the integration-status endpoint, not the authorization state of every connected account.',
  },
];

export function probeState(value) {
  if (['healthy', 'ok', 'operational'].includes(value)) return 'healthy';
  if (['degraded', 'warning', 'partial'].includes(value)) return 'degraded';
  if (['unhealthy', 'error', 'failed', 'down', 'critical'].includes(value)) return 'unhealthy';
  return 'unknown';
}

export function portfolioStatus(data, now = Date.now()) {
  const timestamp = Date.parse(data?.timestamp);
  const fresh = Number.isFinite(timestamp) && now - timestamp <= 120000 && timestamp <= now + 30000;
  const checks = Array.isArray(data?.checks) ? data.checks : [];
  const services = STATUS_SERVICES.map(service => {
    const probe = checks.find(check => check?.id === service.id);
    return {
      ...service,
      state: fresh ? probeState(probe?.status) : 'unknown',
      detail: typeof probe?.detail === 'string' ? probe.detail : 'No probe result available.',
      latency:
        typeof probe?.latency_ms === 'number' &&
        Number.isFinite(probe.latency_ms) &&
        probe.latency_ms >= 0
          ? Math.round(probe.latency_ms)
          : null,
    };
  });
  const reported = fresh ? probeState(data?.status) : 'unknown';
  const states = services.map(service => service.state);
  const state = states.includes('unhealthy')
    ? 'unhealthy'
    : states.includes('degraded') || ['unhealthy', 'degraded'].includes(reported)
      ? 'degraded'
      : states.includes('unknown') || reported === 'unknown'
        ? 'unknown'
        : 'healthy';
  return { services, state, fresh, timestamp: Number.isFinite(timestamp) ? timestamp : null };
}
