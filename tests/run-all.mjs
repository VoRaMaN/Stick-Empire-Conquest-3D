// Runs the simulation regression suite against dist/artifact.html (node + three.js, no browser).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FILE = path.join(ROOT, 'dist/artifact.html');
const num = (out, re) => { const m = out.match(re); return m ? +m[1] : NaN; };
const TESTS = [
  ['harness', 'battle + every unit\'s finisher in the lab', o => [...o.matchAll(/nan (\d+)/g)].every(m => m[1] === '0') && /finisher started true/.test(o)],
  ['p3test', 'regiments, orders and tactics', o => /nan 0\s*$/.test(o.trim()) && /Charge!/.test(o)],
  ['camptest', 'campaign from start to victory', o => /campaign is won/.test(o) && /nan 0\s*$/.test(o.trim())],
  ['fxtest', 'arrows, blood, dropped gear, capes', o => /arrow NaN 0/.test(o)],
  ['finaudit', 'finisher blows land on the right body part', o => num(o, /misses >0\.12: (\d+)/) <= 6, { DBG: '' }],
  ['chgsim', 'charges trigger in a large battle', o => /nan 0/.test(o) && num(o, /distinct (\d+)/) >= 30],
  ['arrowtest', 'every arrow is drawn in an Epic battle', o => num(o, /frames missing arrows (\d+)/) === 0, { SZ: '2', SEC: '40' }],
  ['formcheck', 'big armies deploy in rows without overlapping', o => /size 2/.test(o) && !/dead [1-9]/.test(o.split('size 2')[1] || '')],
  ['finaudit', 'new units\' finisher blows land on the right body part', o => num(o, /misses >0\.12: (\d+)/) <= 2, { DBG: '', FA_TYPES: 'wizard,cleric,ninja,wing' }],
  ['ordertest', 'Wizard, Cleric, Ninja, Wing Archer: battle + every clip', o => /battle nan 0 missing abilities none/.test(o) && /lab failures 0 nan 0/.test(o)],
  ['castletest', 'castles: training, gates, research, garrison, AI', o => /reached the field 9\/9/.test(o) && /levels 1 1 1 garrison 2 -> 4/.test(o) && num(o, /garrison arrows (\d+)/) > 0 && !/enemy research none/.test(o) && /stuck in castle 0/.test(o) && /nan 0\s*$/.test(o.trim())],
  ['crawlertest', 'Hellcrawler: attacks, finishers, charges, gait, the Hellpit', o => /landed 12 missed none/.test(o) && /killed 10 failed none/.test(o) && /charges landed 10\/10/.test(o) && num(o, /climbed out of the pit (\d+)/) > 0 && /nan 0\s*$/.test(o.trim())],
  ['chaostest', 'Chaos Empire: Order vs Chaos castle battles, every Thrall, Dreadguard and Harvester clip', o => /battle nan 0 missing powers none/.test(o) && /lab failures 0 nan 0/.test(o) && (o.match(/thrall trips (\d+)/g)||[]).every(m => +m.split(' ').pop() > 0) && (o.match(/harvester melee (\d+)/g)||[]).some(m => +m.split(' ').pop() > 0)],
  ['houndtest', 'Hellhound and Cerberus: battle + every clip', o => /battle nan 0 missing powers none/.test(o) && /lab failures 0 nan 0/.test(o)],
  ['chaos2test', 'Chaos second wave: Bone Reaver, Bomber, Oracle, Grim Reaper, Hades', o => /battle nan 0 missing powers none/.test(o) && /lab failures 0 nan 0/.test(o)],
  ['finaudit', 'Chaos finisher blows land on the right body part', o => num(o, /misses >0\.12: (\d+)/) <= 2, { DBG: '', FA_TYPES: 'thrall,dread,harvester' }],
  ['cavtest', 'Knights, Hell Riders, generals: battle + every Knight clip', o => /battle nan 0 missing powers none/.test(o) && /lab failures 0 nan 0/.test(o)],
  ['wildtest', 'Wildlands battles both ways, the five story missions', o => /battle nan 0 missing powers none/.test(o) && /story failures 0 nan 0/.test(o)],
  ['determinism', 'original five units behave exactly as before', o => /hash 063d1435aea85231/.test(o)],
  ['nettest', 'online: replication, commands, 2v2, disconnects (no network)', o => /nettest: \d+ passed, 0 failed/.test(o)],
  ['rivertest', 'Riverlands: zones, banners, mines, obstacles, bounds', o => /rivertest: all passed/.test(o)],
  ['perf', '400-unit simulation cost (report only)', () => true]
];
let fails = 0; const t0 = Date.now();
for (const [name, what, ok, env] of TESTS) {
  const t = Date.now();
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tests', name + '.js'), FILE], { encoding: 'utf8', timeout: 600000, env: { ...process.env, ...(env || {}) } });
  const out = (r.stdout || '') + (r.stderr || '');
  const pass = r.status === 0 && ok(out);
  if (!pass) fails++;
  const tail = out.trim().split('\n').slice(-1)[0].slice(0, 110);
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name.padEnd(10)} ${what.padEnd(48)} ${((Date.now() - t) / 1000).toFixed(0).padStart(3)}s  ${tail}`);
  if (!pass) console.log(out.split('\n').slice(-15).join('\n'));
}
console.log(`\n${TESTS.length - fails}/${TESTS.length} passed in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
process.exit(fails ? 1 : 0);
