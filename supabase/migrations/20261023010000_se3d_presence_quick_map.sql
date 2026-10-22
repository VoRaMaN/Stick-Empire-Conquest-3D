-- Stick Empire 3D online: who is online right now, and quick match by map.
-- Each player on the online screens pings se3d_presence every ~20 s; it answers with how many players were seen in
-- the last 45 s, what they are doing (browsing, in a lobby, in a battle), up to 30 of their names, and how many
-- open quick-match rooms are waiting on each map. Names are the display names players chose; nothing else is shared.
create table if not exists se3d_private.presence (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 20),
  status     text not null check (status in ('online','lobby','battle')),
  map        text not null default 'classic' check (map in ('classic','river')),
  seen_at    timestamptz not null default now()
);
create index if not exists se3d_presence_seen on se3d_private.presence (seen_at);
revoke all on se3d_private.presence from public, anon, authenticated;

create or replace function public.se3d_presence(p_name text, p_status text default 'online', p_map text default 'classic')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); v_name text := se3d_private.clean_name(p_name);
begin
  if p_status not in ('online','lobby','battle') then p_status := 'online'; end if;
  if p_map not in ('classic','river') then p_map := 'classic'; end if;
  insert into se3d_private.presence (user_id, name, status, map, seen_at) values (v_uid, v_name, p_status, p_map, now())
    on conflict (user_id) do update set name = excluded.name, status = excluded.status, map = excluded.map, seen_at = now();
  delete from se3d_private.presence where seen_at < now() - interval '10 minutes';
  return jsonb_build_object(
    'online', (select count(*) from se3d_private.presence where seen_at > now() - interval '45 seconds'),
    'lobby',  (select count(*) from se3d_private.presence where seen_at > now() - interval '45 seconds' and status = 'lobby'),
    'battle', (select count(*) from se3d_private.presence where seen_at > now() - interval '45 seconds' and status = 'battle'),
    'players', coalesce((select jsonb_agg(jsonb_build_object('name', q.name, 'status', q.status, 'map', q.map, 'me', q.user_id = v_uid) order by q.me desc, q.seen_at desc)
                 from (select p.*, p.user_id = v_uid as me from se3d_private.presence p where p.seen_at > now() - interval '45 seconds' order by (p.user_id = v_uid) desc, p.seen_at desc limit 30) q), '[]'::jsonb),
    'rooms', (select jsonb_build_object(
                'classic', count(*) filter (where coalesce(m.match_config->>'map','classic') = 'classic'),
                'river',   count(*) filter (where m.match_config->>'map' = 'river'))
              from public.se3d_matches m where m.status = 'waiting' and m.is_private = false and m.expires_at > now()));
end $$;
revoke all on function public.se3d_presence(text, text, text) from public, anon;
grant execute on function public.se3d_presence(text, text, text) to authenticated;

-- leaving the online screens: drop out of the count at once
create or replace function public.se3d_presence_leave()
returns void language plpgsql security definer set search_path = '' as $$
begin delete from se3d_private.presence where user_id = se3d_private.require_uid(); end $$;
revoke all on function public.se3d_presence_leave() from public, anon;
grant execute on function public.se3d_presence_leave() to authenticated;

-- quick match only pairs players who asked for the same map
create or replace function public.se3d_quick_match(p_mode text, p_name text, p_config jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); v_id uuid; v_new boolean := false; v_map text := coalesce(p_config->>'map','classic');
begin
  if p_mode not in ('1v1','2v2') then raise exception 'se3d:bad_mode' using errcode = '22023'; end if;
  if v_map not in ('classic','river') then v_map := 'classic'; end if;
  perform pg_advisory_xact_lock(hashtext('se3d_quick_match_' || p_mode));   -- two players searching at once pair up instead of opening two rooms
  perform se3d_private.cleanup();
  perform se3d_private.leave_other_lobbies(v_uid, null);
  select m.id into v_id from public.se3d_matches m
   where m.status = 'waiting' and m.is_private = false and m.mode = p_mode and m.expires_at > now()
     and coalesce(m.match_config->>'map','classic') = v_map
     and (select count(*) from public.se3d_match_players p where p.match_id = m.id and p.left_at is null) < m.max_players
     and not exists (select 1 from public.se3d_match_players p where p.match_id = m.id and p.user_id = v_uid and p.left_at is null)
   order by m.created_at limit 1 for update skip locked;
  if v_id is null then v_id := se3d_private.make_room(v_uid, p_mode, p_name, false, p_config); v_new := true;
  else perform se3d_private.take_seat(v_id, v_uid, p_name); end if;
  return se3d_private.room_json(v_id) || jsonb_build_object('created', v_new);
end $$;
revoke all on function public.se3d_quick_match(text, text, jsonb) from public, anon;
grant execute on function public.se3d_quick_match(text, text, jsonb) to authenticated;
