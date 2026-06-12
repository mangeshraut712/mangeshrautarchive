# Portfolio Integrations Roadmap

This repo should use Supabase as the server-side integration store before adding WHOOP, Withings, and Google Calendar OAuth. Health and calendar data are private by default; public portfolio endpoints must expose only sanitized summaries.

## Current Baseline

- Backend: FastAPI on Vercel, routed through `api/index.py`.
- Existing live APIs: Last.fm, TMDB, Google Books, Open Library, GitHub, Firestore reach/contact/newsletter, OpenRouter.
- Existing local-only widgets: health vitals and calendar/reminders.
- Public frontend must call this backend only. Provider secrets and OAuth tokens must never be stored in browser storage.

## Supabase Role

Use Supabase for integration state, encrypted OAuth token metadata, sync cursors, and sanitized public summaries.

Required server-side environment variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_HEALTH_TABLE=health_vitals_daily
INTEGRATION_SYNC_ADMIN_TOKEN
```

Use the legacy `service_role` JWT or an equivalent server-side key only in Vercel/server environments. Do not expose it in JavaScript, HTML, CSP, or build-time public config.

## Public Health Summary Table

Recommended table: `health_vitals_daily`

Only this sanitized table should power the public health widget.

```sql
create table health_vitals_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  sleep_score integer,
  recovery_score integer,
  strain numeric(4, 1),
  resting_heart_rate integer,
  hrv_trend text,
  weight_trend text,
  source_status text not null default 'synced',
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Do not store raw workouts, raw sleep events, exact body-composition history, OAuth tokens, or private calendar data in this public summary table.

## Private Integration Tables

Recommended private tables:

```sql
create table integration_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_subject text,
  status text not null default 'connected',
  scopes text[] not null default '{}',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table integration_tokens (
  account_id uuid primary key references integration_accounts(id) on delete cascade,
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  expires_at timestamptz,
  rotated_at timestamptz,
  updated_at timestamptz not null default now()
);

create table integration_sync_state (
  provider text primary key,
  cursor text,
  channel_id text,
  resource_id text,
  channel_expires_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);
```

Because this project disables automatic Data API grants for new tables, apply explicit backend-only grants:

```sql
grant usage on schema public to service_role;
grant select, insert, update on public.health_vitals_daily to service_role;
grant all privileges on public.integration_accounts to service_role;
grant all privileges on public.integration_tokens to service_role;
grant all privileges on public.integration_sync_state to service_role;
```

OAuth token encryption should happen in the application before writing to Supabase. Do not rely on table privacy alone.

## Provider Order

1. Google Calendar free/busy availability.
   - Start with free/busy only.
   - Store sync token/cursor after the first full sync.
   - Add push notifications after the basic endpoint is stable.
2. WHOOP health summary.
   - Scopes: `read:recovery`, `read:cycles`, `read:sleep`, `read:body_measurement`, `offline`.
   - Poll on a schedule because WHOOP recovery can be pending or unavailable for a cycle.
3. Withings body metrics.
   - Scopes: metrics and activity data required for the selected device data.
   - Add notification webhook after scheduled sync works.
4. Optional public portfolio enrichments.
   - WakaTime coding stats.
   - Open-Meteo travel weather.
   - Vercel/GitHub deployment status.

## Backend Contracts Added First

```text
GET  /api/integrations/status
GET  /api/health-vitals/summary
POST /api/health-vitals/sync
POST /api/integrations/sync-all
POST /api/integrations/{provider}/disconnect
GET  /api/calendar/availability
GET  /api/integrations/google-calendar/connect
GET  /api/integrations/whoop/connect
GET  /api/integrations/withings/connect
POST /api/calendar/watch/google
POST /api/calendar/webhook/google
```

Protected sync endpoints require `x-integration-admin-token` and pull sanitized summaries from connected WHOOP, Withings, and Google Calendar accounts stored in Supabase.

## Privacy Rules

- Public health payloads contain daily summaries and trend labels only.
- Calendar availability exposes free/busy windows only, not event titles or locations.
- Provider OAuth tokens stay server-side and encrypted.
- Sync/admin endpoints require `x-integration-admin-token`.
- No raw provider response bodies should be logged.
- Disconnect/revoke endpoints must be added before enabling OAuth in production.
