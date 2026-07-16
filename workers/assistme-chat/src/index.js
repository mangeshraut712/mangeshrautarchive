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
 *   GET  /api/music/recent
 */

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
  const ok =
    !origin ||
    list.includes(origin) ||
    list.some(a => origin.startsWith(a.replace(/\/$/, ''))) ||
    /localhost|127\.0\.0\.1/.test(origin);
  return {
    'Access-Control-Allow-Origin': ok && origin ? origin : list[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Origin',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
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
  if (t.length < 12) return true;
  return /^(user\s*safety\s*:\s*(safe|unsafe)|safe|unsafe|allowed|blocked)$/i.test(t);
}

function buildModelChain(env, requested) {
  const primary = (requested || env.OPENROUTER_MODEL || PRIMARY_MODEL || '').trim();
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

function streamOpenRouterToNdjson(upstream, model, cors) {
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
        const fallback = localAnswer('skills experience contact');
        push({ type: 'chunk', content: fallback });
        full = fallback;
        push({
          type: 'done',
          full_content: full,
          metadata: {
            model: 'edge-local',
            source: 'Local Intelligence',
            sourceLabel: 'AssistMe Edge (fallback)',
            host: 'cloudflare-worker',
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
        return streamOpenRouterToNdjson(res, model, cors);
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

async function handleGithubRepos(url, cors) {
  const username = url.searchParams.get('username') || 'mangeshraut712';
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 100)));
  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${limit}&sort=updated`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'assistme-cloudflare-edge',
        },
      }
    );
    if (!res.ok) {
      return json(
        { success: false, error: `GitHub HTTP ${res.status}`, items: [] },
        res.status === 403 ? 503 : res.status,
        cors
      );
    }
    const repos = await res.json();
    return json(
      {
        success: true,
        source: 'github-public',
        host: 'cloudflare-worker',
        items: Array.isArray(repos) ? repos : [],
        count: Array.isArray(repos) ? repos.length : 0,
      },
      200,
      cors
    );
  } catch (e) {
    return json({ success: false, error: e.message, items: [] }, 502, cors);
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
      return handleGithubRepos(url, cors);
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
          message: 'Realtime voice requires Vercel AI Gateway; unavailable on edge.',
        },
        200,
        cors
      );
    }

    // Soft monitor surface (Vercel FastAPI offline)
    if (
      request.method === 'GET' &&
      (path === '/api/monitor/status' ||
        path === '/api/monitor/engineering' ||
        path.startsWith('/api/monitor/'))
    ) {
      return handleMonitorStatus(env, cors, path);
    }

    // Soft analytics so Pages does not spam blocked Vercel
    if (request.method === 'GET' && path === '/api/analytics/reach') {
      return handleAnalyticsReach(cors);
    }
    if (request.method === 'GET' && path === '/api/analytics/views') {
      return handleAnalyticsViews(cors);
    }
    if (request.method === 'POST' && path === '/api/analytics/track') {
      return json(
        { success: true, tracked: false, host: 'cloudflare-worker', note: 'edge no-op track' },
        200,
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
          ],
        },
        200,
        cors
      );
    }

    return json({ error: 'Not found', hint: 'POST /api/chat or GET /api/chat/health' }, 404, cors);
  },
};

async function handleMonitorStatus(env, cors, path) {
  const apiKey = (env.OPENROUTER_API_KEY || '').trim();
  const payload = {
    success: true,
    status: apiKey ? 'healthy' : 'degraded',
    host: 'cloudflare-worker',
    path,
    message:
      'Edge monitor surface while Vercel FastAPI is unavailable. Chat, GitHub, and music are live on this worker.',
    uptime: null,
    services: [
      { name: 'assistme-chat', status: 'ok', host: 'cloudflare-worker' },
      {
        name: 'openrouter',
        status: apiKey ? 'configured' : 'local_only',
      },
      { name: 'github-public', status: 'ok' },
      { name: 'lastfm-proxy', status: env.LASTFM_API_KEY ? 'configured' : 'optional' },
    ],
    open_issues: 0,
    last_updated: new Date().toISOString(),
    vercel: { status: 'DEPLOYMENT_DISABLED', note: 'Use Cloudflare edge' },
  };
  return json(payload, 200, cors);
}

function handleAnalyticsReach(cors) {
  return json(
    {
      success: true,
      total_reach: 0,
      source: 'edge-placeholder',
      ga_enabled: false,
      host: 'cloudflare-worker',
      message:
        'Portfolio Reach requires GA4/Redis on FastAPI. Edge returns a quiet placeholder while Vercel is blocked.',
      insights: {
        unique_visitors: 0,
        total_views_all_time: 0,
        countries_this_week: 0,
        trend: [],
      },
      timestamp: new Date().toISOString(),
    },
    200,
    cors
  );
}

function handleAnalyticsViews(cors) {
  return json(
    {
      success: true,
      views: { total: 0, this_week: 0 },
      storage: { backend: 'edge-placeholder' },
      host: 'cloudflare-worker',
      timestamp: new Date().toISOString(),
    },
    200,
    cors
  );
}

async function handleGithubProxy(url, cors) {
  const pathParam = url.searchParams.get('path') || '';
  if (!pathParam.startsWith('/')) {
    return json({ error: 'path must start with /' }, 400, cors);
  }
  // Block non-GET-safe abuse
  if (pathParam.includes('..') || pathParam.length > 500) {
    return json({ error: 'invalid path' }, 400, cors);
  }
  try {
    const gh = await fetch(`https://api.github.com${pathParam}`, {
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
