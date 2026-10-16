-- Stick Empire 3D online multiplayer: seats are never removed, only vacated (left_at), so seat history is kept and
-- no destructive statement is needed. The first draft of the seat table (still empty, never used) is set aside under a new name.
alter table public.se3d_match_players rename to se3d_match_players_draft_unused;
comment on table public.se3d_match_players_draft_unused is 'Unused first draft of the Stick Empire 3D seat table (always empty). Safe to remove.';

create table public.se3d_match_players (
  id            uuid default gen_random_uuid() constraint se3d_seat_pk primary key,
  match_id      uuid not null constraint se3d_seat_match_fk references public.se3d_matches(id) on delete cascade,
  user_id       uuid not null constraint se3d_seat_user_fk references auth.users(id) on delete cascade,
  display_name  text not null constraint se3d_seat_name_len check (char_length(display_name) between 1 and 20),
  team          smallint not null constraint se3d_seat_team check (team in (0,1)),
  player_slot   smallint not null constraint se3d_seat_slot check (player_slot between 0 and 3),
  is_ready      boolean not null default false,
  public_key    jsonb,
  joined_at     timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  left_at       timestamptz,
  constraint se3d_seat_team_slot check (team = player_slot % 2)
);
comment on table public.se3d_match_players is 'Stick Empire 3D: one row per seat taken in a room. A player who leaves keeps the row with left_at set; the seat is then free again.';
-- among the seats still occupied: one per player, one player per slot (two joiners can never share a slot)
create unique index se3d_seat_member_uq on public.se3d_match_players (match_id, user_id) where left_at is null;
create unique index se3d_seat_slot_uq on public.se3d_match_players (match_id, player_slot) where left_at is null;
create index se3d_seat_user_idx on public.se3d_match_players (user_id);
create index se3d_seat_seen_idx on public.se3d_match_players (last_seen_at) where left_at is null;

alter table public.se3d_match_players enable row level security;
revoke all on public.se3d_match_players from anon, authenticated;
grant select on public.se3d_match_players to authenticated;

create trigger se3d_players_ping after insert or update on public.se3d_match_players for each row execute function se3d_private.ping_room();

-- the room as the lobby shows it: occupied seats (and, once a battle began, who left it)
create or replace function se3d_private.room_json(p_match uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', m.id, 'code', m.join_code, 'mode', m.mode, 'max_players', m.max_players, 'is_private', m.is_private,
    'host', m.host_user_id, 'status', m.status, 'seed', m.match_seed, 'config', m.match_config,
    'created_at', m.created_at, 'started_at', m.started_at, 'expires_at', m.expires_at, 'server_now', now(),
    'players', coalesce((select jsonb_agg(jsonb_build_object('user_id', p.user_id, 'name', p.display_name, 'team', p.team, 'slot', p.player_slot,
                     'ready', p.is_ready, 'key', p.public_key, 'last_seen_at', p.last_seen_at, 'left', p.left_at is not null) order by p.player_slot, p.joined_at)
                     from public.se3d_match_players p
                     where p.match_id = m.id and (p.left_at is null or (m.status in ('playing','finished','cancelled') and p.left_at >= m.started_at))), '[]'::jsonb),
    'result', (select to_jsonb(r) - 'id' from public.se3d_match_results r where r.match_id = m.id))
  from public.se3d_matches m where m.id = p_match;
$$;
revoke execute on function se3d_private.room_json(uuid) from public, anon, authenticated;
