// Online rooms against the real Supabase project: anonymous sign-in, room creation, codes, joining, full rooms,
// duplicate membership, teams (1v1 and 2v2), ready states, start validation, results, RLS and private Realtime channels.
//
//   NODE_USE_ENV_PROXY=1 node tests/online/rooms.test.mjs        (needs network access to the Supabase project)
//
// It signs in with real anonymous identities (cached in tests/online/.sessions.json, git-ignored, so repeated runs
// don't use up the project's anonymous sign-in rate limit) and leaves every room it opens.
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const cfgFile = path.join(ROOT, 'online.config.json');
const cfg = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : {};
const URL_ = process.env.SUPABASE_URL || cfg.supabaseUrl, KEY = process.env.SUPABASE_PUBLISHABLE_KEY || cfg.supabasePublishableKey;
if (!URL_ || !KEY) { console.log('SKIP no Supabase configuration'); process.exit(0); }
const SESS = path.join(ROOT, 'tests/online/.sessions.json');
let sessions = {}; try { sessions = JSON.parse(fs.readFileSync(SESS, 'utf8')); } catch (e) {}

let fails = 0, passes = 0;
const ok = (c, m) => { if (c) { passes++; console.log('  ok  ', m); } else { fails++; console.log('  FAIL', m); } };
const errCode = e => e ? (String(e.message || '').match(/se3d:([a-z_]+)/) || [])[1] || e.message : null;

async function player(name) {
  const c = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  let s = sessions[name];
  if (s) { const r = await c.auth.refreshSession({ refresh_token: s }); if (r.error || !r.data.session) s = null; }
  if (!s) { const r = await c.auth.signInAnonymously(); if (r.error) throw new Error('anonymous sign-in failed: ' + r.error.message); }
  const { data } = await c.auth.getSession(); sessions[name] = data.session.refresh_token;
  fs.writeFileSync(SESS, JSON.stringify(sessions));
  c.realtime.setAuth(data.session.access_token);
  return { name, c, uid: data.session.user.id };
}
const rpc = async (p, fn, args) => { const r = await p.c.rpc(fn, args || {}); return { data: r.data, err: errCode(r.error) }; };
const KEYJWK = { kty: 'EC', crv: 'P-256', x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU', y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0' };

const A = await player('A'), B = await player('B'), C = await player('C'), D = await player('D'), E = await player('E');
console.log('anonymous identities:', [A, B, C, D, E].map(p => p.uid.slice(0, 8)).join(' '));
for (const p of [A, B, C, D, E]) { const m = await rpc(p, 'se3d_my_active_match'); if (m.data) await rpc(p, 'se3d_leave_room', { p_match: m.data.id }); }

console.log('1v1 private room');
let r = await rpc(A, 'se3d_create_room', { p_mode: '1v1', p_name: 'Alpha <b>', p_private: true });
ok(!r.err && /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(r.data.code), 'room created with a 6-character code ' + (r.data && r.data.code));
const room = r.data, code = room.code;
ok(room.status === 'waiting' && room.players.length === 1 && room.players[0].team === 0 && room.players[0].slot === 0, 'creator holds slot 0, team 0');
ok(room.players[0].name === 'Alpha b', 'display name is sanitised (' + room.players[0].name + ')');
r = await rpc(B, 'se3d_join_room', { p_code: ' ' + code.toLowerCase().slice(0, 3) + '-' + code.toLowerCase().slice(3), p_name: 'Bravo' });
ok(!r.err && r.data.players.length === 2, 'code is normalised (lower case, spaces, dash) and B joins');
const bSeat = r.data.players.find(p => p.user_id === B.uid);
ok(bSeat && bSeat.team === 1 && bSeat.slot === 1, '1v1: joiner gets slot 1, team 1');
r = await rpc(B, 'se3d_join_room', { p_code: code, p_name: 'Bravo' });
ok(!r.err && r.data.players.filter(p => p.user_id === B.uid).length === 1, 'joining twice does not duplicate the membership');
r = await rpc(C, 'se3d_join_room', { p_code: code, p_name: 'Charlie' });
ok(r.err === 'room_full', 'a third player is refused: ' + r.err);
r = await rpc(C, 'se3d_join_room', { p_code: 'XX', p_name: 'Charlie' }); ok(r.err === 'invalid_code', 'malformed code: ' + r.err);
r = await rpc(C, 'se3d_join_room', { p_code: 'ZZZZZ2', p_name: 'Charlie' }); ok(r.err === 'room_not_found', 'unknown code: ' + r.err);

console.log('RLS and privileges');
let q = await C.c.from('se3d_matches').select('id').eq('id', room.id); ok(!q.error && q.data.length === 0, 'a non-member cannot read the room row');
q = await A.c.from('se3d_matches').select('id,status').eq('id', room.id); ok(!q.error && q.data.length === 1, 'a member reads the room row');
q = await C.c.from('se3d_match_players').select('user_id').eq('match_id', room.id); ok(!q.error && q.data.length === 0, 'a non-member cannot read the seats');
r = await rpc(C, 'se3d_room_state', { p_match: room.id }); ok(r.err === 'not_a_member', 'room_state refuses a non-member: ' + r.err);
q = await B.c.from('se3d_match_players').update({ team: 0 }).eq('match_id', room.id).eq('user_id', B.uid).select();
ok(q.error || (q.data || []).length === 0, 'a player cannot change their own team directly (' + (q.error ? q.error.code : 'no rows') + ')');
q = await C.c.from('se3d_match_players').insert({ match_id: room.id, user_id: C.uid, display_name: 'x', team: 0, player_slot: 0 });
ok(!!q.error, 'a direct insert of a seat is refused (' + (q.error && q.error.code) + ')');
q = await A.c.from('se3d_matches').update({ status: 'finished' }).eq('id', room.id).select();
ok(q.error || (q.data || []).length === 0, 'even the host cannot mark the match finished directly');
q = await A.c.from('se3d_match_results').insert({ match_id: room.id, winner_team: 0, result: 'surrender' });
ok(!!q.error, 'nobody can write a result row directly');

console.log('ready and start');
r = await rpc(B, 'se3d_set_ready', { p_match: room.id, p_ready: true }); ok(r.err === 'key_missing', 'ready needs a registered signing key: ' + r.err);
r = await rpc(B, 'se3d_set_key', { p_match: room.id, p_jwk: { ...KEYJWK, d: 'secret' } }); ok(r.err === 'bad_key', 'a private key component is refused: ' + r.err);
for (const p of [A, B]) { r = await rpc(p, 'se3d_set_key', { p_match: room.id, p_jwk: KEYJWK }); ok(!r.err, p.name + ' registers a public key'); }
r = await rpc(A, 'se3d_start_match', { p_match: room.id }); ok(r.err === 'not_ready', 'start refused before everyone is ready: ' + r.err);
r = await rpc(A, 'se3d_set_ready', { p_match: room.id, p_ready: true }); ok(r.data.status === 'waiting', 'one ready player: still waiting');
r = await rpc(B, 'se3d_set_ready', { p_match: room.id, p_ready: true }); ok(r.data.status === 'ready', 'both ready: status READY');
r = await rpc(B, 'se3d_set_ready', { p_match: room.id, p_ready: false }); ok(r.data.status === 'waiting', 'unready: back to WAITING');
r = await rpc(B, 'se3d_set_ready', { p_match: room.id, p_ready: true });
r = await rpc(B, 'se3d_start_match', { p_match: room.id }); ok(r.err === 'not_host', 'a guest cannot start: ' + r.err);
const [s1, s2] = await Promise.all([rpc(A, 'se3d_start_match', { p_match: room.id }), rpc(A, 'se3d_start_match', { p_match: room.id })]);
ok(!s1.err && !s2.err && s1.data.status === 'starting' && s2.data.status === 'starting', 'two start presses at once: one STARTING, no error');
r = await rpc(C, 'se3d_join_room', { p_code: code, p_name: 'Charlie' }); ok(r.err === 'match_started', 'joining a started match is refused: ' + r.err);
r = await rpc(B, 'se3d_mark_playing', { p_match: room.id }); ok(r.err === 'not_host', 'a guest cannot mark the match playing: ' + r.err);
r = await rpc(A, 'se3d_mark_playing', { p_match: room.id }); ok(r.data && r.data.status === 'playing', 'host marks PLAYING');
r = await rpc(B, 'se3d_report_result', { p_match: room.id, p_winner: 1, p_result: 'statue_destroyed' }); ok(r.err === 'not_host', 'a guest cannot report a result: ' + r.err);
r = await rpc(B, 'se3d_abandon_match', { p_match: room.id }); ok(r.err === 'host_alive', 'a guest cannot abandon while the host heartbeats: ' + r.err);
r = await rpc(A, 'se3d_report_result', { p_match: room.id, p_winner: 0, p_result: 'abandoned' }); ok(r.err === 'bad_result', 'an abandoned result cannot name a winner: ' + r.err);
r = await rpc(A, 'se3d_report_result', { p_match: room.id, p_winner: 0, p_result: 'statue_destroyed', p_duration: 61, p_summary: { kills: [3, 1] } });
ok(r.data && r.data.status === 'finished' && r.data.result && r.data.result.winner_team === 0, 'host reports the result: FINISHED, winner team 0');
r = await rpc(A, 'se3d_report_result', { p_match: room.id, p_winner: 1, p_result: 'statue_destroyed' }); ok(r.err && r.err.startsWith('wrong_state'), 'a second result is refused: ' + r.err);
q = await B.c.from('se3d_match_results').select('winner_team,result').eq('match_id', room.id); ok(q.data && q.data.length === 1 && q.data[0].winner_team === 0, 'both players read the same stored result');
r = await rpc(C, 'se3d_join_room', { p_code: code, p_name: 'Charlie' }); ok(r.err === 'room_expired', 'a finished room accepts nobody: ' + r.err);

console.log('2v2 teams');
r = await rpc(A, 'se3d_create_room', { p_mode: '2v2', p_name: 'A2' }); const r2 = r.data;
ok(r2.max_players === 4, '2v2 room has four seats');
const teams = [];
for (const p of [B, C, D]) { r = await rpc(p, 'se3d_join_room', { p_code: r2.code, p_name: p.name }); teams.push(r.data.players.find(x => x.user_id === p.uid)); }
ok(teams.map(t => t.slot + ':' + t.team).join(',') === '1:1,2:0,3:1', '2v2 seats alternate teams: ' + teams.map(t => t.slot + ':' + t.team).join(','));
r = await rpc(E, 'se3d_join_room', { p_code: r2.code, p_name: 'E' }); ok(r.err === 'room_full', 'fifth player refused: ' + r.err);
r = await rpc(B, 'se3d_switch_team', { p_match: r2.id }); ok(r.err === 'team_full', 'cannot switch into a full team: ' + r.err);
r = await rpc(C, 'se3d_leave_room', { p_match: r2.id }); ok(!r.err, 'C leaves the lobby');
r = await rpc(B, 'se3d_switch_team', { p_match: r2.id }); const bs = r.data && r.data.players.find(x => x.user_id === B.uid);
ok(!r.err && bs && bs.team === 0 && bs.slot === 2, 'B switches into the free team-0 seat');
r = await rpc(E, 'se3d_join_room', { p_code: r2.code, p_name: 'E' }); const es = r.data && r.data.players.find(x => x.user_id === E.uid);
ok(!r.err && es && es.team === 1 && es.slot === 1, 'E takes the freed seat (slot 1, team 1)');
r = await rpc(D, 'se3d_set_faction', { p_match: r2.id, p_faction: 'order' });
ok(!r.err && r.data.config.factions[1] === 'order' && r.data.config.factions[0] === 'order', 'a team-1 player sets team 1\'s faction only: ' + JSON.stringify(r.data.config.factions));
r = await rpc(A, 'se3d_leave_room', { p_match: r2.id }); r = await rpc(B, 'se3d_room_state', { p_match: r2.id });
ok(r.data.host !== A.uid && r.data.players.some(p => p.user_id === r.data.host) && r.data.status === 'waiting', 'host leaves the lobby: the host role passes on');
for (const p of [B, D, E]) await rpc(p, 'se3d_leave_room', { p_match: r2.id });
r = await rpc(B, 'se3d_room_state', { p_match: r2.id }); ok(r.data.status === 'cancelled', 'last player leaves: room CANCELLED');

console.log('quick match');
const [qa] = [await rpc(A, 'se3d_quick_match', { p_mode: '1v1', p_name: 'A' })];
const qb = await rpc(B, 'se3d_quick_match', { p_mode: '1v1', p_name: 'B' });
ok(!qa.err && !qb.err && qa.data.id === qb.data.id && qb.data.players.length === 2, 'two quick-match searches pair up in one room (A created: ' + qa.data.created + ', B joined: ' + !qb.data.created + ')');

console.log('private Realtime channel');
const topic = 'se3d:match:' + qa.data.id;
const sub = (p) => new Promise(res => { const ch = p.c.channel(topic, { config: { private: true } });
  const got = []; ch.on('broadcast', { event: 'room' }, m => got.push(m.payload));
  ch.subscribe((st, err) => { if (st === 'SUBSCRIBED' || st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') res({ st, err, ch, got }); }); });
const sa = await sub(A), sc = await sub(C);
ok(sa.st === 'SUBSCRIBED', 'a member joins the private match channel (' + sa.st + (sa.err ? ': ' + sa.err.message : '') + ')');
ok(sc.st !== 'SUBSCRIBED', 'a non-member is refused the private channel (' + sc.st + (sc.err ? ': ' + sc.err.message : '') + ')');
await rpc(B, 'se3d_set_name', { p_match: qa.data.id, p_name: 'Bee' });
await new Promise(r => setTimeout(r, 2500));
ok(sa.got.length > 0 && sa.got[0].match_id === qa.data.id, 'a room change reaches members as a database broadcast (' + sa.got.length + ' pings)');
const echo = []; const sb = await sub(B); sb.ch.on('broadcast', { event: 'hello' }, m => echo.push(m.payload));
await sa.ch.send({ type: 'broadcast', event: 'hello', payload: { from: 'A' } });
await new Promise(r => setTimeout(r, 1500));
ok(echo.length === 1 && echo[0].from === 'A', 'members exchange broadcast messages on the private channel');
for (const s of [sa, sb, sc]) await s.ch.unsubscribe();
for (const p of [A, B]) await rpc(p, 'se3d_leave_room', { p_match: qa.data.id });
for (const p of [A, B, C, D, E]) p.c.realtime.disconnect();
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
