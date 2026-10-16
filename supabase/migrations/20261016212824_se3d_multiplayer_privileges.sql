-- Stick Empire 3D online multiplayer: tighten privileges (clients only read their own rooms through RLS; every write goes through RPC)
revoke insert, update, delete, truncate, references, trigger on public.se3d_matches, public.se3d_match_players, public.se3d_match_results from anon, authenticated;
revoke select on public.se3d_matches, public.se3d_match_players, public.se3d_match_results from anon;
revoke execute on function se3d_private.new_code(), se3d_private.clean_name(text), se3d_private.refresh_status(uuid), se3d_private.room_json(uuid),
  se3d_private.check_config(jsonb), se3d_private.my_seat(uuid, uuid, text[]), se3d_private.touch(), se3d_private.check_transition(), se3d_private.ping_room()
  from public, anon, authenticated;
revoke execute on function se3d_private.is_member(uuid), se3d_private.can_use_topic(text), se3d_private.require_uid() from public, anon;
