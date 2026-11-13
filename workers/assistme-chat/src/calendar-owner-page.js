const BASE = '/api/calendar-sync';

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>Private calendar · Owner</title><link rel="stylesheet" href="${BASE}/owner.css"><script src="${BASE}/owner.js" defer></script></head>
<body><main><header><div><p class="eyebrow">Owner workspace</p><h1>Your calendars, together.</h1><p>Private reminders, source health, and Luma event access.</p></div><button id="theme" type="button" aria-label="Switch color theme">Switch theme</button></header>
<p id="notice" role="status" aria-live="polite">Checking your session…</p>
<section id="signed-out" hidden><h2>Sign in to continue</h2><p>Only the configured owner can access this workspace. Calendar accounts stay unchanged.</p><a class="primary" href="${BASE}/google/connect">Sign in with Google</a></section>
<div id="workspace" hidden>
<nav aria-label="Owner actions"><a class="primary" href="${BASE}/google/connect">Connect another Google account</a><button id="sync" type="button">Sync now</button><button id="refresh" type="button">Refresh this view</button><button id="logout" type="button">Sign out</button></nav>
<section><h2>Connected sources</h2><p>Cloud sources refresh about every 15 minutes. Apple updates when your Mac is awake and online.</p><ul id="sources" class="cards"></ul></section>
<div class="columns"><section><h2>Connect Luma</h2><p>Paste your personal iCal subscription URL. It stays private; feed membership does not confirm attendance.</p><form id="luma-form"><label for="feed">Private iCal URL</label><input id="feed" name="feed" type="password" required autocomplete="off" spellcheck="false"><button class="primary" type="submit">Connect Luma feed</button></form></section>
<section><h2>Connect this Mac</h2><p>Create a credential for the EventKit helper. This replaces any previous Mac credential. Install it in macOS Keychain; do not save it in a file or share it.</p><div class="actions"><button id="apple-token" type="button">Create Mac upload credential</button><button id="revoke-token" type="button">Revoke Mac access</button></div><div id="credential" hidden><label for="token">Credential · shown only in this session</label><input id="token" type="password" readonly autocomplete="off"><div class="actions"><button id="copy-token" type="button">Copy credential</button><button id="hide-token" type="button">Clear credential</button></div></div></section></div>
<section><h2>Private reminders</h2><p>Read-only provider tasks. Complete or edit them in their source app. Browser-only reminders stay in the public widget on that browser.</p><ul id="reminders" class="cards"></ul></section>
<section><h2>Calendar events</h2><ul id="events" class="cards"></ul></section>
<section><h2>Luma passes</h2><p>Open Luma in your signed-in session for tickets, QR codes, and Wallet passes. Availability depends on your registration.</p><ul id="passes" class="cards"></ul></section>
</div></main></body></html>`;

const css = `:root{color-scheme:light dark;--bg:#fff;--text:#1d1d1f;--muted:#515154;--border:#d2d2d7;--blue:#0071e3;--glass:rgba(255,255,255,.85);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;background:var(--bg);color:var(--text)}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#000;--text:#f5f5f7;--muted:#b8b8be;--border:#424245;--blue:#2997ff;--glass:rgba(0,0,0,.85)}}
:root[data-theme=dark]{color-scheme:dark;--bg:#000;--text:#f5f5f7;--muted:#b8b8be;--border:#424245;--blue:#2997ff;--glass:rgba(0,0,0,.85)}:root[data-theme=light]{color-scheme:light}
*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0}main{max-width:1120px;margin:auto;padding:40px 24px 64px}header,nav,.actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}header{justify-content:space-between}header>div{flex:1;min-width:0}.eyebrow{color:var(--blue);font-size:.8rem;font-weight:650;letter-spacing:.06em;text-transform:uppercase}h1{font-size:clamp(2rem,5vw,3rem);letter-spacing:-.03em;line-height:1.1}h2{font-size:1.35rem;letter-spacing:-.02em}p{line-height:1.6;color:var(--muted)}section{min-width:0;padding:24px;margin:24px 0;border:1px solid var(--border);border-radius:18px;background:var(--glass);backdrop-filter:blur(20px)}.columns{display:grid;grid-template-columns:1fr 1fr;gap:24px}.columns section{margin-bottom:0}button,a,input{font:inherit}button,a.primary{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:12px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--blue);cursor:pointer;text-decoration:none;font-weight:600}a{color:var(--blue);overflow-wrap:anywhere}a.primary,button.primary{background:linear-gradient(135deg,#0077ed,#0071e3 50%,#005bb5);color:#fff;border-color:transparent}.primary{position:relative;overflow:hidden}.primary::after{content:"";pointer-events:none;position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.2) 50%,transparent 70%);transform:translateX(-140%);animation:shine 4.5s linear infinite}@keyframes shine{to{transform:translateX(140%)}}button:disabled{opacity:.6;cursor:wait}input{display:block;width:100%;min-width:0;min-height:44px;border:1px solid var(--border);border-radius:12px;padding:12px;background:var(--bg);color:var(--text);margin:8px 0 16px}label{display:block;font-size:.9rem;margin-top:16px}.cards{list-style:none;padding:0;margin:0}.cards li{padding:16px 0;border-bottom:1px solid var(--border);overflow-wrap:anywhere}.cards li:last-child{border-bottom:0}.cards strong{display:block}.cards p{margin:8px 0}.cards a{display:inline-flex;align-items:center;min-height:44px}.cards .empty{color:var(--muted)}#notice{padding:16px 0;min-height:56px}#credential{margin-top:16px}:focus-visible{outline:3px solid var(--blue);outline-offset:4px}@media(max-width:640px){header{flex-direction:column;align-items:flex-start}main{padding:24px 16px 48px}.columns{grid-template-columns:1fr;gap:0}section{padding:16px}nav>*{width:100%}}@media(prefers-reduced-motion:reduce){*,*::after{animation:none!important;transition:none!important}}`;

const js = String.raw`'use strict';
(() => {
  const base = '/api/calendar-sync';
  const el = id => document.getElementById(id);
  let csrf = '';
  let loading = false;
  let generation = 0;
  let signingOut = false;
  const notice = message => { el('notice').textContent = message; };
  const date = (value, timeZone) => {
    if (!value) return 'Not yet';
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return value;
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return 'Date unavailable';
    try { return parsed.toLocaleString(undefined, timeZone ? { timeZone } : undefined); }
    catch { return parsed.toLocaleString(); }
  };
  const clearToken = () => { el('token').value = ''; el('credential').hidden = true; };
  const reset = () => {
    generation++;
    loading = false;
    csrf = '';
    clearToken();
    el('feed').value = '';
    for (const id of ['sources', 'events', 'reminders', 'passes']) el(id).replaceChildren();
    el('workspace').hidden = true;
    el('signed-out').hidden = false;
  };
  const node = (tag, text) => {
    const element = document.createElement(tag);
    element.textContent = String(text || '');
    return element;
  };
  const safeLink = (value, lumaOnly = false) => {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) return '';
      if (lumaOnly && !['lu.ma', 'luma.com'].includes(url.hostname)) return '';
      if (lumaOnly && (url.search || url.hash)) return '';
      return url.href;
    } catch { return ''; }
  };
  const addLink = (item, url, label, lumaOnly = false) => {
    const href = safeLink(url, lumaOnly);
    if (!href) return;
    const link = node('a', label);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    item.append(link);
  };
  const list = (id, values, render) => {
    const target = el(id);
    target.replaceChildren();
    if (!Array.isArray(values) || !values.length) {
      const empty = node('li', 'No items available.');
      empty.className = 'empty';
      target.append(empty);
      return;
    }
    for (const value of values) {
      const item = document.createElement('li');
      render(item, value);
      target.append(item);
    }
  };
  async function request(path, body) {
    const requestGeneration = generation;
    const assertCurrent = () => {
      if (requestGeneration !== generation) throw new Error('Session changed.');
    };
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin', cache: 'no-store',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20000),
    });
    assertCurrent();
    if (response.status === 401) {
      reset();
      notice('Sign in to access your private calendar.');
      throw new Error('Sign in to access your private calendar.');
    }
    if (!response.ok) throw new Error('The request could not be completed. Check your connection and source setup, then try again.');
    const data = await response.json();
    assertCurrent();
    return data;
  }
  async function load() {
    if (loading || signingOut) return;
    const loadGeneration = generation;
    loading = true;
    el('refresh').disabled = true;
    try {
      const data = await request('/private');
      if (loadGeneration !== generation || signingOut) return;
      if (!data.authenticated) { reset(); notice('Sign in to access your private calendar.'); return; }
      csrf = data.csrfToken;
      el('signed-out').hidden = true;
      el('workspace').hidden = false;
      list('sources', data.sources, (item, source) => {
        item.append(node('strong', source.label || source.provider));
        item.append(node('p', (source.stale ? 'Updates delayed' : 'Up to date') + ' · Last success: ' + date(source.lastSuccessAt)));
        if (source.error) item.append(node('p', source.error === 'reconnect_required' ? 'Reconnect this source to resume updates.' : 'The last refresh failed; previously saved data is retained.'));
      });
      list('reminders', data.reminders, (item, task) => {
        item.append(node('strong', task.title));
        item.append(node('p', (task.completed ? 'Completed' : 'Open') + (task.due ? ' · Due ' + date(task.due) : '') + (task.listTitle ? ' · ' + task.listTitle : '')));
        addLink(item, task.url, 'Open source app');
      });
      list('events', data.events, (item, event) => {
        item.append(node('strong', event.title));
        item.append(node('p', (event.allDay ? String(event.start).slice(0, 10) + ' · All day' : date(event.start, event.timeZone)) + (event.timeZone ? ' · ' + event.timeZone : '')));
        addLink(item, event.url, 'Open event');
      });
      list('passes', data.passes, (item, pass) => {
        item.append(node('strong', pass.title || 'Luma event'));
        addLink(item, pass.url, 'Open in Luma', true);
      });
      notice('Private calendar loaded. Source accounts are read-only.');
    } catch (error) {
      if (loadGeneration !== generation) return;
      if (!csrf) el('signed-out').hidden = false;
      notice(error.message);
    }
    finally {
      if (loadGeneration === generation) { loading = false; el('refresh').disabled = false; }
    }
  }
  async function action(button, callback) {
    if (signingOut) return;
    const actionGeneration = generation;
    button.disabled = true;
    try { await callback(); } catch (error) {
      if (actionGeneration === generation) notice(error.message);
    }
    finally { if (!signingOut) button.disabled = false; }
  }
  el('sync').addEventListener('click', event => action(event.currentTarget, async () => {
    notice('Refreshing connected cloud sources…');
    await request('/sync', {});
    await load();
    notice('Cloud refresh completed. Check each source for its latest status. Apple updates come from your Mac helper.');
  }));
  el('refresh').addEventListener('click', load);
  el('theme').addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = current === 'dark' ? 'light' : 'dark';
  });
  el('luma-form').addEventListener('submit', event => {
    event.preventDefault();
    const feedUrl = el('feed').value.trim();
    el('feed').value = '';
    void action(event.submitter || el('luma-form').querySelector('button'), async () => {
      await request('/luma', { feedUrl });
      await load();
      notice('Luma connection saved. Check source health for the latest refresh.');
    });
  });
  el('apple-token').addEventListener('click', event => action(event.currentTarget, async () => {
    clearToken();
    const data = await request('/apple/token', {});
    if (!data.token) throw new Error('No credential was returned.');
    el('token').value = data.token;
    el('credential').hidden = false;
    notice('Mac credential created. Copy it into the helper setup, then clear it here.');
  }));
  el('revoke-token').addEventListener('click', event => action(event.currentTarget, async () => {
    await request('/apple/revoke', {});
    clearToken();
    notice('Mac upload access revoked. The helper cannot upload until you install a new credential.');
  }));
  el('copy-token').addEventListener('click', event => action(event.currentTarget, async () => {
    await navigator.clipboard.writeText(el('token').value);
    notice('Credential copied. Paste it into the Mac helper setup.');
  }));
  el('hide-token').addEventListener('click', clearToken);
  el('logout').addEventListener('click', async () => {
    if (signingOut) return;
    generation++;
    loading = false;
    signingOut = true;
    const logoutGeneration = generation;
    const controls = document.querySelectorAll('button:not(#theme)');
    controls.forEach(button => { button.disabled = true; });
    clearToken();
    try {
      await request('/logout', {});
      if (logoutGeneration !== generation) return;
      reset(); notice('Signed out. Private data cleared from this view.');
    } catch (error) {
      if (logoutGeneration === generation) notice(error.message);
    } finally {
      signingOut = false;
      controls.forEach(button => { button.disabled = false; });
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearToken(); });
  window.addEventListener('pagehide', reset);
  window.addEventListener('pageshow', () => { void load(); });
})();`;

export function handleCalendarOwnerPage(request) {
  const path = new URL(request.url).pathname;
  const resources = {
    [`${BASE}/owner`]: [html, 'text/html; charset=utf-8'],
    [`${BASE}/owner.js`]: [js, 'text/javascript; charset=utf-8'],
    [`${BASE}/owner.css`]: [css, 'text/css; charset=utf-8'],
  };
  const resource = resources[path];
  if (!resource) return null;
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  return new Response(request.method === 'HEAD' ? null : resource[0], {
    headers: {
      'Content-Type': resource[1],
      'Cache-Control': 'no-store',
      'Content-Security-Policy':
        "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  });
}
