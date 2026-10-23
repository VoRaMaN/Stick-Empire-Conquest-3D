-- Stick Empire 3D online, release 4: who is online, quick match by map, the Wildlands online, ranked play with a
-- seasonal leaderboard, and watching live matches.
-- This file supersedes 20261023010000_se3d_presence_quick_map.sql (never applied): its presence table and functions
-- are repeated here unchanged in spirit, so applying either order is safe (everything is create-or-replace / if-not-exists).
--
-- Ranked: a 1v1 or 2v2 room opened by "Ranked quick match" carries config.ranked = true. When its host reports a
-- decisive result (statue destroyed or surrender), every seated player's rating for the current season moves by an
-- Elo step (K = 32, team strength = the average of its players). Abandoned matches change nothing. Seasons are
-- quarters; Season 1 is October–December 2026. Ratings live in se3d_private and are read only through RPCs.
-- Limitation: as with all results, the simulation host reports the outcome; the server cannot replay the battle.
--
-- Spectating: anyone signed in can watch a public match that is being played (or any match by its join code). A
-- spectator row lets them RECEIVE the match's private Realtime channel; they cannot send on it (the insert policy is
-- still members-only), so they can't issue commands or forge snapshots.

-- ---------------------------------------------------------------- presence (from 20261023010000, unchanged)
create table if not exists se3d_private.presence (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 20),
  status     text not null check (status in ('online','lobby','battle')),
  map        text not null default 'classic' check (map in ('classic','river','frontier')),
  seen_at    timestamptz not null default now()
);
create index if not exists se3d_presence_seen on se3d_private.presence (seen_at);
revoke all on se3d_private.presence from public, anon, authenticated;

create or replace function public.se3d_presence(p_name text, p_status text default 'online', p_map text default 'classic')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); v_name text := se3d_private.clean_name(p_name);
begin
  if p_status not in ('online','lobby','battle') then p_status := 'online'; end if;
  if p_map not in ('classic','river','frontier') then p_map := 'classic'; end if;
  insert into se3d_private.presence (user_id, name, status, map, seen_at) values (v_uid, v_name, p_status, p_map, now())
    on conflict (user_id) do update set name = excluded.name, status = excluded.status, map = excluded.map, seen_at = now();
  delete from se3d_private.presence where seen_at < now() - interval '10 minutes';
  return jsonb_build_object(
    'online', (select count(*) from se3d_private.presence where seen_at > now() - interval '45 seconds'),
    'lobby',  (select count(*) from se3d_private.presence where seen_at > now() - interval '45 seconds' and status = 'lobby'),
    'battle', (select count(*) from se3d_private.presence where seen_at > now() - interval '45 seconds' and status = 'battle'),
    'players', coalesce((select jsonb_agg(jsonb_build_object('name', q.name, 'status', q.status, 'map', q.map, 'me', q.me) order by q.me desc, q.seen_at desc)
                 from (select p.*, p.user_id = v_uid as me from se3d_private.presence p where p.seen_at > now() - interval '45 seconds'
                       order by (p.user_id = v_uid) desc, p.seen_at desc limit 30) q), '[]'::jsonb),
    'rooms', (select jsonb_build_object(
                'classic', count(*) filter (where coalesce(m.match_config->>'map','classic') = 'classic'),
                'river',   count(*) filter (where m.match_config->>'map' = 'river'),
                'frontier', count(*) filter (where m.match_config->>'map' = 'frontier'))
              from public.se3d_matches m where m.status = 'waiting' and m.is_private = false and m.expires_at > now()),
    'live', (select count(*) from public.se3d_matches m where m.status = 'playing' and m.is_private = false));
end $$;
revoke all on function public.se3d_presence(text, text, text) from public, anon;
grant execute on function public.se3d_presence(text, text, text) to authenticated;

create or replace function public.se3d_presence_leave()
returns void language plpgsql security definer set search_path = '' as $$
begin delete from se3d_private.presence where user_id = se3d_private.require_uid(); end $$;
revoke all on function public.se3d_presence_leave() from public, anon;
grant execute on function public.se3d_presence_leave() to authenticated;

-- ---------------------------------------------------------------- room config: three factions, ranked flag
create or replace function se3d_private.check_config(p jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare f0 text := coalesce(p #>> '{factions,0}', 'order'); f1 text := coalesce(p #>> '{factions,1}', 'chaos'); sz int := coalesce((p ->> 'size')::int, 0);
  mp text := coalesce(p ->> 'map', 'classic'); fin int := coalesce((p ->> 'finishers')::int, 1);
  rk boolean := coalesce((p ->> 'ranked')::boolean, false);
begin
  if f0 not in ('order','chaos','wild') or f1 not in ('order','chaos','wild') then raise exception 'se3d:bad_config' using errcode = '22023'; end if;
  if sz not in (0,1) then sz := 0; end if;
  if mp not in ('classic','river','frontier') then mp := 'classic'; end if;
  if fin not in (0,1,2) then fin := 1; end if;
  return jsonb_build_object('factions', jsonb_build_array(f0, f1), 'size', sz, 'map', mp, 'finishers', fin, 'ranked', rk);
end $$;
revoke execute on function se3d_private.check_config(jsonb) from public, anon, authenticated;

create or replace function public.se3d_set_faction(p_match uuid, p_faction text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches; t int; f jsonb;
begin
  if p_faction not in ('order','chaos','wild') then raise exception 'se3d:bad_config' using errcode = '22023'; end if;
  m := se3d_private.my_seat(p_match, v_uid, array['waiting','ready']);
  select team into t from public.se3d_match_players where match_id = p_match and user_id = v_uid and left_at is null;
  f := coalesce(m.match_config -> 'factions', '["order","chaos"]'::jsonb);
  f := jsonb_set(f, array[t::text], to_jsonb(p_faction));
  update public.se3d_matches set match_config = se3d_private.check_config(m.match_config || jsonb_build_object('factions', f)) where id = p_match;
  update public.se3d_match_players set is_ready = false where match_id = p_match and left_at is null;
  perform se3d_private.refresh_status(p_match);
  return se3d_private.room_json(p_match);
end $$;
revoke all on function public.se3d_set_faction(uuid, text) from public, anon;
grant execute on function public.se3d_set_faction(uuid, text) to authenticated;

-- quick match pairs players who asked for the same map and the same kind of game (ranked or casual)
create or replace function public.se3d_quick_match(p_mode text, p_name text, p_config jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); v_id uuid; v_new boolean := false; v_map text := coalesce(p_config->>'map','classic');
  v_rk boolean := coalesce((p_config->>'ranked')::boolean, false);
begin
  if p_mode not in ('1v1','2v2') then raise exception 'se3d:bad_mode' using errcode = '22023'; end if;
  if v_map not in ('classic','river','frontier') then v_map := 'classic'; end if;
  perform pg_advisory_xact_lock(hashtext('se3d_quick_match_' || p_mode));
  perform se3d_private.cleanup();
  perform se3d_private.leave_other_lobbies(v_uid, null);
  select m.id into v_id from public.se3d_matches m
   where m.status = 'waiting' and m.is_private = false and m.mode = p_mode and m.expires_at > now()
     and coalesce(m.match_config->>'map','classic') = v_map
     and coalesce((m.match_config->>'ranked')::boolean, false) = v_rk
     and (select count(*) from public.se3d_match_players p where p.match_id = m.id and p.left_at is null) < m.max_players
     and not exists (select 1 from public.se3d_match_players p where p.match_id = m.id and p.user_id = v_uid and p.left_at is null)
   order by m.created_at limit 1 for update skip locked;
  if v_id is null then v_id := se3d_private.make_room(v_uid, p_mode, p_name, false, p_config || jsonb_build_object('map', v_map, 'ranked', v_rk)); v_new := true;
  else perform se3d_private.take_seat(v_id, v_uid, p_name); end if;
  return se3d_private.room_json(v_id) || jsonb_build_object('created', v_new);
end $$;
revoke all on function public.se3d_quick_match(text, text, jsonb) from public, anon;
grant execute on function public.se3d_quick_match(text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------- ranked: seasons and ratings
create or replace function se3d_private.season()
returns int language sql stable set search_path = '' as $$
  select (extract(year from now())::int * 4 + ((extract(month from now())::int - 1) / 3)) - (2026 * 4 + 3) + 1;
$$;
revoke execute on function se3d_private.season() from public, anon, authenticated;

create table if not exists se3d_private.ratings (
  user_id    uuid not null references auth.users(id) on delete cascade,
  season     int  not null,
  name       text not null check (char_length(name) between 1 and 20),
  rating     int  not null default 1000,
  peak       int  not null default 1000,
  wins       int  not null default 0,
  losses     int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, season)
);
create index if not exists se3d_ratings_board on se3d_private.ratings (season, rating desc);
revoke all on se3d_private.ratings from public, anon, authenticated;

-- move every seated player's rating after a decisive ranked result
create or replace function se3d_private.rate_match(p_match uuid, p_winner smallint)
returns void language plpgsql security definer set search_path = '' as $$
declare v_season int := se3d_private.season(); r0 numeric; r1 numeric; e0 numeric; d int; p record;
begin
  for p in select user_id, display_name from public.se3d_match_players where match_id = p_match loop
    insert into se3d_private.ratings (user_id, season, name) values (p.user_id, v_season, p.display_name)
      on conflict (user_id, season) do update set name = excluded.name;
  end loop;
  select avg(r.rating) into r0 from public.se3d_match_players pl join se3d_private.ratings r on r.user_id = pl.user_id and r.season = v_season where pl.match_id = p_match and pl.team = 0;
  select avg(r.rating) into r1 from public.se3d_match_players pl join se3d_private.ratings r on r.user_id = pl.user_id and r.season = v_season where pl.match_id = p_match and pl.team = 1;
  if r0 is null or r1 is null then return; end if;
  e0 := 1 / (1 + power(10::numeric, (r1 - r0) / 400));
  d := round(32 * ((case when p_winner = 0 then 1 else 0 end) - e0));
  update se3d_private.ratings r set
      rating = greatest(100, r.rating + case when pl.team = 0 then d else -d end),
      peak = greatest(r.peak, r.rating + case when pl.team = 0 then d else -d end),
      wins = r.wins + case when pl.team = p_winner then 1 else 0 end,
      losses = r.losses + case when pl.team = p_winner then 0 else 1 end,
      updated_at = now()
    from public.se3d_match_players pl
   where pl.match_id = p_match and r.user_id = pl.user_id and r.season = v_season;
end $$;
revoke execute on function se3d_private.rate_match(uuid, smallint) from public, anon, authenticated;

-- only the simulation host records how a battle ended; a ranked result also moves the ratings
create or replace function public.se3d_report_result(p_match uuid, p_winner smallint, p_result text, p_duration integer default null, p_summary jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches;
begin
  m := se3d_private.my_seat(p_match, v_uid, array['playing']);
  if m.host_user_id <> v_uid then raise exception 'se3d:not_host' using errcode = '42501'; end if;
  if p_result not in ('statue_destroyed','surrender','abandoned') then raise exception 'se3d:bad_result' using errcode = '22023'; end if;
  if (p_result in ('statue_destroyed','surrender')) <> (p_winner is not null) or (p_winner is not null and p_winner not in (0,1)) then
    raise exception 'se3d:bad_result' using errcode = '22023';
  end if;
  insert into public.se3d_match_results (match_id, winner_team, result, reported_by, duration_s, summary)
  values (p_match, p_winner, p_result, v_uid, greatest(0, p_duration),
          case when jsonb_typeof(p_summary) = 'object' and length(p_summary::text) < 4000 then p_summary else '{}'::jsonb end);
  update public.se3d_matches set status = 'finished', ended_at = now() where id = p_match;
  if coalesce((m.match_config->>'ranked')::boolean, false) and p_winner is not null then perform se3d_private.rate_match(p_match, p_winner); end if;
  return se3d_private.room_json(p_match);
end $$;
revoke all on function public.se3d_report_result(uuid, smallint, text, integer, jsonb) from public, anon;
grant execute on function public.se3d_report_result(uuid, smallint, text, integer, jsonb) to authenticated;

-- the season's top players and your own place
create or replace function public.se3d_leaderboard(p_season int default null, p_limit int default 50)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); s int := coalesce(p_season, se3d_private.season()); n int := least(greatest(coalesce(p_limit, 50), 1), 100);
begin
  return jsonb_build_object('season', s, 'current', se3d_private.season(),
    'top', coalesce((select jsonb_agg(x order by x.rank) from (
              select rank() over (order by r.rating desc, r.wins desc) as rank, r.name, r.rating, r.peak, r.wins, r.losses, r.user_id = v_uid as me
                from se3d_private.ratings r where r.season = s order by r.rating desc, r.wins desc limit n) x), '[]'::jsonb),
    'me', (select to_jsonb(y) from (
              select q.rank, q.name, q.rating, q.peak, q.wins, q.losses from (
                select r.user_id, rank() over (order by r.rating desc, r.wins desc) as rank, r.name, r.rating, r.peak, r.wins, r.losses
                  from se3d_private.ratings r where r.season = s) q where q.user_id = v_uid) y),
    'players', (select count(*) from se3d_private.ratings r where r.season = s));
end $$;
revoke all on function public.se3d_leaderboard(int, int) from public, anon;
grant execute on function public.se3d_leaderboard(int, int) to authenticated;

-- ---------------------------------------------------------------- spectating
create table if not exists se3d_private.spectators (
  match_id   uuid not null references public.se3d_matches(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (match_id, user_id)
);
create index if not exists se3d_spectators_user on se3d_private.spectators (user_id);
revoke all on se3d_private.spectators from public, anon, authenticated;

-- a member may receive and send on the match topic; a spectator may only receive
create or replace function se3d_private.can_watch_topic(p_topic text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare v_id uuid;
begin
  if se3d_private.can_use_topic(p_topic) then return true; end if;
  if p_topic is null or p_topic !~ '^se3d:match:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  v_id := substr(p_topic, 12)::uuid;
  return exists (select 1 from se3d_private.spectators s join public.se3d_matches m on m.id = s.match_id
                 where s.match_id = v_id and s.user_id = (select auth.uid()) and m.status in ('ready','starting','playing'));
end $$;
grant execute on function se3d_private.can_watch_topic(text) to authenticated;

drop policy if exists "se3d members receive match messages" on realtime.messages;
create policy "se3d members receive match messages" on realtime.messages for select to authenticated
  using (realtime.messages.extension in ('broadcast','presence') and (select se3d_private.can_watch_topic((select realtime.topic()))));

-- public matches being played right now
create or replace function public.se3d_live_matches()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform se3d_private.require_uid();
  return coalesce((select jsonb_agg(x order by x.started_at desc) from (
    select m.id, m.mode, m.match_config->>'map' as map, m.match_config->'factions' as factions, coalesce((m.match_config->>'ranked')::boolean,false) as ranked, m.started_at,
           (select jsonb_agg(jsonb_build_object('name', p.display_name, 'team', p.team) order by p.player_slot) from public.se3d_match_players p where p.match_id = m.id and p.left_at is null) as players,
           (select count(*) from se3d_private.spectators s where s.match_id = m.id) as watching
      from public.se3d_matches m where m.status = 'playing' and m.is_private = false and m.started_at > now() - interval '2 hours'
      order by m.started_at desc limit 20) x), '[]'::jsonb);
end $$;
revoke all on function public.se3d_live_matches() from public, anon;
grant execute on function public.se3d_live_matches() to authenticated;

-- start watching: a public match by id, or any match by its join code
create or replace function public.se3d_spectate(p_match uuid default null, p_code text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches;
begin
  if p_match is not null then select * into m from public.se3d_matches where id = p_match and is_private = false;
  elsif p_code is not null then select * into m from public.se3d_matches where join_code = upper(p_code) and status in ('ready','starting','playing') order by created_at desc limit 1;
  end if;
  if m.id is null then raise exception 'se3d:no_such_room' using errcode = 'P0002'; end if;
  if m.status not in ('ready','starting','playing') then raise exception 'se3d:not_playing' using errcode = 'P0001'; end if;
  insert into se3d_private.spectators (match_id, user_id) values (m.id, v_uid) on conflict do nothing;
  return se3d_private.room_json(m.id) || jsonb_build_object('spectator', true);
end $$;
revoke all on function public.se3d_spectate(uuid, text) from public, anon;
grant execute on function public.se3d_spectate(uuid, text) to authenticated;

create or replace function public.se3d_stop_spectating(p_match uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin delete from se3d_private.spectators where match_id = p_match and user_id = se3d_private.require_uid(); end $$;
revoke all on function public.se3d_stop_spectating(uuid) from public, anon;
grant execute on function public.se3d_stop_spectating(uuid) to authenticated;

-- a spectator may read the room (players, their public keys for checking the host's signed snapshots, status)
create or replace function public.se3d_room_state(p_match uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid();
begin
  if not exists (select 1 from public.se3d_match_players where match_id = p_match and user_id = v_uid)
     and not exists (select 1 from se3d_private.spectators where match_id = p_match and user_id = v_uid) then
    raise exception 'se3d:not_a_member' using errcode = '42501';
  end if;
  return se3d_private.room_json(p_match);
end $$;
revoke all on function public.se3d_room_state(uuid) from public, anon;
grant execute on function public.se3d_room_state(uuid) to authenticated;
