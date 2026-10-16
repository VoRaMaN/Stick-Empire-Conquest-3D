-- Stick Empire 3D online multiplayer, part 1: schema, tables, indexes, RLS on.
-- Everything is prefixed se3d_ so it never collides with other apps sharing the Supabase project. Clients never write
-- these tables directly: every change goes through the se3d_* RPC functions (20261016213011_se3d_multiplayer_rpc.sql).
-- Live battle traffic (commands, snapshots) goes over the private Realtime channel se3d:match:<match uuid> and is never
-- written to Postgres; only room metadata and the final result are stored.
create extension if not exists pgcrypto with schema extensions;

create schema if not exists se3d_private;
grant usage on schema se3d_private to authenticated;

create table if not exists public.se3d_matches (
  id            uuid primary key default gen_random_uuid(),
  join_code     text not null check (join_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'),
  mode          text not null check (mode in ('1v1','2v2')),
  max_players   smallint not null,
  is_private    boolean not null default true,
  host_user_id  uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'waiting'
                check (status in ('waiting','ready','starting','playing','finished','cancelled')),
  match_seed    bigint not null default (floor(random()*2147483647))::bigint,
  match_config  jsonb not null default '{}'::jsonb,
  started_at    timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  expires_at    timestamptz not null default now() + interval '30 minutes',
  constraint se3d_matches_mode_size check ((mode = '1v1' and max_players = 2) or (mode = '2v2' and max_players = 4))
);
create unique index if not exists se3d_matches_active_code_uq on public.se3d_matches (join_code)
  where status in ('waiting','ready','starting','playing');
create index if not exists se3d_matches_code_idx on public.se3d_matches (join_code);
create index if not exists se3d_matches_quick_idx on public.se3d_matches (mode, created_at)
  where status = 'waiting' and is_private = false;
create index if not exists se3d_matches_status_idx on public.se3d_matches (status, updated_at);
create index if not exists se3d_matches_host_idx on public.se3d_matches (host_user_id);

-- first draft of the seat table; 20261016212903_se3d_multiplayer_seats_v2.sql sets it aside (renamed, never used)
create table if not exists public.se3d_match_players (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null references public.se3d_matches(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 20),
  team          smallint not null check (team in (0,1)),
  player_slot   smallint not null check (player_slot between 0 and 3),
  is_ready      boolean not null default false,
  public_key    jsonb,
  joined_at     timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  left_at       timestamptz,
  constraint se3d_players_team_slot check (team = player_slot % 2),
  constraint se3d_players_one_seat unique (match_id, user_id),
  constraint se3d_players_slot_uq unique (match_id, player_slot)
);
create index if not exists se3d_players_user_idx on public.se3d_match_players (user_id);
create index if not exists se3d_players_seen_idx on public.se3d_match_players (last_seen_at);

create table if not exists public.se3d_match_results (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null unique references public.se3d_matches(id) on delete cascade,
  winner_team   smallint check (winner_team in (0,1)),
  result        text not null check (result in ('statue_destroyed','surrender','abandoned','host_disconnected')),
  reported_by   uuid references auth.users(id) on delete set null,
  duration_s    integer check (duration_s is null or duration_s >= 0),
  summary       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  constraint se3d_results_winner check ((result in ('statue_destroyed','surrender')) = (winner_team is not null))
);
create index if not exists se3d_results_reporter_idx on public.se3d_match_results (reported_by);

alter table public.se3d_matches enable row level security;
alter table public.se3d_match_players enable row level security;
alter table public.se3d_match_results enable row level security;
grant select on public.se3d_matches, public.se3d_match_players, public.se3d_match_results to authenticated;
