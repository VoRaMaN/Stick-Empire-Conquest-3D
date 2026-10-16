-- Stick Empire 3D online multiplayer: seat management, housekeeping, the RPC API, and Realtime authorization.

-- someone leaves a room that has not started: the seat is vacated, the host role passes on (or the room closes)
create or replace function se3d_private.vacate_seat(p_match uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare m public.se3d_matches%rowtype; nxt uuid;
begin
  select * into m from public.se3d_matches where id = p_match for update;
  if not found then return; end if;
  update public.se3d_match_players set left_at = now(), is_ready = false where match_id = p_match and user_id = p_user and left_at is null;
  if m.status = 'starting' then
    update public.se3d_matches set status = 'cancelled', ended_at = now() where id = p_match;
    return;
  end if;
  if m.status not in ('waiting','ready') then return; end if;
  if m.host_user_id = p_user then
    select user_id into nxt from public.se3d_match_players where match_id = p_match and left_at is null order by joined_at, player_slot limit 1;
    if nxt is null then
      update public.se3d_matches set status = 'cancelled', ended_at = now() where id = p_match;
      return;
    end if;
    update public.se3d_matches set host_user_id = nxt where id = p_match;
  end if;
  update public.se3d_match_players set is_ready = false where match_id = p_match and left_at is null;   -- the line-up changed: everyone confirms again
  perform se3d_private.refresh_status(p_match);
end $$;

-- server-side housekeeping (pg_cron, and lazily before matchmaking): presence is not left to the clients alone
create or replace function se3d_private.cleanup()
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select p.match_id, p.user_id from public.se3d_match_players p join public.se3d_matches m on m.id = p.match_id
           where m.status in ('waiting','ready') and p.left_at is null and p.last_seen_at < now() - interval '45 seconds' loop
    perform se3d_private.vacate_seat(r.match_id, r.user_id);
  end loop;
  update public.se3d_matches set status = 'cancelled', ended_at = now()
   where (status in ('waiting','ready') and expires_at < now())
      or (status = 'starting' and started_at < now() - interval '2 minutes');
  for r in select m.id from public.se3d_matches m join public.se3d_match_players p on p.match_id = m.id and p.user_id = m.host_user_id
           where m.status = 'playing' and p.last_seen_at < now() - interval '90 seconds' loop
    update public.se3d_matches set status = 'cancelled', ended_at = now() where id = r.id;
    insert into public.se3d_match_results (match_id, winner_team, result) values (r.id, null, 'host_disconnected')
      on conflict (match_id) do nothing;
  end loop;
  update public.se3d_matches set status = 'cancelled', ended_at = now() where status = 'playing' and started_at < now() - interval '3 hours';
end $$;

create or replace function se3d_private.leave_other_lobbies(p_user uuid, p_keep uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  if exists (select 1 from public.se3d_match_players p join public.se3d_matches m on m.id = p.match_id
             where p.user_id = p_user and p.left_at is null and m.status in ('starting','playing') and m.id is distinct from p_keep) then
    raise exception 'se3d:already_in_match' using errcode = 'P0001';
  end if;
  for r in select p.match_id from public.se3d_match_players p join public.se3d_matches m on m.id = p.match_id
           where p.user_id = p_user and p.left_at is null and m.status in ('waiting','ready') and m.id is distinct from p_keep loop
    perform se3d_private.vacate_seat(r.match_id, p_user);
  end loop;
end $$;

create or replace function se3d_private.make_room(p_user uuid, p_mode text, p_name text, p_private boolean, p_config jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_code text; tries int := 0;
begin
  if p_mode not in ('1v1','2v2') then raise exception 'se3d:bad_mode' using errcode = '22023'; end if;
  loop
    tries := tries + 1; v_code := se3d_private.new_code();
    begin
      insert into public.se3d_matches (join_code, mode, max_players, is_private, host_user_id, match_config)
      values (v_code, p_mode, case p_mode when '1v1' then 2 else 4 end, p_private, p_user, se3d_private.check_config(p_config))
      returning id into v_id;
      exit;
    exception when unique_violation then
      if tries >= 8 then raise exception 'se3d:code_space_busy'; end if;
    end;
  end loop;
  insert into public.se3d_match_players (match_id, user_id, display_name, team, player_slot)
  values (v_id, p_user, se3d_private.clean_name(p_name), 0, 0);
  return v_id;
end $$;

-- take the lowest free seat (seats alternate teams, so teams fill evenly); the match row lock serializes joiners
create or replace function se3d_private.take_seat(p_match uuid, p_user uuid, p_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare m public.se3d_matches%rowtype; s int;
begin
  select * into m from public.se3d_matches where id = p_match for update;
  if exists (select 1 from public.se3d_match_players where match_id = p_match and user_id = p_user and left_at is null) then return; end if;
  if m.status in ('starting','playing') then raise exception 'se3d:match_started' using errcode = 'P0001'; end if;
  if m.status in ('finished','cancelled') or m.expires_at < now() then raise exception 'se3d:room_expired' using errcode = 'P0001'; end if;
  select min(g) into s from generate_series(0, m.max_players - 1) g
   where not exists (select 1 from public.se3d_match_players p where p.match_id = p_match and p.player_slot = g and p.left_at is null);
  if s is null then raise exception 'se3d:room_full' using errcode = 'P0001'; end if;
  insert into public.se3d_match_players (match_id, user_id, display_name, team, player_slot)
  values (p_match, p_user, se3d_private.clean_name(p_name), s % 2, s);
  update public.se3d_match_players set is_ready = false where match_id = p_match and left_at is null;
  perform se3d_private.refresh_status(p_match);
end $$;

revoke execute on function se3d_private.vacate_seat(uuid, uuid), se3d_private.cleanup(), se3d_private.leave_other_lobbies(uuid, uuid),
  se3d_private.make_room(uuid, text, text, boolean, jsonb), se3d_private.take_seat(uuid, uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------- the RPC API (SECURITY DEFINER, empty search_path, auth.uid() checked inside)
create or replace function public.se3d_create_room(p_mode text, p_name text, p_private boolean default true, p_config jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); v_id uuid;
begin
  perform se3d_private.cleanup();
  perform se3d_private.leave_other_lobbies(v_uid, null);
  v_id := se3d_private.make_room(v_uid, p_mode, p_name, coalesce(p_private, true), p_config);
  return se3d_private.room_json(v_id);
end $$;

create or replace function public.se3d_join_room(p_code text, p_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); v_code text; v_id uuid; v_status text;
begin
  v_code := upper(regexp_replace(coalesce(p_code,''), '[^A-Za-z0-9]', '', 'g'));
  if v_code !~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$' then raise exception 'se3d:invalid_code' using errcode = '22023'; end if;
  perform se3d_private.cleanup();
  select id into v_id from public.se3d_matches where join_code = v_code and status in ('waiting','ready','starting','playing') limit 1;
  if v_id is null then
    select status into v_status from public.se3d_matches where join_code = v_code order by created_at desc limit 1;
    if v_status is null then raise exception 'se3d:room_not_found' using errcode = 'P0001'; end if;
    raise exception 'se3d:room_expired' using errcode = 'P0001';
  end if;
  perform se3d_private.leave_other_lobbies(v_uid, v_id);
  perform se3d_private.take_seat(v_id, v_uid, p_name);
  return se3d_private.room_json(v_id);
end $$;

create or replace function public.se3d_quick_match(p_mode text, p_name text, p_config jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); v_id uuid; v_new boolean := false;
begin
  if p_mode not in ('1v1','2v2') then raise exception 'se3d:bad_mode' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtext('se3d_quick_match_' || p_mode));   -- two players searching at once pair up instead of opening two rooms
  perform se3d_private.cleanup();
  perform se3d_private.leave_other_lobbies(v_uid, null);
  select m.id into v_id from public.se3d_matches m
   where m.status = 'waiting' and m.is_private = false and m.mode = p_mode and m.expires_at > now()
     and (select count(*) from public.se3d_match_players p where p.match_id = m.id and p.left_at is null) < m.max_players
     and not exists (select 1 from public.se3d_match_players p where p.match_id = m.id and p.user_id = v_uid and p.left_at is null)
   order by m.created_at limit 1 for update skip locked;
  if v_id is null then v_id := se3d_private.make_room(v_uid, p_mode, p_name, false, p_config); v_new := true;
  else perform se3d_private.take_seat(v_id, v_uid, p_name); end if;
  return se3d_private.room_json(v_id) || jsonb_build_object('created', v_new);
end $$;

create or replace function public.se3d_room_state(p_match uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid();
begin
  if not exists (select 1 from public.se3d_match_players where match_id = p_match and user_id = v_uid) then
    raise exception 'se3d:not_a_member' using errcode = '42501';
  end if;
  return se3d_private.room_json(p_match);
end $$;

create or replace function public.se3d_set_ready(p_match uuid, p_ready boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid();
begin
  perform se3d_private.my_seat(p_match, v_uid, array['waiting','ready']);
  if p_ready and exists (select 1 from public.se3d_match_players where match_id = p_match and user_id = v_uid and left_at is null and public_key is null) then
    raise exception 'se3d:key_missing' using errcode = 'P0001';
  end if;
  update public.se3d_match_players set is_ready = coalesce(p_ready, false), last_seen_at = now() where match_id = p_match and user_id = v_uid and left_at is null;
  perform se3d_private.refresh_status(p_match);
  return se3d_private.room_json(p_match);
end $$;

create or replace function public.se3d_set_name(p_match uuid, p_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid();
begin
  perform se3d_private.my_seat(p_match, v_uid, array['waiting','ready']);
  update public.se3d_match_players set display_name = se3d_private.clean_name(p_name) where match_id = p_match and user_id = v_uid and left_at is null;
  return se3d_private.room_json(p_match);
end $$;

-- move to the other team, only into a free seat (everyone confirms again)
create or replace function public.se3d_switch_team(p_match uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches; cur int; s int;
begin
  m := se3d_private.my_seat(p_match, v_uid, array['waiting','ready']);
  select player_slot into cur from public.se3d_match_players where match_id = p_match and user_id = v_uid and left_at is null;
  select min(g) into s from generate_series(0, m.max_players - 1) g
   where g % 2 <> cur % 2 and not exists (select 1 from public.se3d_match_players p where p.match_id = p_match and p.player_slot = g and p.left_at is null);
  if s is null then raise exception 'se3d:team_full' using errcode = 'P0001'; end if;
  update public.se3d_match_players set player_slot = s, team = s % 2 where match_id = p_match and user_id = v_uid and left_at is null;
  update public.se3d_match_players set is_ready = false where match_id = p_match and left_at is null;
  perform se3d_private.refresh_status(p_match);
  return se3d_private.room_json(p_match);
end $$;

-- a player picks the faction their own team fields (everyone confirms again)
create or replace function public.se3d_set_faction(p_match uuid, p_faction text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches; t int; f jsonb;
begin
  if p_faction not in ('order','chaos') then raise exception 'se3d:bad_config' using errcode = '22023'; end if;
  m := se3d_private.my_seat(p_match, v_uid, array['waiting','ready']);
  select team into t from public.se3d_match_players where match_id = p_match and user_id = v_uid and left_at is null;
  f := coalesce(m.match_config -> 'factions', '["order","chaos"]'::jsonb);
  f := jsonb_set(f, array[t::text], to_jsonb(p_faction));
  update public.se3d_matches set match_config = se3d_private.check_config(m.match_config || jsonb_build_object('factions', f)) where id = p_match;
  update public.se3d_match_players set is_ready = false where match_id = p_match and left_at is null;
  perform se3d_private.refresh_status(p_match);
  return se3d_private.room_json(p_match);
end $$;

-- register the public half of this player's message-signing key (the private half never leaves the browser).
-- Also during a battle: a guest who reloads rejoins with a fresh key. The host's key is fixed once the match starts.
create or replace function public.se3d_set_key(p_match uuid, p_jwk jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches;
begin
  m := se3d_private.my_seat(p_match, v_uid, array['waiting','ready','starting','playing']);
  if m.status in ('starting','playing') and m.host_user_id = v_uid then raise exception 'se3d:host_key_fixed' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_jwk) <> 'object' or p_jwk ->> 'kty' <> 'EC' or p_jwk ->> 'crv' <> 'P-256' or p_jwk ? 'd'
     or coalesce(length(p_jwk ->> 'x'), 0) not between 40 and 48 or coalesce(length(p_jwk ->> 'y'), 0) not between 40 and 48 then
    raise exception 'se3d:bad_key' using errcode = '22023';
  end if;
  update public.se3d_match_players set public_key = jsonb_build_object('kty','EC','crv','P-256','x',p_jwk->>'x','y',p_jwk->>'y'),
         is_ready = case when m.status in ('waiting','ready') then false else is_ready end
   where match_id = p_match and user_id = v_uid and left_at is null;
  perform se3d_private.refresh_status(p_match);
  return se3d_private.room_json(p_match);
end $$;

create or replace function public.se3d_heartbeat(p_match uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches%rowtype;
begin
  update public.se3d_match_players set last_seen_at = now() where match_id = p_match and user_id = v_uid and left_at is null;
  if not found then raise exception 'se3d:not_a_member' using errcode = '42501'; end if;
  select * into m from public.se3d_matches where id = p_match;
  if m.status in ('waiting','ready') and m.host_user_id = v_uid then
    update public.se3d_matches set expires_at = greatest(expires_at, now() + interval '20 minutes') where id = p_match and expires_at < now() + interval '10 minutes';
  end if;
  return jsonb_build_object('status', m.status, 'host', m.host_user_id, 'server_now', now());
end $$;

-- the host starts once every seat is filled and ready; a second press changes nothing
create or replace function public.se3d_start_match(p_match uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches;
begin
  m := se3d_private.my_seat(p_match, v_uid, array['waiting','ready','starting']);
  if m.host_user_id <> v_uid then raise exception 'se3d:not_host' using errcode = '42501'; end if;
  if m.status = 'starting' then return se3d_private.room_json(p_match); end if;
  if m.status <> 'ready' then raise exception 'se3d:not_ready' using errcode = 'P0001'; end if;
  if (select count(*) from public.se3d_match_players where match_id = p_match and left_at is null and public_key is not null and is_ready) <> m.max_players then
    raise exception 'se3d:not_ready' using errcode = 'P0001';
  end if;
  update public.se3d_matches set status = 'starting', started_at = now(), match_seed = (floor(random()*2147483647))::bigint where id = p_match;
  return se3d_private.room_json(p_match);
end $$;

create or replace function public.se3d_mark_playing(p_match uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches;
begin
  m := se3d_private.my_seat(p_match, v_uid, array['starting','playing']);
  if m.host_user_id <> v_uid then raise exception 'se3d:not_host' using errcode = '42501'; end if;
  if m.status = 'starting' then update public.se3d_matches set status = 'playing' where id = p_match; end if;
  return se3d_private.room_json(p_match);
end $$;

-- only the simulation host records how a battle ended
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
  return se3d_private.room_json(p_match);
end $$;

-- a guest ends a battle whose host has gone quiet (the server checks the host's last heartbeat itself)
create or replace function public.se3d_abandon_match(p_match uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches; seen timestamptz;
begin
  m := se3d_private.my_seat(p_match, v_uid, array['starting','playing']);
  select max(last_seen_at) into seen from public.se3d_match_players where match_id = p_match and user_id = m.host_user_id;
  if m.host_user_id <> v_uid and seen is not null and seen > now() - interval '30 seconds' then
    raise exception 'se3d:host_alive' using errcode = 'P0001';
  end if;
  update public.se3d_matches set status = 'cancelled', ended_at = now() where id = p_match;
  insert into public.se3d_match_results (match_id, winner_team, result, reported_by)
  values (p_match, null, case when m.host_user_id = v_uid then 'abandoned' else 'host_disconnected' end, v_uid)
  on conflict (match_id) do nothing;
  return se3d_private.room_json(p_match);
end $$;

create or replace function public.se3d_leave_room(p_match uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches%rowtype;
begin
  select * into m from public.se3d_matches where id = p_match for update;
  if not found or not exists (select 1 from public.se3d_match_players where match_id = p_match and user_id = v_uid and left_at is null) then
    return jsonb_build_object('left', true);
  end if;
  if m.status in ('waiting','ready','starting') then
    perform se3d_private.vacate_seat(p_match, v_uid);
  else
    update public.se3d_match_players set left_at = now() where match_id = p_match and user_id = v_uid and left_at is null;
    if m.status = 'playing' and m.host_user_id = v_uid then   -- the simulation leaves with its host: the battle ends with no winner
      update public.se3d_matches set status = 'cancelled', ended_at = now() where id = p_match;
      insert into public.se3d_match_results (match_id, winner_team, result, reported_by) values (p_match, null, 'abandoned', v_uid)
        on conflict (match_id) do nothing;
    end if;
  end if;
  return jsonb_build_object('left', true);
end $$;

-- the caller's room that is still open or under way (to rejoin after a reload)
create or replace function public.se3d_my_active_match()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); v_id uuid;
begin
  select m.id into v_id from public.se3d_matches m join public.se3d_match_players p on p.match_id = m.id
   where p.user_id = v_uid and p.left_at is null and m.status in ('waiting','ready','starting','playing')
   order by m.created_at desc limit 1;
  if v_id is null then return null; end if;
  return se3d_private.room_json(v_id);
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'se3d_create_room(text, text, boolean, jsonb)', 'se3d_join_room(text, text)', 'se3d_quick_match(text, text, jsonb)',
    'se3d_room_state(uuid)', 'se3d_set_ready(uuid, boolean)', 'se3d_set_name(uuid, text)', 'se3d_switch_team(uuid)',
    'se3d_set_faction(uuid, text)', 'se3d_set_key(uuid, jsonb)', 'se3d_heartbeat(uuid)', 'se3d_start_match(uuid)',
    'se3d_mark_playing(uuid)', 'se3d_report_result(uuid, smallint, text, integer, jsonb)', 'se3d_abandon_match(uuid)',
    'se3d_leave_room(uuid)', 'se3d_my_active_match()'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ---------------------------------------------------------------- row level security: members read their own rooms; nobody writes directly
create policy "se3d members read their matches" on public.se3d_matches for select to authenticated
  using ((select se3d_private.is_member(id)));
create policy "se3d members read their match's players" on public.se3d_match_players for select to authenticated
  using ((select se3d_private.is_member(match_id)));
create policy "se3d members read their results" on public.se3d_match_results for select to authenticated
  using ((select se3d_private.is_member(match_id)));

-- Realtime Authorization: only current members may join (receive or send on) the private topic se3d:match:<uuid>
create policy "se3d members receive match messages" on realtime.messages for select to authenticated
  using (realtime.messages.extension in ('broadcast','presence') and (select se3d_private.can_use_topic((select realtime.topic()))));
create policy "se3d members send match messages" on realtime.messages for insert to authenticated
  with check (realtime.messages.extension in ('broadcast','presence') and (select se3d_private.can_use_topic((select realtime.topic()))));
