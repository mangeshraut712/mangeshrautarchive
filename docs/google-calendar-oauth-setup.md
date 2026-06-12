# Google Calendar OAuth — My First Project

Use GCP project **My First Project** (`proud-shoreline-484417-r4`). The URL slug `mangeshrautarchive` is not accessible on this Google account.

## 1. Enable API

[Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=proud-shoreline-484417-r4) → **Enable**

## 2. OAuth consent screen

[OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent?project=proud-shoreline-484417-r4)

- User type: **External**
- App name: `Mangesh Raut Archive`
- Support email: your Gmail
- Scopes: add `.../auth/calendar.readonly` and `.../auth/calendar.freebusy`
- Test users: add `mbr63drexel@gmail.com`

## 3. OAuth client ID

[Credentials](https://console.cloud.google.com/apis/credentials?project=proud-shoreline-484417-r4) → **Create credentials** → **OAuth client ID**

- Application type: **Web application**
- Name: `mangeshrautarchive-calendar`
- Authorized redirect URIs:
  - `http://127.0.0.1:8001/api/calendar/callback/google`
  - `https://mangeshraut.pro/api/calendar/callback/google`

Copy Client ID and Client Secret into `.env.local` (never commit):

```env
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
```

Then run:

```bash
VERCEL_ENV_TARGETS=production node scripts/integrations/sync-vercel-integration-env.mjs
```

Verify:

```bash
curl -s https://mangeshraut.pro/api/integrations/status | jq '.providers.googleCalendar'
```
