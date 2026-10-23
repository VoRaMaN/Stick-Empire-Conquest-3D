// Animation / IK diagnostics: drives every stick-figure soldier through locomotion, turning, attacks, combos,
// interruptions, charges, finishers, hit reactions and deaths in the headless game, and measures the defects you
// would see on screen. Usage: node tests/animaudit.js dist/artifact.html [--types sword,spear] [--json out.json]
//   slide      a planted foot's drawn position moving (cm per second of contact) — visible foot skating
//   reach      the drawn foot/hand short of its IK target (the limb could not reach)
//   knee       a knee folding backward (against the leg's bend direction)
//   float/sink a planted foot drawn above / below the ground
//   pop        a joint jumping further in one frame than its limb could move (teleports, snaps)
//   grip       a two-handed hold (authored hands < 20 cm apart) pulled apart by the aim warp
//   rag        the jump between the last living pose and the first ragdoll frame
const { S, THREE, fs } = require('./animboot')(process.argv[2]);
const argv = process.argv.slice(3), opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const V3 = THREE.Vector3, DT = 1 / 60;
const LIMBS = ['hL', 'hR', 'eL', 'eR', 'kL', 'kR', 'fL', 'fR', 'head', 'chest', 'pelvis'];

// ---------- per-unit probe ----------
// a two-handed hold, by the game's own rule (21-skeleton twoHandGrip): empty off hand, fists together, not on the blade
function gripW(u, p) { const G = u.G; if (!p.R || !p.L || !p.wR || !G || !G.w || G.w.dropped || G.str || G.w2 || (G.o && !G.o.dropped)) return 0;
  const rx = p.L[0] - p.R[0], ry = p.L[1] - p.R[1], rz = p.L[2] - p.R[2], d = Math.hypot(rx, ry, rz); if (d > .23) return 0;
  const wl = Math.hypot(...p.wR) || 1, along = -(rx * p.wR[0] + ry * p.wR[1] + rz * p.wR[2]) / wl; return (d < .2 && along > -.05) ? 1 : 0; }
class Probe {
  constructor(label) { this.label = label; this.m = { frames: 0, contact: 0, slideCm: 0, slideFrames: 0, reachFoot: 0, reachFootMax: 0, reachHand: 0, reachHandMax: 0, knee: 0, float: 0, sink: 0, pops: 0, popMax: 0, flips: 0, gripFrames: 0, grip: 0, gripMax: 0, teleports: 0 }; this.prev = new Map(); this.popAt = []; this.flipAt = []; }
  sample(u) {
    if (!u.alive || !u.j || u.cr || u.fl && u.fl.air || u.rider || u.mount || u.inCastle || u.garrison) { this.prev.delete(u); return; }   // castle-hidden soldiers are not drawn
    const m = this.m, j = u.j, s = u.s; let P = this.prev.get(u);
    if (P && Math.hypot(u.pos.x - P.px, u.pos.z - P.pz) > .5) { m.teleports++; P = null; }   // spawned, placed, warped: not motion
    P = P || { feet: [null, null], j: null, j2: null, bend: {} };
    m.frames++;
    const where = () => `${u.type}:${u.action ? u.action.c.name + '@' + u.action.t.toFixed(2) : (u.chgW > .3 ? 'charge-run' : 'loco')}${u.fin ? ' fin' : ''}`;
    for (let i = 0; i < 2; i++) {
      const ft = u.feet[i], foot = i ? j.fR : j.fL, hip = i ? j.hipR : j.hipL, knee = i ? j.kR : j.kL;
      const kick = i === 1 && (u.ps && u.ps.kick > .01 || u.aim && u.aim.by === 'foot');
      if (ft.t < 0 && !ft.air && !kick) {
        m.contact++;
        const err = Math.hypot(foot.x - ft.pos.x, foot.z - ft.pos.z); if (err > .02 * s) { m.reachFoot++; m.reachFootMax = Math.max(m.reachFootMax, err); }
        const pf = P.feet[i];
        if (pf && pf.x0 === ft.pos.x && pf.z0 === ft.pos.z) { const d = Math.hypot(foot.x - pf.x, foot.z - pf.z); m.slideCm += d * 100; if (d > .005) m.slideFrames++; }
        P.feet[i] = { x0: ft.pos.x, z0: ft.pos.z, x: foot.x, z: foot.z };
        if (u.gy === undefined && !u.inCastle) { const h = foot.y - .045 * s - S.H(foot.x, foot.z); if (h > .03 * s) m.float++; if (h < -.03 * s) m.sink++; }
      } else P.feet[i] = null;
      const lx = foot.x - hip.x, ly = foot.y - hip.y, lz = foot.z - hip.z, L = Math.hypot(lx, ly, lz) || 1;
      let kx = knee.x - (hip.x + foot.x) / 2, ky = knee.y - (hip.y + foot.y) / 2, kz = knee.z - (hip.z + foot.z) / 2;
      const dd = (kx * lx + ky * ly + kz * lz) / L; kx -= lx / L * dd; ky -= ly / L * dd; kz -= lz / L * dd;
      const bend = Math.hypot(kx, ky, kz); if (bend > .03 * s && (kx * u.fwdW.x + kz * u.fwdW.z) / bend < -.35) { m.knee++; if ((this.kneeAt || (this.kneeAt = [])).length < 6) this.kneeAt.push(`${i ? 'R' : 'L'} ${where()} turnV ${(u.turnV || 0).toFixed(1)} yaw ${(u.ps && u.ps.yaw || 0).toFixed(2)} kick ${(u.ps && u.ps.kick || 0).toFixed(2)}`); }
    }
    // elbow / knee flips: the bend direction swinging more than 100 degrees in one frame while the limb is clearly bent
    for (const [nm, a0, mid, a1] of [['elbowR', 'sR', 'eR', 'hR'], ['elbowL', 'sL', 'eL', 'hL'], ['kneeR', 'hipR', 'kR', 'fR'], ['kneeL', 'hipL', 'kL', 'fL']]) {
      const A = j[a0], B = j[mid], C = j[a1], ax = C.x - A.x, ay = C.y - A.y, az = C.z - A.z, L = Math.hypot(ax, ay, az) || 1;
      let bx = B.x - (A.x + C.x) / 2, by = B.y - (A.y + C.y) / 2, bz = B.z - (A.z + C.z) / 2; const d = (bx * ax + by * ay + bz * az) / L; bx -= ax / L * d; by -= ay / L * d; bz -= az / L * d;
      const bl = Math.hypot(bx, by, bz), pb = P.bend[nm];
      if (pb && bl > .04 * s && pb.l > .04 * s && (bx * pb.x + by * pb.y + bz * pb.z) / (bl * pb.l) < -.17) { m.flips++; if (this.flipAt.length < 8) this.flipAt.push(`${nm} ${where()}`); }
      P.bend[nm] = { x: bx, y: by, z: bz, l: bl };
    }
    for (const sd of ['R', 'L']) { const err = u.hand[sd].distanceTo(j['h' + sd]); if (err > .02 * s) { m.reachHand++; m.reachHandMax = Math.max(m.reachHandMax, err); } }
    if (u.ps && u.ps.R && u.ps.L && gripW(u, u.ps) > .5) { const a = u.ps.R, b = u.ps.L, auth = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * s;
      { m.gripFrames++; const drift = j.hR.distanceTo(j.hL) - auth; if (drift > .08 * s) { m.grip++; m.gripMax = Math.max(m.gripMax, drift); if (this.gripAt === undefined) this.gripAt = `${where()} authored ${(auth * 100).toFixed(0)}cm drawn ${(j.hR.distanceTo(j.hL) * 100).toFixed(0)}cm hand-target gap ${(u.hand.R.distanceTo(u.hand.L) * 100).toFixed(0)}cm`; } } }
    // pops: a joint's acceleration (second difference relative to the pelvis) beyond anything a keyframed swing produces
    const rel = {}; for (const k of LIMBS) rel[k] = k === 'pelvis' ? j.pelvis.clone() : j[k].clone().sub(j.pelvis);
    if (P.j && P.j2) { let worst = 0, wk = '';
      for (const k of LIMBS) { const a = rel[k], b = P.j[k], c = P.j2[k]; const d = Math.hypot(a.x - 2 * b.x + c.x, a.y - 2 * b.y + c.y, a.z - 2 * b.z + c.z); if (d > .15 * s && d > worst) { worst = d; wk = k; } }
      if (worst) { m.pops++; if (worst > m.popMax) this.worstPop = `${wk} ${(worst * 100).toFixed(0)}cm ${where()}`; m.popMax = Math.max(m.popMax, worst); if (this.popAt.length < 8) this.popAt.push(`${wk} ${(worst * 100).toFixed(0)}cm ${where()}`); } }
    P.j2 = P.j; P.j = rel; P.px = u.pos.x; P.pz = u.pos.z;
    this.prev.set(u, P);
  }
  report() { const m = this.m, sec = m.contact * DT || 1;
    return { label: this.label, frames: m.frames, slide_cm_per_s: +(m.slideCm / sec).toFixed(2), slide_frames_pct: +(100 * m.slideFrames / Math.max(1, m.contact)).toFixed(2), foot_unreached_pct: +(100 * m.reachFoot / Math.max(1, m.contact)).toFixed(2), foot_unreached_max_cm: +(m.reachFootMax * 100).toFixed(1),
      hand_unreached_pct: +(100 * m.reachHand / Math.max(1, 2 * m.frames)).toFixed(2), hand_unreached_max_cm: +(m.reachHandMax * 100).toFixed(1), knee_backward_frames: m.knee, bend_flips: m.flips, float_pct: +(100 * m.float / Math.max(1, m.contact)).toFixed(2), sink_pct: +(100 * m.sink / Math.max(1, m.contact)).toFixed(2),
      pops: m.pops, pop_max_cm: +(m.popMax * 100).toFixed(0), grip_broken_pct: +(100 * m.grip / Math.max(1, m.gripFrames)).toFixed(1), grip_max_cm: +(m.gripMax * 100).toFixed(0), worst_pop: this.worstPop, pop_examples: this.popAt, flip_examples: this.flipAt, grip_example: this.gripAt, knee_examples: this.kneeAt }; }
}
const run = (frames, probe, list) => { for (let i = 0; i < frames; i++) { S.step(DT); if (probe) for (const u of (list ? list() : S.units)) probe.sample(u); } };
const out = [];
const onlyTypes = opt('--types'); const humanoid = t => { const T = S.TYPES[t]; return T && !T.crawler && !T.horse && !T.wyvern && !T.siege && !T.flyer && t !== 'bat'; };
const TYPES = (onlyTypes ? onlyTypes.split(',') : Object.keys(S.TYPES)).filter(humanoid);
S.setMode('duel');
// the Lab keeps its fighters until one dies: switching type needs a fresh duel
const pick = t => { S.game.duelSel = t; S.setMode('duel'); const a = S.game.duel && S.game.duel.att; if (!a || a.type !== t) throw new Error('lab did not switch to ' + t); return S.game.duel; };

// ---------- 1. locomotion: idle, walk, run, sprint, turning, stop-start ----------
const loco = new Probe('locomotion');
for (const t of TYPES) {
  pick(t); S.duelDo('idle'); const D = S.game.duel; D.dum.pos.x += 40; D.dum.ai = false;
  const a = D.att; a.action = null; a.idleT = 99; const x0 = a.pos.x, z0 = a.pos.z, sp = a.T.speed; const only = () => [a];
  run(90, loco, only);                                                   // idle
  for (const k of [.3, .6, 1, 1.45]) {                                   // walk, jog, run, sprint
    a.script = { pts: [new V3(x0 + 14, 0, z0)], i: 0, speed: sp * k }; run(150, loco, only); a.script = null; run(40, loco, only);
    S.placeUnit(a, x0, z0, Math.PI / 2); for (const ft of a.feet) { ft.pos.set(a.pos.x, S.H(a.pos.x, a.pos.z), a.pos.z); ft.t = -1; } run(20, loco, only); }
  const ring = []; for (let i = 0; i <= 16; i++) { const th = i / 16 * Math.PI * 2; ring.push(new V3(x0 + 3 * Math.sin(th), 0, z0 + 3 - 3 * Math.cos(th))); }
  a.script = { pts: ring, i: 0, speed: sp }; run(300, loco, only); a.script = null; run(60, loco, only);   // turning on a 3 m circle at full run
  for (let k = 0; k < 6; k++) { a.faceGoal = a.face + (k % 2 ? -2.6 : 2.6); run(40, loco, only); }                        // spinning on the spot
}
out.push(loco.report());

// ---------- 2. attacks, combos, interruptions ----------
const atk = new Probe('attacks'), combo = new Probe('combos (back to back)'), intr = new Probe('interrupted (recoil/flinch/stagger mid-blow)');
for (const t of TYPES) {
  pick(t);
  const L = (S.TYPES[t].attacks || []).filter(n => S.CLIPS[t][n]);
  for (let i = 0; i < L.length; i++) { S.duelDo('atk'); run(150, atk); }
  S.duelDo('atk'); run(10, combo);
  for (let i = 0; i < 6 && L.length; i++) { const D = S.game.duel; if (!D.att.alive || !D.dum.alive) break; D.dum.invuln = true; D.att.action = null; S.startAttack(D.att, D.dum, L[i % L.length]); const c = D.att.action && D.att.action.c; run(Math.max(6, Math.round(((c && (c.hitT || c.dur * .6)) || .4) * 60) + 4), combo); }
  run(60, combo);
  for (const r of ['recoil', 'flinch', 'stagger']) { const D = S.game.duel; S.duelDo('atk'); run(12, intr); const a = D.att; if (a.alive && a.action) { S.play(a, r); a.fwdScale = 1; } run(20, intr); if (r === 'stagger') a.action = null; run(70, intr); }
}
out.push(atk.report(), combo.report(), intr.report());

// ---------- 3. charges (sprint into a strike) ----------
const chg = new Probe('charges');
for (const t of TYPES) { pick(t); const n = (S.CHG[t] || []).length; for (let i = 0; i < Math.min(n, 10); i++) { S.duelDo('charge'); run(240, chg); } }
out.push(chg.report());

// ---------- 4. finishers ----------
const fin = new Probe('finishers');
for (const t of TYPES) { pick(t); const n = (S.FINS[t] || []).length; S.game.finI = -1; for (let i = 0; i < n; i++) { S.duelDo('fin'); run(330, fin); } }
out.push(fin.report());

// ---------- 5. hit reactions + deaths ----------
const hit = new Probe('hit reactions'); const rag = { deaths: 0, jumpMaxCm: 0, shoulderCollapseCm: 0, sinkFrames: 0, frames: 0, examples: [] };
for (const t of TYPES) {
  pick(t);
  for (const r of ['flinch', 'stagger', 'knockdown', 'block', 'parry', 'dodge', 'recoil']) { S.duelDo('idle'); const a = S.game.duel.att; a.action = null; run(10, hit); if (S.CLIPS[t][r]) { S.play(a, r); a.fwdScale = 1; } run(r === 'stagger' ? 60 : 90, hit); if (r === 'stagger') { a.action = null; run(40, hit); } }
  for (const state of ['idle', 'run', 'attack']) {
    S.duelDo('idle'); const D = S.game.duel, a = D.att; a.action = null; a.idleT = 99; a.ai = false;
    if (state === 'run') { a.script = { pts: [new V3(a.pos.x - 12, 0, a.pos.z)], i: 0, speed: a.T.speed }; run(45); }
    if (state === 'attack') { S.duelDo('atk'); run(14); }
    else run(10);
    const before = {}; for (const k of ['pelvis', 'chest', 'head', 'hL', 'hR', 'fL', 'fR', 'sL', 'sR']) before[k] = a.j[k].clone();
    const sw = a.j.sR.distanceTo(a.j.chest);
    a.invuln = false; if (D.dum.alive) D.dum.invuln = true;
    const dir = new V3(a.pos.x - D.dum.pos.x, 0, a.pos.z - D.dum.pos.z).normalize();
    S.damage(a, 1e6, D.dum, dir, 1.2);                                   // the killing-blow path: damage -> kill -> ragdoll
    S.step(DT); const after = a.j; let worst = 0, wk = '';
    for (const k of ['pelvis', 'chest', 'head', 'hL', 'hR', 'fL', 'fR']) { const d = before[k].distanceTo(after[k]); if (d > worst) { worst = d; wk = k; } }
    rag.deaths++; rag.jumpMaxCm = Math.max(rag.jumpMaxCm, worst * 100); rag.shoulderCollapseCm = Math.max(rag.shoulderCollapseCm, (sw - a.j.sR.distanceTo(a.j.chest)) * 100); rag.alive = (rag.alive || 0) + (a.alive ? 1 : 0);
    if (worst > .12 && rag.examples.length < 6) rag.examples.push(`${t}/${state}: ${wk} ${(worst * 100).toFixed(0)}cm`);
    for (let i = 0; i < 180; i++) { S.step(DT); if (a.rag) { rag.frames++; for (const k of ['pelvis', 'chest', 'head', 'fL', 'fR', 'hL', 'hR']) { if (a.j[k].y < S.H(a.j[k].x, a.j[k].z) - .02) { rag.sinkFrames++; break; } } } }
  }
}
out.push(hit.report());
out.push({ label: 'death -> ragdoll', deaths: rag.deaths, still_alive: rag.alive || 0, jump_max_cm: +rag.jumpMaxCm.toFixed(1), shoulder_collapse_cm: +rag.shoulderCollapseCm.toFixed(1), ragdoll_below_ground_frames: rag.sinkFrames, ragdoll_frames: rag.frames, examples: rag.examples });

// ---------- 6. a real battle ----------
S.setMode('battle'); S.game.size = 1; S.resetBattle && S.resetBattle(); const bat = new Probe('battle (60 s, every soldier)'); run(60 * 60, bat); out.push(bat.report());

let nan = 0; for (const L of [S.units, S.corpses]) for (const u of L) for (const k in u.j) { const v = u.j[k]; if (v && !isFinite(v.x + v.y + v.z)) nan++; }
for (const r of out) { const { label, pop_examples, flip_examples, grip_example, knee_examples, examples, worst_pop, ...rest } = r; console.log(label.padEnd(44), JSON.stringify(rest)); if (worst_pop) console.log('   worst pop:', worst_pop); if (pop_examples && pop_examples.length) console.log('   pops:', pop_examples.join(' | ')); if (flip_examples && flip_examples.length) console.log('   flips:', flip_examples.join(' | ')); if (grip_example) console.log('   grip:', grip_example); if (knee_examples && knee_examples.length) console.log('   knee:', knee_examples.join(' | ')); if (examples && examples.length) console.log('   ', examples.join(' | ')); }
console.log('types', TYPES.length, TYPES.join(','), 'nan', nan);
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify(out, null, 1));
// verdict (used by run-all): no elbow/knee flips or backward knees, two-handed holds kept, shoulders kept at death,
// planted feet that do not skate, and no NaN anywhere
const probes = out.filter(r => r.frames !== undefined), rag2 = out.find(r => r.label === 'death -> ragdoll'), bat2 = out.find(r => r.label.startsWith('battle'));
const fails = [];
const flips = probes.reduce((a, r) => a + r.bend_flips, 0), knees = probes.reduce((a, r) => a + r.knee_backward_frames, 0);
if (flips > 2) fails.push('bend flips ' + flips); if (knees > 2) fails.push('backward knees ' + knees);
for (const r of probes) if (r.grip_broken_pct > 3) fails.push(r.label + ' grips ' + r.grip_broken_pct + '%');
if (rag2.shoulder_collapse_cm > 1) fails.push('shoulders collapse at death ' + rag2.shoulder_collapse_cm + ' cm');
if (rag2.still_alive) fails.push('a soldier survived the killing blow');
if (bat2.slide_cm_per_s > 1) fails.push('feet skate ' + bat2.slide_cm_per_s + ' cm/s in battle');
if (nan) fails.push('NaN joints ' + nan);
console.log(fails.length ? 'animaudit: FAIL — ' + fails.join('; ') : 'animaudit: pass (flips ' + flips + ', backward knees ' + knees + ')');
process.exit(fails.length ? 1 : 0);

