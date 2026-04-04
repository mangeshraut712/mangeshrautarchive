const axios = require('axios');
const EndpointService = require('./endpointService');
const LoggerService = require('./logger');
const AlertService = require('./alertService');

class MonitoringService {
  static async checkEndpointHealth(endpoint) {
    const startTime = Date.now();

    try {
      const config = {
        method: endpoint.method,
        url: endpoint.url,
        timeout: 10000, // 10 seconds
        headers: endpoint.headers || {},
      };

      // Add authentication if needed
      if (endpoint.authType === 'bearer' && endpoint.authToken) {
        config.headers.Authorization = `Bearer ${endpoint.authToken}`;
      } else if (endpoint.authType === 'basic' && endpoint.authToken) {
        config.headers.Authorization = `Basic ${endpoint.authToken}`;
      }

      // Add data for POST/PUT/PATCH
      if (endpoint.data) {
        config.data = endpoint.data;
      }

      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      const result = {
        id: endpoint.id || null,
        status: 'up',
        responseTime,
        httpStatus: response.status,
        responseData: response.data,
        responseHeaders: response.headers,
        lastChecked: new Date(),
      };

      LoggerService.logEndpointCheck(result);

      // Alert if response is slow
      if (result.id) {
        const endpoint = EndpointService.getEndpoint(result.id);
        if (endpoint) {
          AlertService.alertEndpointSlow(endpoint, result.responseTime);
        }
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      let httpStatus = null;
      let responseData = null;
      let responseHeaders = null;

      if (error.response) {
        httpStatus = error.response.status;
        responseData = error.response.data;
        responseHeaders = error.response.headers;
      }

      const result = {
        id: endpoint.id || null,
        status: 'down',
        responseTime,
        httpStatus,
        responseData,
        responseHeaders,
        error: error.message,
        lastChecked: new Date(),
      };

      LoggerService.logEndpointCheck(result);

      // Alert if endpoint is down
      if (result.id) {
        const endpoint = EndpointService.getEndpoint(result.id);
        if (endpoint) {
          AlertService.alertEndpointDown(endpoint, result.error);
        }
      }

      return result;
    }
  }

  static async checkAllEndpoints() {
    const endpoints = EndpointService.getAllEndpoints();
    const results = [];

    for (const endpoint of endpoints) {
      const result = await this.checkEndpointHealth(endpoint);
      results.push(result);

      // Update endpoint status
      EndpointService.updateEndpoint(endpoint.id, {
        status: result.status,
        lastChecked: result.lastChecked,
        responseTime: result.responseTime,
        httpStatus: result.httpStatus,
      });
    }

    return results;
  }
}

module.exports = MonitoringService;
