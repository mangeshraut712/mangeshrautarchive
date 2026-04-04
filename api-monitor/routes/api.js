const express = require('express');
const axios = require('axios');
const EndpointService = require('../services/endpointService');
const MonitoringService = require('../services/monitoringService');
const LoggerService = require('../services/logger');

const router = express.Router();

// Get all endpoints
router.get('/endpoints', (req, res) => {
  const endpoints = EndpointService.getAllEndpoints();
  res.json(endpoints);
});

// Add endpoint manually
router.post('/endpoints', (req, res) => {
  const { url, method, description, authType, authToken } = req.body;

  if (!url || !method) {
    return res.status(400).json({ error: 'URL and method are required' });
  }

  const endpoint = EndpointService.addEndpoint({
    url,
    method: method.toUpperCase(),
    description: description || '',
    authType: authType || 'none',
    authToken: authToken || '',
    status: 'unknown',
  });

  LoggerService.logEndpointAdded(endpoint);
  res.status(201).json(endpoint);
});

// Update endpoint
router.put('/endpoints/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const endpoint = EndpointService.updateEndpoint(id, updates);
  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  LoggerService.logEndpointUpdated(id, updates);
  res.json(endpoint);
});

// Delete endpoint
router.delete('/endpoints/:id', (req, res) => {
  const { id } = req.params;
  const endpoint = EndpointService.deleteEndpoint(id);
  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  LoggerService.logEndpointDeleted(endpoint);
  res.json({ message: 'Endpoint deleted' });
});

// Discover endpoints from OpenAPI/Swagger
router.post('/endpoints/discover', async (req, res) => {
  const { swaggerUrl } = req.body;

  if (!swaggerUrl) {
    return res.status(400).json({ error: 'Swagger URL is required' });
  }

  try {
    const response = await axios.get(swaggerUrl);
    const spec = response.data;

    const discoveredEndpoints = [];

    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method, details]) => {
          const endpoint = EndpointService.addEndpoint({
            url: swaggerUrl.replace('/swagger.json', '') + path,
            method: method.toUpperCase(),
            description: details.summary || details.description || '',
            authType: 'none',
            authToken: '',
            status: 'unknown',
          });
          discoveredEndpoints.push(endpoint);
        });
      });
    }

    res.json({
      message: `${discoveredEndpoints.length} endpoints discovered`,
      endpoints: discoveredEndpoints,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch OpenAPI spec' });
  }
});

// Check all endpoints health
router.get('/health', async (req, res) => {
  try {
    const results = await MonitoringService.checkAllEndpoints();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check endpoint health' });
  }
});

// Test single endpoint
router.post('/test', async (req, res) => {
  const { url, method, headers, body, authType, authToken } = req.body;

  if (!url || !method) {
    return res.status(400).json({ error: 'URL and method are required' });
  }

  const testEndpoint = {
    url,
    method: method.toUpperCase(),
    authType: authType || 'none',
    authToken: authToken || '',
  };

  // Add custom headers
  if (headers) {
    testEndpoint.headers = headers;
  }

  if (
    body &&
    (method.toUpperCase() === 'POST' ||
      method.toUpperCase() === 'PUT' ||
      method.toUpperCase() === 'PATCH')
  ) {
    testEndpoint.data = body;
  }

  try {
    const result = await MonitoringService.checkEndpointHealth(testEndpoint);
    const request = { url, method: method.toUpperCase(), headers, body };
    LoggerService.logTestRequest(request, result);
    res.json({
      ...result,
      request: request,
    });
  } catch (error) {
    res.status(500).json({ error: 'Test failed' });
  }
});

module.exports = router;
