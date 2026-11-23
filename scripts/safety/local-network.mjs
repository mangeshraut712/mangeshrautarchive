import http from 'node:http';
import https from 'node:https';
import { assertLocalEndpoint } from './local-environment.mjs';

const originalFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
  const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  assertLocalEndpoint('outbound request', url);
  return originalFetch(input, options);
};
for (const protocol of [http, https]) {
  for (const method of ['request', 'get']) {
    const original = protocol[method];
    protocol[method] = function (input, ...args) {
      const url =
        typeof input === 'string' || input instanceof URL
          ? String(input)
          : `${protocol === https ? 'https' : 'http'}://${input.hostname || input.host || 'localhost'}`;
      assertLocalEndpoint('outbound request', url);
      return original.call(this, input, ...args);
    };
  }
}
