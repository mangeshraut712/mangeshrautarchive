# Integration Auth Playbook (Chrome)

Use **real Chrome** signed into the accounts you want to connect. OAuth consent screens rely on your browser session; the Cursor embedded browser is often slower and may not share your Google/WHOOP/Withings login.

## Before you start

1. Confirm production env vars are set in Vercel (via `scripts/integrations/sync-vercel-integration-env.mjs`).
2. Keep these secrets **only** in `.env.local` and Vercel — never paste them in chat:
   - `INTEGRATION_SYNC_ADMIN_TOKEN`
   - `INTEGRATION_ENCRYPTION_KEY`
   - Provider client secrets
3. Check readiness:

```text
https://mangeshraut.pro/api/integrations/status
```

Each provider shows `configured`, `connected`, and a `connectUrl` when ready.

---

## Step 1 — Google Calendar (free/busy)

**You do:**

1. Open Chrome as `mbr63drexel@gmail.com` (GCP OAuth test user).
2. Visit:

```text
https://mangeshraut.pro/api/integrations/google-calendar/connect
```

3. Approve calendar read + free/busy scopes.
4. You should land on `https://mangeshraut.pro/monitor#integrations`.
5. Verify:

```text
https://mangeshraut.pro/api/calendar/availability
```

Expect `"status": "live"` and a `days` array.

**Optional admin push watch** (after connect):

```bash
curl -X POST https://mangeshraut.pro/api/calendar/watch/google \
  -H "x-integration-admin-token: <from .env.local>"
```

---

## Step 2 — WHOOP (sleep / recovery / strain)

**You do (developer portal):**

1. Create an app at [developer.whoop.com](https://developer.whoop.com).
2. Redirect URI:

```text
https://mangeshraut.pro/api/integrations/whoop/callback
```

3. Add to `.env.local`:

```text
WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...
WHOOP_REDIRECT_URI=https://mangeshraut.pro/api/integrations/whoop/callback
```

4. Sync to Vercel production, redeploy, then in Chrome visit:

```text
https://mangeshraut.pro/api/integrations/whoop/connect
```

5. Sign in with your WHOOP account and approve scopes.

---

## Step 3 — Withings (weight / body metrics)

**You do (developer portal):**

1. Create an app at [developer.withings.com](https://developer.withings.com).
2. Redirect URI:

```text
https://mangeshraut.pro/api/integrations/withings/callback
```

3. Add to `.env.local`:

```text
WITHINGS_CLIENT_ID=...
WITHINGS_CLIENT_SECRET=...
WITHINGS_REDIRECT_URI=https://mangeshraut.pro/api/integrations/withings/callback
```

4. Sync to Vercel production, redeploy, then in Chrome visit:

```text
https://mangeshraut.pro/api/integrations/withings/connect
```

---

## Step 4 — Admin sync (real data → Supabase → site widget)

After at least one health provider is connected, trigger a server-side pull with your admin token header.

**Sync health providers only:**

```bash
curl -X POST https://mangeshraut.pro/api/health-vitals/sync \
  -H "x-integration-admin-token: <from .env.local>"
```

**Sync all connected providers (health + calendar):**

```bash
curl -X POST https://mangeshraut.pro/api/integrations/sync-all \
  -H "x-integration-admin-token: <from .env.local>"
```

**Manual seed (until OAuth is connected):**

```bash
curl -X POST https://mangeshraut.pro/api/health-vitals/sync \
  -H "Content-Type: application/json" \
  -H "x-integration-admin-token: <from .env.local>" \
  -d '{"date":"2026-06-12","sleep_score":81,"recovery_score":47,"strain":5.2,"weight_trend":"103.4 kg"}'
```

Verify public payload:

```text
https://mangeshraut.pro/api/health-vitals/summary
```

The home/monitor health widget reads this when `"status": "live"`.

---

## Step 5 — Disconnect / revoke

```bash
curl -X POST https://mangeshraut.pro/api/integrations/whoop/disconnect \
  -H "x-integration-admin-token: <from .env.local>"
```

Replace `whoop` with `withings` or `google_calendar`.

---

## What I need from you

| Task | Why |
|------|-----|
| Complete Google Calendar connect in Chrome | Unblocks live availability on contact/monitor |
| Create WHOOP + Withings OAuth apps and send **client IDs only** (not secrets) | I can verify redirect URIs and env key names |
| Run admin sync curl locally after connect | Pulls first real row into Supabase |
| Tell me if OAuth redirect fails (exact URL + error text) | Fastest way to fix redirect URI mismatches |

---

## Local testing (optional)

```bash
npm run dev:api
```

Then use `http://localhost:3000/api/integrations/status` and the same connect paths on localhost if redirect URIs include `http://localhost:...`.

OAuth state signing uses `INTEGRATION_SYNC_ADMIN_TOKEN`; keep it stable across local and production while testing.
