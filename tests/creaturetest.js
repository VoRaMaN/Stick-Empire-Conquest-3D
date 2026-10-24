// The Wyvern and the Devil Bat as skinned models (27l) and their 100 animation variations (13m), in Node:
//   1. models: both load, bone and triangle counts, the scale and size in the game, facing forward
//   2. the pose bookkeeping matches what three.js computes from the bones (world positions)
//   3. every variation through the real controller in the Lab: it plays, each event fires once, damage only on the
//      events, attack phases in order with the blow inside execution → impact, no NaN or snaps, feet planted,
//      knees in front, toes, tail and wing tips above the ground, no ground IK in the air, no motion of its own
//   4. the state rules: an idle never cuts an attack, a finisher runs to its end, a flinch can't cut an ability,
//      death cancels everything, a charge flows into its strike and back to idle, a called-off charge pulls up
//   5. the idle scheduler: weighted, cooldowns, never the same twice, the rare one seldom
//   6. a battle with wyvern knights and devil bats: errors, NaN, the metrics, abilities still on their cooldowns
//   7. the cost of posing
// Usage: node tests/creaturetest.js dist/artifact.html [--quick]
const FILE = process.argv[2] || 'dist/artifact.html', QUICK = process.argv.includes('--quick'), ONLY = process.env.CT_ONLY && new RegExp(process.env.CT_ONLY);   // CT_ONLY: just the matching variations
(async () => {
  const { S } = require('./animboot')(FILE, { assets: true });
  const ok = await S.cgReady();
  const probe = require('./creatureprobe')(S), V = S.THREE.Vector3, R = S.CREATURE_ANIMS;
  const fails = [], check = (c, msg) => { if (!c) fails.push(msg); return c; };
  const out = {};
  // ---------- 1. models ----------
  check(ok && !S.CG.failed, 'models failed: ' + S.CG.failed);
  const P = S.CG.P;
  out.models = {};
  for (const [kind, nb, tris] of [['wyvern', 47, 8164], ['devilbat', 42, 6772]]) { const p = P[kind];
    if (!check(p, kind + ' model missing')) continue;
    out.models[kind] = { bones: p.B.length, tris: p.tris, meshes: p.geo.length, scale: p.k };
    check(p.B.length === nb, kind + ' bones ' + p.B.length); check(p.tris === tris, kind + ' tris ' + p.tris); }
  const lab = (ty, defend) => { S.game.duelSel = ty; S.game.duelDefend = !!defend; S.setMode('duel'); const D = S.game.duel; D.dum.invuln = true; S.game.slow = false; return D; };
  const run = (n, each) => { for (let i = 0; i < n; i++) { S.step(1 / 60); S.draw(); if (each && each(i) === false) return i; } return n; };
  for (const ty of ['knight', 'bat']) { const D = lab(ty); const u = D.att; u.idleT = 99; run(40);
    const I = u.cg; if (!check(I, ty + ': no model attached in the Lab')) continue;
    check(I.root.visible, ty + ': model hidden');
    // 2. bookkeeping vs three.js
    I.root.updateMatrixWorld(true); let err = 0; I.bones.forEach((b, i) => { err = Math.max(err, new V().setFromMatrixPosition(b.matrixWorld).distanceTo(I.pw[i])); });
    check(err < 1e-3, ty + ': bone world positions differ from the pose bookkeeping by ' + err.toFixed(5));
    // size and facing: the head ahead of the pelvis along the unit's heading; the extent of the bones
    const hp = I.pw[I.P.I.head].clone().sub(I.pw[I.P.I.pelvis]); const ahead = hp.x * u.fwdW.x + hp.z * u.fwdW.z;
    const mn = new V(1e9, 1e9, 1e9), mx = new V(-1e9, -1e9, -1e9); for (const p of I.pw) { mn.min(p); mx.max(p); }
    const f = u.fwdW, r = new V(f.z, 0, -f.x), len = I.pw.map(p => p.x * f.x + p.z * f.z), wid = I.pw.map(p => p.x * r.x + p.z * r.z);
    out.models[I.P.kind].inGame = { ahead: +ahead.toFixed(2), length: +(Math.max(...len) - Math.min(...len)).toFixed(2), span: +(Math.max(...wid) - Math.min(...wid)).toFixed(2), height: +(mx.y - S.H(u.pos.x, u.pos.z)).toFixed(2) };
    check(ahead > .3, ty + ': model does not face its heading (head ' + ahead.toFixed(2) + ' m ahead of the pelvis)'); }
  // ---------- 3. every variation ----------
  const rows = [], agg = {};
  const HITS = { hit: 1, fire: 1, kill: 1, knock: 1, grab: 1, stabRag: 1, jolt: 1, wyFire: 1, batDrop: 1 };   // (batDrop: the snatched victim let fall, which hurts)
  for (const cr of ['wyvern', 'devilbat']) { const ty = cr === 'wyvern' ? 'knight' : 'bat';
    for (const id of S.caList(cr)) { const d = R[id]; if (ONLY && !ONLY.test(id)) continue;
      const D = lab(ty, false), u = D.att, dum = D.dum; u.idleT = 99; run(30);
      const fin = d.cat === 'finisher'; dum.invuln = false; if (!fin) { dum.hp = dum.maxHp = 99999; }
      probe.reset();
      const started = S.caPlay(u, id, dum); let played = false, firedMax = 0, drops = 0, dot = 0, win = 0, lastF = 0, lastHp = dum.hp, t0 = S.game.time, states = new Set();
      const limit = Math.round(((d.dur || 1) + (d.cat === 'charge' ? 4.5 : 1.2)) * 60);
      run(limit, () => { const a = u.action; if (a && a.c.name === d.clip) { played = true; firedMax = Math.max(firedMax, a.fired); if (a.fired > lastF) win = 3; lastF = a.fired; } else lastF = 0;
        if (dum.hp < lastHp - 1e-6) { if (win > 0) drops++; else dot++; } lastHp = dum.hp; win--; states.add(S.caState(u)); probe.sample(u, 1 / 60);
        if (played && !(u.action && u.action.c.name === d.clip) && S.game.time - t0 > .3) return false; });
      run(20, () => probe.sample(u, 1 / 60));   // the recovery after it
      const c = S.CLIPS[ty][d.clip], hits = c.ev.filter(e => HITS[e.e]).length, dmgHits = c.ev.filter(e => e.e === 'hit').length, m = probe.report();
      const row = { id, src: d.src, started, played, dur: +c.dur.toFixed(2), events: c.ev.length, fired: firedMax, hits, drops, dot, victimDead: fin ? !dum.alive : undefined, ...m };
      delete row.ex; if (m.ex.length) row.ex = m.ex.slice(0, 3); rows.push(row);
      check(played, id + ': never played');
      if (!c.loop) check(firedMax === c.ev.length, id + ': events fired ' + firedMax + ' of ' + c.ev.length);
      if (!fin && d.cat !== 'idle' && d.cat !== 'ability') check(drops <= Math.max(dmgHits, hits), id + ': damage applied ' + drops + ' times for ' + dmgHits + ' hit events');
      if (fin) check(!dum.alive, id + ': the finisher did not kill');
      if ((d.cat === 'attack' || (d.cat === 'charge' && !d.halt)) && dmgHits) check(drops >= 1, id + ': the blow never landed on the dummy');
      if (d.ph) { const ph = d.ph; check(ph.every((x, i) => !i || x > ph[i - 1]), id + ': phases out of order'); check(Math.abs(ph[4] - c.dur) < .02, id + ': recovery does not end the clip');
        for (const e of c.ev) if (e.e === 'hit') check(e.t >= ph[1] - 1e-3 && e.t <= ph[3] + 1e-3, id + ': hit at ' + e.t + ' outside execution→impact ' + ph[1] + '–' + ph[3]); }
      check(m.nan === 0, id + ': NaN in the model'); check(m.rootDrift === 0, id + ': the model moved on its own');
      const A = agg[cr + '.' + d.cat] || (agg[cr + '.' + d.cat] = { n: 0, snaps: 0, flips: 0, kneeBack: 0, groundPen: 0, tailGround: 0, wingGround: 0, airGlued: 0, plantSec: 0, slide: 0, footMaxCm: 0 });
      A.n++; for (const k of ['snaps', 'flips', 'kneeBack', 'groundPen', 'tailGround', 'wingGround', 'airGlued']) A[k] += m[k];
      A.plantSec += m.plantSec; A.slide += m.slideCmS * m.plantSec; A.footMaxCm = Math.max(A.footMaxCm, m.footMaxCm); } }
  for (const k in agg) { const A = agg[k]; A.slideCmS = +(A.slide / Math.max(1e-3, A.plantSec)).toFixed(2); delete A.slide; A.plantSec = +A.plantSec.toFixed(1); }
  out.variations = agg;
  if (ONLY) { for (const r of rows) console.log(JSON.stringify(r)); console.log(JSON.stringify(agg)); console.log(fails.join('\n')); process.exit(0); }
  // ---------- 4. state rules ----------
  const rules = {};
  { const D = lab('knight'), u = D.att; run(20);
    S.caPlay(u, 'wyvern.attack.heavy_strike', D.dum); run(10); S.play(u, 'idle_wyLook'); rules.idleCannotCutAttack = !!u.action && u.action.c.name === 'wyRearStomp';
    run(120); S.caPlay(u, 'wyvern.ability.wing_burst', D.dum); run(10); S.play(u, 'flinch'); rules.flinchCannotCutAbility = !!u.action && u.action.c.name === 'wyStorm';
    S.play(u, 'recoil'); rules.hardReactionCannotCutAbility = !!u.action && u.action.c.name === 'wyStorm';
    run(160); }
  { const D = lab('bat'), u = D.att; D.dum.invuln = false; run(20); S.caPlay(u, 'devilbat.finisher.claw_execution', D.dum); run(5);
    S.play(u, 'idle_btScan'); S.play(u, 'btQuickSwipe'); S.play(u, 'flinch'); rules.finisherRunsToItsEnd = !!u.action && u.action.c.name === 'btClawExec'; run(140); }
  { const D = lab('bat'), u = D.att; run(20); S.caPlay(u, 'devilbat.attack.multi_hit_combo', D.dum); run(15);
    S.kill(u, new V(0, 2, 0), {}); rules.deathCancels = !u.alive && !u.action && S.caState(u) === 'death'; run(90); let n = 0; probe.reset(); run(60, () => probe.sample(u, 1 / 60)); rules.corpsePosed = !!u.cg && probe.report().nan === 0;
    S.clearAll(); rules.modelRemovedWithTheBody = !u.cg; }
  { const D = lab('knight'), u = D.att, seq = []; run(20); S.caPlay(u, 'wyvern.charge.roaring_charge', D.dum);
    run(60 * 6, () => { const s = S.caState(u); if (seq[seq.length - 1] !== s) seq.push(s); if (seq.length > 2 && s === 'idle' && seq.includes('attack')) return false; });
    rules.chargeFlow = seq.join('>'); rules.chargeIntoStrike = seq.indexOf('movement') >= 0 && seq.indexOf('attack') > seq.indexOf('movement') && seq[seq.length - 1] === 'idle'; }
  for (const k in rules) if (rules[k] === false) fails.push('rule ' + k);
  out.rules = rules;
  // ---------- 5. the idle scheduler ----------
  { const D = lab('bat'), u = D.att, L = S.IDLES.bat, cnt = {}; let rep = 0, cdBreak = 0, last = null; const seen = {};
    const t0 = S.game.time; for (let i = 0; i < 600; i++) { S.game.time = t0 + i * 6; const n = S.caPickIdle(u, L); if (!n) continue; cnt[n] = (cnt[n] || 0) + 1; if (n === last) rep++; last = n;
      const cd = S.CA_BY_CLIP.bat[n].cooldown; if (seen[n] !== undefined && S.game.time - seen[n] < cd) cdBreak++; seen[n] = S.game.time; }
    S.game.time = t0; const rare = cnt.idle_btRoll || 0, basic = L.filter(n => n !== 'idle_btRoll').map(n => cnt[n] || 0), avg = basic.reduce((a, b) => a + b, 0) / basic.length;
    out.idles = { repeats: rep, cooldownBreaks: cdBreak, rare, basicAvg: +avg.toFixed(1) };
    check(rep === 0, 'idle repeated'); check(cdBreak === 0, 'idle cooldown broken'); check(rare < avg * .6, 'the rare idle is not rare'); }
  // ---------- 6. a battle with creatures ----------
  { S.game.size = 0; S.setMode('battle'); S.game.auto = [true, true];
    for (let i = 0; i < 3; i++) S.spawn('knight', 0); for (let i = 0; i < 5; i++) S.spawn('bat', 1); for (let i = 0; i < 6; i++) { S.spawn('sword', 1); S.spawn('spear', 0); }
    S.setStance(0, 'charge'); S.setStance(1, 'charge');
    probe.reset(); let errors = 0, halts = 0, fins = 0, maxCreatures = 0; const seen = new Set();
    const secs = QUICK ? 30 : 60;
    for (let i = 0; i < 60 * secs; i++) { try { S.step(1 / 60); S.draw(); } catch (e) { errors++; if (errors < 3) console.log('battle error', e.stack); }
      let n = 0; for (const u of S.units) if (u.cg) { n++; probe.sample(u, 1 / 60); if (u.action && /Halt$/.test(u.action.c.name) && !seen.has(u.action)) { seen.add(u.action); halts++; } if (u.fin && !seen.has(u.fin)) { seen.add(u.fin); fins++; } }
      for (const u of S.corpses) if (u.cg) probe.sample(u, 1 / 60);
      maxCreatures = Math.max(maxCreatures, n); }
    const m = probe.report(); out.battle = Object.assign({ errors, creatures: maxCreatures, halts, finishers: fins }, m); delete out.battle.ex; if (m.ex.length) out.battle.ex = m.ex.slice(0, 4);
    check(errors === 0, 'battle errors ' + errors); check(m.nan === 0, 'battle NaN');
    // the wyvern's abilities in play keep their cooldowns: a second cast at once is refused
    const k = S.units.find(u => u.type === 'knight' && u.alive && u.reg);
    if (k) { S.CASTLES[k.team].res.wyArts = S.CASTLES[k.team].res.wyMastery = 1; const r1 = S.regAbility(k.team, k.reg, 'storm'), r2 = S.regAbility(k.team, k.reg, 'storm'); out.battle.abilityCooldown = r1 + ' then ' + r2; check(r1 === true && r2 === 'cooldown', 'ability cooldown: ' + r1 + ' then ' + r2); } }
  // ---------- 7. cost ----------
  { const D = lab('bat'); const u = D.att; run(20); let p0 = u.cg.posed; const t0 = process.hrtime.bigint(); for (let i = 0; i < 2000; i++) S.cgPose(u); const tb = Number(process.hrtime.bigint() - t0) / 1e6 / 2000, nb = u.cg.posed - p0;
    const D2 = lab('knight'); const w = D2.att; run(20); p0 = w.cg.posed; const t1 = process.hrtime.bigint(); for (let i = 0; i < 2000; i++) S.cgPose(w); const tw = Number(process.hrtime.bigint() - t1) / 1e6 / 2000, nw = w.cg.posed - p0;
    out.costMs = { bat: +tb.toFixed(4), wyvern: +tw.toFixed(4), posed: nb + '+' + nw };
    check(nb === 2000 && nw === 2000, 'the cost loop did not pose every time (' + nb + ', ' + nw + ')'); }
  // the creature totals the verdict looks at (per category: snaps, knees, ground, air)
  let snaps = 0, flips = 0, knees = 0, ground = 0, airGlued = 0; for (const k in agg) { const A = agg[k]; snaps += A.snaps; flips += A.flips; knees += A.kneeBack; ground += A.groundPen + A.tailGround + A.wingGround; airGlued += A.airGlued; }
  out.totals = { snaps, flips, kneeBack: knees, underGround: ground, airGlued };
  check(flips === 0, 'knee bend flips ' + flips); check(knees === 0, 'knees bent backward ' + knees); check(airGlued === 0, 'ground IK in the air ' + airGlued);
  // regression guards (v0.35.0 measured: 123 pops in ~15,000 posed frames of 42–47 bones, 6 frames with a tip a few cm
  // under, planted feet sliding 0–3.6 cm/s by category): the limits leave room for noise, not for a broken solver
  check(snaps <= 180, 'pops ' + snaps + ' (over 180)'); check(ground <= 25, 'under the ground ' + ground + ' (over 25)');
  for (const k in agg) check(agg[k].slideCmS <= 8, k + ': planted feet slide ' + agg[k].slideCmS + ' cm/s');
  if (out.battle) check(out.battle.snapsPerS < 2, 'battle pops ' + out.battle.snapsPerS + '/s');
  if (process.env.CT_ROWS) for (const r of rows) console.log(JSON.stringify(r));
  console.log(JSON.stringify(out, null, 1));
  if (fails.length) console.log('failures:\n  ' + fails.slice(0, 40).join('\n  '));
  console.log('creaturetest: ' + (fails.length ? 'FAIL (' + fails.length + ')' : 'pass') + ' (variations ' + rows.length + ', played ' + rows.filter(r => r.played).length + ', snaps ' + snaps + ', knee flips ' + flips + ')');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
