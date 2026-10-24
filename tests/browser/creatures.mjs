// Browser test of the skinned Wyvern and Devil Bat (Playwright, Chromium): serves dist/web, opens the real game (?dev)
// and checks, in the browser's own engine with the assets fetched as players get them:
//   1. both GLB models load (GLTFLoader in the page), attach to their units, and draw: the Lab frame is rendered with
//      the creature and without it, and the pixels inside its screen box must differ (WebGL skinning really shows it)
//   2. size and facing in the world (head ahead of the pelvis along the unit's heading)
//   3. every one of the 100 variations (creature.category.variant) played through caPlay while the game's own loop runs
//      in real time; the in-page probe (tests/creatureprobe.js) measures every posed frame: NaN, pops, knee flips,
//      knees bent back, feet off target and sliding, tips under the ground, ground IK in the air
//   4. a battle with several creatures: errors, simulation frames per second, posing cost per creature, rendered fps
//   5. console and page errors throughout; screenshots with the animation debug overlay on
// This machine renders WebGL in software, so the simulation runs with drawing off (SE3D_NO_DRAW) and an in-page frame
// hook poses the creatures each frame (the same cgPose the draw calls); screenshots draw a paused frame.
// Usage: node tests/browser/creatures.mjs [--web dist/web] [--out tests/browser/out/creatures] [--quick]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const WEB = path.resolve(ROOT, opt('--web', 'dist/web')), OUT = path.resolve(ROOT, opt('--out', 'tests/browser/out/creatures')), PORT = +opt('--port', '8141');
const QUICK = argv.includes('--quick');
fs.mkdirSync(OUT, { recursive: true });
const server = spawn(process.execPath, [path.join(ROOT, 'tools/serve.mjs'), WEB, String(PORT)], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [], check = (c, m) => { if (!c) fails.push(m); return c; };
let browser;
try {
  for (let i = 0; i < 50; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/`); if (r.ok) break; } catch (e) {} await sleep(100); }
  browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 680 } });
  const consoleErrors = [], pageErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' < ')));
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${PORT}/?dev`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__SE3D && window.__SE3D.units, null, { timeout: 60000 });
  await page.evaluate(() => { const S = window.__SE3D; try { const b = document.querySelector('#uiPick .ui-opt[data-ui="pc"]'); if (b && !document.querySelector('#uiPick').hidden) b.click(); } catch (e) {} S.closeMenu(); S.settings.quality = 'low'; S.applyQuality(); });
  // ---------- 1. models ----------
  await page.evaluate(() => { const S = window.__SE3D; S.game.duelSel = 'bat'; S.setMode('duel'); });   // a creature in the Lab starts the load
  await page.waitForFunction(() => window.__SE3D.CG.ready || window.__SE3D.CG.failed, null, { timeout: 90000 });
  const models = await page.evaluate(() => { const C = window.__SE3D.CG; return { failed: C.failed || null, kinds: Object.fromEntries(Object.entries(C.P).map(([k, p]) => [k, { bones: p.B.length, tris: p.tris, meshes: p.geo.length }])) }; });
  console.log('models', JSON.stringify(models), 'loaded in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  check(!models.failed, 'model load failed: ' + models.failed);
  check(models.kinds.wyvern && models.kinds.wyvern.bones === 47, 'wyvern model'); check(models.kinds.devilbat && models.kinds.devilbat.bones === 42, 'devil bat model');
  // the probe, from the shared source
  const probeSrc = fs.readFileSync(path.join(ROOT, 'tests/creatureprobe.js'), 'utf8').replace(/^if \(typeof module.*$/m, '');
  await page.evaluate(src => { (0, eval)(src + '\nwindow.creatureProbe = creatureProbe;'); }, probeSrc);
  // the frame hook: drawing off, the creatures posed and measured each frame (and the time it takes)
  await page.evaluate(() => {
    const S = window.__SE3D, H = window.__CH = { probe: window.creatureProbe(S), on: false, last: performance.now(), frames: 0, poseMs: 0, posed: 0, err: null };
    window.SE3D_NO_DRAW = true;
    function tick(now) { requestAnimationFrame(tick); const dt = Math.min(.05, (now - H.last) / 1000); H.last = now; H.frames++;
      if (!window.SE3D_NO_DRAW) return;   // a real draw poses them itself
      try { const p0 = performance.now(); S.cgFrameStart();
        for (const L of [S.units, S.corpses]) for (const u of L) if (S.CG_KIND[u.type] && !u.fowH) { S.cgPose(u); H.posed++; }
        H.poseMs += performance.now() - p0;
        if (H.on) { for (const u of S.units) if (u.cg) H.probe.sample(u, dt); for (const u of S.corpses) if (u.cg) H.probe.sample(u, dt); } }
      catch (e) { H.err = H.err || (e.message + ' ' + String(e.stack).split('\n').slice(1, 3).join(' < ')); } }
    requestAnimationFrame(tick); });
  // draw one paused frame with the overlay on and save it
  const shot = async name => { await page.evaluate(() => { const S = window.__SE3D; S.game.paused = true; window.SE3D_NO_DRAW = false; S.setAnimDebug(true); });
    await sleep(400); await page.screenshot({ path: path.join(OUT, name + '.png') });
    await page.evaluate(() => { const S = window.__SE3D; S.setAnimDebug(false); window.SE3D_NO_DRAW = true; S.game.paused = false; window.__CH.last = performance.now(); }); };

  // ---------- 1b/2. drawn, size, facing ----------
  for (const ty of ['knight', 'bat']) {
    const r = await page.evaluate(async ty => {
      const S = window.__SE3D; S.game.duelSel = ty; S.setMode('duel'); S.game.duel.dum.invuln = true; S.cam.follow = S.game.duel.att;
      await new Promise(r => setTimeout(r, 900));
      const u = S.game.duel.att, I = u.cg; if (!I) return { attached: false };
      // the frame with the creature, and without it (hidden as fog of war hides it), read back from the WebGL canvas
      const R = S.renderer, cv = R.domElement, grab = () => { S.draw(); const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const g = c.getContext('2d'); g.drawImage(cv, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
      S.game.paused = true; const a = grab(); u.fowH = true; const rider = u.rider; const b = grab(); u.fowH = false; S.game.paused = false;
      // its screen box: the bones projected
      const V = S.THREE.Vector3; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const p of I.pw) { const v = p.clone().project(S.camera); const x = (v.x + 1) / 2 * cv.width, y = (1 - v.y) / 2 * cv.height; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      x0 = Math.max(0, x0 | 0); y0 = Math.max(0, y0 | 0); x1 = Math.min(cv.width - 1, x1 | 0); y1 = Math.min(cv.height - 1, y1 | 0);
      let diff = 0, area = 0; for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) { const i = (y * cv.width + x) * 4; area++; if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 30) diff++; }
      const hp = I.pw[I.P.I.head].clone().sub(I.pw[I.P.I.pelvis]), ahead = hp.x * u.fwdW.x + hp.z * u.fwdW.z;
      const mx = I.pw.reduce((m, p) => Math.max(m, p.y), -1e9) - S.H(u.pos.x, u.pos.z);
      return { attached: true, visible: I.root.visible, scale: +I.k.toFixed(3), ahead: +ahead.toFixed(2), height: +mx.toFixed(2), box: [x0, y0, x1, y1], drawnPx: diff, boxPx: area, meshes: I.root.children.filter(c => c.isSkinnedMesh).length };
    }, ty);
    console.log(ty, 'model in the Lab', JSON.stringify(r));
    check(r.attached, ty + ': no model attached'); check(r.visible, ty + ': model hidden'); check(r.ahead > .3, ty + ': not facing its heading');
    check(r.drawnPx > 150, ty + ': the model draws almost nothing on screen (' + r.drawnPx + ' px changed)');
    await shot(ty + '_lab');
  }

  // ---------- 3. the 100 variations in real time ----------
  const ids = await page.evaluate(q => { const S = window.__SE3D; let L = [...S.caList('wyvern'), ...S.caList('devilbat')]; if (q) L = L.filter((id, i) => i % 5 === 0); return L; }, QUICK);
  const rows = []; let n = 0;
  for (const id of ids) {
    const r = await page.evaluate(async id => {
      const S = window.__SE3D, H = window.__CH, d = S.CREATURE_ANIMS[id], ty = d.type;
      if (S.game.mode !== 'duel' || S.game.duelSel !== ty || !S.game.duel.att.alive) { S.game.duelSel = ty; S.setMode('duel'); await new Promise(r => setTimeout(r, 500)); }
      const D = S.game.duel, u = D.att; D.dum.invuln = d.cat !== 'finisher'; if (d.cat === 'finisher' && !D.dum.alive) { S.setMode('duel'); await new Promise(r => setTimeout(r, 500)); }
      u.idleT = 99; H.probe.reset(); H.on = true;
      const started = S.caPlay(u, id, S.game.duel.dum); let played = false; const t0 = performance.now(), lim = ((d.dur || 1) + (d.cat === 'charge' ? 5 : 1.5)) * 1000;
      while (performance.now() - t0 < lim) { await new Promise(r => setTimeout(r, 50)); if (u.action && u.action.c.name === d.clip) played = true; else if (played) break; }
      await new Promise(r => setTimeout(r, 300)); H.on = false;
      const m = H.probe.report(); const out = { id, started, played, ...m }; delete out.ex; out.ex = m.ex.slice(0, 2);
      if (d.cat === 'finisher' || !u.alive) S.setMode('duel');
      return out; }, id);
    rows.push(r); n++;
    if (n % 20 === 0) console.log('  variations', n, '/', ids.length);
    if (r.id === 'wyvern.attack.heavy_strike' || r.id === 'devilbat.attack.heavy_strike') await shot(r.id.replace(/\./g, '_'));
  }
  const tot = { played: 0, frames: 0, nan: 0, snaps: 0, flips: 0, kneeBack: 0, airGlued: 0, under: 0, slideW: 0, plant: 0 };
  for (const r of rows) { tot.played += r.played ? 1 : 0; tot.frames += r.frames; for (const k of ['nan', 'snaps', 'flips', 'kneeBack', 'airGlued']) tot[k] += r[k]; tot.under += r.groundPen + r.tailGround + r.wingGround; tot.plant += r.plantSec; tot.slideW += r.slideCmS * r.plantSec; }
  tot.slideCmS = +(tot.slideW / Math.max(1e-3, tot.plant)).toFixed(2); delete tot.slideW; tot.plant = +tot.plant.toFixed(1);
  console.log('variations', ids.length, JSON.stringify(tot));
  for (const r of rows) if (!r.played) console.log('  not played:', r.id, r.started);
  for (const r of rows) if (r.snaps || r.flips || r.nan) console.log('  ', r.id, 'pops', r.snaps, 'flips', r.flips, 'nan', r.nan, (r.ex || []).join(' | '));
  check(tot.played === ids.length, 'played ' + tot.played + ' of ' + ids.length);
  check(tot.nan === 0, 'NaN in a model'); check(tot.flips === 0, 'knee flips ' + tot.flips); check(tot.kneeBack === 0, 'knees bent back ' + tot.kneeBack); check(tot.airGlued === 0, 'ground IK in the air');
  check(tot.frames > 0 && tot.snaps / tot.frames < .02, 'pops ' + tot.snaps + ' in ' + tot.frames + ' frames');
  check(tot.slideCmS < 8, 'planted feet slide ' + tot.slideCmS + ' cm/s');

  // ---------- 4. a battle with several creatures ----------
  const bt = await page.evaluate(async q => {
    const S = window.__SE3D, H = window.__CH; S.game.size = 0; S.setMode('battle'); S.game.auto = [true, true];
    for (let i = 0; i < 4; i++) S.spawn('knight', 0); for (let i = 0; i < 6; i++) S.spawn('bat', 1); for (let i = 0; i < 6; i++) { S.spawn('sword', 1); S.spawn('spear', 0); }
    S.setStance(0, 'charge'); S.setStance(1, 'charge');
    H.probe.reset(); H.on = true; const f0 = H.frames, p0 = H.poseMs, n0 = H.posed, t0 = performance.now(), sim0 = S.game.time; let maxC = 0;
    while (performance.now() - t0 < (q ? 12000 : 25000)) { await new Promise(r => setTimeout(r, 250)); maxC = Math.max(maxC, S.units.filter(u => u.cg).length); }
    H.on = false; const sec = (performance.now() - t0) / 1000, m = H.probe.report();
    const out = { creaturesMax: maxC, simFps: +((H.frames - f0) / sec).toFixed(1), simSecPerSec: +((S.game.time - sim0) / sec).toFixed(2), poseMsPerCreature: +((H.poseMs - p0) / Math.max(1, H.posed - n0)).toFixed(3), nan: m.nan, pops: m.snaps, flips: m.flips, popsPerS: m.snapsPerS };
    // rendered frames per second with drawing on (software WebGL here: a floor, not the game's speed on a GPU)
    window.SE3D_NO_DRAW = false; const d0 = S.draw.frame || 0, r0 = performance.now(); await new Promise(r => setTimeout(r, 6000)); out.renderedFps = +(((S.draw.frame || 0) - d0) / ((performance.now() - r0) / 1000)).toFixed(2); window.SE3D_NO_DRAW = true;
    return out; }, QUICK);
  console.log('battle', JSON.stringify(bt));
  check(bt.creaturesMax >= 6, 'battle: creatures ' + bt.creaturesMax); check(bt.nan === 0, 'battle NaN'); check(bt.flips === 0, 'battle knee flips');
  await shot('battle');
  const herr = await page.evaluate(() => window.__CH.err);
  check(!herr, 'error while posing: ' + herr);
  check(pageErrors.length === 0, 'page errors: ' + pageErrors.slice(0, 3).join(' || '));
  check(consoleErrors.length === 0, 'console errors: ' + consoleErrors.slice(0, 3).join(' || '));
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ models, rows, totals: tot, battle: bt, consoleErrors, pageErrors }, null, 1));
} catch (e) { fails.push('crashed: ' + (e.stack || e)); }
finally { if (browser) await browser.close(); server.kill(); }
if (fails.length) console.log('failures:\n  ' + fails.join('\n  '));
console.log('creatures browser test: ' + (fails.length ? 'FAIL (' + fails.length + ')' : 'pass'));
process.exit(fails.length ? 1 : 0);
