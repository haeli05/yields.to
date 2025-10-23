-- Supabase schema for hourly Plasma aggregate snapshots
create table if not exists public.plasma_aggregate (
  id bigserial primary key,
  ts timestamptz not null,
  chain_latest_tvl_usd numeric not null default 0,
  chain_prev_tvl_usd numeric not null default 0,
  chain_last_date bigint,
  protocol_latest_tvl_usd numeric not null default 0,
  protocol_last_date bigint,
  top_pools jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (ts)
);

-- Helpful index for time-ordered queries
create index if not exists idx_plasma_aggregate_ts_desc on public.plasma_aggregate (ts desc);

-- RLS is off by default in Supabase; if you enable it, add read policy here.
-- Example read-only policy for anonymous role:
-- alter table public.plasma_aggregate enable row level security;
-- create policy "anon read" on public.plasma_aggregate for select to anon using (true);

-- Hourly pool yield snapshots (normalized rows)
create table if not exists public.plasma_pool_yield_snapshots (
  id bigserial primary key,
  ts timestamptz not null,
  chain text not null default 'Plasma',
  pool text not null,
  project text,
  symbol text,
  tvl_usd numeric,
  apy numeric,
  apy_base numeric,
  apy_pct30d numeric,
  source text not null default 'defillama',
  updated_at timestamptz not null default now(),
  unique (ts, pool, source)
);

create index if not exists idx_plasma_pool_yield_snapshots_ts on public.plasma_pool_yield_snapshots (ts desc);
create index if not exists idx_plasma_pool_yield_snapshots_pool on public.plasma_pool_yield_snapshots (pool);

-- Source health checks
create table if not exists public.source_health (
  id bigserial primary key,
  source text not null,
  url text not null,
  status int,
  ok boolean not null default false,
  note text,
  checked_at timestamptz not null default now()
);

create index if not exists idx_source_health_checked_at on public.source_health (checked_at desc);
