/**
 * /api/views — Real-time portfolio views counter
 * Uses Vercel KV (Redis) if configured, falls back to in-memory counter.
 *
 * ENV vars needed (set in Vercel dashboard):
 *   KV_REST_API_URL   — from Vercel KV integration
 *   KV_REST_API_TOKEN — from Vercel KV integration
 */

// In-memory fallback (resets on cold start, good enough for demo)
let _memoryCt = 9412;

async function kvIncr(url, token, key) {
  const res = await fetch(`${url}/incr/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('KV incr failed');
  const data = await res.json();
  return Number(data.result);
}

async function kvGet(url, token, key) {
  const res = await fetch(`${url}/get/${key}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('KV get failed');
  const data = await res.json();
  return Number(data.result) || 0;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.setHeader('Cache-Control', 'no-store');

  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  const KEY = 'portfolio:views';

  try {
    let count;
    if (KV_REST_API_URL && KV_REST_API_TOKEN) {
      if (req.method === 'POST') {
        count = await kvIncr(KV_REST_API_URL, KV_REST_API_TOKEN, KEY);
      } else {
        count = await kvGet(KV_REST_API_URL, KV_REST_API_TOKEN, KEY);
      }
    } else {
      // In-memory fallback
      if (req.method === 'POST') _memoryCt++;
      count = _memoryCt;
    }

    return res.status(200).json({ views: count });
  } catch (err) {
    console.error('[Views API Error]', err.message);
    return res.status(200).json({ views: _memoryCt });
  }
}
