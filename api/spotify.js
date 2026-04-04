/**
 * /api/spotify — Spotify Now Playing Serverless Endpoint
 *
 * Required environment variables (set in Vercel dashboard):
 *   SPOTIFY_CLIENT_ID
 *   SPOTIFY_CLIENT_SECRET
 *   SPOTIFY_REFRESH_TOKEN
 *
 * To get a refresh token:
 *   1. Go to https://developer.spotify.com/dashboard and create an app
 *   2. Add https://mangeshraut.pro/api/spotify/callback as redirect URI
 *   3. Run the auth flow once to get the refresh token
 *   4. Store it in Vercel env vars
 */

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

// Module-level token cache
let _accessToken = null;
let _tokenExpiry = 0;

async function getAccessToken(clientId, clientSecret, refreshToken) {
  // Return cached token if still valid (with 60s buffer)
  if (_accessToken && Date.now() < _tokenExpiry - 60000) {
    return _accessToken;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  _accessToken = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return _accessToken;
}

async function getNowPlaying(token) {
  const res = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

async function getRecentlyPlayed(token) {
  const res = await fetch(RECENTLY_PLAYED_ENDPOINT, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.items?.[0]?.track || null;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  // Cache-Control: short TTL
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    // Not configured — return graceful empty response
    return res.status(200).json({ isPlaying: false, configured: false });
  }

  try {
    const token = await getAccessToken(
      SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET,
      SPOTIFY_REFRESH_TOKEN
    );

    const nowPlaying = await getNowPlaying(token);

    if (nowPlaying && nowPlaying.is_playing && nowPlaying.item) {
      const track = nowPlaying.item;
      return res.status(200).json({
        isPlaying: true,
        song: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        albumArt: track.album.images?.[1]?.url || track.album.images?.[0]?.url || null,
        songUrl: track.external_urls?.spotify || null,
        progress: nowPlaying.progress_ms,
        duration: track.duration_ms,
      });
    }

    // Not currently playing — try recently played
    const recent = await getRecentlyPlayed(token);
    if (recent) {
      return res.status(200).json({
        isPlaying: false,
        song: recent.name,
        artist: recent.artists.map(a => a.name).join(', '),
        album: recent.album.name,
        albumArt: recent.album.images?.[1]?.url || recent.album.images?.[0]?.url || null,
        songUrl: recent.external_urls?.spotify || null,
        progress: null,
        duration: recent.duration_ms,
      });
    }

    return res.status(200).json({ isPlaying: false });
  } catch (err) {
    console.error('[Spotify API Error]', err.message);
    return res.status(200).json({ isPlaying: false, error: 'fetch_failed' });
  }
}
