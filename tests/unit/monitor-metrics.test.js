import { describe, expect, it } from 'vitest';
import { bucketEndpointErrors, buildDonutSegments } from '../../src/js/utils/monitor-metrics.js';

describe('bucketEndpointErrors', () => {
  it('classifies server and client failures by last status code', () => {
    const result = bucketEndpointErrors([
      { failed_requests: 2, last_status_code: 503 },
      { failed_requests: 3, last_status_code: 404 },
    ]);

    expect(result).toEqual({ serverErrCount: 2, clientErrCount: 3 });
  });

  it('uses tracked client/server buckets when the backend provides them', () => {
    const result = bucketEndpointErrors([
      {
        failed_requests: 5,
        last_status_code: 200,
        client_error_requests: 2,
        server_error_requests: 3,
      },
    ]);

    expect(result).toEqual({ serverErrCount: 3, clientErrCount: 2 });
  });

  it('allocates failures with a successful latest probe when buckets are missing', () => {
    const result = bucketEndpointErrors([
      { failed_requests: 5, last_status_code: 200 },
      { failed_requests: 1, last_status_code: 500 },
    ]);

    expect(result.serverErrCount + result.clientErrCount).toBe(6);
    expect(result.serverErrCount).toBeGreaterThanOrEqual(1);
  });
});

describe('buildDonutSegments', () => {
  it('reconciles donut slices with aggregate error counts', () => {
    const segments = buildDonutSegments({
      total_requests: 100,
      error_count: 10,
      endpoints: [
        { failed_requests: 4, last_status_code: 500 },
        { failed_requests: 6, last_status_code: 200 },
      ],
    });

    expect(segments.successCount).toBe(90);
    expect(segments.clientErrCount + segments.serverErrCount).toBe(10);
  });

  it('falls back when endpoints are missing', () => {
    const segments = buildDonutSegments({
      total_requests: 20,
      error_count: 4,
      endpoints: [],
    });

    expect(segments.successCount).toBe(16);
    expect(segments.clientErrCount + segments.serverErrCount).toBe(4);
  });
});
