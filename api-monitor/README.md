# API Monitor

A browser-accessible platform for monitoring RESTful APIs, reviewing front-end and back-end systems, and manually testing endpoints.

## Features

- **Endpoint Discovery**: Automatically discover endpoints from OpenAPI/Swagger specifications or add them manually
- **Real-time Monitoring**: Dashboard showing up/down status, response times, and HTTP status codes
- **Manual Testing**: Test interface for sending custom HTTP requests (GET, POST, PUT, DELETE, etc.) with authentication support
- **Authentication**: Support for Bearer tokens and Basic Auth
- **Logging**: Comprehensive logging with timestamps for audit trails
- **Alerts**: Optional email and Slack notifications when endpoints are down or slow
- **Containerized**: Docker support for easy deployment

## Quick Start

### Local Development

1. Clone the repository and navigate to the api-monitor directory
2. Install dependencies:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```
3. Start the development servers:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Docker Deployment

1. Configure your environment variables (copy `.env.example` to `.env` and fill in values)
2. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Configuration

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3001

# Email Alerts (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAIL=admin@example.com

# Slack Alerts (optional)
SLACK_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL=#api-alerts

# Performance Thresholds
RESPONSE_TIME_THRESHOLD=5000
```

## API Endpoints

### Endpoints Management

- `GET /api/endpoints` - List all endpoints
- `POST /api/endpoints` - Add new endpoint
- `PUT /api/endpoints/:id` - Update endpoint
- `DELETE /api/endpoints/:id` - Delete endpoint
- `POST /api/endpoints/discover` - Discover endpoints from OpenAPI spec

### Monitoring

- `GET /api/health` - Check health of all endpoints

### Testing

- `POST /api/test` - Test a single endpoint

## Usage

### Adding Endpoints

1. **Manual Addition**: Use the "Add Endpoint" form in the Endpoints tab
2. **OpenAPI Discovery**: Enter the URL to your OpenAPI/Swagger specification in the "Discover" field

### Monitoring

The dashboard automatically refreshes every 30 seconds to show real-time status. Click "Refresh Health" for immediate updates.

### Testing

Use the "Test API" tab to send custom requests:

- Enter the URL and select HTTP method
- Add headers (one per line: `key: value`)
- Add request body for POST/PUT requests
- Configure authentication if needed
- Click "Test Endpoint" to send the request

## Logs

Logs are stored in the `logs/` directory:

- `combined.log` - All log entries
- `error.log` - Error entries only

## Architecture

- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **Database**: In-memory (for demo; can be extended to use persistent storage)
- **Logging**: Winston
- **Alerts**: Nodemailer for email, Slack API for notifications

## Security Considerations

- Store sensitive configuration (API keys, tokens) in environment variables
- Use HTTPS in production
- Configure proper CORS settings
- Implement rate limiting for API endpoints
- Regularly rotate authentication tokens

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC
