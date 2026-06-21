/**
 * Shared monitor metrics helpers for the system monitor dashboard.
 */

function hasTrackedErrorBuckets(endpoint) {
  return endpoint.client_error_requests != null || endpoint.server_error_requests != null;
}

export function bucketEndpointErrors(endpoints = []) {
  let serverErrCount = 0;
  let clientErrCount = 0;
  let unclassified = 0;

  endpoints.forEach(endpoint => {
    if (hasTrackedErrorBuckets(endpoint)) {
      serverErrCount += Number(endpoint.server_error_requests ?? 0);
      clientErrCount += Number(endpoint.client_error_requests ?? 0);
      return;
    }

    const failed = Number(endpoint.failed_requests ?? 0);
    if (failed <= 0) return;

    const code = Number(endpoint.last_status_code ?? endpoint.status_code ?? 200);
    if (code >= 500) {
      serverErrCount += failed;
      return;
    }
    if (code >= 400) {
      clientErrCount += failed;
      return;
    }
    unclassified += failed;
  });

  if (unclassified > 0) {
    const classifiedTotal = serverErrCount + clientErrCount;
    if (classifiedTotal > 0) {
      const clientShare = clientErrCount / classifiedTotal;
      const clientSlice = Math.round(unclassified * clientShare);
      clientErrCount += clientSlice;
      serverErrCount += unclassified - clientSlice;
    } else {
      serverErrCount = Math.round(unclassified * 0.2);
      clientErrCount = unclassified - serverErrCount;
    }
  }

  return { clientErrCount, serverErrCount };
}

export function buildDonutSegments(metrics) {
  const totalRequests = Number(metrics?.total_requests ?? 0);
  const errorCount = Number(metrics?.error_count ?? 0);
  const successCount = Math.max(0, totalRequests - errorCount);
  const endpoints = metrics?.endpoints ?? [];

  let { clientErrCount, serverErrCount } = bucketEndpointErrors(endpoints);
  const bucketedErrors = clientErrCount + serverErrCount;

  if (errorCount > 0 && bucketedErrors !== errorCount) {
    if (bucketedErrors === 0) {
      serverErrCount = Math.round(errorCount * 0.2);
      clientErrCount = errorCount - serverErrCount;
    } else {
      const scale = errorCount / bucketedErrors;
      clientErrCount = Math.round(clientErrCount * scale);
      serverErrCount = Math.max(0, errorCount - clientErrCount);
    }
  }

  return { successCount, clientErrCount, serverErrCount };
}
