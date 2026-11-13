-- Apply once through a reviewed service-role/admin connection. No browser access.
-- A source snapshot, credentials, settings and cursor commit together under a CAS lease.
begin;
create table if not exists public.calendar_sync_sources (
  id text primary key,
  provider text not null check (provider in ('google', 'apple', 'luma')),
  label text not null,
  credentials text,
  settings jsonb not null default '{}'::jsonb,
  snapshot jsonb not null default '{"calendars":[],"events":[],"reminders":[],"passes":[]}'::jsonb,
  version bigint not null default 0,
  lock_token uuid,
  lock_until timestamptz,
  last_success timestamptz,
  last_attempt timestamptz,
  error text
);
alter table public.calendar_sync_sources enable row level security;
revoke all on public.calendar_sync_sources from public, anon, authenticated;
grant select, insert, update, delete on public.calendar_sync_sources to service_role;
comment on table public.calendar_sync_sources is 'Private calendar sync source snapshots; Worker service role only. Credentials are purpose-bound AES-GCM ciphertext.';
commit;
