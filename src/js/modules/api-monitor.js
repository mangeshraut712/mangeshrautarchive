/**
 * ===================================
 * API HEALTH MONITOR & TESTER LOGIC
 * Enhanced Monitor System v2.0
 * ===================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Selectors
  const endpointsList = document.getElementById('endpoints-list');
  const auditLogsContainer = document.getElementById('audit-logs-container');
  const testForm = document.getElementById('endpoint-test-form');
  const resultArea = document.getElementById('test-result-area');
  const refreshBtn = document.getElementById('btn-refresh-monitor');
  const clearResultsBtn = document.getElementById('clear-results-btn');
  const shortcutsBtn = document.getElementById('shortcuts-btn');
  const keyboardShortcuts = document.getElementById('keyboard-shortcuts');
  const statAvgLatency = document.getElementById('stat-avg-latency');
  const statUptime = document.getElementById('stat-uptime');
  const statRoutesCount = document.getElementById('stat-routes-count');

  // UI State Management
  let isTesting = false;
  let backendAvailable = false;
  let lastHealthCheck = 0;
  let cachedEndpoints = null;
  let cachedLogs = null;
  let deploymentStatus = {
    github_pages: { status: 'unknown', lastChecked: null },
    vercel: { status: 'unknown', lastChecked: null },
    sync: { status: 'unknown', lastChecked: null },
  };

  // Enhanced Backend Health Check with timeout and retry
  const checkBackendHealth = async () => {
    const statusEl = document.getElementById('backend-status');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch('http://localhost:8000/', {
        signal: controller.signal,
        method: 'HEAD', // Use HEAD for faster health checks
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        statusEl.textContent = '✅ Online';
        statusEl.style.color = 'var(--monitor-success)';
        backendAvailable = true;
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const isOffline = error.name === 'AbortError' || error.message.includes('fetch');
      statusEl.textContent = isOffline
        ? '❌ Offline - Run ./start-monitor.sh'
        : `⚠️ Error: ${error.message}`;
      statusEl.style.color = 'var(--monitor-error)';
      backendAvailable = false;
      return false;
    }
  };

  // Deployment Health Checks
  const checkDeploymentHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/deployments/health');
      const data = await response.json();

      if (data.success) {
        deploymentStatus = data.deployments;
        updateDeploymentUI();
      }
    } catch (error) {
      console.error('Failed to check deployment health:', error);
      // Set all deployments as unknown if backend is unavailable
      deploymentStatus = {
        github_pages: { status: 'unknown', error: 'Backend unavailable' },
        vercel: { status: 'unknown', error: 'Backend unavailable' },
        sync: { status: 'unknown', error: 'Backend unavailable' },
      };
      updateDeploymentUI();
    }
  };

  const updateDeploymentUI = () => {
    // Update GitHub Pages status
    const githubDot = document.getElementById('github-pages-dot');
    const githubStatus = document.getElementById('github-pages-status');

    const githubData = deploymentStatus.github_pages || deploymentStatus.githubPages;
    githubDot.style.background = getStatusColor(githubData?.status);
    githubStatus.textContent = formatDeploymentStatus(githubData);

    // Update Vercel status
    const vercelDot = document.getElementById('vercel-dot');
    const vercelStatus = document.getElementById('vercel-status');

    const vercelData = deploymentStatus.vercel;
    vercelDot.style.background = getStatusColor(vercelData?.status);
    vercelStatus.textContent = formatDeploymentStatus(vercelData);

    // Update sync status
    const syncStatus = document.getElementById('deployment-sync-status');
    const syncData = deploymentStatus.sync;
    syncStatus.textContent = formatSyncStatus(syncData);
    syncStatus.style.color = getSyncColor(syncData?.status);
  };

  const getStatusColor = status => {
    switch (status) {
      case 'healthy':
        return 'var(--monitor-success)';
      case 'degraded':
        return 'var(--monitor-warning)';
      case 'unhealthy':
        return 'var(--monitor-error)';
      default:
        return 'var(--monitor-text-secondary)';
    }
  };

  const getSyncColor = status => {
    switch (status) {
      case 'synced':
        return 'var(--monitor-success)';
      case 'out_of_sync':
        return 'var(--monitor-error)';
      default:
        return 'var(--monitor-text-secondary)';
    }
  };

  const formatDeploymentStatus = deployment => {
    if (!deployment) return 'Unknown';
    if (deployment.status === 'healthy') {
      return `Healthy (${deployment.response_time || deployment.responseTime}ms)`;
    } else if (deployment.status === 'degraded') {
      return `Degraded (${deployment.http_status || 'N/A'})`;
    } else if (deployment.status === 'unhealthy') {
      return 'Unhealthy';
    } else {
      return 'Checking...';
    }
  };

  const formatSyncStatus = sync => {
    if (!sync) return 'Checking...';
    switch (sync.status) {
      case 'synced':
        return 'In Sync';
      case 'out_of_sync':
        return 'Out of Sync';
      case 'check_failed':
        return 'Check Failed';
      default:
        return 'Checking...';
    }
  };

  // Initialization
  const init = async () => {
    await checkBackendHealth();
    await checkDeploymentHealth();
    await refreshMonitor();
    setupEventListeners();

    // Set up periodic deployment checks every 5 minutes
    setInterval(checkDeploymentHealth, 300000);
  };

  // Event Listeners
  const setupEventListeners = () => {
    // Refresh Button
    refreshBtn.addEventListener('click', async e => {
      e.preventDefault();
      await refreshMonitor();
    });

    // Test Form Submission
    testForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (isTesting) return;
      handleManualTest();
    });

    // Clear Results Button
    clearResultsBtn.addEventListener('click', () => {
      resultArea.classList.remove('visible');
      clearResultsBtn.style.display = 'none';
      document.getElementById('test-result-content').innerHTML = '';
    });

    // Keyboard Shortcuts Tooltip
    shortcutsBtn.addEventListener('click', e => {
      e.stopPropagation();
      keyboardShortcuts.classList.toggle('show');
    });

    // Close shortcuts on outside click
    document.addEventListener('click', e => {
      if (!shortcutsBtn.contains(e.target) && !keyboardShortcuts.contains(e.target)) {
        keyboardShortcuts.classList.remove('show');
      }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', e => {
      // Ctrl/Cmd + Enter to run test
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isTesting) handleManualTest();
      }

      // Ctrl/Cmd + R to refresh (prevent default browser refresh)
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshMonitor();
      }

      // Escape to clear results
      if (e.key === 'Escape' && resultArea.classList.contains('visible')) {
        clearResultsBtn.click();
      }
    });

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle-monitor');
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }

    // Add loading states
    addLoadingStates();
  };

  const addLoadingStates = () => {
    // Add loading animation to refresh button
    refreshBtn.addEventListener('click', function () {
      const btn = this;
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }, 1000);
    });
  };

  // Main Refresh Logic
  const refreshMonitor = async () => {
    try {
      await Promise.all([fetchEndpoints(), fetchLogs()]);
    } catch (error) {
      console.error('Monitor refresh failed:', error);
    }
  };

  // Enhanced Endpoint Discovery with caching and error handling
  const fetchEndpoints = async () => {
    // Use cache if available and recent (5 minutes)
    const now = Date.now();
    if (cachedEndpoints && now - lastHealthCheck < 300000) {
      renderEndpoints(cachedEndpoints.endpoints);
      statRoutesCount.innerText = cachedEndpoints.count;
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('http://localhost:8000/api/health/endpoints', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        cachedEndpoints = data;
        lastHealthCheck = now;
        renderEndpoints(data.endpoints);
        statRoutesCount.innerText = data.count;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.warn('Endpoint discovery failed:', error);
      cachedEndpoints = null;

      if (error.name === 'AbortError') {
        endpointsList.innerHTML = `<div class="monitor-error">
          <i class="fas fa-clock"></i>
          <p>Request timed out</p>
          <small>Endpoint discovery took too long</small>
        </div>`;
      } else {
        endpointsList.innerHTML = `<div class="monitor-error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Backend unavailable</p>
          <small>Run <code>./start-monitor.sh</code> to enable monitoring</small>
        </div>`;
      }
    }
  };

  const renderEndpoints = endpoints => {
    endpointsList.innerHTML = '';
    endpoints.forEach(ep => {
      const item = document.createElement('div');
      item.className = 'endpoint-item';

      const methodClasses = {
        GET: 'method-get',
        POST: 'method-post',
        PUT: 'method-put',
        DELETE: 'method-delete',
      };

      const firstMethod = ep.methods[0] || 'GET';
      const methodClass = methodClasses[firstMethod] || 'method-get';

      item.innerHTML = `
                <div class="endpoint-info">
                    <span class="method-tag ${methodClass}">${firstMethod}</span>
                    <span class="endpoint-path">${ep.path}</span>
                </div>
                <button class="btn-sm-test" onclick="document.getElementById('test-url').value='${ep.path}'">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
      endpointsList.appendChild(item);
    });
  };

  // Enhanced Manual Test Handler with validation and better error handling
  const handleManualTest = async () => {
    if (isTesting) return;

    isTesting = true;
    const btn = document.getElementById('btn-test');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    btn.disabled = true;

    // Validate inputs
    const url = document.getElementById('test-url').value.trim();
    const method = document.getElementById('test-method').value;
    const authToken = document.getElementById('test-auth').value.trim();
    let body = null;

    if (!url) {
      displayTestResult({ success: false, error: 'URL is required' });
      resetTestButton(btn, originalText);
      return;
    }

    // Validate JSON body if provided
    const bodyText = document.getElementById('test-body').value.trim();
    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        displayTestResult({ success: false, error: 'Invalid JSON in request body' });
        resetTestButton(btn, originalText);
        return;
      }
    }

    const testData = {
      url: url.startsWith('http') ? url : url, // Allow full URLs or relative paths
      method: method,
      auth_token: authToken || null,
      body: body,
    };

    try {
      if (!backendAvailable) {
        throw new Error('Monitor backend is not available. Please start the server.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for tests

      const response = await fetch('http://localhost:8000/api/health/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      displayTestResult(data);
      await fetchLogs(); // Refresh history after successful test
    } catch (error) {
      let errorMessage = 'Test failed';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out (30s limit)';
      } else if (error.message) {
        errorMessage = error.message;
      }

      displayTestResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    } finally {
      resetTestButton(btn, originalText);
    }
  };

  const resetTestButton = (btn, originalText) => {
    isTesting = false;
    btn.innerHTML = originalText;
    btn.disabled = false;
  };

  const displayTestResult = data => {
    resultArea.classList.add('visible');
    const content = document.getElementById('test-result-content');
    clearResultsBtn.style.display = 'block';

    if (data.success) {
      const r = data.result;
      const timestamp = new Date().toLocaleTimeString();

      content.innerHTML = `
        <div class="test-result-header success">
          <div class="result-icon">✅</div>
          <div class="result-info">
            <div class="result-status">SUCCESS</div>
            <div class="result-details">
              HTTP ${r.status_code} • ${r.duration_ms}ms • ${timestamp}
            </div>
          </div>
        </div>
        <div class="response-section">
          <h4>Response Body</h4>
          <pre class="response-json">${JSON.stringify(data.raw_response, null, 2)}</pre>
        </div>
        <div class="response-meta">
          <div class="meta-item">
            <span class="meta-label">Request ID:</span>
            <span class="meta-value">${r.id || 'N/A'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Response Size:</span>
            <span class="meta-value">${r.response_size_kb || 0} KB</span>
          </div>
        </div>
      `;
    } else {
      const timestamp = data.timestamp
        ? new Date(data.timestamp).toLocaleTimeString()
        : new Date().toLocaleTimeString();

      content.innerHTML = `
        <div class="test-result-header error">
          <div class="result-icon">❌</div>
          <div class="result-info">
            <div class="result-status">FAILED</div>
            <div class="result-details">
              ${data.error || 'Unknown error'} • ${timestamp}
            </div>
          </div>
        </div>
        <div class="error-details">
          <p><strong>Error Details:</strong></p>
          <p style="color: var(--monitor-text-secondary); font-family: monospace; font-size: 0.9em;">
            ${data.error || 'Request failed without specific error details'}
          </p>
        </div>
      `;
    }

    // Auto-scroll to top of results
    resultArea.scrollTop = 0;

    // Add subtle animation
    content.style.opacity = '0';
    setTimeout(() => {
      content.style.transition = 'opacity 0.3s ease';
      content.style.opacity = '1';
    }, 50);
  };

  // Enhanced Audit Logs with caching and graceful degradation
  const fetchLogs = async () => {
    try {
      if (!backendAvailable) {
        renderLogs([]);
        calculateStats([]);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('http://localhost:8000/api/health/logs', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        cachedLogs = data.logs;
        renderLogs(data.logs);
        calculateStats(data.logs);
      } else {
        throw new Error('Invalid logs response');
      }
    } catch (error) {
      console.warn('Failed to fetch logs:', error);

      // Graceful degradation - use cached logs if available
      if (cachedLogs) {
        renderLogs(cachedLogs);
        calculateStats(cachedLogs);
      } else {
        renderLogs([]);
        calculateStats([]);
      }

      // Only show error if this is the first attempt and backend is available
      if (backendAvailable && !cachedLogs) {
        auditLogsContainer.innerHTML = `<div class="monitor-error" style="padding: 20px; text-align: center;">
          <i class="fas fa-history" style="opacity: 0.5;"></i>
          <p style="margin: 10px 0; color: var(--monitor-text-secondary);">Audit logs unavailable</p>
        </div>`;
      }
    }
  };

  const renderLogs = logs => {
    auditLogsContainer.innerHTML = '';

    if (!logs.length) {
      auditLogsContainer.innerHTML = `
        <div class="empty-logs">
          <i class="fas fa-history"></i>
          <p>No recent activity</p>
          <small>Test some endpoints to see activity here</small>
        </div>
      `;
      return;
    }

    logs.slice(0, 10).forEach(log => {
      // Show only last 10 entries
      const item = document.createElement('div');
      item.className = `log-item ${log.is_up ? 'success' : 'error'}`;

      const timeAgo = getTimeAgo(new Date(log.timestamp));

      // Truncate long URLs for display
      const displayUrl = log.url.length > 50 ? log.url.substring(0, 47) + '...' : log.url;

      item.innerHTML = `
        <div class="log-header">
          <div class="log-method-status">
            <span class="log-method">${log.method}</span>
            <span class="log-status-code ${log.is_up ? 'success' : 'error'}">${log.status_code || 'ERR'}</span>
          </div>
          <div class="log-timestamp">${timeAgo}</div>
        </div>
        <div class="log-url" title="${log.url}">${displayUrl}</div>
        <div class="log-metrics">
          <span class="metric-item">
            <i class="fas fa-clock"></i> ${log.duration_ms}ms
          </span>
          <span class="metric-item">
            <i class="fas fa-weight"></i> ${log.response_size_kb || 0}KB
          </span>
        </div>
        ${log.alert ? `<div class="log-alert"><i class="fas fa-exclamation-triangle"></i> ${log.alert}</div>` : ''}
      `;

      auditLogsContainer.appendChild(item);
    });
  };

  const getTimeAgo = date => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const calculateStats = logs => {
    if (!logs.length) return;

    const totalLatency = logs.reduce((acc, log) => acc + log.duration_ms, 0);
    const avgLatency = Math.round(totalLatency / logs.length);
    const uptime = Math.round((logs.filter(l => l.is_up).length / logs.length) * 100);

    statAvgLatency.innerText = `${avgLatency} ms`;
    statUptime.innerText = `${uptime}%`;

    // Update site dot
    const dot = document.getElementById('global-status-dot');
    const text = document.getElementById('global-status-text');

    if (uptime === 100) {
      dot.style.background = '#34c759';
      text.innerText = 'All Systems Operational';
    } else if (uptime > 80) {
      dot.style.background = '#ff9500';
      text.innerText = 'Degraded Performance Detected';
    } else {
      dot.style.background = '#ff3b30';
      text.innerText = 'Service Interruption Detected';
    }
  };

  // Run init
  init();
});
