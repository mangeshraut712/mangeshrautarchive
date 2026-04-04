// In-memory storage for endpoints
let endpoints = [];

class EndpointService {
  static getAllEndpoints() {
    return endpoints;
  }

  static addEndpoint(endpoint) {
    endpoint.id = Date.now().toString();
    endpoint.createdAt = new Date();
    endpoints.push(endpoint);
    return endpoint;
  }

  static updateEndpoint(id, updates) {
    const index = endpoints.findIndex(ep => ep.id === id);
    if (index !== -1) {
      endpoints[index] = { ...endpoints[index], ...updates };
      return endpoints[index];
    }
    return null;
  }

  static deleteEndpoint(id) {
    const index = endpoints.findIndex(ep => ep.id === id);
    if (index !== -1) {
      return endpoints.splice(index, 1)[0];
    }
    return null;
  }

  static getEndpoint(id) {
    return endpoints.find(ep => ep.id === id);
  }
}

module.exports = EndpointService;
