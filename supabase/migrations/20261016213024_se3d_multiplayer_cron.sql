-- Stick Empire 3D online multiplayer: run the room housekeeping every minute on the server (pg_cron), so abandoned
-- lobbies, stuck starts and battles whose host vanished are closed even when no client is around to notice.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('se3d-room-housekeeping', '* * * * *', 'select se3d_private.cleanup()');
