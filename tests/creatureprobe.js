// Measures the skinned creatures' poses frame by frame (the model's own bones, as 27l posed them). Shared by the Node
// test (tests/creaturetest.js) and the browser test (tests/browser/creatures.mjs, which injects this function's source).
//   nan        a bone with a non-finite rotation or position
//   snap       a pop: one frame in which a bone turns by over 0.6 rad (36 rad/s at 60 fps) and by over 2.5x as much as in
//              the frames before and after it (plus 6 rad/s) — a flip or a jump, not a fast motion (a lunge, a wingbeat),
//              which turns as fast for several frames; the root's spin excluded; a teleport (placeUnit) starts over
//   slide      a planted toe moving along the ground while its plant holds (cm/s of planted time)
//   footErr    a planted toe's distance from its IK target (cm); groundPen: a toe below the ground
//   kneeBack   a knee bent behind the leg (the creatures' knees bend forward); flips: a bend reversing in a frame
//   tailGround / wingGround   a tail segment or a wing tip under the ground
//   airGlued   a flying creature well off the ground (hips over 1.6 m) with its toes on it (ground IK applied in the air)
//   rootDrift  the model's pelvis away from the game's pelvis (the model adding motion of its own) beyond the hips'
//              sinking where its legs are shorter than the rig's (I.dy, straight down)
function creatureProbe(S) {
  const V = S.THREE.Vector3, prev = new Map(), _a = new V(), _b = new V(), _c = new V(), _d = new V();
  const fresh = () => ({ frames: 0, sec: 0, nan: 0, snaps: 0, snapMax: 0, wMax: 0, plantSec: 0, slideCm: 0, footErrCm: 0, footN: 0, footMaxCm: 0, groundPen: 0, kneeBack: 0, flips: 0,
    tailGround: 0, wingGround: 0, airGlued: 0, airN: 0, rootDrift: 0, ex: [] });
  let m = fresh();
  const note = s => { if (m.ex.length < 8) m.ex.push(s); };
  function sample(u, dt) {
    const I = u.cg; if (!I || !I.root.visible) return;
    const P = I.P, H = S.H, k = I.k, pel = I.pw[P.I.pelvis];
    let Q = prev.get(u);
    if (Q && Q.pel.distanceTo(pel) > 1.5) Q = null;   // teleported: a new start
    if (!Q) Q = { q: I.qw.map(q => q.clone()), w: new Float64Array(I.qw.length), w2: new Float64Array(I.qw.length), toe: [null, null], bend: [null, null], posed: -1, n: 0, pel: pel.clone() };
    if (I.posed === Q.posed) return;   // not posed this frame (off screen)
    m.frames++; m.sec += dt;
    const nm = u.action ? u.action.c.name : 'loco';
    for (let i = 0; i < I.qw.length; i++) { const q = I.qw[i], p = I.pw[i]; if (!isFinite(q.x + q.y + q.z + q.w + p.x + p.y + p.z)) { m.nan++; note('nan ' + P.B[i].name + ' ' + nm); break; } }
    const known = Q.n++ >= 2;   // two frames in: the turn rates before are known
    if (Q.posed >= 0 && dt > 0) for (let i = 0; i < I.qw.length; i++) { if (i === P.root) continue;
      // the frame before this one is judged now that the frame after it is known
      const dq = Math.min(1, Math.abs(I.qw[i].dot(Q.q[i]))), ang = 2 * Math.acos(dq), w = ang / dt, w1 = Q.w[i], w0 = Q.w2[i]; Q.w2[i] = w1; Q.w[i] = w;
      m.wMax = Math.max(m.wMax, w);
      if (known && Q.n > 3 && w1 > 36 && w1 > 2.5 * Math.max(w0, w) + 6) { m.snaps++; m.snapMax = Math.max(m.snapMax, w1); note('snap ' + P.B[i].name + ' ' + w0.toFixed(0) + '→' + w1.toFixed(0) + '→' + w.toFixed(0) + 'rad/s ' + u.type + ' ' + nm); } }
    // the model's pelvis sits on the game's: no motion of its own
    _d.copy(u.j.pelvis); _d.y -= I.dyA || 0; const pd = pel.distanceTo(_d); if (pd > .005) { m.rootDrift++; note('root drift ' + (pd * 100).toFixed(1) + 'cm ' + nm); }
    const air = !!(u.fl && u.fl.air) || !!(u.wy && u.wy.air) || (u.ps && u.ps.jump > .04);
    if (u.alive) for (let s = 0; s < 2; s++) { const L = P.legs[s], gi = L.gs === 'R' ? 1 : 0, ft = u.feet[gi], toe = I.pw[L.to];
      // knee: the bend's direction from the hip-hock line, in front of the body
      const hip = I.pw[L.th], kn = I.pw[L.sh], hk = I.pw[L.ft];
      _a.subVectors(hk, hip); const al = _a.length() || 1; _b.subVectors(kn, hip); _b.addScaledVector(_a, -_b.dot(_a) / (al * al)); const bl = _b.length();
      if (bl > .03 * k) { _c.copy(_b).multiplyScalar(1 / bl); const fw = _c.x * u.fwdW.x + _c.z * u.fwdW.z;
        if (fw < -.35 && !air) { m.kneeBack++; note('kneeBack ' + u.type + ' ' + nm); }
        const pb = Q.bend[s]; if (pb && _c.dot(pb) < -.17) { m.flips++; note('flip knee ' + u.type + ' ' + nm); }
        Q.bend[s] = _c.clone(); }
      const g = H(toe.x, toe.z);
      if (air) { if (u.fl && u.fl.air && pel.y - H(pel.x, pel.z) > 1.6 * k) { m.airN++; if (toe.y - g < .12 * k) { m.airGlued++; note('air toe on ground ' + nm); } } Q.toe[s] = null; continue; }
      if (toe.y < g - .03 * k) { m.groundPen++; note('toe under ground ' + ((g - toe.y) * 100).toFixed(0) + 'cm ' + nm); }
      const kick = u.ps && Math.abs(u.ps.kick || 0) > .05;
      // planted: the game's foot down (and, for a model taking steps of its own, none of those under way); the plant's
      // place: the model's own foot point (fs.p) where it has one, else the game's
      const fs = I.fs && I.fs[s] && I.fs[s].init ? I.fs[s] : null, at = fs ? fs.p : ft && ft.pos;
      if (ft && ft.t < 0 && !kick && !(fs && (fs.t >= 0 || fs.swOn))) { m.plantSec += dt;
        const e = toe.distanceTo(I.toeT[s]) * 100; m.footErrCm += e; m.footN++; m.footMaxCm = Math.max(m.footMaxCm, e); if (e > 8) note('foot off target ' + e.toFixed(0) + 'cm ' + nm);
        const pt = Q.toe[s]; if (pt && pt.px === at.x && pt.pz === at.z) m.slideCm += Math.hypot(toe.x - pt.x, toe.z - pt.z) * 100;
        Q.toe[s] = { px: at.x, pz: at.z, x: toe.x, z: toe.z }; } else Q.toe[s] = null; }
    if (u.alive) {
      for (const i of P.tail) { const p = I.pw[i]; if (p.y < H(p.x, p.z) - .05 * k) { m.tailGround++; note('tail under ground ' + nm); break; } }
      const W = P.wings || P.arms;
      for (const w of W) for (const b of w.fb) { const p = I.pw[b]; _d.copy(p); if (p.y < H(p.x, p.z) - .08 * k) { m.wingGround++; note('wing tip under ground ' + P.B[b].name + ' ' + nm); break; } } }
    Q.q.forEach((q, i) => q.copy(I.qw[i])); Q.posed = I.posed; Q.pel.copy(pel); prev.set(u, Q);
  }
  function report() {
    const r = Object.assign({}, m); r.slideCmS = +(m.slideCm / Math.max(1e-3, m.plantSec)).toFixed(2); r.footErrCm = +(m.footErrCm / Math.max(1, m.footN)).toFixed(2); r.footMaxCm = +m.footMaxCm.toFixed(1);
    r.snapsPerS = +(m.snaps / Math.max(1e-3, m.sec)).toFixed(2); r.snapMax = +m.snapMax.toFixed(0); r.wMax = +m.wMax.toFixed(0); r.sec = +m.sec.toFixed(1); delete r.slideCm; return r; }
  return { sample, report, reset: () => { m = fresh(); prev.clear(); } };
}
if (typeof module !== 'undefined') module.exports = creatureProbe;
