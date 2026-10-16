-- Stick Empire 3D online multiplayer, part 2: private helpers and triggers
create or replace function se3d_private.is_member(p_match uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.se3d_match_players p
                 where p.match_id = p_match and p.user_id = (select auth.uid()) and p.left_at is null);
$$;
create or replace function se3d_private.can_use_topic(p_topic text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_topic is null or p_topic !~ '^se3d:match:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  v_id := substr(p_topic, 12)::uuid;
  return exists (select 1 from public.se3d_match_players p join public.se3d_matches m on m.id = p.match_id
                 where p.match_id = v_id and p.user_id = (select auth.uid()) and p.left_at is null
                   and m.status in ('waiting','ready','starting','playing'));
end $$;
grant execute on function se3d_private.is_member(uuid) to authenticated;
grant execute on function se3d_private.can_use_topic(text) to authenticated;

create or replace function se3d_private.new_code()
returns text language plpgsql volatile set search_path = '' as $$
declare a constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; b bytea := extensions.gen_random_bytes(6); s text := ''; i int;
begin
  for i in 0..5 loop s := s || substr(a, 1 + (get_byte(b, i) % 31), 1); end loop;
  return s;
end $$;

create or replace function se3d_private.clean_name(p_name text)
returns text language sql immutable set search_path = '' as $$
  select coalesce(nullif(left(btrim(regexp_replace(coalesce(p_name,''), '[^[:alnum:] _.-]', '', 'g')), 20), ''), 'Player');
$$;

create or replace function se3d_private.refresh_status(p_match uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare m public.se3d_matches%rowtype; n int; r int;
begin
  select * into m from public.se3d_matches where id = p_match for update;
  if not found or m.status not in ('waiting','ready') then return; end if;
  select count(*), count(*) filter (where is_ready) into n, r from public.se3d_match_players where match_id = p_match and left_at is null;
  if n = 0 then
    update public.se3d_matches set status = 'cancelled', ended_at = now() where id = p_match;
  elsif n = m.max_players and r = n then
    if m.status <> 'ready' then update public.se3d_matches set status = 'ready' where id = p_match; end if;
  elsif m.status <> 'waiting' then
    update public.se3d_matches set status = 'waiting' where id = p_match;
  end if;
end $$;

create or replace function se3d_private.touch()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create or replace trigger se3d_matches_touch before update on public.se3d_matches for each row execute function se3d_private.touch();

create or replace function se3d_private.check_transition()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status and not (
       (old.status = 'waiting'  and new.status in ('ready','cancelled'))
    or (old.status = 'ready'    and new.status in ('waiting','starting','cancelled'))
    or (old.status = 'starting' and new.status in ('playing','cancelled'))
    or (old.status = 'playing'  and new.status in ('finished','cancelled'))) then
    raise exception 'se3d: illegal match status change % -> %', old.status, new.status using errcode = 'check_violation';
  end if;
  if new.mode is distinct from old.mode or new.max_players is distinct from old.max_players or new.join_code is distinct from old.join_code then
    raise exception 'se3d: a room''s mode and code are fixed' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create or replace trigger se3d_matches_transition before update on public.se3d_matches for each row execute function se3d_private.check_transition();

create or replace function se3d_private.ping_room()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_status text;
begin
  if tg_table_name = 'se3d_matches' then v_id := coalesce(new.id, old.id); v_status := coalesce(new.status, old.status);
  else v_id := coalesce(new.match_id, old.match_id); select status into v_status from public.se3d_matches where id = v_id; end if;
  if v_id is not null then
    begin
      perform realtime.send(jsonb_build_object('match_id', v_id, 'status', v_status, 'at', extract(epoch from clock_timestamp())),
                            'room', 'se3d:match:' || v_id::text, true);
    exception when others then null;
    end;
  end if;
  return null;
end $$;
create or replace trigger se3d_matches_ping after insert or update on public.se3d_matches for each row execute function se3d_private.ping_room();
create or replace trigger se3d_players_ping after insert or update or delete on public.se3d_match_players for each row execute function se3d_private.ping_room();

create or replace function se3d_private.require_uid()
returns uuid language plpgsql stable set search_path = '' as $$
declare v uuid := (select auth.uid());
begin
  if v is null then raise exception 'se3d:not_signed_in' using errcode = '28000'; end if;
  return v;
end $$;
grant execute on function se3d_private.require_uid() to authenticated;

create or replace function se3d_private.room_json(p_match uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', m.id, 'code', m.join_code, 'mode', m.mode, 'max_players', m.max_players, 'is_private', m.is_private,
    'host', m.host_user_id, 'status', m.status, 'seed', m.match_seed, 'config', m.match_config,
    'created_at', m.created_at, 'started_at', m.started_at, 'expires_at', m.expires_at, 'server_now', now(),
    'players', coalesce((select jsonb_agg(jsonb_build_object('user_id', p.user_id, 'name', p.display_name, 'team', p.team, 'slot', p.player_slot,
                     'ready', p.is_ready, 'key', p.public_key, 'last_seen_at', p.last_seen_at, 'left', p.left_at is not null) order by p.player_slot)
                     from public.se3d_match_players p where p.match_id = m.id), '[]'::jsonb),
    'result', (select to_jsonb(r) - 'id' from public.se3d_match_results r where r.match_id = m.id))
  from public.se3d_matches m where m.id = p_match;
$$;

create or replace function se3d_private.check_config(p jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare f0 text := coalesce(p #>> '{factions,0}', 'order'); f1 text := coalesce(p #>> '{factions,1}', 'chaos'); sz int := coalesce((p ->> 'size')::int, 0);
begin
  if f0 not in ('order','chaos') or f1 not in ('order','chaos') then raise exception 'se3d:bad_config' using errcode = '22023'; end if;
  if sz not in (0,1) then sz := 0; end if;
  return jsonb_build_object('factions', jsonb_build_array(f0, f1), 'size', sz, 'finishers', 1);
end $$;

create or replace function se3d_private.my_seat(p_match uuid, p_uid uuid, p_states text[])
returns public.se3d_matches language plpgsql security definer set search_path = '' as $$
declare m public.se3d_matches%rowtype;
begin
  select * into m from public.se3d_matches where id = p_match for update;
  if not found or not exists (select 1 from public.se3d_match_players where match_id = p_match and user_id = p_uid and left_at is null) then
    raise exception 'se3d:not_a_member' using errcode = '42501';
  end if;
  if not (m.status = any (p_states)) then raise exception 'se3d:wrong_state:%', m.status using errcode = 'P0001'; end if;
  return m;
end $$;
