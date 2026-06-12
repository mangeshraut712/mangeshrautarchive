# Integration Auth Playbook (Chrome)

Use **real Chrome** signed into the accounts you want to connect. OAuth consent screens rely on your browser session; the Cursor embedded browser is often slower and may not share your Google/WHOOP/Withings login.

## Before you start

1. Confirm production env vars are set in Vercel (via `scripts/integrations/sync-vercel-integration-env.mjs`).
2. Keep these secrets **only** in `.env` and Vercel — never paste them in chat:
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
  -H "x-integration-admin-token: <from .env>"
```

---

## Step 2 — WHOOP (sleep / recovery / strain)

### Where to find Client ID + Secret

1. Open **https://developer-dashboard.whoop.com** (not the docs site).
2. Sign in with your WHOOP account → create a **Team** if prompted.
3. Click **Create App** (or go to **https://developer-dashboard.whoop.com/apps/create**).
4. Fill in:
   - **App name:** anything (e.g. `mangeshrautarchive`)
   - **Redirect URI:** `https://mangeshraut.pro/api/integrations/whoop/callback` (must match exactly)
   - **Scopes:** enable `offline`, `read:recovery`, `read:cycles`, `read:sleep`, `read:body_measurement`
5. Click **Create** → copy **Client ID** and **Client Secret** from the app details page.

**You set in `.env` + Vercel:**

```text
WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...
WHOOP_REDIRECT_URI=https://mangeshraut.pro/api/integrations/whoop/callback
```

4. Save locally + sync to Vercel:

```bash
npm run integrations:set-whoop-withings
```

(or paste the four values in chat and ask the agent to run the script)

5. After deploy, in Chrome visit:

```text
https://mangeshraut.pro/api/integrations/whoop/connect
```

---

## Step 3 — Withings (weight / body metrics)

### Where to find Client ID + Secret

1. Open **https://developer.withings.com** → **Log In to Withings Partner Hub**.
2. Go to your **Dashboard** → **Create an application**.
3. Choose **Public API integration** (not Medical Cloud).
4. Fill in:
   - **Target environment:** Development
   - **Application name / description:** anything
   - **Registered URLs (redirect URI):** `https://mangeshraut.pro/api/integrations/withings/callback`
5. Save → **Client ID** and **Client Secret** appear on the application page.

**You set in `.env` + Vercel:**

```text
WITHINGS_CLIENT_ID=...
WITHINGS_CLIENT_SECRET=...
WITHINGS_REDIRECT_URI=https://mangeshraut.pro/api/integrations/withings/callback
```

4. Run `npm run integrations:set-whoop-withings` (same script saves both providers).

5. After deploy, in Chrome visit:

```text
https://mangeshraut.pro/api/integrations/withings/connect
```

---

## Step 4 — Admin sync (real data → Supabase → site widget)

After at least one health provider is connected, trigger a server-side pull with your admin token header.

**Sync health providers only:**

```bash
curl -X POST https://mangeshraut.pro/api/health-vitals/sync \
  -H "x-integration-admin-token: <from .env>"
```

**Sync all connected providers (health + calendar):**

```bash
curl -X POST https://mangeshraut.pro/api/integrations/sync-all \
  -H "x-integration-admin-token: <from .env>"
```

**Manual seed (until OAuth is connected):**

```bash
curl -X POST https://mangeshraut.pro/api/health-vitals/sync \
  -H "Content-Type: application/json" \
  -H "x-integration-admin-token: <from .env>" \
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
  -H "x-integration-admin-token: <from .env>"
```

Replace `whoop` with `withings` or `google_calendar`.

---

## What I need from you

| Task                                                                          | Why                                           |
| ----------------------------------------------------------------------------- | --------------------------------------------- |
| Complete Google Calendar connect in Chrome                                    | Unblocks live availability on contact/monitor |
| Create WHOOP + Withings OAuth apps and send **client IDs only** (not secrets) | I can verify redirect URIs and env key names  |
| Run admin sync curl locally after connect                                     | Pulls first real row into Supabase            |
| Tell me if OAuth redirect fails (exact URL + error text)                      | Fastest way to fix redirect URI mismatches    |

---

## Local testing (optional)

```bash
npm run dev:api
```

Then use `http://localhost:3000/api/integrations/status` and the same connect paths on localhost if redirect URIs include `http://localhost:...`.

OAuth state signing uses `INTEGRATION_SYNC_ADMIN_TOKEN`; keep it stable across local and production while testing.
