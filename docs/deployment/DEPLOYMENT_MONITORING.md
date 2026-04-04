# Deployment Monitoring & Verification System

## Overview

This system ensures both GitHub Pages and Vercel deployments are healthy, synchronized, and monitored in real-time through the Monitor Center interface.

## Features Implemented

### 1. **Real-time Deployment Health Monitoring**

- **GitHub Pages**: Monitors `https://mangeshraut712.github.io/mangeshrautarchive/`
- **Vercel**: Monitors `https://mangeshrautarchive.vercel.app/`
- **Health Checks**: HTTP status, response time, availability
- **Automatic Updates**: Refreshes every 5 minutes in the UI

### 2. **Deployment Synchronization Verification**

- **Version Comparison**: Compares `manifest.json` versions between deployments
- **Sync Status**: Tracks whether deployments are in sync or out of sync
- **Unknown State Handling**: Properly handles deployments that haven't updated yet

### 3. **Alert System**

- **Deployment Failures**: Alerts when GitHub Pages or Vercel become unavailable
- **Sync Issues**: Alerts when deployments diverge from expected state
- **Configurable**: Uses `DEPLOYMENT_ALERT_WEBHOOK` environment variable
- **Multiple Channels**: Supports Slack webhooks and console logging

### 4. **Comprehensive Verification Script**

- **Automated Testing**: `./verify-deployments.sh` script
- **Health Checks**: Verifies both deployments are accessible
- **API Validation**: Checks Vercel API health endpoint
- **Sync Verification**: Ensures version consistency
- **Exit Codes**: Returns appropriate status for CI/CD integration

### 5. **Monitor Center Integration**

- **Deployment Status Cards**: Visual indicators in the UI
- **Real-time Updates**: Automatic refresh of deployment status
- **Status Indicators**: Color-coded health status (Healthy/Degraded/Unhealthy)
- **Response Times**: Shows latency for each deployment

## API Endpoints

### Deployment Health

```
GET /api/deployments/health
```

Returns health status of all deployments:

```json
{
  "success": true,
  "deployments": {
    "github_pages": {
      "status": "healthy|degraded|unhealthy",
      "response_time": 241.612,
      "http_status": 200,
      "last_checked": "2026-04-04T11:40:56.121265"
    },
    "vercel": {
      "status": "healthy|degraded|unhealthy",
      "response_time": 176.25,
      "http_status": 200,
      "version": "3.0.0",
      "last_checked": "2026-04-04T11:40:56.121265"
    },
    "sync": {
      "status": "synced|out_of_sync|unknown",
      "github_version": "3.0.0",
      "vercel_version": "3.0.0",
      "last_checked": "2026-04-04T11:40:56.121265"
    }
  }
}
```

### Deployment Logs

```
GET /api/deployments/logs
```

Returns historical deployment status data.

## Usage

### Starting the Monitor

```bash
./start-monitor.sh
```

### Running Verification

```bash
./verify-deployments.sh
```

### Accessing Monitor Center

Navigate to `monitor.html` and view the "Deployment Health" section.

## Environment Variables

### Alert Configuration

```env
DEPLOYMENT_ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Deployment Process Verification

### Idempotent Deployments

- GitHub Actions workflow ensures consistent builds
- Vercel deployments are triggered by git pushes
- Version information is tracked via `manifest.json`

### Synchronization

- Both deployments use the same codebase
- Version field ensures consistency
- Alert system notifies of discrepancies

### Monitoring Integration

- Real-time status in Monitor Center
- Automated health checks
- Historical data tracking
- Alert notifications for issues

## Status Indicators

| Status    | Color  | Meaning                               |
| --------- | ------ | ------------------------------------- |
| Healthy   | Green  | Deployment responding normally        |
| Degraded  | Yellow | Deployment responding but with issues |
| Unhealthy | Red    | Deployment not responding             |
| Unknown   | Gray   | Status not yet determined             |

## Alert Examples

### Deployment Down Alert

```
🚨 DEPLOYMENT ALERT
🚨 GITHUB_PAGES deployment is unhealthy: Connection timeout
```

### Sync Issue Alert

```
🚨 DEPLOYMENT ALERT
⚠️ Deployments are out of sync!
GitHub Pages: 3.0.0
Vercel: 3.0.1
```

This comprehensive system ensures both deployments remain healthy, synchronized, and immediately alerts the team of any issues, providing confidence in the deployment reliability and consistency.
