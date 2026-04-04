const winston = require('winston');

// Create logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'logs/combined.log' }),
    // Write to console in development
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

class LoggerService {
  static logEndpointCheck(result) {
    const logData = {
      type: 'endpoint_check',
      endpointId: result.id,
      status: result.status,
      responseTime: result.responseTime,
      httpStatus: result.httpStatus,
      timestamp: result.lastChecked,
    };

    if (result.status === 'down') {
      logData.error = result.error;
      logger.error('Endpoint check failed', logData);
    } else {
      logger.info('Endpoint check successful', logData);
    }
  }

  static logTestRequest(request, result) {
    const logData = {
      type: 'manual_test',
      request: request,
      result: {
        status: result.status,
        responseTime: result.responseTime,
        httpStatus: result.httpStatus,
        timestamp: result.lastChecked,
      },
    };

    if (result.status === 'down') {
      logData.result.error = result.error;
      logger.error('Manual test failed', logData);
    } else {
      logger.info('Manual test successful', logData);
    }
  }

  static logEndpointAdded(endpoint) {
    logger.info('Endpoint added', {
      type: 'endpoint_management',
      action: 'add',
      endpoint: endpoint,
    });
  }

  static logEndpointUpdated(id, updates) {
    logger.info('Endpoint updated', {
      type: 'endpoint_management',
      action: 'update',
      endpointId: id,
      updates: updates,
    });
  }

  static logEndpointDeleted(endpoint) {
    logger.info('Endpoint deleted', {
      type: 'endpoint_management',
      action: 'delete',
      endpoint: endpoint,
    });
  }

  static logAlertSent(alertType, endpoint, message) {
    logger.warn('Alert sent', {
      type: 'alert',
      alertType: alertType,
      endpointId: endpoint.id,
      endpointUrl: endpoint.url,
      message: message,
    });
  }
}

module.exports = LoggerService;
