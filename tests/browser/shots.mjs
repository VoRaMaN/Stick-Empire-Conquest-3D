// Quick looks at units in the running game (Playwright, Chromium): the Lab with a unit, a few camera angles.
// Usage: node tests/browser/shots.mjs [--types knight,bat] [--out dir] [--do "S.duelDo('atk')"] [--wait 1500] [--angles 0.35,1.6,3.2]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const WEB = path.resolve(ROOT, opt('--web', 'dist/web')), OUT = path.resolve(ROOT, opt('--out', 'tests/browser/out/shots')), PORT = +opt('--port', '8139');
const TYPES = opt('--types', 'knight,bat').split(','), DO = opt('--do', ''), WAIT = +opt('--wait', '1500'), ANG = opt('--angles', '0.35,1.6,3.3').split(',').map(Number), DIST = opt('--dist', '');
fs.mkdirSync(OUT, { recursive: true });
const server = spawn(process.execPath, [path.join(ROOT, 'tools/serve.mjs'), WEB, String(PORT)], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
try {
  for (let i = 0; i < 50; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/`); if (r.ok) break; } catch (e) {} await sleep(100); }
  browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = []; page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); }); page.on('pageerror', e => errs.push('page: ' + e.message));
  await page.goto(`http://127.0.0.1:${PORT}/?dev`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__SE3D && window.__SE3D.units, null, { timeout: 60000 });
  await page.evaluate(() => { const S = window.__SE3D; const b = document.querySelector('#uiPick .ui-opt[data-ui="pc"]'); if (b && !document.querySelector('#uiPick').hidden) b.click(); S.closeMenu(); S.settings.quality = 'low'; S.applyQuality(); window.SE3D_NO_DRAW = true; });
  await page.waitForFunction(() => window.__SE3D.CG.ready, null, { timeout: 60000 });
  console.log('models', await page.evaluate(() => JSON.stringify({ failed: window.__SE3D.CG.failed, kinds: Object.keys(window.__SE3D.CG.P) })));
  for (const t of TYPES) {
    await page.evaluate(t => { const S = window.__SE3D; S.game.duelSel = t; S.setMode('duel'); S.game.duel.dum.invuln = true; S.cam.follow = null; }, t);
    await sleep(800);
    if (DO) await page.evaluate(DO.startsWith('async') ? `(${DO})()` : `(()=>{ const S=window.__SE3D; ${DO}; })()`);
    await sleep(WAIT);
    for (const a of ANG) {
      await page.evaluate(([a, d]) => { const S = window.__SE3D; S.game.paused = true; S.cam.yaw = a; if (d) { S.cam.dist = S.cam.dGoal = +d; } window.SE3D_NO_DRAW = false; window.__f0 = S.draw.frame || 0; }, [a, DIST]);
      await page.waitForFunction(() => (window.__SE3D.draw.frame || 0) >= window.__f0 + 3, null, { timeout: 90000 });
      const file = path.join(OUT, `${t}_${String(a).replace('.', '_')}.png`); await page.screenshot({ path: file }); console.log('shot', file);
      await page.evaluate(() => { window.SE3D_NO_DRAW = true; window.__SE3D.game.paused = false; });
    }
    console.log(t, await page.evaluate(() => { const u = window.__SE3D.game.duel.att; return JSON.stringify({ cg: !!u.cg, posed: u.cg && u.cg.posed, vis: u.cg && u.cg.root.visible, action: u.action && u.action.c.name }); }));
  }
  console.log('console/page errors and warnings:', errs.length ? '\n  ' + errs.slice(0, 12).join('\n  ') : 0);
} finally { if (browser) await browser.close(); server.kill(); }
