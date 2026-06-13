-- Supabase integration schema for mangeshrautarchive
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- Project: mangeshrautarchive · Region: us-east-1

create extension if not exists pgcrypto;

create table if not exists health_vitals_daily (
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

create table if not exists integration_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  provider_subject text,
  status text not null default 'connected',
  scopes text[] not null default '{}',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists integration_tokens (
  account_id uuid primary key references integration_accounts(id) on delete cascade,
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  expires_at timestamptz,
  rotated_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists integration_sync_state (
  provider text primary key,
  cursor text,
  channel_id text,
  channel_token text,
  resource_id text,
  channel_expires_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

grant usage on schema public to service_role;
grant select, insert, update on public.health_vitals_daily to service_role;
grant all privileges on public.integration_accounts to service_role;
grant all privileges on public.integration_tokens to service_role;
grant all privileges on public.integration_sync_state to service_role;
