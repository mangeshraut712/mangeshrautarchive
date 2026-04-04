import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = '/api';

function App() {
  const [endpoints, setEndpoints] = useState([]);
  const [healthData, setHealthData] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadEndpoints();
    checkHealth();
    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadEndpoints = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/endpoints`);
      setEndpoints(response.data);
    } catch (error) {
      console.error('Failed to load endpoints:', error);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      setHealthData(response.data);
    } catch (error) {
      console.error('Failed to check health:', error);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>API Monitor</h1>
        <nav>
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'endpoints' ? 'active' : ''}
            onClick={() => setActiveTab('endpoints')}
          >
            Endpoints
          </button>
          <button
            className={activeTab === 'test' ? 'active' : ''}
            onClick={() => setActiveTab('test')}
          >
            Test API
          </button>
        </nav>
      </header>

      <main className="main">
        {activeTab === 'dashboard' && (
          <Dashboard endpoints={endpoints} healthData={healthData} onRefresh={checkHealth} />
        )}
        {activeTab === 'endpoints' && (
          <Endpoints endpoints={endpoints} onEndpointsChange={loadEndpoints} />
        )}
        {activeTab === 'test' && <TestAPI />}
      </main>
    </div>
  );
}

function Dashboard({ endpoints, healthData, onRefresh }) {
  const upCount = healthData.filter(h => h.status === 'up').length;
  const downCount = healthData.filter(h => h.status === 'down').length;
  const avgResponseTime =
    healthData.length > 0
      ? Math.round(healthData.reduce((sum, h) => sum + h.responseTime, 0) / healthData.length)
      : 0;

  return (
    <div className="dashboard">
      <div className="stats">
        <div className="stat-card">
          <h3>Total Endpoints</h3>
          <p className="stat-number">{endpoints.length}</p>
        </div>
        <div className="stat-card">
          <h3>Up</h3>
          <p className="stat-number stat-up">{upCount}</p>
        </div>
        <div className="stat-card">
          <h3>Down</h3>
          <p className="stat-number stat-down">{downCount}</p>
        </div>
        <div className="stat-card">
          <h3>Avg Response Time</h3>
          <p className="stat-number">{avgResponseTime}ms</p>
        </div>
      </div>

      <button onClick={onRefresh} className="refresh-btn">
        Refresh Health
      </button>

      <div className="endpoints-list">
        <h2>Endpoint Status</h2>
        {endpoints.map(endpoint => {
          const health = healthData.find(h => h.id === endpoint.id);
          return (
            <div key={endpoint.id} className={`endpoint-item ${health?.status || 'unknown'}`}>
              <div className="endpoint-info">
                <span className="method">{endpoint.method}</span>
                <span className="url">{endpoint.url}</span>
                <span className="description">{endpoint.description}</span>
              </div>
              <div className="endpoint-status">
                <span className={`status ${health?.status || 'unknown'}`}>
                  {health?.status || 'Unknown'}
                </span>
                {health && (
                  <>
                    <span className="response-time">{health.responseTime}ms</span>
                    <span className="http-status">{health.httpStatus}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Endpoints({ endpoints, onEndpointsChange }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [swaggerUrl, setSwaggerUrl] = useState('');
  const [formData, setFormData] = useState({
    url: '',
    method: 'GET',
    description: '',
    authType: 'none',
    authToken: '',
  });

  const handleAddEndpoint = async e => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/endpoints`, formData);
      setFormData({ url: '', method: 'GET', description: '', authType: 'none', authToken: '' });
      setShowAddForm(false);
      onEndpointsChange();
    } catch (error) {
      console.error('Failed to add endpoint:', error);
    }
  };

  const handleDiscoverFromSwagger = async () => {
    try {
      await axios.post(`${API_BASE_URL}/endpoints/discover`, { swaggerUrl });
      setSwaggerUrl('');
      onEndpointsChange();
    } catch (error) {
      console.error('Failed to discover endpoints:', error);
    }
  };

  const handleDeleteEndpoint = async id => {
    try {
      await axios.delete(`${API_BASE_URL}/endpoints/${id}`);
      onEndpointsChange();
    } catch (error) {
      console.error('Failed to delete endpoint:', error);
    }
  };

  return (
    <div className="endpoints">
      <div className="actions">
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Endpoint'}
        </button>
        <div className="swagger-discover">
          <input
            type="text"
            placeholder="OpenAPI/Swagger URL"
            value={swaggerUrl}
            onChange={e => setSwaggerUrl(e.target.value)}
          />
          <button onClick={handleDiscoverFromSwagger}>Discover</button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddEndpoint} className="add-endpoint-form">
          <input
            type="text"
            placeholder="URL"
            value={formData.url}
            onChange={e => setFormData({ ...formData, url: e.target.value })}
            required
          />
          <select
            value={formData.method}
            onChange={e => setFormData({ ...formData, method: e.target.value })}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
          <select
            value={formData.authType}
            onChange={e => setFormData({ ...formData, authType: e.target.value })}
          >
            <option value="none">No Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
          </select>
          {formData.authType !== 'none' && (
            <input
              type="password"
              placeholder="Auth Token"
              value={formData.authToken}
              onChange={e => setFormData({ ...formData, authToken: e.target.value })}
            />
          )}
          <button type="submit">Add Endpoint</button>
        </form>
      )}

      <div className="endpoints-list">
        {endpoints.map(endpoint => (
          <div key={endpoint.id} className="endpoint-item">
            <div className="endpoint-info">
              <span className="method">{endpoint.method}</span>
              <span className="url">{endpoint.url}</span>
              <span className="description">{endpoint.description}</span>
            </div>
            <button onClick={() => handleDeleteEndpoint(endpoint.id)} className="delete-btn">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestAPI() {
  const [formData, setFormData] = useState({
    url: '',
    method: 'GET',
    headers: '',
    body: '',
    authType: 'none',
    authToken: '',
  });
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers = formData.headers
        ? Object.fromEntries(
            formData.headers.split('\n').map(line => {
              const [key, value] = line.split(':');
              return [key.trim(), value.trim()];
            })
          )
        : {};

      const response = await axios.post(`${API_BASE_URL}/test`, {
        ...formData,
        headers,
      });
      setTestResult(response.data);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ error: 'Test failed' });
    }
    setLoading(false);
  };

  return (
    <div className="test-api">
      <h2>Test API Endpoint</h2>
      <form onSubmit={handleTest} className="test-form">
        <input
          type="text"
          placeholder="URL"
          value={formData.url}
          onChange={e => setFormData({ ...formData, url: e.target.value })}
          required
        />
        <select
          value={formData.method}
          onChange={e => setFormData({ ...formData, method: e.target.value })}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
        <textarea
          placeholder="Headers (key: value per line)"
          value={formData.headers}
          onChange={e => setFormData({ ...formData, headers: e.target.value })}
          rows={3}
        />
        <textarea
          placeholder="Request Body (JSON)"
          value={formData.body}
          onChange={e => setFormData({ ...formData, body: e.target.value })}
          rows={5}
        />
        <select
          value={formData.authType}
          onChange={e => setFormData({ ...formData, authType: e.target.value })}
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
        </select>
        {formData.authType !== 'none' && (
          <input
            type="password"
            placeholder="Auth Token"
            value={formData.authToken}
            onChange={e => setFormData({ ...formData, authToken: e.target.value })}
          />
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'Testing...' : 'Test Endpoint'}
        </button>
      </form>

      {testResult && (
        <div className="test-result">
          <h3>Test Result</h3>
          <div className={`result-status ${testResult.status}`}>Status: {testResult.status}</div>
          {testResult.httpStatus && <div>HTTP Status: {testResult.httpStatus}</div>}
          <div>Response Time: {testResult.responseTime}ms</div>
          {testResult.error && <div className="error">Error: {testResult.error}</div>}
          {testResult.responseData && (
            <pre className="response-data">{JSON.stringify(testResult.responseData, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
