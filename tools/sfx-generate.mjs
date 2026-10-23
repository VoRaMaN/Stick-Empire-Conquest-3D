#!/usr/bin/env node
// ElevenLabs sound-effect pipeline (development only, never at play time).
//
//   ELEVENLABS_API_KEY=... node tools/sfx-generate.mjs [--dry-run] [--only=id,id] [--force] [--limit=N]
//
// Reads assets/sfx-manifest.json and, for every sound whose recordings are missing from assets/sfx/, asks the
// ElevenLabs sound-generation API for `n` takes of its prompt and writes them as assets/sfx/<id>_<k>.mp3.
// The next `node build.mjs` embeds them and the game uses them instead of the synthesized or aliased sound.
// The key comes only from the environment; it is never written, logged, committed or sent anywhere else.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const MAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/sfx-manifest.json'), 'utf8'));
const OUT = path.join(ROOT, 'assets/sfx');
const args = process.argv.slice(2), flag = n => args.includes('--' + n), opt = n => (args.find(a => a.startsWith('--' + n + '=')) || '').split('=')[1];
const only = opt('only') ? new Set(opt('only').split(',')) : null, limit = +(opt('limit') || 1e9);
const have = id => fs.existsSync(path.join(OUT, id + '_1.mp3'));
const todo = Object.entries(MAN.sounds).filter(([id]) => (!only || only.has(id)) && (flag('force') || !have(id))).slice(0, limit);
console.log(`${Object.keys(MAN.sounds).length} sounds in the manifest, ${todo.length} to generate`);
if (flag('dry-run') || !todo.length) { for (const [id, s] of todo) console.log(`  ${id} [${s.cat}] ${s.dur}s ×${s.n}: ${s.prompt}`); process.exit(0); }
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('ELEVENLABS_API_KEY is not set: nothing generated. Set it in your shell (not in a committed file) and run again.'); process.exit(1); }
let ok = 0, fail = 0;
for (const [id, s] of todo) {
  for (let k = 1; k <= (s.n || 1); k++) {
    try {
      const r = await fetch(MAN.endpoint, { method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text: s.prompt, duration_seconds: Math.max(.5, Math.min(22, s.dur || 1)), prompt_influence: MAN.prompt_influence }) });
      if (!r.ok) { fail++; console.error(`  ${id}_${k}: HTTP ${r.status} ${(await r.text()).slice(0, 160)}`); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(path.join(OUT, `${id}_${k}.mp3`), buf); ok++; console.log(`  ${id}_${k}.mp3 ${(buf.length / 1024).toFixed(0)} KB`);
    } catch (e) { fail++; console.error(`  ${id}_${k}: ${e.message}`); }
  }
}
console.log(`generated ${ok} file(s), ${fail} failed. Run node build.mjs to embed them.`);
