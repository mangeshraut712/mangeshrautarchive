# API Monitor Center

A beautiful, Apple-inspired API monitoring and testing platform built into the portfolio.

## Features

- **Real-time Health Monitoring**: Track API endpoint status and performance
- **Manual Testing Interface**: Send custom HTTP requests with authentication
- **Audit Trail**: Complete history of all API interactions
- **Performance Insights**: Response time analytics and uptime tracking
- **Apple-inspired Design**: Matches the portfolio's premium aesthetic

## Quick Start

1. **Start the Monitor Backend**:

   ```bash
   ./start-monitor.sh
   ```

2. **Open the Monitor**:
   - Navigate to `monitor.html` in your portfolio
   - Or visit: `http://localhost:3000/monitor.html`

3. **Use the Interface**:
   - View discovered API endpoints in the right panel
   - Test endpoints manually using the left panel
   - Monitor performance metrics and audit logs

## Architecture

- **Frontend**: Vanilla JavaScript with modern async/await
- **Backend**: FastAPI (Python) with automatic health checking
- **Design**: Apple-inspired UI with glassmorphism effects
- **Integration**: Seamlessly embedded in the portfolio site

## API Endpoints

The monitor provides these endpoints when running:

- `GET /api/health/endpoints` - List all known API endpoints
- `POST /api/health/test` - Run health tests on endpoints
- `GET /api/health/logs` - View audit trail of tests

## Customization

The monitor automatically discovers these portfolio API endpoints:

- `/api/chat` - AI Chat endpoint
- `/api/models` - Available AI models
- `/api/health` - API health check
- `/api/github/profile` - GitHub profile data
- `/api/github/repos` - GitHub repositories
- `/api/resume` - Resume download
- `/api/contact` - Contact form
- `/api/memory/stats` - Memory system stats

## Design System

- **Colors**: Apple-inspired blue (#007aff), success green, warning orange
- **Typography**: SF Pro Text and SF Mono for code
- **Effects**: Glassmorphism, subtle shadows, smooth animations
- **Layout**: Responsive grid with card-based components
