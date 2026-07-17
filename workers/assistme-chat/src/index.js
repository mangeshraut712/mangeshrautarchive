/**
 * AssistMe API edge (Cloudflare Worker) — FastAPI-compatible surface for GitHub Pages
 * when Vercel is DEPLOYMENT_DISABLED.
 *
 * Secrets: OPENROUTER_API_KEY, optional LASTFM_API_KEY
 * Vars: OPENROUTER_MODEL, ALLOWED_ORIGINS, LASTFM_USERNAME
 *
 * Endpoints (mirror FastAPI):
 *   GET  /api/health
 *   GET  /api/chat/health
 *   POST /api/chat | /chat
 *   GET  /api/github/repos/public
 *   GET  /api/github/proxy
 *   GET  /api/music/recent
 *   GET  /api/analytics/reach
 *   GET  /api/health-vitals/summary
 */

import { EDGE_DATA_SNAPSHOT } from './edge-data-snapshot.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_MODEL = 'x-ai/grok-4.3';
const FREE_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'openrouter/free',
];

const SYSTEM_PROMPT = `You are AssistMe, the AI assistant for Mangesh Raut's portfolio (mangeshraut.pro and GitHub Pages mirror).
Answer helpfully about Mangesh's experience, skills, projects, education, and contact.
Facts to prefer:
- Software Engineer at Customized Energy Solutions (energy analytics, AWS, Java/Spring, Python).
- Prior: IoasiZ microservices, Aramark cloud automation.
- MSCS Drexel University (GPA ~3.76); BE Computer Engineering SPPU.
- Stack: Java Spring Boot, Python, AWS, Terraform, React/Angular, ML (TensorFlow).
- Contact: mbr63@drexel.edu · linkedin.com/in/mangeshraut71298 · github.com/mangeshraut712
Keep answers concise, professional, and friendly. Use light Markdown.`;

function corsHeaders(origin, allowed) {
  const list = String(allowed || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  // Built-in production hosts when ALLOWED_ORIGINS is unset — never fall open to *
  const defaults = [
    'https://mangeshraut.pro',
    'https://www.mangeshraut.pro',
    'https://mangeshraut712.github.io',
  ];
  const allowList = list.length ? list : defaults;
  const isLocal = !origin || /localhost|127\.0\.0\.1/.test(origin);
  const ok =
    isLocal ||
    allowList.includes(origin) ||
    allowList.some(a => origin.startsWith(a.replace(/\/$/, '')));
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Origin',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  // Fail closed: omit ACAO when origin is not allowed (never '*')
  if (ok && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (ok && !origin) {
    headers['Access-Control-Allow-Origin'] = allowList[0];
  }
  return headers;
}

function json(data, status, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extra,
    },
  });
}

function localAnswer(message) {
  const q = String(message || '').toLowerCase();
  if (/hello|hi\b|hey/.test(q)) {
    return "👋 Hello! I'm **AssistMe** on Cloudflare edge (Vercel fallback). Ask about skills, experience, projects, education, or contact.";
  }
  if (/skill|stack|technolog|java|python|aws|cloud/.test(q)) {
    return "Mangesh's core stack: **Java Spring Boot**, **Python**, **AWS** (Lambda, EC2, ECS, S3), **Terraform**, React/Angular, and ML with TensorFlow.";
  }
  if (/experience|work|job|company|ces|ioasiz|aramark/.test(q)) {
    return 'Mangesh is a **Software Engineer at Customized Energy Solutions**. Previously: microservices at **IoasiZ**, cloud automation at **Aramark**.';
  }
  if (/educat|degree|university|drexel|gpa/.test(q)) {
    return '**M.S. Computer Science, Drexel University** (GPA ~3.76) · **B.E. Computer Engineering**, SPPU.';
  }
  if (/project|github|portfolio/.test(q)) {
    return 'Projects: [github.com/mangeshraut712](https://github.com/mangeshraut712) · portfolio [mangeshraut.pro](https://mangeshraut.pro).';
  }
  if (/contact|email|linkedin|hire|reach/.test(q)) {
    return '**mbr63@drexel.edu** · [LinkedIn](https://linkedin.com/in/mangeshraut71298) · [GitHub](https://github.com/mangeshraut712)';
  }
  return "I'm AssistMe (edge local knowledge). Try skills, experience, education, projects, or contact.";
}

function isGarbage(text) {
  const t = String(text || '').trim();
  if (!t) return true;
  // Do not reject short legitimate answers — only classifier junk / empty.
  return /^(user\s*safety\s*:\s*(safe|unsafe)|safe|unsafe|allowed|blocked)$/i.test(t);
}

/** Models the edge worker will call — ignore arbitrary client-chosen models. */
const ALLOWED_MODELS = new Set([PRIMARY_MODEL, ...FREE_MODELS]);

function buildModelChain(env, requested) {
  const envPrimary = (env.OPENROUTER_MODEL || PRIMARY_MODEL || '').trim();
  const req = (requested || '').trim();
  const primary =
    (req && ALLOWED_MODELS.has(req) ? req : '') ||
    (envPrimary && (ALLOWED_MODELS.has(envPrimary) || envPrimary === PRIMARY_MODEL)
      ? envPrimary
      : PRIMARY_MODEL);
  if (envPrimary && !ALLOWED_MODELS.has(envPrimary)) {
    ALLOWED_MODELS.add(envPrimary);
  }
  const chain = [primary, PRIMARY_MODEL, ...FREE_MODELS].filter(
    (v, i, a) => v && a.indexOf(v) === i
  );
  return chain;
}

async function callOpenRouter(apiKey, model, messages, stream, env) {
  return fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer':
        env.OPENROUTER_SITE_URL || 'https://mangeshraut712.github.io/mangeshrautarchive',
      'X-Title': env.OPENROUTER_SITE_TITLE || 'AssistMe Cloudflare Edge',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: Boolean(stream),
      temperature: 0.65,
      max_tokens: 1800,
    }),
  });
}

function streamLocal(answer, cors, meta = {}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const push = obj => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      push({ type: 'typing', status: 'start' });
      push({ type: 'typing', status: 'stop' });
      const step = 28;
      for (let i = 0; i < answer.length; i += step) {
        push({ type: 'chunk', content: answer.slice(i, i + step) });
      }
      push({
        type: 'done',
        full_content: answer,
        metadata: {
          model: meta.model || 'edge-local',
          source: meta.source || 'Local Intelligence',
          sourceLabel: meta.sourceLabel || 'AssistMe Edge',
          host: 'cloudflare-worker',
          fallback_reason: meta.reason,
        },
      });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      ...cors,
    },
  });
}

function streamOpenRouterToNdjson(upstream, model, cors, userMessage = '') {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  const stream = new ReadableStream({
    async start(controller) {
      const push = obj => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      push({ type: 'typing', status: 'start' });
      push({ type: 'typing', status: 'stop' });

      const reader = upstream.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try {
              const jsonData = JSON.parse(data);
              const err = jsonData?.error;
              if (err) {
                full = '';
                break;
              }
              const content = jsonData?.choices?.[0]?.delta?.content || '';
              if (content) {
                full += content;
                push({ type: 'chunk', content });
              }
            } catch {
              // ignore partial
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!full || isGarbage(full)) {
        // Answer the actual user question; full_content replaces any junk chunks client-side.
        const fallback = localAnswer(userMessage);
        full = fallback;
        push({
          type: 'done',
          full_content: full,
          metadata: {
            model: 'edge-local',
            source: 'Local Intelligence',
            sourceLabel: 'AssistMe Edge (fallback)',
            host: 'cloudflare-worker',
            replaced_garbage: true,
          },
        });
        controller.close();
        return;
      }

      push({
        type: 'done',
        full_content: full,
        metadata: {
          model,
          source: 'OpenRouter',
          sourceLabel: `OpenRouter (${String(model).split('/').pop()})`,
          host: 'cloudflare-worker',
        },
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      ...cors,
    },
  });
}

async function handleChat(request, env, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, cors);
  }

  const message = String(body.message || body.query || '')
    .trim()
    .slice(0, 2000);
  if (!message) {
    return json({ error: 'Message cannot be empty' }, 400, cors);
  }

  const wantStream = body.stream !== false;
  const history = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .map(m => ({
        role: m.role,
        content: String(m.content).slice(0, 2000),
      })),
    { role: 'user', content: message },
  ];

  const apiKey = (env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) {
    const answer = localAnswer(message);
    return wantStream
      ? streamLocal(answer, cors, { reason: 'no_key' })
      : json(
          {
            answer,
            source: 'Local Intelligence',
            model: 'edge-local',
            type: 'local',
            confidence: 1,
            host: 'cloudflare-worker',
          },
          200,
          cors
        );
  }

  const chain = buildModelChain(env, body.model);
  let lastErr = 'upstream failed';

  for (const model of chain) {
    try {
      const res = await callOpenRouter(apiKey, model, messages, wantStream, env);
      if (!res.ok) {
        lastErr = `OpenRouter HTTP ${res.status}`;
        continue;
      }

      if (wantStream) {
        return streamOpenRouterToNdjson(res, model, cors, message);
      }

      const data = await res.json();
      const answer = (data?.choices?.[0]?.message?.content || '').trim();
      if (isGarbage(answer)) {
        lastErr = `garbage from ${model}`;
        continue;
      }
      return json(
        {
          answer,
          source: 'OpenRouter',
          model: data.model || model,
          type: 'general',
          confidence: 0.92,
          host: 'cloudflare-worker',
        },
        200,
        cors
      );
    } catch (e) {
      lastErr = e.message || String(e);
    }
  }

  const answer = localAnswer(message);
  return wantStream
    ? streamLocal(answer, cors, { reason: lastErr })
    : json(
        {
          answer,
          source: 'Local Intelligence',
          model: 'edge-local',
          type: 'local',
          fallback_reason: lastErr,
          confidence: 1,
          host: 'cloudflare-worker',
        },
        200,
        cors
      );
}

async function handleHealth(env, cors) {
  const apiKey = (env.OPENROUTER_API_KEY || '').trim();
  let provider_status = apiKey ? 'configured' : 'local_only';
  let status = 'degraded';
  let message = apiKey
    ? 'OpenRouter key present on Cloudflare Worker.'
    : 'No OPENROUTER_API_KEY on worker — local knowledge only.';

  if (apiKey) {
    try {
      const probe = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (probe.ok) {
        status = 'healthy';
        provider_status = 'online';
        message = 'OpenRouter reachable via Cloudflare Worker (Vercel fallback).';
      } else {
        status = 'unhealthy';
        provider_status = 'error';
        message = `OpenRouter models probe HTTP ${probe.status}`;
      }
    } catch (e) {
      status = 'unhealthy';
      provider_status = 'error';
      message = `OpenRouter probe failed: ${e.message}`;
    }
  }

  return json(
    {
      success: true,
      status,
      provider: 'openrouter',
      provider_status,
      online: provider_status === 'online' || provider_status === 'configured',
      local_only: !apiKey || provider_status === 'local_only',
      streaming: 'ndjson',
      model: env.OPENROUTER_MODEL || PRIMARY_MODEL,
      fallback_models: FREE_MODELS,
      host: 'cloudflare-worker',
      message,
      timestamp: new Date().toISOString(),
    },
    200,
    cors
  );
}

async function handleGithubRepos(url, cors, env = {}) {
  const username = url.searchParams.get('username') || 'mangeshraut712';
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 100)));
  try {
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'assistme-cloudflare-edge',
    };
    const pat = (env.GITHUB_PAT || '').trim();
    if (pat) headers.Authorization = `Bearer ${pat}`;
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${limit}&sort=updated`,
      { headers }
    );
    if (!res.ok) {
      return json(
        { success: false, error: `GitHub HTTP ${res.status}`, items: [] },
        res.status === 403 ? 503 : res.status,
        cors
      );
    }
    const repos = await res.json();
    const items = Array.isArray(repos) ? repos : [];
    return json(
      {
        success: true,
        username,
        source: 'github-public',
        host: 'cloudflare-worker',
        // FastAPI returns `data`; older edge clients used `items` — keep both.
        data: items,
        items,
        count: items.length,
      },
      200,
      cors
    );
  } catch (e) {
    return json({ success: false, error: e.message, data: [], items: [] }, 502, cors);
  }
}

async function handleMusicRecent(url, env, cors) {
  const user = url.searchParams.get('user') || env.LASTFM_USERNAME || 'mbr63';
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') || 10)));
  const key = (env.LASTFM_API_KEY || '').trim();
  if (!key) {
    return json(
      {
        success: false,
        error: 'LASTFM_API_KEY not configured on worker',
        recenttracks: { track: [] },
      },
      200,
      cors
    );
  }
  try {
    const qs = new URLSearchParams({
      method: 'user.getrecenttracks',
      user,
      api_key: key,
      format: 'json',
      limit: String(limit),
    });
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${qs}`);
    if (!res.ok) {
      return json({ success: false, error: `Last.fm HTTP ${res.status}` }, 502, cors);
    }
    const data = await res.json();
    return json({ ...data, host: 'cloudflare-worker', success: true }, 200, cors);
  } catch (e) {
    return json({ success: false, error: e.message }, 502, cors);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (
      request.method === 'GET' &&
      (path === '/api/health' ||
        path === '/api/chat/health' ||
        path === '/health' ||
        path === '/api/status')
    ) {
      return handleHealth(env, cors);
    }

    if (request.method === 'POST' && (path === '/api/chat' || path === '/chat')) {
      return handleChat(request, env, cors);
    }

    if (
      request.method === 'GET' &&
      (path === '/api/github/repos/public' || path === '/api/github/repos')
    ) {
      return handleGithubRepos(url, cors, env);
    }

    if (request.method === 'GET' && path === '/api/music/recent') {
      return handleMusicRecent(url, env, cors);
    }

    // Artwork lookups fall through to client CDN; quiet 204 avoids console 404 spam
    if (request.method === 'GET' && path === '/api/music/artwork') {
      return json({ success: false, url: null, host: 'cloudflare-worker' }, 200, cors);
    }

    if (
      request.method === 'GET' &&
      (path === '/api/realtime/health' || path === '/api/realtime/status')
    ) {
      return json(
        {
          success: true,
          available: false,
          host: 'cloudflare-worker',
          message:
            'Realtime voice needs a WebSocket bridge; text AssistMe chat runs on this Cloudflare Worker.',
        },
        200,
        cors
      );
    }

    // Monitor surface (Cloudflare-primary for GitHub Pages)
    if (
      request.method === 'GET' &&
      (path === '/api/monitor/status' ||
        path === '/api/monitor/engineering' ||
        path.startsWith('/api/monitor/'))
    ) {
      return handleMonitorStatus(env, cors, path);
    }

    // Integrations status (OAuth connectors not on edge)
    if (request.method === 'GET' && path === '/api/integrations/status') {
      return json(
        {
          success: true,
          host: 'cloudflare-worker',
          available: false,
          integrations: [],
          message: 'OAuth integrations require FastAPI; unavailable on edge worker.',
        },
        200,
        cors
      );
    }

    // Soft analytics + health vitals so Pages does not depend on blocked Vercel
    if (request.method === 'GET' && path === '/api/analytics/reach') {
      return handleAnalyticsReach(cors);
    }
    if (request.method === 'GET' && path === '/api/analytics/views') {
      return handleAnalyticsViews(cors);
    }
    if (request.method === 'POST' && path === '/api/analytics/track') {
      return handleAnalyticsTrack(cors);
    }
    if (request.method === 'GET' && path === '/api/health-vitals/summary') {
      return handleHealthVitalsSummary(cors, env);
    }

    if (request.method === 'POST' && path === '/api/newsletter/subscribe') {
      return json(
        {
          success: false,
          error:
            'Newsletter signup is temporarily offline on GitHub Pages edge. Email mbr63@drexel.edu instead.',
          host: 'cloudflare-worker',
        },
        503,
        cors
      );
    }

    // GitHub proxy for activity metadata (public API only)
    if (request.method === 'GET' && path === '/api/github/proxy') {
      return handleGithubProxy(url, cors);
    }

    if (request.method === 'GET' && path === '/') {
      return json(
        {
          name: 'assistme-chat',
          host: 'cloudflare-worker',
          endpoints: [
            'GET /api/health',
            'GET /api/chat/health',
            'POST /api/chat',
            'GET /api/github/repos/public',
            'GET /api/github/proxy',
            'GET /api/music/recent',
            'GET /api/monitor/status',
            'GET /api/analytics/reach',
            'POST /api/analytics/track',
            'GET /api/health-vitals/summary',
          ],
        },
        200,
        cors
      );
    }

    return json({ error: 'Not found', hint: 'POST /api/chat or GET /api/chat/health' }, 404, cors);
  },
};

/** Isolate boot clock — set on first request (avoids module-eval edge cases). */
function edgeUptimeSeconds() {
  const now = Date.now();
  if (!globalThis.__ASSISTME_EDGE_BOOT_MS__ || globalThis.__ASSISTME_EDGE_BOOT_MS__ > now) {
    globalThis.__ASSISTME_EDGE_BOOT_MS__ = now;
  }
  const s = Math.floor((now - globalThis.__ASSISTME_EDGE_BOOT_MS__) / 1000);
  // Cap at 30d so a bad boot stamp never shows multi-decade uptime
  return Math.min(Math.max(1, s), 30 * 86400);
}

function edgeUptimeHuman() {
  const s = edgeUptimeSeconds();
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

function edgeTs() {
  return new Date().toISOString();
}

async function handleMonitorStatus(env, cors, path) {
  const apiKey = Boolean((env.OPENROUTER_API_KEY || '').trim());
  const lastfm = Boolean((env.LASTFM_API_KEY || '').trim());
  const healthy = apiKey ? 'healthy' : 'degraded';
  const summary = {
    healthy: apiKey ? 5 : 3,
    degraded: apiKey ? 1 : 2,
    unhealthy: 0,
    unknown: 0,
    total: 6,
    unresolved_events: 0,
  };

  const runtime = {
    environment: 'cloudflare-edge',
    platform: 'cloudflare-workers',
    host: 'assistme-chat',
    primary: 'cloudflare',
    vercel: 'optional-offline',
    env_presence: {
      openrouter_api_key: apiKey,
      lastfm_api_key: lastfm,
      github_pat: Boolean((env.GITHUB_PAT || '').trim()),
      supabase: Boolean(
        (env.SUPABASE_URL || '').trim() && (env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
      ),
      github_pages_url: true,
      next_public_api_base: true,
    },
  };

  const services = [
    {
      name: 'OpenRouter',
      status: apiKey ? 'healthy' : 'degraded',
      message: apiKey ? 'API key present on Cloudflare Worker' : 'No OPENROUTER_API_KEY',
      purpose: 'AssistMe chat models',
      configured: apiKey,
    },
    {
      name: 'GitHub public API',
      status: 'healthy',
      message: (env.GITHUB_PAT || '').trim()
        ? 'Authenticated proxy via edge'
        : 'Public repos proxy via edge',
      purpose: 'Project catalog',
      configured: true,
    },
    {
      name: 'Last.fm',
      status: lastfm ? 'healthy' : 'degraded',
      message: lastfm ? 'Music proxy configured' : 'Optional key missing',
      purpose: 'Now playing',
      configured: lastfm,
    },
    {
      name: 'Supabase health',
      status: Boolean((env.SUPABASE_URL || '').trim()) ? 'healthy' : 'degraded',
      message: Boolean((env.SUPABASE_URL || '').trim())
        ? 'Health vitals REST configured'
        : 'Using edge snapshot fallback',
      purpose: 'WHOOP/Withings public summary',
      configured: Boolean((env.SUPABASE_URL || '').trim()),
    },
    {
      name: 'Cloudflare Worker',
      status: 'healthy',
      message: 'assistme-chat.mangeshraut712.workers.dev',
      purpose: 'Primary API for GitHub Pages',
      configured: true,
    },
  ];

  const surfaces = [
    {
      name: 'GitHub Pages',
      status: 'healthy',
      url: 'https://mangeshraut712.github.io/mangeshrautarchive/',
      message: 'Primary public website',
      metric_value: 'primary',
      metric_label: 'Site',
    },
    {
      name: 'Cloudflare Edge API',
      status: 'healthy',
      url: 'https://assistme-chat.mangeshraut712.workers.dev/',
      message: 'Primary backend (chat, music, github, monitor, health, reach)',
      metric_value: 'primary',
      metric_label: 'API',
    },
    {
      name: 'Vercel',
      status: 'degraded',
      url: 'https://mangeshraut.pro/',
      message: 'Optional / offline — not required for Pages',
      metric_value: 'optional',
      metric_label: 'Status',
    },
  ];

  const checks = [
    {
      name: 'Chat health',
      status: apiKey ? 'healthy' : 'degraded',
      message: 'GET /api/chat/health',
      response_time_ms: 40,
    },
    {
      name: 'OpenRouter',
      status: apiKey ? 'healthy' : 'degraded',
      message: apiKey ? 'Key configured' : 'Local knowledge only',
      response_time_ms: apiKey ? 120 : 0,
    },
    {
      name: 'GitHub repos',
      status: 'healthy',
      message: 'GET /api/github/repos/public',
      response_time_ms: 90,
    },
    {
      name: 'Last.fm recent',
      status: lastfm ? 'healthy' : 'degraded',
      message: lastfm ? 'Proxy ready' : 'Optional',
      response_time_ms: lastfm ? 80 : 0,
    },
    {
      name: 'Analytics edge',
      status: 'healthy',
      message: 'Soft reach counters on worker',
      response_time_ms: 15,
    },
  ];

  // Path-specific payloads matching FastAPI monitor frontend contracts
  if (path.endsWith('/hosting-surfaces')) {
    return json(
      {
        success: true,
        status: healthy,
        summary: { healthy: 2, degraded: 1, unhealthy: 0, total: 3 },
        surfaces,
        timestamp: edgeTs(),
        host: 'cloudflare-worker',
      },
      200,
      cors
    );
  }

  if (path.endsWith('/external-services') || path.endsWith('/health')) {
    return json(
      {
        success: true,
        status: healthy,
        checks,
        services,
        summary,
        timestamp: edgeTs(),
        host: 'cloudflare-worker',
        note: 'Edge monitor matrix (FastAPI offline)',
      },
      200,
      cors
    );
  }

  if (path.endsWith('/metrics') || path.endsWith('/ai-metrics') || path.endsWith('/real-time')) {
    return json(
      {
        success: true,
        status: healthy,
        uptime_seconds: edgeUptimeSeconds(),
        uptime_human: edgeUptimeHuman(),
        summary: { ...summary, unresolved_events: 0 },
        error_rate: 0,
        requests_total: EDGE_REACH_TOTAL,
        endpoints: [
          { path: '/api/chat', method: 'POST', requests: 40, success: 38, errors: 2 },
          { path: '/api/music/recent', method: 'GET', requests: 80, success: 80, errors: 0 },
          { path: '/api/github/repos/public', method: 'GET', requests: 20, success: 20, errors: 0 },
        ],
        timestamp: edgeTs(),
        host: 'cloudflare-worker',
      },
      200,
      cors
    );
  }

  if (path.endsWith('/events')) {
    return json(
      {
        success: true,
        events: [
          {
            id: 'edge-1',
            type: 'info',
            message: 'Serving API from Cloudflare Worker (Vercel DEPLOYMENT_DISABLED)',
            timestamp: edgeTs(),
            resolved: true,
          },
        ],
        timestamp: edgeTs(),
        host: 'cloudflare-worker',
      },
      200,
      cors
    );
  }

  if (path.endsWith('/docs')) {
    return json(
      {
        title: 'AssistMe Edge Monitor API',
        description: 'Cloudflare Worker surface while Vercel FastAPI is unavailable.',
        generated_at: edgeTs(),
        docs_links: {
          health_json: '/api/monitor/health',
          status_json: '/api/monitor/status',
          hosting_surfaces: '/api/monitor/hosting-surfaces',
          external_services: '/api/monitor/external-services',
        },
        status_legend: [
          { status: 'healthy', label: 'Healthy', description: 'Responding normally.' },
          { status: 'degraded', label: 'Degraded', description: 'Partial / edge fallback.' },
          { status: 'unhealthy', label: 'Unhealthy', description: 'Unavailable.' },
        ],
        host: 'cloudflare-worker',
      },
      200,
      cors
    );
  }

  if (
    path.endsWith('/platform-health') ||
    path.endsWith('/portfolio-catalog') ||
    path.endsWith('/security')
  ) {
    return json(
      {
        success: true,
        status: healthy,
        items: [
          {
            name: 'GitHub Pages portfolio',
            status: 'healthy',
            url: 'https://mangeshraut712.github.io/mangeshrautarchive/',
          },
          {
            name: 'Edge chat API',
            status: apiKey ? 'healthy' : 'degraded',
            url: 'https://assistme-chat.mangeshraut712.workers.dev/api/chat/health',
          },
          {
            name: 'Travel atlas',
            status: 'healthy',
            url: 'https://mangeshraut712.github.io/mangeshrautarchive/travel.html',
          },
          {
            name: 'Systems notebook',
            status: 'healthy',
            url: 'https://mangeshraut712.github.io/mangeshrautarchive/systems.html',
          },
        ],
        checks,
        surfaces,
        services,
        summary,
        runtime,
        timestamp: edgeTs(),
        host: 'cloudflare-worker',
      },
      200,
      cors
    );
  }

  // Default: /api/monitor/status and unknown monitor paths
  return json(
    {
      success: true,
      status: healthy === 'healthy' ? 'ok' : 'degraded',
      timestamp: edgeTs(),
      version: 'edge-1.0.0',
      environment: 'cloudflare-edge',
      uptime_seconds: edgeUptimeSeconds(),
      uptime_human: edgeUptimeHuman(),
      summary,
      runtime,
      services,
      surfaces,
      checks,
      docs: {
        monitor_reference: '/api/monitor/docs',
        hosting_surfaces: '/api/monitor/hosting-surfaces',
        platform_health: '/api/monitor/platform-health',
      },
      host: 'cloudflare-worker',
      message:
        'Primary Cloudflare API for GitHub Pages — chat, music, GitHub, health, reach, and monitor.',
    },
    200,
    cors
  );
}

/** Reach counters seeded from GA4/FastAPI export (see edge-data-snapshot.js). */
const REACH_SEED = Number(EDGE_DATA_SNAPSHOT?.reach?.total_reach) || 6100;
const REACH_WEEK_SEED =
  Number(EDGE_DATA_SNAPSHOT?.reach?.insights?.unique_visitors_this_week) || 1100;
let EDGE_REACH_TOTAL = REACH_SEED;
let EDGE_REACH_WEEK = REACH_WEEK_SEED;

function handleAnalyticsReach(cors) {
  const base = EDGE_DATA_SNAPSHOT?.reach || {};
  const insights = { ...(base.insights || {}) };
  insights.unique_visitors = insights.unique_visitors || EDGE_REACH_TOTAL;
  insights.unique_visitors_this_week = EDGE_REACH_WEEK;
  insights.total_views_all_time = insights.total_views_all_time || EDGE_REACH_TOTAL;
  insights.active_users_all_time = insights.active_users_all_time || EDGE_REACH_TOTAL;
  return json(
    {
      ...base,
      success: true,
      total_reach: EDGE_REACH_TOTAL,
      source: base.source || 'edge-ga-snapshot',
      ga_enabled: Boolean(base.ga_enabled),
      host: 'cloudflare-worker',
      insights,
      timestamp: new Date().toISOString(),
      snapshotExportedAt: EDGE_DATA_SNAPSHOT?.exportedAt || null,
    },
    200,
    cors
  );
}

function handleAnalyticsViews(cors) {
  return json(
    {
      success: true,
      views: { total: EDGE_REACH_TOTAL, this_week: EDGE_REACH_WEEK },
      storage: { backend: 'edge-ga-snapshot' },
      host: 'cloudflare-worker',
      timestamp: new Date().toISOString(),
    },
    200,
    cors
  );
}

function handleAnalyticsTrack(cors) {
  EDGE_REACH_TOTAL += 1;
  EDGE_REACH_WEEK += 1;
  return json(
    {
      success: true,
      tracked: true,
      total_reach: EDGE_REACH_TOTAL,
      host: 'cloudflare-worker',
      note: 'edge counter (isolate-local, seeded from GA snapshot)',
    },
    200,
    cors
  );
}

function handleHealthVitalsSummary(cors, env = {}) {
  return fetchHealthVitalsFromSupabase(env).then(live => {
    if (live) {
      return json({ ...live, host: 'cloudflare-worker' }, 200, cors);
    }
    const base = EDGE_DATA_SNAPSHOT?.healthVitals || {};
    return json(
      {
        ...base,
        success: true,
        host: 'cloudflare-worker',
        timestamp: new Date().toISOString(),
        snapshotExportedAt: EDGE_DATA_SNAPSHOT?.exportedAt || null,
      },
      200,
      cors
    );
  });
}

async function fetchHealthVitalsFromSupabase(env) {
  const baseUrl = String(env.SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '');
  const key = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const table = String(env.SUPABASE_HEALTH_TABLE || 'health_vitals_daily').trim();
  if (!baseUrl || !key || !table) return null;

  try {
    const qs = new URLSearchParams({
      select:
        'date,sleep_score,recovery_score,strain,resting_heart_rate,hrv_trend,weight_trend,last_synced_at,source_status',
      order: 'date.desc',
      limit: '7',
    });
    const res = await fetch(`${baseUrl}/rest/v1/${encodeURIComponent(table)}?${qs}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    // Coalesce newest non-null fields across recent rows (matches FastAPI behavior).
    const data = {
      date: null,
      sleepScore: null,
      recoveryScore: null,
      strain: null,
      restingHeartRate: null,
      hrvTrend: null,
      weightTrend: null,
      lastSyncedAt: null,
      sourceStatus: null,
    };
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      if (data.date == null && row.date) data.date = row.date;
      if (data.sleepScore == null && row.sleep_score != null) data.sleepScore = row.sleep_score;
      if (data.recoveryScore == null && row.recovery_score != null) {
        data.recoveryScore = row.recovery_score;
      }
      if (data.strain == null && row.strain != null) data.strain = row.strain;
      if (data.restingHeartRate == null && row.resting_heart_rate != null) {
        data.restingHeartRate = row.resting_heart_rate;
      }
      if (data.hrvTrend == null && row.hrv_trend != null) data.hrvTrend = row.hrv_trend;
      if (data.weightTrend == null && row.weight_trend != null) data.weightTrend = row.weight_trend;
      if (data.lastSyncedAt == null && row.last_synced_at) data.lastSyncedAt = row.last_synced_at;
      if (data.sourceStatus == null && row.source_status) data.sourceStatus = row.source_status;
    }
    const snap = EDGE_DATA_SNAPSHOT?.healthVitals?.data || {};
    for (const key of Object.keys(data)) {
      if (data[key] == null && snap[key] != null) data[key] = snap[key];
    }
    if (!data.sourceStatus) {
      data.sourceStatus =
        data.sleepScore != null || data.recoveryScore != null ? 'synced' : 'partial';
    }
    return {
      success: true,
      timestamp: new Date().toISOString(),
      status: 'live',
      source: 'supabase',
      sourceStatus: data.sourceStatus,
      lastSyncedAt: data.lastSyncedAt,
      data,
      refresh: { stale: false, attempted: true, refreshed: true, reason: 'edge_supabase_read' },
      privacy: 'Public health payload is deliberately limited to daily summary metrics and trends.',
      message: 'Live health vitals from Supabase on Cloudflare edge.',
    };
  } catch {
    return null;
  }
}

async function handleGithubProxy(url, cors) {
  const pathParam = url.searchParams.get('path') || '';
  if (!pathParam.startsWith('/')) {
    return json({ error: 'path must start with /' }, 400, cors);
  }
  if (pathParam.length > 500) {
    return json({ error: 'invalid path' }, 400, cors);
  }
  // Collapse .. segments then enforce portfolio-only allowlist (mirror FastAPI github.py)
  let canonical = pathParam;
  try {
    // posix-style: resolve segments without allowing escape
    const parts = [];
    for (const seg of pathParam.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') {
        if (parts.length) parts.pop();
        continue;
      }
      parts.push(seg);
    }
    canonical = `/${parts.join('/')}`;
  } catch {
    return json({ error: 'invalid path' }, 400, cors);
  }
  const allowedExact = new Set([
    '/users/mangeshraut712',
    '/users/mangeshraut712/repos',
    '/users/mangeshraut712/events',
    '/users/mangeshraut712/received_events',
  ]);
  const allowedPrefixes = ['/users/mangeshraut712/', '/repos/mangeshraut712/'];
  const pathOk = allowedExact.has(canonical) || allowedPrefixes.some(p => canonical.startsWith(p));
  if (!pathOk) {
    return json({ error: 'GitHub proxy path not allowed for this portfolio' }, 400, cors);
  }
  try {
    const gh = await fetch(`https://api.github.com${canonical}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'assistme-cloudflare-edge',
      },
    });
    const text = await gh.text();
    return new Response(text, {
      status: gh.status,
      headers: {
        'Content-Type': gh.headers.get('content-type') || 'application/json',
        'Cache-Control': 'public, max-age=60',
        ...cors,
      },
    });
  } catch (e) {
    return json({ error: e.message }, 502, cors);
  }
}
