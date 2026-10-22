-- Stick Empire 3D online: the host picks the map (Classic or Riverlands) and how often finishers happen (off,
-- sometimes, always) in the lobby. check_config keeps both; se3d_set_config changes them (host only, before the
-- match starts) and asks everyone to ready up again.
create or replace function se3d_private.check_config(p jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare f0 text := coalesce(p #>> '{factions,0}', 'order'); f1 text := coalesce(p #>> '{factions,1}', 'chaos'); sz int := coalesce((p ->> 'size')::int, 0);
  mp text := coalesce(p ->> 'map', 'classic'); fin int := coalesce((p ->> 'finishers')::int, 1);
begin
  if f0 not in ('order','chaos') or f1 not in ('order','chaos') then raise exception 'se3d:bad_config' using errcode = '22023'; end if;
  if sz not in (0,1) then sz := 0; end if;
  if mp not in ('classic','river') then mp := 'classic'; end if;
  if fin not in (0,1,2) then fin := 1; end if;
  return jsonb_build_object('factions', jsonb_build_array(f0, f1), 'size', sz, 'map', mp, 'finishers', fin);
end $$;
revoke execute on function se3d_private.check_config(jsonb) from public, anon, authenticated;

create or replace function public.se3d_set_config(p_match uuid, p_map text, p_finishers integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := se3d_private.require_uid(); m public.se3d_matches;
begin
  if p_map not in ('classic','river') or p_finishers not in (0,1,2) then raise exception 'se3d:bad_config' using errcode = '22023'; end if;
  m := se3d_private.my_seat(p_match, v_uid, array['waiting','ready']);
  if m.host_user_id <> v_uid then raise exception 'se3d:not_host' using errcode = '42501'; end if;
  update public.se3d_matches set match_config = se3d_private.check_config(m.match_config || jsonb_build_object('map', p_map, 'finishers', p_finishers)) where id = p_match;
  update public.se3d_match_players set is_ready = false where match_id = p_match and left_at is null;
  perform se3d_private.refresh_status(p_match);
  return se3d_private.room_json(p_match);
end $$;
revoke all on function public.se3d_set_config(uuid, text, integer) from public, anon;
grant execute on function public.se3d_set_config(uuid, text, integer) to authenticated;
