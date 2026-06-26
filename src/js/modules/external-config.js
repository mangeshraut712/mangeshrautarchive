// External Configuration - API Keys and Environment Variables
// Note: In production, these should be injected via environment variables or a secure config system

// Set up global APP_CONFIG for services that expect it (like Last.fm)
window.APP_CONFIG = window.APP_CONFIG || {};

// Last.fm: use /api/music/* on the backend — do not embed LASTFM_API_KEY in build-config.
window.APP_CONFIG.lastfmApiKey = window.APP_CONFIG.lastfmApiKey || '';
window.APP_CONFIG.apiBaseUrl = window.APP_CONFIG.apiBaseUrl || '';

// ES6 exports for module systems
export const ExternalApiKeys = Object.freeze({
  news: '7c0f446a765249edab2c14df05956792',
  nasa: 'AADXc64v1KehekFRHPZeqvR0mdD1DPwpSLUEsXhn',
  // Note: Last.fm API key should be added by the user to window.APP_CONFIG.lastfmApiKey
  // Get your free API key at: https://www.last.fm/api/account/create
});

export default ExternalApiKeys;
