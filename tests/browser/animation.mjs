// Browser animation test (Playwright): serves dist/web, opens the game in development mode (?dev) in Chromium and drives
// the Lab through idle, walking, running, sprinting, turning, basic attacks, combinations, charge attacks, finishers,
// hit reactions and deaths for several soldiers while the real render loop runs. An in-page probe measures, every
// rendered frame, the defects the eye catches (rates per second, so a slow software-GL frame rate does not skew them):
//   flips     an elbow or knee bend reversing in one frame          kneeBack  a knee folded backward
//   pops      a joint accelerating > 1000 m/s² (×scale) vs. the hips  slide     a planted foot's drawn position moving
//   grip      a two-handed hold pulled more than 8 cm apart          rag       the jump at the death → ragdoll hand-over
// It also collects console errors and page errors, and saves screenshots with the debug overlay on.
// Usage: node tests/browser/animation.mjs [--web dist/web] [--out tests/browser/out] [--types sword,giant] [--quick]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const WEB = path.resolve(ROOT, opt('--web', 'dist/web')), OUT = path.resolve(ROOT, opt('--out', 'tests/browser/out')), PORT = +opt('--port', '8137');
const QUICK = argv.includes('--quick');
const TYPES = opt('--types', QUICK ? 'sword,giant' : 'sword,spear,giant,archer,ninja,dread,reaper').split(',');
fs.mkdirSync(OUT, { recursive: true });

const server = spawn(process.execPath, [path.join(ROOT, 'tools/serve.mjs'), WEB, String(PORT)], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser, failures = 0;
const log = (...a) => console.log(...a);
try {
  for (let i = 0; i < 50; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/`); if (r.ok) break; } catch (e) {} await sleep(100); }
  browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const consoleErrors = [], pageErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 4).map(l => l.trim()).join(' < ')));
  // trap non-finite Web Audio values (they throw inside the game loop) and record what the soldiers were doing
  await page.addInitScript(() => { const d = Object.getOwnPropertyDescriptor(AudioParam.prototype, 'value'); window.__nonFinite = [];
    Object.defineProperty(AudioParam.prototype, 'value', { configurable: true, get() { return d.get.call(this); }, set(v) {
      if (!isFinite(v) && window.__nonFinite.length < 5) { const S = window.__SE3D; const bad = S ? S.units.filter(u => u.feet && u.feet.some(f => !isFinite(f.pos.x + f.pos.y + f.pos.z) || !isFinite(f.t))).map(u => u.type + ' ' + JSON.stringify({ face: u.face, faceGoal: u.faceGoal, pos: u.pos, av: u.av, spd: u.spd, yaw: u.ps && u.ps.yaw, act: u.action && u.action.c.name, state: u.state, pelvis: u.j && u.j.pelvis, fwdW: u.fwdW, script: !!u.script, ai: u.ai, target: u.target && u.target.type, feet: u.feet.map(f => ({ t: f.t, dur: f.dur, pos: f.pos, from: f.from, to: f.to })) })) : [];
        window.__nonFinite.push({ v: String(v), stack: new Error().stack.split('\n').slice(2, 6).join(' < '), camDist: S && S.cam.dist, bad: bad.slice(0, 2) }); }
      d.set.call(this, v); } }); });
  await page.goto(`http://127.0.0.1:${PORT}/?dev`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__SE3D && window.__SE3D.units, null, { timeout: 60000 });
  await page.evaluate(() => { const S = window.__SE3D; try { const b = document.querySelector('#uiPick .ui-opt[data-ui="pc"]'); if (b && !document.querySelector('#uiPick').hidden) b.click(); } catch (e) {} S.closeMenu(); });
  // this machine renders WebGL in software (~1 fps at 1280×720): the simulation runs with drawing switched off (the game's
  // own SE3D_NO_DRAW hook) so its real render loop steps at native speed, and each screenshot draws a paused frame
  await page.evaluate(() => { const S = window.__SE3D; S.settings.quality = 'low'; S.applyQuality(); window.SE3D_NO_DRAW = true; });
  const dev = await page.evaluate(() => window.__SE3D.DEV_MODE);
  log('development mode:', dev);

  // ---------- the in-page probe ----------
  await page.evaluate(() => {
    const S = window.__SE3D, V3 = S.THREE.Vector3;
    const P = window.__AP = { on: false, m: null, prev: new Map(), last: performance.now(), frames: 0 };
    P.reset = () => { P.m = { frames: 0, sec: 0, contactSec: 0, slideCm: 0, flips: 0, kneeBack: 0, pops: 0, popMax: 0, grip: 0, gripFrames: 0, ex: [], gex: [] }; P.prev.clear(); };
    P.reset();
    const LIMBS = ['hL', 'hR', 'eL', 'eR', 'kL', 'kR', 'fL', 'fR', 'head', 'chest'];
    function sample(u, dt) {
      if (!u.alive || u.cr || u.rider || (u.fl && u.fl.air) || u.inCastle) { P.prev.delete(u); return; }
      const m = P.m, j = u.j, s = u.s; let Q = P.prev.get(u);
      if (Q && Math.hypot(u.pos.x - Q.px, u.pos.z - Q.pz) > .6) Q = null;
      Q = Q || { feet: [null, null], bend: {}, rel: null, rel2: null, dt2: dt };
      for (let i = 0; i < 2; i++) { const ft = u.feet[i], F = i ? j.fR : j.fL;
        const kick = i === 1 && (u.ps && u.ps.kick > .01 || u.aim && u.aim.by === 'foot');
        if (ft.t < 0 && !ft.air && !kick) { m.contactSec += dt; const pf = Q.feet[i]; if (pf && pf.x0 === ft.pos.x && pf.z0 === ft.pos.z) m.slideCm += Math.hypot(F.x - pf.x, F.z - pf.z) * 100; Q.feet[i] = { x0: ft.pos.x, z0: ft.pos.z, x: F.x, z: F.z }; } else Q.feet[i] = null;
        const hip = i ? j.hipR : j.hipL, K = i ? j.kR : j.kL, lx = F.x - hip.x, ly = F.y - hip.y, lz = F.z - hip.z, L = Math.hypot(lx, ly, lz) || 1;
        let kx = K.x - (hip.x + F.x) / 2, ky = K.y - (hip.y + F.y) / 2, kz = K.z - (hip.z + F.z) / 2; const d = (kx * lx + ky * ly + kz * lz) / L; kx -= lx / L * d; ky -= ly / L * d; kz -= lz / L * d;
        const b = Math.hypot(kx, ky, kz); if (b > .03 * s && (kx * u.fwdW.x + kz * u.fwdW.z) / b < -.35) { m.kneeBack++; if (m.ex.length < 10) m.ex.push('kneeBack ' + u.type + ' ' + (u.action ? u.action.c.name : 'loco')); } }
      for (const [nm, a0, mid, a1] of [['eR', 'sR', 'eR', 'hR'], ['eL', 'sL', 'eL', 'hL'], ['kR', 'hipR', 'kR', 'fR'], ['kL', 'hipL', 'kL', 'fL']]) {
        const A = j[a0], B = j[mid], C = j[a1], ax = C.x - A.x, ay = C.y - A.y, az = C.z - A.z, L = Math.hypot(ax, ay, az) || 1;
        let bx = B.x - (A.x + C.x) / 2, by = B.y - (A.y + C.y) / 2, bz = B.z - (A.z + C.z) / 2; const d = (bx * ax + by * ay + bz * az) / L; bx -= ax / L * d; by -= ay / L * d; bz -= az / L * d;
        const bl = Math.hypot(bx, by, bz), pb = Q.bend[nm];
        if (pb && bl > .04 * s && pb.l > .04 * s && (bx * pb.x + by * pb.y + bz * pb.z) / (bl * pb.l) < -.17) { m.flips++; if (m.ex.length < 10) m.ex.push('flip ' + nm + ' ' + u.type + ' ' + (u.action ? u.action.c.name : 'loco')); }
        Q.bend[nm] = { x: bx, y: by, z: bz, l: bl }; }
      if (u.grip > .5) { m.gripFrames++; const a = u.ps.R, b = u.ps.L, auth = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * s; const gap = j.hR.distanceTo(j.hL) - auth; if (gap > .08 * s) { m.grip++; if (m.gex.length < 6) m.gex.push(`grip ${(gap / s * 100).toFixed(0)}cm ${u.type} ${u.action ? u.action.c.name + '@' + u.action.t.toFixed(2) : 'loco'} reach ${u.ikS && u.ikS.L ? u.ikS.L.reach.toFixed(2) : '?'}`); } }
      const rel = {}; for (const k of LIMBS) rel[k] = j[k].clone().sub(j.pelvis);
      if (Q.rel && Q.rel2) { const t1 = dt, t0 = Q.dt2; let worst = 0, wk = '';
        for (const k of LIMBS) { const a = rel[k], b = Q.rel[k], c = Q.rel2[k];
          const ax = ((a.x - b.x) / t1 - (b.x - c.x) / t0) / ((t1 + t0) / 2), ay = ((a.y - b.y) / t1 - (b.y - c.y) / t0) / ((t1 + t0) / 2), az = ((a.z - b.z) / t1 - (b.z - c.z) / t0) / ((t1 + t0) / 2);
          const acc = Math.hypot(ax, ay, az); if (acc > 1000 * s && acc > worst) { worst = acc; wk = k; } }
        if (worst) { m.pops++; m.popMax = Math.max(m.popMax, worst); if (m.ex.length < 10) m.ex.push(`pop ${wk} ${worst.toFixed(0)}m/s² ${u.type} ${u.action ? u.action.c.name : 'loco'}`); } }
      Q.rel2 = Q.rel; Q.rel = rel; Q.dt2 = dt; Q.px = u.pos.x; Q.pz = u.pos.z; P.prev.set(u, Q);
    }
    function tick(now) { requestAnimationFrame(tick); const rdt = Math.min(.05, (now - P.last) / 1000); P.last = now; P.frames++;
      if (!P.on || S.game.paused) return; const dt = Math.min(rdt * (S.game.ts || 1), 1 / 30); if (!(dt > 0)) return; P.m.frames++; P.m.sec += dt;
      for (const u of S.units) sample(u, dt); }
    requestAnimationFrame(tick);
  });
  const shot = async name => {
    await page.evaluate(() => { window.__SE3D.game.paused = true; window.SE3D_NO_DRAW = false; window.__shotF = window.__SE3D.draw.frame || 0; });
    await page.waitForFunction(() => (window.__SE3D.draw.frame || 0) >= window.__shotF + 2, null, { timeout: 60000 });
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    await page.evaluate(() => { window.SE3D_NO_DRAW = true; window.__SE3D.game.paused = false; window.__AP.last = performance.now(); }); };
  const results = [];
  const scenario = async (name, fn, ms, shotAt) => {
    await page.evaluate(() => { window.__AP.reset(); window.__AP.on = true; });
    const t0 = Date.now(); await page.evaluate(fn.toString().startsWith('async') ? `(${fn})()` : `(${fn})()`);
    if (shotAt !== undefined) { await sleep(shotAt); await shot(name.replace(/[^a-z0-9]+/gi, '_')); await sleep(Math.max(0, ms - shotAt)); } else await sleep(ms);
    const m = await page.evaluate(() => { window.__AP.on = false; return window.__AP.m; });
    const r = { name, fps: +(m.frames / Math.max(.001, (Date.now() - t0) / 1000)).toFixed(1), sim_s: +m.sec.toFixed(1), flips: m.flips, knee_back: m.kneeBack,
      pops_per_s: +(m.pops / Math.max(.001, m.sec)).toFixed(2), slide_cm_per_s: +(m.slideCm / Math.max(.001, m.contactSec)).toFixed(2), grip_broken_pct: +(100 * m.grip / Math.max(1, m.gripFrames)).toFixed(1), ex: m.ex.slice(0, 4), ...(m.gex.length ? { grip_ex: m.gex.slice(0, 4) } : {}) };
    results.push(r); log(JSON.stringify(r));
  };
  // the follow-cam frames the Lab; the debug overlay draws over every fighter
  await page.evaluate(() => { const S = window.__SE3D; S.setMode('duel'); S.setAnimDebug && S.setAnimDebug(true); });
  for (const t of TYPES) {
    const pick = `(()=>{ const S=window.__SE3D; S.game.duelSel='${t}'; S.setMode('duel'); const D=S.game.duel; D.dum.invuln=true; S.cam.follow=null; })`;
    await page.evaluate(pick + '()');
    await scenario(`${t} idle`, () => { const S = window.__SE3D, a = S.game.duel.att; a.action = null; a.idleT = 99; }, QUICK ? 1500 : 2500, 800);
    await scenario(`${t} walk`, () => { const S = window.__SE3D, a = S.game.duel.att, V = S.THREE.Vector3; const dm = S.game.duel.dum; S.placeUnit(dm, dm.pos.x + 30, dm.pos.z, dm.face); a.script = { pts: [new V(a.pos.x - 8, 0, a.pos.z)], i: 0, speed: a.T.speed * .35 }; }, 2500, 1200);
    await scenario(`${t} run`, () => { const S = window.__SE3D, a = S.game.duel.att, V = S.THREE.Vector3; a.script = { pts: [new V(a.pos.x + 10, 0, a.pos.z)], i: 0, speed: a.T.speed }; }, 2200, 900);
    await scenario(`${t} turning`, () => { const S = window.__SE3D, a = S.game.duel.att, V = S.THREE.Vector3; const pts = []; for (let i = 0; i <= 16; i++) { const th = i / 16 * Math.PI * 2; pts.push(new V(a.pos.x + 2.5 * Math.sin(th), 0, a.pos.z + 2.5 - 2.5 * Math.cos(th))); } a.script = { pts, i: 1, speed: a.T.speed * .8 }; }, 3000, 1500);
    await page.evaluate(pick + '()');
    await scenario(`${t} sprint (charge)`, () => window.__SE3D.duelDo('charge'), 3200, 1500);
    await page.evaluate(pick + '()');
    await scenario(`${t} basic attacks`, async () => { const S = window.__SE3D; for (let i = 0; i < 3; i++) { S.duelDo('atk'); await new Promise(r => setTimeout(r, 1300)); } }, 300, 0);
    await scenario(`${t} combination`, async () => { const S = window.__SE3D, D = S.game.duel, L = (D.att.T.attacks || []).filter(n => S.CLIPS[D.att.type][n]);
      for (let i = 0; i < 4 && L.length; i++) { if (!D.att.alive) break; D.att.action = null; S.startAttack(D.att, D.dum, L[i % L.length]); const c = D.att.action && D.att.action.c; await new Promise(r => setTimeout(r, Math.max(150, ((c && (c.hitT || c.dur * .6)) || .4) * 1000 + 80))); } }, 1200, 0);
    await scenario(`${t} interrupted blow`, async () => { const S = window.__SE3D, D = S.game.duel; S.duelDo('atk'); await new Promise(r => setTimeout(r, 250)); if (D.att.alive && D.att.action) { S.play(D.att, 'recoil'); D.att.fwdScale = 1; } }, 1500, 120);
    await page.evaluate(pick + '()');
    await scenario(`${t} finisher`, () => window.__SE3D.duelDo('fin'), 4500, 1600);
    await page.evaluate(pick + '()');
    await scenario(`${t} hit reactions`, async () => { const S = window.__SE3D, a = S.game.duel.att; for (const r of ['flinch', 'stagger', 'block', 'dodge', 'knockdown']) { if (S.CLIPS[a.type][r]) { a.action = null; S.play(a, r); a.fwdScale = 1; } await new Promise(res => setTimeout(res, 650)); if (r === 'stagger') a.action = null; } }, 400, 0);
    await page.evaluate(pick + '()');
    const rag = await page.evaluate(async () => { const S = window.__SE3D, D = S.game.duel, a = D.att, V = S.THREE.Vector3; if (!S.damage) return { skipped: 'no damage hook in this build' };
      a.script = { pts: [new V(a.pos.x - 10, 0, a.pos.z)], i: 0, speed: a.T.speed }; await new Promise(r => setTimeout(r, 600));
      const before = {}; for (const k of ['pelvis', 'chest', 'head', 'hR', 'fL']) before[k] = a.j[k].clone(); const sw = a.j.sR.distanceTo(a.j.chest);
      S.game.paused = true; const keep = {}; for (const k of ['pelvis', 'chest', 'head', 'hR', 'fL']) keep[k] = a.j[k].clone(); Object.assign(before, keep);
      a.invuln = false; S.damage(a, 1e6, D.dum, new V(a.pos.x - D.dum.pos.x, 0, a.pos.z - D.dum.pos.z).normalize(), 1.2);
      S.game.paused = false; S.step(1 / 60); S.game.paused = false;
      let worst = 0; for (const k in before) worst = Math.max(worst, before[k].distanceTo(a.j[k]));
      return { dead: !a.alive, ragdoll: !!a.rag, jump_cm: +(worst * 100).toFixed(1), shoulder_kept_cm: +(a.j.sR.distanceTo(a.j.chest) * 100).toFixed(1), shoulder_alive_cm: +(sw * 100).toFixed(1) }; });
    await sleep(700); await shot(`${t}_death_ragdoll`);
    log(t, 'death → ragdoll', JSON.stringify(rag)); results.push({ name: `${t} death`, ...rag });
  }
  // a real battle for a minute of game time, every soldier probed, plus the frame rate with and without the overlay
  await page.evaluate(() => { const S = window.__SE3D; S.setAnimDebug && S.setAnimDebug(false); S.setMode('battle'); S.game.size = 1; S.resetBattle && S.resetBattle(); });
  await scenario('battle (overlay off)', () => {}, QUICK ? 8000 : 20000, QUICK ? 6000 : 15000);
  await page.evaluate(() => window.__SE3D.setAnimDebug && window.__SE3D.setAnimDebug(true));
  await scenario('battle (overlay on)', () => {}, 6000, 4000);
  await page.evaluate(() => window.__SE3D.setAnimDebug && window.__SE3D.setAnimDebug(false));
  const fps = await page.evaluate(async () => { window.SE3D_NO_DRAW = false; const f0 = window.__SE3D.draw.frame || 0, t0 = performance.now(); await new Promise(r => setTimeout(r, 8000)); const n = (window.__SE3D.draw.frame || 0) - f0; window.SE3D_NO_DRAW = true; return +(n / ((performance.now() - t0) / 1000)).toFixed(2); });
  log('rendered frames per second with drawing on (this machine, software WebGL, low quality):', fps);

  const bad = results.filter(r => r.flips > 0 || r.knee_back > 0 || r.grip_broken_pct > 5 || r.dead === false || r.ragdoll === false || (r.jump_cm !== undefined && r.jump_cm > 16) || (r.shoulder_kept_cm !== undefined && r.shoulder_alive_cm - r.shoulder_kept_cm > 1));
  const errs = consoleErrors.filter(e => !/favicon|404 \(Not Found\)|net::ERR|supabase|WebSocket|AudioContext/i.test(e));
  const nonFinite = await page.evaluate(() => window.__nonFinite);
  if (nonFinite.length) log('non-finite audio values:', JSON.stringify(nonFinite, null, 1).slice(0, 3000));
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ results, consoleErrors, pageErrors, nonFinite }, null, 1));
  log(`\nconsole errors: ${errs.length}${errs.length ? '\n  ' + errs.slice(0, 8).join('\n  ') : ''}`);
  log(`page errors: ${pageErrors.length}${pageErrors.length ? '\n  ' + pageErrors.slice(0, 8).join('\n  ') : ''}`);
  log(`scenarios with defects: ${bad.length}${bad.length ? '\n  ' + bad.map(b => b.name).join('\n  ') : ''}`);
  failures = bad.length + errs.length + pageErrors.length;
  log(failures ? 'animation browser test: FAIL' : 'animation browser test: all passed');
} finally {
  if (browser) await browser.close();
  server.kill();
}
process.exit(failures ? 1 : 0);
