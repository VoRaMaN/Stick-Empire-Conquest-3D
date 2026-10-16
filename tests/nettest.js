// Online multiplayer, without the network: a host and its guests each run in their own process (separate copies of the
// game, like separate browsers). The host's snapshots and events are handed to the guests and the guests' commands to
// the host exactly as the Realtime channel would carry them, so this checks the whole battle protocol:
// replication of units, regiments, treasuries, castles and statues; command validation (membership, team, sequence,
// duplicates, payload, ownership, costs); remote unit creation; deaths; victory; disconnection; 2v2 shared teams.
const { fork } = require('child_process');
const path = require('path');
const FILE = process.argv[2];
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) { passes++; console.log('  ok  ', m); } else { fails++; console.log('  FAIL', m); } };

function client(seed) {
  const p = fork(path.join(__dirname, 'net-child.js'), [FILE, String(seed)], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
  let n = 0; const waits = new Map(); let ready;
  const readyP = new Promise(r => ready = r);
  p.on('message', m => { if (m.ready) return ready(); const w = waits.get(m.id); if (w) { waits.delete(m.id); m.ok ? w.res(m) : w.rej(new Error(m.err)); } });
  const call = (op, o) => new Promise((res, rej) => { const id = ++n; waits.set(id, { res, rej }); p.send(Object.assign({ op, id }, o || {})); });
  return { ready: readyP, call, kill: () => p.kill() };
}
const room1 = { id: '00000000-0000-4000-8000-000000000001', code: 'TESTAB', mode: '1v1', max_players: 2, is_private: true, host: 'host-uid', status: 'starting',
  config: { factions: ['order', 'chaos'], size: 0 },
  players: [{ user_id: 'host-uid', name: 'Host', team: 0, slot: 0, ready: true, key: null, left: false }, { user_id: 'guest-uid', name: 'Guest', team: 1, slot: 1, ready: true, key: null, left: false }] };
let seq = 0;
const cmdMsg = (cmd, extra) => Object.assign({ k: 'cmd', mid: room1.id, sq: ++seq, ts: Date.now(), cid: cmd.cid, type: cmd.type, p: cmd.p }, extra || {});
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

(async () => {
  const H = client(11), G = client(12);
  await Promise.all([H.ready, G.ready]);
  // a guest with no configuration explains itself and keeps single-player
  const prob = (await G.call('eval', { code: 'return T.problem()' })).v;
  ok(/without an online configuration/.test(prob || ''), 'missing configuration is reported honestly: "' + (prob || '').slice(0, 60) + '…"');
  const mapped = (await G.call('eval', { code: 'return [T.mapError({code:"anonymous_provider_disabled",message:"Anonymous sign-ins are disabled"}).code, T.mapError({message:"se3d:room_full"}).code, T.mapError({message:"TypeError: Failed to fetch"}).code]' })).v;
  ok(mapped.join() === 'anon_disabled,room_full,network', 'auth / room / network errors map to player-facing messages: ' + mapped.join());

  await H.call('begin', { room: room1, uid: 'host-uid' }); await G.call('begin', { room: room1, uid: 'guest-uid' });
  const flags = (await G.call('eval', { code: 'return [S.NET.on,S.NET.host,S.NET.guest,S.NET.team]' })).v;
  ok(flags.join() === 'true,false,true,1', 'guest joins as team 1 without simulation authority (' + flags.join() + ')');
  async function run(frames, chunk) { chunk = chunk || 6; let last = null;
    for (let i = 0; i < frames; i += chunk) { const t = (await H.call('host-step', { frames: chunk })).ticks; if (t.length) last = t[t.length - 1]; await G.call('guest-step', { ticks: t, frames: chunk }); }
    return last; }
  let last = await run(120); await G.call('guest-step', { frames: 20 });
  let h = (await H.call('state')).v, g = (await G.call('state')).v;
  ok(h.units.length > 0 && g.units.length === h.units.length, 'guest shows the host\'s armies: ' + g.units.length + ' of ' + h.units.length + ' soldiers');
  ok(g.units.every(u => u.net), 'every soldier on the guest is a replicated puppet');
  const tick = last; ok(tick && tick.u.length === h.units.length, 'a snapshot carries every soldier (' + (tick && tick.u.length) + ')');
  const size = JSON.stringify(tick).length; ok(size < 20000, 'a Normal-battle snapshot is small: ' + size + ' bytes');
  let byId = new Map(h.units.map(u => [u.id, u])), dsum = 0, dmax = 0;
  for (const u of g.units) { const o = byId.get(u.id); if (!o) continue; const d = dist(u, o); dsum += d; dmax = Math.max(dmax, d); }
  ok(dsum / g.units.length < .6 && dmax < 2.5, 'guest positions follow the host (mean ' + (dsum / g.units.length).toFixed(2) + ' m, worst ' + dmax.toFixed(2) + ' m)');
  ok(Math.abs(g.gold[0] - h.gold[0]) < 30 && Math.abs(g.gold[1] - h.gold[1]) < 30, 'treasuries agree: host ' + h.gold.map(Math.floor) + ' guest ' + g.gold.map(Math.floor));
  ok(g.statues.join() === h.statues.join(), 'statue health agrees: ' + g.statues.join(' | '));

  console.log('commands from the guest');
  const guestCmd = async (type, p) => (await G.call('issue', { type, p })).cmd;
  let c = await guestCmd('buy', { t: 'thrall' });
  const goldBefore = (await H.call('state')).v.gold[1];
  await H.call('hostcmd', { uid: 'guest-uid', m: cmdMsg(c) });
  h = (await H.call('state')).v;
  ok(goldBefore - h.gold[1] > 0, 'guest buys a Thrall: the host spends team 1\'s souls (' + Math.floor(goldBefore) + ' → ' + Math.floor(h.gold[1]) + ')');
  await run(60 * 5);
  h = (await H.call('state')).v; g = (await G.call('state')).v;
  const hostThralls = h.units.filter(u => u.type === 'thrall').length, guestThralls = g.units.filter(u => u.type === 'thrall').length;
  ok(hostThralls === 3 && guestThralls === 3, 'the recruited Thrall walks out on the host and appears on the guest (' + hostThralls + ' / ' + guestThralls + ')');
  ok(g.pending === 0 && g.acks.some(a => a[0] === c.cid && a[1] === 1), 'the host confirmed the purchase to the guest');
  const hc0 = h.hostCmds;
  await H.call('hostcmd', { uid: 'guest-uid', m: Object.assign(cmdMsg(c), { sq: ++seq }) });
  ok((await H.call('state')).v.hostCmds === hc0, 'a repeated command id is dropped');
  c = await guestCmd('buy', { t: 'thrall' }); await H.call('hostcmd', { uid: 'guest-uid', m: cmdMsg(c, { sq: 1 }) });
  await run(12); g = (await G.call('state')).v;
  ok(g.acks.some(a => a[0] === c.cid && a[1] === 0 && a[2] === 'stale_sequence'), 'an out-of-sequence command is refused');
  c = await guestCmd('buy', { t: 'thrall' }); await H.call('hostcmd', { uid: 'stranger-uid', m: cmdMsg(c) });
  ok((await H.call('state')).v.hostCmds === hc0, 'a command from someone without a seat is ignored');
  const ordReg = h.regs.find(r => r.team === 0);
  c = await guestCmd('reg', { r: ordReg.id, k: 'charge' }); await H.call('hostcmd', { uid: 'guest-uid', m: cmdMsg(c) });
  await run(12); h = (await H.call('state')).v; g = (await G.call('state')).v;
  ok(g.acks.some(a => a[0] === c.cid && a[2] === 'not_your_regiment') && h.regs.find(r => r.id === ordReg.id).kind !== 'charge', 'the guest cannot order the host\'s regiment');
  for (const [type, p, want] of [['nuke', {}, 'unknown_command'], ['buy', { t: 'sword' }, 'not_in_roster'], ['buy', 'x', 'bad_payload'], ['reg', { r: 999999, k: 'move', x: 0, z: 0 }, 'not_your_regiment'], ['res', { id: 'rage' }, 'not_your_building']]) {
    c = await guestCmd(type, p); await H.call('hostcmd', { uid: 'guest-uid', m: cmdMsg(c) }); }
  await run(12); g = (await G.call('state')).v;
  const refused = g.acks.slice(-5).map(a => a[2]).join();
  ok(refused === 'unknown_command,not_in_roster,bad_payload,not_your_regiment,not_your_building', 'invalid commands are refused with a reason: ' + refused);
  // spend until the souls run out: the host refuses the purchase it can't afford
  let reason = '';
  for (let i = 0; i < 12 && reason !== 'gold'; i++) { c = await guestCmd('buy', { t: 'dread' }); await H.call('hostcmd', { uid: 'guest-uid', m: cmdMsg(c) }); await run(6); g = (await G.call('state')).v; const a = g.acks.find(a => a[0] === c.cid); if (a && !a[1]) reason = a[2]; }
  h = (await H.call('state')).v;
  ok(reason === 'gold' && h.gold[1] >= 0, 'buying beyond the treasury is refused (' + reason + '), souls never go negative (' + Math.floor(h.gold[1]) + ')');

  console.log('orders, movement and combat');
  const myReg = h.regs.find(r => r.team === 1 && r.n > 0);
  c = await guestCmd('reg', { r: myReg.id, k: 'move', x: 10, z: 6 }); await H.call('hostcmd', { uid: 'guest-uid', m: cmdMsg(c) });
  await run(60 * 4); h = (await H.call('state')).v; g = (await G.call('state')).v;
  ok(h.regs.find(r => r.id === myReg.id).kind === 'move' || h.regs.find(r => r.id === myReg.id).kind === 'hold', 'guest\'s move order reaches the host (' + h.regs.find(r => r.id === myReg.id).kind + ')');
  const movedH = h.units.filter(u => u.reg === myReg.id), movedG = g.units.filter(u => u.reg === myReg.id);
  ok(movedG.length && movedG.every(u => dist(u, { x: 10, z: 6 }) < 8), 'the guest sees its regiment march to the spot it chose');
  await H.call('issue', { type: 'stance', p: { st: 'charge' } });
  c = await guestCmd('stance', { st: 'charge' }); await H.call('hostcmd', { uid: 'guest-uid', m: cmdMsg(c) });
  await run(60 * 50, 12); await G.call('guest-step', { frames: 30 });
  h = (await H.call('state')).v; g = (await G.call('state')).v;
  ok(h.stance.join() === 'charge,charge' && g.stance.join() === 'charge,charge', 'both stances replicated: ' + g.stance.join());
  ok(h.corpses > 2, 'soldiers died on the host: ' + h.corpses);
  const hIds = new Set(h.units.map(u => u.id)), gIds = new Set(g.units.map(u => u.id));
  const onlyG = [...gIds].filter(i => !hIds.has(i)), onlyH = [...hIds].filter(i => !gIds.has(i));
  ok(onlyG.length <= 2 && onlyH.length <= 2, 'the same soldiers are alive on both (host-only ' + onlyH.length + ', guest-only ' + onlyG.length + ')');
  ok(g.corpses >= h.corpses - 3, 'deaths reach the guest as ragdolls: host ' + h.corpses + ' corpses, guest ' + g.corpses);
  let hpDiff = 0; byId = new Map(h.units.map(u => [u.id, u])); for (const u of g.units) { const o = byId.get(u.id); if (o) hpDiff = Math.max(hpDiff, Math.abs(o.hp - u.hp)); }
  ok(hpDiff < 120, 'health follows the host (largest gap during the brawl ' + hpDiff + ')');
  ok(h.nan === 0 && g.nan === 0, 'no NaN on host or guest');

  console.log('statue and victory');
  await H.call('eval', { code: 'S.statues[1].hp=5; S.hitStatue(S.statues[1],10); return 1' });   // the game's own statue damage
  await run(30); await G.call('guest-step', { frames: 30 });
  h = (await H.call('state')).v; g = (await G.call('state')).v;
  ok(h.netOver && h.netOver.w === 0 && h.netOver.r === 'statue_destroyed', 'the host decides the battle: Order wins by statue');
  ok(g.netOver && g.netOver.w === 0 && g.winner === 0 && g.over > 0, 'the guest receives the same result (winner ' + g.winner + ')');
  ok(g.statues[1][0] === 0, 'the guest shows the destroyed statue');
  H.kill(); G.kill();

  console.log('2v2: shared armies and treasuries');
  const room2 = JSON.parse(JSON.stringify(room1)); room2.id = '00000000-0000-4000-8000-000000000002'; room2.mode = '2v2'; room2.max_players = 4; room2.host = 'h';
  room2.players = [{ user_id: 'h', name: 'H', team: 0, slot: 0 }, { user_id: 'g1', name: 'G1', team: 1, slot: 1 }, { user_id: 'g2', name: 'G2', team: 0, slot: 2 }, { user_id: 'g3', name: 'G3', team: 1, slot: 3 }].map(p => Object.assign({ ready: true, key: null, left: false }, p));
  const HH = client(21), G1 = client(22), G2 = client(23), G3 = client(24);
  await Promise.all([HH.ready, G1.ready, G2.ready, G3.ready]);
  await HH.call('begin', { room: room2, uid: 'h' }); for (const [C, u] of [[G1, 'g1'], [G2, 'g2'], [G3, 'g3']]) await C.call('begin', { room: room2, uid: u });
  const team2 = (await G2.call('eval', { code: 'return S.NET.team' })).v, team3 = (await G3.call('eval', { code: 'return S.NET.team' })).v;
  ok(team2 === 0 && team3 === 1, '2v2: seat 2 plays for team 0 and seat 3 for team 1');
  async function run4(frames) { for (let i = 0; i < frames; i += 6) { const t = (await HH.call('host-step', { frames: 6 })).ticks; await Promise.all([G1, G2, G3].map(C => C.call('guest-step', { ticks: t, frames: 6 }))); } }
  await run4(60);
  let hs = (await HH.call('state')).v;
  const g0 = hs.gold[0], teamReg = hs.regs.find(r => r.team === 0);
  const m2 = (await G2.call('issue', { type: 'buy', p: { t: 'sword' } })).cmd; seq = 0;
  await HH.call('hostcmd', { uid: 'g2', m: Object.assign({ k: 'cmd', mid: room2.id, sq: 1, ts: 0 }, { cid: m2.cid, type: m2.type, p: m2.p }) });
  hs = (await HH.call('state')).v;
  ok(g0 - hs.gold[0] >= 100, 'a teammate buys from the shared team-0 treasury (' + Math.floor(g0) + ' → ' + Math.floor(hs.gold[0]) + ')');
  const m3 = (await G2.call('issue', { type: 'reg', p: { r: teamReg.id, k: 'hold' } })).cmd;
  await HH.call('hostcmd', { uid: 'g2', m: { k: 'cmd', mid: room2.id, sq: 2, ts: 0, cid: m3.cid, type: m3.type, p: m3.p } });
  const m4 = (await G1.call('issue', { type: 'reg', p: { r: teamReg.id, k: 'charge' } })).cmd;
  await HH.call('hostcmd', { uid: 'g1', m: { k: 'cmd', mid: room2.id, sq: 1, ts: 0, cid: m4.cid, type: m4.type, p: m4.p } });
  await run4(18); hs = (await HH.call('state')).v;
  ok(hs.regs.find(r => r.id === teamReg.id).kind === 'hold', 'the host\'s teammate commands the shared team-0 regiment; an opponent cannot (' + hs.regs.find(r => r.id === teamReg.id).kind + ')');
  const views = await Promise.all([G1, G2, G3].map(C => C.call('state')));
  const golds = views.map(v => Math.floor(v.v.gold[0]));
  ok(Math.max(...golds) - Math.min(...golds) <= 25 && Math.abs(golds[1] - hs.gold[0]) < 40, 'all three guests see the same team-0 treasury: ' + golds.join(' / ') + ' (host ' + Math.floor(hs.gold[0]) + ')');
  ok(views.every(v => v.v.units.length === hs.units.length), 'all three guests show every soldier (' + views.map(v => v.v.units.length).join(', ') + ' of ' + hs.units.length + ')');
  // a whole team disconnecting: no victory for the other side, the match ends with no winner after the grace period
  await HH.call('eval', { code: 'T.presence(["h","g2"]); return 1' });
  await run4(60 * 20); hs = (await HH.call('state')).v;
  ok(!hs.netOver, 'within the grace period the battle goes on');
  await HH.call('host-step', { frames: 60 * 45 }); hs = (await HH.call('state')).v;
  ok(hs.netOver && hs.netOver.w === null && hs.netOver.r === 'abandoned', 'after 60 s without team 1 the match ends with no winner (' + JSON.stringify(hs.netOver && { w: hs.netOver.w, r: hs.netOver.r }) + ')');
  const sd = (await G1.call('eval', { code: 'T.shutdown(); return [S.NET.on,S.NET.guest]' })).v;
  ok(sd.join() === 'false,false', 'leaving cleans up: the guest is offline again');
  for (const C of [HH, G1, G2, G3]) C.kill();
  console.log(`\nnettest: ${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL nettest crashed:', e.message); process.exit(1); });
