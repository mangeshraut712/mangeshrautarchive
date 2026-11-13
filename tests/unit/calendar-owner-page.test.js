import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { handleCalendarOwnerPage } from '../../workers/assistme-chat/src/calendar-owner-page.js';

const privateData = {
  authenticated: true,
  csrfToken: 'session-csrf',
  sources: [],
  events: [],
  reminders: [{ title: 'Private task' }],
  passes: [],
};

async function ownerHarness() {
  const elements = new Map();
  const windowHandlers = new Map();
  const requests = [];
  const makeElement = () => ({
    hidden: false,
    disabled: false,
    value: '',
    textContent: '',
    children: [],
    handlers: new Map(),
    append(...children) {
      this.children.push(...children);
    },
    replaceChildren() {
      this.children = [];
    },
    addEventListener(type, handler) {
      this.handlers.set(type, handler);
    },
  });
  const get = id => {
    if (!elements.has(id)) elements.set(id, makeElement());
    return elements.get(id);
  };
  const script = await handleCalendarOwnerPage(
    new Request('https://example.com/api/calendar-sync/owner.js')
  ).text();
  vm.runInNewContext(script, {
    document: {
      getElementById: get,
      createElement: makeElement,
      addEventListener() {},
      querySelectorAll: () => [...elements.values()],
    },
    window: { addEventListener: (type, handler) => windowHandlers.set(type, handler) },
    fetch: (url, options) => new Promise(resolve => requests.push({ url, options, resolve })),
    AbortSignal,
    URL,
    Date,
  });
  const settle = async () => {
    await new Promise(resolve => setImmediate(resolve));
  };
  const respond = async (request, data) => {
    request.resolve({ ok: true, status: 200, json: async () => data });
    await settle();
  };
  const click = id => get(id).handlers.get('click')({ currentTarget: get(id) });
  return { get, windowHandlers, requests, respond, click, settle };
}

test('a private refresh arriving after logout cannot restore private DOM or session actions', async () => {
  const h = await ownerHarness();
  h.windowHandlers.get('pageshow')();
  await h.respond(h.requests[0], privateData);
  assert.equal(h.get('workspace').hidden, false);
  const refresh = h.click('refresh');
  const logout = h.click('logout');
  assert.equal(h.get('apple-token').disabled, true);
  await h.respond(
    h.requests.find(request => request.url.endsWith('/logout')),
    {}
  );
  await logout;
  await h.respond(h.requests[1], privateData);
  await refresh;
  assert.equal(h.get('workspace').hidden, true);
  assert.equal(h.get('reminders').children.length, 0);
  assert.equal(h.get('notice').textContent, 'Signed out. Private data cleared from this view.');
});

test('an upload credential arriving after pagehide cannot repopulate the cleared view', async () => {
  const h = await ownerHarness();
  h.windowHandlers.get('pageshow')();
  await h.respond(h.requests[0], privateData);
  const create = h.click('apple-token');
  h.windowHandlers.get('pagehide')();
  await h.respond(h.requests[1], { token: 'private-upload-secret' });
  await create;
  assert.equal(h.get('token').value, '');
  assert.equal(h.get('credential').hidden, true);
  assert.equal(h.get('workspace').hidden, true);
  assert.equal(h.get('reminders').children.length, 0);
});
