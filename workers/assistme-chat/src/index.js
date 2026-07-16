/**
 * AssistMe Chat Proxy — Cloudflare Worker
 * Uses OPENROUTER_API_KEY from Worker secrets (set via GH Actions / wrangler).
 * Serves GitHub Pages when Vercel is unavailable (DEPLOYMENT_DISABLED).
 *
 * Endpoints:
 *   GET  /api/chat/health
 *   GET  /api/health
 *   POST /api/chat   { message, stream?, model? }
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const FREE_MODELS = [
  'openrouter/free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
];

const SYSTEM_PROMPT = `You are AssistMe, the AI assistant for Mangesh Raut's portfolio (mangeshraut.pro / GitHub Pages mirror).
Answer helpfully about Mangesh's experience, skills, projects, education, and contact.
Facts to prefer:
- Software Engineer at Customized Energy Solutions (energy analytics, AWS, Java/Spring, Python).
- Prior: IoasiZ microservices, Aramark cloud automation.
- MSCS Drexel University (GPA ~3.76); BE Computer Engineering SPPU.
- Stack: Java Spring Boot, Python, AWS, Terraform, React/Angular, ML (TensorFlow).
- Contact: mbr63@drexel.edu · linkedin.com/in/mangeshraut71298 · github.com/mangeshraut712
Keep answers concise, professional, and friendly. Use Markdown sparingly.`;

function corsHeaders(origin, allowed) {
  const list = String(allowed || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const ok =
    origin &&
    (list.includes(origin) ||
      list.some(a => a && origin.startsWith(a.replace(/\/$/, ''))) ||
      /localhost|127\.0\.0\.1/.test(origin));
  return {
    'Access-Control-Allow-Origin': ok ? origin : list[0] || '*',
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
    return "👋 Hello! I'm **AssistMe** (GitHub Pages edge mode). Ask about Mangesh's skills, experience, projects, education, or contact.";
  }
  if (/skill|stack|technolog|java|python|aws|cloud/.test(q)) {
    return "Mangesh's core stack: **Java Spring Boot**, **Python**, **AWS** (Lambda, EC2, ECS, S3), **Terraform**, React/Angular, and ML with TensorFlow. He builds full-stack + cloud systems with production reliability.";
  }
  if (/experience|work|job|company|ces|ioasiz|aramark/.test(q)) {
    return 'Mangesh is a **Software Engineer at Customized Energy Solutions**, focusing on energy analytics and cloud systems. Previously he built microservices at **IoasiZ** and automated cloud workflows at **Aramark**.';
  }
  if (/educat|degree|university|drexel|gpa/.test(q)) {
    return 'Education: **M.S. Computer Science, Drexel University** (GPA ~3.76) and **B.E. Computer Engineering**, Savitribai Phule Pune University.';
  }
  if (/project|github|portfolio/.test(q)) {
    return "Explore Mangesh's work at [github.com/mangeshraut712](https://github.com/mangeshraut712) and the live portfolio at [mangeshraut.pro](https://mangeshraut.pro). Featured areas include agentic portfolio systems, energy analytics, and full-stack apps.";
  }
  if (/contact|email|linkedin|hire|reach/.test(q)) {
    return 'Contact Mangesh: **mbr63@drexel.edu** · [LinkedIn](https://linkedin.com/in/mangeshraut71298) · [GitHub](https://github.com/mangeshraut712).';
  }
  return "I'm AssistMe in **edge/local knowledge mode**. Ask about skills, experience, education, projects, or contact — or wait for OpenRouter online mode if the free model is rate-limited.";
}

async function callOpenRouter(apiKey, model, messages, stream) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://mangeshraut712.github.io/mangeshrautarchive',
      'X-Title': 'AssistMe GitHub Pages',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: Boolean(stream),
      temperature: 0.6,
      max_tokens: 1200,
    }),
  });
  return res;
}

function isGarbage(text) {
  const t = String(text || '').trim();
  if (t.length < 12) return true;
  return /^(user\s*safety\s*:\s*(safe|unsafe)|safe|unsafe|allowed|blocked)$/i.test(t);
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
      (path === '/api/health' || path === '/api/chat/health' || path === '/health')
    ) {
      const hasKey = Boolean(env.OPENROUTER_API_KEY);
      let provider_status = hasKey ? 'configured' : 'local_only';
      let status = hasKey ? 'degraded' : 'degraded';
      let message = hasKey
        ? 'OpenRouter key present on edge worker.'
        : 'No OPENROUTER_API_KEY secret on worker — local knowledge only.';

      if (hasKey) {
        try {
          const probe = await fetch('https://openrouter.ai/api/v1/models', {
            headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
          });
          if (probe.ok) {
            status = 'healthy';
            provider_status = 'online';
            message = 'OpenRouter reachable via GitHub-deployed edge worker.';
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
          local_only: !hasKey,
          streaming: 'ndjson',
          model: env.OPENROUTER_MODEL || FREE_MODELS[0],
          host: 'cloudflare-worker',
          message,
          timestamp: new Date().toISOString(),
        },
        200,
        cors
      );
    }

    if (request.method === 'POST' && (path === '/api/chat' || path === '/chat')) {
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
      const history = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
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

      const apiKey = env.OPENROUTER_API_KEY || '';
      if (!apiKey) {
        const answer = localAnswer(message);
        if (wantStream) {
          return streamLocal(answer, cors);
        }
        return json(
          {
            answer,
            source: 'Local Intelligence',
            model: 'edge-local',
            type: 'local',
            confidence: 1,
          },
          200,
          cors
        );
      }

      const chain = [body.model || env.OPENROUTER_MODEL || FREE_MODELS[0], ...FREE_MODELS].filter(
        (v, i, a) => v && a.indexOf(v) === i
      );

      let lastErr = 'upstream failed';
      for (const model of chain) {
        try {
          const res = await callOpenRouter(apiKey, model, messages, wantStream);
          if (!res.ok) {
            lastErr = `OpenRouter HTTP ${res.status}`;
            if (res.status === 402 || res.status === 429 || res.status >= 500) {
              continue;
            }
            continue;
          }

          if (wantStream) {
            // Convert OpenAI SSE → NDJSON chunks for existing frontend
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
              confidence: 0.9,
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
      if (wantStream) {
        return streamLocal(answer, cors, lastErr);
      }
      return json(
        {
          answer,
          source: 'Local Intelligence',
          model: 'edge-local',
          type: 'local',
          fallback_reason: lastErr,
          confidence: 1,
        },
        200,
        cors
      );
    }

    return json(
      {
        error: 'Not found',
        hint: 'POST /api/chat or GET /api/chat/health',
      },
      404,
      cors
    );
  },
};

function streamLocal(answer, cors, reason = '') {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const push = obj => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      push({ type: 'typing', status: 'start' });
      push({ type: 'typing', status: 'stop' });
      const step = 24;
      for (let i = 0; i < answer.length; i += step) {
        push({ type: 'chunk', content: answer.slice(i, i + step) });
      }
      push({
        type: 'done',
        full_content: answer,
        metadata: {
          model: 'edge-local',
          source: 'Local Intelligence',
          sourceLabel: 'AssistMe Edge (offline knowledge)',
          fallback_reason: reason || undefined,
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
              const content = jsonData?.choices?.[0]?.delta?.content || '';
              if (content) {
                full += content;
                push({ type: 'chunk', content });
              }
            } catch {
              // ignore partial JSON
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
      }

      push({
        type: 'done',
        full_content: full,
        metadata: {
          model,
          source: 'OpenRouter',
          sourceLabel: `OpenRouter (${model.split('/').pop()})`,
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
